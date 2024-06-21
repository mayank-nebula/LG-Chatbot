from flask import Flask, request, jsonify

from processing_retriever_summary import process_question
# from processing_multi_vector_retriever import process_question

app = Flask(__name__)

@app.route("/flask", methods=["POST"])
def process():
    data = request.get_json()
    question = data.get("question")
    chatHistory = data.get("chat_history", [])

    if not question:
        return jsonify({"error": "No question provided"}), 400

    try:
        response = process_question(question, chatHistory)
        return jsonify({"response": response})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000 , debug=True)
