exports.postQuestionsToMongo = async (req, res) => {
  const documentMap = new Map();

  try {
    await new Promise((resolve, reject) => {
      fs.createReadStream('/home/Mayank.Sharma/GV_Test/backend/express/utils/finals_with_keys.csv')
        .pipe(csv())
        .on("data", (row) => {
          const documentName = row["key"];
          const questionText = row["Question"];
          
          if (!documentName || !questionText) {
            console.warn("Skipping row due to missing data:", row);
            return;
          }

          if (documentMap.has(documentName)) {
            documentMap.get(documentName).push({ question: questionText });
          } else {
            documentMap.set(documentName, [{ question: questionText }]);
          }
        })
        .on("end", resolve)
        .on("error", reject);
    });

    const savedDocuments = await Promise.all(
      Array.from(documentMap).map(async ([documentName, questions]) => {
        if (questions.length === 0) {
          console.warn(`Skipping document ${documentName} due to no valid questions`);
          return null;
        }
        const questionDoc = new Question({ documentName, questions });
        return questionDoc.save();
      })
    );

    const successfulSaves = savedDocuments.filter(doc => doc !== null);

    res.status(200).json({ 
      message: "Documents Added Successfully", 
      count: successfulSaves.length 
    });
  } catch (err) {
    console.error("Error processing CSV or saving to database:", err);
    res.status(500).json({ message: "Internal Server Error", error: err.message });
  }
};
