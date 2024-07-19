@app.route("/flask", methods=["POST"])
def process():
    data = request.get_json()
    question = data.get("question")
    chatHistory = data.get("chat_history")
    permissions = data.get("userPermissions")
    filters = data.get("filters")
    stores = data.get("stores")
    image = data.get("image")
    llm = data.get("llm")

    if not question:
        return jsonify({"error": "No question provided"}), 400

    try:
        response, sources = process_question(
            question, chatHistory, permissions, filters, stores, image, llm
        )
        return jsonify({"response": response, "sources": sources})
    except Exception as e:
        return jsonify({"error": str(e)}), 500


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)
