async def content_generator(
    question: str,
    userEmailId: str,
    llm: AzureChatOpenAI,
    message: Message,
    collection_chat: AsyncIOMotorCollection,
    type_of_store: str,
    request: Request,
):
    try:
        ai_text = ""
        chat_id = None
        flag = False

        if not message.chatId:
            chat_id = await create_new_title_chat(
                message, userEmailId, collection_chat, llm
            )
            flag = True
            yield json.dumps({"type": "chatId", "content": str(chat_id)})

        search_kwargs = {}

        if message.anonymousFilter:
            search_kwargs = create_search_kwargs(message.anonymousFilter)
        elif message.filters:
            search_kwargs = create_search_kwargs(message.filters)

        vectorstore = Chroma(
            collection_name=(
                f"EmailAssistant_Summary_{userEmailId.split('@')[0]}"
                if type_of_store == "summary_rag"
                else f"EmailAssistant_{userEmailId.split('@')[0]}"
            ),
            client=CHROMA_CLIENT,
            embedding_function=embeddings,
        )

        retriever = vectorstore.as_retriever(search_kwargs=search_kwargs)

        contextualize_q_prompt = ChatPromptTemplate.from_messages(
            [
                ("system", prompts["contextualize_q_system_prompt"]),
                MessagesPlaceholder("chat_history"),
                ("human", "{input}"),
            ]
        )
        history_aware_retriever = create_history_aware_retriever(
            llm, retriever, contextualize_q_prompt
        )

        qa_prompt = ChatPromptTemplate.from_messages(
            [
                ("system", prompts["contextualize_q_system_prompt"]),
                MessagesPlaceholder("chat_history"),
                ("human", "{input}"),
            ]
        )
        question_answer_chain = create_stuff_documents_chain(llm, qa_prompt)

        rag_chain = create_retrieval_chain(
            history_aware_retriever, question_answer_chain
        )

        chat_history = (
            build_chat_history(message.chatHistory) if message.chatHistory else []
        )

        chain_input = {"chat_history": chat_history, "input": question}

        async for chunk in rag_chain.astream(chain_input):
            if "answer" in chunk:
                ai_text += chunk
                yield json.dumps({"type": "text", "content": chunk})

        if not await request.is_disconnected():
            message_id = await update_chat(
                message,
                ai_text,
                str(chat_id) if chat_id else message.chatId,
                flag,
                collection_chat,
            )

            yield json.dumps({"type": "messageId", "content": str(message_id)})

    except Exception as e:
        logger.error(f"Failed to generate summary content: {str(e)}")
        raise Exception(f"Failed to generate response: {str(e)}")


2024-10-21 12:36:25,886 - controller.chat_controller - ERROR - Failed to generate summary content: Prompt must accept context as an input variable. Received prompt with input variables: ['chat_history', 'input']


