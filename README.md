    async def content_generator_salutation(question: str) -> AsyncGenerator[str, None]:
        try:
            formatted_chat_history = (
                format_chat_history(message.chatHistory)
                if message.chatHistory
                else "No Previous Conversation"
            )
            ai_text = ""
            token_count = 0
            token_count_reason = "Question Answer for Salutation"

            model = (
                AzureChatOpenAI(
                    api_key=os.environ["AZURE_OPENAI_API_KEY"],
                    openai_api_version=os.environ["AZURE_OPENAI_API_VERSION"],
                    azure_deployment=os.environ["AZURE_OPENAI_CHAT_DEPLOYMENT_NAME"],
                    api_version=os.environ["AZURE_OPENAI_API_VERSION"],
                )
                if message.llm == "GPT"
                else ChatOllama(base_url=base_url, model=llama3_1)
            )

            prompt_text = """
                The following is a conversation with a highly intelligent AI assistant. \
                The assistant is helpful, knowledgeable, and polite. The assistant always takes into account the previous interactions in the conversation to provide relevant and context-aware responses. \
                When the user greets the assistant, the assistant should respond with an appropriate salutation and a brief summary or reference to the last topic discussed, ensuring a smooth and coherent continuation of the conversation.\
                Conversation history \
                {chat_history}
                User Question : \
                {question}
            """

            prompt = ChatPromptTemplate.from_template(prompt_text)

            chain = (
                {
                    "chat_history": lambda _: formatted_chat_history,
                    "question": lambda x: x,
                }
                | prompt
                | model
                | StrOutputParser()
            )

            async for chunk in chain.astream(question):
                ai_text += chunk
                if message.llm == "GPT":
                    token_count += len(encoding.encode(chunk))
                yield json.dumps({"type": "text", "content": chunk})

            chat_id, message_id = update_chat(message, ai_text)

            if message.llm == "GPT":
                count_tokens(
                    token_csv_file_path,
                    token_count_reason,
                    message.question,
                    token_count,
                    True,
                )

            yield json.dumps({"type": "chatId", "content": str(chat_id)})
            yield json.dumps({"type": "messageId", "content": str(message_id)})
            yield json.dumps({"type": "sources", "content": None})
