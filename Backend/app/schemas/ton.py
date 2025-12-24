from pydantic import BaseModel

class TonCreateRequest(BaseModel):
    user_id: int
    amount: float


class TonSuccessRequest(BaseModel):
    user_id: int
