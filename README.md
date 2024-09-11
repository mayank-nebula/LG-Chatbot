import tiktoken

def trim_summary_to_token_limit(text, token_limit=100000, encoding_name="cl100k_base"):
    """
    Trims the provided text to fit within the specified token limit.

    Args:
        text (str): The full summary or text that needs to be trimmed.
        token_limit (int): The maximum number of tokens allowed. Defaults to 100k tokens.
        encoding_name (str): The encoding to use for tokenization. Defaults to 'cl100k_base'.

    Returns:
        str: The trimmed text within the token limit.
    """
    # Get the encoding
    encoding = tiktoken.get_encoding(encoding_name)

    # Encode the text into tokens
    tokens = encoding.encode(text)
    
    # If token count exceeds the limit, trim the tokens
    if len(tokens) > token_limit:
        tokens = tokens[:token_limit]
    
    # Decode the trimmed tokens back into a string
    trimmed_text = encoding.decode(tokens)
    
    return trimmed_text
