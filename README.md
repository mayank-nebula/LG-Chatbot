matched_rows = []

# Iterate over each row in df1_filtered
for index, row in df1_filtered.iterrows():
    name = row['Name']
    
    # Find the matching row in df2 based on FileLeafRef
    match = df2[df2['FileLeafRef'] == name]
    
    if not match.empty:
        # Extract relevant data from df1 and df2
        matched_row = {
            'ID': row['ID'],
            'Name': row['Name'],
            'Title': match.iloc[0]['Title'],
            'FileLeafRef': match.iloc[0]['FileLeafRef']
        }
        matched_rows.append(matched_row)

# Convert the list of matched rows into a DataFrame
final_df = pd.DataFrame(matched_rows)

# Save the final DataFrame to a new CSV file
final_df.to_csv('matched_output.csv', index=False)
