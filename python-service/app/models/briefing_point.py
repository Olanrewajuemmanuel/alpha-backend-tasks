from uuid import UUID
from datetime import datetime
from typing import Optional

from sqlmodel import Field, Relationship, SQLModel, Column
import sqlalchemy as sa
from app.models.helpers import new_uuid, now_utc
from app.models.briefing import Briefing


class BriefingPoint(SQLModel, table=True):

    __tablename__ = "briefing_points"

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

    point_type: str = Field(
        sa_column=Column(sa.String(10), nullable=False),
    )
    content: str = Field(
        sa_column=Column(sa.Text, nullable=False),
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

    briefing: Optional[Briefing] = Relationship(back_populates="points")
