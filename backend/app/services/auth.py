import logging
import json
import traceback
import random
import string
import base64
import httpx
from fastapi import Request, BackgroundTasks, HTTPException, Response, UploadFile, File
from fastapi.responses import JSONResponse
from app.config import get_settings
from app.auth.casdoor_sdk import get_async_casdoor_sdk, get_casdoor_sdk
import jwt
from datetime import datetime, timedelta
from typing import Optional, List, Dict, Any
import io
from PIL import Image, ImageDraw, ImageFont
import secrets
import hashlib

logger = logging.getLogger(__name__)

class AuthService:
    """Service for authentication operations."""
    
    @staticmethod
    async def verify_turnstile(token: str) -> bool:
        """Verify a Cloudflare Turnstile token."""
        try:
            settings = get_settings()
            
            # Skip verification if Turnstile is disabled
            if not settings.cloudflare_turnstile_enable:
                logger.info("Cloudflare Turnstile verification skipped (disabled by configuration)")
                return True
                
            secret_key = settings.cloudflare_turnstile_secret_key
            
            if not secret_key:
                logger.error("Cloudflare Turnstile secret key is not configured")
                return False
            
            # Prepare verification data
            data = {
                "secret": secret_key,
                "response": token,
            }
            
            # Send verification request to Cloudflare
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    "https://challenges.cloudflare.com/turnstile/v0/siteverify", 
                    data=data
                )
                
                result = response.json()
                
                if not result.get("success", False):
                    logger.error(f"Turnstile verification failed: {result}")
                    return False
                
                return True
                
        except Exception as e:
            logger.error(f"Error verifying Turnstile token: {str(e)}")
            return False
    
    @staticmethod
    async def casdoor_token_proxy(request: Request):
        """Proxy token request to Casdoor using the SDK."""
        form_data = await request.form()
        logger.debug(f"Token request form data: {dict(form_data)}")
        
        try:
            # Get the SDK instance
            sdk = get_async_casdoor_sdk()
            
            # Extract parameters from form data
            grant_type = form_data.get("grant_type")
            
            if grant_type == "authorization_code":
                code = form_data.get("code")
                redirect_uri = form_data.get("redirect_uri")
                
                if not code:
                    return {"error": "invalid_request", "error_description": "code is required"}
                
                # Get token using authorization code
                token_response = await sdk.get_oauth_token(code=code)
                return token_response
            
            elif grant_type == "password":
                username = form_data.get("username")
                password = form_data.get("password")
                
                if not username or not password:
                    return {"error": "invalid_request", "error_description": "username and password are required"}
                
                # Get token using password credentials
                token_response = await sdk.get_oauth_token(username=username, password=password)
                return token_response
            
            elif grant_type == "client_credentials":
                # Get token using client credentials
                token_response = await sdk.get_oauth_token()
                return token_response
            
            elif grant_type == "refresh_token":
                refresh_token = form_data.get("refresh_token")
                scope = form_data.get("scope", "")
                
                if not refresh_token:
                    return {"error": "invalid_request", "error_description": "refresh_token is required"}
                
                # Refresh the token
                token_response = await sdk.refresh_token_request(refresh_token, scope)
                return token_response
            
            else:
                return {"error": "unsupported_grant_type", "error_description": f"Grant type '{grant_type}' is not supported"}
                
        except Exception as e:
            logger.error(f"Error in casdoor_token_proxy: {str(e)}")
            return {"error": "server_error", "error_description": "An internal error occurred"}
    
    @staticmethod
    def set_auth_cookies(response: Response, access_token: str, refresh_token: str = None, expires_in: int = 3600):
        """Set authentication cookies on the response."""
        # Set secure and httpOnly cookies
        settings = get_settings()
        secure = settings.environment != "development"
        
        # Set the access token cookie
        response.set_cookie(
            key="auth_token",
            value=access_token,
            httponly=True,
            secure=secure,
            samesite="lax",
            max_age=expires_in,
            path="/"
        )
        
        # If refresh token is provided, set it as a cookie too
        if refresh_token:
            # Refresh token typically has a longer lifetime
            response.set_cookie(
                key="refresh_token",
                value=refresh_token,
                httponly=True,
                secure=secure,
                samesite="lax",
                max_age=expires_in * 2,  # Refresh token lives twice as long
                path="/"
            )

    @staticmethod
    def get_token_expiry(token: str) -> int:
        """Get token expiry timestamp from JWT token."""
        try:
            # Decode without verification (we just need the exp claim)
            payload = jwt.decode(token, options={"verify_signature": False})
            return payload.get("exp", 0)
        except Exception as e:
            logger.error(f"Error decoding token: {str(e)}")
            return 0

    @staticmethod
    async def refresh_token(refresh_token: str, response: Response):
        """Refresh the access token using a refresh token."""
        try:
            # Get the SDK instance
            sdk = get_async_casdoor_sdk()
            
            # Use the SDK to refresh the token
            token_data = await sdk.refresh_token_request(refresh_token)
            
            if "error" in token_data:
                logger.error(f"Casdoor refresh token error: {token_data['error']}")
                return JSONResponse(
                    status_code=400,
                    content={"error": f"Casdoor error: {token_data['error']}"}
                )
            
            access_token = token_data.get("access_token")
            new_refresh_token = token_data.get("refresh_token", refresh_token)
            expires_in = token_data.get("expires_in", 3600)
            
            if not access_token:
                logger.error("No access token in refresh response")
                return JSONResponse(
                    status_code=400,
                    content={"error": "No access token in response"}
                )
            
            # Parse the JWT token to get user info
            user_data = sdk.parse_jwt_token(access_token)
            
            # Set the cookies on the response
            AuthService.set_auth_cookies(response, access_token, new_refresh_token, expires_in)
            
            # Get token expiry for the frontend
            token_expiry = AuthService.get_token_expiry(access_token)
            
            # Return user data and token expiry
            return {
                "user": user_data,
                "tokenExpiry": token_expiry
            }
            
        except Exception as e:
            logger.error(f"Error refreshing token: {str(e)}")
            return JSONResponse(
                status_code=500,
                content={"error": f"Error refreshing token: {str(e)}"}
            )
    
    @staticmethod
    async def casdoor_callback(request: Request, background_tasks: BackgroundTasks, response: Response):
        """Handle the callback from Casdoor after user authentication using the SDK."""
        request_id = __import__('os').urandom(4).hex()  # Generate a unique ID for this request
        logger.info(f"[{request_id}] Starting Casdoor callback processing")
        
        try:
            # Get the data from the request
            data = await request.json()
            code = data.get("code")
            state = data.get("state")
            redirect_uri = data.get("redirectUri")

            logger.info(f"[{request_id}] Received callback with code: {code[:5] if code else None}..., state: {state}, redirect_uri: {redirect_uri}")

            if not code or not state or not redirect_uri:
                missing = []
                if not code: missing.append("code")
                if not state: missing.append("state")
                if not redirect_uri: missing.append("redirectUri")
                
                logger.warning(f"[{request_id}] Missing required parameters: {', '.join(missing)}")
                return JSONResponse(
                    status_code=400,
                    content={"error": f"Missing required parameters: {', '.join(missing)}"}
                )

            # Get the SDK instance
            sdk = get_async_casdoor_sdk()
            
            # Exchange the code for a token using the SDK
            try:
                token_data = await sdk.get_oauth_token(code=code)
                
                if "error" in token_data:
                    logger.error(f"[{request_id}] Casdoor token error: {token_data['error']}")
                    return JSONResponse(
                        status_code=400,
                        content={"error": f"Casdoor error: {token_data['error']}"}
                    )
                
                access_token = token_data.get("access_token")
                refresh_token = token_data.get("refresh_token")
                expires_in = token_data.get("expires_in", 3600)
                
                if not access_token:
                    logger.error(f"[{request_id}] No access token in response")
                    return JSONResponse(
                        status_code=400,
                        content={"error": "No access token in response"}
                    )
                
                # Parse the JWT token to get user info
                user_data = sdk.parse_jwt_token(access_token)
                
                # Set the cookies on the response
                AuthService.set_auth_cookies(response, access_token, refresh_token, expires_in)
                
                # Get token expiry for the frontend
                token_expiry = AuthService.get_token_expiry(access_token)
                
                # Return user data and token expiry
                return {
                    "user": user_data,
                    "tokenExpiry": token_expiry
                }
                
            except Exception as e:
                logger.error(f"[{request_id}] Error getting token: {str(e)}")
                return JSONResponse(
                    status_code=500,
                    content={"error": f"Error getting token: {str(e)}"}
                )
                
        except Exception as e:
            logger.error(f"[{request_id}] Error in casdoor_callback: {str(e)}")
            return JSONResponse(
                status_code=500,
                content={"error": f"Error in casdoor_callback: {str(e)}"}
            )
    
    @staticmethod
    def is_admin(user: Dict[str, Any]) -> bool:
        """Check if the user is an admin."""
        if not user:
            return False
            
        # Check if the user has the admin role
        roles = user.get("roles", [])
        if "admin" in roles:
            return True
            
        return False
    
    @staticmethod
    async def update_profile(user_id: str, profile_data: Dict[str, Any], current_user: Dict[str, Any]):
        """Update the user's profile in Casdoor."""
        try:
            # Get the SDK instance
            sdk = get_async_casdoor_sdk()
            
            # Get the user from Casdoor
            user_response = await sdk.get_user(user_id)
            if "error" in user_response:
                logger.error(f"Casdoor get user error: {user_response['error']}")
                return JSONResponse(
                    status_code=400,
                    content={"error": f"Casdoor error: {user_response['error']}"}
                )
            
            # Update the user object with the new profile data
            user_object = user_response.get("data", {})
            for key, value in profile_data.items():
                user_object[key] = value
            
            # Update the user in Casdoor
            update_response = await sdk.update_user(user_object)
            if "error" in update_response:
                logger.error(f"Casdoor update user error: {update_response['error']}")
                return JSONResponse(
                    status_code=400,
                    content={"error": f"Casdoor error: {update_response['error']}"}
                )
            
            return {"success": True, "message": "Profile updated successfully"}
            
        except Exception as e:
            logger.error(f"Error updating profile: {str(e)}")
            return JSONResponse(
                status_code=500,
                content={"error": f"Error updating profile: {str(e)}"}
            )
    
    @staticmethod
    async def upload_avatar(user_id: str, file: UploadFile, current_user: Dict[str, Any]):
        """Upload avatar for the user to Casdoor."""
        try:
            # Get the SDK instance
            sdk = get_async_casdoor_sdk()
            
            # Read the file content
            file_content = await file.read()
            
            # Upload the avatar to Casdoor
            upload_response = await sdk.upload_avatar(user_id, file_content, file.filename)
            if "error" in upload_response:
                logger.error(f"Casdoor upload avatar error: {upload_response['error']}")
                return JSONResponse(
                    status_code=400,
                    content={"error": f"Casdoor error: {upload_response['error']}"}
                )
            
            # Get the avatar URL from the response
            avatar_url = upload_response.get("data", {}).get("url", "")
            if not avatar_url:
                logger.error("No avatar URL in response")
                return JSONResponse(
                    status_code=400,
                    content={"error": "No avatar URL in response"}
                )
            
            # Update the user's avatar in Casdoor
            user_response = await sdk.get_user(user_id)
            if "error" in user_response:
                logger.error(f"Casdoor get user error: {user_response['error']}")
                return JSONResponse(
                    status_code=400,
                    content={"error": f"Casdoor error: {user_response['error']}"}
                )
            
            user_object = user_response.get("data", {})
            user_object["avatar"] = avatar_url
            
            update_response = await sdk.update_user(user_object)
            if "error" in update_response:
                logger.error(f"Casdoor update user error: {update_response['error']}")
                return JSONResponse(
                    status_code=400,
                    content={"error": f"Casdoor error: {update_response['error']}"}
                )
            
            return {"success": True, "avatar": avatar_url}
            
        except Exception as e:
            logger.error(f"Error uploading avatar: {str(e)}")
            return JSONResponse(
                status_code=500,
                content={"error": f"Error uploading avatar: {str(e)}"}
            )
    
    @staticmethod
    async def custom_signin(username: str, password: str, response: Response):
        """Custom sign-in that checks if the email is verified."""
        try:
            # Get the SDK instance
            sdk = get_async_casdoor_sdk()
            
            # Try to get a token using password credentials
            token_data = await sdk.get_oauth_token(username=username, password=password)
            
            if "error" in token_data:
                logger.error(f"Casdoor token error: {token_data['error']}")
                return JSONResponse(
                    status_code=400,
                    content={"error": f"Casdoor error: {token_data['error']}"}
                )
            
            access_token = token_data.get("access_token")
            refresh_token = token_data.get("refresh_token")
            expires_in = token_data.get("expires_in", 3600)
            
            if not access_token:
                logger.error("No access token in response")
                return JSONResponse(
                    status_code=400,
                    content={"error": "No access token in response"}
                )
            
            # Parse the JWT token to get user info
            user_data = sdk.parse_jwt_token(access_token)
            
            # Check if email is verified
            user_id = user_data.get("id")
            if user_id:
                try:
                    user_response = await sdk.get_user(user_id)
                    
                    # Check if user_response is None or doesn't have the expected structure
                    if not user_response:
                        logger.warning(f"Null user response for user_id: {user_id}")
                    elif "data" not in user_response:
                        logger.warning(f"User response missing 'data' field for user_id: {user_id}, response: {user_response}")
                    else:
                        user_object = user_response.get("data", {})
                        
                        # Check if the user has properties and if the email_verified property is false
                        if user_object.get("properties") and user_object.get("properties", {}).get("email_verified") == "false":
                            return JSONResponse(
                                status_code=403,
                                content={
                                    "error": "Email not verified",
                                    "email": user_object.get("email", "")
                                }
                            )
                except Exception as e:
                    logger.error(f"Error getting user details: {str(e)}")
                    # Continue with sign-in even if we can't verify email
            
            # Set the cookies on the response
            AuthService.set_auth_cookies(response, access_token, refresh_token, expires_in)
            
            # Get token expiry for the frontend
            token_expiry = AuthService.get_token_expiry(access_token)
            
            # Return user data and token expiry
            return {
                "user": user_data,
                "tokenExpiry": token_expiry
            }
            
        except Exception as e:
            logger.error(f"Error in custom_signin: {str(e)}")
            return JSONResponse(
                status_code=500,
                content={"error": f"Error in custom_signin: {str(e)}"}
            ) 