Login Security:

JWT Token Authentication: Secure login is managed with JWT tokens, validating each request to prevent unauthorized access.
Password Hashing: User passwords are securely stored in a hashed format, making them unreadable even if accessed.
Azure AD Integration: Supports login with corporate credentials, providing centralized identity management and multi-factor authentication.
Data Encryption:

Encrypted Email and Attachments: All user-uploaded emails and their attachments are stored in an encrypted format, ensuring they are unreadable without decryption.
Data Isolation:

Separate Collections: Each user has individual MongoDB and ChromaDB collections for chats, files, and email metadata, ensuring complete data separation to prevent cross-access.
Data Deletion:

Complete Removal of Deleted Data: When users delete emails, all related content and metadata are permanently removed, leaving no residual information.
Encrypted Database Collections:

Encryption at Rest: MongoDB collections for chats and files are encrypted, so data remains unreadable even if accessed directly from the backend, providing an added layer of security.
Encrypted Request Logging:

Detailed Request Logs: Logs of each request made by every user are maintained, capturing essential request details for security monitoring.
Encrypted Logs: These logs are encrypted to protect sensitive information, ensuring log data is secure and unreadable without decryption.
