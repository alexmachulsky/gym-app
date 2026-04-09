"""add achievements table

Revision ID: 20260409_0007
Revises: 20260409_0006
Create Date: 2026-04-09
"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = '20260409_0007'
down_revision: Union[str, None] = '20260409_0006'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        'achievements',
        sa.Column('id', sa.Uuid(as_uuid=True), primary_key=True),
        sa.Column('user_id', sa.Uuid(as_uuid=True), sa.ForeignKey('users.id', ondelete='CASCADE'), nullable=False),
        sa.Column('achievement_type', sa.String(50), nullable=False),
        sa.Column('unlocked_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
    )
    op.create_index('ix_achievements_user_id', 'achievements', ['user_id'], unique=False)
    op.create_index('ix_achievements_user_type', 'achievements', ['user_id', 'achievement_type'], unique=True)


def downgrade() -> None:
    op.drop_index('ix_achievements_user_type', table_name='achievements')
    op.drop_index('ix_achievements_user_id', table_name='achievements')
    op.drop_table('achievements')
