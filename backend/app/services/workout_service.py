import uuid
from datetime import date

from fastapi import HTTPException, status
from sqlalchemy.orm import Session, joinedload

from app.models.exercise import Exercise
from app.models.user import User
from app.models.workout import Workout
from app.models.workout_set import WorkoutSet
from app.schemas.workout import WorkoutCreateRequest, WorkoutResponse, WorkoutSetResponse


class WorkoutService:
    @staticmethod
    def create_exercise(db: Session, user: User, name: str) -> Exercise:
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
        exercise = Exercise(user_id=user.id, name=name.strip())
        db.add(exercise)
        db.commit()
        db.refresh(exercise)
        return exercise

    @staticmethod
    def list_exercises(db: Session, user: User) -> list[Exercise]:
        return (
            db.query(Exercise)
            .filter(Exercise.user_id == user.id)
            .order_by(Exercise.created_at.asc())
            .all()
        )

    @staticmethod
    def create_workout(db: Session, user: User, payload: WorkoutCreateRequest) -> Workout:
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

        workout = Workout(user_id=user.id, date=payload.date)
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

        db.commit()
        db.refresh(workout)
        return (
            db.query(Workout)
            .options(joinedload(Workout.workout_sets))
            .filter(Workout.id == workout.id)
            .first()
        )

    @staticmethod
    def list_workouts(
        db: Session,
        user: User,
        from_date: date | None = None,
        to_date: date | None = None,
        exercise_id: uuid.UUID | None = None,
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

        workouts = query.all()
        if exercise_id:
            workouts = [
                w for w in workouts if any(set_item.exercise_id == exercise_id for set_item in w.workout_sets)
            ]
        return workouts


def workout_to_response(workout: Workout) -> WorkoutResponse:
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
    return WorkoutResponse(id=workout.id, date=workout.date, created_at=workout.created_at, sets=sets)
