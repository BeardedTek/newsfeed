import os
from fastapi import Depends, HTTPException, status, Request
import jwt
from jwt import PyJWKClient

CASDOOR_CERT_PUBLIC_KEY = os.getenv("CASDOOR_CERT_PUBLIC_KEY")
CASDOOR_CLIENT_ID = os.getenv("CASDOOR_CLIENT_ID")

# Use PyJWT to verify JWTs signed by Casdoor

def get_current_user(request: Request):
    auth = request.headers.get("Authorization")
    if not auth or not auth.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Not authenticated")
    token = auth.split(" ", 1)[1]
    try:
        payload = jwt.decode(token, CASDOOR_CERT_PUBLIC_KEY, algorithms=["RS256"], audience=CASDOOR_CLIENT_ID)
    except Exception as e:
        raise HTTPException(status_code=401, detail=f"Invalid token: {str(e)}")
    return payload

def require_role(roles):
    def dependency(user=Depends(get_current_user)):
        # Casdoor puts roles in the 'roles' claim (array of dicts)
        user_roles = user.get("roles", [])
        # Accept if any role name matches
        if not any(r.get("name") in roles for r in user_roles):
            raise HTTPException(status_code=403, detail="Insufficient permissions")
        return user
    return dependency 