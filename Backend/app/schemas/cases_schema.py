from pydantic import BaseModel
from typing import Optional, List, Any

class CaseBase(BaseModel):
    name: str
    price: float
    gradient_colors: Optional[Any] = None
    main_image: Optional[str] = None

class CaseCreate(CaseBase):
    pass

class CaseUpdate(BaseModel):
    name: Optional[str] = None
    price: Optional[float] = None
    gradient_colors: Optional[Any] = None
    main_image: Optional[str] = None

class CaseOut(CaseBase):
    id: int

    class Config:
        orm_mode = True
