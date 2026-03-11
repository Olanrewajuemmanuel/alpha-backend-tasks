import uuid
from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field, field_validator, model_validator


class MetricIn(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    value: str = Field(..., min_length=1, max_length=100)


class PointRead(BaseModel):
    id: uuid.UUID
    point_type: str
    content: str
    display_order: int

    model_config = {"from_attributes": True}


class MetricRead(BaseModel):
    id: uuid.UUID
    name: str
    value: str
    display_order: int

    model_config = {"from_attributes": True}


class BriefingCreate(BaseModel):

    model_config = {
        "populate_by_name": True
    }  # allows both camelCase and snake_case (pydantic v2)

    companyName: str = Field(
        ...,
        min_length=1,
        max_length=255,
    )
    ticker: str = Field(
        ...,
        min_length=1,
        max_length=20,
    )
    sector: Optional[str] = Field(
        default=None,
        max_length=100,
    )
    analystName: Optional[str] = Field(
        default=None,
        max_length=255,
    )
    summary: str = Field(
        ...,
        min_length=1,
    )
    recommendation: str = Field(
        ...,
        min_length=1,
    )
    keyPoints: list[str] = Field(
        ...,
        min_length=2,
    )
    risks: list[str] = Field(
        ...,
        min_length=1,
    )
    metrics: list[MetricIn] = Field(
        default_factory=list,
        max_length=100,
    )

    # =======
    # Field validators
    # =======
    @field_validator("ticker", mode="before")
    @classmethod
    def normalise_ticker(cls, v: str) -> str:
        if not isinstance(v, str):
            raise ValueError("ticker must be a string.")
        return v.strip().upper()

    @field_validator("companyName", "summary", "recommendation", mode="before")
    @classmethod
    def strip_required_strings(cls, v: str) -> str:
        if isinstance(v, str):
            return v.strip()
        return v

    @field_validator("keyPoints", mode="after")
    @classmethod
    def validate_key_points(cls, v: list[str]) -> list[str]:
        stripped = [kp.strip() for kp in v]
        blanks = [i for i, kp in enumerate(stripped) if not kp]
        if blanks:
            raise ValueError(
                f"keyPoints[{blanks[0]}] is empty. All key points must have content."
            )
        return stripped

    @field_validator("risks", mode="after")
    @classmethod
    def validate_risks(cls, v: list[str]) -> list[str]:
        stripped = [r.strip() for r in v]
        blanks = [i for i, r in enumerate(stripped) if not r]
        if blanks:
            raise ValueError(
                f"risks[{blanks[0]}] is empty. All risks must have content."
            )
        return stripped

    @model_validator(mode="after")
    def validate_metric_names_unique(self) -> "BriefingCreate":
        """Spec: metric names must be unique within the same briefing."""
        if not self.metrics:
            return self

        seen: set[str] = set()
        for metric in self.metrics:
            key = metric.name.strip().lower()
            if key in seen:
                raise ValueError(
                    f"Duplicate metric name: '{metric.name}'. "
                    "Metric names must be unique within a briefing."
                )
            seen.add(key)

        return self


class BriefingRead(BaseModel):
    id: uuid.UUID
    company_name: str
    ticker: str
    sector: Optional[str]
    analyst_name: Optional[str]
    summary: str
    recommendation: str
    is_generated: bool
    generated_at: Optional[datetime]
    created_at: datetime
    updated_at: datetime
    key_points: list[PointRead]
    risks: list[PointRead]
    metrics: list[MetricRead]

    model_config = {"from_attributes": True}


class BriefingGenerate(BaseModel):
    request_timestamp: datetime
    message: str = "Request accepted."
    next: str

    model_config = {"from_attributes": True}
