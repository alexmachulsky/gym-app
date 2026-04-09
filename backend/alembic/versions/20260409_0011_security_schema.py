"""add security schema with audit logs and webhook events

Revision ID: 20260409_0011
Revises: 20260409_0010
Create Date: 2026-04-09
"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = '20260409_0011'
down_revision: Union[str, None] = '20260409_0010'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Add lockout columns to users table
    op.add_column('users', sa.Column('failed_login_attempts', sa.Integer(), nullable=False, server_default='0'))
    op.add_column('users', sa.Column('locked_until', sa.DateTime(timezone=True), nullable=True))

    # Create audit_logs table
    op.create_table(
        'audit_logs',
        sa.Column('id', sa.Uuid(as_uuid=True), primary_key=True),
        sa.Column('admin_id', sa.Uuid(as_uuid=True), sa.ForeignKey('users.id', ondelete='SET NULL'), nullable=True, index=True),
        sa.Column('target_user_id', sa.Uuid(as_uuid=True), sa.ForeignKey('users.id', ondelete='SET NULL'), nullable=True, index=True),
        sa.Column('action', sa.String(100), nullable=False),
        sa.Column('metadata', sa.Text(), nullable=True),
        sa.Column('ip_address', sa.String(45), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )

    # Create webhook_events table
    op.create_table(
        'webhook_events',
        sa.Column('id', sa.Uuid(as_uuid=True), primary_key=True),
        sa.Column('stripe_event_id', sa.String(255), nullable=False, unique=True, index=True),
        sa.Column('event_type', sa.String(100), nullable=False),
        sa.Column('processed_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )


def downgrade() -> None:
    op.drop_table('webhook_events')
    op.drop_table('audit_logs')
    op.drop_column('users', 'locked_until')
    op.drop_column('users', 'failed_login_attempts')
