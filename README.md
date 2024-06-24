def process_question(question, chatHistory):
    """Process a question or greeting and return the answer"""
    
    # First, use the LLM to analyze if the input is only a greeting
    analysis_prompt = """Analyze the following user input and determine if it is ONLY a greeting or salutation, nothing else. 
    Respond with 'YES' if it's only a greeting, or 'NO' if it contains any other content or intent beyond a simple greeting.
    
    User input: {question}
    
    Is this ONLY a greeting?"""
    
    model = ChatOllama(model=llama3, base_url=base_url, temperature=0)
    
    analysis_response = model.invoke([HumanMessage(content=analysis_prompt.format(question=question))])
    
    if "YES" in analysis_response.content.upper():
        # If it's only a greeting, respond accordingly
        greeting_prompt = """You are a friendly AI assistant. Respond to the user's greeting in a warm and welcoming manner. 
        Keep your response brief and natural, as if you're starting a conversation with a friend."""
        
        greeting_response = model.invoke([HumanMessage(content=greeting_prompt + "\n\nUser's greeting: " + question)])
        
        return greeting_response.content, [] 
