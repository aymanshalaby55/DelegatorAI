from app.services.meeting_providers.base import MeetingProvider


class MeetingProviderFactory:
    _providers: dict[str, type[MeetingProvider]] = {}

    @classmethod
    def register(cls, name: str, provider_cls: type[MeetingProvider]) -> None:
        """Register a new provider — extend without modifying this class"""
        cls._providers[name] = provider_cls

    @classmethod
    def get(cls, provider: str) -> MeetingProvider:
        provider_cls = cls._providers.get(provider)
        if not provider_cls:
            raise ValueError(
                f"Unknown provider: '{provider}'. Registered: {list(cls._providers)}"
            )
        return provider_cls()
