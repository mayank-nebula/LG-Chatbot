def deterministic_encrypt(text: str, key: str) -> str:
    try:
        key_bytes = generate_deterministic_key(key)
        iv = b'\x00' * 16  # Fixed IV for deterministic encryption
        cipher = Cipher(algorithms.AES(key_bytes), modes.CBC(iv), backend=default_backend())
        encryptor = cipher.encryptor()

        # Padding to ensure the plaintext is a multiple of the block size (AES block size is 128 bits)
        padder = padding.PKCS7(128).padder()
        padded_data = padder.update(text.encode()) + padder.finalize()

        encrypted_data = encryptor.update(padded_data) + encryptor.finalize()
        return base64.urlsafe_b64encode(encrypted_data).decode()
    except Exception as e:
        logger.error(f"An error occurred while performing deterministic encryption: {str(e)}")
        raise e

# Deterministic decryption (for fixed IV encryption)
def deterministic_decrypt(encrypted_text: str, key: str) -> str:
    try:
        key_bytes = generate_deterministic_key(key)
        iv = b'\x00' * 16  # Fixed IV for deterministic encryption
        cipher = Cipher(algorithms.AES(key_bytes), modes.CBC(iv), backend=default_backend())
        decryptor = cipher.decryptor()

        encrypted_data = base64.urlsafe_b64decode(encrypted_text)

        # Decrypt and remove padding
        decrypted_padded_data = decryptor.update(encrypted_data) + decryptor.finalize()
        unpadder = padding.PKCS7(128).unpadder()
        decrypted_data = unpadder.update(decrypted_padded_data) + unpadder.finalize()

        return decrypted_data.decode()
    except Exception as e:
        logger.error(f"An error occurred while performing deterministic decryption: {str(e)}")
        raise e
