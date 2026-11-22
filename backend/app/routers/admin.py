from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import delete, func, select, update
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import (
    Comment,
    CommunityFix,
    InternalNote,
    Notification,
    Report,
    ReportStatus,
    ReportStatusHistory,
    User,
    UserRole,
    Vote,
    WorkerAssignment,
)
from app.routers.reports import _public
from app.schemas.auth import UserPublic
from app.schemas.reports import AdminOverview, ReportPublic, StatusUpdate
from app.services.users import to_public
from app.utils.deps import require_roles

router = APIRouter(prefix="/admin", tags=["admin"])
require_admin = require_roles(UserRole.administrator)


@router.get("/access", response_model=UserPublic)
def administrator_access(user: User = Depends(require_admin)) -> UserPublic:
    """Confirms the caller is an administrator. Role is read from the database."""
    return to_public(user)


@router.get("/overview", response_model=AdminOverview)
def overview(db: Session = Depends(get_db), user: User = Depends(require_admin)) -> AdminOverview:
    counts = dict(db.execute(select(Report.status, func.count(Report.id)).group_by(Report.status)).all())
    by_status = {item.value: counts.get(item, 0) for item in ReportStatus}
    fixes = db.scalar(select(func.count(CommunityFix.id))) or 0
    return AdminOverview(total=sum(by_status.values()), by_status=by_status, community_fixes=fixes)


@router.patch("/reports/{report_id}/status", response_model=ReportPublic)
def update_status(report_id: int, payload: StatusUpdate, db: Session = Depends(get_db), user: User = Depends(require_admin)):
    report = db.get(Report, report_id)
    if report is None:
        raise HTTPException(status_code=404, detail="Report not found")
    new_status = ReportStatus(payload.status)
    if new_status != report.status:
        label = new_status.value.replace("_", " ")
        db.add(ReportStatusHistory(report_id=report.id, from_status=report.status, to_status=new_status, changed_by_id=user.id, note=payload.note or f"Status changed to {label} by administrator"))
        db.add(Notification(user_id=report.user_id, report_id=report.id, type="status_change", title="Report status updated", body=f"\"{report.title}\" is now {label}."))
        report.status = new_status
        db.commit()
        db.refresh(report)
    return _public(db, report, user.id)


@router.delete("/reports/{report_id}", status_code=204)
def remove_report(report_id: int, db: Session = Depends(get_db), user: User = Depends(require_admin)) -> None:
    report = db.get(Report, report_id)
    if report is None:
        raise HTTPException(status_code=404, detail="Report not found")
    for model in (Comment, Vote, ReportStatusHistory, WorkerAssignment, InternalNote, CommunityFix):
        db.execute(delete(model).where(model.report_id == report_id))
    db.execute(update(Notification).where(Notification.report_id == report_id).values(report_id=None))
    db.delete(report)
    db.commit()
