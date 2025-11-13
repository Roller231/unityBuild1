from sqlalchemy.orm import Session
from typing import List, Optional
from app.models import Transactions
from app.schemas.transactions_schema import TransactionCreate, TransactionUpdate

def get_transaction(db: Session, tx_id: int) -> Optional[Transactions]:
    return db.query(Transactions).filter(Transactions.id == tx_id).first()

def get_transactions_for_user(db: Session, user_id: int) -> List[Transactions]:
    return db.query(Transactions).filter(Transactions.user_id == user_id).all()

def create_transaction(db: Session, data: TransactionCreate) -> Transactions:
    obj = Transactions(**data.dict())
    db.add(obj)
    db.commit()
    db.refresh(obj)
    return obj

def update_transaction(db: Session, tx_id: int, data: TransactionUpdate) -> Optional[Transactions]:
    obj = get_transaction(db, tx_id)
    if not obj:
        return None
    for field, value in data.dict(exclude_unset=True).items():
        setattr(obj, field, value)
    db.commit()
    db.refresh(obj)
    return obj

def delete_transaction(db: Session, tx_id: int) -> bool:
    obj = get_transaction(db, tx_id)
    if not obj:
        return False
    db.delete(obj)
    db.commit()
    return True
