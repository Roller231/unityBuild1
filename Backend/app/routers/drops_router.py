from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from app.database import get_db
from app.schemas.drops_schema import DropCreate, DropOut, DropUpdate
from app.crud.drops_crud import (
    create_drop, get_drop, get_drops,
    update_drop, delete_drop
)

router = APIRouter(prefix="/drops", tags=["Drops"])

@router.get("/", response_model=List[DropOut])
def list_drops(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    return get_drops(db, skip, limit)

@router.get("/{drop_id}", response_model=DropOut)
def read_drop(drop_id: int, db: Session = Depends(get_db)):
    obj = get_drop(db, drop_id)
    if not obj:
        raise HTTPException(404, "Drop not found")
    return obj

@router.post("/", response_model=DropOut)
def create(data: DropCreate, db: Session = Depends(get_db)):
    return create_drop(db, data)

@router.patch("/{drop_id}", response_model=DropOut)
def patch(drop_id: int, data: DropUpdate, db: Session = Depends(get_db)):
    obj = update_drop(db, drop_id, data)
    if not obj:
        raise HTTPException(404, "Drop not found")
    return obj

@router.delete("/{drop_id}")
def remove(drop_id: int, db: Session = Depends(get_db)):
    ok = delete_drop(db, drop_id)
    if not ok:
        raise HTTPException(404, "Drop not found")
    return {"success": True}
