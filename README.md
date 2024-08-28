import pandas as pd
import os

# Read the CSV files
csv1 = pd.read_csv('file1.csv')  # Replace 'file1.csv' with your first CSV filename
csv2 = pd.read_csv('file2.csv')  # Replace 'file2.csv' with your second CSV filename

# Define the allowed file extensions
allowed_extensions = ['.pdf', '.ppt', '.pptx', '.doc', '.docx']

# Filter csv1 for allowed file extensions (case insensitive)
csv1['Extension'] = csv1['Name'].str.split('.').str[-1].str.lower()
csv1_filtered = csv1[csv1['Extension'].isin([ext[1:] for ext in allowed_extensions])]

# Process FileLeafRef in csv2
csv2['ProcessedName'] = csv2['FileLeafRef'].apply(lambda x: os.path.splitext(x)[0])

# Merge the dataframes
result = pd.merge(csv1_filtered, csv2[['ProcessedName', 'Title']], 
                  left_on='Name', right_on='ProcessedName', how='inner')

# Select only the columns we need
final_result = result[['Name', 'Title']]

# Display the result
print(final_result)
