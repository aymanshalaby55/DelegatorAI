from app.api.deps import get_current_user
from fastapi import APIRouter, Depends

from .endpoints import health, integrations, meetings, tasks, user, webhooks

public_router = APIRouter()
public_router.include_router(health.router, prefix="/health", tags=["health"])
public_router.include_router(webhooks.router, prefix="/webhooks", tags=["webhooks"])
# OAuth callback is public — the browser redirect carries no Bearer token;
# identity is verified via the signed state JWT instead.
public_router.include_router(
    integrations.callback_router, prefix="/integrations", tags=["integrations"]
)

# Protected routes
protected_router = APIRouter(dependencies=[Depends(get_current_user)])
protected_router.include_router(user.router, prefix="/users", tags=["user"])
protected_router.include_router(meetings.router, prefix="/meetings", tags=["meetings"])
protected_router.include_router(
    integrations.router, prefix="/integrations", tags=["integrations"]
)
protected_router.include_router(tasks.router, prefix="/tasks", tags=["tasks"])


router = APIRouter()
router.include_router(public_router)
router.include_router(protected_router)
