import os
import pandas as pd
import json

# Load the CSV file
csv_file = "permissions.csv"  # Path to your CSV file
df = pd.read_csv(csv_file)

# Function to strip the extension from a filename
def get_document_name_without_ext(filename):
    return os.path.splitext(filename)[0]

# Example JSON array of documents (without permissions)
documents = [
    {"documentName": "Document1", "questions": ["What is AI?", "Explain ML."]},
    {"documentName": "Document2", "questions": ["What is Blockchain?", "Explain Quantum."]}
]

# Iterate over the documents and add the 'permissionLevel' field
for doc in documents:
    # Get the documentName without the extension
    document_name = doc["documentName"]

    # Fetch the row from the CSV where FileLeafRef matches the document name (without extension)
    matching_row = df[df['FileLeafRef'].apply(lambda x: get_document_name_without_ext(x)) == document_name]

    if not matching_row.empty:
        # Extract the 'permission' column and split the permission string into a list
        permissions_str = matching_row['permission'].values[0]  # Fetch permission string
        permissions_list = permissions_str.split(";")  # Split by ';' to create a list

        # Add the 'permissionLevel' field to the document
        doc["permissionLevel"] = permissions_list
    else:
        # Handle case where no matching permission is found (optional)
        doc["permissionLevel"] = []

# Print the updated documents with permission levels
print(json.dumps(documents, indent=4))
