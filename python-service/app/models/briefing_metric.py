from uuid import UUID
from datetime import datetime
from typing import Optional

from sqlmodel import Field, Relationship, SQLModel, Column
import sqlalchemy as sa

from app.models.helpers import now_utc, new_uuid
from app.models.briefing import Briefing


class BriefingMetric(SQLModel, table=True):
    __tablename__ = "briefing_metrics"

    __table_args__ = (
        sa.UniqueConstraint(
            "briefing_id",
            "name",
            name="uq_briefing_metrics_name_per_briefing",
        ),  # Unique metric name per briefing
    )

    id: UUID = Field(
        default_factory=new_uuid,
        primary_key=True,
    )

    briefing_id: UUID = Field(
        sa_column=Column(
            sa.UUID(as_uuid=True),
            sa.ForeignKey("briefings.id", ondelete="CASCADE"),
            nullable=False,
            index=True,
        ),
    )

    name: str = Field(
        sa_column=Column(sa.String(100), nullable=False),
    )

    value: str = Field(
        sa_column=Column(sa.String(100), nullable=False),
        # Stored as-received: "18%", "28.1x", "$2.4B"
    )
    display_order: int = Field(
        sa_column=Column(sa.Integer, nullable=False),
    )

    created_at: datetime = Field(
        default_factory=now_utc,
        sa_column=Column(
            sa.TIMESTAMP(timezone=True), nullable=False, server_default=sa.text("now()")
        ),
    )

    briefing: Optional[Briefing] = Relationship(back_populates="metrics")
