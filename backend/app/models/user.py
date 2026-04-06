from __future__ import annotations

import uuid
from datetime import datetime

from sqlalchemy import Boolean, DateTime, String, Uuid, func
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
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    exercises = relationship('Exercise', back_populates='user', cascade='all, delete-orphan')
    workouts = relationship('Workout', back_populates='user', cascade='all, delete-orphan')
    body_metrics = relationship('BodyMetric', back_populates='user', cascade='all, delete-orphan')
    templates = relationship('WorkoutTemplate', back_populates='user', cascade='all, delete-orphan')
    preferences = relationship('UserPreference', back_populates='user', uselist=False, cascade='all, delete-orphan')
    goals = relationship('Goal', back_populates='user', cascade='all, delete-orphan')
    equipment_profiles = relationship('EquipmentProfile', back_populates='user', cascade='all, delete-orphan')
    subscription = relationship('Subscription', back_populates='user', uselist=False, cascade='all, delete-orphan')
