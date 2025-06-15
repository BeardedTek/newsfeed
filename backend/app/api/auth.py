from fastapi import APIRouter, Request
import httpx
import os
from fastapi import Depends

router = APIRouter()

@router.post("/casdoor/token")
async def casdoor_token_proxy(request: Request):
    form_data = await request.form()
    casdoor_url = f"{os.getenv('CASDOOR_ENDPOINT')}/api/login/oauth/access_token"
    async with httpx.AsyncClient() as client:
        try:
            resp = await client.post(
                casdoor_url,
                data=form_data,  # form-encoded
                headers={"Content-Type": "application/x-www-form-urlencoded"},
            )
            try:
                return resp.json()
            except Exception:
                return {
                    "error": "invalid_response",
                    "status_code": resp.status_code,
                    "content": resp.text,
                }
        except Exception as e:
            return {"error": "proxy_exception", "message": str(e)}

@router.get("/get-user")
def get_user(user=Depends(__import__('app.auth.casdoor', fromlist=['get_current_user']).get_current_user)):
    return {"data": user} 