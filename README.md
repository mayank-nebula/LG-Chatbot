def generate_text_summaries(texts, summarize=False):
    """
    Summarize text elements
    texts: List of str
    tables: List of str
    summarize: Bool to summarize or not
    """

    # Prompt
    prompt_text = """You are an assistant tasked with summarizing text for retrieval. \
    These summaries will be embedded and used to retrieve the raw text elements. \
    Give a detailed summary of the text that is well optimized for retrieval. you must not provide something like 'the text describe about or the text is about or Here is a concise summary of the text'. You should be straight to the point with summarization. Please provide a summary of the text: {element} """
    prompt = ChatPromptTemplate.from_template(prompt_text)

    # Text summary chain
    # model = ChatGroq(temperature=0, model_name="llama3-8b-8192", groq_api_key="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" )
    
    model = ChatOllama(model=llama3, base_url=base_url, temperature=0.0)


    summarize_chain = {"element": lambda x: x} | prompt | model | StrOutputParser()
    
    # Initialize empty summaries
    text_summaries = {}

    # Apply to text if texts are provided and summarization is requested
    if texts.values() and summarize:
        text_summaries = summarize_chain.batch(texts.values(), {"max_concurrency": 5})
    elif texts.values():
        text_summaries = texts.values()


    return text_summaries
