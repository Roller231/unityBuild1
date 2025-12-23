from typing import Optional

from pydantic import BaseModel

class StarsCreateRequest(BaseModel):
    amount: int
    user_id: int

class StarsSuccessRequest(BaseModel):
    user_id: int
