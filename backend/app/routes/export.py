import csv
import io
from datetime import date

from fastapi import APIRouter, Depends, Query
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session, joinedload

from app.core.database import get_db
from app.models.body_metric import BodyMetric
from app.models.user import User
from app.models.workout import Workout
from app.utils.deps import require_pro

router = APIRouter(prefix='/export', tags=['export'])


@router.get('/workouts')
def export_workouts(
    format: str = Query(default='csv', pattern='^csv$'),
    from_date: date | None = None,
    to_date: date | None = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_pro),
):
    query = (
        db.query(Workout)
        .options(joinedload(Workout.workout_sets))
        .filter(Workout.user_id == current_user.id)
    )
    if from_date:
        query = query.filter(Workout.date >= from_date)
    if to_date:
        query = query.filter(Workout.date <= to_date)
    workouts = query.order_by(Workout.date.desc()).all()

    buf = io.StringIO()
    writer = csv.writer(buf)
    writer.writerow(['date', 'exercise', 'weight', 'reps', 'sets', 'notes', 'effort_rating'])
    for w in workouts:
        for s in w.workout_sets:
            writer.writerow([
                w.date.isoformat(),
                s.exercise.name if s.exercise else '',
                s.weight,
                s.reps,
                s.sets,
                w.notes or '',
                w.effort_rating or '',
            ])
    buf.seek(0)
    return StreamingResponse(
        buf,
        media_type='text/csv',
        headers={'Content-Disposition': 'attachment; filename=workouts.csv'},
    )


@router.get('/body-metrics')
def export_body_metrics(
    format: str = Query(default='csv', pattern='^csv$'),
    from_date: date | None = None,
    to_date: date | None = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_pro),
):
    query = db.query(BodyMetric).filter(BodyMetric.user_id == current_user.id)
    if from_date:
        query = query.filter(BodyMetric.date >= from_date)
    if to_date:
        query = query.filter(BodyMetric.date <= to_date)
    metrics = query.order_by(BodyMetric.date.desc()).all()

    buf = io.StringIO()
    writer = csv.writer(buf)
    writer.writerow(['date', 'weight', 'body_fat_percentage', 'muscle_mass', 'notes'])
    for m in metrics:
        writer.writerow([
            m.date.isoformat(),
            m.weight,
            m.body_fat_percentage or '',
            m.muscle_mass or '',
            m.notes or '',
        ])
    buf.seek(0)
    return StreamingResponse(
        buf,
        media_type='text/csv',
        headers={'Content-Disposition': 'attachment; filename=body-metrics.csv'},
    )
