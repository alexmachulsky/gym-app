from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict, Field


class UserPreferenceUpdateRequest(BaseModel):
    weight_unit: Optional[str] = Field(default=None, pattern='^(kg|lbs)$')
    distance_unit: Optional[str] = Field(default=None, pattern='^(km|mi)$')
    rest_timer_default: Optional[int] = Field(default=None, ge=10, le=600)


class UserPreferenceResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    weight_unit: str
    distance_unit: str
    rest_timer_default: int
    created_at: datetime
    updated_at: datetime
