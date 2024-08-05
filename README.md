import pandas as pd

# Read JSON data from a file
input_file = 'input.json'  # replace with your input file name
output_file = 'output.csv'  # replace with your desired output file name

# Read the JSON file
with open(input_file, 'r') as file:
    data = pd.read_json(file)

# Convert to DataFrame
df = pd.DataFrame(data)

# Save to CSV
df.to_csv(output_file, index=False)

print(f"Data successfully written to {output_file}")
