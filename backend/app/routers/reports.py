import uuid
from datetime import timedelta, timezone
from math import asin, cos, radians, sin, sqrt

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import (
    Achievement,
    Category,
    Comment,
    Notification,
    Priority,
    Report,
    ReportStatus,
    ReportStatusHistory,
    User,
    UserAchievement,
    Vote,
)
from app.schemas.reports import (
    AchievementPublic,
    CategoryPublic,
    CommentCreate,
    CommentPublic,
    NeighborhoodHealth,
    NotificationPublic,
    ReportCreate,
    ReportPublic,
    ReportStats,
)
from app.utils.deps import get_current_user
from app.utils.time import utcnow

router = APIRouter(prefix="/reports", tags=["reports"])


def _distance_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    lat1, lon1, lat2, lon2 = map(radians, (lat1, lon1, lat2, lon2))
    dlat, dlon = lat2 - lat1, lon2 - lon1
    a = sin(dlat / 2) ** 2 + cos(lat1) * cos(lat2) * sin(dlon / 2) ** 2
    return 6371 * 2 * asin(sqrt(a))


def _public(db: Session, report: Report, user_id: int) -> ReportPublic:
    votes = len(report.votes)
    return ReportPublic(
        id=report.id,
        reference_code=report.reference_code,
        title=report.title,
        description=report.description,
        category_id=report.category_id,
        category_name=report.category.name,
        category_slug=report.category.slug,
        neighborhood_id=report.neighborhood_id,
        neighborhood_name=report.neighborhood.name if report.neighborhood else None,
        latitude=report.latitude,
        longitude=report.longitude,
        urgency=report.urgency.value,
        priority=report.priority.value if report.priority else report.urgency.value,
        status=report.status.value,
        photo_url=(f"/api/uploads/{report.photo_path}" if report.photo_path else None),
        author_name=report.author.full_name,
        vote_count=votes,
        has_voted=any(vote.user_id == user_id for vote in report.votes),
        comment_count=len([comment for comment in report.comments if not comment.is_removed]),
        created_at=report.created_at,
        updated_at=report.updated_at,
    )


@router.get("/categories", response_model=list[CategoryPublic])
def categories(db: Session = Depends(get_db)):
    return list(db.scalars(select(Category).order_by(Category.name)))


@router.get("", response_model=list[ReportPublic])
def list_reports(
    status_filter: str | None = None,
    category: str | None = None,
    priority: str | None = None,
    search: str | None = None,
    mine: bool = False,
    db: Session = Depends(get_db),
    user=Depends(get_current_user),
):
    query = select(Report)
    if mine:
        query = query.where(Report.user_id == user.id)
    if status_filter:
        try:
            status_value = ReportStatus(status_filter)
        except ValueError as error:
            raise HTTPException(status_code=400, detail="Invalid status") from error
        query = query.where(Report.status == status_value)
    if priority:
        try:
            priority_value = Priority(priority)
        except ValueError as error:
            raise HTTPException(status_code=400, detail="Invalid priority") from error
        query = query.where(
            (Report.priority == priority_value)
            | ((Report.priority.is_(None)) & (Report.urgency == priority_value))
        )
    if category:
        query = query.join(Category).where(Category.slug == category)
    if search:
        query = query.where(Report.title.ilike(f"%{search}%") | Report.description.ilike(f"%{search}%"))
    reports = list(db.scalars(query.order_by(Report.created_at.desc())))
    return [_public(db, report, user.id) for report in reports]


@router.get("/stats", response_model=ReportStats)
def report_stats(db: Session = Depends(get_db), user=Depends(get_current_user)):
    my_reports = db.scalar(select(func.count(Report.id)).where(Report.user_id == user.id)) or 0
    resolved = db.scalar(select(func.count(Report.id)).where(Report.user_id == user.id, Report.status == ReportStatus.resolved)) or 0
    active = db.scalar(select(func.count(Report.id)).where(Report.user_id == user.id, Report.status != ReportStatus.resolved)) or 0
    community = db.scalar(select(func.count(Report.id))) or 0
    return ReportStats(my_reports=my_reports, resolved_reports=resolved, active_reports=active, community_reports=community)


@router.get("/community")
def community(db: Session = Depends(get_db), user=Depends(get_current_user)):
    reports = list(db.scalars(select(Report).order_by(Report.created_at.desc()).limit(30)))
    ranked = sorted(reports, key=lambda item: len(item.votes), reverse=True)
    users = list(db.scalars(select(User).order_by(User.points.desc()).limit(10)))
    leaderboard = [{"id": item.id, "name": item.full_name, "points": item.points} for item in users]
    return {
        "top_supported": [_public(db, item, user.id) for item in ranked[:5]],
        "recent": [_public(db, item, user.id) for item in reports[:10]],
        "leaderboard": leaderboard,
    }


@router.get("/notifications", response_model=list[NotificationPublic])
def notifications(db: Session = Depends(get_db), user=Depends(get_current_user)):
    items = list(db.scalars(select(Notification).where(Notification.user_id == user.id).order_by(Notification.created_at.desc()).limit(100)))
    return [NotificationPublic(id=item.id, type=item.type, title=item.title, body=item.body, report_id=item.report_id, read=item.read_at is not None, created_at=item.created_at) for item in items]


@router.post("/notifications/read-all", status_code=204)
def read_notifications(db: Session = Depends(get_db), user=Depends(get_current_user)):
    db.query(Notification).filter(Notification.user_id == user.id, Notification.read_at.is_(None)).update({"read_at": utcnow()})
    db.commit()


@router.post("/notifications/{notification_id}/read", status_code=204)
def read_notification(notification_id: int, db: Session = Depends(get_db), user=Depends(get_current_user)):
    item = db.scalar(select(Notification).where(Notification.id == notification_id, Notification.user_id == user.id))
    if item is None:
        raise HTTPException(status_code=404, detail="Notification not found")
    item.read_at = utcnow()
    db.commit()


@router.get("/achievements", response_model=list[AchievementPublic])
def achievements(db: Session = Depends(get_db), user=Depends(get_current_user)):
    earned_ids = set(db.scalars(select(UserAchievement.achievement_id).where(UserAchievement.user_id == user.id)))
    items = list(db.scalars(select(Achievement).order_by(Achievement.name)))
    return [AchievementPublic(code=item.code, name=item.name, description=item.description, earned=item.id in earned_ids) for item in items]


@router.get("/neighborhood-health", response_model=NeighborhoodHealth)
def neighborhood_health(db: Session = Depends(get_db), user=Depends(get_current_user)):
    if user.neighborhood_id is None:
        return NeighborhoodHealth(score=0, open_issues=0, resolved_issues=0, improvement_trend=0)
    all_reports = list(db.scalars(select(Report).where(Report.neighborhood_id == user.neighborhood_id)))
    resolved = sum(item.status == ReportStatus.resolved for item in all_reports)
    open_count = len(all_reports) - resolved
    denominator = len(all_reports)
    score = round((resolved / denominator) * 100) if denominator else 100
    cutoff = utcnow() - timedelta(days=30)
    def _aware(value):
        return value if value.tzinfo is not None else value.replace(tzinfo=timezone.utc)
    cutoff = _aware(cutoff)
    recent_resolved = sum(item.status == ReportStatus.resolved and _aware(item.updated_at) >= cutoff for item in all_reports)
    recent_open = sum(item.status != ReportStatus.resolved and _aware(item.created_at) >= cutoff for item in all_reports)
    trend = recent_resolved - recent_open
    return NeighborhoodHealth(score=score, open_issues=open_count, resolved_issues=resolved, improvement_trend=trend)


@router.post("/upload")
async def upload_photo(file: UploadFile = File(...), user=Depends(get_current_user)):
    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="Please upload an image")
    from pathlib import Path
    upload_dir = Path(__file__).resolve().parents[1] / "uploads"
    upload_dir.mkdir(parents=True, exist_ok=True)
    suffix = Path(file.filename or "photo.jpg").suffix.lower() or ".jpg"
    filename = f"{uuid.uuid4().hex}{suffix}"
    destination = upload_dir / filename
    with destination.open("wb") as output:
        output.write(await file.read())
    return {"photo_path": filename, "photo_url": f"/api/uploads/{filename}"}


@router.get("/duplicates", response_model=list[ReportPublic])
def duplicate_reports(latitude: float, longitude: float, category_id: int, db: Session = Depends(get_db), user=Depends(get_current_user)):
    reports = list(db.scalars(select(Report).where(Report.category_id == category_id, Report.status != ReportStatus.resolved)))
    nearby = [report for report in reports if _distance_km(latitude, longitude, report.latitude, report.longitude) <= 0.35]
    return [_public(db, report, user.id) for report in nearby[:5]]


@router.post("", response_model=ReportPublic, status_code=201)
def create_report(payload: ReportCreate, db: Session = Depends(get_db), user=Depends(get_current_user)):
    if not (41.85 <= payload.latitude <= 43.0 and 19.9 <= payload.longitude <= 21.8):
        raise HTTPException(status_code=400, detail="Reports must be located within Kosovo")
    category = db.get(Category, payload.category_id)
    if category is None:
        raise HTTPException(status_code=404, detail="Category not found")
    urgency = Priority(payload.urgency)
    report = Report(
        reference_code=f"FMS-{uuid.uuid4().hex[:8].upper()}",
        user_id=user.id,
        category_id=payload.category_id,
        neighborhood_id=payload.neighborhood_id,
        title=payload.title,
        description=payload.description,
        latitude=payload.latitude,
        longitude=payload.longitude,
        urgency=urgency,
        priority=urgency,
        status=ReportStatus.submitted,
        photo_path=payload.photo_path,
    )
    db.add(report)
    db.flush()
    db.add(ReportStatusHistory(report_id=report.id, from_status=None, to_status=ReportStatus.submitted, changed_by_id=user.id, note="Report submitted by citizen"))
    user.points += 10
    db.commit()
    db.refresh(report)
    return _public(db, report, user.id)


@router.get("/{report_id}", response_model=ReportPublic)
def get_report(report_id: int, db: Session = Depends(get_db), user=Depends(get_current_user)):
    report = db.get(Report, report_id)
    if report is None:
        raise HTTPException(status_code=404, detail="Report not found")
    return _public(db, report, user.id)


@router.post("/{report_id}/vote", status_code=200)
def toggle_vote(report_id: int, db: Session = Depends(get_db), user=Depends(get_current_user)):
    report = db.get(Report, report_id)
    if report is None:
        raise HTTPException(status_code=404, detail="Report not found")
    existing = db.scalar(select(Vote).where(Vote.report_id == report_id, Vote.user_id == user.id))
    if existing:
        db.delete(existing)
        supported = False
    else:
        db.add(Vote(report_id=report_id, user_id=user.id))
        supported = True
    db.commit()
    db.refresh(report)
    return {"supported": supported, "vote_count": len(report.votes)}


@router.get("/{report_id}/comments", response_model=list[CommentPublic])
def comments(report_id: int, db: Session = Depends(get_db), user=Depends(get_current_user)):
    report = db.get(Report, report_id)
    if report is None:
        raise HTTPException(status_code=404, detail="Report not found")
    items = list(db.scalars(select(Comment).where(Comment.report_id == report_id, Comment.is_removed == False).order_by(Comment.created_at.asc())))
    return [CommentPublic(id=item.id, body=item.body, author_name=item.author.full_name, created_at=item.created_at) for item in items]


@router.post("/{report_id}/comments", response_model=CommentPublic, status_code=201)
def add_comment(report_id: int, payload: CommentCreate, db: Session = Depends(get_db), user=Depends(get_current_user)):
    report = db.get(Report, report_id)
    if report is None:
        raise HTTPException(status_code=404, detail="Report not found")
    comment = Comment(report_id=report_id, user_id=user.id, body=payload.body)
    db.add(comment)
    db.commit()
    db.refresh(comment)
    return CommentPublic(id=comment.id, body=comment.body, author_name=user.full_name, created_at=comment.created_at)


@router.get("/{report_id}/history", response_model=list[dict])
def status_history(report_id: int, db: Session = Depends(get_db), user=Depends(get_current_user)):
    report = db.get(Report, report_id)
    if report is None:
        raise HTTPException(status_code=404, detail="Report not found")
    items = list(db.scalars(select(ReportStatusHistory).where(ReportStatusHistory.report_id == report_id).order_by(ReportStatusHistory.created_at.asc())))
    return [{"id": item.id, "from_status": item.from_status.value if item.from_status else None, "to_status": item.to_status.value, "note": item.note, "created_at": item.created_at} for item in items]
