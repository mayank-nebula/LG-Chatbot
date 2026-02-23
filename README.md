const fs = require("fs");

// 1️⃣ Load JSON file
const data = JSON.parse(
  fs.readFileSync("data.json", "utf-8")
);

// 2️⃣ Sort by ISO date (ascending)
data.sort((a, b) => new Date(a.date) - new Date(b.date));

// 3️⃣ Save back to file (optional)
fs.writeFileSync(
  "data-sorted.json",
  JSON.stringify(data, null, 2)
);

console.log("Sorted successfully!");
