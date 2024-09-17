exports.postFilteredQuestion = async (req, res, next) => {
  const documentNames = req.body.documentNames;
  try {
    if (!Array.isArray(documentNames) || documentNames.length === 0) {
      const error = new Error("documentNames should be a non-empty array.");
      error.statusCode = 404;
      throw error;
    }

    const matchedQuestion = await Question.find({
      documentName: { $in: documentNames },
    });

    if (matchedQuestion.length === 0) {
      return res.status(200).json({
        message: "No matching documents found.",
        questions: {},
      });
    }

    // Flatten all questions and map them to their corresponding document names
    const questionToDocumentMap = matchedQuestion.reduce((acc, doc) => {
      doc.questions.forEach((question) => {
        acc[question] = doc.documentName;
      });
      return acc;
    }, {});

    // Extract unique questions
    const uniqueQuestions = Object.keys(questionToDocumentMap);

    // Shuffle and pick 4 questions, filling with null or duplicates if necessary
    const shuffledQuestions = uniqueQuestions.sort(() => 0.5 - Math.random());
    const limitedQuestions = shuffledQuestions.slice(0, 4);

    // Prepare the final response with question as key and document name as value
    const finalQuestions = limitedQuestions.reduce((acc, question) => {
      acc[question] = questionToDocumentMap[question];
      return acc;
    }, {});

    res.status(200).json({
      message: "Matching documents found.",
      questions: finalQuestions,
    });
  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  }
};
