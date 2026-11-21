from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session, joinedload

from app.models import Neighborhood, User, UserRole
from app.schemas.auth import ProfileUpdate, RegisterRequest, UserPublic
from app.utils.security import hash_password, verify_password


def to_public(user: User) -> UserPublic:
    neighborhood_name = user.neighborhood.name if user.neighborhood is not None else None
    return UserPublic(
        id=user.id,
        email=user.email,
        full_name=user.full_name,
        role=user.role,
        neighborhood_id=user.neighborhood_id,
        neighborhood_name=neighborhood_name,
        points=user.points,
        created_at=user.created_at,
    )


def get_user_by_email(db: Session, email: str) -> User | None:
    return db.scalar(select(User).options(joinedload(User.neighborhood)).where(User.email == email))


def get_user_by_id(db: Session, user_id: int) -> User | None:
    return db.scalar(select(User).options(joinedload(User.neighborhood)).where(User.id == user_id))


def _neighborhood_or_404(db: Session, neighborhood_id: int) -> Neighborhood:
    neighborhood = db.get(Neighborhood, neighborhood_id)
    if neighborhood is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Neighborhood not found")
    return neighborhood


def register_citizen(db: Session, payload: RegisterRequest) -> User:
    if payload.neighborhood_id is not None:
        _neighborhood_or_404(db, payload.neighborhood_id)
    user = User(
        email=payload.email,
        password_hash=hash_password(payload.password),
        full_name=payload.full_name,
        role=UserRole.citizen,
        neighborhood_id=payload.neighborhood_id,
        points=0,
        is_active=True,
    )
    db.add(user)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="An account with this email already exists",
        ) from None
    created = get_user_by_id(db, user.id)
    if created is None:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Account could not be loaded")
    return created


def authenticate(db: Session, email: str, password: str) -> User:
    user = get_user_by_email(db, email)
    if user is None or not user.is_active or not verify_password(password, user.password_hash):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid email or password")
    return user


def update_profile(db: Session, user: User, payload: ProfileUpdate) -> User:
    fields = payload.model_fields_set
    if "full_name" in fields and payload.full_name is not None:
        user.full_name = payload.full_name
    if "neighborhood_id" in fields:
        if payload.neighborhood_id is None:
            user.neighborhood_id = None
        else:
            _neighborhood_or_404(db, payload.neighborhood_id)
            user.neighborhood_id = payload.neighborhood_id
    db.commit()
    refreshed = get_user_by_id(db, user.id)
    if refreshed is None:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Account could not be loaded")
    db.refresh(refreshed, attribute_names=["neighborhood"])
    return refreshed
