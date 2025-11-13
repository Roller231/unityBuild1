from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app.schemas.crash_bets_schema import CrashBetCreate, CrashBetUpdate, CrashBetOut
from app.crud.crash_bets_crud import (
    get_bet, get_bets_for_round, get_bets_for_user,
    create_bet, update_bet, delete_bet
)

router = APIRouter(prefix="/crash-bets", tags=["CrashBets"])

@router.get("/{bet_id}", response_model=CrashBetOut)
def read_bet(bet_id: int, db: Session = Depends(get_db)):
    obj = get_bet(db, bet_id)
    if not obj:
        raise HTTPException(404, "Bet not found")
    return obj

@router.get("/round/{round_id}", response_model=List[CrashBetOut])
def list_for_round(round_id: int, db: Session = Depends(get_db)):
    return get_bets_for_round(db, round_id)

@router.get("/user/{user_id}", response_model=List[CrashBetOut])
def list_for_user(user_id: int, db: Session = Depends(get_db)):
    return get_bets_for_user(db, user_id)

@router.post("/", response_model=CrashBetOut)
def create(data: CrashBetCreate, db: Session = Depends(get_db)):
    return create_bet(db, data)

@router.patch("/{bet_id}", response_model=CrashBetOut)
def patch(bet_id: int, data: CrashBetUpdate, db: Session = Depends(get_db)):
    obj = update_bet(db, bet_id, data)
    if not obj:
        raise HTTPException(404, "Bet not found")
    return obj

@router.delete("/{bet_id}")
def remove(bet_id: int, db: Session = Depends(get_db)):
    ok = delete_bet(db, bet_id)
    if not ok:
        raise HTTPException(404, "Bet not found")
    return {"success": True}
