import random
from sqlalchemy.orm import Session
from fastapi import HTTPException
from app.models import Drops, Users
from app.models.upgrade import UpgradeLog
from app.services.inventory_service import (
    add_drop_to_inventory,
    remove_drop_from_inventory,
)
from app.core.config import settings
from app.models.transactions import Transactions
from datetime import datetime

def calc_upgrade_chance(from_price: float, to_price: float) -> float:
    """
    Upgrade logic:
    - target дешевле или равен → 95%
    - target дороже → стандартная формула
    """

    # 🔥 DOWN / EQUAL upgrade
    if to_price <= from_price:
        return settings.upgrade_down_chance

    # 📈 UP upgrade
    ratio = to_price / from_price
    chance = settings.upgrade_base_chance * (ratio ** -settings.upgrade_decay_factor)

    return max(
        settings.upgrade_min_chance,
        min(settings.upgrade_max_chance, chance)
    )








def upgrade_service(
    db: Session,
    user_id: int,
    from_drop_id: int,
    to_drop_id: int,
):
    # 1️⃣ пользователь
    user = db.query(Users).get(user_id)
    if not user:
        raise HTTPException(404, "User not found")

    # 2️⃣ дропы
    from_drop = db.query(Drops).get(from_drop_id)
    to_drop = db.query(Drops).get(to_drop_id)

    if not from_drop or not to_drop:
        raise HTTPException(404, "Drop not found")

    # 3️⃣ списываем предмет (СТАВКА)
    removed = remove_drop_from_inventory(user, from_drop_id, count=1)
    if not removed:
        raise HTTPException(400, "Drop not in inventory")

    # 🧾 TRANSACTION: upgrade_bet
    tx_bet = Transactions(
        user_id=user_id,
        type="upgrade_bet",
        amount=float(from_drop.price),
        balance_before=user.balance,
        balance_after=user.balance,  # баланс не меняется
        created_at=datetime.utcnow()
    )
    db.add(tx_bet)

    # 4️⃣ шанс + ролл
    chance = calc_upgrade_chance(from_drop.price, to_drop.price)
    roll = random.random()
    win = roll <= chance

    # 5️⃣ награда
    if win:
        add_drop_to_inventory(user, to_drop_id, count=1)



    # 6️⃣ лог апгрейда
    upgrade_log = UpgradeLog(
        user_id=user_id,
        from_drop_id=from_drop_id,
        to_drop_id=to_drop_id,
        chance=chance,
        roll=roll,
        result="win" if win else "lose",
    )

    db.add(upgrade_log)
    db.commit()
    db.refresh(user)

    return {
        "result": "win" if win else "lose",
        "chance": round(chance, 4),
        "roll": round(roll, 4),
        "user_id": user_id,
        "from_drop_id": from_drop_id,
        "to_drop_id": to_drop_id,
        "inventory": user.inventory,
    }

