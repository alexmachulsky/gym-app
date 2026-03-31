import uuid
from datetime import date, datetime

from pydantic import BaseModel, ConfigDict, Field, field_validator


class WorkoutSetCreateRequest(BaseModel):
    exercise_id: uuid.UUID
    weight: float = Field(gt=0, le=1000)
    reps: int = Field(ge=1, le=200)
    sets: int = Field(ge=1, le=100)


class WorkoutCreateRequest(BaseModel):
    date: date
    sets: list[WorkoutSetCreateRequest] = Field(min_length=1)

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


class WorkoutResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    date: date
    created_at: datetime
    sets: list[WorkoutSetResponse]
