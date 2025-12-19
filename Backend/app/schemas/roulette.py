from pydantic import BaseModel
from typing import Optional

class RoulettePaidSpinRequest(BaseModel):
    user_id: int
    amount: Optional[float] = None
    gift_id: Optional[int] = None
