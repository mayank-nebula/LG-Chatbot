const userSchema = new Schema({
  documentName: {
    type: String,
    required: true,
  },
  tags: {
    type: [String],
    required: true,
  },
}, { timestamps: true });

module.exports = mongoose.model("User", userSchema);
