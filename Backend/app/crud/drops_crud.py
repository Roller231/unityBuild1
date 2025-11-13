from sqlalchemy.orm import Session
from typing import List, Optional
from app.models import Drops
from app.schemas.drops_schema import DropCreate, DropUpdate

def get_drop(db: Session, drop_id: int) -> Optional[Drops]:
    return db.query(Drops).filter(Drops.id == drop_id).first()

def get_drops(db: Session, skip: int = 0, limit: int = 100) -> List[Drops]:
    return db.query(Drops).offset(skip).limit(limit).all()

def drop_exists(db: Session, drop_id: int) -> bool:
    return db.query(Drops.id).filter(Drops.id == drop_id).first() is not None

def create_drop(db: Session, data: DropCreate) -> Drops:
    obj = Drops(**data.dict())
    db.add(obj)
    db.commit()
    db.refresh(obj)
    return obj

def update_drop(db: Session, drop_id: int, data: DropUpdate) -> Optional[Drops]:
    obj = get_drop(db, drop_id)
    if not obj:
        return None
    for field, value in data.dict(exclude_unset=True).items():
        setattr(obj, field, value)
    db.commit()
    db.refresh(obj)
    return obj

def delete_drop(db: Session, drop_id: int) -> bool:
    obj = get_drop(db, drop_id)
    if not obj:
        return False
    db.delete(obj)
    db.commit()
    return True
