import logging
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from typing import Optional, Dict, Any, List
from app.auth import get_current_user
from app.services.user import UserService

logger = logging.getLogger(__name__)
router = APIRouter()

class ProfileUpdateRequest(BaseModel):
    displayName: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[List[str]] = None
    avatar: Optional[str] = None

class AvatarGenerationRequest(BaseModel):
    prompt: Optional[str] = None

@router.get("/profile")
async def get_profile(current_user: Dict[str, Any] = Depends(get_current_user)):
    """Get the current user's profile."""
    if not current_user:
        return JSONResponse(
            status_code=401,
            content={"error": "Not authenticated"}
        )
    user_id = current_user.get("name")
    return await UserService.get_profile(user_id)

@router.post("/profile")
async def update_profile(
    data: ProfileUpdateRequest,
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """Update the current user's profile."""
    if not current_user:
        return JSONResponse(
            status_code=401,
            content={"error": "Not authenticated"}
        )
    
    user_id = current_user.get("name")
    return await UserService.update_profile(user_id, data.model_dump(exclude_none=True), current_user)

@router.post("/avatar")
async def upload_avatar(
    file: UploadFile = File(...),
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """Upload a custom avatar for the current user."""
    if not current_user:
        return JSONResponse(
            status_code=401,
            content={"error": "Not authenticated"}
        )
    
    user_id = current_user.get("name")
    return await UserService.upload_avatar(user_id, file, current_user)

@router.post("/use-gravatar")
async def use_gravatar(
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """Set the user's avatar to their Gravatar."""
    if not current_user:
        return JSONResponse(
            status_code=401,
            content={"error": "Not authenticated"}
        )
    
    user_id = current_user.get("name")
    return await UserService.use_gravatar(user_id, current_user)

@router.post("/generate-avatar")
async def generate_avatar(
    data: AvatarGenerationRequest,
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """Generate an avatar for the current user."""
    if not current_user:
        return JSONResponse(
            status_code=401,
            content={"error": "Not authenticated"}
        )
    
    user_id = current_user.get("name")
    return await UserService.generate_avatar(user_id, data.prompt, current_user) 