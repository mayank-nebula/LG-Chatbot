import json

# Load files
with open("file1.json") as f1, open("file2.json") as f2:
    data1 = json.load(f1)
    data2 = json.load(f2)

# Extract post_id sets
ids1 = {item["post_id"] for item in data1}
ids2 = {item["post_id"] for item in data2}

# Find intersection
common_ids = ids1.intersection(ids2)

print("Common post_ids:", common_ids)
