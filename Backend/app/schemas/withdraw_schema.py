from pydantic import BaseModel, Field
from typing import Optional
from decimal import Decimal


class WithdrawCreate(BaseModel):
    user_id: int

    type: str = Field(..., pattern="^(ton|drop)$")

    ton_amount: Optional[Decimal] = None
    drop_id: Optional[int] = None


from datetime import datetime

class WithdrawOut(BaseModel):
    id: int
    user_id: int
    tg_id: str
    username: Optional[str]
    type: str
    ton_amount: Optional[Decimal]
    drop_id: Optional[int]
    status: str
    created_at: datetime   # 👈 ВОТ ТУТ

    class Config:
        orm_mode = True

