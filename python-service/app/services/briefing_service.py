from datetime import timezone, datetime
from uuid import UUID
from fastapi import HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.briefing import Briefing
from app.models.briefing_point import BriefingPoint
from app.models.briefing_metric import BriefingMetric
from app.schemas.briefings import BriefingCreate, BriefingRead
from app.services.report_contract import ReportViewContract
from app.services.report_formatter import ReportFormatter
from app.db.session import SessionLocal


def create_briefing(db: Session, payload: BriefingCreate) -> BriefingRead:
    briefing = Briefing(
        company_name=payload.companyName,
        ticker=payload.ticker,
        sector=payload.sector,
        analyst_name=payload.analystName,
        summary=payload.summary,
        recommendation=payload.recommendation,
    )

    db.add(briefing)
    db.flush()

    # Create keypoints
    for order, content in enumerate(payload.keyPoints, start=1):
        db.add(
            BriefingPoint(
                briefing_id=briefing.id,
                point_type="KEY_POINT",
                content=content,
                display_order=order,
            )
        )

    # Create Risks
    for order, content in enumerate(payload.risks, start=1):
        db.add(
            BriefingPoint(
                briefing_id=briefing.id,
                point_type="RISK",
                content=content,
                display_order=order,
            )
        )

    # Create Metrics
    for order, metric in enumerate(payload.metrics, start=1):
        db.add(
            BriefingMetric(
                briefing_id=briefing.id,
                name=metric.name,
                value=metric.value,
                display_order=order,
            )
        )

    db.commit()
    db.refresh(briefing)
    return briefing


def generate_briefing(briefing_id: UUID, refresh=False):
    """Background task function - creates its own database session"""
    db = SessionLocal()
    try:
        briefing = db.scalars(
            select(Briefing).where(Briefing.id == briefing_id)
        ).first()

        if not briefing:
            # TODO: Logging service
            print(f"Briefing not found: {briefing_id}")
            return

        if not refresh and briefing.rendered_html:
            print("HTML report already exists, add refresh flag to regenerate")
            return

        # Load relationships
        db.refresh(briefing, ["points", "metrics"])

        report_view_model = ReportViewContract(briefing).transform()
        formatter = ReportFormatter()
        html = formatter.render_report(report_view_model)

        # Save html and generation date
        briefing.rendered_html = html
        briefing.generated_at = datetime.now(timezone.utc)

        db.commit()
    except Exception as e:
        print(f"Error generating briefing {briefing_id}: {e}")
        db.rollback()
    finally:
        db.close()


def retrieve_briefing(db: Session, id: UUID):
    briefing = db.scalars(select(Briefing).where(Briefing.id == id)).first()
    if not briefing:
        raise HTTPException(status_code=404, detail="Briefing not found")
    return briefing
