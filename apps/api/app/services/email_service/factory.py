from app.services.email_service.email_provider import EmailProvider
from app.services.email_service.resend import ResendProvider


class EmailProviderFactory:
    _providers = {
        "resend": ResendProvider,
    }

    @staticmethod
    def send_email(provider: str, email: str, subject: str, body: str) -> EmailProvider:
        cls = EmailProviderFactory._providers.get(provider)
        if not cls:
            raise ValueError(f"Unknown provider: {provider}")
        return cls().send_email(email, subject, body)
