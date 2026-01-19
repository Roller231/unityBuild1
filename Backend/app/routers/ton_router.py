from uuid import uuid4
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime
from app.services.level_service import add_user_xp
from app.database import get_db
from app.models import Transactions, UserPromos, PromoCodes
from app.models.users import Users
from app.models.deposits import Deposits
from app.schemas.ton import TonCreateRequest, TonSuccessRequest
from app.services.telegram_notify_service import notify_success_deposit

router = APIRouter(prefix="/api/ton", tags=["TON"])


@router.post("/create")
async def ton_create(
    data: TonCreateRequest,
    db: Session = Depends(get_db)
):
    user = db.query(Users).filter(Users.id == data.user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    if data.amount <= 0:
        raise HTTPException(status_code=400, detail="Invalid amount")

    deposit = Deposits(
        user_id=user.id,
        username=user.username,
        amount=float(data.amount),
        currency="TON",
        type_deposit="ton",
        status="pending"
    )

    db.add(deposit)
    db.commit()

    return {"ok": True}



@router.post("/success")
async def ton_success(
    data: TonSuccessRequest,
    db: Session = Depends(get_db)
):
    user = db.query(Users).filter(Users.id == data.user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # 🧾 берём последний pending TON депозит
    deposit = (
        db.query(Deposits)
        .filter(
            Deposits.user_id == user.id,
            Deposits.type_deposit == "ton",
            Deposits.status == "pending"
        )
        .order_by(Deposits.id.desc())
        .first()
    )

    if not deposit:
        raise HTTPException(status_code=404, detail="No pending TON deposits")

    base_amount = float(deposit.amount)
    bonus_amount = 0.0

    # 🎁 промо
    promo_row = (
        db.query(UserPromos, PromoCodes)
        .join(PromoCodes, UserPromos.promo_id == PromoCodes.id)
        .filter(
            UserPromos.user_id == user.id,
            UserPromos.completed == 0,
            PromoCodes.active == 1
        )
        .order_by(UserPromos.id.asc())
        .first()
    )

    if promo_row:
        user_promo, promo = promo_row

        if promo.type == "deposit_percent":
            bonus_amount = base_amount * (float(promo.value) / 100)
        elif promo.type == "deposit_fixed":
            bonus_amount = float(promo.value)

        user_promo.completed = 1
        user_promo.completed_at = datetime.utcnow()

    total_credit = base_amount + bonus_amount

    # 💰 баланс
    balance_before = user.balance or 0
    user.balance = balance_before + total_credit
    user.totalDEP = (user.totalDEP or 0) + total_credit

    # -------------------------------------------------
    # 🎁 РЕФЕРАЛЬНЫЙ БОНУС (15% от TON депозита)
    # -------------------------------------------------
    if (
            user.refererID
            and user.refererID != "local"
            and str(user.refererID) != str(user.tg_id)
    ):
        referrer = (
            db.query(Users)
            .filter(Users.tg_id == user.refererID)
            .with_for_update()
            .first()
        )

        if referrer:
            referral_bonus = round(
                base_amount * 15 / 100,
                2  # для TON логично 4 знака
            )

            ref_balance_before = referrer.balance or 0
            referrer.balance = ref_balance_before + referral_bonus

            ref_tx = Transactions(
                user_id=referrer.id,
                type="referral_bonus",
                amount=referral_bonus,
                balance_before=ref_balance_before,
                balance_after=referrer.balance,

            )

            db.add(ref_tx)

    # 🔥 XP ЗА УСПЕШНЫЙ TON-ДЕПОЗИТ (+300)
    xp_result = add_user_xp(
        db=db,
        user=user,
        xp_amount=300,
        commit=False,  # ⬅️ один общий commit ниже
    )


    # ✅ закрываем депозит
    deposit.status = "success"
    deposit.completed_at = datetime.utcnow()

    tx = Transactions(
        user_id=user.id,
        type="deposit",
        amount=total_credit,
        balance_before=balance_before,
        balance_after=user.balance
    )

    db.add(tx)
    db.commit()


    # 🔔 уведомление админам о TON-депозите
    notify_success_deposit(
        user_id=user.id,
        username=user.username,
        amount=total_credit,
        currency="TON",
        bonus=bonus_amount,
    )


    return {
        "ok": True,
        "credited": round(total_credit, 4),
        "base": round(base_amount, 4),
        "bonus": round(bonus_amount, 4)
    }

