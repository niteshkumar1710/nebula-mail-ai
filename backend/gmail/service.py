from google.oauth2.credentials import Credentials
from googleapiclient.discovery import build
import base64
import os
from email.message import EmailMessage

def get_gmail_service(token_info):
    """
    Given the token dictionary, construct Google Credentials and return a Gmail API service.
    """
    # authlib token might not have client_id inside it directly, 
    # but we can pass it from env if google library needs it for refresh.
    creds = Credentials(
        token=token_info.get('access_token'),
        refresh_token=token_info.get('refresh_token'),
        token_uri="https://oauth2.googleapis.com/token",
        client_id=os.environ.get('GOOGLE_CLIENT_ID'),
        client_secret=os.environ.get('GOOGLE_CLIENT_SECRET')
    )
    service = build('gmail', 'v1', credentials=creds)
    return service

from email.utils import parseaddr

def parse_message_headers(headers):
    header_dict = {h['name'].lower(): h['value'] for h in headers}
    
    sender_raw = header_dict.get('from', 'Unknown Sender')
    _, sender_email = parseaddr(sender_raw)
    sender = sender_email if sender_email else sender_raw

    return {
        'subject': header_dict.get('subject', '(No Subject)'),
        'sender': sender,
        'to': header_dict.get('to', ''),
        'date': header_dict.get('date', '')
    }

def get_email_body(payload):
    """
    Recursively extract the plain text body from the payload.
    """
    if 'parts' in payload:
        # First try text/html
        for part in payload['parts']:
            if part['mimeType'] == 'text/html':
                data = part['body'].get('data')
                if data:
                    return base64.urlsafe_b64decode(data).decode('utf-8', errors='replace')
            elif 'parts' in part:
                # recurse into nested multipart
                body = get_email_body(part)
                if body and body != "Could not read email body.":
                    return body
                    
        # If no text/html, try text/plain
        for part in payload['parts']:
            if part['mimeType'] == 'text/plain':
                data = part['body'].get('data')
                if data:
                    return base64.urlsafe_b64decode(data).decode('utf-8', errors='replace')

    elif 'body' in payload and 'data' in payload['body']:
        return base64.urlsafe_b64decode(payload['body']['data']).decode('utf-8', errors='replace')
        
    return "Could not read email body."

def create_message(sender, to, subject, message_text, thread_id=None):
    """Create a message for an email."""
    message = EmailMessage()
    message.set_content(message_text)
    message['To'] = to
    message['From'] = sender
    message['Subject'] = subject

    encoded_message = base64.urlsafe_b64encode(message.as_bytes()).decode()
    
    msg_body = {'raw': encoded_message}
    if thread_id:
        msg_body['threadId'] = thread_id
        
    return msg_body

def send_message(service, user_id, message):
    """Send an email message."""
    try:
        message = (service.users().messages().send(userId=user_id, body=message).execute())
        return message
    except Exception as error:
        print(f"An error occurred: {error}")
        raise error
