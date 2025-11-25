from sqlalchemy.orm import Session
from typing import List, Optional
from app.models import CrashBets
from app.schemas.crash_bets_schema import CrashBetCreate, CrashBetUpdate

def get_bet(db: Session, bet_id: int) -> Optional[CrashBets]:
    return db.query(CrashBets).filter(CrashBets.id == bet_id).first()

def get_bets_for_round(db: Session, round_id: int) -> List[CrashBets]:
    return db.query(CrashBets).filter(CrashBets.round_id == round_id).all()

def get_bets_for_user(db: Session, user_id: int) -> List[CrashBets]:
    return db.query(CrashBets).filter(CrashBets.user_id == user_id).all()

def create_bet(db: Session, data: CrashBetCreate) -> CrashBets:
    obj = CrashBets(**data.dict())
    db.add(obj)
    db.commit()
    db.refresh(obj)
    return obj


def update_bet(db: Session, bet_id: int, data: CrashBetUpdate) -> Optional[CrashBets]:
    obj = get_bet(db, bet_id)
    if not obj:
        return None
    for field, value in data.dict(exclude_unset=True).items():
        setattr(obj, field, value)
    db.commit()
    db.refresh(obj)
    return obj

def delete_bet(db: Session, bet_id: int) -> bool:
    obj = get_bet(db, bet_id)
    if not obj:
        return False
    db.delete(obj)
    db.commit()
    return True
