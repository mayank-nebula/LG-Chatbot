prompts = load_prompts()

prompt = ChatPromptTemplate.from_template(prompts["structured_rag"])
chain = {"query": lambda x: x} | prompt | llm_gpt
