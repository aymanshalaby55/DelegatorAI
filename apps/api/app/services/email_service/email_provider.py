from abc import ABC, abstractmethod


class EmailProvider(ABC):
    @abstractmethod
    async def send_email(self, email: str, subject: str, body: str) -> dict:
        """Send an email to the user"""
        pass
