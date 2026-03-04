from fastapi import APIRouter, Depends

from app.api.deps import get_current_user

from .endpoints import health, meetings, user, webhooks

public_router = APIRouter()
public_router.include_router(health.router, prefix="/health", tags=["health"])
public_router.include_router(webhooks.router, prefix="/webhooks", tags=["webhooks"])

# Protected routes
protected_router = APIRouter(dependencies=[Depends(get_current_user)])
protected_router.include_router(user.router, prefix="/users", tags=["user"])
protected_router.include_router(meetings.router, prefix="/meetings", tags=["meetings"])


router = APIRouter()
router.include_router(public_router)
router.include_router(protected_router)
