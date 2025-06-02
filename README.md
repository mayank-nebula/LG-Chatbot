server {
    listen 80;
    listen [::]:80;
    server_name _;

    root /usr/share/nginx/html;
    index index.html;

    server_tokens off;

    # Enable Gzip (except for streamed responses)
    gzip on;
    gzip_types text/plain text/css application/json application/javascript;
    gzip_vary on;
    gzip_min_length 1024;

    # Security headers (optional, recommended)
    add_header X-Content-Type-Options nosniff always;
    add_header X-Frame-Options DENY always;
    add_header X-XSS-Protection "1; mode=block" always;

    location / {
        try_files $uri $uri/ /index.html;
    }

    # Static assets - aggressive caching
    location ~* \.(?:js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        access_log off;
        expires 1y;
        add_header Cache-Control "public, immutable" always;
    }

    # HTML files - no caching
    location ~* \.html$ {
        expires -1;
        add_header Cache-Control "no-cache, no-store, must-revalidate" always;
        add_header Pragma "no-cache" always;
    }

    # API - strictly no caching
    location /api/ {
        proxy_pass http://backend:3000/;

        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        proxy_http_version 1.1;
        proxy_buffering off;
        proxy_request_buffering off;
        proxy_cache off;

        proxy_connect_timeout 60s;
        proxy_send_timeout 300s;
        proxy_read_timeout 300s;

        add_header Cache-Control "no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0" always;
        add_header Pragma "no-cache" always;
        add_header Expires 0 always;
    }

    # Deny access to hidden files (e.g., .env, .git)
    location ~ /\. {
        deny all;
    }

    # Favicon – don't log or cache aggressively
    location = /favicon.ico {
        log_not_found off;
        access_log off;
    }
}
