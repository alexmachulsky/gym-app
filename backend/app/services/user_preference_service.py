from sqlalchemy.orm import Session

from app.models.user import User
from app.models.user_preference import UserPreference
from app.schemas.user_preference import UserPreferenceUpdateRequest


class UserPreferenceService:
    @staticmethod
    def get_or_create(db: Session, user: User) -> UserPreference:
        pref = db.query(UserPreference).filter(UserPreference.user_id == user.id).first()
        if not pref:
            pref = UserPreference(user_id=user.id)
            db.add(pref)
            db.commit()
            db.refresh(pref)
        return pref

    @staticmethod
    def update_preferences(db: Session, user: User, payload: UserPreferenceUpdateRequest) -> UserPreference:
        pref = UserPreferenceService.get_or_create(db, user)

        if payload.weight_unit is not None:
            pref.weight_unit = payload.weight_unit
        if payload.distance_unit is not None:
            pref.distance_unit = payload.distance_unit
        if payload.rest_timer_default is not None:
            pref.rest_timer_default = payload.rest_timer_default

        db.commit()
        db.refresh(pref)
        return pref
