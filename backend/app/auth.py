from fastapi import HTTPException, Header
import os
import httpx

async def verify_auth_key(auth_key: str = Header(..., alias="X-Auth-Key")):
    # Fetch the user's key from Casdoor using the provided auth key
    casdoor_endpoint = os.getenv("CASDOOR_ENDPOINT")
    if not casdoor_endpoint:
        raise HTTPException(status_code=500, detail="Casdoor endpoint not configured")
    
    # Example: Call Casdoor API to verify the auth key
    # This is a placeholder. Replace with actual Casdoor API call.
    async with httpx.AsyncClient() as client:
        response = await client.get(f"{casdoor_endpoint}/api/userinfo", headers={"Authorization": f"Bearer {auth_key}"})
        if response.status_code != 200:
            raise HTTPException(status_code=401, detail="Invalid auth key")
        # Optionally, you can extract user details from the response
        user_data = response.json()
        # For now, we just return the auth key if the call succeeds
        return auth_key 