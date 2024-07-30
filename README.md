exports.postQuestionsToMongo = async (req, res) => {
  const documentMap = new Map();

  try {
    await new Promise((resolve, reject) => {
      fs.createReadStream('/home/Mayank.Sharma/GV_Test/backend/express/utils/finals_with_keys.csv')
        .pipe(csv())
        .on("data", (row) => {
          const documentName = row["key"];
          const question = row["Question"];
          
          if (documentMap.has(documentName)) {
            documentMap.get(documentName).push({ question });
          } else {
            documentMap.set(documentName, [{ question }]);
          }
        })
        .on("end", resolve)
        .on("error", reject);
    });

    const savedDocuments = await Promise.all(
      Array.from(documentMap).map(async ([documentName, questions]) => {
        const questionDoc = new Question({ documentName, questions });
        return questionDoc.save();
      })
    );

    res.status(200).json({ 
      message: "Documents Added Successfully", 
      count: savedDocuments.length 
    });
  } catch (err) {
    console.error("Error processing CSV or saving to database:", err);
    res.status(500).json({ message: "Internal Server Error" });
  }
};
