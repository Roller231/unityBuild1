# app/schemas/stars.py
from pydantic import BaseModel

class StarsSuccessRequest(BaseModel):
    invoice_id: str
    payload: str
