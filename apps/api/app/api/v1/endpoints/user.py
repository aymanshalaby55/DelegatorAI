from fastapi import APIRouter, Depends
from app.api.deps import get_current_user

router = APIRouter()


@router.get("/me")
async def get_me(user: dict = Depends(get_current_user)):
    return {
        "id": user["id"],
        "email": user["email"],
        "name": user["name"],
    }
