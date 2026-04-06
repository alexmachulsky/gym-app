from __future__ import annotations

import uuid
from typing import Optional

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.user import User
from app.schemas.admin import AdminStats, AdminUserDetail, AdminUserSummary, AdminUserUpdate
from app.services.admin_service import AdminService
from app.utils.deps import require_admin

router = APIRouter(prefix='/admin', tags=['admin'])


@router.get('/stats', response_model=AdminStats)
def get_stats(
    db: Session = Depends(get_db),
    _admin: User = Depends(require_admin),
):
    return AdminService.get_stats(db)


@router.get('/users', response_model=list[AdminUserSummary])
def list_users(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    search: Optional[str] = Query(None),
    tier: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    _admin: User = Depends(require_admin),
):
    return AdminService.list_users(db, skip=skip, limit=limit, search=search, tier=tier)


@router.get('/users/{user_id}', response_model=AdminUserDetail)
def get_user(
    user_id: uuid.UUID,
    db: Session = Depends(get_db),
    _admin: User = Depends(require_admin),
):
    return AdminService.get_user_detail(db, user_id)


@router.put('/users/{user_id}', response_model=AdminUserSummary)
def update_user(
    user_id: uuid.UUID,
    body: AdminUserUpdate,
    db: Session = Depends(get_db),
    _admin: User = Depends(require_admin),
):
    return AdminService.update_user(db, user_id, body.model_dump(exclude_unset=True))


@router.post('/users/{user_id}/impersonate')
def impersonate_user(
    user_id: uuid.UUID,
    db: Session = Depends(get_db),
    _admin: User = Depends(require_admin),
):
    return AdminService.impersonate_user(db, user_id)
