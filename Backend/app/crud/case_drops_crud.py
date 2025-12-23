from sqlalchemy.orm import Session
from typing import List, Optional
from app.models import CaseDrops
from app.schemas.case_drops_schema import CaseDropCreate

def get_case_drop(db: Session, case_id: int, drop_id: int) -> Optional[CaseDrops]:
    return db.query(CaseDrops).filter(
        CaseDrops.case_id == case_id,
        CaseDrops.drop_id == drop_id
    ).first()

def get_case_drops_for_case(db: Session, case_id: int) -> List[CaseDrops]:
    return (
        db.query(CaseDrops)
        .filter(CaseDrops.case_id == case_id)
        .order_by(CaseDrops.position.asc())  # 🔥 сортировка по порядку
        .all()
    )


def create_case_drop(db: Session, data: CaseDropCreate) -> CaseDrops:
    obj = CaseDrops(**data.dict())
    db.add(obj)
    db.commit()
    db.refresh(obj)
    return obj

def delete_case_drop(db: Session, case_id: int, drop_id: int) -> bool:
    obj = get_case_drop(db, case_id, drop_id)
    if not obj:
        return False
    db.delete(obj)
    db.commit()
    return True
