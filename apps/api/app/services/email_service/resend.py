import resend

from app.core.config import get_settings
from app.services.email_service.email_provider import EmailProvider

settings = get_settings()
resend.api_key = settings.resend_api_key


class ResendProvider(EmailProvider):
    def __init__(self):
        pass

    async def send_email(self, email: str, subject: str, body: str) -> dict:
        try:
            response = resend.Emails.send(
                {
                    "from": "Meeting Delegator <onboarding@resend.dev>",
                    "to": "aymanshalaby539@gmail.com",
                    "subject": subject,
                    "template": body,
                }
            )
            return response
        except Exception as exc:
            raise RuntimeError(f"Failed to send email to {email}: {exc}") from exc
