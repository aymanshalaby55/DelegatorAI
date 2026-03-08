from app.llm.base import LLMProvider
from app.llm.litellm_provider import LiteLLMProvider


class LLMProviderFactory:
    """
    Returns an LLMProvider for the given provider name.

    All current providers are backed by LiteLLM.  To add a non-LiteLLM
    backend in the future, register a different class in `_providers`.
    """

    _providers: dict[str, type[LLMProvider]] = {
        "gemini": LiteLLMProvider,
    }

    @staticmethod
    def get(provider_name: str, api_key: str | None = None) -> LLMProvider:
        cls = LLMProviderFactory._providers.get(provider_name)
        if not cls:
            raise ValueError(f"Unknown LLM provider: {provider_name!r}")
        return cls(provider_name=provider_name, api_key=api_key)
