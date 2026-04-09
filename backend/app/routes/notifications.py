from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.push_subscription import PushSubscription
from app.models.user import User
from app.utils.deps import get_current_user

router = APIRouter(prefix='/notifications', tags=['notifications'])


class PushSubscriptionRequest(BaseModel):
    endpoint: str
    p256dh_key: str
    auth_key: str


@router.post('/push/subscribe', status_code=201)
def subscribe_push(
    payload: PushSubscriptionRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    existing = (
        db.query(PushSubscription)
        .filter(PushSubscription.user_id == current_user.id, PushSubscription.endpoint == payload.endpoint)
        .first()
    )
    if existing:
        return {'detail': 'Already subscribed'}

    sub = PushSubscription(
        user_id=current_user.id,
        endpoint=payload.endpoint,
        p256dh_key=payload.p256dh_key,
        auth_key=payload.auth_key,
    )
    db.add(sub)
    db.commit()
    return {'detail': 'Subscribed'}


@router.delete('/push/unsubscribe')
def unsubscribe_push(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    db.query(PushSubscription).filter(PushSubscription.user_id == current_user.id).delete()
    db.commit()
    return {'detail': 'Unsubscribed'}


@router.get('/push/status')
def push_status(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    count = db.query(PushSubscription).filter(PushSubscription.user_id == current_user.id).count()
    return {'subscribed': count > 0}
