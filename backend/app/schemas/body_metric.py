import uuid
from datetime import date
from typing import Optional

from pydantic import BaseModel, ConfigDict, Field, field_validator


class BodyMetricCreateRequest(BaseModel):
    weight: float = Field(gt=0, le=1000)
    date: date
    body_fat_percentage: Optional[float] = Field(default=None, ge=0, le=100)
    muscle_mass: Optional[float] = Field(default=None, ge=0, le=500)
    notes: Optional[str] = None

    @field_validator('date')
    @classmethod
    def date_not_in_future(cls, v: date) -> date:
        if v > date.today():
            raise ValueError('Date cannot be in the future')
        return v


class BodyMetricResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    weight: float
    body_fat_percentage: Optional[float] = None
    muscle_mass: Optional[float] = None
    notes: Optional[str] = None
    date: date
