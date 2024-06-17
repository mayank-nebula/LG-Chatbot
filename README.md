[Unit]
Description=Flask App for Pipeline Management
After=network.target

[Service]
User=your_user
WorkingDirectory=/path/to/your/app
ExecStart=/bin/bash -c "source /path/to/conda/bin/activate your_env_name && exec python /path/to/your/app/app.py"
Restart=always

[Install]
WantedBy=multi-user.target
