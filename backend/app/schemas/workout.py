import uuid
from datetime import date, datetime

from pydantic import BaseModel, ConfigDict, Field


class WorkoutSetCreateRequest(BaseModel):
    exercise_id: uuid.UUID
    weight: float = Field(gt=0)
    reps: int = Field(gt=0)
    sets: int = Field(gt=0)


class WorkoutCreateRequest(BaseModel):
    date: date
    sets: list[WorkoutSetCreateRequest] = Field(min_length=1)


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
