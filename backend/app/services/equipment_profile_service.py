from __future__ import annotations

import uuid

from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.models.equipment_profile import EquipmentProfile
from app.schemas.equipment_profile import EquipmentProfileCreate


class EquipmentProfileService:

    @staticmethod
    def list_profiles(db: Session, user_id: uuid.UUID) -> list[EquipmentProfile]:
        return db.query(EquipmentProfile).filter(
            EquipmentProfile.user_id == user_id,
        ).order_by(EquipmentProfile.created_at.desc()).all()

    @staticmethod
    def create_profile(db: Session, user_id: uuid.UUID, data: EquipmentProfileCreate) -> EquipmentProfile:
        profile = EquipmentProfile(
            user_id=user_id,
            name=data.name,
            equipment_list=data.equipment_list,
        )
        db.add(profile)
        db.commit()
        db.refresh(profile)
        return profile

    @staticmethod
    def delete_profile(db: Session, user_id: uuid.UUID, profile_id: uuid.UUID) -> None:
        profile = db.query(EquipmentProfile).filter(
            EquipmentProfile.id == profile_id,
            EquipmentProfile.user_id == user_id,
        ).first()
        if not profile:
            raise HTTPException(status_code=404, detail='Equipment profile not found')
        db.delete(profile)
        db.commit()
