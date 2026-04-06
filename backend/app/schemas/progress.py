from datetime import date
from typing import Literal, Optional

from pydantic import BaseModel


class ProgressResponse(BaseModel):
    exercise: str
    status: Literal['plateau', 'progressing', 'insufficient_data']
    message: str
    latest_volume: float | None = None
    latest_estimated_1rm: float | None = None
    sessions_analyzed: int


class SessionDataPoint(BaseModel):
    date: date
    volume: float
    estimated_1rm: float


class ProgressDetailResponse(BaseModel):
    exercise: str
    status: Literal['plateau', 'progressing', 'insufficient_data']
    message: str
    latest_volume: float | None = None
    latest_estimated_1rm: float | None = None
    sessions_analyzed: int
    session_data: list[SessionDataPoint] = []


class PersonalRecordResponse(BaseModel):
    exercise_name: str
    record_type: str  # max_weight, max_volume, max_estimated_1rm
    value: float
    date_achieved: date


class MuscleGroupVolumeResponse(BaseModel):
    muscle_group: str
    total_volume: float
    percentage: float
    workout_count: int


class SessionComparisonResponse(BaseModel):
    exercise_name: str
    current_date: Optional[date] = None
    current_volume: Optional[float] = None
    current_max_weight: Optional[float] = None
    current_total_reps: Optional[int] = None
    previous_date: Optional[date] = None
    previous_volume: Optional[float] = None
    previous_max_weight: Optional[float] = None
    previous_total_reps: Optional[int] = None
    volume_change: Optional[float] = None
    weight_change: Optional[float] = None
    reps_change: Optional[int] = None


class MuscleRecoveryResponse(BaseModel):
    muscle_group: str
    last_trained: Optional[date] = None
    days_since: Optional[int] = None
    status: str  # recovered, resting, overtrained
