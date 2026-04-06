import uuid

from fastapi import APIRouter, Depends, Query, Response, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.goal import Goal
from app.models.user import User
from app.schemas.goal import GoalCreateRequest, GoalProgressResponse, GoalResponse, GoalUpdateRequest
from app.services.goal_service import GoalService
from app.utils.deps import check_free_limit, get_current_user

router = APIRouter(prefix='/goals', tags=['goals'])


@router.post('', response_model=GoalResponse, status_code=status.HTTP_201_CREATED)
def create_goal(
    payload: GoalCreateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    check_free_limit(db, current_user, Goal, 'goals')
    return GoalService.create_goal(db, current_user, payload)


@router.get('', response_model=list[GoalResponse])
def list_goals(
    active_only: bool = Query(default=False),
    skip: int = Query(default=0, ge=0),
    limit: int = Query(default=50, ge=1, le=500),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return GoalService.list_goals(db, current_user, active_only, skip, limit)


@router.put('/{goal_id}', response_model=GoalResponse)
def update_goal(
    goal_id: uuid.UUID,
    payload: GoalUpdateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return GoalService.update_goal(db, current_user, goal_id, payload)


@router.delete('/{goal_id}', status_code=status.HTTP_204_NO_CONTENT)
def delete_goal(
    goal_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    GoalService.delete_goal(db, current_user, goal_id)
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.get('/progress', response_model=list[GoalProgressResponse])
def get_goals_progress(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return GoalService.get_all_goals_progress(db, current_user)
