import uuid
from collections import OrderedDict

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.exercise import Exercise
from app.models.workout import Workout
from app.models.workout_set import WorkoutSet
from app.schemas.progress import ProgressResponse


class ProgressionService:
    @staticmethod
    def calculate_volume(weight: float, reps: int, sets: int) -> float:
        return weight * reps * sets

    @staticmethod
    def estimate_one_rm(weight: float, reps: int) -> float:
        return weight * (1 + reps / 30)

    @staticmethod
    def analyze_exercise_progress(user_id: uuid.UUID, exercise_id: uuid.UUID, db: Session) -> ProgressResponse:
        exercise = (
            db.query(Exercise)
            .filter(Exercise.id == exercise_id, Exercise.user_id == user_id)
            .first()
        )
        if exercise is None:
            return ProgressResponse(
                exercise='unknown',
                status='insufficient_data',
                message='Exercise not found for current user',
                sessions_analyzed=0,
            )

        stmt = (
            select(
                Workout.id,
                Workout.date,
                WorkoutSet.weight,
                WorkoutSet.reps,
                WorkoutSet.sets,
            )
            .join(WorkoutSet, WorkoutSet.workout_id == Workout.id)
            .where(Workout.user_id == user_id, WorkoutSet.exercise_id == exercise_id)
            .order_by(Workout.date.desc(), Workout.created_at.desc())
        )
        rows = db.execute(stmt).all()

        sessions: OrderedDict[uuid.UUID, dict] = OrderedDict()
        for workout_id, workout_date, weight, reps, sets in rows:
            if workout_id not in sessions:
                sessions[workout_id] = {
                    'date': workout_date,
                    'volume': 0.0,
                    'one_rm': 0.0,
                }
            volume = ProgressionService.calculate_volume(weight, reps, sets)
            est_one_rm = ProgressionService.estimate_one_rm(weight, reps)
            sessions[workout_id]['volume'] += volume
            sessions[workout_id]['one_rm'] = max(sessions[workout_id]['one_rm'], est_one_rm)

        session_values = list(sessions.values())[:3]
        sessions_analyzed = len(session_values)

        if sessions_analyzed < 3:
            latest = session_values[0] if session_values else None
            return ProgressResponse(
                exercise=exercise.name,
                status='insufficient_data',
                message='Need at least 3 sessions to evaluate progression',
                latest_volume=(latest['volume'] if latest else None),
                latest_estimated_1rm=(latest['one_rm'] if latest else None),
                sessions_analyzed=sessions_analyzed,
            )

        chron = list(reversed(session_values))
        improved = False
        best_volume = chron[0]['volume']
        best_one_rm = chron[0]['one_rm']

        for session in chron[1:]:
            if session['volume'] > best_volume or session['one_rm'] > best_one_rm:
                improved = True
            best_volume = max(best_volume, session['volume'])
            best_one_rm = max(best_one_rm, session['one_rm'])

        latest = chron[-1]
        if improved:
            status = 'progressing'
            message = 'Strength progression detected in last 3 sessions'
        else:
            status = 'plateau'
            message = 'No strength increase in last 3 sessions'

        return ProgressResponse(
            exercise=exercise.name,
            status=status,
            message=message,
            latest_volume=latest['volume'],
            latest_estimated_1rm=latest['one_rm'],
            sessions_analyzed=sessions_analyzed,
        )
