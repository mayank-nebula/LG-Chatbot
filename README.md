import json
import csv

def remove_quotes(value):
    """Remove quotes from a value if it is a string."""
    if isinstance(value, str):
        return value.strip('"')
    return value

# Load the JSON data from the file
with open('data.json', 'r') as json_file:
    json_data = json.load(json_file)

# Open a CSV file for writing
with open('output.csv', 'w', newline='') as csv_file:
    # Create a CSV writer object
    csv_writer = csv.writer(csv_file)

    # Write the header row (keys of the first dictionary in the list)
    header = json_data[0].keys()
    csv_writer.writerow(header)

    # Write the data rows
    for item in json_data:
        row = [remove_quotes(value) for value in item.values()]
        csv_writer.writerow(row)

print("CSV file has been created successfully.")
