#!/bin/bash

export PATH=/usr/bin:/usr/local/bin:/home/mayank.sharma9/.nvm/versions/node/v20.18.0/bin:$PATH

source /home/mayank.sharma9/venv/ingestion/bin/activate

python3.11 /home/mayank.sharma9/GV/ingestion/sharepoint_file_acquisition.py

systemctl restart fast_application

pm2 restart /home/mayank.sharma9/GV/express/ecosystem.config.js
