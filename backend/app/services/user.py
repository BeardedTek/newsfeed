import logging
import traceback
import random
import string
import base64
import httpx
import hashlib
from fastapi import HTTPException, UploadFile
from fastapi.responses import JSONResponse
from app.config import get_settings
from app.auth.casdoor_sdk import get_casdoor_sdk
from typing import Optional, Dict, Any, List
from sqlalchemy.orm import Session
from sqlalchemy import and_
from app.models.database import CustomCategory

logger = logging.getLogger(__name__)

class UserService:
    """Service for user profile operations."""
    
    @staticmethod
    def is_admin(user: Dict[str, Any]) -> bool:
        """Check if a user has admin role."""
        if not user:
            return False
        
        # Check if the user has the admin role
        user_roles = user.get("roles", [])
        return any(r.get("name") == "admin" for r in user_roles)
    
    @staticmethod
    def get_user_id_for_get(user_id: str, request_id: str) -> str:
        """Format a user ID for the get_user operation in Casdoor SDK.
        
        The get_user operation expects a username format.
        """
        logger.debug(f"[{request_id}] Formatting user ID for get_user: {user_id}")
        
        # For get_user, we should use the username
        if "/" not in user_id:
            # Already in username format
            return user_id
        else:
            # If it's in org/name format, we need to extract just the username
            parts = user_id.split("/")
            # Return the last part which should be the username
            return parts[-1]
    
    @staticmethod
    def get_user_id_for_update(user_id: str, request_id: str) -> str:
        """Format a user ID for the update_user operation in Casdoor SDK.
        
        The update_user operation expects an org/name format.
        """
        logger.debug(f"[{request_id}] Formatting user ID for update_user: {user_id}")
        settings = get_settings()
        org_name = settings.casdoor_org_name
        
        formatted_user_id = user_id
        if "/" not in user_id:
            # Simple case: no organization prefix, add it
            formatted_user_id = f"{org_name}/{user_id}"
            logger.info(f"[{request_id}] Reformatted user ID from {user_id} to: {formatted_user_id}")
        else:
            # Handle case where user_id already contains organization name
            parts = user_id.split("/")
            
            # Check for duplicate organization prefixes or malformed IDs
            if len(parts) > 2:
                # Case like "org/org/username" or more segments
                # Take the last part as the username and use org_name as prefix
                formatted_user_id = f"{org_name}/{parts[-1]}"
                logger.info(f"[{request_id}] Fixed malformed user ID from {user_id} to: {formatted_user_id}")
            elif len(parts) == 2 and parts[0] == org_name:
                # Case like "org/username" - already correct format
                formatted_user_id = user_id
            elif len(parts) == 2:
                # Case with wrong organization prefix
                formatted_user_id = f"{org_name}/{parts[1]}"
                logger.info(f"[{request_id}] Corrected organization in user ID from {user_id} to: {formatted_user_id}")
        
        return formatted_user_id
    
    @staticmethod
    def format_user_id(user_id: str, request_id: str) -> str:
        """Format a user ID to ensure it's in the correct format for Casdoor.
        
        This is a legacy method that defaults to the update_user format.
        """
        logger.debug(f"[{request_id}] Formatting user ID: {user_id}")
        return UserService.get_user_id_for_update(user_id, request_id)
    
    @staticmethod
    def get_gravatar_url(email: str, size: int = 200) -> str:
        """Generate a Gravatar URL for an email address."""
        # Create an MD5 hash of the email
        email_hash = hashlib.md5(email.lower().encode()).hexdigest()
        
        # Return the Gravatar URL
        return f"https://www.gravatar.com/avatar/{email_hash}?s={size}&d=identicon"
    
    @staticmethod
    async def get_profile(user_id: str):
        """Get a user's profile from Casdoor."""
        request_id = __import__('os').urandom(4).hex()
        logger.info(f"[{request_id}] Getting profile for user: {user_id}")
        
        try:
            # Get the SDK instance
            sdk = get_casdoor_sdk()

            # Get the username from the user_id
            username = UserService.get_user_id_for_get(user_id, request_id)
            logger.debug(f"[{request_id}] Getting user with username: {username}")
            
            # Get the user from Casdoor using the username format
            casdoor_user = sdk.get_user(username)
            
            if not casdoor_user:
                logger.error(f"[{request_id}] User not found in Casdoor: {username}")
                return JSONResponse(
                    status_code=404,
                    content={"error": "User not found"}
                )
            logger.debug(f"[{request_id}] User found in Casdoor: {casdoor_user}")
            
            # Check if the user has a Gravatar
            gravatar_url = None
            if hasattr(casdoor_user, 'email') and casdoor_user.email:
                gravatar_url = UserService.get_gravatar_url(casdoor_user.email)
                # Since casdoor_user is an object, we need to convert it to a dict for the response
                user_dict = casdoor_user.to_dict()
                user_dict["gravatar_url"] = gravatar_url
                return {"data": user_dict}
            
            return {"data": casdoor_user.to_dict()}
            
        except Exception as e:
            logger.error(f"[{request_id}] Error getting profile: {str(e)}")
            logger.error(f"[{request_id}] Traceback: {traceback.format_exc()}")
            return JSONResponse(
                status_code=500,
                content={"error": f"An error occurred: {str(e)}"}
            )
    
    @staticmethod
    async def update_profile(user_id: str, data: Dict[str, Any], current_user: Dict[str, Any]):
        """Update a user profile in Casdoor."""
        request_id = __import__('os').urandom(4).hex()
        logger.info(f"[{request_id}] Starting profile update for user: {user_id}")
        
        # Verify the user is updating their own profile
        if user_id != current_user.get("name") and not UserService.is_admin(current_user):
            logger.warning(f"[{request_id}] Unauthorized profile update attempt: {user_id} by {current_user.get('name')}")
            return JSONResponse(
                status_code=403,
                content={"error": "You can only update your own profile"}
            )
        
        try:
            # Get the SDK instance
            sdk = get_casdoor_sdk()
            
            # Get the username from the user_id
            username = UserService.get_user_id_for_get(user_id, request_id)
            logger.debug(f"[{request_id}] Getting user with username: {username}")
            
            # Get the user from Casdoor using the username format
            casdoor_user = sdk.get_user(username)
            
            if not casdoor_user:
                logger.error(f"[{request_id}] User not found in Casdoor: {username}")
                return JSONResponse(
                    status_code=404,
                    content={"error": "User not found"}
                )
            
            # Update user fields - using setattr for object properties
            if "displayName" in data:
                setattr(casdoor_user, "displayName", data["displayName"])
            
            if "phone" in data:
                setattr(casdoor_user, "phone", data["phone"])
            
            if "address" in data and isinstance(data["address"], list):
                setattr(casdoor_user, "address", data["address"])
            
            if "avatar" in data and data["avatar"]:
                # If avatar is a base64 string, it will be handled by the upload-avatar endpoint
                # This is just for completeness if we need to set avatar URL directly
                setattr(casdoor_user, "avatar", data["avatar"])
            
            # For update_user, we need the org/name format
            # The update_user method will handle the formatting internally
            
            # Update the user in Casdoor
            result = sdk.update_user(casdoor_user)
            
            if not result:
                logger.error(f"[{request_id}] Failed to update user in Casdoor: {username}")
                return JSONResponse(
                    status_code=500,
                    content={"error": "Failed to update user profile"}
                )
            
            logger.info(f"[{request_id}] Successfully updated profile for user: {username}")
            return {"success": True, "message": "Profile updated successfully"}
            
        except Exception as e:
            logger.error(f"[{request_id}] Error updating profile: {str(e)}")
            logger.error(f"[{request_id}] Traceback: {traceback.format_exc()}")
            return JSONResponse(
                status_code=500,
                content={"error": f"An error occurred: {str(e)}"}
            )
    
    @staticmethod
    async def upload_avatar(user_id: str, file: UploadFile, current_user: Dict[str, Any]):
        """Upload a user avatar to Casdoor."""
        request_id = __import__('os').urandom(4).hex()
        logger.info(f"[{request_id}] Starting avatar upload for user: {user_id}")
        
        # Verify the user is updating their own avatar
        if user_id != current_user.get("name") and not UserService.is_admin(current_user):
            logger.warning(f"[{request_id}] Unauthorized avatar upload attempt: {user_id} by {current_user.get('name')}")
            return JSONResponse(
                status_code=403,
                content={"error": "You can only update your own avatar"}
            )
        
        try:
            # Get the SDK instance
            sdk = get_casdoor_sdk()
            
            # Read the file content
            file_content = await file.read()
            
            # Get the file extension
            file_extension = file.filename.split('.')[-1] if '.' in file.filename else ''
            
            # Get the username from the user_id
            username = UserService.get_user_id_for_get(user_id, request_id)
            
            # Format the user ID for upload_resource (needs org/name format)
            formatted_user_id = UserService.get_user_id_for_update(username, request_id)
            
            # Extract organization and username from formatted user ID
            parts = formatted_user_id.split("/", 1)
            owner = parts[0]  # Organization name
            user_name = parts[1]  # Username
            
            # Upload the avatar
            avatar_url = sdk.upload_resource("avatar", owner, user_name, file_content, file_extension)
            
            if not avatar_url:
                logger.error(f"[{request_id}] Failed to upload avatar for user: {username}")
                return JSONResponse(
                    status_code=500,
                    content={"error": "Failed to upload avatar"}
                )
            
            # Update the user's avatar URL in Casdoor
            # Get the user from Casdoor using the username format
            casdoor_user = sdk.get_user(username)
                
            if not casdoor_user:
                logger.error(f"[{request_id}] User not found in Casdoor after avatar upload: {username}")
                return JSONResponse(
                    status_code=404,
                    content={"error": "User not found"}
                )
            
            # Set avatar URL as an attribute
            setattr(casdoor_user, "avatar", avatar_url)
            
            # Update the user in Casdoor
            result = sdk.update_user(casdoor_user)
            
            if not result:
                logger.error(f"[{request_id}] Failed to update avatar URL for user: {username}")
                return JSONResponse(
                    status_code=500,
                    content={"error": "Failed to update avatar URL"}
                )
            
            logger.info(f"[{request_id}] Successfully uploaded avatar for user: {username}")
            return {"success": True, "avatarUrl": avatar_url}
            
        except Exception as e:
            logger.error(f"[{request_id}] Error uploading avatar: {str(e)}")
            logger.error(f"[{request_id}] Traceback: {traceback.format_exc()}")
            return JSONResponse(
                status_code=500,
                content={"error": f"An error occurred: {str(e)}"}
            )
    
    @staticmethod
    async def use_gravatar(user_id: str, current_user: Dict[str, Any]):
        """Set the user's avatar to their Gravatar."""
        request_id = __import__('os').urandom(4).hex()
        logger.info(f"[{request_id}] Setting Gravatar as avatar for user: {user_id}")
        
        # Verify the user is updating their own avatar
        if user_id != current_user.get("name") and not UserService.is_admin(current_user):
            logger.warning(f"[{request_id}] Unauthorized avatar update attempt: {user_id} by {current_user.get('name')}")
            return JSONResponse(
                status_code=403,
                content={"error": "You can only update your own avatar"}
            )
        
        try:
            # Get the SDK instance
            sdk = get_casdoor_sdk()
            
            # Get the username from the user_id
            username = UserService.get_user_id_for_get(user_id, request_id)
            
            # Get the user from Casdoor using the username format
            casdoor_user = sdk.get_user(username)
            
            if not casdoor_user:
                logger.error(f"[{request_id}] User not found in Casdoor: {username}")
                return JSONResponse(
                    status_code=404,
                    content={"error": "User not found"}
                )
            
            # Check if the user has an email
            if not hasattr(casdoor_user, 'email') or not casdoor_user.email:
                logger.error(f"[{request_id}] User has no email address: {username}")
                return JSONResponse(
                    status_code=400,
                    content={"error": "User has no email address for Gravatar"}
                )
            
            # Get the Gravatar URL
            gravatar_url = UserService.get_gravatar_url(casdoor_user.email)
            
            # Update the user's avatar URL in Casdoor
            setattr(casdoor_user, "avatar", gravatar_url)
            
            # Update the user in Casdoor
            result = sdk.update_user(casdoor_user)
            
            if not result:
                logger.error(f"[{request_id}] Failed to update avatar URL for user: {username}")
                return JSONResponse(
                    status_code=500,
                    content={"error": "Failed to update avatar URL"}
                )
            
            logger.info(f"[{request_id}] Successfully set Gravatar as avatar for user: {username}")
            return {"success": True, "avatarUrl": gravatar_url}
        
        except Exception as e:
            logger.error(f"[{request_id}] Error setting Gravatar: {str(e)}")
            logger.error(f"[{request_id}] Traceback: {traceback.format_exc()}")
            return JSONResponse(
                status_code=500,
                content={"error": f"An error occurred: {str(e)}"}
            )
    
    @staticmethod
    async def generate_avatar(user_id: str, prompt: Optional[str], current_user: Dict[str, Any]):
        """Generate an avatar for the user."""
        request_id = __import__('os').urandom(4).hex()
        logger.info(f"[{request_id}] Generating avatar for user: {user_id}")
        
        # Verify the user is updating their own avatar
        if user_id != current_user.get("name") and not UserService.is_admin(current_user):
            logger.warning(f"[{request_id}] Unauthorized avatar generation attempt: {user_id} by {current_user.get('name')}")
            return JSONResponse(
                status_code=403,
                content={"error": "You can only update your own avatar"}
            )
        
        try:
            # For now, just generate a random avatar using DiceBear
            # In the future, this could be replaced with an AI-generated avatar
            avatar_style = random.choice(["adventurer", "avataaars", "bottts", "identicon", "jdenticon", "gridy", "micah"])
            seed = ''.join(random.choices(string.ascii_lowercase + string.digits, k=10))
            
            avatar_url = f"https://api.dicebear.com/7.x/{avatar_style}/svg?seed={seed}"
            
            # Get the SDK instance
            sdk = get_casdoor_sdk()
            
            # Get the username from the user_id
            username = UserService.get_user_id_for_get(user_id, request_id)
            
            # Get the user from Casdoor
            casdoor_user = sdk.get_user(username)
            
            if not casdoor_user:
                logger.error(f"[{request_id}] User not found in Casdoor: {username}")
                return JSONResponse(
                    status_code=404,
                    content={"error": "User not found"}
                )
            
            # Update the user's avatar URL in Casdoor
            setattr(casdoor_user, "avatar", avatar_url)
            
            # Update the user in Casdoor
            result = sdk.update_user(casdoor_user)
            
            if not result:
                logger.error(f"[{request_id}] Failed to update avatar URL for user: {username}")
                return JSONResponse(
                    status_code=500,
                    content={"error": "Failed to update avatar URL"}
                )
            
            logger.info(f"[{request_id}] Successfully generated avatar for user: {username}")
            return {"success": True, "avatarUrl": avatar_url}
            
        except Exception as e:
            logger.error(f"[{request_id}] Error generating avatar: {str(e)}")
            logger.error(f"[{request_id}] Traceback: {traceback.format_exc()}")
            return JSONResponse(
                status_code=500,
                content={"error": f"An error occurred: {str(e)}"}
            )

class CustomCategoryService:
    """Service for custom category operations."""
    
    @staticmethod
    def get_user_categories(db: Session, user_id: str) -> List[Dict[str, Any]]:
        """Get all custom categories for a user."""
        categories = db.query(CustomCategory).filter(CustomCategory.user_id == user_id).all()
        return [
            {
                "id": cat.id,
                "name": cat.name,
                "sources": cat.sources,
                "categories": cat.categories,
                "search": cat.search,
                "created_at": cat.created_at,
                "updated_at": cat.updated_at
            }
            for cat in categories
        ]
    
    @staticmethod
    def get_category(db: Session, category_id: int, user_id: str) -> Dict[str, Any]:
        """Get a specific custom category."""
        category = db.query(CustomCategory).filter(
            and_(CustomCategory.id == category_id, CustomCategory.user_id == user_id)
        ).first()
        
        if not category:
            raise HTTPException(status_code=404, detail="Custom category not found")
        
        return {
            "id": category.id,
            "name": category.name,
            "sources": category.sources,
            "categories": category.categories,
            "search": category.search,
            "created_at": category.created_at,
            "updated_at": category.updated_at
        }
    
    @staticmethod
    def create_category(
        db: Session, 
        user_id: str, 
        name: str, 
        sources: List[str], 
        categories: List[str], 
        search: Optional[str] = None
    ) -> Dict[str, Any]:
        """Create a new custom category."""
        # Check if a category with this name already exists for the user
        existing = db.query(CustomCategory).filter(
            and_(CustomCategory.user_id == user_id, CustomCategory.name == name)
        ).first()
        
        if existing:
            raise HTTPException(status_code=400, detail="A category with this name already exists")
        
        # Create new category
        category = CustomCategory(
            user_id=user_id,
            name=name,
            sources=sources,
            categories=categories,
            search=search
        )
        
        db.add(category)
        db.commit()
        db.refresh(category)
        
        return {
            "id": category.id,
            "name": category.name,
            "sources": category.sources,
            "categories": category.categories,
            "search": category.search,
            "created_at": category.created_at,
            "updated_at": category.updated_at
        }
    
    @staticmethod
    def update_category(
        db: Session,
        category_id: int,
        user_id: str,
        name: Optional[str] = None,
        sources: Optional[List[str]] = None,
        categories: Optional[List[str]] = None,
        search: Optional[str] = None
    ) -> Dict[str, Any]:
        """Update an existing custom category."""
        category = db.query(CustomCategory).filter(
            and_(CustomCategory.id == category_id, CustomCategory.user_id == user_id)
        ).first()
        
        if not category:
            raise HTTPException(status_code=404, detail="Custom category not found")
        
        # Check if name is being changed and if it would conflict
        if name and name != category.name:
            existing = db.query(CustomCategory).filter(
                and_(CustomCategory.user_id == user_id, CustomCategory.name == name)
            ).first()
            
            if existing:
                raise HTTPException(status_code=400, detail="A category with this name already exists")
            
            category.name = name
        
        # Update other fields if provided
        if sources is not None:
            category.sources = sources
        
        if categories is not None:
            category.categories = categories
        
        if search is not None:
            category.search = search
        
        db.commit()
        db.refresh(category)
        
        return {
            "id": category.id,
            "name": category.name,
            "sources": category.sources,
            "categories": category.categories,
            "search": category.search,
            "created_at": category.created_at,
            "updated_at": category.updated_at
        }
    
    @staticmethod
    def delete_category(db: Session, category_id: int, user_id: str) -> Dict[str, bool]:
        """Delete a custom category."""
        category = db.query(CustomCategory).filter(
            and_(CustomCategory.id == category_id, CustomCategory.user_id == user_id)
        ).first()
        
        if not category:
            raise HTTPException(status_code=404, detail="Custom category not found")
        
        db.delete(category)
        db.commit()
        
        return {"success": True} 