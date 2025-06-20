import logging
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, Request
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from typing import Optional, Dict, Any, List
from app.auth import get_current_user
from app.services.user import UserService, CustomCategoryService
from sqlalchemy.orm import Session
from app.database import get_db

logger = logging.getLogger(__name__)
router = APIRouter()

class ProfileUpdateRequest(BaseModel):
    displayName: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[List[str]] = None
    avatar: Optional[str] = None

class AvatarGenerationRequest(BaseModel):
    prompt: Optional[str] = None

class CustomCategoryCreate(BaseModel):
    name: str
    sources: List[str]
    categories: List[str]
    search: Optional[str] = None

class CustomCategoryUpdate(BaseModel):
    name: Optional[str] = None
    sources: Optional[List[str]] = None
    categories: Optional[List[str]] = None
    search: Optional[str] = None

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

@router.get("/custom-categories")
async def get_user_custom_categories(
    db: Session = Depends(get_db),
    user = Depends(get_current_user)
):
    """
    Get all custom categories for the current user.
    """
    user_id = user.get("id")
    if not user_id:
        raise HTTPException(status_code=401, detail="Invalid user ID")
    
    return CustomCategoryService.get_user_categories(db, user_id)

@router.get("/custom-categories/{category_id}")
async def get_custom_category(
    category_id: int,
    db: Session = Depends(get_db),
    user = Depends(get_current_user)
):
    """
    Get a specific custom category.
    """
    user_id = user.get("id")
    if not user_id:
        raise HTTPException(status_code=401, detail="Invalid user ID")
    
    return CustomCategoryService.get_category(db, category_id, user_id)

@router.post("/custom-categories")
async def create_custom_category(
    category: CustomCategoryCreate,
    db: Session = Depends(get_db),
    user = Depends(get_current_user)
):
    """
    Create a new custom category.
    """
    user_id = user.get("id")
    if not user_id:
        raise HTTPException(status_code=401, detail="Invalid user ID")
    
    return CustomCategoryService.create_category(
        db, 
        user_id, 
        category.name, 
        category.sources, 
        category.categories, 
        category.search
    )

@router.put("/custom-categories/{category_id}")
async def update_custom_category(
    category_id: int,
    category: CustomCategoryUpdate,
    db: Session = Depends(get_db),
    user = Depends(get_current_user)
):
    """
    Update an existing custom category.
    """
    user_id = user.get("id")
    if not user_id:
        raise HTTPException(status_code=401, detail="Invalid user ID")
    
    return CustomCategoryService.update_category(
        db,
        category_id,
        user_id,
        category.name,
        category.sources,
        category.categories,
        category.search
    )

@router.delete("/custom-categories/{category_id}")
async def delete_custom_category(
    category_id: int,
    db: Session = Depends(get_db),
    user = Depends(get_current_user)
):
    """
    Delete a custom category.
    """
    user_id = user.get("id")
    if not user_id:
        raise HTTPException(status_code=401, detail="Invalid user ID")
    
    return CustomCategoryService.delete_category(db, category_id, user_id) 