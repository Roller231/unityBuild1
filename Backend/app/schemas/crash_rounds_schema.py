from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class CrashRoundBase(BaseModel):
    round_number: Optional[int] = None
    crash_point: Optional[float] = None
    started_at: Optional[datetime] = None
    ended_at: Optional[datetime] = None
    total_bet: Optional[float] = None
    total_payout: Optional[float] = None

class CrashRoundCreate(CrashRoundBase):
    pass

class CrashRoundUpdate(CrashRoundBase):
    pass

class CrashRoundOut(CrashRoundBase):
    id: int

    class Config:
        orm_mode = True
