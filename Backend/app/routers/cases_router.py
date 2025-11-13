from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app.schemas.cases_schema import CaseCreate, CaseUpdate, CaseOut
from app.crud.cases_crud import (
    create_case, get_case, get_cases,
    update_case, delete_case
)

router = APIRouter(prefix="/cases", tags=["Cases"])

@router.get("/", response_model=List[CaseOut])
def list_cases(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    return get_cases(db, skip, limit)

@router.get("/{case_id}", response_model=CaseOut)
def read_case(case_id: int, db: Session = Depends(get_db)):
    obj = get_case(db, case_id)
    if not obj:
        raise HTTPException(404, "Case not found")
    return obj

@router.post("/", response_model=CaseOut)
def create(data: CaseCreate, db: Session = Depends(get_db)):
    return create_case(db, data)

@router.patch("/{case_id}", response_model=CaseOut)
def patch(case_id: int, data: CaseUpdate, db: Session = Depends(get_db)):
    obj = update_case(db, case_id, data)
    if not obj:
        raise HTTPException(404, "Case not found")
    return obj

@router.delete("/{case_id}")
def remove(case_id: int, db: Session = Depends(get_db)):
    ok = delete_case(db, case_id)
    if not ok:
        raise HTTPException(404, "Case not found")
    return {"success": True}
