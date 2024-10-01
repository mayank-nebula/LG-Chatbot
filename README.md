import csv
import json

def extract_field_from_csv(csv_file: str, field_name: str):
    """
    Extracts a particular field from a CSV file and returns the value.
    Handles JSON fields like lists, converting them back to Python objects.
    """
    try:
        with open(csv_file, mode='r', newline='') as file:
            reader = csv.DictReader(file)

            # Loop through each row in the CSV
            for row in reader:
                # Extract the field value by field name
                field_value = row.get(field_name)
                
                # If the field contains a JSON-like string, parse it
                if field_value and (field_value.startswith('[') or field_value.startswith('{')):
                    field_value = json.loads(field_value)
                
                # Print or return the extracted field value
                print(f"Extracted {field_name}: {field_value}")
                return field_value

    except FileNotFoundError as fnf_error:
        print(f"Error: File {csv_file} not found - {fnf_error}")
    except Exception as e:
        print(f"An error occurred while reading the CSV file: {e}")

# Example usage: Extract the 'tags' field
extract_field_from_csv("metadata_output.csv", "tags")
