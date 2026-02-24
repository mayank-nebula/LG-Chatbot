import json
from collections import Counter

# Load JSON file
with open("episodes.json", "r") as f:
    data = json.load(f)

# Extract episode numbers
episodes = [item["episode_number"] for item in data]

# Count occurrences
counter = Counter(episodes)

# 1️⃣ Sort descending (unique values)
descending = sorted(set(episodes), reverse=True)

print("Episodes in descending order:")
print(descending)

# 2️⃣ Find duplicates
duplicates = sorted([num for num, count in counter.items() if count > 1])

print("\nDuplicate episode numbers:")
print(duplicates if duplicates else "No duplicates 🎉")

# 3️⃣ Find missing numbers
if episodes:
    full_range = set(range(min(episodes), max(episodes) + 1))
    missing = sorted(full_range - set(episodes))

    print("\nMissing episode numbers:")
    print(missing if missing else "No missing episodes 🎉")
else:
    print("No episode data found.")
