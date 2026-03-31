import uuid
from datetime import date

from pydantic import BaseModel, ConfigDict, Field, field_validator


class BodyMetricCreateRequest(BaseModel):
    weight: float = Field(gt=0, le=1000)
    date: date

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
    date: date
