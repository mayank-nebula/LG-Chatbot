Here’s a detailed explanation of the User Settings:

1. Delete All Data:
Complete Data Erasure: Users will have an option to delete all their data. When this is selected, the system will automatically erase:
All MongoDB data (e.g., conversations, user information).
All ChromaDB embeddings.
All uploaded emails stored in Azure Blob Storage.
Irreversibility: This action will be irreversible, meaning once the data is deleted, it cannot be recovered.
2. Delete Specific Email:
Targeted Deletion: Users will have the ability to delete specific emails from the Azure Blob Storage.
Selective Control: This option allows users to manage their uploaded emails individually, offering greater flexibility in controlling which data is retained and which is removed.
Encrypted Deletion: The deletion process will ensure that both the encrypted and decrypted forms of the email are removed from storage.
3. Manual/Automatic Deletion of Chats:
Manual/Automatic Settings: Users can set up either manual or automatic deletion of their chat history.
Manual Deletion: Users can select and delete specific conversations.
Automatic Deletion: Users can set a time interval (e.g., after 30 days, 60 days) for the system to automatically delete all past chat data.
Secure Data Handling: Even in automatic deletion, the system will ensure secure removal from MongoDB and associated ChromaDB embeddings.
4. Optional: Manual Sign-In with MongoDB (Reset/Forgot/Change Password):
Reset/Forgot Password: If the manual sign-in feature is used, users will have the ability to reset or retrieve a forgotten password.
Security Question: To recover the password, users will need to answer a security question set during account creation.
Email/OTP Verification: Optional multi-step verification (email or OTP) can be included for added security.
Change Password: Users will also be able to change their password from within the user settings. The new password will be securely hashed before being stored in MongoDB, ensuring it is never stored as plain text.
Secure Access Control: All authentication and authorization processes will continue to be managed with JWT tokens.
