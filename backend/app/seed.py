"""Development seed data.

Demo accounts exist only for local development. Do not use these passwords
outside a development database.
"""

from sqlalchemy import select
from sqlalchemy.orm import Session

from app import database
from app.config import get_settings
from app.models import (
    Achievement,
    Category,
    Neighborhood,
    Priority,
    Report,
    ReportStatus,
    ReportStatusHistory,
    User,
    UserRole,
)
from app.utils.security import hash_password

# DEVELOPMENT ONLY. Documented in the project README.
DEMO_ACCOUNTS = (
    {
        "email": "citizen@gmail.com",
        "password": "Citizen123",
        "full_name": "Amina Diallo",
        "role": UserRole.citizen,
        "neighborhood_slug": "harbor-north",
    },
    {
        "email": "admin@gmail.com",
        "password": "Admin123",
        "full_name": "Jonas Keller",
        "role": UserRole.administrator,
        "neighborhood_slug": "civic-center",
    },
    {
        "email": "worker@gmail.com",
        "password": "Worker123",
        "full_name": "Leila Mensah",
        "role": UserRole.worker,
        "neighborhood_slug": "riverside",
    },
)

NEIGHBORHOODS = (
    ("Prishtina", "harbor-north", "The capital area and central neighborhoods of Prishtina."),
    ("Prizren", "old-market", "Historic streets and central neighborhoods in Prizren."),
    ("Mitrovica", "riverside", "Northern and southern neighborhoods around Mitrovica."),
    ("Peja", "civic-center", "Municipal and residential streets across Peja."),
    ("Gjilan", "east-industrial", "Residential and commercial areas across Gjilan."),
)

CATEGORIES = (
    ("Potholes", "potholes", "Holes and broken patches in the road surface."),
    ("Broken streetlights", "broken-streetlights", "Streetlights that are dark, damaged, or flickering."),
    ("Illegal dumping", "illegal-dumping", "Waste left in public space."),
    ("Damaged sidewalks", "damaged-sidewalks", "Cracked, lifted, or missing pavement."),
    ("Water leaks", "water-leaks", "Leaking pipes, hydrants, or standing water from public infrastructure."),
    ("Traffic signs", "traffic-signs", "Missing, bent, or unreadable signs."),
    ("Road damage", "road-damage", "Broader road surface damage, including large potholes."),
    ("Public property damage", "public-property-damage", "Damage to benches, bins, fences, or other public property."),
    ("Other", "other", "Issues that do not fit another category."),
)

ACHIEVEMENTS = (
    ("first_responder", "First Responder", "Submitted a first accepted community report."),
    ("neighborhood_hero", "Neighborhood Hero", "Sustained, useful contributions in one neighborhood."),
    ("city_guardian", "City Guardian", "A long record of verified civic reports."),
    ("community_champion", "Community Champion", "Helped the community confirm and follow shared issues."),
    ("environmental_protector", "Environmental Protector", "Reported environmental hazards such as dumping or leaks."),
)


def _get_or_create_neighborhood(db: Session, name: str, slug: str, description: str) -> Neighborhood:
    existing = db.scalar(select(Neighborhood).where(Neighborhood.slug == slug))
    if existing is not None:
        existing.name = name
        existing.description = description
        return existing
    neighborhood = Neighborhood(name=name, slug=slug, description=description)
    db.add(neighborhood)
    db.flush()
    return neighborhood


def seed(db: Session) -> None:
    for name, slug, description in NEIGHBORHOODS:
        _get_or_create_neighborhood(db, name, slug, description)
    for name, slug, description in CATEGORIES:
        if db.scalar(select(Category).where(Category.slug == slug)) is None:
            db.add(Category(name=name, slug=slug, description=description))
    for code, name, description in ACHIEVEMENTS:
        if db.scalar(select(Achievement).where(Achievement.code == code)) is None:
            db.add(Achievement(code=code, name=name, description=description))
    db.flush()

    neighborhoods = {item.slug: item for item in db.scalars(select(Neighborhood))}
    for account in DEMO_ACCOUNTS:
        if db.scalar(select(User).where(User.email == account["email"])) is not None:
            continue
        neighborhood = neighborhoods[account["neighborhood_slug"]]
        db.add(
            User(
                email=account["email"],
                password_hash=hash_password(account["password"]),
                full_name=account["full_name"],
                role=account["role"],
                neighborhood_id=neighborhood.id,
                points=0,
                is_active=True,
            )
        )
    db.flush()
    if db.scalar(select(Report).where(Report.reference_code == "FMS-DEMO-001")) is None:
        citizen = db.scalar(select(User).where(User.email == "citizen@gmail.com"))
        categories = {item.slug: item for item in db.scalars(select(Category))}
        neighborhoods = {item.slug: item for item in db.scalars(select(Neighborhood))}
        demos = (
            ("FMS-DEMO-001", "Large pothole near the market", "A deep pothole is causing vehicles to stop suddenly near the pedestrian crossing.", "potholes", "old-market", 42.2187, 20.7417, Priority.critical, ReportStatus.in_progress),
            ("FMS-DEMO-002", "Streetlight not working", "The streetlight at the corner has remained dark for several nights.", "broken-streetlights", "harbor-north", 42.6637, 21.1622, Priority.high, ReportStatus.approved),
            ("FMS-DEMO-003", "Illegal waste near bus stop", "Several bags of construction waste have been left beside the bus stop.", "illegal-dumping", "riverside", 42.8904, 20.8661, Priority.medium, ReportStatus.submitted),
            ("FMS-DEMO-004", "Damaged sidewalk slab", "A raised sidewalk slab creates a risk for pedestrians.", "damaged-sidewalks", "civic-center", 42.6596, 20.2898, Priority.low, ReportStatus.resolved),
            ("FMS-DEMO-005", "Water leaking from public hydrant", "Water is leaking continuously into the roadway.", "water-leaks", "riverside", 42.4638, 21.4696, Priority.critical, ReportStatus.assigned),
        )
        if citizen is not None:
            for code, title, description, category_slug, neighborhood_slug, lat, lon, urgency, report_status in demos:
                if db.scalar(select(Report).where(Report.reference_code == code)) is not None:
                    continue
                report = Report(
                    reference_code=code,
                    user_id=citizen.id,
                    category_id=categories[category_slug].id,
                    neighborhood_id=neighborhoods[neighborhood_slug].id,
                    title=title,
                    description=description,
                    latitude=lat,
                    longitude=lon,
                    urgency=urgency,
                    priority=urgency,
                    status=report_status,
                )
                db.add(report)
                db.flush()
                db.add(ReportStatusHistory(report_id=report.id, from_status=None, to_status=report_status, changed_by_id=None, note="Demo report seeded for civic monitoring"))
        demo_coordinates = {
            "FMS-DEMO-001": (42.2187, 20.7417),
            "FMS-DEMO-002": (42.6637, 21.1622),
            "FMS-DEMO-003": (42.8904, 20.8661),
            "FMS-DEMO-004": (42.6596, 20.2898),
            "FMS-DEMO-005": (42.4638, 21.4696),
        }
        for code, (latitude, longitude) in demo_coordinates.items():
            report = db.scalar(select(Report).where(Report.reference_code == code))
            if report is not None:
                report.latitude = latitude
                report.longitude = longitude
    db.commit()


def main() -> None:
    settings = get_settings()
    database.init_engine(settings)
    database.create_tables()
    if database.SessionLocal is None:
        raise RuntimeError("Database session factory is not initialized")
    db = database.SessionLocal()
    try:
        seed(db)
    finally:
        db.close()
    print("Development database is ready.")
    print("Demo accounts (development only):")
    for account in DEMO_ACCOUNTS:
        print(f"  {account['role'].value}: {account['email']} / {account['password']}")


if __name__ == "__main__":
    main()
