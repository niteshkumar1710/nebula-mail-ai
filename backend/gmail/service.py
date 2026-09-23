from google.oauth2.credentials import Credentials
from googleapiclient.discovery import build
import base64
import os

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

def parse_message_headers(headers):
    header_dict = {h['name'].lower(): h['value'] for h in headers}
    return {
        'subject': header_dict.get('subject', '(No Subject)'),
        'sender': header_dict.get('from', 'Unknown Sender'),
        'to': header_dict.get('to', ''),
        'date': header_dict.get('date', '')
    }

def get_email_body(payload):
    """
    Recursively extract the plain text body from the payload.
    """
    if 'parts' in payload:
        for part in payload['parts']:
            if part['mimeType'] == 'text/plain':
                data = part['body'].get('data')
                if data:
                    return base64.urlsafe_b64decode(data).decode('utf-8', errors='replace')
            elif 'parts' in part:
                # recurse into nested multipart
                body = get_email_body(part)
                if body and body != "Could not read email body.":
                    return body
                    
        # If no text/plain, try text/html
        for part in payload['parts']:
            if part['mimeType'] == 'text/html':
                data = part['body'].get('data')
                if data:
                    return base64.urlsafe_b64decode(data).decode('utf-8', errors='replace')

    elif 'body' in payload and 'data' in payload['body']:
        return base64.urlsafe_b64decode(payload['body']['data']).decode('utf-8', errors='replace')
        
    return "Could not read email body."
