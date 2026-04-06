import uuid
from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict, Field


class TemplateSetCreateRequest(BaseModel):
    exercise_id: uuid.UUID
    weight: Optional[float] = Field(default=None, ge=0, le=1000)
    reps: Optional[int] = Field(default=None, ge=1, le=200)
    sets: Optional[int] = Field(default=None, ge=1, le=100)
    order: int = Field(ge=0)
    segment: str = Field(default='main', pattern='^(warmup|main|cooldown)$')


class TemplateCreateRequest(BaseModel):
    name: str = Field(min_length=1, max_length=120)
    description: Optional[str] = None
    is_draft: bool = False
    template_sets: list[TemplateSetCreateRequest] = Field(default_factory=list)


class TemplateUpdateRequest(BaseModel):
    name: Optional[str] = Field(default=None, min_length=1, max_length=120)
    description: Optional[str] = None
    is_draft: Optional[bool] = None
    template_sets: Optional[list[TemplateSetCreateRequest]] = None


class TemplateSetResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    exercise_id: uuid.UUID
    weight: Optional[float] = None
    reps: Optional[int] = None
    sets: Optional[int] = None
    order: int
    segment: str


class TemplateResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    name: str
    description: Optional[str] = None
    is_draft: bool
    created_at: datetime
    updated_at: datetime
    template_sets: list[TemplateSetResponse] = []
