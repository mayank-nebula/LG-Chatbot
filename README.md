version: "3.3"

services:
  app:
    build:
      context: .
      dockerfile: Dockerfile
    ports:
      - "6969:6969"
    environment:
      ENV: production
      MONGODB_COLLECTION: "${MONGODB_COLLECTION}"
      MONGO_API_KEY: "${MONGO_API_KEY}"
      AZURE_OPENAI_API_VERSION: "${AZURE_OPENAI_API_VERSION}"
      AZURE_OPENAI_CHAT_DEPLOYMENT_NAME_GPT_35: "${AZURE_OPENAI_CHAT_DEPLOYMENT_NAME_GPT_35}"
      AZURE_OPENAI_CHAT_DEPLOYMENT_NAME_GPT_4O: "${AZURE_OPENAI_CHAT_DEPLOYMENT_NAME_GPT_4O}"
      AZURE_OPENAI_CHAT_DEPLOYMENT_NAME_EMBEDDING: "${AZURE_OPENAI_CHAT_DEPLOYMENT_NAME_EMBEDDING}"
      AZURE_OPENAI_ENDPOINT: "${AZURE_OPENAI_ENDPOINT}"
    volumes:
      - ./certificates:/app/certificates
      - ./csv:/app/csv
      - ./docstores:/app/docstores
    extra_hosts:
      - "host.docker.internal:host-gateway"
    restart: always

# remove extra_hosts in case of external mongo ip

FROM python:3.11.9

WORKDIR /app

RUN python -m venv /app/venv
RUN /app/venv/bin/pip install --upgrade pip

COPY requirements.txt .
RUN /app/venv/bin/pip install --no-cache-dir -r requirements.txt

COPY . .

COPY ./certificates /app/certificates

EXPOSE 6969

CMD ["/bin/sh", "-c","source /app/venv/bin/activate && uvicorn main:app --host 0.0.0.0 --port 6969 --ssl-keyfile /app/certificates/private-key.pem --ssl-certfile /app/certificates/certificate.pem --workers 4"]

