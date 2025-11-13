from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class CrashBetBase(BaseModel):
    round_id: int
    user_id: int
    amount: float
    cashout_multiplier: Optional[float] = None
    profit: Optional[float] = None

class CrashBetCreate(CrashBetBase):
    pass

class CrashBetUpdate(BaseModel):
    amount: Optional[float] = None
    cashout_multiplier: Optional[float] = None
    profit: Optional[float] = None

class CrashBetOut(CrashBetBase):
    id: int
    created_at: datetime

    class Config:
        orm_mode = True
