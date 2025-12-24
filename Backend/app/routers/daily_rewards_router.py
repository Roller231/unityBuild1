from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import date

from app.database import get_db
from app.models.users import Users
from app.models.user_daily_games import UserDailyGames
from app.models.transactions import Transactions

router = APIRouter(prefix="/api/daily-rewards", tags=["Daily Rewards"])


# =====================================================
# STATUS
# =====================================================
@router.get("/status/{user_id}")
def get_rewards_status(user_id: int, db: Session = Depends(get_db)):
    user = db.query(Users).filter(Users.id == user_id).first()
    if not user:
        raise HTTPException(404, "User not found")

    today = date.today()

    # гарантируем строку на сегодня
    today_row = (
        db.query(UserDailyGames)
        .filter(
            UserDailyGames.user_id == user_id,
            UserDailyGames.day_date == today
        )
        .first()
    )

    if not today_row:
        today_row = UserDailyGames(user_id=user_id, day_date=today)
        db.add(today_row)
        db.commit()

    # ===== БОНУС ЗА 1-Й ВХОД (1 раз за всё время) =====
    first_used_ever = (
        db.query(UserDailyGames)
        .filter(
            UserDailyGames.user_id == user_id,
            UserDailyGames.usedFirst == True
        )
        .first()
        is not None
    )

    # ===== БОНУС ЗА 10 ДНЕЙ =====
    played_days = (
        db.query(UserDailyGames)
        .filter(
            UserDailyGames.user_id == user_id
        )
        .count()
    )

    ten_days_used = (
        db.query(UserDailyGames)
        .filter(
            UserDailyGames.user_id == user_id,
            UserDailyGames.usedTenDays == True
        )
        .first()
        is not None
    )

    return {
        "first_reward": {
            "title": "Бонус за 1й вход — 0.5 TON",
            "available": not first_used_ever,
            "used": first_used_ever,
        },
        "ten_days_reward": {
            "title": "Бонус за 10й вход — 1 TON",
            "available": played_days >= 10 and not ten_days_used,
            "used": ten_days_used,
            "progress": min(played_days, 10),
        }
    }


# =====================================================
# CLAIM FIRST LOGIN REWARD (1 TIME EVER)
# =====================================================
@router.post("/claim/first")
def claim_first_reward(user_id: int, db: Session = Depends(get_db)):
    user = db.query(Users).filter(Users.id == user_id).first()
    if not user:
        raise HTTPException(404, "User not found")

    # 🔒 уже получал когда-либо?
    already_used = (
        db.query(UserDailyGames)
        .filter(
            UserDailyGames.user_id == user_id,
            UserDailyGames.usedFirst == True
        )
        .first()
    )

    if already_used:
        raise HTTPException(400, "First reward already claimed")

    today = date.today()

    row = (
        db.query(UserDailyGames)
        .filter(
            UserDailyGames.user_id == user_id,
            UserDailyGames.day_date == today
        )
        .with_for_update()
        .first()
    )

    if not row:
        row = UserDailyGames(user_id=user_id, day_date=today)
        db.add(row)

    reward = 0.5

    balance_before = user.balance or 0
    user.balance = balance_before + reward

    row.usedFirst = True

    tx = Transactions(
        user_id=user.id,
        type="daily_reward_first",
        amount=reward,
        balance_before=balance_before,
        balance_after=user.balance
    )

    db.add(tx)
    db.commit()

    return {"ok": True, "reward": reward}


# =====================================================
# CLAIM 10 DAYS REWARD
# =====================================================
@router.post("/claim/ten-days")
def claim_ten_days_reward(user_id: int, db: Session = Depends(get_db)):
    user = db.query(Users).filter(Users.id == user_id).first()
    if not user:
        raise HTTPException(404, "User not found")

    # 🔒 уже получал 10-дневный бонус?
    already_used = (
        db.query(UserDailyGames)
        .filter(
            UserDailyGames.user_id == user_id,
            UserDailyGames.usedTenDays == True
        )
        .first()
    )

    if already_used:
        raise HTTPException(400, "10-day reward already claimed")

    # считаем дни, когда играл
    played_days = (
        db.query(UserDailyGames)
        .filter(
            UserDailyGames.user_id == user_id
        )
        .count()
    )

    if played_days < 10:
        raise HTTPException(400, "Not enough played days")

    today = date.today()

    row = (
        db.query(UserDailyGames)
        .filter(
            UserDailyGames.user_id == user_id,
            UserDailyGames.day_date == today
        )
        .with_for_update()
        .first()
    )

    if not row:
        row = UserDailyGames(user_id=user_id, day_date=today)
        db.add(row)

    reward = 1.0

    balance_before = user.balance or 0
    user.balance = balance_before + reward

    row.usedTenDays = True

    tx = Transactions(
        user_id=user.id,
        type="daily_reward_10_days",
        amount=reward,
        balance_before=balance_before,
        balance_after=user.balance
    )

    db.add(tx)
    db.commit()

    return {"ok": True, "reward": reward}
