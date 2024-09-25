1. All previous conversations will be encrypted in mongodb, user will need to enter the key to decrypt the conversations at the start of the application. User key will be stored in case the user forgets and can be recovered using a security question that user need to enter, the user key will also be stored in encrypted manner in mongodb.
2. Each user will have different chromadb collection for the embeddings.
3. All the emails that user upload will be stored in encrypted manner, and user key for decryption.
4. JWT tokens for authentication and authorization
6. Can use Azure Key Vault to manage and rotate secrets

