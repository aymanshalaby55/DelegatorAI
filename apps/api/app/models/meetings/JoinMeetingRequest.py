from pydantic import AnyHttpUrl, BaseModel, Field, HttpUrl, field_validator
from typing import Optional


class JoinMeetingRequest(BaseModel):
    meeting_url: AnyHttpUrl = Field(
        ...,
        description="Must be a Google Meet, Zoom, or Teams URL",
        example="https://meet.google.com/abc-defg-hij"
    )
    title: Optional[str] = Field(
        None,
        description="Optional meeting title",
        example="Team Standup"
    ) 

    @field_validator("meeting_url")
    @classmethod
    def validate_meeting_platform(cls, v):
        url = str(v)
        allowed = ("meet.google.com", "zoom.us", "teams.microsoft.com")

        if not any(platform in url for platform in allowed):
            raise ValueError("Only Google Meet, Zoom, and Teams links are supported")

        return v
