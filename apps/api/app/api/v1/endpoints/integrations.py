import logging

from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import RedirectResponse
from supabase import AsyncClient

from app.api.deps import get_current_user
from app.core.config import Settings, get_settings
from app.db.supabase.client import get_supabase_client
from app.models.ApiResponse import ApiResponse, success_response
from app.models.integrations.schemas import (
    ConnectResponse,
    IntegrationInfo,
    IntegrationListResponse,
)
from app.integrations.manager import IntegrationManager, get_integration_manager
from app.utils.oauthToken import (
    _create_state_token,
    _require_supported_provider,
    _verify_state_token,
)

logger = logging.getLogger(__name__)

router = APIRouter()
callback_router = APIRouter()


@router.get("/", response_model=ApiResponse)
async def list_integrations(
    current_user: dict = Depends(get_current_user),
    manager: IntegrationManager = Depends(get_integration_manager),
) -> ApiResponse:
    """List all connected integrations for the authenticated user."""
    rows = await manager.get_user_integrations(current_user["id"])
    connected_providers = {row["provider"] for row in rows}
    row_by_provider = {row["provider"]: row for row in rows}

    integrations = [
        IntegrationInfo(
            provider=p,
            connected=p in connected_providers,
            connected_at=(
                row_by_provider[p].get("created_at")
                if p in connected_providers
                else None
            ),
            metadata=(
                {
                    k: v
                    for k, v in (row_by_provider[p].get("metadata") or {}).items()
                    if k not in ("access_token", "refresh_token")
                }
                if p in connected_providers
                else {}
            ),
        )
        for p in IntegrationManager.supported_providers()
    ]

    return success_response(
        "Integrations retrieved successfully",
        IntegrationListResponse(integrations=integrations).model_dump(),
    )


@router.get("/connect/{provider}", response_model=ApiResponse)
async def connect_integration(
    provider: str,
    current_user: dict = Depends(get_current_user),
    settings: Settings = Depends(get_settings),
) -> ApiResponse:
    """Return the OAuth authorization URL for the given provider."""
    _require_supported_provider(provider)

    manager = IntegrationManager(None, settings)  # type: ignore[arg-type]
    state = _create_state_token(current_user["id"], provider, settings.nextauth_secret)
    integration_provider = manager.get_provider(provider)
    oauth_url = integration_provider.get_oauth_url(state)

    return success_response(
        "OAuth URL generated",
        ConnectResponse(url=oauth_url).model_dump(),
    )


@router.delete("/{provider}", response_model=ApiResponse)
async def disconnect_integration(
    provider: str,
    current_user: dict = Depends(get_current_user),
    manager: IntegrationManager = Depends(get_integration_manager),
) -> ApiResponse:
    """Disconnect (remove) a provider integration for the authenticated user."""
    _require_supported_provider(provider)

    existing = await manager.get_integration(current_user["id"], provider)
    if not existing:
        raise HTTPException(
            status_code=404,
            detail=f"No active {provider} integration found.",
        )

    await manager.delete_integration(current_user["id"], provider)
    return success_response(
        f"{provider.capitalize()} integration disconnected successfully."
    )


@callback_router.get("/callback/{provider}")
async def oauth_callback(
    provider: str,
    code: str = Query(..., description="Authorization code from the OAuth provider"),
    state: str = Query(..., description="Signed JWT state parameter"),
    settings: Settings = Depends(get_settings),
    supabase: AsyncClient = Depends(get_supabase_client),
) -> RedirectResponse:
    """
    Handle the OAuth provider redirect after user authorization.

    Flow:
    1. Verify signed state token
    2. Exchange authorization code for tokens
    3. Let the provider normalize tokens and fetch its own metadata
    4. Persist and redirect

    This handler is completely provider-agnostic — adding a new provider
    requires no changes here.
    """
    _require_supported_provider(provider)

    state_data = _verify_state_token(state, settings.nextauth_secret)
    user_id: str = state_data["sub"]
    state_provider: str = state_data["provider"]

    if state_provider != provider:
        raise HTTPException(status_code=400, detail="Provider mismatch in state token.")

    manager = IntegrationManager(supabase, settings)
    integration_provider = manager.get_provider(provider)

    try:
        raw_tokens = await integration_provider.exchange_code(code)
    except Exception as e:
        logger.error(f"Token exchange failed for {provider}: {e}")
        redirect_url = (
            f"{settings.frontend_url}/dashboard/integrations"
            f"?status=error&provider={provider}"
        )
        return RedirectResponse(url=redirect_url)

    # Each provider owns its own normalization and metadata logic.
    # The router never needs an `if provider == "..."` branch.
    normalized_tokens = integration_provider.normalize_tokens(raw_tokens)
    metadata = await integration_provider.fetch_metadata(raw_tokens)

    await manager.store_tokens(
        user_id=user_id,
        provider=provider,
        tokens=normalized_tokens,
        metadata=metadata,
    )

    logger.info(f"Successfully connected {provider} for user {user_id}")
    redirect_url = (
        f"{settings.frontend_url}/dashboard/integrations"
        f"?status=success&provider={provider}"
    )
    return RedirectResponse(url=redirect_url)


@router.post("/{provider}/actions/{action}", response_model=ApiResponse)
async def execute_provider_action(
    provider: str,
    action: str,
    payload: dict,
    current_user: dict = Depends(get_current_user),
    manager: IntegrationManager = Depends(get_integration_manager),
) -> ApiResponse:
    """
    Execute a named action for a connected provider integration.

    Example: POST /integrations/slack/actions/post_message
             POST /integrations/github/actions/create_issue

    This endpoint is completely generic — no provider-specific code lives here.
    """
    _require_supported_provider(provider)

    try:
        result = await manager.execute_action(
            user_id=current_user["id"],
            provider_name=provider,
            action=action,
            payload=payload,
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    return success_response(
        f"Action '{action}' executed successfully on {provider}.",
        result,
    )
