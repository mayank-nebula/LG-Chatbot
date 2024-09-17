exports.postFilteredQuestion = async (req, res, next) => {
  const documentNames = req.body.documentNames;
  try {
    if (!Array.isArray(documentNames) || documentNames.length === 0) {
      const error = new Error("documentNames Should Be a Non-Empty Array.");
      error.statusCode = 404;
      throw error;
    }
    
    const matchedQuestions = await Question.find({
      documentName: { $in: documentNames },
    });

    if (matchedQuestions.length === 0) {
      return res.status(200).json({
        message: "No Matching Documents Found.",
        questions: {},
      });
    }

    // Create an object where keys are document names and values are arrays of questions
    const questionsByDocument = matchedQuestions.reduce((acc, questionDoc) => {
      acc[questionDoc.documentName] = questionDoc.questions;
      return acc;
    }, {});

    // Shuffle and limit questions for each document
    for (const document in questionsByDocument) {
      const shuffledQuestions = questionsByDocument[document].sort(() => 0.5 - Math.random());
      questionsByDocument[document] = shuffledQuestions.slice(0, 4); // limit to 4 questions per document
    }

    res.status(200).json({
      message: "Matching Documents Found.",
      questions: questionsByDocument,
    });
  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  }
};
