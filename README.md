import json
from collections import defaultdict
import re

def read_json_file(file_path):
    with open(file_path, 'r') as file:
        data = [json.loads(line) for line in file]
    return data

def merge_json_objects(data):
    merged_data = defaultdict(lambda: {"page_content": "", "metadata": {}})

    for item in data:
        id_ = item["metadata"]["id"]
        slide_number = item["metadata"].get("slide_number", "")
        
        # Store the metadata (excluding slide_number)
        if not merged_data[id_]["metadata"]:
            merged_metadata = item["metadata"].copy()
            merged_metadata.pop("slide_number", None)
            merged_data[id_]["metadata"] = merged_metadata
        
        # Collect the content and its associated slide_number
        merged_data[id_]["metadata"].setdefault("slides", []).append({
            "slide_number": slide_number,
            "page_content": item["page_content"]
        })

    # Sort slides by slide_number and concatenate page_content
    for key in merged_data:
        slides = merged_data[key]["metadata"]["slides"]
        slides.sort(key=lambda x: (re.sub(r'[^a-zA-Z]', '', x["slide_number"]), int(re.sub(r'\D', '', x["slide_number"]))))
        
        # Concatenate page_content in order
        merged_data[key]["page_content"] = ' '.join([slide["page_content"] for slide in slides])
        
        # Remove the temporary slides list
        del merged_data[key]["metadata"]["slides"]

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
