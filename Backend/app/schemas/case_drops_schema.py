from pydantic import BaseModel

class CaseDropBase(BaseModel):
    case_id: int
    drop_id: int
    chance: float

class CaseDropCreate(CaseDropBase):
    pass

class CaseDropOut(CaseDropBase):
    class Config:
        orm_mode = True
