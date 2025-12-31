from pydantic import BaseModel
from typing import Optional, Any

class CaseBase(BaseModel):
    name: str
    price: float
    position: int = 0           # 👈 НОВОЕ ПОЛЕ
    gradient_colors: Optional[Any] = None
    main_image: Optional[str] = None
    lottie_anim: Optional[str] = None


class CaseCreate(CaseBase):
    pass


class CaseUpdate(BaseModel):
    name: Optional[str] = None
    price: Optional[float] = None
    position: Optional[int] = None   # 👈 НОВОЕ ПОЛЕ
    gradient_colors: Optional[Any] = None
    main_image: Optional[str] = None
    lottie_anim: Optional[str] = None


class CaseOut(CaseBase):
    id: int

    class Config:
        orm_mode = True
