"""Development seed data.

Demo accounts exist only for local development. Do not use these passwords
outside a development database.
"""

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.config import get_settings
from app.database import SessionLocal, create_tables, init_engine
from app.models import Achievement, Category, Neighborhood, User, UserRole
from app.utils.security import hash_password

# DEVELOPMENT ONLY. Documented in the project README.
DEMO_ACCOUNTS = (
    {
        "email": "citizen@fixmystreet.local",
        "password": "Citizen123",
        "full_name": "Amina Diallo",
        "role": UserRole.citizen,
        "neighborhood_slug": "harbor-north",
    },
    {
        "email": "admin@fixmystreet.local",
        "password": "Admin123",
        "full_name": "Jonas Keller",
        "role": UserRole.administrator,
        "neighborhood_slug": "civic-center",
    },
    {
        "email": "worker@fixmystreet.local",
        "password": "Worker123",
        "full_name": "Leila Mensah",
        "role": UserRole.worker,
        "neighborhood_slug": "riverside",
    },
)

NEIGHBORHOODS = (
    ("Harbor North", "harbor-north", "Residential streets north of the harbor."),
    ("Old Market", "old-market", "Dense commercial blocks around the old market."),
    ("Riverside", "riverside", "Paths and roads along the river."),
    ("Civic Center", "civic-center", "Municipal buildings and surrounding streets."),
    ("East Industrial", "east-industrial", "Warehouses and access roads on the east side."),
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
    db.commit()


def main() -> None:
    settings = get_settings()
    init_engine(settings)
    create_tables()
    if SessionLocal is None:
        raise RuntimeError("Database session factory is not initialized")
    db = SessionLocal()
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
