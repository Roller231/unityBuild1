from sqlalchemy.orm import Session
from typing import List, Optional
from app.models import Users
from app.schemas.users_schema import UserCreate, UserUpdate

def get_user(db: Session, user_id: int) -> Optional[Users]:
    return db.query(Users).filter(Users.id == user_id).first()

def get_user_by_tg(db: Session, tg_id: str) -> Optional[Users]:
    return db.query(Users).filter(Users.tg_id == tg_id).first()

def get_users(db: Session, skip: int = 0, limit: int = 100) -> List[Users]:
    return db.query(Users).offset(skip).limit(limit).all()

def user_exists(db: Session, user_id: int) -> bool:
    return db.query(Users.id).filter(Users.id == user_id).first() is not None

def create_user(db: Session, data: UserCreate) -> Users:
    obj = Users(**data.dict())
    db.add(obj)
    db.commit()
    db.refresh(obj)
    return obj

def update_user(db: Session, user_id: int, data: UserUpdate) -> Optional[Users]:
    obj = get_user(db, user_id)
    if not obj:
        return None
    for field, value in data.dict(exclude_unset=True).items():
        setattr(obj, field, value)
    db.commit()
    db.refresh(obj)
    return obj

def delete_user(db: Session, user_id: int) -> bool:
    obj = get_user(db, user_id)
    if not obj:
        return False
    db.delete(obj)
    db.commit()
    return True
