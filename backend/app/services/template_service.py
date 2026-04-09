import uuid

from fastapi import HTTPException, status
from sqlalchemy.orm import Session, joinedload

from app.models.exercise import Exercise
from app.models.user import User
from app.models.workout import Workout
from app.models.workout_set import WorkoutSet
from app.models.workout_template import WorkoutTemplate, WorkoutTemplateSet
from app.schemas.workout_template import TemplateCreateRequest, TemplateUpdateRequest


class TemplateService:
    @staticmethod
    def create_template(db: Session, user: User, payload: TemplateCreateRequest) -> WorkoutTemplate:
        template = WorkoutTemplate(
            user_id=user.id,
            name=payload.name,
            description=payload.description,
            is_draft=payload.is_draft,
        )
        db.add(template)
        db.flush()

        for ts in payload.template_sets:
            exercise = db.query(Exercise).filter(
                Exercise.id == ts.exercise_id, Exercise.user_id == user.id
            ).first()
            if not exercise:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail='One or more exercises not found',
                )
            db.add(WorkoutTemplateSet(
                template_id=template.id,
                exercise_id=ts.exercise_id,
                weight=ts.weight,
                reps=ts.reps,
                sets=ts.sets,
                order=ts.order,
                segment=ts.segment,
            ))

        db.commit()
        return TemplateService._load_template(db, template.id)

    @staticmethod
    def update_template(db: Session, user: User, template_id: uuid.UUID, payload: TemplateUpdateRequest) -> WorkoutTemplate:
        template = (
            db.query(WorkoutTemplate)
            .filter(WorkoutTemplate.id == template_id, WorkoutTemplate.user_id == user.id)
            .first()
        )
        if not template:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='Template not found')

        if payload.name is not None:
            template.name = payload.name
        if payload.description is not None:
            template.description = payload.description
        if payload.is_draft is not None:
            template.is_draft = payload.is_draft

        if payload.template_sets is not None:
            db.query(WorkoutTemplateSet).filter(
                WorkoutTemplateSet.template_id == template.id
            ).delete()
            for ts in payload.template_sets:
                db.add(WorkoutTemplateSet(
                    template_id=template.id,
                    exercise_id=ts.exercise_id,
                    weight=ts.weight,
                    reps=ts.reps,
                    sets=ts.sets,
                    order=ts.order,
                    segment=ts.segment,
                ))

        db.commit()
        return TemplateService._load_template(db, template.id)

    @staticmethod
    def list_templates(db: Session, user: User, skip: int = 0, limit: int = 50) -> list[WorkoutTemplate]:
        return (
            db.query(WorkoutTemplate)
            .options(joinedload(WorkoutTemplate.template_sets))
            .filter(WorkoutTemplate.user_id == user.id)
            .order_by(WorkoutTemplate.updated_at.desc())
            .offset(skip)
            .limit(limit)
            .all()
        )

    @staticmethod
    def get_template(db: Session, user: User, template_id: uuid.UUID) -> WorkoutTemplate:
        template = TemplateService._load_template(db, template_id)
        if not template or template.user_id != user.id:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='Template not found')
        return template

    @staticmethod
    def delete_template(db: Session, user: User, template_id: uuid.UUID) -> None:
        template = (
            db.query(WorkoutTemplate)
            .filter(WorkoutTemplate.id == template_id, WorkoutTemplate.user_id == user.id)
            .first()
        )
        if not template:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='Template not found')
        db.delete(template)
        db.commit()

    @staticmethod
    def create_from_workout(db: Session, user: User, workout_id: uuid.UUID) -> WorkoutTemplate:
        workout = (
            db.query(Workout)
            .options(joinedload(Workout.workout_sets))
            .filter(Workout.id == workout_id, Workout.user_id == user.id)
            .first()
        )
        if not workout:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='Workout not found')

        template = WorkoutTemplate(
            user_id=user.id,
            name=f'Workout from {workout.date}',
            description='Created from logged workout',
            is_draft=False,
        )
        db.add(template)
        db.flush()

        for idx, ws in enumerate(workout.workout_sets):
            db.add(WorkoutTemplateSet(
                template_id=template.id,
                exercise_id=ws.exercise_id,
                weight=ws.weight,
                reps=ws.reps,
                sets=ws.sets,
                order=idx,
                segment='main',
            ))

        db.commit()
        return TemplateService._load_template(db, template.id)

    @staticmethod
    def _load_template(db: Session, template_id: uuid.UUID) -> WorkoutTemplate | None:
        return (
            db.query(WorkoutTemplate)
            .options(joinedload(WorkoutTemplate.template_sets))
            .filter(WorkoutTemplate.id == template_id)
            .first()
        )
