import os
import uuid

from fastapi import APIRouter, Request, HTTPException
from fastapi.responses import RedirectResponse
from authlib.integrations.starlette_client import OAuth, OAuthError
from starlette.config import Config

router = APIRouter()

oauth = OAuth()

oauth.register(
    name="google",
    client_id=os.environ.get("GOOGLE_CLIENT_ID", ""),
    client_secret=os.environ.get("GOOGLE_CLIENT_SECRET", ""),
    server_metadata_url="https://accounts.google.com/.well-known/openid-configuration",
    client_kwargs={
        "scope": (
            "openid email profile "
            "https://www.googleapis.com/auth/gmail.modify "
            "https://www.googleapis.com/auth/gmail.send"
        )
    },
)

TOKEN_STORE = {}


@router.get("/login")
async def login(request: Request):
    redirect_uri = os.environ.get(
        "GOOGLE_REDIRECT_URI",
        "http://localhost:8000/auth/callback",
    )

    return await oauth.google.authorize_redirect(
        request,
        redirect_uri,
    )


@router.get("/callback")
async def auth_callback(request: Request):
    try:
        token = await oauth.google.authorize_access_token(request)
    except OAuthError as error:
        raise HTTPException(
            status_code=400,
            detail=error.error,
        )

    user = token.get("userinfo")

    if not user:
        raise HTTPException(
            status_code=400,
            detail="No user info in token",
        )

    session_id = request.session.get("session_id")

    if not session_id:
        session_id = str(uuid.uuid4())
        request.session["session_id"] = session_id

    TOKEN_STORE[session_id] = {
        "token": token,
        "user": dict(user),
    }

    frontend_url = os.environ.get(
        "CORS_ORIGINS",
        "http://localhost:3000",
    )

    return RedirectResponse(url=frontend_url)


@router.get("/status")
async def auth_status(request: Request):
    session_id = request.session.get("session_id")

    if not session_id or session_id not in TOKEN_STORE:
        return {"authenticated": False}

    user = TOKEN_STORE[session_id]["user"]

    return {
        "authenticated": True,
        "user": {
            "email": user.get("email"),
            "name": user.get("name"),
            "picture": user.get("picture"),
        },
    }


@router.post("/logout")
async def logout(request: Request):
    session_id = request.session.get("session_id")

    if session_id in TOKEN_STORE:
        del TOKEN_STORE[session_id]

    request.session.clear()

    return {"status": "logged_out"}