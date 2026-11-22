"""Points, levels and achievement rewards.

Achievements are evaluated lazily after point-earning actions and again when
the achievements endpoint is hit, so users who earned criteria before this
system existed still get credited.
"""

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models import (
    Achievement,
    Category,
    CommunityFix,
    Notification,
    Report,
    ReportStatus,
    User,
    UserAchievement,
    Vote,
)

# code -> (point reward, target progress)
ACHIEVEMENT_RULES: dict[str, tuple[int, int]] = {
    "first_responder": (50, 1),
    "neighborhood_hero": (75, 5),
    "city_guardian": (150, 10),
    "community_champion": (75, 3),
    "environmental_protector": (50, 1),
}

ENVIRONMENTAL_SLUGS = {"illegal-dumping", "water-leaks"}

# Points needed to reach each level (index = level - 1)
LEVEL_THRESHOLDS = [0, 50, 150, 300, 600, 1000]
LEVEL_NAMES = ["Newcomer", "Reporter", "Advocate", "Guardian", "Champion", "Legend"]


def level_for(points: int) -> tuple[int, str, int, int]:
    """Returns (level, name, points_into_level, points_needed_for_next)."""
    level = 1
    for index, threshold in enumerate(LEVEL_THRESHOLDS):
        if points >= threshold:
            level = index + 1
    name = LEVEL_NAMES[min(level - 1, len(LEVEL_NAMES) - 1)]
    current_floor = LEVEL_THRESHOLDS[level - 1]
    next_floor = LEVEL_THRESHOLDS[level] if level < len(LEVEL_THRESHOLDS) else current_floor
    span = max(next_floor - current_floor, 1)
    return level, name, points - current_floor, span


def _metrics(db: Session, user: User) -> dict[str, int]:
    reports_total = db.scalar(select(func.count(Report.id)).where(Report.user_id == user.id)) or 0
    fixes_total = db.scalar(select(func.count(CommunityFix.id)).where(CommunityFix.user_id == user.id)) or 0
    votes_cast = db.scalar(select(func.count(Vote.id)).where(Vote.user_id == user.id)) or 0
    resolved_own = (
        db.scalar(
            select(func.count(Report.id)).where(
                Report.user_id == user.id,
                Report.status == ReportStatus.resolved,
            )
        )
        or 0
    )
    neighborhood_reports = 0
    if user.neighborhood_id is not None:
        neighborhood_reports = (
            db.scalar(
                select(func.count(Report.id)).where(
                    Report.user_id == user.id,
                    Report.neighborhood_id == user.neighborhood_id,
                )
            )
            or 0
        )
    env_category_ids = select(Category.id).where(Category.slug.in_(ENVIRONMENTAL_SLUGS))
    env_reports = (
        db.scalar(
            select(func.count(Report.id)).where(
                Report.user_id == user.id,
                Report.category_id.in_(env_category_ids),
            )
        )
        or 0
    )
    return {
        "reports": reports_total,
        "fixes": fixes_total,
        "votes": votes_cast,
        "resolved_own": resolved_own,
        "neighborhood_reports": neighborhood_reports,
        "env_reports": env_reports,
    }


def _progress_for(code: str, metrics: dict[str, int]) -> int:
    if code == "first_responder":
        return metrics["reports"]
    if code == "neighborhood_hero":
        return metrics["neighborhood_reports"]
    if code == "city_guardian":
        return metrics["resolved_own"] + metrics["fixes"]
    if code == "community_champion":
        return metrics["votes"] + metrics["fixes"]
    if code == "environmental_protector":
        return metrics["env_reports"]
    return 0


def evaluate_achievements(db: Session, user: User) -> list[str]:
    """Grant any newly-earned achievements. Returns codes granted this call."""
    metrics = _metrics(db, user)
    earned_ids = set(
        db.scalars(select(UserAchievement.achievement_id).where(UserAchievement.user_id == user.id))
    )
    achievements = {item.code: item for item in db.scalars(select(Achievement))}
    granted: list[str] = []
    for code, (reward, target) in ACHIEVEMENT_RULES.items():
        achievement = achievements.get(code)
        if achievement is None or achievement.id in earned_ids:
            continue
        if _progress_for(code, metrics) < target:
            continue
        db.add(UserAchievement(user_id=user.id, achievement_id=achievement.id))
        user.points += reward
        db.add(
            Notification(
                user_id=user.id,
                report_id=None,
                type="achievement",
                title="Achievement unlocked",
                body=f"{achievement.name}: +{reward} points.",
            )
        )
        earned_ids.add(achievement.id)
        granted.append(code)
    return granted


def achievement_status(db: Session, user: User) -> list[dict]:
    """Progress snapshot for every seeded achievement."""
    metrics = _metrics(db, user)
    earned_ids = set(
        db.scalars(select(UserAchievement.achievement_id).where(UserAchievement.user_id == user.id))
    )
    items = []
    for achievement in db.scalars(select(Achievement).order_by(Achievement.name)):
        reward, target = ACHIEVEMENT_RULES.get(achievement.code, (0, 1))
        items.append(
            {
                "code": achievement.code,
                "name": achievement.name,
                "description": achievement.description,
                "earned": achievement.id in earned_ids,
                "points_reward": reward,
                "progress": min(_progress_for(achievement.code, metrics), target),
                "target": target,
            }
        )
    return items
