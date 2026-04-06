import uuid
from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict, Field


class GoalCreateRequest(BaseModel):
    goal_type: str = Field(pattern='^(workouts_per_week|workouts_per_month|volume_per_week)$')
    target_value: int = Field(ge=1, le=10000)
    period: str = Field(pattern='^(weekly|monthly|yearly)$')


class GoalUpdateRequest(BaseModel):
    target_value: Optional[int] = Field(default=None, ge=1, le=10000)
    is_active: Optional[bool] = None


class GoalResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    goal_type: str
    target_value: int
    period: str
    is_active: bool
    created_at: datetime


class GoalProgressResponse(BaseModel):
    goal_id: uuid.UUID
    goal_type: str
    target_value: int
    period: str
    current_value: int
    percentage: float
    streak: int
