import uuid
from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict, Field, field_validator


class ExerciseCreateRequest(BaseModel):
    name: str = Field(min_length=1, max_length=100)
    category: Optional[str] = Field(default=None, max_length=50)
    muscle_group: Optional[str] = Field(default=None, max_length=100)
    equipment: Optional[str] = Field(default=None, max_length=50)
    description: Optional[str] = None
    instructions: Optional[str] = None

    @field_validator('name')
    @classmethod
    def strip_whitespace(cls, v: str) -> str:
        return v.strip()


class ExerciseUpdateRequest(BaseModel):
    name: Optional[str] = Field(default=None, min_length=1, max_length=100)
    category: Optional[str] = Field(default=None, max_length=50)
    muscle_group: Optional[str] = Field(default=None, max_length=100)
    equipment: Optional[str] = Field(default=None, max_length=50)
    description: Optional[str] = None
    instructions: Optional[str] = None

    @field_validator('name')
    @classmethod
    def strip_whitespace(cls, v: str | None) -> str | None:
        return v.strip() if v else v


class ExerciseResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    name: str
    category: Optional[str] = None
    muscle_group: Optional[str] = None
    equipment: Optional[str] = None
    description: Optional[str] = None
    instructions: Optional[str] = None
    image_url: Optional[str] = None
    created_at: datetime
