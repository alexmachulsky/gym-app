"""add token_version to users

Revision ID: 20260409_0012
Revises: 20260409_0011
Create Date: 2026-04-09
"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = '20260409_0012'
down_revision: Union[str, None] = '20260409_0011'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('users', sa.Column('token_version', sa.Integer(), nullable=False, server_default='1'))


def downgrade() -> None:
    op.drop_column('users', 'token_version')
