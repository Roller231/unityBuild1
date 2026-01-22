# app/routers/roulette_router.py

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import date

from app.database import get_db
from app.models import Users, UserPromos, PromoCodes, Drops
from app.models.user_daily_games import UserDailyGames
from app.models.roulette_spins import RouletteSpins
from app.services.roulette_drop_service import choose_free_spin_drop, choose_paid_spin_drop
from app.services.inventory_service import add_drop_to_inventory
from app.schemas.roulette import RoulettePaidSpinRequest

router = APIRouter(prefix="/roulette", tags=["Roulette"])

@router.post("/spin/free")
def free_spin(
    user_id: int,
    db: Session = Depends(get_db),
):
    today = date.today()

    user = db.query(Users).filter_by(id=user_id).with_for_update().first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # 1️⃣ проверка freespin по промо
    promo = (
        db.query(UserPromos)
        .join(PromoCodes, PromoCodes.id == UserPromos.promo_id)
        .filter(
            UserPromos.user_id == user_id,
            UserPromos.completed == False,
            UserPromos.remaining_wager_games == 0,
            PromoCodes.type == "freespin"
        )
        .with_for_update()
        .first()
    )

    used_reason = None

    if promo:
        used_reason = "promo"
    else:
        daily = (
            db.query(UserDailyGames)
            .filter_by(user_id=user_id, day_date=today)
            .with_for_update()
            .first()
        )

        if not daily or daily.games_played < 0 or daily.was_free_spin:
            raise HTTPException(status_code=400, detail="Free spin not available")

        used_reason = "daily"

    # 2️⃣ выбираем дроп
    drop = choose_free_spin_drop(db)

    # 3️⃣ добавляем в инвентарь
    add_drop_to_inventory(user, drop.id, 1)

    # 4️⃣ логируем спин
    spin = RouletteSpins(
        user_id=user_id,
        drop_id=drop.id,
        is_free=True
    )
    db.add(spin)

    # 5️⃣ закрываем источник freespin
    if used_reason == "promo":
        promo.completed = True
    else:
        daily.was_free_spin = True

    db.commit()

    return {
        "status": "ok",
        "drop_id": drop.id
    }

@router.post("/spin/paid")
def paid_spin(
    payload: RoulettePaidSpinRequest,
    db: Session = Depends(get_db),
):
    user_id = payload.user_id
    amount = payload.amount
    gift_id = payload.gift_id

    if not amount and not gift_id:
        raise HTTPException(status_code=400, detail="amount or gift_id required")

    user = db.query(Users).filter_by(id=user_id).with_for_update().first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    bet_price: float

    # 🎁 СТАВКА ПОДАРКОМ
    if gift_id:
        gift_item = None
        for item in user.inventory or []:
            if int(item.get("drop_id")) == gift_id and item.get("count", 0) > 0:
                gift_item = item
                break

        if not gift_item:
            raise HTTPException(status_code=400, detail="Gift not in inventory")

        drop = db.query(Drops).filter_by(id=gift_id).first()
        if not drop:
            raise HTTPException(status_code=404, detail="Gift not found")

        bet_price = drop.price

        from sqlalchemy.ext.mutable import MutableDict, MutableList
        inventory = MutableList(user.inventory)
        idx = inventory.index(gift_item)
        mutable_item = MutableDict(gift_item)
        mutable_item["count"] -= 1

        if mutable_item["count"] <= 0:
            inventory.pop(idx)
        else:
            inventory[idx] = mutable_item

        user.inventory = inventory

    # 💰 СТАВКА ДЕНЬГАМИ
    else:
        if amount <= 0:
            raise HTTPException(status_code=400, detail="Bad amount")

        if user.balance < amount:
            raise HTTPException(status_code=400, detail="Not enough balance")

        bet_price = amount
        user.balance -= amount

    # 🎰 ПРИЗ
    prize = choose_paid_spin_drop(db, bet_price)

    add_drop_to_inventory(user, prize.id, 1)

    spin = RouletteSpins(
        user_id=user_id,
        drop_id=prize.id,
        is_free=False
    )
    db.add(spin)

    if amount:
        from app.models import Transactions
        tx = Transactions(
            user_id=user_id,
            type="roulette_spin",
            amount=amount,
            balance_before=user.balance + amount,
            balance_after=user.balance,
            related_round_id=None
        )
        db.add(tx)

    db.commit()

    return {
        "status": "ok",
        "bet_price": bet_price,
        "drop_id": prize.id,
        "drop_price": prize.price
    }

