from pydantic import BaseModel, HttpUrl, field_validator
from typing import Optional

class JoinMeetingRequest(BaseModel):
    meeting_url: HttpUrl
    title: Optional[str] = None  # optional meeting title

    @field_validator("meeting_url")
    @classmethod
    def validate_meeting_platform(cls, v):
        url = str(v)
        allowed = ["meet.google.com", "zoom.us", "teams.microsoft.com"]
        
        if not any(platform in url for platform in allowed):
            raise ValueError("Only Google Meet, Zoom, and Teams links are supported")
        
        return v