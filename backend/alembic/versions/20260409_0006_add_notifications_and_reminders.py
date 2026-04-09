"""add push subscriptions and reminder preferences

Revision ID: 20260409_0006
Revises: 20260409_0005
Create Date: 2026-04-09
"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = '20260409_0006'
down_revision: Union[str, None] = '20260409_0005'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('user_preferences', sa.Column('push_enabled', sa.Boolean(), nullable=False, server_default='false'))
    op.add_column('user_preferences', sa.Column('reminder_days', sa.String(50), nullable=True))
    op.add_column('user_preferences', sa.Column('reminder_time', sa.String(10), nullable=True))
    op.add_column('user_preferences', sa.Column('weekly_summary_enabled', sa.Boolean(), nullable=False, server_default='true'))

    op.create_table(
        'push_subscriptions',
        sa.Column('id', sa.Uuid(as_uuid=True), primary_key=True),
        sa.Column('user_id', sa.Uuid(as_uuid=True), sa.ForeignKey('users.id', ondelete='CASCADE'), nullable=False, index=True),
        sa.Column('endpoint', sa.Text(), nullable=False),
        sa.Column('p256dh_key', sa.String(255), nullable=False),
        sa.Column('auth_key', sa.String(255), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )


def downgrade() -> None:
    op.drop_table('push_subscriptions')
    op.drop_column('user_preferences', 'weekly_summary_enabled')
    op.drop_column('user_preferences', 'reminder_time')
    op.drop_column('user_preferences', 'reminder_days')
    op.drop_column('user_preferences', 'push_enabled')
