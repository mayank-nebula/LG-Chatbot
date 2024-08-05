const Question = require('./models/Question'); // Your mongoose model

exports.getRandomQuestions = async (req, res) => {
  try {
    // Aggregate pipeline to get random questions
    const randomQuestions = await Question.aggregate([
      // Unwind the questions array to create a document for each question
      { $unwind: "$questions" },
      // Sample 10 random questions
      { $sample: { size: 10 } },
      // Project to get only the question field
      { $project: { _id: 0, question: "$questions" } }
    ]);

    // Extract questions from the result
    const questions = randomQuestions.map(item => item.question);

    res.status(200).json({
      message: "Random questions retrieved successfully",
      totalQuestions: questions.length,
      questions: questions
    });

  } catch (err) {
    console.error("Error retrieving random questions:", err);
    res.status(500).json({ message: "Internal Server Error", error: err.message });
  }
};
