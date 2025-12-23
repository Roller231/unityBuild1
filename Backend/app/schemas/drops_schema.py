from pydantic import BaseModel
from typing import Optional


class DropBase(BaseModel):
    name: str
    rarity: str
    price: float
    icon: Optional[str] = None
    lottie_anim: Optional[str] = None

    # 🔥 новые чекбоксы
    UseInUpgrade: bool = False
    UseInLive: bool = False
    IsNft: bool = False


class DropCreate(DropBase):
    pass


class DropUpdate(BaseModel):
    name: Optional[str] = None
    rarity: Optional[str] = None
    price: Optional[float] = None
    icon: Optional[str] = None
    lottie_anim: Optional[str] = None

    # 🔥 обновляемые чекбоксы
    UseInUpgrade: Optional[bool] = None
    UseInLive: Optional[bool] = None
    IsNft: Optional[bool] = None


class DropOut(DropBase):
    id: int

    class Config:
        orm_mode = True
