from sqlalchemy.orm import Session

from app.models.body_metric import BodyMetric
from app.models.user import User


class BodyMetricService:
    @staticmethod
    def create_metric(db: Session, user: User, weight: float, metric_date) -> BodyMetric:
        metric = BodyMetric(user_id=user.id, weight=weight, date=metric_date)
        db.add(metric)
        db.commit()
        db.refresh(metric)
        return metric

    @staticmethod
    def list_metrics(db: Session, user: User) -> list[BodyMetric]:
        return (
            db.query(BodyMetric)
            .filter(BodyMetric.user_id == user.id)
            .order_by(BodyMetric.date.asc())
            .all()
        )
