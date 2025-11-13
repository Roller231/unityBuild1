from sqlalchemy.orm import Session
from typing import List, Optional
from app.models import CrashRounds
from app.schemas.crash_rounds_schema import CrashRoundCreate, CrashRoundUpdate

def get_round(db: Session, round_id: int) -> Optional[CrashRounds]:
    return db.query(CrashRounds).filter(CrashRounds.id == round_id).first()

def get_round_by_number(db: Session, number: int) -> Optional[CrashRounds]:
    return db.query(CrashRounds).filter(CrashRounds.round_number == number).first()

def get_rounds(db: Session, skip: int = 0, limit: int = 100) -> List[CrashRounds]:
    return db.query(CrashRounds).offset(skip).limit(limit).all()

def round_exists(db: Session, round_id: int) -> bool:
    return db.query(CrashRounds.id).filter(CrashRounds.id == round_id).first() is not None

def create_round(db: Session, data: CrashRoundCreate) -> CrashRounds:
    obj = CrashRounds(**data.dict())
    db.add(obj)
    db.commit()
    db.refresh(obj)
    return obj

def update_round(db: Session, round_id: int, data: CrashRoundUpdate) -> Optional[CrashRounds]:
    obj = get_round(db, round_id)
    if not obj:
        return None
    for field, value in data.dict(exclude_unset=True).items():
        setattr(obj, field, value)
    db.commit()
    db.refresh(obj)
    return obj

def delete_round(db: Session, round_id: int) -> bool:
    obj = get_round(db, round_id)
    if not obj:
        return False
    db.delete(obj)
    db.commit()
    return True
