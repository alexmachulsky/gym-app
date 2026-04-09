"""add expires_at to shared_workouts

Revision ID: 20260409_0013
Revises: 20260409_0012
Create Date: 2026-04-09
"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = '20260409_0013'
down_revision: Union[str, None] = '20260409_0012'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('shared_workouts', sa.Column('expires_at', sa.DateTime(timezone=True), nullable=True))


def downgrade() -> None:
    op.drop_column('shared_workouts', 'expires_at')
