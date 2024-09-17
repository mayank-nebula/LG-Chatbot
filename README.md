question = data_dict.get('question', 'No question provided')
    reason_text = f"Last Time the answer was not good and the reason shared by user is: {reason}. Generate Accordingly" if reason else ''
    original_content = f"Original content: {formatted_texts}" if formatted_texts else ''
    summary_content = f"Summary content: {formatted_summary}" if formatted_summary else ''
    previous_conversation = f"Previous conversation: {chatHistory}" if chatHistory else ''
