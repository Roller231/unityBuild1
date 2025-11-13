from pydantic import BaseModel
from typing import Optional

class DropBase(BaseModel):
    name: str
    rarity: str
    price: float
    icon: Optional[str] = None

class DropCreate(DropBase):
    pass

class DropUpdate(BaseModel):
    name: Optional[str] = None
    rarity: Optional[str] = None
    price: Optional[float] = None
    icon: Optional[str] = None

class DropOut(DropBase):
    id: int

    class Config:
        orm_mode = True
