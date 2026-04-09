import uuid

from fastapi import APIRouter, Depends, Query, Response, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.exercise import Exercise
from app.models.user import User
from app.schemas.exercise import ExerciseCreateRequest, ExerciseResponse, ExerciseUpdateRequest
from app.services.workout_service import WorkoutService
from app.utils.deps import check_free_limit, get_current_user

router = APIRouter(prefix='/exercises', tags=['exercises'])


@router.post('', response_model=ExerciseResponse, status_code=status.HTTP_201_CREATED)
def create_exercise(
    payload: ExerciseCreateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    check_free_limit(db, current_user, Exercise, 'exercises')
    return WorkoutService.create_exercise(
        db, current_user, payload.name,
        category=payload.category,
        muscle_group=payload.muscle_group,
        equipment=payload.equipment,
        description=payload.description,
        instructions=payload.instructions,
    )


@router.get('', response_model=list[ExerciseResponse])
def list_exercises(
    skip: int = Query(default=0, ge=0),
    limit: int = Query(default=50, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return WorkoutService.list_exercises(db, current_user, skip, limit)


@router.put('/{exercise_id}', response_model=ExerciseResponse)
def update_exercise(
    exercise_id: uuid.UUID,
    payload: ExerciseUpdateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    update_data = payload.model_dump(exclude_none=True)
    return WorkoutService.update_exercise(db, current_user, exercise_id, **update_data)


@router.get('/{exercise_id}/alternatives', response_model=list[ExerciseResponse])
def get_exercise_alternatives(
    exercise_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return WorkoutService.get_exercise_alternatives(db, current_user, exercise_id)


@router.delete('/{exercise_id}', status_code=status.HTTP_204_NO_CONTENT)
def delete_exercise(
    exercise_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    WorkoutService.delete_exercise(db, current_user, exercise_id)
    return Response(status_code=status.HTTP_204_NO_CONTENT)
