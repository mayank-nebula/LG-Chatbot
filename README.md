import pandas as pd
import ast
import json

# Function to parse the string and extract 'LookupValue'
def extract_lookup_values(value):
    try:
        # Convert the string to a list of dictionaries
        parsed_value = ast.literal_eval(value)
        # Extract 'LookupValue' from each dictionary
        return [item['LookupValue'] for item in parsed_value]
    except (ValueError, SyntaxError):
        return []  # Return an empty list if the value is not in the correct format

# Load the CSV file
df = pd.read_csv('your_file.csv')

# Apply the extraction function to the columns
df['Region'] = df['Region'].apply(extract_lookup_values)
df['StrategyArea'] = df['StrategyArea'].apply(extract_lookup_values)
df['Country'] = df['Country'].apply(extract_lookup_values)

# Convert the lists of lookup values to sets for unique values
region_set = set([item for sublist in df['Region'] for item in sublist])
strategy_area_set = set([item for sublist in df['StrategyArea'] for item in sublist])
country_set = set([item for sublist in df['Country'] for item in sublist])

# Prepare the data as a dictionary
data = {
    "Regions": list(region_set),
    "StrategyAreas": list(strategy_area_set),
    "Countries": list(country_set)
}

# Save the data to a JSON file
with open('unique_values.json', 'w') as json_file:
    json.dump(data, json_file, indent=4)

print("Unique values extracted and saved to JSON successfully!")
