"""initial schema

Revision ID: 001_initial_schema
Revises: 
Create Date: 2026-10-29 20:30:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = '001_initial_schema'
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Create sensor_readings table
    op.create_table(
        'sensor_readings',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('device_id', sa.String(length=64), nullable=False),
        sa.Column('temperature_c', sa.Float(), nullable=False),
        sa.Column('humidity_pct', sa.Float(), nullable=False),
        sa.Column('timestamp', sa.DateTime(timezone=True), nullable=False),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_sensor_readings_id'), 'sensor_readings', ['id'], unique=False)
    op.create_index(op.f('ix_sensor_readings_device_id'), 'sensor_readings', ['device_id'], unique=False)
    op.create_index(op.f('ix_sensor_readings_timestamp'), 'sensor_readings', ['timestamp'], unique=False)
    op.create_index('idx_device_timestamp', 'sensor_readings', ['device_id', 'timestamp'], unique=False)

    # Create devices table
    op.create_table(
        'devices',
        sa.Column('device_id', sa.String(length=64), nullable=False),
        sa.Column('name', sa.String(length=100), nullable=True),
        sa.Column('description', sa.String(length=255), nullable=True),
        sa.Column('last_seen', sa.DateTime(timezone=True), nullable=True),
        sa.Column('last_temperature_c', sa.Float(), nullable=True),
        sa.Column('last_humidity_pct', sa.Float(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.PrimaryKeyConstraint('device_id')
    )
    op.create_index(op.f('ix_devices_device_id'), 'devices', ['device_id'], unique=False)


def downgrade() -> None:
    op.drop_index(op.f('ix_devices_device_id'), table_name='devices')
    op.drop_table('devices')
    op.drop_index('idx_device_timestamp', table_name='sensor_readings')
    op.drop_index(op.f('ix_sensor_readings_timestamp'), table_name='sensor_readings')
    op.drop_index(op.f('ix_sensor_readings_device_id'), table_name='sensor_readings')
    op.drop_index(op.f('ix_sensor_readings_id'), table_name='sensor_readings')
    op.drop_table('sensor_readings')

