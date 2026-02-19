import google.generativeai as genai

def shorten_title(api_key, title):
    """Shortens title to < 50 characters using Gemini."""
    genai.configure(api_key=api_key)
    model = genai.GenerativeModel('gemini-1.5-flash')
    
    prompt = f"""Rewrite the following title to be less than 50 characters while maintaining its original meaning. 
    Return ONLY the new title text.
    
    Title: {title}"""
    
    response = model.generate_content(prompt)
    return response.text.strip()

def shorten_content(api_key, content):
    """Shortens content to < 165 characters using Gemini."""
    genai.configure(api_key=api_key)
    model = genai.GenerativeModel('gemini-1.5-flash')
    
    prompt = f"""Summarize the following content to be less than 165 characters while maintaining the core meaning. 
    Return ONLY the summarized text.
    
    Content: {content}"""
    
    response = model.generate_content(prompt)
    return response.text.strip()
