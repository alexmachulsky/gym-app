from __future__ import annotations

import uuid
from datetime import datetime

from sqlalchemy import Boolean, DateTime, Integer, String, Uuid, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class User(Base):
    __tablename__ = 'users'

    id: Mapped[uuid.UUID] = mapped_column(Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email: Mapped[str] = mapped_column(String(255), unique=True, nullable=False, index=True)
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    name: Mapped[str | None] = mapped_column(String(120), nullable=True)
    avatar_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    subscription_tier: Mapped[str] = mapped_column(String(20), nullable=False, default='free', server_default='free', index=True)
    stripe_customer_id: Mapped[str | None] = mapped_column(String(255), unique=True, nullable=True)
    email_verified: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False, server_default='false')
    is_admin: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False, server_default='false')
    onboarding_completed: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False, server_default='false')
    trial_ends_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    last_active_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    username: Mapped[str | None] = mapped_column(String(50), unique=True, nullable=True, index=True)
    public_profile: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False, server_default='false')
    failed_login_attempts: Mapped[int] = mapped_column(Integer, nullable=False, default=0, server_default='0')
    locked_until: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    exercises = relationship('Exercise', back_populates='user', cascade='all, delete-orphan')
    workouts = relationship('Workout', back_populates='user', cascade='all, delete-orphan')
    body_metrics = relationship('BodyMetric', back_populates='user', cascade='all, delete-orphan')
    templates = relationship('WorkoutTemplate', back_populates='user', cascade='all, delete-orphan')
    preferences = relationship('UserPreference', back_populates='user', uselist=False, cascade='all, delete-orphan')
    goals = relationship('Goal', back_populates='user', cascade='all, delete-orphan')
    equipment_profiles = relationship('EquipmentProfile', back_populates='user', cascade='all, delete-orphan')
    subscription = relationship('Subscription', back_populates='user', uselist=False, cascade='all, delete-orphan')
