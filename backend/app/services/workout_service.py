import uuid
from datetime import date

from fastapi import HTTPException, status
from sqlalchemy.orm import Session, joinedload

from app.models.exercise import Exercise
from app.models.user import User
from app.models.workout import Workout
from app.models.workout_set import WorkoutSet
from app.schemas.workout import (
    PersonalRecordItem,
    WorkoutCreateRequest,
    WorkoutResponse,
    WorkoutSetResponse,
)


class WorkoutService:
    @staticmethod
    def create_exercise(db: Session, user: User, name: str, **kwargs) -> Exercise:
        exists = (
            db.query(Exercise)
            .filter(Exercise.user_id == user.id, Exercise.name.ilike(name.strip()))
            .first()
        )
        if exists:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail='Exercise already exists',
            )
        exercise = Exercise(user_id=user.id, name=name.strip(), **kwargs)
        db.add(exercise)
        db.commit()
        db.refresh(exercise)
        return exercise

    @staticmethod
    def update_exercise(db: Session, user: User, exercise_id: uuid.UUID, **kwargs) -> Exercise:
        exercise = (
            db.query(Exercise)
            .filter(Exercise.id == exercise_id, Exercise.user_id == user.id)
            .first()
        )
        if not exercise:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='Exercise not found')

        new_name = kwargs.get('name')
        if new_name and new_name.strip().lower() != exercise.name.lower():
            conflict = (
                db.query(Exercise)
                .filter(Exercise.user_id == user.id, Exercise.name.ilike(new_name.strip()), Exercise.id != exercise_id)
                .first()
            )
            if conflict:
                raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail='Exercise name already exists')

        for key, value in kwargs.items():
            if value is not None:
                setattr(exercise, key, value.strip() if isinstance(value, str) and key == 'name' else value)

        db.commit()
        db.refresh(exercise)
        return exercise

    @staticmethod
    def list_exercises(db: Session, user: User, skip: int = 0, limit: int = 50) -> list[Exercise]:
        return (
            db.query(Exercise)
            .filter(Exercise.user_id == user.id)
            .order_by(Exercise.created_at.asc())
            .offset(skip)
            .limit(limit)
            .all()
        )

    @staticmethod
    def get_exercise_alternatives(db: Session, user: User, exercise_id: uuid.UUID) -> list[Exercise]:
        exercise = (
            db.query(Exercise)
            .filter(Exercise.id == exercise_id, Exercise.user_id == user.id)
            .first()
        )
        if not exercise:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='Exercise not found')

        if not exercise.muscle_group and not exercise.category:
            return []

        query = db.query(Exercise).filter(
            Exercise.user_id == user.id,
            Exercise.id != exercise_id,
        )

        if exercise.muscle_group:
            query = query.filter(Exercise.muscle_group.ilike(f'%{exercise.muscle_group.split(",")[0].strip()}%'))
        elif exercise.category:
            query = query.filter(Exercise.category == exercise.category)

        return query.limit(10).all()

    @staticmethod
    def _detect_personal_records(db: Session, user: User, workout: Workout) -> list[PersonalRecordItem]:
        records = []
        for ws in workout.workout_sets:
            exercise = db.query(Exercise).filter(Exercise.id == ws.exercise_id).first()
            if not exercise:
                continue

            # Find previous best weight for this exercise
            prev_max_weight = (
                db.query(WorkoutSet.weight)
                .join(Workout, Workout.id == WorkoutSet.workout_id)
                .filter(
                    Workout.user_id == user.id,
                    WorkoutSet.exercise_id == ws.exercise_id,
                    Workout.id != workout.id,
                )
                .order_by(WorkoutSet.weight.desc())
                .first()
            )

            if prev_max_weight is None or ws.weight > prev_max_weight[0]:
                records.append(PersonalRecordItem(
                    exercise_name=exercise.name,
                    record_type='max_weight',
                    old_value=prev_max_weight[0] if prev_max_weight else None,
                    new_value=ws.weight,
                ))

            # Check volume PR
            volume = ws.weight * ws.reps * ws.sets
            from sqlalchemy import func as sqlfunc
            prev_max_vol = (
                db.query(sqlfunc.max(WorkoutSet.weight * WorkoutSet.reps * WorkoutSet.sets))
                .join(Workout, Workout.id == WorkoutSet.workout_id)
                .filter(
                    Workout.user_id == user.id,
                    WorkoutSet.exercise_id == ws.exercise_id,
                    Workout.id != workout.id,
                )
                .scalar()
            )

            if prev_max_vol is None or volume > prev_max_vol:
                records.append(PersonalRecordItem(
                    exercise_name=exercise.name,
                    record_type='max_volume',
                    old_value=prev_max_vol,
                    new_value=volume,
                ))

        # Deduplicate by exercise+type, keep only unique
        seen = set()
        unique = []
        for r in records:
            key = (r.exercise_name, r.record_type)
            if key not in seen:
                seen.add(key)
                unique.append(r)
        return unique

    @staticmethod
    def create_workout(db: Session, user: User, payload: WorkoutCreateRequest) -> tuple[Workout, list[PersonalRecordItem]]:
        exercise_ids = {entry.exercise_id for entry in payload.sets}
        user_exercise_ids = {
            row[0]
            for row in db.query(Exercise.id)
            .filter(Exercise.user_id == user.id, Exercise.id.in_(exercise_ids))
            .all()
        }
        missing = exercise_ids - user_exercise_ids
        if missing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail='One or more exercises do not belong to the current user',
            )

        workout = Workout(
            user_id=user.id,
            date=payload.date,
            notes=payload.notes,
            effort_rating=payload.effort_rating,
            duration_seconds=payload.duration_seconds,
            template_id=payload.template_id,
        )
        db.add(workout)
        db.flush()

        for set_entry in payload.sets:
            db.add(
                WorkoutSet(
                    workout_id=workout.id,
                    exercise_id=set_entry.exercise_id,
                    weight=set_entry.weight,
                    reps=set_entry.reps,
                    sets=set_entry.sets,
                )
            )

        # Estimate calories if duration and body weight available
        if payload.duration_seconds:
            from app.models.body_metric import BodyMetric
            latest_bm = (
                db.query(BodyMetric)
                .filter(BodyMetric.user_id == user.id)
                .order_by(BodyMetric.date.desc())
                .first()
            )
            if latest_bm:
                met = 5.0
                if payload.effort_rating:
                    met = 3.5 + (payload.effort_rating / 10) * 3.0
                hours = payload.duration_seconds / 3600
                workout.estimated_calories = int(met * latest_bm.weight * hours)

        db.commit()
        db.refresh(workout)

        full_workout = (
            db.query(Workout)
            .options(joinedload(Workout.workout_sets))
            .filter(Workout.id == workout.id)
            .first()
        )

        new_records = WorkoutService._detect_personal_records(db, user, full_workout)
        return full_workout, new_records

    @staticmethod
    def delete_workout(db: Session, user: User, workout_id: uuid.UUID) -> None:
        workout = (
            db.query(Workout)
            .filter(Workout.id == workout_id, Workout.user_id == user.id)
            .first()
        )
        if not workout:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='Workout not found')
        db.delete(workout)
        db.commit()

    @staticmethod
    def delete_exercise(db: Session, user: User, exercise_id: uuid.UUID) -> None:
        exercise = (
            db.query(Exercise)
            .filter(Exercise.id == exercise_id, Exercise.user_id == user.id)
            .first()
        )
        if not exercise:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='Exercise not found')
        db.delete(exercise)
        db.commit()

    @staticmethod
    def list_workouts(
        db: Session,
        user: User,
        from_date: date | None = None,
        to_date: date | None = None,
        exercise_id: uuid.UUID | None = None,
        skip: int = 0,
        limit: int = 50,
    ) -> list[Workout]:
        query = (
            db.query(Workout)
            .options(joinedload(Workout.workout_sets))
            .filter(Workout.user_id == user.id)
            .order_by(Workout.date.asc(), Workout.created_at.asc())
        )

        if from_date:
            query = query.filter(Workout.date >= from_date)
        if to_date:
            query = query.filter(Workout.date <= to_date)

        workouts = query.offset(skip).limit(limit).all()
        if exercise_id:
            workouts = [
                w for w in workouts if any(set_item.exercise_id == exercise_id for set_item in w.workout_sets)
            ]
        return workouts

    @staticmethod
    def get_last_sets(db: Session, user: User, exercise_id: uuid.UUID):
        """Return the most recent workout sets for a given exercise."""
        latest_set = (
            db.query(WorkoutSet)
            .join(Workout, WorkoutSet.workout_id == Workout.id)
            .filter(
                Workout.user_id == user.id,
                WorkoutSet.exercise_id == exercise_id,
            )
            .order_by(Workout.date.desc(), Workout.created_at.desc())
            .first()
        )
        if not latest_set:
            return None
        return {
            'exercise_id': str(latest_set.exercise_id),
            'weight': latest_set.weight,
            'reps': latest_set.reps,
            'sets': latest_set.sets,
        }


def workout_to_response(workout: Workout, new_records: list[PersonalRecordItem] | None = None) -> WorkoutResponse:
    sets = [
        WorkoutSetResponse(
            id=set_item.id,
            exercise_id=set_item.exercise_id,
            weight=set_item.weight,
            reps=set_item.reps,
            sets=set_item.sets,
        )
        for set_item in workout.workout_sets
    ]
    return WorkoutResponse(
        id=workout.id,
        date=workout.date,
        created_at=workout.created_at,
        notes=workout.notes,
        effort_rating=workout.effort_rating,
        duration_seconds=workout.duration_seconds,
        estimated_calories=workout.estimated_calories,
        template_id=workout.template_id,
        sets=sets,
        new_records=new_records or [],
    )
