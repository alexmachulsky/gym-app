"""add social features: username, follows, shared workouts

Revision ID: 20260409_0008
Revises: 20260409_0007
Create Date: 2026-04-09
"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = '20260409_0008'
down_revision: Union[str, None] = '20260409_0007'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('users', sa.Column('username', sa.String(50), nullable=True))
    op.add_column('users', sa.Column('public_profile', sa.Boolean(), nullable=False, server_default='false'))
    op.create_unique_constraint('uq_users_username', 'users', ['username'])
    op.create_index('ix_users_username', 'users', ['username'])

    op.create_table(
        'follows',
        sa.Column('id', sa.Uuid(as_uuid=True), primary_key=True),
        sa.Column('follower_id', sa.Uuid(as_uuid=True), sa.ForeignKey('users.id', ondelete='CASCADE'), nullable=False, index=True),
        sa.Column('following_id', sa.Uuid(as_uuid=True), sa.ForeignKey('users.id', ondelete='CASCADE'), nullable=False, index=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.UniqueConstraint('follower_id', 'following_id', name='uq_follow_pair'),
    )

    op.create_table(
        'shared_workouts',
        sa.Column('id', sa.Uuid(as_uuid=True), primary_key=True),
        sa.Column('workout_id', sa.Uuid(as_uuid=True), sa.ForeignKey('workouts.id', ondelete='CASCADE'), nullable=False),
        sa.Column('user_id', sa.Uuid(as_uuid=True), sa.ForeignKey('users.id', ondelete='CASCADE'), nullable=False),
        sa.Column('share_token', sa.String(64), unique=True, nullable=False, index=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )


def downgrade() -> None:
    op.drop_table('shared_workouts')
    op.drop_table('follows')
    op.drop_index('ix_users_username', table_name='users')
    op.drop_constraint('uq_users_username', 'users', type_='unique')
    op.drop_column('users', 'public_profile')
    op.drop_column('users', 'username')
