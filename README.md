df1_selected = df1_filtered[['ID', 'Name']]
df2_selected = df2[['Title', 'FileLeafRef']]

# Merge the DataFrames on the 'Name' column in df1 and 'FileLeafRef' column in df2
merged_df = pd.merge(df1_selected, df2_selected, left_on='Name', right_on='FileLeafRef', how='left')

# Ensure the final DataFrame only contains the 1166 rows from df1_filtered
final_df = merged_df[merged_df['Name'].isin(df1_filtered['Name'])]

# Save the final DataFrame to a new CSV file
final_df.to_csv('merged_output.csv', index=False)
