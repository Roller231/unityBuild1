from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app.schemas.crash_rounds_schema import (
    CrashRoundCreate, CrashRoundUpdate, CrashRoundOut
)
from app.crud.crash_rounds_crud import (
    create_round, get_round, get_rounds,
    update_round, delete_round, get_round_by_number
)

router = APIRouter(prefix="/crash-rounds", tags=["CrashRounds"])

@router.get("/", response_model=List[CrashRoundOut])
def list_rounds(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    return get_rounds(db, skip, limit)

@router.get("/{round_id}", response_model=CrashRoundOut)
def read_round(round_id: int, db: Session = Depends(get_db)):
    obj = get_round(db, round_id)
    if not obj:
        raise HTTPException(404, "Round not found")
    return obj

@router.get("/number/{round_number}", response_model=CrashRoundOut)
def read_by_number(round_number: int, db: Session = Depends(get_db)):
    obj = get_round_by_number(db, round_number)
    if not obj:
        raise HTTPException(404, "Round not found")
    return obj

@router.post("/", response_model=CrashRoundOut)
def create(data: CrashRoundCreate, db: Session = Depends(get_db)):
    return create_round(db, data)

@router.patch("/{round_id}", response_model=CrashRoundOut)
def patch(round_id: int, data: CrashRoundUpdate, db: Session = Depends(get_db)):
    obj = update_round(db, round_id, data)
    if not obj:
        raise HTTPException(404, "Round not found")
    return obj

@router.delete("/{round_id}")
def remove(round_id: int, db: Session = Depends(get_db)):
    ok = delete_round(db, round_id)
    if not ok:
        raise HTTPException(404, "Round not found")
    return {"success": True}
