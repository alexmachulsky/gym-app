from __future__ import annotations

import uuid
from datetime import date
from typing import Optional

from sqlalchemy import Date, Float, ForeignKey, Text, Uuid
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class BodyMetric(Base):
    __tablename__ = 'body_metrics'

    id: Mapped[uuid.UUID] = mapped_column(Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey('users.id', ondelete='CASCADE'),
        nullable=False,
        index=True,
    )
    weight: Mapped[float] = mapped_column(Float, nullable=False)
    body_fat_percentage: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    muscle_mass: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    date: Mapped[date] = mapped_column(Date, nullable=False)

    user = relationship('User', back_populates='body_metrics')
