import secrets
import uuid
from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel
from sqlalchemy import func
from sqlalchemy.orm import Session, joinedload

from app.core.database import get_db
from app.core.limiter import limiter
from app.models.follow import Follow
from app.models.shared_workout import SharedWorkout
from app.models.user import User
from app.models.workout import Workout
from app.models.workout_set import WorkoutSet
from app.utils.deps import get_current_user

router = APIRouter(prefix='/social', tags=['social'])


class UsernameRequest(BaseModel):
    username: str


class FollowRequest(BaseModel):
    user_id: uuid.UUID


@router.put('/profile/username')
def set_username(
    payload: UsernameRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    username = payload.username.strip().lower()
    if len(username) < 3 or len(username) > 50:
        raise HTTPException(status_code=400, detail='Username must be 3-50 characters')
    existing = db.query(User).filter(User.username == username, User.id != current_user.id).first()
    if existing:
        raise HTTPException(status_code=409, detail='Username already taken')
    current_user.username = username
    current_user.public_profile = True
    db.commit()
    return {'username': current_user.username, 'public_profile': True}


@router.get('/profile/{username}')
def get_public_profile(username: str, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.username == username, User.public_profile == True).first()
    if not user:
        raise HTTPException(status_code=404, detail='Profile not found')
    workout_count = db.query(func.count(Workout.id)).filter(Workout.user_id == user.id).scalar()
    return {
        'username': user.username,
        'name': user.name,
        'workout_count': workout_count,
        'member_since': user.created_at,
    }


@router.post('/follow')
def follow_user(
    payload: FollowRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if payload.user_id == current_user.id:
        raise HTTPException(status_code=400, detail='Cannot follow yourself')
    target = db.query(User).filter(User.id == payload.user_id, User.public_profile == True).first()
    if not target:
        raise HTTPException(status_code=404, detail='User not found')
    existing = db.query(Follow).filter(
        Follow.follower_id == current_user.id, Follow.following_id == payload.user_id
    ).first()
    if existing:
        return {'detail': 'Already following'}
    follow = Follow(follower_id=current_user.id, following_id=payload.user_id)
    db.add(follow)
    db.commit()
    return {'detail': 'Followed'}


@router.delete('/follow/{user_id}')
def unfollow_user(
    user_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    follow = db.query(Follow).filter(
        Follow.follower_id == current_user.id, Follow.following_id == user_id
    ).first()
    if not follow:
        raise HTTPException(status_code=404, detail='Not following this user')
    db.delete(follow)
    db.commit()
    return {'detail': 'Unfollowed'}


@router.get('/followers')
def get_followers(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    followers = (
        db.query(User)
        .join(Follow, Follow.follower_id == User.id)
        .filter(Follow.following_id == current_user.id)
        .all()
    )
    return [{'id': u.id, 'username': u.username, 'name': u.name} for u in followers]


@router.get('/following')
def get_following(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    following = (
        db.query(User)
        .join(Follow, Follow.following_id == User.id)
        .filter(Follow.follower_id == current_user.id)
        .all()
    )
    return [{'id': u.id, 'username': u.username, 'name': u.name} for u in following]


@router.post('/share/workout/{workout_id}')
def share_workout(
    workout_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    workout = db.query(Workout).filter(Workout.id == workout_id, Workout.user_id == current_user.id).first()
    if not workout:
        raise HTTPException(status_code=404, detail='Workout not found')
    existing = db.query(SharedWorkout).filter(SharedWorkout.workout_id == workout_id).first()
    if existing:
        return {'share_token': existing.share_token}
    token = secrets.token_urlsafe(32)
    expires_at = datetime.now(timezone.utc) + timedelta(days=30)
    shared = SharedWorkout(workout_id=workout_id, user_id=current_user.id, share_token=token, expires_at=expires_at)
    db.add(shared)
    db.commit()
    return {'share_token': token}


@router.get('/shared/{share_token}')
@limiter.limit('30/minute')
def get_shared_workout(share_token: str, request: Request, db: Session = Depends(get_db)):
    shared = db.query(SharedWorkout).filter(SharedWorkout.share_token == share_token).first()
    if not shared:
        raise HTTPException(status_code=404, detail='Shared workout not found')
    if shared.expires_at and shared.expires_at < datetime.now(timezone.utc):
        raise HTTPException(status_code=404, detail='Shared workout link has expired')
    workout = (
        db.query(Workout)
        .options(joinedload(Workout.workout_sets))
        .filter(Workout.id == shared.workout_id)
        .first()
    )
    if not workout:
        raise HTTPException(status_code=404, detail='Workout not found')
    user = db.query(User).filter(User.id == shared.user_id).first()
    return {
        'username': user.username if user else None,
        'date': workout.date,
        'notes': workout.notes,
        'duration_seconds': workout.duration_seconds,
        'sets': [
            {'exercise_id': s.exercise_id, 'weight': s.weight, 'reps': s.reps, 'sets': s.sets}
            for s in workout.workout_sets
        ],
    }
