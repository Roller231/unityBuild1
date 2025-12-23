from pydantic import BaseModel

class StarsCreateRequest(BaseModel):
    amount: int
    user_id: int

