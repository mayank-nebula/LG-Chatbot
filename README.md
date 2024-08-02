from flask import Flask, request, jsonify

app = Flask(__name__)

@app.route('/process', methods=['POST'])
def process():
    data = request.json
    user_input = data.get('user_input')
    chat_history = data.get('chat_history', [])
    chat_id = data.get('chat_id', "")
    filters = data.get('filters', [])
    stores = data.get('stores', "GPT")
    image = data.get('image', "No")
    llm = data.get('llm', "GPT")
    userEmailId = data.get('userEmailId', "")
    regenerate = data.get('regenerate', "No")
    feedbackRegenerate = data.get('feedbackRegenerate', "No")
    reason = data.get('reason', "")
    permissions = data.get('permissions', [
        "HLSConfidential",
        "ADConfidential",
        "USHCConfidential",
        "EGHConfidential",
    ])

    response = process_agent(
        agent_executor,
        user_input,
        chat_history,
    )
    
    return jsonify(response)

if __name__ == "__main__":
    app.run(host='0.0.0.0', port=5000)
