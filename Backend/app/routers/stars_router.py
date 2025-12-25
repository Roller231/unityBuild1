import httpx
from uuid import uuid4
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime

from app.database import get_db
from app.models import UserPromos, PromoCodes
from app.models.users import Users
from app.models.deposits import Deposits
from app.models.transactions import Transactions
from bot.config import BOT_TOKEN
from app.services.rates_service import get_rates
from app.services.level_service import add_user_xp
from app.services.telegram_notify_service import notify_success_deposit

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
from app.schemas.stars import StarsSuccessRequest

@router.post("/success")
async def stars_success(
    data: StarsSuccessRequest,
    db: Session = Depends(get_db)
):
    user_id = data.user_id

    # 1️⃣ пользователь
    user = db.query(Users).filter(Users.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # 2️⃣ pending депозит
    deposit = (
        db.query(Deposits)
        .filter(
            Deposits.user_id == user_id,
            Deposits.type_deposit == "stars",
            Deposits.status == "pending"
        )
        .order_by(Deposits.created_at.desc())
        .with_for_update()
        .first()
    )

    if not deposit:
        raise HTTPException(status_code=404, detail="No pending deposit")

    if deposit.status == "success":
        return {"ok": True}

    # 3️⃣ курс
    rates = get_rates()
    stars_rate = float(rates["stars"])

    base_amount = float(deposit.amount) * stars_rate
    bonus_amount = 0.0

    # 4️⃣ активное промо пользователя
    promo_row = (
        db.query(UserPromos, PromoCodes)
        .join(PromoCodes, UserPromos.promo_id == PromoCodes.id)
        .filter(
            UserPromos.user_id == user_id,
            UserPromos.completed == 0,
            PromoCodes.active == 1
        )
        .order_by(UserPromos.id.asc())
        .with_for_update()
        .first()
    )

    if promo_row:
        user_promo, promo = promo_row

        if promo.type == "deposit_percent":
            bonus_amount = base_amount * (float(promo.value) / 100)

        elif promo.type == "deposit_fixed":
            bonus_amount = float(promo.value)

        # помечаем промо использованным
        user_promo.completed = 1
        user_promo.completed_at = datetime.utcnow()

    total_credit = base_amount + bonus_amount

    # 5️⃣ зачисление
    balance_before = user.balance or 0
    user.balance = balance_before + total_credit
    user.totalDEP = (user.totalDEP or 0) + total_credit

    # 🔥 XP ЗА УСПЕШНЫЙ STARS-ДЕПОЗИТ (+300)
    xp_result = add_user_xp(
        db=db,
        user=user,
        xp_amount=300,
        commit=False,  # ⬅️ один общий commit ниже
    )


    deposit.status = "success"
    deposit.completed_at = datetime.utcnow()

    tx = Transactions(
        user_id=user.id,
        type="deposit",
        amount=total_credit,
        balance_before=balance_before,
        balance_after=user.balance
    )

    notify_success_deposit(
        user_id=user.id,
        username=user.username,
        amount=total_credit,
        currency="STARS",
        bonus=bonus_amount,
    )

    db.add(tx)
    db.commit()

    return {
        "ok": True,
        "credited": round(total_credit, 2),
        "base": round(base_amount, 2),
        "bonus": round(bonus_amount, 2)
    }


