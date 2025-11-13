from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class TransactionBase(BaseModel):
    user_id: int
    type: str
    amount: float
    balance_before: Optional[float] = None
    balance_after: Optional[float] = None
    related_round_id: Optional[int] = None

class TransactionCreate(TransactionBase):
    pass

class TransactionUpdate(BaseModel):
    type: Optional[str] = None
    amount: Optional[float] = None
    balance_before: Optional[float] = None
    balance_after: Optional[float] = None
    related_round_id: Optional[int] = None

class TransactionOut(TransactionBase):
    id: int
    created_at: datetime

    class Config:
        orm_mode = True
