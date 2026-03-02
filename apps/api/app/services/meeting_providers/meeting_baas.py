import httpx
from fastapi import HTTPException
from app.services.meeting_providers.base import MeetingProvider
from app.config import get_settings

settings = get_settings()


class MeetingBaasProvider(MeetingProvider):

    def __init__(self):
        self.base_url = settings.meeting_baas_base_url
        self.api_key = settings.meeting_baas_api_key

    @property
    def headers(self):
        return {
            "x-meeting-baas-api-key": self.api_key,
            "Content-Type": "application/json",
        }

    async def join(self, meeting_url: str, bot_name: str, language_code: str = "en") -> dict:
        if not self.api_key:
            raise HTTPException(status_code=500, detail="Meeting BaaS API key not configured")
        if not self.base_url:
            raise HTTPException(status_code=500, detail="Meeting BaaS base URL not configured")
        if not hasattr(settings, 'meeting_baas_webhook_url') or not settings.meeting_baas_webhook_url:
            raise HTTPException(status_code=500, detail="Meeting BaaS webhook URL not configured")
        try:
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    f"{self.base_url}/v2/bots",
                    json={
                        "meeting_url": meeting_url,
                        "bot_name": bot_name,
                        "recording_mode": "speaker_view",
                        "transcription_config": {
                            "provider": "gladia",
                            "custom_params": {
                                "translation": True,
                                "translation_config": {
                                    "target_languages": [language_code],
                                    "model": "enhanced",
                                    "match_original_utterances": True,
                                    "lipsync": True,
                                    "context_adaptation": True
                                }
                            }
                        },
                        "automatic_leave": {"waiting_room_timeout": 600},
                        "webhook_url": settings.meeting_baas_webhook_url,
                    },
                    headers=self.headers,
                    timeout=30,
                )
                response.raise_for_status()
                data =  response.json()
            return {"id": data["data"]["bot_id"], **data}
        except httpx.HTTPStatusError as exc:
            raise HTTPException(
                status_code=502,
                detail=f"Meeting BaaS error {exc.response.status_code}: {exc.response.text}"
            ) from exc
        except httpx.RequestError as exc:
            raise HTTPException(
                status_code=502,
                detail=f"Meeting BaaS connection error: {exc}"
            ) from exc
        except Exception as exc:
            raise HTTPException(
                status_code=502,
                detail=f"Meeting BaaS error: {exc}"
            ) from exc

    async def leave(self, bot_id: str) -> None:
        if not bot_id:
            raise HTTPException(status_code=400, detail="Missing bot_id for leaving the meeting")
        try:
            # Remove Content-Type from headers if present
            headers = {k: v for k, v in self.headers.items() if k.lower() != "content-type"}
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    f"{self.base_url}/v2/bots/{bot_id}/leave",
                    headers=headers,
                    timeout=15,
                )
                # Check normal error case
                if response.status_code != 200:
                    # Specifically handle status 409 with FST_ERR_BOT_STATUS and completed state
                    if response.status_code == 409:
                        try:
                            error_json = response.json()
                            # Handles both cases: text body is already a dict or is JSON
                        except Exception:
                            error_json = {}
                        if (
                            isinstance(error_json, dict)
                            and error_json.get("code") == "FST_ERR_BOT_STATUS"
                            and "completed" in str(error_json.get("message", "")).lower()
                            and "operation not permitted" in str(error_json.get("message", "")).lower()
                        ):
                            # Raise a special error that the meeting has already completed
                            raise HTTPException(
                                status_code=409,
                                detail="Meeting bot is already completed; cannot leave"
                            )
                    raise HTTPException(
                        status_code=502,
                        detail=f"Meeting BaaS error {response.status_code}: {response.text}"
                    )
        except httpx.RequestError as exc:
            raise HTTPException(status_code=502, detail=f"Meeting BaaS connection error: {exc}") from exc

    async def get_transcript(self, bot_id: str) -> dict:
        if not bot_id:
            raise HTTPException(status_code=400, detail="Missing bot_id for getting transcript")
        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(
                    f"{self.base_url}/v2/bots/{bot_id}",
                    headers=self.headers,
                    timeout=20,
                )
                if not response.is_success:
                    raise HTTPException(
                        status_code=502,
                        detail=f"Meeting BaaS error {response.status_code}: {response.text}"
                    )
                data = response.json()
                return {
                    "transcript": data.get("transcript", []),
                    "recording_url": data.get("recording_url"),
                    "speakers": data.get("speakers", []),
                }
        except httpx.RequestError as exc:
            raise HTTPException(status_code=502, detail=f"Meeting BaaS connection error: {exc}") from exc