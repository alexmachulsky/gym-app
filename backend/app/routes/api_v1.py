import hashlib
import secrets
import uuid
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, Security
from fastapi.security import APIKeyHeader
from pydantic import BaseModel
from sqlalchemy.orm import Session, joinedload

from app.core.database import get_db
from app.models.api_key import ApiKey
from app.models.exercise import Exercise
from app.models.user import User
from app.models.webhook import WebhookEndpoint
from app.models.workout import Workout
from app.utils.deps import get_current_user

api_key_header = APIKeyHeader(name='X-API-Key', auto_error=False)

router = APIRouter(prefix='/api/v1', tags=['public-api-v1'])


def _hash_key(key: str) -> str:
    return hashlib.sha256(key.encode()).hexdigest()


def get_api_user(
    db: Session = Depends(get_db),
    api_key: str = Security(api_key_header),
) -> User:
    if not api_key:
        raise HTTPException(status_code=401, detail='Missing API key')
    key_hash = _hash_key(api_key)
    record = db.query(ApiKey).filter(ApiKey.key_hash == key_hash, ApiKey.is_active == True).first()
    if not record:
        raise HTTPException(status_code=401, detail='Invalid API key')
    record.last_used_at = datetime.now(timezone.utc)
    user = db.query(User).filter(User.id == record.user_id).first()
    if not user:
        raise HTTPException(status_code=401, detail='User not found')
    db.commit()
    return user


# ── API key management ────────────────────────────


class CreateApiKeyRequest(BaseModel):
    name: str = 'Default'


@router.post('/keys')
def create_api_key(
    payload: CreateApiKeyRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    raw_key = f'gym_{secrets.token_urlsafe(32)}'
    key_hash = _hash_key(raw_key)
    api_key = ApiKey(user_id=current_user.id, key_hash=key_hash, name=payload.name)
    db.add(api_key)
    db.commit()
    return {'key': raw_key, 'name': payload.name, 'id': api_key.id}


@router.get('/keys')
def list_api_keys(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_api_user),
):
    keys = db.query(ApiKey).filter(ApiKey.user_id == current_user.id).all()
    return [
        {'id': k.id, 'name': k.name, 'is_active': k.is_active, 'last_used_at': k.last_used_at, 'created_at': k.created_at}
        for k in keys
    ]


@router.delete('/keys/{key_id}')
def revoke_api_key(
    key_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_api_user),
):
    key = db.query(ApiKey).filter(ApiKey.id == key_id, ApiKey.user_id == current_user.id).first()
    if not key:
        raise HTTPException(status_code=404, detail='API key not found')
    key.is_active = False
    db.commit()
    return {'detail': 'Key revoked'}


# ── Public data endpoints ─────────────────────────


@router.get('/workouts')
def list_workouts(
    skip: int = 0,
    limit: int = 50,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_api_user),
):
    workouts = (
        db.query(Workout)
        .options(joinedload(Workout.workout_sets))
        .filter(Workout.user_id == current_user.id)
        .order_by(Workout.date.desc())
        .offset(skip)
        .limit(limit)
        .all()
    )
    return [
        {
            'id': w.id,
            'date': w.date,
            'notes': w.notes,
            'duration_seconds': w.duration_seconds,
            'sets': [
                {'exercise_id': s.exercise_id, 'weight': s.weight, 'reps': s.reps, 'sets': s.sets}
                for s in w.workout_sets
            ],
        }
        for w in workouts
    ]


@router.get('/exercises')
def list_exercises(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_api_user),
):
    exercises = db.query(Exercise).filter(Exercise.user_id == current_user.id).all()
    return [
        {'id': e.id, 'name': e.name, 'category': e.category, 'muscle_group': e.muscle_group}
        for e in exercises
    ]


# ── Webhook management ────────────────────────────


class CreateWebhookRequest(BaseModel):
    url: str
    events: str = '*'


@router.post('/webhooks')
def create_webhook(
    payload: CreateWebhookRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_api_user),
):
    secret = secrets.token_urlsafe(32)
    webhook = WebhookEndpoint(
        user_id=current_user.id, url=payload.url, events=payload.events, secret=secret
    )
    db.add(webhook)
    db.commit()
    return {'id': webhook.id, 'url': webhook.url, 'events': webhook.events, 'secret': secret}


@router.get('/webhooks')
def list_webhooks(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_api_user),
):
    hooks = db.query(WebhookEndpoint).filter(WebhookEndpoint.user_id == current_user.id).all()
    return [
        {'id': h.id, 'url': h.url, 'events': h.events, 'is_active': h.is_active, 'created_at': h.created_at}
        for h in hooks
    ]


@router.delete('/webhooks/{webhook_id}')
def delete_webhook(
    webhook_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_api_user),
):
    hook = db.query(WebhookEndpoint).filter(
        WebhookEndpoint.id == webhook_id, WebhookEndpoint.user_id == current_user.id
    ).first()
    if not hook:
        raise HTTPException(status_code=404, detail='Webhook not found')
    db.delete(hook)
    db.commit()
    return {'detail': 'Webhook deleted'}
