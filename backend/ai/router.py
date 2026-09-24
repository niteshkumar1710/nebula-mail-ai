import os
import json
from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel, Field
from google import genai
from google.genai import types
from backend.gmail.messages import get_token
from backend.gmail.service import get_gmail_service, create_message, send_message

router = APIRouter()

class ChatMessage(BaseModel):
    role: str
    content: str

class ChatRequest(BaseModel):
    message: str
    context: str | None = None
    history: list[ChatMessage] = []

class UIActionPayload(BaseModel):
    to: str | None = None
    subject: str | None = None
    body: str | None = None
    email_id: str | None = None
    query: str | None = None

class AIResponseSchema(BaseModel):
    assistant_message: str
    ui_action: str = Field(description="One of: none, open_compose, fill_compose, search, open_email")
    ui_action_payload: UIActionPayload | None = None
    backend_action: str = Field(description="One of: none, send_email")
    backend_action_payload: UIActionPayload | None = None

@router.post("/chat")
def ai_chat(req: ChatRequest, request: Request):
    api_key = os.environ.get("GEMINI_API_KEY")
    if not api_key or api_key == "your_gemini_api_key_here":
        raise HTTPException(status_code=400, detail="Gemini API Key is not configured. Please add it to your .env file.")
    
    try:
        client = genai.Client(api_key=api_key)
        
        system_instruction = """
You are a helpful AI assistant integrated into an email application. Help the user manage, read, and write emails.
When the user wants to compose an email, you should output ui_action="fill_compose" with the required fields (to, subject, body), and ask them for confirmation.
ONLY AFTER the user explicitly confirms (e.g., "Yes, send it"), you should output backend_action="send_email" with the payload.
DO NOT claim an email was sent unless you actually use the backend_action="send_email" and it succeeds.
Your response must strictly match the AIResponseSchema JSON format.
"""
        if req.context:
            system_instruction += f"\n\nHere is the user's current UI context:\n{req.context}"

        # Construct full conversation history
        contents = []
        for msg in req.history:
            role = "user" if msg.role == "user" else "model"
            # Attempt to parse json strings back to plain text if previous assistant messages were JSON
            # In our frontend, assistant_message is just text, so this is fine.
            contents.append(types.Content(role=role, parts=[types.Part.from_text(text=msg.content)]))
            
        contents.append(types.Content(role="user", parts=[types.Part.from_text(text=req.message)]))
        
        response = client.models.generate_content(
            model='gemini-3.6-flash',
            contents=contents,
            config=types.GenerateContentConfig(
                system_instruction=system_instruction,
                temperature=0.2,
                response_mime_type="application/json",
                response_schema=AIResponseSchema,
            )
        )
        
        ai_resp = json.loads(response.text)
        
        # Intercept backend actions
        if ai_resp.get("backend_action") == "send_email" and ai_resp.get("backend_action_payload"):
            payload = ai_resp["backend_action_payload"]
            try:
                token = get_token(request)
                service = get_gmail_service(token)
                msg_body = create_message(
                    sender="me",
                    to=payload.get("to", ""),
                    subject=payload.get("subject", ""),
                    message_text=payload.get("body", "")
                )
                result = send_message(service, "me", msg_body)
                
                ai_resp["assistant_message"] = f"Email sent successfully! (Message ID: {result['id']})"
                
            except Exception as e:
                ai_resp["assistant_message"] = f"I tried to send the email, but Gmail rejected the request: {str(e)}"
                ai_resp["backend_action"] = "none" 
        
        return ai_resp
        
    except Exception as e:
        print(f"Gemini API Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))
