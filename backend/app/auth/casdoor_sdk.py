from casdoor import CasdoorSDK, AsyncCasdoorSDK
from fastapi import Depends, HTTPException, status, Request
from app.config import get_settings
import logging

logger = logging.getLogger(__name__)

def get_casdoor_sdk():
    """
    Get a configured CasdoorSDK instance
    """
    settings = get_settings()
    
    # Create SDK instance
    sdk = CasdoorSDK(
        endpoint=settings.casdoor_endpoint,
        client_id=settings.casdoor_client_id,
        client_secret=settings.casdoor_client_secret,
        certificate=settings.casdoor_cert,
        org_name=settings.casdoor_org_name,
        application_name=settings.casdoor_app_name,
    )
    
    return sdk

def get_async_casdoor_sdk():
    """
    Get a configured AsyncCasdoorSDK instance
    """
    settings = get_settings()
    
    # Create SDK instance
    sdk = AsyncCasdoorSDK(
        endpoint=settings.casdoor_endpoint,
        client_id=settings.casdoor_client_id,
        client_secret=settings.casdoor_client_secret,
        certificate=settings.casdoor_cert,
        org_name=settings.casdoor_org_name,
        application_name=settings.casdoor_app_name,
    )
    
    return sdk

def get_current_user(request: Request, sdk: CasdoorSDK = Depends(get_casdoor_sdk)):
    """
    Get the current user from the request using Casdoor SDK
    """
    # First try to get token from cookie
    token = request.cookies.get("auth_token")
    
    # If not in cookie, try the Authorization header (for backward compatibility)
    if not token:
        auth = request.headers.get("Authorization")
        if not auth or not auth.startswith("Bearer "):
            raise HTTPException(status_code=401, detail="Not authenticated")
        token = auth.split(" ", 1)[1]
    
    try:
        # Parse the JWT token using the SDK
        user_info = sdk.parse_jwt_token(token)
        return user_info
    except Exception as e:
        logger.error(f"Error parsing JWT token: {str(e)}")
        raise HTTPException(status_code=401, detail=f"Invalid token: {str(e)}")

def require_role(roles):
    """
    Dependency for requiring specific roles
    """
    def dependency(user=Depends(get_current_user)):
        # Casdoor puts roles in the 'roles' claim (array of dicts)
        user_roles = user.get("roles", [])
        # Accept if any role matches
        if not any(r.get("name") in roles for r in user_roles):
            raise HTTPException(status_code=403, detail="Insufficient permissions")
        return user
    return dependency 