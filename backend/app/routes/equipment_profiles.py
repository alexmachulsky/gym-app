from __future__ import annotations

import uuid

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.user import User
from app.schemas.equipment_profile import EquipmentProfileCreate, EquipmentProfileResponse
from app.services.equipment_profile_service import EquipmentProfileService
from app.utils.deps import require_pro

router = APIRouter(prefix='/equipment-profiles', tags=['equipment-profiles'])


@router.get('/', response_model=list[EquipmentProfileResponse])
def list_profiles(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_pro),
):
    return EquipmentProfileService.list_profiles(db, current_user.id)


@router.post('/', response_model=EquipmentProfileResponse, status_code=201)
def create_profile(
    data: EquipmentProfileCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_pro),
):
    return EquipmentProfileService.create_profile(db, current_user.id, data)


@router.delete('/{profile_id}', status_code=204)
def delete_profile(
    profile_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_pro),
):
    EquipmentProfileService.delete_profile(db, current_user.id, profile_id)
