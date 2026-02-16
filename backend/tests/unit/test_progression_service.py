from datetime import date

from app.models.exercise import Exercise
from app.models.user import User
from app.models.workout import Workout
from app.models.workout_set import WorkoutSet
from app.services.progression_service import ProgressionService


def _make_user_and_exercise(db_session):
    user = User(email='lifter@example.com', password_hash='x')
    db_session.add(user)
    db_session.flush()
    exercise = Exercise(user_id=user.id, name='Bench Press')
    db_session.add(exercise)
    db_session.commit()
    db_session.refresh(user)
    db_session.refresh(exercise)
    return user, exercise


def _add_workout_with_set(db_session, user_id, exercise_id, workout_date, weight, reps, sets):
    workout = Workout(user_id=user_id, date=workout_date)
    db_session.add(workout)
    db_session.flush()
    db_session.add(
        WorkoutSet(
            workout_id=workout.id,
            exercise_id=exercise_id,
            weight=weight,
            reps=reps,
            sets=sets,
        )
    )
    db_session.commit()


def test_volume_formula():
    assert ProgressionService.calculate_volume(100, 5, 3) == 1500


def test_one_rm_formula():
    assert round(ProgressionService.estimate_one_rm(100, 5), 2) == round(100 * (1 + 5 / 30), 2)


def test_insufficient_data_for_progress(db_session):
    user, exercise = _make_user_and_exercise(db_session)
    _add_workout_with_set(db_session, user.id, exercise.id, date(2026, 1, 1), 100, 5, 3)
    _add_workout_with_set(db_session, user.id, exercise.id, date(2026, 1, 8), 100, 5, 3)

    result = ProgressionService.analyze_exercise_progress(user.id, exercise.id, db_session)

    assert result.status == 'insufficient_data'
    assert result.sessions_analyzed == 2


def test_plateau_detection(db_session):
    user, exercise = _make_user_and_exercise(db_session)
    _add_workout_with_set(db_session, user.id, exercise.id, date(2026, 1, 1), 100, 5, 3)
    _add_workout_with_set(db_session, user.id, exercise.id, date(2026, 1, 8), 100, 5, 3)
    _add_workout_with_set(db_session, user.id, exercise.id, date(2026, 1, 15), 100, 5, 3)

    result = ProgressionService.analyze_exercise_progress(user.id, exercise.id, db_session)

    assert result.status == 'plateau'
    assert 'No strength increase' in result.message


def test_progressing_detection(db_session):
    user, exercise = _make_user_and_exercise(db_session)
    _add_workout_with_set(db_session, user.id, exercise.id, date(2026, 1, 1), 100, 5, 3)
    _add_workout_with_set(db_session, user.id, exercise.id, date(2026, 1, 8), 102.5, 5, 3)
    _add_workout_with_set(db_session, user.id, exercise.id, date(2026, 1, 15), 105, 5, 3)

    result = ProgressionService.analyze_exercise_progress(user.id, exercise.id, db_session)

    assert result.status == 'progressing'


def test_equal_metrics_still_plateau(db_session):
    user, exercise = _make_user_and_exercise(db_session)
    _add_workout_with_set(db_session, user.id, exercise.id, date(2026, 1, 1), 80, 10, 3)
    _add_workout_with_set(db_session, user.id, exercise.id, date(2026, 1, 8), 80, 10, 3)
    _add_workout_with_set(db_session, user.id, exercise.id, date(2026, 1, 15), 80, 10, 3)

    result = ProgressionService.analyze_exercise_progress(user.id, exercise.id, db_session)

    assert result.status == 'plateau'
