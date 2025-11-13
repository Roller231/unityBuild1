from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app.schemas.transactions_schema import (
    TransactionCreate, TransactionUpdate, TransactionOut
)
from app.crud.transactions_crud import (
    get_transaction, get_transactions_for_user,
    create_transaction, update_transaction, delete_transaction
)

router = APIRouter(prefix="/transactions", tags=["Transactions"])

@router.get("/{tx_id}", response_model=TransactionOut)
def read(tx_id: int, db: Session = Depends(get_db)):
    obj = get_transaction(db, tx_id)
    if not obj:
        raise HTTPException(404, "Transaction not found")
    return obj

@router.get("/user/{user_id}", response_model=List[TransactionOut])
def list_for_user(user_id: int, db: Session = Depends(get_db)):
    return get_transactions_for_user(db, user_id)

@router.post("/", response_model=TransactionOut)
def create(data: TransactionCreate, db: Session = Depends(get_db)):
    return create_transaction(db, data)

@router.patch("/{tx_id}", response_model=TransactionOut)
def patch(tx_id: int, data: TransactionUpdate, db: Session = Depends(get_db)):
    obj = update_transaction(db, tx_id, data)
    if not obj:
        raise HTTPException(404, "Transaction not found")
    return obj

@router.delete("/{tx_id}")
def remove(tx_id: int, db: Session = Depends(get_db)):
    ok = delete_transaction(db, tx_id)
    if not ok:
        raise HTTPException(404, "Transaction not found")
    return {"success": True}
