Deployment Documentation
Infrastructure Requirements
This document outlines the deployment architecture and specifications for a 3 VM setup designed to support MongoDB, Chroma, and a staging environment. Each VM is configured to meet the performance, and reliability needs of the respective service it hosts.
1.	VM1 MongoDB Server
•	Purpose: Hosts the MongoDB Database to store and manage application data.
•	Operating system: Ubuntu 20.04.6 LTS
•	CPU: 4 vCPUs
•	Memory: 16GB RAM
•	Storage: 256GB
2.	VM2 ChromaDB Server
•	Purpose: Hosts ChromaDB for vector storage and retrieval, supporting high-performance data retrieval operations.
•	Operating system: Ubuntu 20.04.6 LTS
•	CPU: 4 vCPUs
•	Memory: 16GB RAM
•	Storage: 256GB
3.	VM3 Staging Environment
•	Purpose: Hosts the staging environment for testing and validation of application changes before production deployment.
•	Operating system: Ubuntu 20.04.6 LTS
•	CPU: 8 vCPUs
•	Memory: 32GB RAM
•	Storage: 256GB
Networking for 3 VMs
1.	Virtual Network (VNet):
•	All VMs must be hosted within the same Azure Virtual Network (VNet). This configuration ensures that they can communicate with each other efficiently and securely.
•	The VNet should be configured with a custom address space, ensuring that IP addresses do not overlap with other networks.
2.	Subnets:
•	The VMs should be placed in the same subnet within the VNet. This allows for low-latency communication and simplifies the network configuration since no additional routing or network security group (NSG) rules are needed for internal communication between the VMs.
•	Each VM should be assigned a private IP address within this subnet.
3.	Network Security Groups (NSG):
•	An NSG must be associated with the subnet or individual VMs to control inbound and outbound traffic.

 
MongoDB Installation on Ubuntu VM
1.	Prerequisites – 
•	Ubuntu VM: Ensure that an Ubuntu VM is set up and accessible.
•	Root or Sudo Access: Installation requires root or sudo privileges.
•	Firewall Configuration: Ensure that necessary ports are open, specifically port 27017 for MongoDB.
2.	Update the System – 
•	sudo apt-get update
•	sudo apt-get upgrade -y
3.	Install nano Text Editor – 
•	sudo apt-get install -y nano
4.	Import the public key used by the package management system – 
•	sudo apt-get install gnupg curl
•	curl -fsSL https://www.mongodb.org/static/pgp/server-7.0.asc | \ sudo gpg -o /usr/share/keyrings/mongodb-server-7.0.gpg \ --dearmor
5.	Create a list file for MongoDB – 
•	echo "deb [ arch=amd64,arm64 signed-by=/usr/share/keyrings/mongodb-server-7.0.gpg ] https://repo.mongodb.org/apt/ubuntu focal/mongodb-org/7.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-7.0.list
6.	Reload local package database – 
•	sudo apt-get update
7.	Install the MongoDB packages – 
•	sudo apt-get install -y mongodb-org
8.	Start and Enable MongoDB Service – 
•	sudo systemctl start mongod
If receiving an error similar to the following when starting mongod:
•	Failed to start mongod.service: Unit mongod.service not found.
Run the following command first:
•	sudo systemctl daemon-reload
Then run the start command above again.
9.	Verify that MongoDB has started successfully – 
•	sudo systemctl status mongod
•	sudo systemctl enable mongod
10.	Verify MongoDB Installation – 
•	sudo systemctl status mongod
11.	Configure MongoDB – 
•	Bind IP Address – 
a)	To configure MongoDB to accept connections from specific IP addresses, edit the MongoDB configuration file.
-	sudo nano /etc/mongod.conf
In the configuration file, locate the bindIp line and modify it as needed:
-	bindIp: <staging_vm_private_ip>
Save the file. And to ensure that the changes take effect.
-	sudo systemctl daemon-reload
-	sudo systemctl restart mongod

 
Deployment Documentation for ChromaDB Docker Container on Ubuntu VM
1.	Prerequisites – 
•	Ubuntu VM: Ensure that an Ubuntu VM is set up and accessible.
•	Root or Sudo Access: Installation requires root or sudo privileges.
•	Firewall Configuration: Ensure that necessary ports are open, specifically port 8000 for ChromaDB.
2.	Update the System – 
•	sudo apt-get update
•	sudo apt-get upgrade -y
3.	Install Docker – 
•	sudo apt install docker.io
•	sudo snap install docker
4.	Verify the Docker Installation – 
•	sudo systemctl status docker
•	sudo docker –version
Ensure Docker is running, and installation was successful.
5.	Loading the ChromaDB Docker Image – 
•	Load the ChromaDB Docker Image from the .tar file. (Transferred file)
a)	sudo docker load -I /path/to/chromadb_image.tar
Replace /path/to/chromadb_image.tar with the actual path to the image file. Verify the image by listing Docker Images – 
b)	sudo docker images
6.	Running the Docker container – 
•	sudo docker run --network host --name chromadb_container -d <image_name>
a)	<image_name> should be replaced with the actual name of the ChromaDB image.
b)	The --network host option allows the container to share the host’s network.
c)	The -d flag runs the container in detached mode.
7.	Ensuring the Container Runs Continuously – 
•	To ensure that the ChromaDB container runs continuously, configure it to start automatically on boot:
a)	Enable Docker service to start at boot:
-	sudo systemctl enable docker
b)	Restart the container automatically on failure or reboot by setting the restart policy:
-	sudo docker update --restart unless-stopeed chromadb_container
This command configures the container to restart automatically unless it is explicitly stopped.
8.	Verification – 
•	List all running containers
-	sudo docker ps
•	Check the container’s restart policy
-	sudo docker inspect -f “{{ .HostConfig.RestartPolicy.Name }}” chromadb_container
This should return unless-stopped, confirming that the container is configured to restart as required.
9.	Container Management – 
•	Stopping the container
-	sudo docker stop chromadb_container
•	Starting the container
-	sudo docker start chromadb_container
•	Removing the container
-	sudo docker rm chromadb_container
•	Removing the image
-	sudo docker rmi <image_name>
10.	Monitoring and Logging – 
•	View container logs
-	sudo docker logs chromadb_container
•	Monitor the container’s status
-	sudo docker ps -a

 
Deployment Documentation for the Application
1.	Prerequisites – 
•	Ubuntu VM: Ensure that an Ubuntu VM is set up and accessible.
•	Root or Sudo Access: Installation requires root or sudo privileges.
•	Firewall Configuration: Ensure that necessary ports are open. (Example – 80,443, or custom port)
2.	Update the System – 
•	sudo apt-get update
•	sudo apt-get upgrade -y
3.	Install Essential Tools – 
•	sudo apt install -y build-essential curl git nano
4.	Install Python3.11 and setting up venv – 
•	Add the Deadsnakes PPA
-	sudo add-apt-repository ppa:deadsnakes/ppa
-	sudo apt update
•	Install python3.11 
-	sudo apt install python3.11 python3.11-venc python3.11-dev -y
5.	Install Node.js and npm – 
•	curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.0/install.sh | bash
•	nvm install 20
•	node -v # should print `v20.17.0`
•	npm -v # should print `10.8.2`
6.	Install nginx – 
•	sudo apt install nginx
7.	Install Poppler and tesseractOCR – 
•	sudo apt-get install poppler-utils
•	sudo apt install tesseract-ocr
•	sudo apt install libtesseract-dev
8.	Clone the Repository – 
•	Navigate to Desired Directory
-	git clone <git_repo_link>
9.	Navigate to Project Directory – 
A.	Express Application – 
i.	Navigate to express folder
ii.	Install project Dependencies
	npm install
iii.	Create .env file 
	sudo nano .env
	Create necessary variables
-	MONGO_API_KEY=mongodb://<piravte_ip_vm_with_mongo>:27017/GatesVentures_Scientia
iv.	Setting up PM2
	sudo npm install -g pm2
	pm -v # verify installation
v.	Configure ecosystem.config.js
vi.	Start the Application – 
	pm2 start ecosystem.config.js
	pm2 status # verify the application is running 
vii.	Generate Startup Script – 
	pm2 startup 
This command will output a command tailored to the system. Copy and execute the command provided by the above command.
viii.	Save the Process List
	pm2 save
ix.	Managing the application
	List All PM2 Process
-	pm2 list
	View Detailed Status of all Processes
-	pm2 status
	View Logs for a Specific Application
-	pm2 logs <app_name_in_ecosystem.config.js>
	Restart an application
-	pm2 restart <app_name_in_ecosystem.config.js>
	Stop an application
-	pm2 stop <app_name_in_ecosystem.config.js>
	Delete an application from PM2
-	pm2 delete <app_name_in_ecosystem.config.js>
	Reload all applications
-	pm2 reload all
B.	FastAPI Application – 
i.	Navigate to fast directory
ii.	Create a venv 
	python3.11 -m venv /path/to/venv/<name_of_fast_app_venv>
Replace /path/to/env with actual path where to create venv.
Replace < name_of_fast_app_venv > with desired name environment.
iii.	Activate venv
	source /path/to/venv/< name_of_fast_app_venv >/bin/activate
	python3.11 -m pip install -U pip
iv.	Install FastAPI and Dependencies
	pip install -r requirements.txt
v.	Set Up Environment Variables by creating .env file
	sudo nano .env
	Create necessary variables
vi.	Edit the chromaDB package
	Edit init file of ChromaDB  
-	sudo nano /path/to/venv/< name_of_fast_app_venv >/lib/python3.11/site-packages/chromadb/__init__.py
-	Paste the below line of code at top and save the changes.
__import__('pysqlite3')
import sys

sys.modules['sqlite3'] = sys.modules.pop('pysqlite3')

vii.	Create a service file for the fast Application
	sudo nano /etc/systemd/system/<name_of_fast_app_service>.service
	Paste the below configurations

[Unit]                                                                                                                                                                                                                                       Description=Gunicorn instance serve Fast app                                                                                                                                                                                                 After=network.target                                                                                                                                                                                                                                                                                                                                                                                                                                                                      [Service]                                                                                                                                                                                                                                    User=<name_of_user> # example - mayank.sharma9@evalueserve.com                                                                                                                                                                                                          Group=www-data                                                                                                                                                                                                                               WorkingDirectory=/path/to/working/directory # example-/home/mayank.sharma9/GV/fast                                                                                                                                                                                                Environment="PATH=/path/to/fast_app_venv /bin" # example    -/home/mayank.sharma9/fast_application/bin                                                                                                                                                                        ExecStart=/path/to/fast_app_venv /bin/gunicorn main:app --workers 4 --worker-class uvicorn.workers.UvicornWorker --preload --bind 0.0.0.0:6677    # example - /home/mayank.sharma9/fast_application                                                         
Restart=on-failure                                                                                                                                                                                                                                                                                                                                                                                                                                                                        [Install]                                                                                                                                                                                                                                    WantedBy=multi-user.target

viii.	Reload system manager configuration and start the FastAPI service
	sudo system daemon-reload
	sudo systemctl start <name_of_fast_app_service>.service
	sudo systemctl enable <name_of_fast_app_service>.service
C.	Ingestion pipeline
i.	Navigate to ingestion directory
ii.	Create a venv 
	python3.11 -m venv /path/to/venv/<name_of_ingestion_app_venv>
Replace /path/to/env with actual path where to create venv.
Replace < name_of_ingestion_app_venv > with desired name environment.
iii.	Activate venv
	source /path/to/venv/< name_of_ingestion_app_venv >/bin/activate
	python3.11 -m pip install -U pip
iv.	Install Dependencies
	pip install -r requirements.txt
v.	Set Up Environment Variables by creating .env file
	sudo nano .env
	Create necessary variables
vi.	Edit the chromaDB package
	Edit init file of ChromaDB  
-	sudo nano /path/to/venv/< name_of_ ingestion _app_venv >/lib/python3.11/site-packages/chromadb/__init__.py
-	Paste the below line of code at top and save the changes.
__import__('pysqlite3')
import sys

sys.modules['sqlite3'] = sys.modules.pop('pysqlite3')

vii.	Setup cron job
	Edit the crontab
-	crontab -e
	Add the cron job
-	0 0 * * * /bin/bash -c “source /path/to/venv/< name_of_ ingestion _app_venv >/bin/activate && python3.11 /path/to/ingestion/directory/sharepoint_file_acquisition.py
                                                                                                           
	Save and exit
The script will run at midnight every day.
D.	Table Detection API
i.	Navigate to api directory
ii.	Create a venv 
	python3.11 -m venv /path/to/venv/<name_of_api_app_venv>
Replace /path/to/env with actual path where to create venv.
Replace < name_of_api_app_venv > with desired name environment.
iii.	Activate venv
	source /path/to/venv/< name_of_api_app_venv >/bin/activate
	python3.11 -m pip install -U pip
iv.	Install Dependencies
	pip install -r requirements.txt
v.	Create a service file for the fast Application
	sudo nano /etc/systemd/system/<name_of_api_app_service>.service
	Paste the below configurations

[Unit]                                                                                                                                                                                                                                       Description=Gunicorn instance serve Table Detection API                                                                                                                                                                                                 After=network.target                                                                                                                                                                                                                                                                                                                                                                                                                                                                      [Service]                                                                                                                                                                                                                                    User=<name_of_user> # example - mayank.sharma9@evalueserve.com                                                                                                                                                                                                          Group=www-data                                                                                                                                                                                                                               WorkingDirectory=/path/to/working/directory # example-/home/mayank.sharma9/GV/api                                                                                                                                                                                         Environment="PATH=/path/to/api_app_venv /bin" # example    -/home/mayank.sharma9/api_application/bin                                                                                                                                                                        ExecStart=/path/to/api_app_venv /bin/gunicorn image2table:app --workers 2 --worker-class uvicorn.workers.UvicornWorker --preload --bind 0.0.0.0:8183   # example - /home/mayank.sharma9/api_application                                                        
Restart=on-failure                                                                                                                                                                                                                                                                                                                                                                                                                                                                        [Install]                                                                                                                                                                                                                                    WantedBy=multi-user.target

vi.	Reload system manager configuration and start the Table API service
	sudo system daemon-reload
	sudo systemctl start <name_of_api_app_service>.service
	sudo systemctl enable <name_of_api_app_service>.service

10.	Setting up nginx 
•	Create a new configuration file for nginx
-	sudo nano /etc/nginx/sites-available/GatesVentures
•	Add the following configuration
server {                                                                                                                                                                                                                                         listen 80;                                                                                                                                                                                                                                   server_name https://scientia-docx-stg.gates.ventures;                                                                                                                                                                                                                                                                                                                                                                                                                                     ssl_protocols TLSv1.2 TLSv1.3;                                                                                                                                                                                                                                                                                                                                                                                                                                                            ssl_certificate /path/to/fast/directory/certificates/certificate.pem;                                                                                                                                                                   ssl_certificate_key / path/to/fast/directory/certificates/private_key.pem;                                                                                                                                                                                                                                                                                                                                                                                                            location /express{                                                                                                                                                                                                                                   proxy_pass https://localhost:8080;                                                                                                                                                                                                           proxy_http_version 1.1;                                                                                                                                                                                                                      proxy_set_header Upgrade $http_upgrade;                                                                                                                                                                                                      proxy_set_header Connection 'upgrade';                                                                                                                                                                                                       proxy_set_header Host $host;                                                                                                                                                                                                                 proxy_cache_bypass $http_upgrade;                                                                                                                                                                                                    }                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         location /fast{                                                                                                                                                                                                                                      proxy_pass http://127.0.0.1:6677;                                                                                                                                                                                                            proxy_set_header Host $host;                                                                                                                                                                                                                 proxy_set_header X-Real-IP $remote_addr;                                                                                                                                                                                                     proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;                                                                                                                                                                                 proxy_set_header X-Forwarded-Proto $scheme;                                                                                                                                                                                                  proxy_buffering off;                                                                                                                                                                                                                         proxy_cache off;                                                                                                                                                                                                                             proxy_request_buffering off;                                                                                                                                                                                                         }                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     }                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      
•	Enable configuration by creating a symbolic link to sites-enabled
-	Sudo ln -s /etc/nginx/sites-available/GatesVentures /etc/nginx/sites-enabled/
•	Test the configuration for syntax errors
-	sudo nginx -t
•	Reload nginx to apply the changes
-	sudo systemctl reload nginx

