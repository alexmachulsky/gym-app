import uuid

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.organization import Organization, OrganizationMember
from app.models.user import User
from app.utils.deps import get_current_user

router = APIRouter(prefix='/organizations', tags=['organizations'])


class CreateOrgRequest(BaseModel):
    name: str
    slug: str
    tier: str = 'trainer'


class InviteMemberRequest(BaseModel):
    email: str
    role: str = 'member'


@router.post('/', status_code=201)
def create_organization(
    payload: CreateOrgRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if payload.tier not in ('trainer', 'gym'):
        raise HTTPException(status_code=400, detail='Tier must be trainer or gym')

    existing = db.query(Organization).filter(Organization.slug == payload.slug.lower()).first()
    if existing:
        raise HTTPException(status_code=409, detail='Slug already taken')

    max_members = 10 if payload.tier == 'trainer' else 50
    org = Organization(
        name=payload.name,
        slug=payload.slug.lower(),
        tier=payload.tier,
        max_members=max_members,
        owner_id=current_user.id,
    )
    db.add(org)
    db.flush()

    owner_member = OrganizationMember(
        organization_id=org.id, user_id=current_user.id, role='owner'
    )
    db.add(owner_member)
    db.commit()
    db.refresh(org)

    return {
        'id': org.id,
        'name': org.name,
        'slug': org.slug,
        'tier': org.tier,
        'max_members': org.max_members,
    }


@router.get('/')
def list_my_organizations(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    memberships = (
        db.query(OrganizationMember)
        .filter(OrganizationMember.user_id == current_user.id)
        .all()
    )
    org_ids = [m.organization_id for m in memberships]
    orgs = db.query(Organization).filter(Organization.id.in_(org_ids)).all() if org_ids else []
    role_map = {m.organization_id: m.role for m in memberships}
    return [
        {
            'id': o.id,
            'name': o.name,
            'slug': o.slug,
            'tier': o.tier,
            'role': role_map.get(o.id),
            'member_count': db.query(func.count(OrganizationMember.id)).filter(
                OrganizationMember.organization_id == o.id
            ).scalar(),
        }
        for o in orgs
    ]


@router.get('/{org_id}')
def get_organization(
    org_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    membership = (
        db.query(OrganizationMember)
        .filter(OrganizationMember.organization_id == org_id, OrganizationMember.user_id == current_user.id)
        .first()
    )
    if not membership:
        raise HTTPException(status_code=403, detail='Not a member of this organization')

    org = db.query(Organization).filter(Organization.id == org_id).first()
    members = (
        db.query(OrganizationMember, User)
        .join(User, User.id == OrganizationMember.user_id)
        .filter(OrganizationMember.organization_id == org_id)
        .all()
    )

    return {
        'id': org.id,
        'name': org.name,
        'slug': org.slug,
        'tier': org.tier,
        'max_members': org.max_members,
        'members': [
            {'id': u.id, 'email': u.email, 'name': u.name, 'role': m.role, 'joined_at': m.joined_at}
            for m, u in members
        ],
    }


@router.post('/{org_id}/invite')
def invite_member(
    org_id: uuid.UUID,
    payload: InviteMemberRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    membership = (
        db.query(OrganizationMember)
        .filter(
            OrganizationMember.organization_id == org_id,
            OrganizationMember.user_id == current_user.id,
            OrganizationMember.role.in_(['owner', 'trainer']),
        )
        .first()
    )
    if not membership:
        raise HTTPException(status_code=403, detail='Only owners and trainers can invite members')

    org = db.query(Organization).filter(Organization.id == org_id).first()
    member_count = (
        db.query(func.count(OrganizationMember.id))
        .filter(OrganizationMember.organization_id == org_id)
        .scalar()
    )
    if member_count >= org.max_members:
        raise HTTPException(status_code=403, detail=f'Organization has reached its {org.max_members} member limit')

    target_user = db.query(User).filter(User.email == payload.email).first()
    if not target_user:
        # Don't reveal whether the email exists (prevent email enumeration)
        return {'detail': 'If that user exists, an invitation will be sent'}

    existing = (
        db.query(OrganizationMember)
        .filter(OrganizationMember.organization_id == org_id, OrganizationMember.user_id == target_user.id)
        .first()
    )
    if existing:
        # User exists but is already a member - still return generic response to avoid enumeration
        return {'detail': 'If that user exists, an invitation will be sent'}

    new_member = OrganizationMember(
        organization_id=org_id, user_id=target_user.id, role=payload.role
    )
    db.add(new_member)
    db.commit()
    return {'detail': 'If that user exists, an invitation will be sent'}


@router.delete('/{org_id}/members/{user_id}')
def remove_member(
    org_id: uuid.UUID,
    user_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    caller = (
        db.query(OrganizationMember)
        .filter(
            OrganizationMember.organization_id == org_id,
            OrganizationMember.user_id == current_user.id,
            OrganizationMember.role == 'owner',
        )
        .first()
    )
    if not caller:
        raise HTTPException(status_code=403, detail='Only owners can remove members')

    target = (
        db.query(OrganizationMember)
        .filter(OrganizationMember.organization_id == org_id, OrganizationMember.user_id == user_id)
        .first()
    )
    if not target:
        raise HTTPException(status_code=404, detail='Member not found')
    if target.role == 'owner':
        raise HTTPException(status_code=400, detail='Cannot remove the owner')

    db.delete(target)
    db.commit()
    return {'detail': 'Member removed'}
