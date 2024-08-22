import json
from collections import defaultdict
import re

def read_json_file(file_path):
    with open(file_path, 'r') as file:
        data = [json.loads(line) for line in file]
    return data

def merge_json_objects(data):
    merged_data = defaultdict(lambda: {"page_content": "", "slides": []})

    for item in data:
        id_ = item["metadata"]["id"]
        slide_number = item["metadata"].get("slide_number", "")
        
        # Store the metadata and content together
        merged_data[id_]["slides"].append({"metadata": item["metadata"], "page_content": item["page_content"]})

    # Sort slides by slide_number
    for key in merged_data:
        merged_data[key]["slides"].sort(key=lambda x: (re.sub(r'[^a-zA-Z]', '', x["metadata"]["slide_number"]), int(re.sub(r'\D', '', x["metadata"]["slide_number"]))))
        
        # Concatenate page_content in order
        merged_data[key]["page_content"] = ' '.join([slide["page_content"] for slide in merged_data[key]["slides"]])

        # Optionally, keep slides list or remove it
        del merged_data[key]["slides"]  # Remove if you only need merged content and not individual slides

    return list(merged_data.values())

def write_json_file(file_path, data):
    with open(file_path, 'w') as file:
        for item in data:
            file.write(json.dumps(item) + '\n')

if __name__ == "__main__":
    input_file_path = 'input.txt'
    output_file_path = 'output.txt'
    
    # Step 1: Read JSON objects from file
    data = read_json_file(input_file_path)
    
    # Step 2: Merge JSON objects by id
    merged_data = merge_json_objects(data)
    
    # Step 3: Write merged data to output file
    write_json_file(output_file_path, merged_data)
