const fs = require("fs");
const csv = require("csv-parser");
const Question = require("../models/question");

exports.postQuestionsToMongo = async (req, res, next) => {
  const documentMap = new Map();
  const filePath = '/home/Mayank.Sharma/GV_Test/backend/express/utils/finals_with_keys.csv';

  fs.createReadStream(filePath)
    .pipe(csv())
    .on("data", (row) => {
      const documentName = row["DocumentName"];
      const question = row["Question"];

      if (documentMap.has(documentName)) {
        documentMap.get(documentName).push(question);
      } else {
        documentMap.set(documentName, [question]);
      }
    })
    .on("end", async () => {
      try {
        const bulkOperations = [];

        documentMap.forEach((questions, documentName) => {
          bulkOperations.push({
            updateOne: {
              filter: { documentName },
              update: { $set: { documentName, questions } },
              upsert: true
            }
          });
        });

        if (bulkOperations.length > 0) {
          await Question.bulkWrite(bulkOperations);
        }

        res.status(200).json({
          message: "Documents added or updated successfully"
        });
      } catch (err) {
        console.error("Error saving documents: ", err);
        if (!err.statusCode) {
          err.statusCode = 500;
        }
        next(err);
      }
    })
    .on("error", (err) => {
      console.error("Error reading CSV file: ", err);
      res.status(500).json({
        message: "Error reading CSV file",
        error: err.message
      });
    });
};
