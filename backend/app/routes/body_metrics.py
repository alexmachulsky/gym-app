import uuid

from fastapi import APIRouter, Depends, Query, Response, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.user import User
from app.schemas.body_metric import BodyMetricCreateRequest, BodyMetricResponse
from app.services.body_metric_service import BodyMetricService
from app.utils.deps import get_current_user

router = APIRouter(prefix='/body-metrics', tags=['body_metrics'])


@router.post('', response_model=BodyMetricResponse, status_code=status.HTTP_201_CREATED)
def create_body_metric(
    payload: BodyMetricCreateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return BodyMetricService.create_metric(db, current_user, payload.weight, payload.date)


@router.get('', response_model=list[BodyMetricResponse])
def list_body_metrics(
    skip: int = Query(default=0, ge=0),
    limit: int = Query(default=50, ge=1, le=500),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return BodyMetricService.list_metrics(db, current_user, skip, limit)


@router.delete('/{metric_id}', status_code=status.HTTP_204_NO_CONTENT)
def delete_body_metric(
    metric_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    BodyMetricService.delete_metric(db, current_user, metric_id)
    return Response(status_code=status.HTTP_204_NO_CONTENT)
