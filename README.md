model = AzureChatOpenAI(
            api_key=os.environ["AZURE_OPENAI_API_KEY"],
            openai_api_version=os.environ["AZURE_OPENAI_API_VERSION"],
            azure_deployment=os.environ["AZURE_OPENAI_CHAT_DEPLOYMENT_NAME"],
            api_version=os.environ["AZURE_OPENAI_API_VERSION"],
        )
        chat_history = "\n".join(
            [
                f"Human: {chat['user']}\nAssistant: {chat['ai']}"
                for chat in message.chatHistory
            ]
        )

        prompt_text = """
            Please answer the following question based on the given conversation history. \
            Use your own knowledge to answer the question \
            Conversation history \
            {chat_history if chat_history else 'No previous conversation.'}
            User Question : \
            {element}
        """

    

        prompt = ChatPromptTemplate.from_template(prompt_text)

        chain = {"element": lambda x: x} | prompt | model | StrOutputParser()

        async for chunk in chain.astream(question):
            yield f"{chunk}"
