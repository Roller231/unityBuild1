from pydantic import BaseModel
from typing import Optional, Any

class UserBase(BaseModel):
    tg_id: Optional[str] = None
    username: Optional[str] = None
    firstname: Optional[str] = None
    balance: Optional[float] = 0
    refcount: Optional[int] = 0
    refLink: Optional[str] = None
    refererID: Optional[str] = None
    totalDEP: Optional[float] = None
    inventory: Optional[Any] = None
    url_image: Optional[str] = None


class UserCreate(UserBase):
    pass

class UserUpdate(BaseModel):
    tg_id: Optional[str] = None
    username: Optional[str] = None
    firstname: Optional[str] = None
    balance: Optional[float] = None
    refcount: Optional[int] = None
    refLink: Optional[str] = None
    refererID: Optional[str] = None
    totalDEP: Optional[float] = None
    inventory: Optional[Any] = None
    url_image: Optional[str] = None


class UserOut(UserBase):
    id: int

    class Config:
        orm_mode = True
