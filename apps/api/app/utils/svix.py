import logging
from fastapi import HTTPException, Request
from svix.webhooks import Webhook, WebhookVerificationError

logger = logging.getLogger(__name__)


def verify_svix_signature(secret: str, headers: dict, body: bytes) -> dict:
    wh = Webhook(secret)
    try:
        return wh.verify(body, headers)
    except WebhookVerificationError as e:
        logger.warning(f"Webhook signature verification failed: {e}")
        raise HTTPException(status_code=401, detail="Invalid webhook signature")


async def get_verified_payload(request: Request, secret: str | None) -> dict:
    body = await request.body()
    svix_headers = {
        "svix-id": request.headers.get("svix-id", ""),
        "svix-timestamp": request.headers.get("svix-timestamp", ""),
        "svix-signature": request.headers.get("svix-signature", ""),
    }
    if secret:
        return verify_svix_signature(secret, svix_headers, body)
    return await request.json()
