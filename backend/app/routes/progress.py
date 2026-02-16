import uuid

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.user import User
from app.schemas.progress import ProgressResponse
from app.services.progression_service import ProgressionService
from app.utils.deps import get_current_user

router = APIRouter(prefix='/progress', tags=['progress'])


@router.get('/{exercise_id}', response_model=ProgressResponse)
def get_progress(
    exercise_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return ProgressionService.analyze_exercise_progress(current_user.id, exercise_id, db)
