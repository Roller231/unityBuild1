from sqlalchemy.orm import Session
from typing import List, Optional
from app.models import Cases
from app.schemas.cases_schema import CaseCreate, CaseUpdate

def get_case(db: Session, case_id: int) -> Optional[Cases]:
    return db.query(Cases).filter(Cases.id == case_id).first()

def get_cases(db: Session, skip: int = 0, limit: int = 100) -> List[Cases]:
    return db.query(Cases).offset(skip).limit(limit).all()

def case_exists(db: Session, case_id: int) -> bool:
    return db.query(Cases.id).filter(Cases.id == case_id).first() is not None

def create_case(db: Session, data: CaseCreate) -> Cases:
    obj = Cases(**data.dict())
    db.add(obj)
    db.commit()
    db.refresh(obj)
    return obj

def update_case(db: Session, case_id: int, data: CaseUpdate) -> Optional[Cases]:
    obj = get_case(db, case_id)
    if not obj:
        return None
    for field, value in data.dict(exclude_unset=True).items():
        setattr(obj, field, value)
    db.commit()
    db.refresh(obj)
    return obj

def delete_case(db: Session, case_id: int) -> bool:
    obj = get_case(db, case_id)
    if not obj:
        return False
    db.delete(obj)
    db.commit()
    return True
