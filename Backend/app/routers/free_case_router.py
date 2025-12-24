# app/routers/free_case_router.py

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import date, datetime, time

from app.database import get_db
from app.models import Users, UserPromos, PromoCodes, Transactions, UserDailyGames

router = APIRouter(prefix="/api/cases/free", tags=["Free Cases"])


@router.post("/check")
def check_free_case_access(
    user_id: int,
    db: Session = Depends(get_db),
):
    user = db.query(Users).filter_by(id=user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    today = date.today()
    today_start = datetime.combine(today, time.min)
    today_end = datetime.combine(today, time.max)

    # ===============================
    # 1️⃣ ПРОВЕРКА: УЖЕ ИСПОЛЬЗОВАН FREE CASE
    # ===============================
    daily = (
        db.query(UserDailyGames)
        .filter_by(user_id=user_id, day_date=today)
        .first()
    )

    if daily and daily.was_free_case:
        return {
            "allowed": False,
            "reason": "already_used"
        }

    # ===============================
    # 2️⃣ ПРОВЕРКА АКТИВНОГО PROMO
    # ===============================
    promo = (
        db.query(UserPromos)
        .join(PromoCodes, PromoCodes.id == UserPromos.promo_id)
        .filter(
            UserPromos.user_id == user_id,
            UserPromos.completed == False,
            PromoCodes.type == "freecase"
        )
        .order_by(UserPromos.activated_at.desc())
        .first()
    )

    if promo:
        return {
            "allowed": True,
            "reason": "promo"
        }

    # ===============================
    # 3️⃣ СУММА ДЕПОЗИТОВ ЗА СЕГОДНЯ
    # ===============================
    today_deposit_sum = (
        db.query(func.coalesce(func.sum(Transactions.amount), 0))
        .filter(
            Transactions.user_id == user_id,
            Transactions.type.in_(["deposit", "deposit_stars"]),
            Transactions.created_at >= today_start,
            Transactions.created_at <= today_end
        )
        .scalar()
    )

    if today_deposit_sum >= 3:
        return {
            "allowed": True,
            "reason": "deposit",
            "today_deposit": float(today_deposit_sum)
        }

    # ===============================
    # 4️⃣ ДОСТУП ЗАПРЕЩЁН
    # ===============================
    return {
        "allowed": False,
        "reason": None,
        "today_deposit": float(today_deposit_sum)
    }



@router.post("/consume")
def consume_free_case(
    user_id: int,
    db: Session = Depends(get_db),
):
    today = date.today()

    # 1️⃣ проверяем пользователя
    user = db.query(Users).filter_by(id=user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # 2️⃣ получаем или создаём daily-запись
    daily = (
        db.query(UserDailyGames)
        .filter_by(user_id=user_id, day_date=today)
        .with_for_update()
        .first()
    )

    if not daily:
        daily = UserDailyGames(
            user_id=user_id,
            day_date=today,
            games_played=0,
            was_free_spin=False,
            was_free_case=True,
        )
        db.add(daily)
    else:
        # 3️⃣ защита от повторного использования
        if daily.was_free_case:
            return {
                "ok": True,
                "already_used": True
            }

        daily.was_free_case = True

    freecase_promo = (
        db.query(UserPromos)
        .join(PromoCodes, PromoCodes.id == UserPromos.promo_id)
        .filter(
            UserPromos.user_id == user_id,
            UserPromos.completed == False,
            PromoCodes.type == "freecase"
        )
        .order_by(UserPromos.activated_at.desc())
        .first()
    )

    if freecase_promo:
        freecase_promo.completed = True

    db.commit()
    return {
        "ok": True,
        "used": True
    }