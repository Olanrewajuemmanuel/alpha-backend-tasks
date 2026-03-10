from uuid import UUID
from datetime import datetime
from typing import Optional

from sqlmodel import Field, Relationship, SQLModel, Column
import sqlalchemy as sa

from app.models.helpers import now_utc, new_uuid


class Briefing(SQLModel, table=True):
    __tablename__ = "briefings"

    id: UUID = Field(
        default_factory=new_uuid,
        primary_key=True,
    )

    company_name: str = Field(
        sa_column=Column(sa.String(255), nullable=False),
    )
    ticker: str = Field(
        sa_column=Column(sa.String(20), nullable=False, index=True),
    )
    sector: Optional[str] = Field(
        default=None,
        sa_column=Column(sa.String(100), nullable=True),
    )
    analyst_name: Optional[str] = Field(
        default=None,
        sa_column=Column(sa.String(255), nullable=True),
    )
    summary: str = Field(
        sa_column=Column(sa.Text, nullable=False),
    )
    recommendation: str = Field(
        sa_column=Column(sa.Text, nullable=False),
    )

    rendered_html: Optional[str] = Field(
        default=None,
        sa_column=Column(sa.Text, nullable=True),
    )
    generated_at: Optional[datetime] = Field(
        default=None,
        sa_column=Column(sa.TIMESTAMP(timezone=True), nullable=True),
    )

    created_at: datetime = Field(
        default_factory=now_utc,
    )
    updated_at: datetime = Field(
        default_factory=now_utc,
    )

    points: list["BriefingPoint"] = Relationship(
        back_populates="briefing",
        sa_relationship_kwargs={"cascade": "all, delete-orphan"},
    )
    metrics: list["BriefingMetric"] = Relationship(
        back_populates="briefing",
        sa_relationship_kwargs={"cascade": "all, delete-orphan"},
    )

    # --- Computed properties ---

    @property
    def is_generated(self) -> bool:
        """True when rendered_html has been produced by the generation step."""
        return self.generated_at is not None

    @property
    def key_points(self) -> list["BriefingPoint"]:
        """Convenience filter — returns KEY_POINT rows sorted by display_order."""
        return sorted(
            [p for p in self.points if p.point_type == "KEY_POINT"],
            key=lambda p: p.display_order,
        )

    @property
    def risks(self) -> list["BriefingPoint"]:
        """Convenience filter — returns RISK rows sorted by display_order."""
        return sorted(
            [p for p in self.points if p.point_type == "RISK"],
            key=lambda p: p.display_order,
        )

    @property
    def sorted_metrics(self) -> list["BriefingMetric"]:
        """Returns metrics sorted by display_order."""
        return sorted(self.metrics, key=lambda m: m.display_order)
