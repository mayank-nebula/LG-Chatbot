import json
from collections import defaultdict
import re

def read_json_file(file_path):
    with open(file_path, 'r') as file:
        data = [json.loads(line) for line in file]
    return data

def merge_json_objects(data):
    merged_data = defaultdict(lambda: {"metadata": {}, "content": []})

    for item in data:
        id_ = item["metadata"]["id"]
        slide_number = item["metadata"].get("slide_number", "")
        
        # Ensure content is merged
        merged_data[id_]["content"].extend(item.get("content", []))
        
        # Add metadata if not already present
        if not merged_data[id_]["metadata"]:
            merged_data[id_]["metadata"] = item["metadata"]
        else:
            merged_data[id_]["metadata"].update(item["metadata"])

        # Organize slide, table, figure order
        if slide_number:
            merged_data[id_]["metadata"].setdefault("slides", []).append(slide_number)

    # Sort slides, tables, figures
    for key in merged_data:
        merged_data[key]["metadata"]["slides"].sort(key=lambda x: (re.sub(r'[^a-zA-Z]', '', x), int(re.sub(r'\D', '', x))))

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
