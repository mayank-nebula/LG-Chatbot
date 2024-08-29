FROM python:3.11.9

WORKDIR /app

RUN python -m venv /app/venv
RUN /app/venv/bin/pip install --upgrade pip

COPY requirements.txt .
RUN /app/venv/bin/pip install --no-cache-dir -r requirements.txt

COPY . .

COPY ./certificates /app/certificates

EXPOSE 6969

CMD ["/bin/bash", "-c","source /app/venv/bin/activate && uvicorn main:app --host 0.0.0.0 --port 6969 --ssl-keyfile /app/certificates/private-key.pem --ssl-certfile /app/certificates/certificate.pem --workers 4"]
