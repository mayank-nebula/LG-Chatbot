const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const questionSchema = new Schema({
    documentName: {
        type: String,
        required: true,
    },
    questions: [
        { question: { type: String, required: true } }
    ]
}, { timestamps: true });

module.exports = mongoose.model("Questions", questionSchema);
