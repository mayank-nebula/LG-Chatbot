import pandas as pd
import json

# Load the CSV file
df = pd.read_csv('your_file.csv')

# Extract the columns
region_column = df['Region']
strategy_area_column = df['StrategyArea']
country_column = df['Country']

# Convert the columns to sets to get unique values
region_set = set(region_column)
strategy_area_set = set(strategy_area_column)
country_set = set(country_column)

# Prepare the data as a dictionary
data = {
    "Regions": list(region_set),
    "StrategyAreas": list(strategy_area_set),
    "Countries": list(country_set)
}

# Save the data to a JSON file
with open('unique_values.json', 'w') as json_file:
    json.dump(data, json_file, indent=4)

print("Unique values saved to JSON successfully!")
