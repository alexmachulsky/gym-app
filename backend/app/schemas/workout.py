import uuid
from datetime import date, datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict, Field, field_validator


class WorkoutSetCreateRequest(BaseModel):
    exercise_id: uuid.UUID
    weight: float = Field(gt=0, le=1000)
    reps: int = Field(ge=1, le=200)
    sets: int = Field(ge=1, le=100)


class WorkoutCreateRequest(BaseModel):
    date: date
    sets: list[WorkoutSetCreateRequest] = Field(min_length=1)
    notes: Optional[str] = None
    effort_rating: Optional[int] = Field(default=None, ge=1, le=10)
    duration_seconds: Optional[int] = Field(default=None, ge=0)
    template_id: Optional[uuid.UUID] = None

    @field_validator('date')
    @classmethod
    def date_not_in_future(cls, v: date) -> date:
        if v > date.today():
            raise ValueError('Workout date cannot be in the future')
        return v


class WorkoutSetResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    exercise_id: uuid.UUID
    weight: float
    reps: int
    sets: int


class PersonalRecordItem(BaseModel):
    exercise_name: str
    record_type: str
    old_value: float | None = None
    new_value: float


class WorkoutResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    date: date
    created_at: datetime
    notes: Optional[str] = None
    effort_rating: Optional[int] = None
    duration_seconds: Optional[int] = None
    estimated_calories: Optional[int] = None
    template_id: Optional[uuid.UUID] = None
    sets: list[WorkoutSetResponse]
    new_records: list[PersonalRecordItem] = []
