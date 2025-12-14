from fastapi import APIRouter
from app.services.rates_service import get_rates

router = APIRouter(prefix="/rates", tags=["Rates"])


@router.get("/")
def read_rates():
    return get_rates()
