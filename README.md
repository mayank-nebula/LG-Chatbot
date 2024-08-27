version: "3.3"

services:
  app:
    build:
      context: .
      dockerfile: Dockerfile
    ports:
      - "8443:6969"
    environment:
      ENV: production
      MONGODB_COLLECTION: "${MONGODB_COLLECTION}"
      MONGO_API_KEY: "${MONGO_API_KEY}"
      AZURE_OPENAI_API_VERSION: "${AZURE_OPENAI_API_VERSION}"
      AZURE_OPENAI_CHAT_DEPLOYMENT_NAME_GPT_35: "${AZURE_OPENAI_CHAT_DEPLOYMENT_NAME_GPT_35}"
      AZURE_OPENAI_CHAT_DEPLOYMENT_NAME_GPT_4O: "${AZURE_OPENAI_CHAT_DEPLOYMENT_NAME_GPT_4O}"
      AZURE_OPENAI_CHAT_DEPLOYMENT_NAME_EMBEDDING: "${AZURE_OPENAI_CHAT_DEPLOYMENT_NAME_EMBEDDING}"
      AZURE_OPENAI_ENDPOINT: "${AZURE_OPENAI_ENDPOINT}"
      # CHROMA_HOST: chroma
      # CHROMA_PORT: 8000
    volumes:
      - ./certificates:/app/certificates
      - ./csv:/app/csv
      - ./docstores:/app/docstores
    # depends_on:
    #   - chroma
    extra_hosts:
      - "host.docker.internal:host-gateway"
    restart: always
  
  # chroma:
  #   image: chromadb/chroma:latest
  #   volumes:
  #     - chroma_data:/chroma/chroma
  #   ports:
  #     - "8000:8000"
  #   environment:
  #     - ALLOW_RESET=true
  #   restart: always

# remove extra_hosts in case of external mongo ip
