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

    // Create an object where keys are document names and values are individual questions
    const questionsByDocument = matchedQuestions.reduce((acc, questionDoc) => {
      // Shuffle the questions for each document and pick the first question
      const shuffledQuestions = questionDoc.questions.sort(() => 0.5 - Math.random());
      acc[questionDoc.documentName] = shuffledQuestions[0]; // pick only one question per document
      return acc;
    }, {});

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
