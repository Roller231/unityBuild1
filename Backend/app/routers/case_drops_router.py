from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app.schemas.case_drops_schema import CaseDropCreate, CaseDropOut
from app.crud.case_drops_crud import (
    get_case_drop, get_case_drops_for_case,
    create_case_drop, delete_case_drop
)

router = APIRouter(prefix="/case-drops", tags=["CaseDrops"])

@router.get("/case/{case_id}", response_model=List[CaseDropOut])
def list_for_case(case_id: int, db: Session = Depends(get_db)):
    return get_case_drops_for_case(db, case_id)

@router.get("/{case_id}/{drop_id}", response_model=CaseDropOut)
def read(case_id: int, drop_id: int, db: Session = Depends(get_db)):
    obj = get_case_drop(db, case_id, drop_id)
    if not obj:
        raise HTTPException(404, "CaseDrop not found")
    return obj

@router.post("/", response_model=CaseDropOut)
def create(data: CaseDropCreate, db: Session = Depends(get_db)):
    return create_case_drop(db, data)

@router.delete("/{case_id}/{drop_id}")
def remove(case_id: int, drop_id: int, db: Session = Depends(get_db)):
    ok = delete_case_drop(db, case_id, drop_id)
    if not ok:
        raise HTTPException(404, "CaseDrop not found")
    return {"success": True}
