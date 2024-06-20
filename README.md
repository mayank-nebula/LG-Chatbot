from flask import Flask, render_template_string, request, jsonify
import subprocess
import psutil
import os

app = Flask(__name__)
PIPELINE_LOG = 'pipeline.log'
PIPELINE_SCRIPT = 'pipeline.py'
CONDA_ENV_NAME = '/home/Mayank.Sharma/anaconda3/envs/GV_Test'
CONDA_BIN_PATH = '/home/Mayank.Sharma/anaconda3/bin/activate'

@app.route('/flask_pipeline')
def index():
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
            }, 5050);
        </script>
    ''', status=status, logs=logs)

@app.route('/flask_pipeline/start', methods=['POST'])
def start_pipeline():
    status, pid = check_pipeline()
    if status == 'stopped':
        with open(PIPELINE_LOG, 'a') as f:
            command = f". {CONDA_BIN_PATH} {CONDA_ENV_NAME} && python {PIPELINE_SCRIPT}"
            subprocess.Popen(
                command,
                shell=True,
                stdout=f,
                stderr=f
            )
    return "Pipeline Started"

@app.route('/flask_pipeline/stop', methods=['POST'])
def stop_pipeline():
    status, pid = check_pipeline()
    if status == 'running':
        os.kill(pid, 9)
    return 'Pipeline stopped!'

@app.route('/flask_pipeline/restart', methods=['POST'])
def restart_pipeline():
    stop_pipeline()
    start_pipeline()
    return 'Pipeline restarted!'

@app.route('/flask_pipeline/logs')
def get_logs():
    try:
        with open(PIPELINE_LOG, 'r') as f:
            logs = f.read()
        return logs
    except FileNotFoundError:
        return 'No logs available.'

def check_pipeline():
    for proc in psutil.process_iter(['pid', 'name']):
        if proc.info['name'] == 'python' and PIPELINE_SCRIPT in proc.cmdline():
            return 'running', proc.info['pid']
    return 'stopped', None

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5050)
