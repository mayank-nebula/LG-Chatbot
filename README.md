import io
import base64
import logging
from cryptography.fernet import Fernet


def custom_key(key: str):
    try:
        custom_key_bytes = (key * (32 // len(key) + 1))[:32]
        return base64.urlsafe_b64encode(custom_key_bytes.encode())
    except Exception as e:
        logging.error(f"An error occurred while generating key: {str(e)}")
        raise e


def encrypt_file(filepath: str, key: str):
    try:
        custom_key_b64 = custom_key(key)
        fernet = Fernet(custom_key_b64)

        with open(filepath, "rb") as file:
            file_data = file.read()

        encrypt_data = fernet.encrypt(file_data)

        with open(filepath, "wb") as file:
            file.write(encrypt_data)
    except Exception as e:
        logging.error(f"An error occurred while encrypting: {str(e)}")
        raise e


def decrypt_file_in_memory(filepath: str, key: str):
    try:
        custom_key_b64 = custom_key(key)
        fernet = Fernet(custom_key_b64)

        with open(filepath, "rb") as file:
            encrypted_data = file.read()

        decrypted_data = fernet.decrypt(encrypted_data)

        return io.BytesIO(decrypted_data)
    except Exception as e:
        logging.error(f"An error occurred while decrypting: {str(e)}")
        raise e


def encrypt_string(text: str, key: str):
    try:
        custom_key_b64 = custom_key(key)
        fernet = Fernet(custom_key_b64)

        encrypted_data = fernet.encrypt(text.encode())
        return encrypted_data.decode()
    except Exception as e:
        logging.error(f"An error occurred while encrypting text: {str(e)}")
        raise e


def decrypt_string(encryped_text: str, key: str):
    try:
        custom_key_b64 = custom_key(key)
        fernet = Fernet(custom_key_b64)

        decrypted_data = fernet.decrypt(encryped_text.encode())
        return decrypted_data.decode()
    except Exception as e:
        logging.error(f"An error occurred while decrypting text: {str(e)}")
        raise e
