exports.postFilteredQuestion = async (req, res, next) => {
  const documentNames = req.body.documentNames;
  try {
    if (!Array.isArray(documentNames) || documentNames.length === 0) {
      const error = new Error("documentNames should be a non-empty array.");
      error.statusCode = 400;
      throw error;
    }

    // Step 1: Randomly select up to 4 document names
    const shuffledDocNames = documentNames.sort(() => 0.5 - Math.random());
    const selectedDocNames = shuffledDocNames.slice(0, 4);

    // Step 2: Fetch one random question for each selected document
    const selectedQuestions = {};
    const availableDocs = [];
    for (const docName of selectedDocNames) {
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
        availableDocs.push(docName);
      }
    }

    // Step 3: If we have fewer than 4 questions, fill with questions from available documents
    let i = 0;
    while (Object.keys(selectedQuestions).length < 4 && availableDocs.length > 0) {
      const docName = availableDocs[i % availableDocs.length];
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
      i++;
    }

    if (Object.keys(selectedQuestions).length === 0) {
      return res.status(200).json({
        message: "No questions found in matching documents.",
        questions: {},
      });
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
