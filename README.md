general_chat_patterns = [
        r'\b(hi|hello|hey|greetings|good morning|good afternoon|good evening)\b',
        r'\bhow are you\b',
        r'\bnice to meet you\b',
        r'\bwhat\'s up\b',
        r'\bhow\'s it going\b'
    ]
    
    question_lower = question.lower()
    return any(re.search(pattern, question_lower) for pattern in general_chat_patterns)
