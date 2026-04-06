import uuid
from datetime import date, timedelta

from fastapi import HTTPException, status
from sqlalchemy import func as sqlfunc
from sqlalchemy.orm import Session

from app.models.goal import Goal
from app.models.user import User
from app.models.workout import Workout
from app.models.workout_set import WorkoutSet
from app.schemas.goal import GoalCreateRequest, GoalProgressResponse, GoalUpdateRequest


class GoalService:
    @staticmethod
    def create_goal(db: Session, user: User, payload: GoalCreateRequest) -> Goal:
        goal = Goal(
            user_id=user.id,
            goal_type=payload.goal_type,
            target_value=payload.target_value,
            period=payload.period,
        )
        db.add(goal)
        db.commit()
        db.refresh(goal)
        return goal

    @staticmethod
    def list_goals(db: Session, user: User, active_only: bool = False, skip: int = 0, limit: int = 50) -> list[Goal]:
        query = db.query(Goal).filter(Goal.user_id == user.id)
        if active_only:
            query = query.filter(Goal.is_active == True)
        return query.order_by(Goal.created_at.desc()).offset(skip).limit(limit).all()

    @staticmethod
    def get_all_goals_progress(db: Session, user: User) -> list[GoalProgressResponse]:
        return GoalService.get_goal_progress(db, user)

    @staticmethod
    def update_goal(db: Session, user: User, goal_id: uuid.UUID, payload: GoalUpdateRequest) -> Goal:
        goal = db.query(Goal).filter(Goal.id == goal_id, Goal.user_id == user.id).first()
        if not goal:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='Goal not found')

        if payload.target_value is not None:
            goal.target_value = payload.target_value
        if payload.is_active is not None:
            goal.is_active = payload.is_active

        db.commit()
        db.refresh(goal)
        return goal

    @staticmethod
    def delete_goal(db: Session, user: User, goal_id: uuid.UUID) -> None:
        goal = db.query(Goal).filter(Goal.id == goal_id, Goal.user_id == user.id).first()
        if not goal:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='Goal not found')
        db.delete(goal)
        db.commit()

    @staticmethod
    def get_goal_progress(db: Session, user: User) -> list[GoalProgressResponse]:
        goals = db.query(Goal).filter(Goal.user_id == user.id, Goal.is_active == True).all()
        today = date.today()
        results = []

        for goal in goals:
            period_start, period_end = GoalService._get_period_range(today, goal.period)
            current_value = GoalService._measure_goal(db, user.id, goal.goal_type, period_start, period_end)
            percentage = min((current_value / goal.target_value * 100) if goal.target_value > 0 else 0, 100)

            # Calculate streak
            streak = GoalService._calculate_streak(db, user.id, goal, today)

            results.append(GoalProgressResponse(
                goal_id=goal.id,
                goal_type=goal.goal_type,
                target_value=goal.target_value,
                period=goal.period,
                current_value=current_value,
                percentage=round(percentage, 1),
                streak=streak,
            ))

        return results

    @staticmethod
    def _get_period_range(today: date, period: str) -> tuple[date, date]:
        if period == 'weekly':
            start = today - timedelta(days=today.weekday())
            end = start + timedelta(days=6)
        elif period == 'monthly':
            start = today.replace(day=1)
            if today.month == 12:
                end = today.replace(year=today.year + 1, month=1, day=1) - timedelta(days=1)
            else:
                end = today.replace(month=today.month + 1, day=1) - timedelta(days=1)
        else:  # yearly
            start = today.replace(month=1, day=1)
            end = today.replace(month=12, day=31)
        return start, end

    @staticmethod
    def _measure_goal(db: Session, user_id: uuid.UUID, goal_type: str, start: date, end: date) -> int:
        if goal_type in ('workouts_per_week', 'workouts_per_month'):
            count = (
                db.query(sqlfunc.count(Workout.id))
                .filter(Workout.user_id == user_id, Workout.date >= start, Workout.date <= end)
                .scalar()
            )
            return count or 0
        elif goal_type == 'volume_per_week':
            total = (
                db.query(sqlfunc.sum(WorkoutSet.weight * WorkoutSet.reps * WorkoutSet.sets))
                .join(Workout, Workout.id == WorkoutSet.workout_id)
                .filter(Workout.user_id == user_id, Workout.date >= start, Workout.date <= end)
                .scalar()
            )
            return int(total or 0)
        return 0

    @staticmethod
    def _calculate_streak(db: Session, user_id: uuid.UUID, goal: Goal, today: date) -> int:
        streak = 0
        check_date = today

        for _ in range(52):  # Max 52 periods back
            start, end = GoalService._get_period_range(check_date, goal.period)
            val = GoalService._measure_goal(db, user_id, goal.goal_type, start, end)
            if val >= goal.target_value:
                streak += 1
            else:
                break

            if goal.period == 'weekly':
                check_date -= timedelta(days=7)
            elif goal.period == 'monthly':
                check_date = (start - timedelta(days=1))
            else:
                check_date = date(check_date.year - 1, check_date.month, check_date.day)

        return streak
