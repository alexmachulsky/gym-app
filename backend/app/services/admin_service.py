from __future__ import annotations

import uuid
from datetime import datetime, timedelta, timezone
from typing import Optional

from fastapi import HTTPException, status
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.core.security import create_access_token, create_refresh_token
from app.models.exercise import Exercise
from app.models.user import User
from app.models.workout import Workout


class AdminService:

    @staticmethod
    def get_stats(db: Session) -> dict:
        now = datetime.now(timezone.utc)
        week_ago = now - timedelta(days=7)

        total_users = db.query(func.count(User.id)).scalar()
        pro_users = db.query(func.count(User.id)).filter(User.subscription_tier == 'pro').scalar()
        free_users = total_users - pro_users
        total_workouts = db.query(func.count(Workout.id)).scalar()
        total_exercises = db.query(func.count(Exercise.id)).scalar()
        users_last_7_days = db.query(func.count(User.id)).filter(User.created_at >= week_ago).scalar()
        workouts_last_7_days = db.query(func.count(Workout.id)).filter(Workout.date >= week_ago.date()).scalar()

        return {
            'total_users': total_users,
            'pro_users': pro_users,
            'free_users': free_users,
            'total_workouts': total_workouts,
            'total_exercises': total_exercises,
            'users_last_7_days': users_last_7_days,
            'workouts_last_7_days': workouts_last_7_days,
        }

    @staticmethod
    def list_users(
        db: Session,
        skip: int = 0,
        limit: int = 50,
        search: Optional[str] = None,
        tier: Optional[str] = None,
    ) -> list[User]:
        query = db.query(User)
        if search:
            query = query.filter(User.email.ilike(f'%{search}%'))
        if tier:
            query = query.filter(User.subscription_tier == tier)
        return query.order_by(User.created_at.desc()).offset(skip).limit(limit).all()

    @staticmethod
    def get_user(db: Session, user_id: uuid.UUID) -> User:
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='User not found')
        return user

    @staticmethod
    def update_user(db: Session, user_id: uuid.UUID, updates: dict) -> User:
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='User not found')

        for field, value in updates.items():
            if value is not None:
                setattr(user, field, value)

        db.commit()
        db.refresh(user)
        return user

    @staticmethod
    def impersonate_user(db: Session, user_id: uuid.UUID) -> dict:
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='User not found')

        access_token = create_access_token({'sub': str(user.id)})
        refresh_token = create_refresh_token({'sub': str(user.id)})
        return {
            'access_token': access_token,
            'refresh_token': refresh_token,
            'token_type': 'bearer',
            'impersonating': user.email,
        }

    @staticmethod
    def get_user_detail(db: Session, user_id: uuid.UUID) -> dict:
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='User not found')

        workout_count = db.query(func.count(Workout.id)).filter(Workout.user_id == user.id).scalar()
        exercise_count = db.query(func.count(Exercise.id)).filter(Exercise.user_id == user.id).scalar()

        return {
            'id': user.id,
            'email': user.email,
            'name': user.name,
            'subscription_tier': user.subscription_tier,
            'stripe_customer_id': user.stripe_customer_id,
            'email_verified': user.email_verified,
            'is_admin': user.is_admin,
            'created_at': user.created_at,
            'workout_count': workout_count,
            'exercise_count': exercise_count,
        }
