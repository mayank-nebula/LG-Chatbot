
import json

def count_key_value_pairs(data):
    count = 0

    if isinstance(data, dict):
        for key, value in data.items():
            count += 1  # Count each key-value pair in the dictionary
            count += count_key_value_pairs(value)  # Recursively count for nested dicts or lists
    elif isinstance(data, list):
        for item in data:
            count += count_key_value_pairs(item)  # Recursively count each item in the list

    return count

# Load JSON data from a file
with open('your_file.json', 'r') as file:
    data = json.load(file)

# Count the key-value pairs
pair_count = count_key_value_pairs(data)
print(f"Total key-value pairs: {pair_count}")