import os
import logging
import smtplib
from dotenv import load_dotenv
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

load_dotenv()

SMTP_SERVER = os.getenv("SMTP_SERVER")
SMTP_PORT = int(os.getenv("SMTP_PORT"))
SENDER_EMAIL = os.getenv("SENDER_EMAIL")
SENDER_PASSWORD = os.getenv("SENDER_PASSWORD")


def send_reset_email(
    email: str,
    token: str,
):
    try:
        subject = "Password Reset Request"
        reset_url = f"http://localhost:5173/reset-password?token={token}"

        msg = MIMEMultipart()
        msg["From"] = SENDER_EMAIL
        msg["To"] = email
        msg["Subject"] = subject

        body = f"Click the link below to reset your password:\n\n{reset_url}"
        msg.attach(MIMEText(body, "plain"))

        with smtplib.SMTP(SMTP_SERVER, SMTP_PORT) as server:
            server.starttls()
            server.login(SENDER_EMAIL, SENDER_PASSWORD)
            server.sendmail(SENDER_EMAIL, email, msg.as_string())

        logging.info(f"Account verify email sent to {email}")

    except Exception as e:
        logging.error(f"Error sending email: {e}")


def send_register_email(
    email: str,
    token: str,
):
    try:
        subject = "Verify your account"
        reset_url = f"http://localhost:5173/verify-account?token={token}"

        msg = MIMEMultipart()
        msg["From"] = SENDER_EMAIL
        msg["To"] = email
        msg["Subject"] = subject

        body = f"Click the link below to verify your account:\n\n{reset_url}"
        msg.attach(MIMEText(body, "plain"))

        with smtplib.SMTP(SMTP_SERVER, SMTP_PORT) as server:
            server.starttls()
            server.login(SENDER_EMAIL, SENDER_PASSWORD)
            server.sendmail(SENDER_EMAIL, email, msg.as_string())

        logging.info(f"Password reset email sent to {email}")

    except Exception as e:
        logging.error(f"Error sending email: {e}")
