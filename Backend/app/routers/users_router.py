from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app.schemas.users_schema import UserCreate, UserUpdate, UserOut
from app.crud.users_crud import (
    create_user, get_user, get_users,
    update_user, delete_user, get_user_by_tg
)

router = APIRouter(prefix="/users", tags=["Users"])

@router.get("/", response_model=List[UserOut])
def list_users(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    return get_users(db, skip, limit)

@router.get("/{user_id}", response_model=UserOut)
def read_user(user_id: int, db: Session = Depends(get_db)):
    obj = get_user(db, user_id)
    if not obj:
        raise HTTPException(404, "User not found")
    return obj

@router.get("/tg/{tg_id}", response_model=UserOut)
def read_by_tg(tg_id: str, db: Session = Depends(get_db)):
    obj = get_user_by_tg(db, tg_id)
    if not obj:
        raise HTTPException(404, "User not found")
    return obj

@router.post("/", response_model=UserOut)
def create(data: UserCreate, db: Session = Depends(get_db)):
    return create_user(db, data)

@router.patch("/{user_id}", response_model=UserOut)
def patch(user_id: int, data: UserUpdate, db: Session = Depends(get_db)):
    obj = update_user(db, user_id, data)
    if not obj:
        raise HTTPException(404, "User not found")
    return obj

@router.delete("/{user_id}")
def remove(user_id: int, db: Session = Depends(get_db)):
    ok = delete_user(db, user_id)
    if not ok:
        raise HTTPException(404, "User not found")
    return {"success": True}
