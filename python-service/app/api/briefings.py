from typing import Annotated
from uuid import UUID
from fastapi import APIRouter, Depends, status, BackgroundTasks
from fastapi.responses import HTMLResponse
from sqlalchemy.orm import Session
from datetime import datetime, timezone

from app.db.session import get_db
from app.schemas.briefings import BriefingGenerate, BriefingCreate, BriefingRead
from app.services.briefing_service import (
    create_briefing,
    generate_briefing,
    retrieve_briefing,
)

router = APIRouter(prefix="/briefings", tags=["briefings"])


@router.post("/", response_model=BriefingRead, status_code=status.HTTP_201_CREATED)
def create(
    payload: BriefingCreate, db: Annotated[Session, Depends(get_db)]
) -> BriefingRead:
    briefing = create_briefing(db, payload)
    return BriefingRead.model_validate(briefing)


@router.post(
    "/{id}/generate",
    response_model=BriefingGenerate,
    status_code=status.HTTP_202_ACCEPTED,
)
async def generate(
    id: UUID,
    db: Annotated[Session, Depends(get_db)],
    background_tasks: BackgroundTasks,
    refresh: bool = False,
) -> BriefingGenerate:
    background_tasks.add_task(generate_briefing, id, refresh)
    return BriefingGenerate(
        request_timestamp=datetime.now(timezone.utc),
        message="Request accepted.",
        next=f"/briefings/{id}/html",
    )


@router.get("/{id}", response_model=BriefingRead)
def retrieve(id: UUID, db: Annotated[Session, Depends(get_db)]) -> BriefingRead:
    briefing = retrieve_briefing(db, id)
    return BriefingRead.model_validate(briefing)


@router.get("/{id}/html")
def get_html(id: UUID, db: Annotated[Session, Depends(get_db)]) -> HTMLResponse:
    briefing = retrieve_briefing(db, id)
    return HTMLResponse(content=briefing.rendered_html)
