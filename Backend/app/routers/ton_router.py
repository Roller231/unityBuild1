from uuid import uuid4
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime

from app.database import get_db
from app.models import Transactions, UserPromos, PromoCodes
from app.models.users import Users
from app.models.deposits import Deposits
from app.schemas.ton import TonCreateRequest, TonSuccessRequest

router = APIRouter(prefix="/api/ton", tags=["TON"])


@router.post("/create")
async def ton_create(
    data: TonCreateRequest,
    db: Session = Depends(get_db)
):
    user_id = data.user_id
    amount = float(data.amount)

    if amount <= 0:
        raise HTTPException(status_code=400, detail="Invalid amount")

    user = db.query(Users).filter(Users.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    payload = f"ton_{uuid4()}"

    deposit = Deposits(
        user_id=user.id,
        username=user.username,
        amount=amount,
        currency="TON",
        type_deposit="ton",
        payload=payload,          # intent-id
        status="pending"
    )

    db.add(deposit)
    db.commit()

    return {
        "ok": True,
        "deposit_id": deposit.id,
        "payload": payload
    }


@router.post("/success")
async def ton_success(
    data: TonSuccessRequest,
    db: Session = Depends(get_db)
):
    user_id = data.user_id
    amount = float(data.amount)
    tx_hash = data.tx_hash
    payload = data.payload  # <-- intent-id от /create

    if amount <= 0:
        raise HTTPException(status_code=400, detail="Invalid amount")

    # 1) пользователь
    user = db.query(Users).filter(Users.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # 2) защита от повторного tx_hash (если уже был зачислен)
    already_paid = (
        db.query(Deposits)
        .filter(
            Deposits.type_deposit == "ton",
            Deposits.payload == tx_hash,
            Deposits.status == "success"
        )
        .first()
    )
    if already_paid:
        return {"ok": True}

    # 3) находим pending депозит по payload (intent)
    deposit = (
        db.query(Deposits)
        .filter(
            Deposits.user_id == user_id,
            Deposits.type_deposit == "ton",
            Deposits.payload == payload,
            Deposits.status == "pending"
        )
        .with_for_update()
        .first()
    )

    if not deposit:
        raise HTTPException(status_code=404, detail="No pending ton deposit for this payload")

    # (опционально) сверяем сумму с create, чтобы нельзя было подменить amount
    # можно разрешить ">= депозит.amount" если хочешь доплатой
    if float(deposit.amount) != amount:
        raise HTTPException(status_code=400, detail="Amount mismatch")

    # 4) промо
    base_amount = amount
    bonus_amount = 0.0

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
            bonus_amount = float(promo.value)  # фикс бонус уже в TON

        user_promo.completed = 1
        user_promo.completed_at = datetime.utcnow()

    total_credit = base_amount + bonus_amount

    # 5) зачисление
    balance_before = user.balance or 0
    user.balance = balance_before + total_credit
    user.totalDEP = (user.totalDEP or 0) + total_credit

    # 6) закрываем депозит (и сохраняем tx_hash в payload, без новых полей)
    deposit.status = "success"
    deposit.completed_at = datetime.utcnow()
    deposit.payload = tx_hash  # <-- сохраняем факт транзакции

    tx = Transactions(
        user_id=user.id,
        type="deposit",
        amount=total_credit,
        balance_before=balance_before,
        balance_after=user.balance,

    )

    db.add(tx)
    db.commit()

    return {
        "ok": True,
        "credited": round(total_credit, 4),
        "base": round(base_amount, 4),
        "bonus": round(bonus_amount, 4)
    }
