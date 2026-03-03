from app.services.meeting_providers.meeting_baas import MeetingBaasProvider
from app.services.meeting_providers.base import MeetingProvider


class MeetingProviderFactory:
    _providers = {
        "meeting_baas": MeetingBaasProvider,
    }

    @staticmethod
    def get(provider: str) -> MeetingProvider:
        cls = MeetingProviderFactory._providers.get(provider)
        if not cls:
            raise ValueError(f"Unknown provider: {provider}")
        return cls()
