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

    # ===== DAILY =====
    daily_used = today_row.usedDaily is True

    # ===== 10 DAYS =====
    played_days = (
        db.query(UserDailyGames)
        .filter(UserDailyGames.user_id == user_id)
        .count()
    )

    ten_day_claims = (
        db.query(UserDailyGames)
        .filter(
            UserDailyGames.user_id == user_id,
            UserDailyGames.usedTenDays == True
        )
        .count()
    )

    available_ten_days = (played_days // 10) > ten_day_claims

    return {
        "daily_reward": {
            "title": "Ежедневный бонус — 0.5 TON",
            "available": not daily_used,
            "used": daily_used,
        },
        "ten_days_reward": {
            "title": "Бонус за каждые 10 дней — 1 TON",
            "available": available_ten_days,
            "used_count": ten_day_claims,
            "progress": played_days % 10,
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

    if row.usedDaily:
        raise HTTPException(400, "Daily reward already claimed")

    reward = 0.5

    balance_before = user.balance or 0
    user.balance = balance_before + reward

    row.usedDaily = True

    tx = Transactions(
        user_id=user.id,
        type="daily_reward",
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

    played_days = (
        db.query(UserDailyGames)
        .filter(UserDailyGames.user_id == user_id)
        .count()
    )

    ten_day_claims = (
        db.query(UserDailyGames)
        .filter(
            UserDailyGames.user_id == user_id,
            UserDailyGames.usedTenDays == True
        )
        .count()
    )

    if (played_days // 10) <= ten_day_claims:
        raise HTTPException(400, "10-day reward not available")

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

