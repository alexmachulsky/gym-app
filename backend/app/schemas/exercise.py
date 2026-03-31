import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field, field_validator


class ExerciseCreateRequest(BaseModel):
    name: str = Field(min_length=1, max_length=100)

    @field_validator('name')
    @classmethod
    def strip_whitespace(cls, v: str) -> str:
        return v.strip()


class ExerciseResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    name: str
    created_at: datetime
