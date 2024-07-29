import json
import csv

# Load JSON data
with open('data.json', 'r') as json_file:
    data = json.load(json_file)

# Extract keys
keys = list(data.keys())

# Write to CSV file
with open('keys.csv', 'w', newline='') as csv_file:
    writer = csv.writer(csv_file)
    writer.writerow(['Serial Number', 'Key'])  # Header
    for idx, key in enumerate(keys, start=1):
        writer.writerow([idx, key])
