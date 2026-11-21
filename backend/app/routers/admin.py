from fastapi import APIRouter, Depends

from app.models import User, UserRole
from app.schemas.auth import UserPublic
from app.services.users import to_public
from app.utils.deps import require_roles

router = APIRouter(prefix="/admin", tags=["admin"])


@router.get("/access", response_model=UserPublic)
def administrator_access(user: User = Depends(require_roles(UserRole.administrator))) -> UserPublic:
    """Confirms the caller is an administrator. Role is read from the database."""
    return to_public(user)
