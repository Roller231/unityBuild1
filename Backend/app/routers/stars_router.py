import httpx
from uuid import uuid4
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime

from app.database import get_db
from app.models.users import Users
from app.models.deposits import Deposits
from app.models.transactions import Transactions
from bot.config import BOT_TOKEN
from app.services.rates_service import get_rates

router = APIRouter(prefix="/api/stars", tags=["Stars"])

TELEGRAM_API = f"https://api.telegram.org/bot{BOT_TOKEN}"


# -------------------------------------------------
# CREATE STARS INVOICE
# -------------------------------------------------
from app.schemas.stars import StarsCreateRequest

@router.post("/create")
async def create_stars_invoice(
    data: StarsCreateRequest,
    db: Session = Depends(get_db)
):
    amount = data.amount
    user_id = data.user_id

    if amount <= 0:
        raise HTTPException(400, "Invalid amount")

    user = db.query(Users).filter(Users.id == user_id).first()
    if not user:
        raise HTTPException(404, "User not found")

    payload = f"stars_{uuid4()}"

    async with httpx.AsyncClient(timeout=10) as client:
        resp = await client.post(
            f"{TELEGRAM_API}/createInvoiceLink",
            json={
                "title": "Пополнение баланса",
                "description": f"{amount} ⭐",
                "payload": payload,
                "currency": "XTR",
                "prices": [{"label": "Stars", "amount": amount}]
            }
        )

    data_tg = resp.json()
    if not data_tg.get("ok"):
        raise HTTPException(500, f"Telegram error: {data_tg}")

    deposit = Deposits(
        user_id=user.id,
        username=user.username,
        amount=amount,
        currency="XTR",
        type_deposit="stars",
        payload=payload,
        status="pending"
    )

    db.add(deposit)
    db.commit()

    return {"invoice_link": data_tg["result"]}



# -------------------------------------------------
# STARS PAYMENT SUCCESS
# -------------------------------------------------
@router.post("/success")
async def stars_success(
    invoice_id: str,
    payload: str,
    db: Session = Depends(get_db)
):
    deposit = db.query(Deposits).filter(
        Deposits.payload == payload
    ).first()

    if not deposit:
        raise HTTPException(404, "Deposit not found")

    if deposit.status == "success":
        return {"ok": True}  # idempotent

    user = db.query(Users).filter(Users.id == deposit.user_id).first()
    if not user:
        raise HTTPException(404, "User not found")

    rates = get_rates()
    stars_rate = rates["stars"]  # rate_stars_usd

    credited_amount = float(deposit.amount) * float(stars_rate)

    balance_before = user.balance
    user.balance += credited_amount

    deposit.status = "success"
    deposit.invoice_id = invoice_id
    deposit.completed_at = datetime.utcnow()

    tx = Transactions(
        user_id=user.id,
        type="deposit_stars",
        amount=credited_amount,
        balance_before=balance_before,
        balance_after=user.balance
    )

    db.add(tx)
    db.commit()

    return {"ok": True}
