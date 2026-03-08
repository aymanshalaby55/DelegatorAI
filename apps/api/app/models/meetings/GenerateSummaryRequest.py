from typing import Literal

from pydantic import BaseModel


class GenerateSummaryRequest(BaseModel):
    length: Literal["short", "medium", "detailed"] = "medium"
    format: Literal["bullets", "paragraph"] = "bullets"
