import ijson

# Path to the JSON file
json_file_path = 'your_json_file.json'

# Define the file ID or title you want to filter by
file_id_to_filter = 'specific_file_id'
file_title_to_filter = 'specific_file_title'

# Initialize a dictionary to collect summaries slide-wise for the specific file
summaries_by_slide = {}

# Open the JSON file and parse it incrementally
with open(json_file_path, 'r') as file:
    # Use ijson to parse the file incrementally
    for item in ijson.items(file, 'item'):
        file_id = item['metadata']['id']
        file_title = item['metadata']['Title']
        slide_number = item['metadata']['slide_number']
        summary = item['summary']
        
        # Check if the current item matches the specific file ID or title
        if file_id == file_id_to_filter or file_title == file_title_to_filter:
            if slide_number not in summaries_by_slide:
                summaries_by_slide[slide_number] = []
            
            summaries_by_slide[slide_number].append(summary)

# Combine summaries slide-wise
combined_summaries = {}
for slide, summaries in summaries_by_slide.items():
    combined_summaries[slide] = ' '.join(summaries)

# Print the combined summaries
for slide, combined_summary in combined_summaries.items():
    print(f"{slide}: {combined_summary}\n")

# Optionally, save the combined summaries to a new JSON file
with open('combined_summaries.json', 'w') as file:
    json.dump(combined_summaries, file, indent=4)
