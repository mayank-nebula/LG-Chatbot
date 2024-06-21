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
        # Handle any exceptions that occur during processing
        return jsonify({"error": str(e)}), 500

if __name__ == "__main__":
    # Run the Flask application on all available IP addresses (0.0.0.0) and port 5000
    app.run(host="0.0.0.0", port=5000, debug=True)





from flask import Flask, render_template_string, request, jsonify
import subprocess
import psutil
import os

app = Flask(__name__)
PIPELINE_LOG = 'pipeline.log'
PIPELINE_SCRIPT = 'pipeline.py'

@app.route('/flask_pipeline')
def index():
    """
    Renders the main page with buttons to start, stop, and restart the pipeline.
    Also displays the current status of the pipeline and logs.
    """
    status, pid = check_pipeline()
    logs = get_logs()
    return render_template_string('''
        <form action="/flask_pipeline/start" method="post">
            <button type="submit" {% if status == 'running' %} disabled {% endif %}>Start Pipeline</button>
        </form>
        <form action="/flask_pipeline/stop" method="post">
            <button type="submit" {% if status == 'stopped' %} disabled {% endif %}>Stop Pipeline</button>
        </form>
        <form action="/flask_pipeline/restart" method="post">
            <button type="submit">Restart Pipeline</button>
        </form>
        <h2>Status: {{ status }}</h2>
        <h2>Logs:</h2>
        <pre id="logs">{{ logs }}</pre>
        <script>
            setInterval(function() {
                fetch('/flask_pipeline/logs')
                    .then(response => response.text())
                    .then(data => {
                        document.getElementById('logs').innerText = data;
                    });
            }, 5000);
        </script>
    ''', status=status, logs=logs)

@app.route('/flask_pipeline/start', methods=['POST'])
def start_pipeline():
    """
    Starts the pipeline by running the pipeline script if it is not already running.
    Logs the output to the pipeline log file.
    """
    status, pid = check_pipeline()
    if status == 'stopped':
        try:
            with open(PIPELINE_LOG, 'a') as f:
                command = f"python {PIPELINE_SCRIPT}"
                subprocess.Popen(
                    command,
                    shell=True,
                    stdout=f,
                    stderr=f
                )
            return "Pipeline Started"
        except Exception as e:
            with open(PIPELINE_LOG, 'a') as f:
                f.write(f"Error starting pipeline: {e}\n")
            return "Error starting pipeline"
    return "Pipeline already running"

@app.route('/flask_pipeline/stop', methods=['POST'])
def stop_pipeline():
    """
    Stops the pipeline if it is running by killing the process.
    """
    status, pid = check_pipeline()
    if status == 'running':
        os.kill(pid, 9)
    return 'Pipeline stopped!'

@app.route('/flask_pipeline/restart', methods=['POST'])
def restart_pipeline():
    """
    Restarts the pipeline by first stopping it and then starting it again.
    """
    stop_pipeline()
    start_pipeline()
    return 'Pipeline restarted!'

@app.route('/flask_pipeline/logs')
def get_logs():
    """
    Returns the logs from the pipeline log file.
    """
    try:
        with open(PIPELINE_LOG, 'r') as f:
            logs = f.read()
        return logs
    except FileNotFoundError:
        return 'No logs available.'

def check_pipeline():
    """
    Checks if the pipeline script is currently running.
    
    Returns:
    - status (str): 'running' if the pipeline is running, 'stopped' otherwise.
    - pid (int or None): The process ID of the running pipeline, or None if not running.
    """
    for proc in psutil.process_iter(['pid', 'name', 'cmdline']):
        if proc.info['name'] == 'python' and PIPELINE_SCRIPT in proc.info['cmdline']:
            return 'running', proc.info['pid']
    return 'stopped', None

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5050)


