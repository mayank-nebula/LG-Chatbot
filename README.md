[Unit]
Description=Gunicorn instance serve Fast app
After=network.target

[Service]
User=Mayank.Sharma
Group=www-data
WorkingDirectory=/home/Mayank.Sharma/GV_Test/backend/fast
Environment="PATH=/home/Mayank.Sharma/anaconda3/envs/GV_Test/bin"
ExecStart=/home/Mayank.Sharma/anaconda3/envs/GV_Test/bin/gunicorn main:app --workers 3 --worker-class uvicorn.workers.UvicornWorker >
Restart=on-failure

[Install]
WantedBy=multi-user.target
