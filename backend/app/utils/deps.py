import uuid

from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError
from sqlalchemy.orm import Session, joinedload

from app.core.database import get_db
from app.core.security import decode_access_token
from app.models.user import User

oauth2_scheme = OAuth2PasswordBearer(tokenUrl='/auth/login')

# ── Free-tier limits ──────────────────────────────
FREE_LIMITS = {
    'exercises': 10,
    'templates': 3,
    'goals': 2,
}


def get_current_user(db: Session = Depends(get_db), token: str = Depends(oauth2_scheme)) -> User:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail='Could not validate credentials',
        headers={'WWW-Authenticate': 'Bearer'},
    )
    try:
        payload = decode_access_token(token)
        subject = payload.get('sub')
        if subject is None:
            raise credentials_exception
        user_id = uuid.UUID(subject)
    except (JWTError, ValueError):
        raise credentials_exception

    user = (
        db.query(User)
        .options(joinedload(User.subscription))
        .filter(User.id == user_id)
        .first()
    )
    if user is None:
        raise credentials_exception
    return user


def require_pro(current_user: User = Depends(get_current_user)) -> User:
    if current_user.subscription_tier != 'pro':
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail='Pro subscription required',
        )
    return current_user


def check_free_limit(db: Session, user: User, model_class, resource: str) -> None:
    """Raise 403 if a free-tier user has reached their limit for the given resource."""
    if user.subscription_tier == 'pro':
        return
    limit = FREE_LIMITS.get(resource)
    if limit is None:
        return
    count = db.query(model_class).filter(model_class.user_id == user.id).count()
    if count >= limit:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f'Free plan limit reached ({limit} {resource}). Upgrade to Pro for unlimited access.',
        )


def get_user_limits(db: Session, user: User) -> dict:
    """Return usage counts and limits for the user's tier."""
    from app.models.exercise import Exercise
    from app.models.goal import Goal
    from app.models.template import WorkoutTemplate

    is_pro = user.subscription_tier == 'pro'

    exercise_count = db.query(Exercise).filter(Exercise.user_id == user.id).count()
    template_count = db.query(WorkoutTemplate).filter(WorkoutTemplate.user_id == user.id).count()
    goal_count = db.query(Goal).filter(Goal.user_id == user.id).count()

    return {
        'tier': user.subscription_tier,
        'exercises': {
            'used': exercise_count,
            'limit': None if is_pro else FREE_LIMITS['exercises'],
        },
        'templates': {
            'used': template_count,
            'limit': None if is_pro else FREE_LIMITS['templates'],
        },
        'goals': {
            'used': goal_count,
            'limit': None if is_pro else FREE_LIMITS['goals'],
        },
        'ai_coach': is_pro,
        'export': is_pro,
        'equipment_profiles': is_pro,
        'advanced_charts': is_pro,
        'workout_generator': is_pro,
    }


def require_admin(current_user: User = Depends(get_current_user)) -> User:
    if not current_user.is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail='Admin access required',
        )
    return current_user
