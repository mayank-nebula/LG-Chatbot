const mongoose = require("mongoose");
const fs = require("fs");
const csv = require("csv-parser");
const path = require("path");

// Connect to MongoDB
mongoose.connect("mongodb://localhost:27017/yourdatabase", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const db = mongoose.connection;
db.on("error", console.error.bind(console, "connection error:"));
db.once("open", function() {
  console.log("Connected to MongoDB");
});

// Define the schema and model
const userSchema = new mongoose.Schema(
  {
    documentName: {
      type: String,
      required: true,
    },
    tags: {
      type: [String],
      required: true,
    },
  },
  { timestamps: true }
);

const User = mongoose.model("User", userSchema);

// Function to process the CSV file
const importCSV = (filePath) => {
  const documentMap = new Map();

  fs.createReadStream(filePath)
    .pipe(csv())
    .on("data", (row) => {
      const documentName = row["DocumentName"];
      const question = row["Question"];

      if (documentMap.has(documentName)) {
        documentMap.get(documentName).add(question);
      } else {
        documentMap.set(documentName, new Set([question]));
      }
    })
    .on("end", async () => {
      for (const [documentName, questionsSet] of documentMap) {
        const tags = Array.from(questionsSet);

        const user = new User({
          documentName,
          tags,
        });

        try {
          await user.save();
          console.log(`Inserted: ${documentName}`);
        } catch (error) {
          console.error(`Error inserting ${documentName}: `, error);
        }
      }

      db.close();
    });
};

// Replace with the path to your CSV file
const csvFilePath = path.join(__dirname, "yourfile.csv");
importCSV(csvFilePath);
