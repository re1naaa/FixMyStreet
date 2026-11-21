from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Neighborhood
from app.schemas.auth import NeighborhoodPublic

router = APIRouter(prefix="/neighborhoods", tags=["neighborhoods"])


@router.get("", response_model=list[NeighborhoodPublic])
def list_neighborhoods(db: Session = Depends(get_db)) -> list[Neighborhood]:
    return list(db.scalars(select(Neighborhood).order_by(Neighborhood.name)))
