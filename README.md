for title, summary in combined_summary_by_title.items():
    chain = question_generation(summary)
    cleaned_chain = chain.replace('\n', '')
    cleaned_json_chain = json.loads(cleaned_chain)
    all_question[title] = cleaned_json_chain
