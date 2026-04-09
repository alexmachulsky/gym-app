import uuid
from datetime import date

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.user import User
from app.schemas.progress import (
    MuscleGroupVolumeResponse,
    MuscleRecoveryResponse,
    PersonalRecordResponse,
    ProgressDetailResponse,
    SessionComparisonResponse,
)
from app.services.progression_service import ProgressionService
from app.utils.deps import get_current_user, require_pro

router = APIRouter(prefix='/progress', tags=['progress'])


@router.get('/{exercise_id}', response_model=ProgressDetailResponse)
def get_progress(
    exercise_id: uuid.UUID,
    from_date: date | None = Query(default=None),
    to_date: date | None = Query(default=None),
    limit: int = Query(default=10, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return ProgressionService.analyze_exercise_progress(
        current_user.id, exercise_id, db,
        from_date=from_date, to_date=to_date, limit=limit,
    )


@router.get('/records/{exercise_id}', response_model=list[PersonalRecordResponse])
def get_personal_records(
    exercise_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return ProgressionService.get_personal_records(current_user.id, exercise_id, db)


@router.get('/records/recent/all', response_model=list[PersonalRecordResponse])
def get_recent_records(
    days: int = Query(default=7, ge=1, le=90),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return ProgressionService.get_recent_records(current_user.id, db, days=days)


@router.get('/muscle-groups/volume', response_model=list[MuscleGroupVolumeResponse])
def get_muscle_group_volume(
    from_date: date | None = Query(default=None),
    to_date: date | None = Query(default=None),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_pro),
):
    return ProgressionService.get_muscle_group_volume(current_user.id, db, from_date, to_date)


@router.get('/compare/{exercise_id}', response_model=SessionComparisonResponse)
def compare_sessions(
    exercise_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_pro),
):
    return ProgressionService.compare_sessions(current_user.id, exercise_id, db)


@router.get('/recovery/status', response_model=list[MuscleRecoveryResponse])
def get_muscle_recovery(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_pro),
):
    return ProgressionService.get_muscle_recovery(current_user.id, db)


@router.get('/streak/current')
def get_workout_streak(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return ProgressionService.get_workout_streak(current_user.id, db)
