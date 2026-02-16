from fastapi import APIRouter, Depends, status
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
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return BodyMetricService.list_metrics(db, current_user)
