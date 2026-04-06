import uuid
import random
from datetime import date

from sqlalchemy.orm import Session

from app.models.exercise import Exercise
from app.models.user import User
from app.models.workout import Workout
from app.models.workout_set import WorkoutSet


# Default exercise templates for workout generation (muscle group -> suggested exercises with rep/set schemes)
MUSCLE_GROUP_DEFAULTS = {
    'Chest': {'sets': 3, 'reps': 10, 'exercises_per_group': 3},
    'Back': {'sets': 3, 'reps': 10, 'exercises_per_group': 3},
    'Legs': {'sets': 4, 'reps': 8, 'exercises_per_group': 4},
    'Shoulders': {'sets': 3, 'reps': 12, 'exercises_per_group': 3},
    'Arms': {'sets': 3, 'reps': 12, 'exercises_per_group': 3},
    'Core': {'sets': 3, 'reps': 15, 'exercises_per_group': 2},
    'Glutes': {'sets': 3, 'reps': 10, 'exercises_per_group': 3},
    'Full Body': {'sets': 3, 'reps': 8, 'exercises_per_group': 3},
    'Cardio': {'sets': 1, 'reps': 1, 'exercises_per_group': 2},
}

DIFFICULTY_MULTIPLIER = {
    'beginner': 0.6,
    'intermediate': 0.8,
    'advanced': 1.0,
}


class GeneratorService:
    @staticmethod
    def generate_workout(
        db: Session,
        user: User,
        muscle_groups: list[str],
        equipment: list[str] | None = None,
        difficulty: str = 'intermediate',
        target_duration_minutes: int = 60,
    ) -> list[dict]:
        user_exercises = (
            db.query(Exercise)
            .filter(Exercise.user_id == user.id)
            .all()
        )

        if not user_exercises:
            return []

        diff_mult = DIFFICULTY_MULTIPLIER.get(difficulty, 0.8)
        suggested = []

        for mg in muscle_groups:
            defaults = MUSCLE_GROUP_DEFAULTS.get(mg, {'sets': 3, 'reps': 10, 'exercises_per_group': 3})

            candidates = [
                e for e in user_exercises
                if (e.muscle_group and mg.lower() in e.muscle_group.lower())
                or (e.category and e.category.lower() == mg.lower())
            ]

            if equipment:
                eq_filtered = [e for e in candidates if e.equipment and e.equipment.lower() in [eq.lower() for eq in equipment]]
                if eq_filtered:
                    candidates = eq_filtered

            if not candidates:
                continue

            random.shuffle(candidates)
            count = min(defaults['exercises_per_group'], len(candidates))
            selected = candidates[:count]

            for ex in selected:
                last_weight = GeneratorService._get_last_weight(db, user.id, ex.id)
                suggested_weight = round(last_weight * 1.025, 1) if last_weight else None

                suggested.append({
                    'exercise_id': str(ex.id),
                    'exercise_name': ex.name,
                    'weight': suggested_weight,
                    'reps': int(defaults['reps'] * diff_mult),
                    'sets': defaults['sets'],
                    'muscle_group': mg,
                })

        return suggested

    @staticmethod
    def _get_last_weight(db: Session, user_id: uuid.UUID, exercise_id: uuid.UUID) -> float | None:
        row = (
            db.query(WorkoutSet.weight)
            .join(Workout, Workout.id == WorkoutSet.workout_id)
            .filter(Workout.user_id == user_id, WorkoutSet.exercise_id == exercise_id)
            .order_by(Workout.date.desc(), Workout.created_at.desc())
            .first()
        )
        return row[0] if row else None

    @staticmethod
    def get_weight_suggestion(db: Session, user_id: uuid.UUID, exercise_id: uuid.UUID) -> float | None:
        last = GeneratorService._get_last_weight(db, user_id, exercise_id)
        if last:
            return round(last * 1.025, 1)
        return None
