import os
from typing import AsyncGenerator

import litellm

from app.llm.base import LLMProvider
from app.llm.config import DEFAULT_MODELS, PROVIDER_API_KEY_ENV

litellm.success_callback = []


class LiteLLMProvider(LLMProvider):
    """LiteLLM-backed provider.  Supports any model LiteLLM understands."""

    def __init__(self, provider_name: str, api_key: str | None = None) -> None:
        self.provider_name = provider_name
        self.default_model = DEFAULT_MODELS.get(provider_name, provider_name)

        # Inject the API key into the env so LiteLLM picks it up automatically
        env_key = PROVIDER_API_KEY_ENV.get(provider_name)
        if env_key and api_key:
            os.environ[env_key] = api_key

    async def stream_completion(
        self,
        messages: list[dict],
        model: str | None = None,
        **kwargs,
    ) -> AsyncGenerator[str, None]:
        resolved_model = model or self.default_model
        response = await litellm.acompletion(
            model=resolved_model,
            messages=messages,
            stream=True,
            **kwargs,
        )
        async for chunk in response:
            delta = chunk.choices[0].delta
            if delta and delta.content:
                yield delta.content

    async def completion(
        self,
        messages: list[dict],
        model: str | None = None,
        **kwargs,
    ) -> str:
        resolved_model = model or self.default_model
        response = await litellm.acompletion(
            model=resolved_model,
            messages=messages,
            stream=False,
            **kwargs,
        )
        return response.choices[0].message.content or ""
