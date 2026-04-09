import uuid
from datetime import datetime, timedelta, timezone

from sqlalchemy import func
from sqlalchemy.orm import Session

from app.models.achievement import Achievement
from app.models.body_metric import BodyMetric
from app.models.workout import Workout

ACHIEVEMENT_DEFINITIONS = {
    'first_workout': {'label': 'First Workout', 'description': 'Log your first workout'},
    'streak_7': {'label': '7-Day Streak', 'description': 'Work out 7 days in a row'},
    'streak_30': {'label': '30-Day Streak', 'description': 'Work out 30 days in a row'},
    'workouts_10': {'label': '10 Workouts', 'description': 'Complete 10 workouts'},
    'workouts_50': {'label': '50 Workouts', 'description': 'Complete 50 workouts'},
    'workouts_100': {'label': '100 Workouts', 'description': 'Complete 100 workouts'},
    'thousand_lb_club': {'label': '1000 lb Club', 'description': 'Squat + Bench + Deadlift total >= 1000 lbs'},
    'body_recomp': {'label': 'Body Recomp', 'description': 'Weight down while muscle mass up'},
    'early_bird': {'label': 'Early Bird', 'description': 'Log a workout before 7 AM'},
    'consistency_king': {'label': 'Consistency King', 'description': 'Work out every week for 12 weeks'},
}


class AchievementService:
    @staticmethod
    def get_user_achievements(db: Session, user_id: uuid.UUID) -> list[dict]:
        achievements = (
            db.query(Achievement)
            .filter(Achievement.user_id == user_id)
            .order_by(Achievement.unlocked_at.desc())
            .all()
        )
        result = []
        for a in achievements:
            defn = ACHIEVEMENT_DEFINITIONS.get(a.achievement_type, {})
            result.append({
                'id': a.id,
                'type': a.achievement_type,
                'label': defn.get('label', a.achievement_type),
                'description': defn.get('description', ''),
                'unlocked_at': a.unlocked_at,
            })
        return result

    @staticmethod
    def get_available_achievements() -> list[dict]:
        return [
            {'type': k, 'label': v['label'], 'description': v['description']}
            for k, v in ACHIEVEMENT_DEFINITIONS.items()
        ]

    @staticmethod
    def _has_achievement(db: Session, user_id: uuid.UUID, achievement_type: str) -> bool:
        return (
            db.query(Achievement)
            .filter(Achievement.user_id == user_id, Achievement.achievement_type == achievement_type)
            .first()
        ) is not None

    @staticmethod
    def _grant(db: Session, user_id: uuid.UUID, achievement_type: str) -> Achievement | None:
        if AchievementService._has_achievement(db, user_id, achievement_type):
            return None
        a = Achievement(user_id=user_id, achievement_type=achievement_type)
        db.add(a)
        db.flush()
        return a

    @staticmethod
    def check_after_workout(db: Session, user_id: uuid.UUID) -> list[str]:
        """Check and grant achievements after a workout is logged. Returns list of newly granted types."""
        newly_granted = []
        workout_count = db.query(func.count(Workout.id)).filter(Workout.user_id == user_id).scalar()

        if workout_count >= 1:
            a = AchievementService._grant(db, user_id, 'first_workout')
            if a:
                newly_granted.append('first_workout')

        if workout_count >= 10:
            a = AchievementService._grant(db, user_id, 'workouts_10')
            if a:
                newly_granted.append('workouts_10')

        if workout_count >= 50:
            a = AchievementService._grant(db, user_id, 'workouts_50')
            if a:
                newly_granted.append('workouts_50')

        if workout_count >= 100:
            a = AchievementService._grant(db, user_id, 'workouts_100')
            if a:
                newly_granted.append('workouts_100')

        # Streak checks
        now = datetime.now(timezone.utc).date()
        dates = [
            row[0]
            for row in db.query(Workout.date)
            .filter(Workout.user_id == user_id)
            .distinct()
            .order_by(Workout.date.desc())
            .all()
        ]
        streak = 0
        for i, d in enumerate(dates):
            if d == now - timedelta(days=i):
                streak += 1
            else:
                break

        if streak >= 7:
            a = AchievementService._grant(db, user_id, 'streak_7')
            if a:
                newly_granted.append('streak_7')
        if streak >= 30:
            a = AchievementService._grant(db, user_id, 'streak_30')
            if a:
                newly_granted.append('streak_30')

        if newly_granted:
            db.commit()
        return newly_granted

    @staticmethod
    def check_after_body_metric(db: Session, user_id: uuid.UUID) -> list[str]:
        """Check body-recomp achievement after a body metric entry."""
        newly_granted = []
        metrics = (
            db.query(BodyMetric)
            .filter(BodyMetric.user_id == user_id)
            .order_by(BodyMetric.date.asc())
            .all()
        )
        if len(metrics) >= 2:
            first, last = metrics[0], metrics[-1]
            weight_down = last.weight < first.weight
            muscle_up = (
                first.muscle_mass is not None
                and last.muscle_mass is not None
                and last.muscle_mass > first.muscle_mass
            )
            if weight_down and muscle_up:
                a = AchievementService._grant(db, user_id, 'body_recomp')
                if a:
                    newly_granted.append('body_recomp')
                    db.commit()
        return newly_granted
