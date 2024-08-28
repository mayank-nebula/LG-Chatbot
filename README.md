import pandas as pd

# Load the CSV files into DataFrames
df1 = pd.read_csv('file1.csv')
df2 = pd.read_csv('file2.csv')

# Define the allowed extensions
allowed_extensions = ['.pdf', '.ppt', '.pptx', '.doc', '.docx']

# Convert the 'Name' column to lowercase and filter rows based on allowed extensions
df1_filtered = df1[df1['Name'].str.lower().str.endswith(tuple(allowed_extensions))]

# Select only the desired columns
df1_selected = df1_filtered[['ID', 'Name']]
df2_selected = df2[['Title', 'FileLeafRef']]

# Merge the DataFrames on the 'Name' column in df1 and 'FileLeafRef' column in df2
merged_df = pd.merge(df1_selected, df2_selected, left_on='Name', right_on='FileLeafRef')

# Save the merged DataFrame to a new CSV file
merged_df.to_csv('merged_output.csv', index=False)
