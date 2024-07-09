import json

# Helper function to save text and image chunks
def save_chunks(question, text_chunks, image_chunks):
    safe_question = re.sub(r'[^a-zA-Z0-9]', '_', question)  # sanitize question for filename
    text_file_name = f"{safe_question}_text_chunks.json"
    image_file_name = f"{safe_question}_image_chunks.json"
    
    with open(text_file_name, 'w') as text_file:
        json.dump(text_chunks, text_file)
    
    with open(image_file_name, 'w') as image_file:
        json.dump(image_chunks, image_file)

if __name__ == "__main__":
    input_csv = "question.csv"
    output_csv = "answer.csv"
    
    with open(input_csv, newline='') as csvfile:
        reader = csv.DictReader(csvfile)
        questions = [row["question"] for row in reader]
    
    results = []
    
    for idx, question in enumerate(questions, start=1):
        print(f"Processing question: {question}")
    
        global_sources, global_sources_link, global_ids, global_text_chunks, global_image_chunks = [], [], [], [], []
        
        start_time_gpt = time.time()
        answer_gpt = chain_gpt.invoke(question)
        end_time_gpt = time.time()
        time_gpt = end_time_gpt - start_time_gpt
        
        for file_id in global_ids:
            stream_file_content(site_id="gatesventures.sharepoint.com,5985bb5c-53b9-4ebb-ac6f-9a940041edf7,3c8c6e37-ed49-4214-b950-874194e56289", drive_id="b!XLuFWblTu06sb5qUAEHt9zdujDxJ7RRCuVCHQZTlYonNNGynhwpHSZiBVKMutktO", file_id=file_id, files_metadata=files_metadata)
        
        save_chunks(question, global_text_chunks, global_image_chunks)
        
        global_sources, global_sources_link, global_ids, global_text_chunks, global_image_chunks = [], [], [], [], []
        
        start_time_llava = time.time()
        answer_llava = chain_llava.invoke(question)
        end_time_llava = time.time()
        time_llava = end_time_llava - start_time_llava
        
        for file_id in global_ids:
            stream_file_content(site_id="gatesventures.sharepoint.com,5985bb5c-53b9-4ebb-ac6f-9a940041edf7,3c8c6e37-ed49-4214-b950-874194e56289", drive_id="b!XLuFWblTu06sb5qUAEHt9zdujDxJ7RRCuVCHQZTlYonNNGynhwpHSZiBVKMutktO", file_id=file_id, files_metadata=files_metadata)
        
        save_chunks(question, global_text_chunks, global_image_chunks)
        
        results.append({
            "question": question,
            "answer_gpt": answer_gpt,
            "answer_llava": answer_llava,
            "sources_gpt": global_sources.copy(),
            "sources_gpt_link": global_sources_link.copy(),
            "sources_llava": global_sources.copy(),
            "sources_llava_link": global_sources_link.copy(),
            "time_gpt": time_gpt,
            "time_llava": time_llava
        })
    
    df = pd.DataFrame(results)
    
    if os.path.exists(output_csv):
        df.to_csv(output_csv, mode='a', header=False, index=False)
    else:
        df.to_csv(output_csv, mode='w', header=True, index=False)
