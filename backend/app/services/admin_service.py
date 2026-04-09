from __future__ import annotations

import logging
import uuid
from datetime import datetime, timedelta, timezone
from typing import Optional

from fastapi import HTTPException, status
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.core.security import create_access_token, create_impersonation_token, create_refresh_token
from app.models.audit_log import AuditLog
from app.models.exercise import Exercise
from app.models.subscription import Subscription
from app.models.user import User
from app.models.workout import Workout

logger = logging.getLogger('gym_tracker')


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
    def get_business_metrics(db: Session) -> dict:
        """Revenue, churn, and engagement metrics."""
        now = datetime.now(timezone.utc)

        monthly_count = (
            db.query(func.count(Subscription.id))
            .filter(Subscription.plan == 'pro_monthly', Subscription.status == 'active')
            .scalar() or 0
        )
        yearly_count = (
            db.query(func.count(Subscription.id))
            .filter(Subscription.plan == 'pro_yearly', Subscription.status == 'active')
            .scalar() or 0
        )
        mrr = round(monthly_count * 4.99 + yearly_count * (29.99 / 12), 2)
        arr = round(mrr * 12, 2)

        thirty_days_ago = now - timedelta(days=30)
        canceled_last_30 = (
            db.query(func.count(Subscription.id))
            .filter(Subscription.status == 'canceled', Subscription.updated_at >= thirty_days_ago)
            .scalar() or 0
        )
        total_subs = (
            db.query(func.count(Subscription.id))
            .filter(Subscription.status.in_(['active', 'canceled']))
            .scalar() or 1
        )
        churn_rate = round((canceled_last_30 / total_subs) * 100, 1)

        total_with_trial = (
            db.query(func.count(User.id))
            .filter(User.trial_ends_at.isnot(None))
            .scalar() or 0
        )
        trial_converted = (
            db.query(func.count(User.id))
            .filter(User.trial_ends_at.isnot(None), User.subscription_tier == 'pro')
            .scalar() or 0
        )
        trial_conversion_rate = round((trial_converted / max(total_with_trial, 1)) * 100, 1)

        return {
            'mrr': mrr,
            'arr': arr,
            'monthly_subscribers': monthly_count,
            'yearly_subscribers': yearly_count,
            'churn_rate_30d': churn_rate,
            'canceled_last_30d': canceled_last_30,
            'trial_conversion_rate': trial_conversion_rate,
        }

    @staticmethod
    def get_user_segments(db: Session) -> dict:
        """Segment users by activity level."""
        now = datetime.now(timezone.utc)
        seven_days_ago = now - timedelta(days=7)
        thirty_days_ago = now - timedelta(days=30)

        active = db.query(func.count(User.id)).filter(User.last_active_at >= seven_days_ago).scalar() or 0
        at_risk = db.query(func.count(User.id)).filter(
            User.last_active_at < seven_days_ago,
            User.last_active_at >= thirty_days_ago,
        ).scalar() or 0
        churned = db.query(func.count(User.id)).filter(
            (User.last_active_at < thirty_days_ago) | (User.last_active_at.is_(None))
        ).scalar() or 0
        total = db.query(func.count(User.id)).scalar() or 0

        return {
            'active_7d': active,
            'at_risk_14_30d': at_risk,
            'churned_30d_plus': churned,
            'total': total,
        }

    @staticmethod
    def get_signup_funnel(db: Session) -> dict:
        """Funnel: registered -> onboarded -> first workout -> subscribed."""
        total_registered = db.query(func.count(User.id)).scalar() or 0
        onboarded = db.query(func.count(User.id)).filter(User.onboarding_completed == True).scalar() or 0
        has_workout = (
            db.query(func.count(func.distinct(Workout.user_id))).scalar() or 0
        )
        subscribed = db.query(func.count(User.id)).filter(User.subscription_tier == 'pro').scalar() or 0

        return {
            'registered': total_registered,
            'onboarded': onboarded,
            'first_workout': has_workout,
            'subscribed': subscribed,
        }

    @staticmethod
    def list_users(
        db: Session,
        skip: int = 0,
        limit: int = 50,
        search: Optional[str] = None,
        tier: Optional[str] = None,
    ) -> list[User]:
        if search and len(search) > 100:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail='Search query too long')
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

    _ALLOWED_UPDATE_FIELDS = {'subscription_tier', 'is_admin', 'email_verified'}

    @staticmethod
    def update_user(db: Session, admin_user: User, user_id: uuid.UUID, updates: dict) -> User:
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='User not found')

        if 'subscription_tier' in updates and updates['subscription_tier'] is not None:
            user.subscription_tier = updates['subscription_tier']
        if 'is_admin' in updates and updates['is_admin'] is not None:
            user.is_admin = updates['is_admin']
        if 'email_verified' in updates and updates['email_verified'] is not None:
            user.email_verified = updates['email_verified']

        # Audit log
        audit = AuditLog(
            admin_id=admin_user.id,
            target_user_id=user_id,
            action='update_user',
            event_metadata=str({k: v for k, v in updates.items() if v is not None}),
        )
        db.add(audit)

        db.commit()
        db.refresh(user)
        return user

    @staticmethod
    def impersonate_user(db: Session, admin_user: User, user_id: uuid.UUID, ip_address: str | None = None) -> dict:
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='User not found')

        access_token = create_impersonation_token(str(user.id), str(admin_user.id))
        refresh_token = create_refresh_token(str(user.id))

        # Audit log
        audit = AuditLog(
            admin_id=admin_user.id,
            target_user_id=user_id,
            action='impersonate',
            ip_address=ip_address,
        )
        db.add(audit)
        db.commit()

        logger.info('Admin %s impersonated user %s', admin_user.email, user.email)

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
