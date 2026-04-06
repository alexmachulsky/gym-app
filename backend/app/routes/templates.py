import uuid

from fastapi import APIRouter, Depends, Query, Response, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.user import User
from app.models.workout_template import WorkoutTemplate
from app.schemas.workout_template import TemplateCreateRequest, TemplateResponse, TemplateUpdateRequest
from app.services.template_service import TemplateService
from app.utils.deps import check_free_limit, get_current_user

router = APIRouter(prefix='/templates', tags=['templates'])


@router.post('', response_model=TemplateResponse, status_code=status.HTTP_201_CREATED)
def create_template(
    payload: TemplateCreateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    check_free_limit(db, current_user, WorkoutTemplate, 'templates')
    return TemplateService.create_template(db, current_user, payload)


@router.get('', response_model=list[TemplateResponse])
def list_templates(
    skip: int = Query(default=0, ge=0),
    limit: int = Query(default=50, ge=1, le=500),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return TemplateService.list_templates(db, current_user, skip, limit)


@router.get('/{template_id}', response_model=TemplateResponse)
def get_template(
    template_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return TemplateService.get_template(db, current_user, template_id)


@router.put('/{template_id}', response_model=TemplateResponse)
def update_template(
    template_id: uuid.UUID,
    payload: TemplateUpdateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return TemplateService.update_template(db, current_user, template_id, payload)


@router.delete('/{template_id}', status_code=status.HTTP_204_NO_CONTENT)
def delete_template(
    template_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    TemplateService.delete_template(db, current_user, template_id)
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.post('/from-workout/{workout_id}', response_model=TemplateResponse, status_code=status.HTTP_201_CREATED)
def create_from_workout(
    workout_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    check_free_limit(db, current_user, WorkoutTemplate, 'templates')
    return TemplateService.create_from_workout(db, current_user, workout_id)
