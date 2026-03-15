from datetime import datetime
from typing import Any, Optional

from pydantic import BaseModel


class ConnectResponse(BaseModel):
    """URL the frontend should redirect the browser to for OAuth authorization."""

    url: str


class IntegrationInfo(BaseModel):
    """Public-facing integration status. Never exposes tokens."""

    provider: str
    connected: bool
    connected_at: Optional[datetime] = None
    metadata: dict[str, Any] = {}


class IntegrationListResponse(BaseModel):
    integrations: list[IntegrationInfo]
