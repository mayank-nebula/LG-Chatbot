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

    // Collect all questions along with their document names
    const allQuestions = [];
    matchedQuestions.forEach((questionDoc) => {
      questionDoc.questions.forEach((question) => {
        allQuestions.push({
          documentName: questionDoc.documentName,
          question: question,
        });
      });
    });

    // Shuffle all questions and select up to 4
    const shuffledQuestions = allQuestions.sort(() => 0.5 - Math.random());
    const limitedQuestions = shuffledQuestions.slice(0, 4);

    // Create a key-value pair object for document-question
    const questionsByDocument = limitedQuestions.reduce((acc, item) => {
      acc[item.documentName] = item.question;
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
