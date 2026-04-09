from __future__ import annotations

import uuid
from datetime import datetime
from typing import Optional

from sqlalchemy import Boolean, DateTime, ForeignKey, Integer, String, Uuid, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class UserPreference(Base):
    __tablename__ = 'user_preferences'

    id: Mapped[uuid.UUID] = mapped_column(Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey('users.id', ondelete='CASCADE'),
        nullable=False,
        unique=True,
        index=True,
    )
    weight_unit: Mapped[str] = mapped_column(String(10), nullable=False, default='kg')
    distance_unit: Mapped[str] = mapped_column(String(10), nullable=False, default='km')
    rest_timer_default: Mapped[int] = mapped_column(Integer, nullable=False, default=90)
    push_enabled: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False, server_default='false')
    reminder_days: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)  # comma-separated: "mon,wed,fri"
    reminder_time: Mapped[Optional[str]] = mapped_column(String(10), nullable=True)  # HH:MM format
    weekly_summary_enabled: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True, server_default='true')
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False
    )

    user = relationship('User', back_populates='preferences')
