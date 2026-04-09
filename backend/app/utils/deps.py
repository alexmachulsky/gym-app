import uuid
from datetime import datetime, timezone
from typing import Any

from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError
from sqlalchemy import func
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


def get_token_payload(token: str = Depends(oauth2_scheme)) -> dict[str, Any]:
    """Extract and return the raw JWT payload."""
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail='Could not validate credentials',
        headers={'WWW-Authenticate': 'Bearer'},
    )
    try:
        payload = decode_access_token(token)
        if payload.get('type') != 'access':
            raise credentials_exception
        return payload
    except (JWTError, ValueError):
        raise credentials_exception


def get_current_user(db: Session = Depends(get_db), token: str = Depends(oauth2_scheme)) -> User:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail='Could not validate credentials',
        headers={'WWW-Authenticate': 'Bearer'},
    )
    try:
        payload = decode_access_token(token)
        if payload.get('type') != 'access':
            raise credentials_exception
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

    # Check token_version matches (validates token hasn't been revoked)
    token_version = payload.get('tv', 1)
    if token_version != user.token_version:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail='Token has been revoked',
            headers={'WWW-Authenticate': 'Bearer'},
        )

    return user


def _user_has_pro_access(user: User) -> bool:
    """Return True if the user has pro tier or an active trial."""
    if user.subscription_tier == 'pro':
        return True
    if user.trial_ends_at:
        trial_end = user.trial_ends_at
        if trial_end.tzinfo is None:
            trial_end = trial_end.replace(tzinfo=timezone.utc)
        if trial_end > datetime.now(timezone.utc):
            return True
    return False


def require_pro(current_user: User = Depends(get_current_user)) -> User:
    if not _user_has_pro_access(current_user):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail='Pro subscription required',
        )
    return current_user


def check_free_limit(db: Session, user: User, model_class, resource: str) -> None:
    """Raise 403 if a free-tier user has reached their limit for the given resource."""
    if _user_has_pro_access(user):
        return
    limit = FREE_LIMITS.get(resource)
    if limit is None:
        return
    db.query(User).filter(User.id == user.id).with_for_update().first()
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
    from app.models.workout_template import WorkoutTemplate

    is_pro = _user_has_pro_access(user)

    exercise_count = db.query(Exercise).filter(Exercise.user_id == user.id).count()
    template_count = db.query(WorkoutTemplate).filter(WorkoutTemplate.user_id == user.id).count()
    goal_count = db.query(Goal).filter(Goal.user_id == user.id).count()

    return {
        'tier': 'pro' if is_pro else user.subscription_tier,
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


def require_not_impersonating(
    current_user: User = Depends(get_current_user),
    token_data: dict[str, Any] = Depends(get_token_payload),
) -> User:
    """Prevent sensitive actions while impersonating a user."""
    if token_data.get('is_impersonating'):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail='This action cannot be performed while impersonating a user',
        )
    return current_user
