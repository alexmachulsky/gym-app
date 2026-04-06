import uuid
from typing import Optional

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.body_metric import BodyMetric
from app.models.user import User


class BodyMetricService:
    @staticmethod
    def create_metric(
        db: Session,
        user: User,
        weight: float,
        metric_date,
        body_fat_percentage: Optional[float] = None,
        muscle_mass: Optional[float] = None,
        notes: Optional[str] = None,
    ) -> BodyMetric:
        metric = BodyMetric(
            user_id=user.id,
            weight=weight,
            date=metric_date,
            body_fat_percentage=body_fat_percentage,
            muscle_mass=muscle_mass,
            notes=notes,
        )
        db.add(metric)
        db.commit()
        db.refresh(metric)
        return metric

    @staticmethod
    def list_metrics(db: Session, user: User, skip: int = 0, limit: int = 50) -> list[BodyMetric]:
        return (
            db.query(BodyMetric)
            .filter(BodyMetric.user_id == user.id)
            .order_by(BodyMetric.date.asc())
            .offset(skip)
            .limit(limit)
            .all()
        )

    @staticmethod
    def delete_metric(db: Session, user: User, metric_id: uuid.UUID) -> None:
        metric = (
            db.query(BodyMetric)
            .filter(BodyMetric.id == metric_id, BodyMetric.user_id == user.id)
            .first()
        )
        if not metric:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='Metric not found')
        db.delete(metric)
        db.commit()
