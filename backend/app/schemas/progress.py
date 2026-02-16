from typing import Literal

from pydantic import BaseModel


class ProgressResponse(BaseModel):
    exercise: str
    status: Literal['plateau', 'progressing', 'insufficient_data']
    message: str
    latest_volume: float | None = None
    latest_estimated_1rm: float | None = None
    sessions_analyzed: int
