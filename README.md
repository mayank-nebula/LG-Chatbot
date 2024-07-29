import pandas as pd

# Load the CSV files
keys = pd.read_csv('keys.csv')
finals = pd.read_csv('finals.csv')

# Ensure the 'sl. no.' columns are properly named
keys.rename(columns={'sl. no.': 'sl_no', 'key': 'key'}, inplace=True)
finals.rename(columns={'sl. no.': 'sl_no'}, inplace=True)

# Merge the dataframes on 'sl_no' column
merged_df = pd.merge(finals, keys[['sl_no', 'key']], on='sl_no', how='left')

# Save the result to a new CSV file
merged_df.to_csv('finals_with_keys.csv', index=False)

print("Merged CSV saved as 'finals_with_keys.csv'")
