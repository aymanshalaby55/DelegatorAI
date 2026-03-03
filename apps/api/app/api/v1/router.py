from fastapi import APIRouter
from .endpoints import health, user, meetings, webhooks


router = APIRouter()
router.include_router(health.router, prefix="/health", tags=["health"])
router.include_router(user.router, prefix="/users", tags=["user"])
router.include_router(meetings.router, prefix="/meetings", tags=["meetings"])
router.include_router(webhooks.router, prefix="/webhooks", tags=["webhooks"])
