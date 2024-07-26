@app.post("/generate")
async def generate_content(message: Message):
    async def content_generator(question: str) -> AsyncGenerator[str, None]:
        global user_permissions, sources
        user_permissions = permissions.copy()
        sources.clear()

        if message.chatHistory:
            question = standalone_question(question, message.chatHistory, message.llm)

        if message.filters:
            retriever = create_retriever(message.filters, message.stores)
        else:
            if message.stores == "GPT":
                retriever = retriever_gpt
            else:
                retriever = retriever_ollama

        if message.image == "Yes":
            if message.llm == "GPT":
                llm_to_use = llm_gpt
            else:
                llm_to_use = ChatOllama(
                    temperature=0,
                    model=llava_llama3,
                    base_url=base_url,
                )
        else:
            if message.llm == "GPT":
                llm_to_use = llm_gpt
            else:
                llm_to_use = ChatOllama(
                    temperature=0, model="llama3.1", base_url=base_url
                )

        chain = multi_modal_rag_chain_source(
            retriever, llm_to_use, message.llm, message.image, message.filters
        )

        async for chunk in chain.astream(question):
            yield f"{chunk}"

    async def content_generator_GPT(question: str) -> AsyncGenerator[str, None]:
        final_text = []
        model = AzureChatOpenAI(
            api_key=os.environ["AZURE_OPENAI_API_KEY"],
            openai_api_version=os.environ["AZURE_OPENAI_API_VERSION"],
            azure_deployment=os.environ["AZURE_OPENAI_CHAT_DEPLOYMENT_NAME"],
            api_version=os.environ["AZURE_OPENAI_API_VERSION"],
        )
        chat_history = "\n".join(
            [
                f"Human : {chat['user']}\nAssistant: {chat['ai']}"
                for chat in message.chatHistory
            ]
        )

        text_message = {
            "type": "text",
            "text": (
                "Please answer the following question based on the given conversation history.\n"
                "Use your own knowledge to answer the question\n"
                "Conversation history:\n"
                f"{chat_history if chat_history else 'No previous conversation.'}\n\n"
                "User question:\n"
                f"{question}"
            ),
        }

        final_text.append(text_message)

        chain = prompt | model | parser
        async for chunk in chain.astream({"message": HumanMessage(content=final_text)}):
            yield f"{chunk}"

    async def content_generator_salutation(
        message: Message,
    ) -> AsyncGenerator[str, None]:
        final_text = []
        chat_history = "\n".join(
            [
                f"Human : {chat['user']}\nAssistant: {chat['ai']}"
                for chat in message.chatHistory
            ]
        )

        if message.llm == "GPT":
            model = AzureChatOpenAI(
                api_key=os.environ["AZURE_OPENAI_API_KEY"],
                openai_api_version=os.environ["AZURE_OPENAI_API_VERSION"],
                azure_deployment=os.environ["AZURE_OPENAI_CHAT_DEPLOYMENT_NAME"],
                api_version=os.environ["AZURE_OPENAI_API_VERSION"],
            )
        else:
            model = ChatOllama(
                base_url="http://10.0.0.4:11434",
                model="llama3.1:latest",
            )

        text_message = {
            "type": "text",
            "text": (
                "The following is a conversation with a highly intelligent AI assistant. \n"
                "The assistant is helpful, knowledgeable, and polite. The assistant always takes into account the previous interactions in the conversation to provide relevant and context-aware responses.\n"
                "When the user greets the assistant, the assistant should respond with an appropriate salutation and a brief summary or reference to the last topic discussed, ensuring a smooth and coherent continuation of the conversation.\n"
                "Conversation history:\n"
                f"{chat_history if chat_history else 'No previous conversation.'}\n\n"
                "User question:\n"
                f"{message.question}"
            ),
        }

        final_text.append(text_message)

        chain = prompt | model | parser
        async for chunk in chain.astream({"message": HumanMessage(content=final_text)}):
            yield f"{chunk}"

    if is_generalChat(message.question):
        return StreamingResponse(
            content_generator_salutation(message), media_type="text/markdown"
        )
    elif "@GK" in message.question:
        if message.chatHistory:
            question = standalone_question(
                message.question, message.chatHistory, message.llm
            )
            return StreamingResponse(
                content_generator_GPT(question), media_type="text/markdown"
            )
        else:
            return StreamingResponse(
                content_generator_GPT(message.question), media_type="text/markdown"
            )
    else:
        if message.chatHistory:
            question = standalone_question(
                message.question, message.chatHistory, message.llm
            )
            return StreamingResponse(
                content_generator(question), media_type="text/markdown"
            )
        else:
            return StreamingResponse(
                content_generator(message.question), media_type="text/markdown"
            )


if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=6969)
