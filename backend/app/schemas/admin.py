from __future__ import annotations

import uuid
from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict


class AdminUserSummary(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    email: str
    name: Optional[str] = None
    subscription_tier: str
    email_verified: bool
    is_admin: bool
    created_at: datetime


class AdminUserDetail(AdminUserSummary):
    stripe_customer_id: Optional[str] = None
    workout_count: int = 0
    exercise_count: int = 0


class AdminUserUpdate(BaseModel):
    subscription_tier: Optional[str] = None
    is_admin: Optional[bool] = None
    email_verified: Optional[bool] = None


class AdminStats(BaseModel):
    total_users: int
    pro_users: int
    free_users: int
    total_workouts: int
    total_exercises: int
    users_last_7_days: int
    workouts_last_7_days: int
