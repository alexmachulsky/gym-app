from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.user import User
from app.schemas.exercise import ExerciseCreateRequest, ExerciseResponse
from app.services.workout_service import WorkoutService
from app.utils.deps import get_current_user

router = APIRouter(prefix='/exercises', tags=['exercises'])


@router.post('', response_model=ExerciseResponse, status_code=status.HTTP_201_CREATED)
def create_exercise(
    payload: ExerciseCreateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return WorkoutService.create_exercise(db, current_user, payload.name)


@router.get('', response_model=list[ExerciseResponse])
def list_exercises(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return WorkoutService.list_exercises(db, current_user)
