import uuid
from collections import OrderedDict
from datetime import date, timedelta

from sqlalchemy import func as sqlfunc, select
from sqlalchemy.orm import Session

from app.models.exercise import Exercise
from app.models.workout import Workout
from app.models.workout_set import WorkoutSet
from app.schemas.progress import (
    MuscleGroupVolumeResponse,
    MuscleRecoveryResponse,
    PersonalRecordResponse,
    ProgressDetailResponse,
    ProgressResponse,
    SessionComparisonResponse,
    SessionDataPoint,
)


class ProgressionService:
    @staticmethod
    def calculate_volume(weight: float, reps: int, sets: int) -> float:
        return weight * reps * sets

    @staticmethod
    def estimate_one_rm(weight: float, reps: int) -> float:
        return weight * (1 + reps / 30)

    @staticmethod
    def analyze_exercise_progress(
        user_id: uuid.UUID,
        exercise_id: uuid.UUID,
        db: Session,
        from_date: date | None = None,
        to_date: date | None = None,
        limit: int = 10,
    ) -> ProgressDetailResponse:
        exercise = (
            db.query(Exercise)
            .filter(Exercise.id == exercise_id, Exercise.user_id == user_id)
            .first()
        )
        if exercise is None:
            return ProgressDetailResponse(
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
        )

        if from_date:
            stmt = stmt.where(Workout.date >= from_date)
        if to_date:
            stmt = stmt.where(Workout.date <= to_date)

        stmt = stmt.order_by(Workout.date.desc(), Workout.created_at.desc())
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

        # Build session data for all sessions (up to limit)
        all_sessions = list(sessions.values())[:limit]
        session_data = [
            SessionDataPoint(
                date=s['date'],
                volume=round(s['volume'], 2),
                estimated_1rm=round(s['one_rm'], 2),
            )
            for s in reversed(all_sessions)
        ]

        # Plateau detection on last 3
        session_values = all_sessions[:3]
        sessions_analyzed = len(session_values)

        if sessions_analyzed < 3:
            latest = session_values[0] if session_values else None
            return ProgressDetailResponse(
                exercise=exercise.name,
                status='insufficient_data',
                message='Need at least 3 sessions to evaluate progression',
                latest_volume=(latest['volume'] if latest else None),
                latest_estimated_1rm=(latest['one_rm'] if latest else None),
                sessions_analyzed=sessions_analyzed,
                session_data=session_data,
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
            p_status = 'progressing'
            message = 'Strength progression detected in last 3 sessions'
        else:
            p_status = 'plateau'
            message = 'No strength increase in last 3 sessions'

        return ProgressDetailResponse(
            exercise=exercise.name,
            status=p_status,
            message=message,
            latest_volume=latest['volume'],
            latest_estimated_1rm=latest['one_rm'],
            sessions_analyzed=sessions_analyzed,
            session_data=session_data,
        )

    @staticmethod
    def get_personal_records(
        user_id: uuid.UUID, exercise_id: uuid.UUID, db: Session
    ) -> list[PersonalRecordResponse]:
        exercise = (
            db.query(Exercise)
            .filter(Exercise.id == exercise_id, Exercise.user_id == user_id)
            .first()
        )
        if not exercise:
            return []

        records = []

        # Max weight
        max_weight_row = (
            db.query(WorkoutSet.weight, Workout.date)
            .join(Workout, Workout.id == WorkoutSet.workout_id)
            .filter(Workout.user_id == user_id, WorkoutSet.exercise_id == exercise_id)
            .order_by(WorkoutSet.weight.desc())
            .first()
        )
        if max_weight_row:
            records.append(PersonalRecordResponse(
                exercise_name=exercise.name,
                record_type='max_weight',
                value=max_weight_row[0],
                date_achieved=max_weight_row[1],
            ))

        # Max estimated 1RM
        all_sets = (
            db.query(WorkoutSet.weight, WorkoutSet.reps, Workout.date)
            .join(Workout, Workout.id == WorkoutSet.workout_id)
            .filter(Workout.user_id == user_id, WorkoutSet.exercise_id == exercise_id)
            .all()
        )
        if all_sets:
            best_1rm = 0.0
            best_date = None
            for w, r, d in all_sets:
                orm = ProgressionService.estimate_one_rm(w, r)
                if orm > best_1rm:
                    best_1rm = orm
                    best_date = d
            records.append(PersonalRecordResponse(
                exercise_name=exercise.name,
                record_type='max_estimated_1rm',
                value=round(best_1rm, 2),
                date_achieved=best_date,
            ))

        # Max single-set volume
        max_vol_row = (
            db.query(
                (WorkoutSet.weight * WorkoutSet.reps * WorkoutSet.sets).label('vol'),
                Workout.date,
            )
            .join(Workout, Workout.id == WorkoutSet.workout_id)
            .filter(Workout.user_id == user_id, WorkoutSet.exercise_id == exercise_id)
            .order_by((WorkoutSet.weight * WorkoutSet.reps * WorkoutSet.sets).desc())
            .first()
        )
        if max_vol_row:
            records.append(PersonalRecordResponse(
                exercise_name=exercise.name,
                record_type='max_volume',
                value=round(max_vol_row[0], 2),
                date_achieved=max_vol_row[1],
            ))

        return records

    @staticmethod
    def get_recent_records(user_id: uuid.UUID, db: Session, days: int = 7) -> list[PersonalRecordResponse]:
        cutoff = date.today() - timedelta(days=days)
        exercises = db.query(Exercise).filter(Exercise.user_id == user_id).all()

        recent_records = []
        for exercise in exercises:
            prs = ProgressionService.get_personal_records(user_id, exercise.id, db)
            for pr in prs:
                if pr.date_achieved and pr.date_achieved >= cutoff:
                    recent_records.append(pr)

        return recent_records

    @staticmethod
    def get_muscle_group_volume(
        user_id: uuid.UUID, db: Session, from_date: date | None = None, to_date: date | None = None
    ) -> list[MuscleGroupVolumeResponse]:
        query = (
            db.query(
                Exercise.muscle_group,
                sqlfunc.sum(WorkoutSet.weight * WorkoutSet.reps * WorkoutSet.sets).label('total_vol'),
                sqlfunc.count(sqlfunc.distinct(Workout.id)).label('wcount'),
            )
            .join(WorkoutSet, WorkoutSet.exercise_id == Exercise.id)
            .join(Workout, Workout.id == WorkoutSet.workout_id)
            .filter(Workout.user_id == user_id, Exercise.muscle_group.isnot(None))
        )

        if from_date:
            query = query.filter(Workout.date >= from_date)
        if to_date:
            query = query.filter(Workout.date <= to_date)

        rows = query.group_by(Exercise.muscle_group).all()

        total_all = sum(r[1] or 0 for r in rows)
        result = []
        for muscle_group, total_vol, wcount in rows:
            if not muscle_group:
                continue
            pct = (total_vol / total_all * 100) if total_all > 0 else 0
            result.append(MuscleGroupVolumeResponse(
                muscle_group=muscle_group,
                total_volume=round(total_vol, 2),
                percentage=round(pct, 1),
                workout_count=wcount,
            ))

        return sorted(result, key=lambda x: x.total_volume, reverse=True)

    @staticmethod
    def compare_sessions(
        user_id: uuid.UUID, exercise_id: uuid.UUID, db: Session
    ) -> SessionComparisonResponse:
        exercise = (
            db.query(Exercise)
            .filter(Exercise.id == exercise_id, Exercise.user_id == user_id)
            .first()
        )
        if not exercise:
            return SessionComparisonResponse(exercise_name='unknown')

        workouts = (
            db.query(Workout)
            .filter(Workout.user_id == user_id)
            .join(WorkoutSet, WorkoutSet.workout_id == Workout.id)
            .filter(WorkoutSet.exercise_id == exercise_id)
            .order_by(Workout.date.desc(), Workout.created_at.desc())
            .distinct()
            .limit(2)
            .all()
        )

        def session_stats(workout):
            sets = db.query(WorkoutSet).filter(
                WorkoutSet.workout_id == workout.id,
                WorkoutSet.exercise_id == exercise_id,
            ).all()
            volume = sum(s.weight * s.reps * s.sets for s in sets)
            max_weight = max((s.weight for s in sets), default=0)
            total_reps = sum(s.reps * s.sets for s in sets)
            return workout.date, round(volume, 2), max_weight, total_reps

        resp = SessionComparisonResponse(exercise_name=exercise.name)

        if len(workouts) >= 1:
            d, v, w, r = session_stats(workouts[0])
            resp.current_date = d
            resp.current_volume = v
            resp.current_max_weight = w
            resp.current_total_reps = r

        if len(workouts) >= 2:
            d, v, w, r = session_stats(workouts[1])
            resp.previous_date = d
            resp.previous_volume = v
            resp.previous_max_weight = w
            resp.previous_total_reps = r

            resp.volume_change = round((resp.current_volume or 0) - (resp.previous_volume or 0), 2)
            resp.weight_change = round((resp.current_max_weight or 0) - (resp.previous_max_weight or 0), 2)
            resp.reps_change = (resp.current_total_reps or 0) - (resp.previous_total_reps or 0)

        return resp

    @staticmethod
    def get_muscle_recovery(user_id: uuid.UUID, db: Session) -> list[MuscleRecoveryResponse]:
        today = date.today()

        rows = (
            db.query(
                Exercise.muscle_group,
                sqlfunc.max(Workout.date).label('last_date'),
            )
            .join(WorkoutSet, WorkoutSet.exercise_id == Exercise.id)
            .join(Workout, Workout.id == WorkoutSet.workout_id)
            .filter(Workout.user_id == user_id, Exercise.muscle_group.isnot(None))
            .group_by(Exercise.muscle_group)
            .all()
        )

        result = []
        for muscle_group, last_date in rows:
            if not muscle_group:
                continue
            days_since = (today - last_date).days if last_date else None
            if days_since is None:
                status_str = 'recovered'
            elif days_since >= 3:
                status_str = 'recovered'
            elif days_since >= 1:
                status_str = 'resting'
            else:
                status_str = 'resting'
            result.append(MuscleRecoveryResponse(
                muscle_group=muscle_group,
                last_trained=last_date,
                days_since=days_since,
                status=status_str,
            ))

        return sorted(result, key=lambda x: x.days_since or 999)

    @staticmethod
    def get_workout_streak(user_id: uuid.UUID, db: Session) -> dict:
        """Calculate the current consecutive-day workout streak."""
        dates = (
            db.query(Workout.date)
            .filter(Workout.user_id == user_id)
            .distinct()
            .order_by(Workout.date.desc())
            .all()
        )
        if not dates:
            return {'current_streak': 0, 'longest_streak': 0}

        unique_dates = sorted({d[0] for d in dates}, reverse=True)
        today = date.today()

        # Current streak: consecutive days ending today or yesterday
        current = 0
        expected = today
        for d in unique_dates:
            if d == expected:
                current += 1
                expected = d - timedelta(days=1)
            elif d == today - timedelta(days=1) and current == 0:
                expected = d
                current = 1
                expected = d - timedelta(days=1)
            else:
                break

        # Longest streak
        longest = 1
        run = 1
        sorted_asc = sorted(unique_dates)
        for i in range(1, len(sorted_asc)):
            if (sorted_asc[i] - sorted_asc[i - 1]).days == 1:
                run += 1
                longest = max(longest, run)
            else:
                run = 1

        return {'current_streak': current, 'longest_streak': longest}
