exports.postFilteredQuestion = async (req, res, next) => {
  const documentNames = req.body.documentNames;
  try {
    if (!Array.isArray(documentNames) || documentNames.length === 0) {
      const error = new Error("documenNames Should Be a Non-Empty Array.");
      error.statusCode = 404;
      throw error;
    }
    const matchedQuestion = await Question.find({ documentName: { $in: documentNames } });
    if (matchedQuestion.length === 0) {
      return res.status(200).json({
        message: "No Matching Documents Found.",
        questions: [],
      })
    }
    const allQuestions = matchedQuestion.reduce((acc, question) => {
      return acc.concat(question.questions);
    }, []);
    const uniqueQuestions = [...new Set(allQuestions)];
    res.status(200).json({
      message: "Matching Documents Found.",
      questions: uniqueQuestions,
    })
  } catch (err) {
    console.log(err);
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  }
}
