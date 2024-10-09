ai_text = ""
        chat_id = None
        flag = False

        if not message.chatId:
            chat_id = await create_new_title_chat(message, collection_chat, llm_gpt)
            flag = True
            yield json.dumps({"type": "chatId", "content": str(chat_id)})

        search_kwargs = {}

        if message.anonymousFilter:
            search_kwargs = create_search_kwargs(message.anonymousFilter)
        elif message.filters:
            search_kwargs = create_search_kwargs(message.filters)

        retriever = MultiVectorRetriever(
            vectorstore=vectorstore_gpt_summary,
            docstore=loaded_docstore_gpt_summary,
            id_key="GatesVentures_Scientia_Summary",
            search_kwargs=search_kwargs,
        )

        chain = multi_modal_rag_chain_source(
            retriever,
            llm_gpt,
            "No",
            message.filters,
            message.chatHistory,
            "No",
            "summary",
        )

        async for chunk in chain.astream(question):
            ai_text += chunk
            yield json.dumps({"type": "text", "content": chunk})

        sources = get_sources()

        message_id = await update_chat(
            message,
            ai_text,
            str(chat_id) if chat_id else message.chatId,
            flag,
            collection_chat,
            sources,
        )

        yield json.dumps({"type": "messageId", "content": str(message_id)})
        yield json.dumps(
            {
                "type": "sources",
                "content": sources,
            }
        )
