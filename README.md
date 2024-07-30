exports.getQuestionsByDocumentNames = async (req, res) => {
  try {
    // Ensure the request body contains a list of document names
    if (!req.body.documentNames || !Array.isArray(req.body.documentNames)) {
      return res.status(400).json({ message: "Please provide an array of document names in the request body." });
    }

    const { documentNames } = req.body;

    // Find all documents that match the provided document names
    const documents = await Question.find({ documentName: { $in: documentNames } });

    // Extract all questions into a single array
    const allQuestions = documents.reduce((acc, doc) => {
      return acc.concat(doc.questions);
    }, []);

    // Remove duplicates if needed
    const uniqueQuestions = [...new Set(allQuestions)];

    res.status(200).json({
      message: "Questions retrieved successfully",
      totalQuestions: uniqueQuestions.length,
      questions: uniqueQuestions
    });

  } catch (err) {
    console.error("Error retrieving questions:", err);
    res.status(500).json({ message: "Internal Server Error", error: err.message });
  }
};
