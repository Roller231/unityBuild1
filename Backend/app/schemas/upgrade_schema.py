from pydantic import BaseModel


class UpgradeRequest(BaseModel):
    user_id: int
    from_drop_id: int
    to_drop_id: int


class UpgradeResponse(BaseModel):
    result: str           # "win" | "lose"
    chance: float
    user_id: int
    from_drop_id: int
    to_drop_id: int
