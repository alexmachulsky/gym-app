"""add equipment profiles

Revision ID: 20260405_0003
Revises: 20260405_0002
Create Date: 2026-04-05
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = '20260405_0003'
down_revision: Union[str, None] = '20260405_0002'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        'equipment_profiles',
        sa.Column('id', sa.Uuid(as_uuid=True), primary_key=True),
        sa.Column('user_id', sa.Uuid(as_uuid=True), sa.ForeignKey('users.id'), nullable=False),
        sa.Column('name', sa.String(100), nullable=False),
        sa.Column('equipment_list', sa.String(1000), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )
    op.create_index('ix_equipment_profiles_user_id', 'equipment_profiles', ['user_id'])


def downgrade() -> None:
    op.drop_index('ix_equipment_profiles_user_id', table_name='equipment_profiles')
    op.drop_table('equipment_profiles')
