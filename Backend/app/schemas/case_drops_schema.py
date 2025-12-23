from pydantic import BaseModel
from typing import Optional


class CaseDropBase(BaseModel):
    case_id: int
    drop_id: int
    chance: float

    # 🔥 порядок дропа в кейсе
    position: int = 0


class CaseDropCreate(CaseDropBase):
    pass


class CaseDropOut(CaseDropBase):
    class Config:
        orm_mode = True
