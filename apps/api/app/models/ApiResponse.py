from typing import Any, Optional

from pydantic import BaseModel


class ApiResponse(BaseModel):
    success: bool
    message: str
    data: Optional[Any] = None
    errors: Optional[Any] = None


def success_response(message: str, data: Any = None) -> ApiResponse:
    return ApiResponse(success=True, message=message, data=data)


def error_response(message: str, errors: Any = None) -> ApiResponse:
    return ApiResponse(success=False, message=message, errors=errors)
