from flask import Flask, request, jsonify

from processing_retriever_summary import process_question
# from processing_multi_vector_retriever import process_question

app = Flask(__name__)

@app.route("/flask", methods=["POST"])
def process():
    """
    Flask route to process a POST request with a question and optional chat history.
    
    Expects a JSON payload with the following structure:
    {
        "question": "your question here",
        "chat_history": ["previous chat message 1", "previous chat message 2", ...]
    }

    Returns:
    - JSON response with the processed question's response or an error message.
    """
    # Get JSON data from the request
    data = request.get_json()
    question = data.get("question")
    chatHistory = data.get("chat_history", [])

    # Check if the question is provided in the request
    if not question:
        return jsonify({"error": "No question provided"}), 400

    try:
        # Process the question and get the response
        response = process_question(question, chatHistory)
        return jsonify({"response": response})
    except Exception as e:
        # Handle any exceptions that
