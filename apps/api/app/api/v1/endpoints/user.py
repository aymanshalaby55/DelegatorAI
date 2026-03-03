from fastapi import APIRouter, Depends
from app.api.deps import get_current_user
from app.services.email_service.factory import EmailProviderFactory

router = APIRouter()


@router.get("/me")
async def get_me(user: dict = Depends(get_current_user)):
    await EmailProviderFactory.send_email(
        provider="resend",
        email=user["email"],
        subject="Welcome to Meeting Delegator",
        body={
            "id": "7a8863f5-3692-4a88-83cd-fb190f0987f3",
            "variables": {
                "name": "Ayman Shalaby",
                "logo_url": "https://drive.google.com/uc?export=view&id=1kPeLhMVoYnSddsI_pr8w1FdZanpvdOG3",
                "app_url": "https://localhost:3000",
            },
        },
    )
    return {
        "id": user["id"],
        "email": user["email"],
        "name": user["name"],
    }
