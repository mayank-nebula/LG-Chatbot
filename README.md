exports.postQuestionsToMongo = async (req, res, next) => {
  const documentMap = new Map();

  try {
    await new Promise((resolve, reject) => {
      fs.createReadStream('/home/Mayank.Sharma/GV_Test/backend/express/utils/finals_with_keys.csv')
        .pipe(csv())
        .on("data", (row) => {
          const documentName = row["key"];
          const question = row["Question"];
          
          if (documentMap.has(documentName)) {
            documentMap.get(documentName).add(question);
          } else {
            documentMap.set(documentName, new Set([question]));
          }
        })
        .on("end", resolve)
        .on("error", reject);
    });

    for (const [documentName, questionSet] of documentMap) {
      const questions = Array.from(questionSet);
      const questionDoc = new Question({ documentName, questions });
      await questionDoc.save();
    }

    res.status(200).json({ message: "Documents Added Successfully" });
  } catch (err) {
    console.error("Error processing CSV or saving to database:", err);
    res.status(500).json({ message: "Internal Server Error" });
  }
};
