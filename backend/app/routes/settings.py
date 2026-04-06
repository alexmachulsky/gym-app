from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.user import User
from app.schemas.user_preference import UserPreferenceResponse, UserPreferenceUpdateRequest
from app.services.user_preference_service import UserPreferenceService
from app.utils.deps import get_current_user

router = APIRouter(prefix='/settings', tags=['settings'])


@router.get('', response_model=UserPreferenceResponse)
def get_settings(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return UserPreferenceService.get_or_create(db, current_user)


@router.put('', response_model=UserPreferenceResponse)
def update_settings(
    payload: UserPreferenceUpdateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return UserPreferenceService.update_preferences(db, current_user, payload)
