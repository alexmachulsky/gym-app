"""initial schema

Revision ID: 20260216_0001
Revises:
Create Date: 2026-02-16
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '20260216_0001'
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        'users',
        sa.Column('id', sa.Uuid(), nullable=False),
        sa.Column('email', sa.String(length=255), nullable=False),
        sa.Column('password_hash', sa.String(length=255), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('email'),
    )
    op.create_index('ix_users_email', 'users', ['email'], unique=False)

    op.create_table(
        'exercises',
        sa.Column('id', sa.Uuid(), nullable=False),
        sa.Column('user_id', sa.Uuid(), nullable=False),
        sa.Column('name', sa.String(length=120), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('user_id', 'name', name='uq_exercises_user_name'),
    )
    op.create_index('idx_exercises_user_id', 'exercises', ['user_id'], unique=False)

    op.create_table(
        'workouts',
        sa.Column('id', sa.Uuid(), nullable=False),
        sa.Column('user_id', sa.Uuid(), nullable=False),
        sa.Column('date', sa.Date(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index('idx_workouts_user_id_date', 'workouts', ['user_id', 'date'], unique=False)

    op.create_table(
        'workout_sets',
        sa.Column('id', sa.Uuid(), nullable=False),
        sa.Column('workout_id', sa.Uuid(), nullable=False),
        sa.Column('exercise_id', sa.Uuid(), nullable=False),
        sa.Column('weight', sa.Float(), nullable=False),
        sa.Column('reps', sa.Integer(), nullable=False),
        sa.Column('sets', sa.Integer(), nullable=False),
        sa.ForeignKeyConstraint(['exercise_id'], ['exercises.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['workout_id'], ['workouts.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index('idx_workout_sets_workout_id', 'workout_sets', ['workout_id'], unique=False)
    op.create_index('idx_workout_sets_exercise_id', 'workout_sets', ['exercise_id'], unique=False)

    op.create_table(
        'body_metrics',
        sa.Column('id', sa.Uuid(), nullable=False),
        sa.Column('user_id', sa.Uuid(), nullable=False),
        sa.Column('weight', sa.Float(), nullable=False),
        sa.Column('date', sa.Date(), nullable=False),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index('idx_body_metrics_user_id_date', 'body_metrics', ['user_id', 'date'], unique=False)


def downgrade() -> None:
    op.drop_index('idx_body_metrics_user_id_date', table_name='body_metrics')
    op.drop_table('body_metrics')

    op.drop_index('idx_workout_sets_exercise_id', table_name='workout_sets')
    op.drop_index('idx_workout_sets_workout_id', table_name='workout_sets')
    op.drop_table('workout_sets')

    op.drop_index('idx_workouts_user_id_date', table_name='workouts')
    op.drop_table('workouts')

    op.drop_index('idx_exercises_user_id', table_name='exercises')
    op.drop_table('exercises')

    op.drop_index('ix_users_email', table_name='users')
    op.drop_table('users')
