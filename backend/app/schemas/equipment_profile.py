from __future__ import annotations

import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict, field_validator


class EquipmentProfileCreate(BaseModel):
    name: str
    equipment_list: str

    @field_validator('name')
    @classmethod
    def name_not_empty(cls, v: str) -> str:
        if not v.strip():
            raise ValueError('Name cannot be empty')
        return v.strip()

    @field_validator('equipment_list')
    @classmethod
    def list_not_empty(cls, v: str) -> str:
        if not v.strip():
            raise ValueError('Equipment list cannot be empty')
        return v.strip()


class EquipmentProfileResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    name: str
    equipment_list: str
    created_at: datetime
