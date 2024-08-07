llm_to_use = (
        llm_gpt
        if llm == "GPT"
        else ChatOllama(temperature=0, model=llama3_1, base_url=base_url)
    )

    prompt_text = (
        "Given the following question, create a concise and informative title that accuratelt reflects the content and MAKE SURE TO ANSWER IN JUST 4 WORDS. Just give the title name without any special characters.\n"
        "{element}"
    )

    prompt = ChatPromptTemplate.from_template(prompt_text)
    new_title = {"element": lambda x: x} | prompt | llm_to_use | StrOutputParser()

    response = new_title.invoke(question)
