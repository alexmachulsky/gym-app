from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.user import User
from app.services.achievement_service import AchievementService
from app.utils.deps import get_current_user

router = APIRouter(prefix='/achievements', tags=['achievements'])


@router.get('/')
def get_my_achievements(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return AchievementService.get_user_achievements(db, current_user.id)


@router.get('/available')
def get_available():
    return AchievementService.get_available_achievements()


@router.post('/check')
def check_achievements(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    workout_grants = AchievementService.check_after_workout(db, current_user.id)
    body_grants = AchievementService.check_after_body_metric(db, current_user.id)
    return {'newly_granted': workout_grants + body_grants}
