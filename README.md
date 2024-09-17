exports.postFilteredQuestion = async (req, res, next) => {
  const documentNames = req.body.documentNames;
  try {
    if (!Array.isArray(documentNames) || documentNames.length === 0) {
      const error = new Error("documentNames should be a non-empty array.");
      error.statusCode = 404;
      throw error;
    }

    const matchedDocuments = await Question.find({
      documentName: { $in: documentNames },
    });

    if (matchedDocuments.length === 0) {
      return res.status(200).json({
        message: "No Matching Documents Found.",
        questions: {},
      });
    }

    const documentQuestionsMap = matchedDocuments.reduce((acc, doc) => {
      acc[doc.documentName] = doc.questions;
      return acc;
    }, {});

    const allQuestions = matchedDocuments.reduce((acc, doc) => {
      const docQuestions = doc.questions.map((question) => ({
        documentName: doc.documentName,
        question,
      }));
      return acc.concat(docQuestions);
    }, []);

    const uniqueQuestions = [
      ...new Map(allQuestions.map((item) => [item.question, item])).values(),
    ];

    const shuffledQuestions = uniqueQuestions.sort(() => 0.5 - Math.random());
    const limitedQuestions = shuffledQuestions.slice(0, 4);

    const result = limitedQuestions.reduce((acc, item) => {
      if (!acc[item.documentName]) {
        acc[item.documentName] = [];
      }
      acc[item.documentName].push(item.question);
      return acc;
    }, {});

    res.status(200).json({
      message: "Matching Documents Found.",
      questions: result,
    });
  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  }
};
