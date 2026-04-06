"""enrich models and add templates goals preferences

Revision ID: 20260405_0002
Revises: 20260216_0001
Create Date: 2026-04-05
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = '20260405_0002'
down_revision: Union[str, None] = '20260216_0001'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Enrich exercises
    op.add_column('exercises', sa.Column('category', sa.String(50), nullable=True))
    op.add_column('exercises', sa.Column('muscle_group', sa.String(100), nullable=True))
    op.add_column('exercises', sa.Column('equipment', sa.String(50), nullable=True))
    op.add_column('exercises', sa.Column('description', sa.Text(), nullable=True))
    op.add_column('exercises', sa.Column('instructions', sa.Text(), nullable=True))
    op.add_column('exercises', sa.Column('image_url', sa.String(500), nullable=True))

    # Enrich workouts
    op.add_column('workouts', sa.Column('notes', sa.Text(), nullable=True))
    op.add_column('workouts', sa.Column('effort_rating', sa.Integer(), nullable=True))
    op.add_column('workouts', sa.Column('duration_seconds', sa.Integer(), nullable=True))
    op.add_column('workouts', sa.Column('started_at', sa.DateTime(timezone=True), nullable=True))
    op.add_column('workouts', sa.Column('finished_at', sa.DateTime(timezone=True), nullable=True))
    op.add_column('workouts', sa.Column('estimated_calories', sa.Integer(), nullable=True))

    # Enrich body_metrics
    op.add_column('body_metrics', sa.Column('body_fat_percentage', sa.Float(), nullable=True))
    op.add_column('body_metrics', sa.Column('muscle_mass', sa.Float(), nullable=True))
    op.add_column('body_metrics', sa.Column('notes', sa.Text(), nullable=True))

    # Create workout_templates table
    op.create_table(
        'workout_templates',
        sa.Column('id', sa.Uuid(), nullable=False),
        sa.Column('user_id', sa.Uuid(), nullable=False),
        sa.Column('name', sa.String(120), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('is_draft', sa.Boolean(), nullable=False, server_default=sa.text('false')),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index('idx_workout_templates_user_id', 'workout_templates', ['user_id'])

    # Add template_id FK to workouts (after template table exists)
    op.add_column('workouts', sa.Column('template_id', sa.Uuid(), nullable=True))
    op.create_foreign_key('fk_workouts_template_id', 'workouts', 'workout_templates', ['template_id'], ['id'], ondelete='SET NULL')

    # Create workout_template_sets table
    op.create_table(
        'workout_template_sets',
        sa.Column('id', sa.Uuid(), nullable=False),
        sa.Column('template_id', sa.Uuid(), nullable=False),
        sa.Column('exercise_id', sa.Uuid(), nullable=False),
        sa.Column('weight', sa.Float(), nullable=True),
        sa.Column('reps', sa.Integer(), nullable=True),
        sa.Column('sets', sa.Integer(), nullable=True),
        sa.Column('order', sa.Integer(), nullable=False, server_default=sa.text('0')),
        sa.Column('segment', sa.String(20), nullable=False, server_default=sa.text("'main'")),
        sa.ForeignKeyConstraint(['template_id'], ['workout_templates.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['exercise_id'], ['exercises.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index('idx_wt_sets_template_id', 'workout_template_sets', ['template_id'])

    # Create user_preferences table
    op.create_table(
        'user_preferences',
        sa.Column('id', sa.Uuid(), nullable=False),
        sa.Column('user_id', sa.Uuid(), nullable=False),
        sa.Column('weight_unit', sa.String(10), nullable=False, server_default=sa.text("'kg'")),
        sa.Column('distance_unit', sa.String(10), nullable=False, server_default=sa.text("'km'")),
        sa.Column('rest_timer_default', sa.Integer(), nullable=False, server_default=sa.text('90')),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('user_id', name='uq_user_preferences_user_id'),
    )
    op.create_index('idx_user_preferences_user_id', 'user_preferences', ['user_id'])

    # Create goals table
    op.create_table(
        'goals',
        sa.Column('id', sa.Uuid(), nullable=False),
        sa.Column('user_id', sa.Uuid(), nullable=False),
        sa.Column('goal_type', sa.String(50), nullable=False),
        sa.Column('target_value', sa.Integer(), nullable=False),
        sa.Column('period', sa.String(20), nullable=False),
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default=sa.text('true')),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index('idx_goals_user_id', 'goals', ['user_id'])


def downgrade() -> None:
    op.drop_index('idx_goals_user_id', table_name='goals')
    op.drop_table('goals')

    op.drop_index('idx_user_preferences_user_id', table_name='user_preferences')
    op.drop_table('user_preferences')

    op.drop_index('idx_wt_sets_template_id', table_name='workout_template_sets')
    op.drop_table('workout_template_sets')

    op.drop_foreign_key('fk_workouts_template_id', 'workouts')
    op.drop_column('workouts', 'template_id')

    op.drop_index('idx_workout_templates_user_id', table_name='workout_templates')
    op.drop_table('workout_templates')

    op.drop_column('body_metrics', 'notes')
    op.drop_column('body_metrics', 'muscle_mass')
    op.drop_column('body_metrics', 'body_fat_percentage')

    op.drop_column('workouts', 'estimated_calories')
    op.drop_column('workouts', 'finished_at')
    op.drop_column('workouts', 'started_at')
    op.drop_column('workouts', 'duration_seconds')
    op.drop_column('workouts', 'effort_rating')
    op.drop_column('workouts', 'notes')

    op.drop_column('exercises', 'image_url')
    op.drop_column('exercises', 'instructions')
    op.drop_column('exercises', 'description')
    op.drop_column('exercises', 'equipment')
    op.drop_column('exercises', 'muscle_group')
    op.drop_column('exercises', 'category')
