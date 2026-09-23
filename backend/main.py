import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.sessions import SessionMiddleware
from dotenv import load_dotenv

# Load env before importing other modules
load_dotenv()

from backend.gmail.oauth import router as oauth_router
from backend.gmail.messages import router as messages_router

app = FastAPI(title="Nebula Mail AI Backend")

# We need SessionMiddleware for OAuth flow state and to store a secure session cookie
# In production, use a secure secret key from env
SESSION_SECRET = os.environ.get("SESSION_SECRET", "super-secret-temporary-key-replace-me")
app.add_middleware(SessionMiddleware, secret_key=SESSION_SECRET)

# Setup CORS
origins = [
    os.getenv("CORS_ORIGINS", "http://localhost:3000")
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(oauth_router, prefix="/auth", tags=["Auth"])
app.include_router(messages_router, prefix="/api/messages", tags=["Messages"])

@app.get("/")
def read_root():
    return {"status": "ok"}
