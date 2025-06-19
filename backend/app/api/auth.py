from fastapi import APIRouter, Depends, Request, BackgroundTasks, Response, Cookie, HTTPException, UploadFile, File, Form
from fastapi.responses import JSONResponse
import httpx
import logging
import os
from app.config import get_settings, Settings
from app.api import debug_log
import json
import traceback
from app.services.auth import AuthService
from app.auth.casdoor_sdk import get_current_user, get_casdoor_sdk
from typing import Optional, List, Dict, Any
from pydantic import BaseModel

logger = logging.getLogger(__name__)

router = APIRouter()

class ProfileUpdateData(BaseModel):
    displayName: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[List[str]] = None
    avatar: Optional[str] = None

@router.post("/token")
async def token(request: Request):
    """
    Proxy token requests to Casdoor.
    """
    logger.debug(f"Received token request with headers: {request.headers}")
    return await AuthService.casdoor_token_proxy(request)

@router.get("/get-user")
def get_user(user=Depends(get_current_user)):
    """
    Get the current authenticated user.
    """
    return {"data": user}

@router.post("/callback")
async def casdoor_callback(request: Request, background_tasks: BackgroundTasks, response: Response):
    """
    Handle the callback from Casdoor after user authentication.
    """
    logger.debug(f"Received callback request with headers: {request.headers}")
    return await AuthService.casdoor_callback(request, background_tasks, response)

@router.post("/refresh-token")
async def refresh_token(request: Request, response: Response):
    """
    Refresh the access token using a refresh token.
    """
    logger.debug(f"Received refresh token request with headers: {request.headers}")
    # Get the refresh token from the cookie
    refresh_token = request.cookies.get("refresh_token")
    if not refresh_token:
        logger.warning("No refresh_token cookie found in request")
        return {"error": "No refresh token provided"}
    
    return await AuthService.refresh_token(refresh_token, response)

@router.post("/logout")
async def logout(response: Response):
    """
    Log out the user by clearing the auth cookies.
    """
    logger.debug("Received logout request")
    # Clear the auth cookies
    response.delete_cookie(key="auth_token", path="/")
    response.delete_cookie(key="refresh_token", path="/")
    
    return {"success": True}

@router.post("/update-profile")
async def update_profile(
    data: ProfileUpdateData,
    user: Dict[str, Any] = Depends(get_current_user)
):
    """
    Update the user's profile information in Casdoor.
    """
    user_id = user.get("id")
    if not user_id:
        raise HTTPException(status_code=401, detail="Invalid user ID")
    
    return await AuthService.update_profile(user_id, data.dict(exclude_none=True), user)

@router.post("/upload-avatar")
async def upload_avatar(
    file: UploadFile = File(...),
    user: Dict[str, Any] = Depends(get_current_user)
):
    """
    Upload a new avatar for the user to Casdoor.
    """
    user_id = user.get("id")
    if not user_id:
        raise HTTPException(status_code=401, detail="Invalid user ID")
    
    # Check file size (limit to 2MB)
    max_size = 2 * 1024 * 1024  # 2MB
    file_size = 0
    chunk = await file.read(1024)
    while chunk:
        file_size += len(chunk)
        if file_size > max_size:
            raise HTTPException(status_code=400, detail="File too large (max 2MB)")
        chunk = await file.read(1024)
    
    # Reset file position
    await file.seek(0)
    
    # Check file type
    allowed_types = ["image/jpeg", "image/png", "image/gif", "image/svg+xml"]
    content_type = file.content_type
    if content_type not in allowed_types:
        raise HTTPException(status_code=400, detail="Invalid file type. Only JPEG, PNG, GIF, and SVG are allowed.")
    
    return await AuthService.upload_avatar(user_id, file, user)

@router.get("/debug-cookies")
async def debug_cookies(request: Request):
    """
    Debug endpoint to check cookies.
    """
    cookies = request.cookies
    headers = dict(request.headers)
    logger.debug(f"Cookies: {cookies}")
    logger.debug(f"Headers: {headers}")
    
    return {
        "cookies": cookies,
        "auth_token_present": "auth_token" in cookies,
        "refresh_token_present": "refresh_token" in cookies,
        "authorization_header": headers.get("authorization", "Not present")
    } 