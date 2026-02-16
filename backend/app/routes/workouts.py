import uuid
from datetime import date

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.user import User
from app.schemas.workout import WorkoutCreateRequest, WorkoutResponse
from app.services.workout_service import WorkoutService, workout_to_response
from app.utils.deps import get_current_user

router = APIRouter(prefix='/workouts', tags=['workouts'])


@router.post('', response_model=WorkoutResponse, status_code=status.HTTP_201_CREATED)
def create_workout(
    payload: WorkoutCreateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    workout = WorkoutService.create_workout(db, current_user, payload)
    return workout_to_response(workout)


@router.get('', response_model=list[WorkoutResponse])
def list_workouts(
    from_date: date | None = Query(default=None),
    to_date: date | None = Query(default=None),
    exercise_id: uuid.UUID | None = Query(default=None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    workouts = WorkoutService.list_workouts(db, current_user, from_date, to_date, exercise_id)
    return [workout_to_response(workout) for workout in workouts]
