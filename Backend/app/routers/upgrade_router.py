from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app.schemas.upgrade_schema import UpgradeRequest, UpgradeResponse
from app.services.upgrade_service import upgrade_service

router = APIRouter(prefix="/upgrade", tags=["Upgrade"])


@router.post("/", response_model=UpgradeResponse)
def upgrade(
    data: UpgradeRequest,
    db: Session = Depends(get_db),
):
    return upgrade_service(
        db=db,
        user_id=data.user_id,
        from_drop_id=data.from_drop_id,
        to_drop_id=data.to_drop_id,
    )
