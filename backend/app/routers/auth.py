from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.config import Settings, get_settings
from app.database import get_db
from app.models import User
from app.schemas.auth import LoginRequest, ProfileUpdate, RegisterRequest, TokenResponse, UserPublic
from app.services.users import authenticate, register_citizen, to_public, update_profile
from app.utils.deps import get_current_user
from app.utils.security import create_access_token

router = APIRouter(prefix="/auth", tags=["auth"])


def _token_response(settings: Settings, user: User) -> TokenResponse:
    return TokenResponse(
        access_token=create_access_token(settings, user.id, user.role),
        user=to_public(user),
    )


@router.post("/register", response_model=TokenResponse, status_code=201)
def register(
    payload: RegisterRequest,
    db: Session = Depends(get_db),
    settings: Settings = Depends(get_settings),
) -> TokenResponse:
    user = register_citizen(db, payload)
    return _token_response(settings, user)


@router.post("/login", response_model=TokenResponse)
def login(
    payload: LoginRequest,
    db: Session = Depends(get_db),
    settings: Settings = Depends(get_settings),
) -> TokenResponse:
    user = authenticate(db, payload.email, payload.password)
    return _token_response(settings, user)


@router.get("/me", response_model=UserPublic)
def current_user(user: User = Depends(get_current_user)) -> UserPublic:
    return to_public(user)


@router.patch("/me", response_model=UserPublic)
def update_current_user(
    payload: ProfileUpdate,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
) -> UserPublic:
    updated = update_profile(db, user, payload)
    return to_public(updated)
