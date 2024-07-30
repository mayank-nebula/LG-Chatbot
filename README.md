server {
    listen 80;
    server_name your_domain.com;

    # Redirect all HTTP requests to HTTPS
    location / {
        return 301 https://$host$request_uri;
    }
}

server {
    listen 443 ssl;
    server_name your_domain.com;

    ssl_certificate /home/kamal/projects/florence/certs/certificate.pem;
    ssl_certificate_key /home/kamal/projects/florence/certs/private-key.pem;

    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_prefer_server_ciphers on;
    ssl_ciphers "ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384:DHE-RSA-AES256-GCM-SHA384:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES128-GCM-SHA256:DHE-RSA-AES128-GCM-SHA256:ECDHE-RSA-AES256-SHA384:ECDHE-ECDSA-AES256-SHA384:ECDHE-RSA-AES128-SHA256:ECDHE-ECDSA-AES128-SHA256";

    location / {
        proxy_pass http://127.0.0.1:6969;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # Disable buffering to enable streaming
        proxy_buffering off;
        proxy_cache off;
        proxy_request_buffering off;
    }
}





[Unit]
Description=Gunicorn instance to serve FastAPI
After=network.target

[Service]
User=kamal
Group=www-data
WorkingDirectory=/home/kamal/projects/florence
Environment="PATH=/home/kamal/anaconda3/envs/conda/bin:/home/kamal/.local/bin:/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin"
ExecStart=/home/kamal/anaconda3/envs/conda/bin/gunicorn -w 4 -k uvicorn.workers.UvicornWorker main:app --host 0.0.0.0 --port 6969 
Restart=always

[Install]
WantedBy=multi-user.target





# Create a directory to store the certificate and key
mkdir ~/certs
cd ~/certs

# Generate the private key
openssl genrsa -out private-key.pem 2048

# Generate the certificate signing request (CSR)
openssl req -new -key private-key.pem -out csr.pem

# Generate the self-signed certificate
openssl x509 -req -days 365 -in csr.pem -signkey private-key.pem -out certificate.pem
