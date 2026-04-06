import uuid
from datetime import date
from typing import Optional

from fastapi import APIRouter, Depends, Query, Response, status
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.user import User
from app.schemas.workout import WorkoutCreateRequest, WorkoutResponse
from app.services.workout_service import WorkoutService, workout_to_response
from app.services.generator_service import GeneratorService
from app.utils.deps import get_current_user, require_pro

router = APIRouter(prefix='/workouts', tags=['workouts'])


@router.post('', response_model=WorkoutResponse, status_code=status.HTTP_201_CREATED)
def create_workout(
    payload: WorkoutCreateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    workout, new_records = WorkoutService.create_workout(db, current_user, payload)
    return workout_to_response(workout, new_records)


@router.get('', response_model=list[WorkoutResponse])
def list_workouts(
    from_date: date | None = Query(default=None),
    to_date: date | None = Query(default=None),
    exercise_id: uuid.UUID | None = Query(default=None),
    skip: int = Query(default=0, ge=0),
    limit: int = Query(default=50, ge=1, le=500),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    workouts = WorkoutService.list_workouts(db, current_user, from_date, to_date, exercise_id, skip, limit)
    return [workout_to_response(workout) for workout in workouts]


@router.post('/from-template/{template_id}', response_model=WorkoutResponse, status_code=status.HTTP_201_CREATED)
def create_from_template(
    template_id: uuid.UUID,
    workout_date: date = Query(default=None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    from app.services.template_service import TemplateService
    template = TemplateService.get_template(db, current_user, template_id)

    use_date = workout_date or date.today()
    payload = WorkoutCreateRequest(
        date=use_date,
        template_id=template_id,
        sets=[
            {
                'exercise_id': ts.exercise_id,
                'weight': ts.weight or 20.0,
                'reps': ts.reps or 10,
                'sets': ts.sets or 3,
            }
            for ts in template.template_sets
        ],
    )
    workout, new_records = WorkoutService.create_workout(db, current_user, payload)
    return workout_to_response(workout, new_records)


class GenerateWorkoutRequest(BaseModel):
    muscle_groups: list[str] = Field(min_length=1)
    equipment: Optional[list[str]] = None
    difficulty: str = Field(default='intermediate', pattern='^(beginner|intermediate|advanced)$')
    target_duration_minutes: int = Field(default=60, ge=15, le=180)


@router.post('/generate')
def generate_workout(
    payload: GenerateWorkoutRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_pro),
):
    suggestions = GeneratorService.generate_workout(
        db, current_user,
        muscle_groups=payload.muscle_groups,
        equipment=payload.equipment,
        difficulty=payload.difficulty,
        target_duration_minutes=payload.target_duration_minutes,
    )
    return {'suggested_sets': suggestions}


@router.delete('/{workout_id}', status_code=status.HTTP_204_NO_CONTENT)
def delete_workout(
    workout_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    WorkoutService.delete_workout(db, current_user, workout_id)
    return Response(status_code=status.HTTP_204_NO_CONTENT)
