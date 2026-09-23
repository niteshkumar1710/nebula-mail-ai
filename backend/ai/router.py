import os
from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel
from google import genai
from google.genai import types

router = APIRouter()

class ChatRequest(BaseModel):
    message: str
    context: str | None = None

@router.post("/chat")
def ai_chat(req: ChatRequest):
    api_key = os.environ.get("GEMINI_API_KEY")
    if not api_key or api_key == "your_gemini_api_key_here":
        raise HTTPException(status_code=400, detail="Gemini API Key is not configured. Please add it to your .env file.")
    
    try:
        client = genai.Client(api_key=api_key)
        
        system_instruction = "You are a helpful AI assistant integrated into an email application. Help the user manage, read, and write emails."
        if req.context:
            system_instruction += f"\n\nHere is the user's current context (e.g., the email they are reading or looking at):\n{req.context}"
        
        response = client.models.generate_content(
            model='gemini-3.5-flash-lite',
            contents=req.message,
            config=types.GenerateContentConfig(
                system_instruction=system_instruction,
                temperature=0.7,
            )
        )
        return {"response": response.text}
    except Exception as e:
        print(f"Gemini API Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))
