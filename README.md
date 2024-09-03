# Function to retrieve user permissions based on userLookupId
def get_user_permissions(userLookupId):
    user_permissions = permission_df[permission_df["UserLookupId"] == userLookupId]
    permission_str = user_permissions.iloc[0]["Permissions"]
    permissions = permission_str.split(";")

    return permissions


# Function to format chat history for processing
def format_chat_history(chatHistory):
    return "\n".join(
        [f"Human: {chat['user']}\nAssistant: {chat['ai']}" for chat in chatHistory]
    )


# Function to check if a string looks like a base64 encoded string
def looks_like_base64(sb):
    try:
        return base64.b64encode(base64.b64decode(sb)) == sb.encode()
    except Exception:
        return False


# Resize an image encoded as a Base64 string
def resize_base64_image(base64_string, size=(128, 128)):
    img_data = base64.b64decode(base64_string)
    img = Image.open(io.BytesIO(img_data))
    resized_img = img.resize(size, Image.LANCZOS)
    buffered = io.BytesIO()
    resized_img.save(buffered, format=img.format)
    return base64.b64encode(buffered.getvalue()).decode("utf-8")


# Function to process metadata, particularly extracting file names
def process_metadata(metadata):
    metadata = re.sub(r"'", r'"', metadata)
    pattern = r'.*?"FileLeafRef"\s*:\s*"([^"]*)"'
    match = re.search(pattern, metadata, re.DOTALL)

    if match:
        return match.group(1)
    else:
        return None


# Split base64-encoded images, texts, and metadata
def split_image_text_types(docs):
    global sources, count_restriction
    count_restriction = 0
    texts = []
    summary = []
    b64_images = []
    for doc in docs:
        if isinstance(doc, Document):
            file_permission = doc.metadata["DeliverablePermissions"]
            file_permission_list = file_permission.split(";")
            if not file_permission_list or any(
                element in file_permission_list for element in user_permissions
            ):
                doc_content = json.loads(doc.page_content)
                link = doc.metadata["source"]
                slide_number = doc.metadata.get("slide_number", "")

                metadata = doc.metadata.get("deliverables_list_metadata")
                title = process_metadata(metadata)
                _, ext = os.path.splitext(title)

                if ext.lower() in [".pdf", ".doc", ".docx"]:
                    slide_number = slide_number.replace("slide_", "Page ")
                else:
                    slide_number = slide_number.replace("slide_", "Slide ")

                existing_key = next(
                    (k for k in sources.keys() if k.startswith(title)), None
                )

                if existing_key:
                    new_key = existing_key + f", {slide_number}"
                    sources[new_key] = sources.pop(existing_key)
                else:
                    new_key = f"{title} {'-' if slide_number else ''} {slide_number}"
                    sources[new_key] = link

                if looks_like_base64(doc_content["content"]):
                    resized_image = resize_base64_image(
                        doc_content["content"], size=(512, 512)
                    )
                    b64_images.append(resized_image)
                    summary.append(doc_content["summary"])
                else:
                    texts.append(doc_content["content"])
            else:
                count_restriction += 1
                continue

    return {"images": b64_images, "texts": texts, "summary": summary}


# Join the context into a single string
def img_prompt_func(data_dict):
    formatted_summary = ""
    reason = data_dict["context"]["reason"]
    type_of_doc = data_dict["context"]["type_of_doc"]
    formatted_texts = "\n".join(data_dict["context"]["texts"])
    chatHistory = format_chat_history(data_dict["context"]["chatHistory"])

    messages = []

    if data_dict["context"]["image_present"] == "Yes":
        if data_dict["context"]["images"]:
            for image in data_dict["context"]["images"]:
                image_message = {
                    "type": "image_url",
                    "image_url": {"url": f"data:image/jpeg;base64,{image}"},
                }
                messages.append(image_message)

    else:
        formatted_summary = "\n".join(data_dict["context"]["summary"])

    if type_of_doc == "normal":
        text_message = {
            "type": "text",
            "text": (
                
                "Never answer from your own knowledge source, always asnwer from the provided context."
                f"User's question: {data_dict.get('question', 'No question provided')}\n\n"
                f"{'Last Time the answer was not good and the reason shared by user is :' if reason else ''}{reason if reason else ''}{' .Generate Accordingly' if reason else '' }"
                f"{'Original content: ' if formatted_texts else ''}{formatted_texts if formatted_texts else ''}\n"
                f"{'Summary content: ' if formatted_summary else ''}{formatted_summary if formatted_summary else ''}\n\n"
                f"{'Previous conversation: ' if chatHistory else ''}{chatHistory if chatHistory else ''}\n\n"
            ),
        }
    else:
        text_message = {
            "type": "text",
            "text": (
               
                "Base your response solely on the provided content.\n"
                "Maintain context from previous conversations.\n"
                "If you don't know the answer to any question, simply say 'I am not able to provide a response as it is not there in the context'.\n\n"
                "Input:\n"
                f"User's question: {data_dict.get('question', 'No question provided')}\n"
                f"{'Last Time the answer was not good and the reason shared by user is :' if reason else ''}{reason if reason else ''}{' .Generate Accordingly' if reason else '' }\n"
                f"{'Original content: ' if formatted_texts else ''}{formatted_texts if formatted_texts else ''}\n"
                f"{'Summary content: ' if formatted_summary else ''}{formatted_summary if formatted_summary else ''}\n"
                f"{'Previous conversation: ' if chatHistory else ''}{chatHistory if chatHistory else ''}\n\n"
                "Output:\n"
                "Summary : A comprehensive and accurate response to the user's question, presented in a clear and concise format with appropriate headings, subheadings, bullet points, and spacing.\n\n"
            ),
        }

    messages.append(text_message)

    return [HumanMessage(content=messages)]


# Multi-modal RAG chain creation
def multi_modal_rag_chain_source(
    retriever, llm_to_use, image, filters, chatHistory, reason, type_of_doc
):
    def combined_context(data_dict):
        context = {
            "texts": data_dict.get("texts", []),
            "images": data_dict.get("images", []),
            "summary": data_dict.get("summary", []),
            "image_present": image,
            "filters": filters,
            "chatHistory": chatHistory,
            "reason": reason,
            "type_of_doc": type_of_doc,
        }
        return context

    chain = (
        {
            "context": retriever
            | RunnableLambda(split_image_text_types)
            | RunnableLambda(combined_context),
            "question": RunnablePassthrough(),
        }
        | RunnableLambda(img_prompt_func)
        | llm_to_use
        | StrOutputParser()
    )

    return chain


# Function to create a new title for the chat thread
def create_new_title(question):

    prompt_text = (
        "Given the following question, create a concise and informative title that accuratelt reflects the content and MAKE SURE TO ANSWER IN JUST 4 WORDS. Just give the title name without any special characters.\n"
        "{element}"
    )

    prompt = ChatPromptTemplate.from_template(prompt_text)
    new_title = {"element": lambda x: x} | prompt | llm_gpt
    response = new_title.invoke(question)

    return response.content


# Function to update the chat thread by adding or removing messages from the chat thread
def update_chat(message: Message, ai_text: str, chat_id: str, flag: bool, sources=None):
    message_id = None

    if message.regenerate == "Yes" or flag == True:
        collection_chat.update_one(
            {"_id": ObjectId(chat_id)},
            {
                "$pop": {"chats": 1},
                "$set": {"updatedAt": datetime.utcnow()},
            },
        )

    if message.feedbackRegenerate == "Yes":
        chat = collection_chat.find_one({"_id": ObjectId(chat_id)})
        if chat and "chats" in chat and len(chat["chats"]) > 0:
            last_chat_index = len(chat["chats"]) - 1
            collection_chat.update_one(
                {
                    "_id": ObjectId(chat_id),
                    f"chats.{last_chat_index}.flag": {"$exists": False},
                },
                {
                    "$set": {
                        f"chats.{last_chat_index}.flag": True,
                        "updatedAt": datetime.utcnow(),
                    }
                },
            )

    new_chat = {
        "_id": ObjectId(),
        "user": message.question,
        "ai": ai_text,
        "sources": sources,
    }

    update_fields = {
        "$push": {"chats": new_chat},
        "$set": {
            "updatedAt": datetime.utcnow(),
            "filtersMetadata": (
                message.filtersMetadata if message.filtersMetadata else []
            ),
            "isGPT": message.isGPT,
        },
    }

    collection_chat.update_one({"_id": ObjectId(chat_id)}, update_fields)

    chat = collection_chat.find_one({"_id": ObjectId(chat_id)})

    if chat and "chats" in chat:
        message_id = chat["chats"][-1]["_id"]

    return message_id


# Function to create filters to filter chromaDB collection
def create_search_kwargs(filters):
    if len(filters) == 1:
        filter_condition = {"Title": filters[0]}
    elif isinstance(filters, list):
        or_conditions = [{"Title": v} for v in filters]
        filter_condition = {"$or": or_conditions}

    search_kwargs = {"filter": filter_condition}

    return search_kwargs


# Function to identify the user question intent
def question_intent(question, chatHistory):
    formatted_chat_history = format_chat_history(chatHistory)

    prompt_text = """
        AI Assistant Instructions

       
        Previous Conversation: "{chat_history}"
        
        Please respond with the appropriate keyword based on the analysis of the user query:
        - "normal_rag"
        - "summary_rag"
        - "direct_response"
        
        """

    prompt = ChatPromptTemplate.from_template(prompt_text)

    chain = (
        {"chat_history": lambda _: formatted_chat_history, "question": lambda x: x}
        | prompt
        | llm_gpt
    )

    intent = chain.invoke(question)

    return intent.content


# Function to form a standalone question based on the user chat history
def standalone_question(question, chatHistory):
    formatted_chat_history = format_chat_history(chatHistory)

    prompt_text = """
           urn it as is. Don't provide anything else, just provide the question\
            Chat History\
            {chat_history}
            User Question : \
            {question}
        """

    prompt = ChatPromptTemplate.from_template(prompt_text)

    chain = (
        {"chat_history": lambda _: formatted_chat_history, "question": lambda x: x}
        | prompt
        | llm_gpt
    )

    new_question = chain.invoke(question)

    return new_question.content


# Function to create a new chat thread
def create_new_title_chat(message: Message):
    title = create_new_title(message.question)
    new_chat = {
        "userEmailId": message.userEmailId,
        "title": title,
        "chats": [
            {
                "_id": ObjectId(),
                "user": message.question,
            }
        ],
        "filtersMetadata": (message.filtersMetadata if message.filtersMetadata else []),
        "isGPT": message.isGPT,
        "createdAt": datetime.utcnow(),
        "updatedAt": datetime.utcnow(),
    }

    inserted_chat = collection_chat.insert_one(new_chat)
    chat_id = inserted_chat.inserted_id

    return chat_id
