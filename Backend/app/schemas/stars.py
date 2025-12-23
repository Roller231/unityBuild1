from typing import Optional

from pydantic import BaseModel

class StarsCreateRequest(BaseModel):
    amount: int
    user_id: int

class StarsSuccessRequest(BaseModel):
    invoice_id: str
    payload: Optional[str] = None