exports.postFilteredQuestion = async (req, res, next) => {
  const documentNames = req.body.documentNames;
  try {
    if (!Array.isArray(documentNames) || documentNames.length === 0) {
      const error = new Error("documentNames should be a non-empty array.");
      error.statusCode = 400;
      throw error;
    }

    // Find documents that have questions
    const documentsWithQuestions = await Question.aggregate([
      { $match: { documentName: { $in: documentNames } } },
      { $match: { $expr: { $gt: [{ $size: "$questions" }, 0] } } },
      { $project: { documentName: 1, _id: 0 } }
    ]);

    if (documentsWithQuestions.length === 0) {
      return res.status(200).json({
        message: "No questions found in matching documents.",
        questions: {},
      });
    }

    // Randomly select up to 4 documents
    const selectedDocs = documentsWithQuestions
      .sort(() => 0.5 - Math.random())
      .slice(0, 4);

    const selectedQuestions = {};

    // Fetch 4 random questions, potentially all from the same document
    for (let i = 0; i < 4; i++) {
      const docIndex = i % selectedDocs.length;
      const docName = selectedDocs[docIndex].documentName;

      const question = await Question.aggregate([
        { $match: { documentName: docName } },
        { $project: { 
            randomQuestion: { $arrayElemAt: [ "$questions", { $floor: { $multiply: [{ $rand: {} }, { $size: "$questions" }] } } ] }
          }
        },
        { $limit: 1 }
      ]);

      if (question.length > 0 && question[0].randomQuestion) {
        selectedQuestions[docName] = question[0].randomQuestion;
      }
    }

    res.status(200).json({
      message: "Questions selected.",
      questions: selectedQuestions,
    });
  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  }
};
