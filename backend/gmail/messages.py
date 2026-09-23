from fastapi import APIRouter, Request, HTTPException, Query
from backend.gmail.oauth import TOKEN_STORE
from backend.gmail.service import get_gmail_service, parse_message_headers, get_email_body

router = APIRouter()

def get_token(request: Request):
    session_id = request.session.get('session_id')
    if not session_id or session_id not in TOKEN_STORE:
        raise HTTPException(status_code=401, detail="Not authenticated")
    return TOKEN_STORE[session_id]['token']

@router.get("/")
def get_messages(request: Request, label: str = "INBOX", max_results: int = 15, query: str = ""):
    token = get_token(request)
    service = get_gmail_service(token)
    
    try:
        # If query is provided, it searches all emails matching the query.
        # Otherwise, falls back to the requested label (INBOX, SENT, etc.)
        kwargs = {"userId": "me", "maxResults": max_results}
        if query:
            kwargs["q"] = query
        elif label:
            kwargs["labelIds"] = [label]

        results = service.users().messages().list(**kwargs).execute()
        messages = results.get('messages', [])
        
        email_list = []
        for msg in messages:
            try:
                msg_data = service.users().messages().get(userId='me', id=msg['id'], format='full').execute()
                headers = parse_message_headers(msg_data['payload'].get('headers', []))
                
                # Extract basic info
                labels = msg_data.get('labelIds', [])
                is_read = 'UNREAD' not in labels
                
                email_list.append({
                    "id": msg_data['id'],
                    "sender": headers['sender'],
                    "recipients": [headers['to']] if headers['to'] else [],
                    "subject": headers['subject'],
                    "snippet": msg_data.get('snippet', ''),
                    "body": get_email_body(msg_data['payload']),
                    "date": headers['date'],
                    "read": is_read
                })
            except Exception as e:
                # Log the error but continue parsing other messages
                print(f"Error fetching message {msg['id']}: {e}")
                continue
                
        return {"emails": email_list}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
