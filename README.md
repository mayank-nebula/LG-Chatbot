import os
import subprocess

import psutil
from flask import Flask, render_template_string

app = Flask(__name__)
PIPELINE_LOG = "pipeline_question.log"
PIPELINE_SCRIPT = "pipeline.py"


@app.route("/flask_pipeline")
def index():
    status, pid = check_pipeline()
    logs = get_logs()
    return render_template_string(
        """
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
    """,
        status=status,
        logs=logs,
    )


@app.route("/flask_pipeline/start", methods=["POST"])
def start_pipeline():
    status, pid = check_pipeline()
    if status == "stopped":
        try:
            with open(PIPELINE_LOG, "a") as f:
                command = f"python {PIPELINE_SCRIPT}"
                subprocess.Popen(command, shell=True, stdout=f, stderr=f)
            return "Pipeline Started"
        except Exception as e:
            with open(PIPELINE_LOG, "a") as f:
                f.write(f"Error starting pipeline: {e}\n")
            return "Error starting pipeline"
    return "Pipeline already running"


@app.route("/flask_pipeline/stop", methods=["POST"])
def stop_pipeline():
    status, pid = check_pipeline()
    if status == "running":
        os.kill(pid, 9)
    return "Pipeline stopped!"


@app.route("/flask_pipeline/restart", methods=["POST"])
def restart_pipeline():
    stop_pipeline()
    start_pipeline()
    return "Pipeline restarted!"


@app.route("/flask_pipeline/logs")
def get_logs():
    try:
        with open(PIPELINE_LOG, "r") as f:
            logs = f.read()
        return logs
    except FileNotFoundError:
        return "No logs available."


def check_pipeline():
    for proc in psutil.process_iter(["pid", "name", "cmdline"]):
        if proc.info["name"] == "python" and PIPELINE_SCRIPT in proc.info["cmdline"]:
            return "running", proc.info["pid"]
    return "stopped", None


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5050)
