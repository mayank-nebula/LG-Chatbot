exports.getQuestionsByDocumentNames = async (req, res) => {
  try {
    // Ensure the request body contains a list of document names
    if (!req.body.documentNames || !Array.isArray(req.body.documentNames)) {
      return res.status(400).json({ message: "Please provide an array of document names in the request body." });
    }

    const { documentNames } = req.body;

    // Find all documents that match the provided document names
    const documents = await Question.find({ documentName: { $in: documentNames } });

    // Create a map of document name to questions for easy access
    const resultMap = documents.reduce((acc, doc) => {
      acc[doc.documentName] = doc.questions;
      return acc;
    }, {});

    // Prepare the response, including info about missing documents
    const response = documentNames.map(name => ({
      documentName: name,
      questions: resultMap[name] || [],
      found: !!resultMap[name]
    }));

    res.status(200).json({
      message: "Questions retrieved successfully",
      results: response
    });

  } catch (err) {
    console.error("Error retrieving questions:", err);
    res.status(500).json({ message: "Internal Server Error", error: err.message });
  }
};
