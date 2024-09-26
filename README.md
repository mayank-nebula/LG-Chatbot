# MongoDB connection string (Make sure to replace <username>, <password>, and <database> with actual values)
MONGO_API_KEY=mongodb://localhost:27017/
MONGODB_COLLECTION=Nebula9

# JWT Settings
SECRET_KEY=your_jwt_secret  # Replace with a strong, secret key
ACCESS_TOKEN_EXPIRE_MINUTES=30  # Expiration time for JWT tokens (in minutes)

# Azure AD OAuth credentials
AZURE_CLIENT_ID=your_azure_client_id  # Replace with actual Azure AD client ID
AZURE_CLIENT_SECRET=your_azure_client_secret  # Replace with actual Azure AD client secret
AZURE_TENANT_ID=your_azure_tenant_id  # Replace with actual Azure AD tenant ID
AZURE_REDIRECT_URI=https://your-app-url.com/callback/azure  # Replace with actual Azure AD redirect URI

# Google OAuth credentials
GOOGLE_CLIENT_ID=your_google_client_id  # Replace with actual Google OAuth client ID
GOOGLE_CLIENT_SECRET=your_google_client_secret  # Replace with actual Google OAuth client secret
GOOGLE_REDIRECT_URI=https://your-app-url.com/callback/google  # Replace with actual Google OAuth redirect URI

# Microsoft AD OAuth credentials
MS_AD_CLIENT_ID=14fa7d38-1b50-4e15-ae9e-a2d3544259c9  # Replace with actual Microsoft AD client ID
MS_AD_CLIENT_SECRET=I058Q~Nz7LtY3V1cJ8fBqfJOffHOAKMg4ulqba9n  # Replace with actual Microsoft AD client secret
MS_AD_TENANT_ID=992c0efe-d9fb-48d7-ab5e-5307182d72c8  # Replace with actual Microsoft AD tenant ID
MS_AD_REDIRECT_URI=http://localhost:5173/redirect-page  # Replace with actual Microsoft AD redirect URI

# Azure OpenAI Settings
AZURE_OPENAI_API_KEY=your_openai_api_key  # Replace with actual Azure OpenAI API key
AZURE_OPENAI_API_VERSION=v1  # Azure OpenAI API version (can be updated as needed)
AZURE_OPENAI_CHAT_DEPLOYMENT_NAME_GPT_4O=gpt-4-deployment  # Replace with your GPT-4 deployment name
AZURE_OPENAI_CHAT_DEPLOYMENT_NAME_EMBEDDING=embedding-deployment  # Replace with your embedding deployment name

# ChromaDB Settings
CHROMA_DB_HOST=localhost  # Set the ChromaDB host (replace with actual host if not localhost)
CHROMA_DB_PORT=8000  # Set the ChromaDB port (replace with actual port if needed)

# Custom security header (can be used for additional security configurations)
SECURITY_HEADER=your_custom_security_header  # Replace with a security header if needed

# SSL Settings (Optional, for use with SSL in production environments)
# SSL_CERTFILE=/app/certificates/certificate.cert  # Path to SSL certificate
# SSL_KEYFILE=/app/certificates/private.key  # Path to SSL key file

SMTP_SERVER=smtp.gmail.com  # For Gmail
SMTP_PORT=587  # TLS
SENDER_EMAIL=mayank2001sharma@gmail.com
SENDER_PASSWORD=dsecrvqovxswqglq

OPENAI_API_KEY=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
