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
                
                # Return user data and token expiry to the client
                logger.info(f"[{request_id}] Authentication successful for user: {user_data.get('name', 'unknown')}")
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
                
        except json.JSONDecodeError as e:
            logger.error(f"[{request_id}] JSON decode error: {str(e)}")
            return JSONResponse(
                status_code=400,
                content={"error": "Invalid JSON in request body"}
            )
        except Exception as e:
            logger.error(f"[{request_id}] Error in Casdoor callback: {str(e)}")
            logger.error(f"[{request_id}] Traceback: {traceback.format_exc()}")
            return JSONResponse(
                status_code=500,
                content={"error": f"An error occurred: {str(e)}"}
            )

    @staticmethod
    def is_admin(user: Dict[str, Any]) -> bool:
        """Check if the user has admin role."""
        if not user or "roles" not in user:
            return False
        
        # Check if the user has any admin role
        for role in user.get("roles", []):
            if isinstance(role, dict) and role.get("name", "").lower() in ["admin", "administrator"]:
                return True
        
        return False 

    @staticmethod
    async def update_profile(user_id: str, profile_data: Dict[str, Any], current_user: Dict[str, Any]):
        """Update a user's profile in Casdoor."""
        try:
            # Get the SDK instance
            sdk = get_async_casdoor_sdk()
            
            # First, get the user from Casdoor
            user_response = await sdk.get_user(user_id)
            
            if not user_response or "name" not in user_response:
                logger.error(f"Failed to get user {user_id} from Casdoor")
                return JSONResponse(
                    status_code=404,
                    content={"error": "User not found"}
                )
            
            # Update the user object with the provided data
            for key, value in profile_data.items():
                if key in ["displayName", "phone", "address", "avatar"]:
                    user_response[key] = value
            
            # Update the user in Casdoor
            update_response = await sdk.update_user(user_response)
            
            if "data" in update_response:
                return {"success": True, "user": update_response["data"]}
            else:
                logger.error(f"Failed to update user: {update_response}")
                return JSONResponse(
                    status_code=500,
                    content={"error": "Failed to update user profile"}
                )
                
        except Exception as e:
            logger.error(f"Error updating profile: {str(e)}")
            return JSONResponse(
                status_code=500,
                content={"error": f"Error updating profile: {str(e)}"}
            )
    
    @staticmethod
    async def upload_avatar(user_id: str, file: UploadFile, current_user: Dict[str, Any]):
        """Upload a user's avatar to Casdoor."""
        try:
            # Get the SDK instance
            sdk = get_async_casdoor_sdk()
            
            # Read file content
            content = await file.read()
            
            # Upload the file to Casdoor
            filename = f"avatar_{user_id}_{int(datetime.now().timestamp())}"
            upload_response = await sdk.upload_resource(filename, content)
            
            if not upload_response or "data" not in upload_response:
                logger.error(f"Failed to upload avatar: {upload_response}")
                return JSONResponse(
                    status_code=500,
                    content={"error": "Failed to upload avatar"}
                )
            
            # Get the URL of the uploaded file
            avatar_url = upload_response["data"]
            
            # Update the user's avatar
            return await AuthService.update_profile(user_id, {"avatar": avatar_url}, current_user)
            
        except Exception as e:
            logger.error(f"Error uploading avatar: {str(e)}")
            return JSONResponse(
                status_code=500,
                content={"error": f"Error uploading avatar: {str(e)}"}
            )
    
    @staticmethod
    async def create_user_with_email_verification(username: str, password: str, display_name: str, email: str):
        """Create a new user with email verification required."""
        try:
            # Get the SDK instance
            sdk = get_async_casdoor_sdk()
            settings = get_settings()
            
            # Check if username or email already exists
            existing_user = await sdk.get_user(username)
            if existing_user and "name" in existing_user:
                return JSONResponse(
                    status_code=400,
                    content={"error": "Username already exists"}
                )
            
            # Check for existing email
            users_with_email = await sdk.get_users(f"email={email}")
            if users_with_email and len(users_with_email) > 0:
                return JSONResponse(
                    status_code=400,
                    content={"error": "Email already in use"}
                )
            
            # Create user object
            user = {
                "owner": settings.casdoor_org_name,
                "name": username,
                "password": password,
                "displayName": display_name,
                "email": email,
                "emailVerified": False,  # Email not verified yet
                "isAdmin": False,
                "isForbidden": False,
                "isDeleted": False,
                "signupApplication": settings.casdoor_app_name
            }
            
            # Add the user to Casdoor
            add_response = await sdk.add_user(user)
            
            if "data" not in add_response:
                logger.error(f"Failed to create user: {add_response}")
                return JSONResponse(
                    status_code=500,
                    content={"error": "Failed to create user"}
                )
            
            # Generate verification token
            verification_token = secrets.token_urlsafe(32)
            
            # Create verification URL
            frontend_url = settings.frontend_url
            verification_url = f"{frontend_url}/verify-email?token={verification_token}"
            
            # Store token in Casdoor (using the affiliation field temporarily)
            user_id = add_response["data"]
            user["id"] = user_id
            user["affiliation"] = verification_token  # Store token in affiliation field
            await sdk.update_user(user)
            
            # Send verification email
            email_subject = "Verify your email address"
            email_content = f"""
            <h2>Email Verification</h2>
            <p>Hello {display_name},</p>
            <p>Thank you for registering. Please click the link below to verify your email address:</p>
            <p><a href="{verification_url}">Verify Email</a></p>
            <p>This link will expire in 24 hours.</p>
            """
            
            await sdk.send_email(
                title=email_subject,
                content=email_content,
                sender="",  # Use default sender
                receiver=email
            )
            
            return {
                "success": True,
                "message": "User created successfully. Please check your email to verify your account."
            }
            
        except Exception as e:
            logger.error(f"Error creating user: {str(e)}")
            return JSONResponse(
                status_code=500,
                content={"error": f"Error creating user: {str(e)}"}
            )
    
    @staticmethod
    async def verify_email(token: str):
        """Verify a user's email using the verification token."""
        try:
            # Get the SDK instance
            sdk = get_async_casdoor_sdk()
            settings = get_settings()
            
            # Find user with this verification token
            users = await sdk.get_users(f"affiliation={token}")
            
            if not users or len(users) == 0:
                return JSONResponse(
                    status_code=400,
                    content={"error": "Invalid or expired verification token"}
                )
            
            user = users[0]
            
            # Update user to mark email as verified
            user["emailVerified"] = True
            user["affiliation"] = ""  # Clear the token
            
            # Update the user in Casdoor
            update_response = await sdk.update_user(user)
            
            if "data" not in update_response:
                logger.error(f"Failed to verify email: {update_response}")
                return JSONResponse(
                    status_code=500,
                    content={"error": "Failed to verify email"}
                )
            
            return {
                "success": True,
                "message": "Email verified successfully. You can now log in."
            }
            
        except Exception as e:
            logger.error(f"Error verifying email: {str(e)}")
            return JSONResponse(
                status_code=500,
                content={"error": f"Error verifying email: {str(e)}"}
            )
    
    @staticmethod
    async def resend_verification_email(email: str):
        """Resend verification email to a user."""
        try:
            # Get the SDK instance
            sdk = get_async_casdoor_sdk()
            settings = get_settings()
            
            # Find user with this email
            users = await sdk.get_users(f"email={email}")
            
            if not users or len(users) == 0:
                return JSONResponse(
                    status_code=404,
                    content={"error": "User not found"}
                )
            
            user = users[0]
            
            # Check if email is already verified
            if user.get("emailVerified", False):
                return JSONResponse(
                    status_code=400,
                    content={"error": "Email is already verified"}
                )
            
            # Generate new verification token
            verification_token = secrets.token_urlsafe(32)
            
            # Create verification URL
            frontend_url = settings.frontend_url
            verification_url = f"{frontend_url}/verify-email?token={verification_token}"
            
            # Update token in Casdoor
            user["affiliation"] = verification_token
            await sdk.update_user(user)
            
            # Send verification email
            email_subject = "Verify your email address"
            email_content = f"""
            <h2>Email Verification</h2>
            <p>Hello {user.get('displayName', '')},</p>
            <p>Please click the link below to verify your email address:</p>
            <p><a href="{verification_url}">Verify Email</a></p>
            <p>This link will expire in 24 hours.</p>
            """
            
            await sdk.send_email(
                title=email_subject,
                content=email_content,
                sender="",  # Use default sender
                receiver=email
            )
            
            return {
                "success": True,
                "message": "Verification email sent. Please check your inbox."
            }
            
        except Exception as e:
            logger.error(f"Error resending verification: {str(e)}")
            return JSONResponse(
                status_code=500,
                content={"error": f"Error resending verification: {str(e)}"}
            )
    
    @staticmethod
    async def custom_signin(username: str, password: str, response: Response):
        """Custom sign-in that checks if email is verified."""
        try:
            # Get the SDK instance
            sdk = get_async_casdoor_sdk()
            
            # First, get the user to check if email is verified
            user = await sdk.get_user(username)
            
            if not user or "name" not in user:
                return JSONResponse(
                    status_code=401,
                    content={"error": "Invalid username or password"}
                )
            
            # Check if email is verified
            if not user.get("emailVerified", False):
                return JSONResponse(
                    status_code=403,
                    content={"error": "Email not verified", "email": user.get("email", "")}
                )
            
            # Get token using password credentials
            token_data = await sdk.get_oauth_token(username=username, password=password)
            
            if "error" in token_data:
                logger.error(f"Casdoor token error: {token_data['error']}")
                return JSONResponse(
                    status_code=401,
                    content={"error": "Invalid username or password"}
                )
            
            access_token = token_data.get("access_token")
            refresh_token = token_data.get("refresh_token")
            expires_in = token_data.get("expires_in", 3600)
            
            if not access_token:
                logger.error("No access token in response")
                return JSONResponse(
                    status_code=500,
                    content={"error": "Authentication error"}
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
            logger.error(f"Error in custom signin: {str(e)}")
            return JSONResponse(
                status_code=500,
                content={"error": f"Authentication error: {str(e)}"}
            ) 