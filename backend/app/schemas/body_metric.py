import uuid
from datetime import date

from pydantic import BaseModel, ConfigDict, Field


class BodyMetricCreateRequest(BaseModel):
    weight: float = Field(gt=0)
    date: date


class BodyMetricResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    weight: float
    date: date
