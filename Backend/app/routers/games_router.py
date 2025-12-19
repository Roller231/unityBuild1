# app/routers/games_router.py

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import date

from app.database import get_db
from app.models.user_daily_games import UserDailyGames
from app.models.users import Users
from app.models import UserPromos, PromoCodes

router = APIRouter(prefix="/games", tags=["Games"])

@router.post("/play")
def register_game_play(
    user_id: int,
    db: Session = Depends(get_db),
):
    user = db.query(Users).filter(Users.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    today = date.today()

    daily = (
        db.query(UserDailyGames)
        .filter_by(user_id=user_id, day_date=today)
        .first()
    )

    if daily:
        daily.games_played += 1
    else:
        daily = UserDailyGames(
            user_id=user_id,
            day_date=today,
            games_played=1
        )
        db.add(daily)

    freespin_unlocked = False

    wager_promos = (
        db.query(UserPromos, PromoCodes)
        .join(PromoCodes, PromoCodes.id == UserPromos.promo_id)
        .filter(
            UserPromos.user_id == user_id,
            UserPromos.completed == False,
            UserPromos.remaining_wager_games > 0
        )
        .all()
    )

    for user_promo, promo in wager_promos:
        before = user_promo.remaining_wager_games
        user_promo.remaining_wager_games -= 1

        if user_promo.remaining_wager_games < 0:
            user_promo.remaining_wager_games = 0

        # 🔥 КЛЮЧЕВОЕ МЕСТО
        if (
            promo.type == "freespin"
            and before > 0
            and user_promo.remaining_wager_games == 0
            and not user_promo.completed
        ):
            freespin_unlocked = True

    db.commit()

    return {
        "status": "ok",
        "day": str(today),
        "games_played_today": daily.games_played,
        "freespin_unlocked": freespin_unlocked
    }

# app/routers/games_router.py

from datetime import date
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.user_daily_games import UserDailyGames
from app.models import UserPromos, PromoCodes

@router.get("/free-spin-status")
def get_free_spin_status(
    user_id: int,
    db: Session = Depends(get_db),
):
    today = date.today()

    # 1️⃣ freespin по промо
    promo_freespin = (
        db.query(UserPromos)
        .join(PromoCodes, PromoCodes.id == UserPromos.promo_id)
        .filter(
            UserPromos.user_id == user_id,
            UserPromos.completed == False,
            UserPromos.remaining_wager_games == 0,
            PromoCodes.type == "freespin"
        )
        .first()
    )

    if promo_freespin:
        return {
            "can_free_spin": True,
            "reason": "promo"
        }

    # 2️⃣ дневной freespin
    daily = (
        db.query(UserDailyGames)
        .filter_by(user_id=user_id, day_date=today)
        .first()
    )

    if daily and daily.games_played >= 0 and not daily.was_free_spin:
        return {
            "can_free_spin": True,
            "reason": "daily_games",
            "games_played_today": daily.games_played
        }

    return {
        "can_free_spin": False,
        "reason": "not_available",
        "games_played_today": daily.games_played if daily else 0,
        "was_free_spin": daily.was_free_spin if daily else False
    }
