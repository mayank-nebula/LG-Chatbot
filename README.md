df['Permissions'] = df['TeamsLookupId'].astype(str) + "+" + df['TeamsPermissionLookupId'].astype(str)

# Group by Name and UserLookupId, and concatenate the Permissions column
result = df.groupby(['Title', 'UserLookupId'])['Permissions'].apply(lambda x: ';'.join(x)).reset_index()

# Rename columns for clarity
result.columns = ['Name', 'UserLookupId', 'Permissions']

# Save the result to a new CSV file
result.to_csv('processed_data.csv', index=False)

print("Processed data saved to 'processed_data.csv'")
