import random
from sqlalchemy.orm import Session
from fastapi import HTTPException
from app.models import Drops, Users
from app.models.upgrade import UpgradeLog
from app.services.inventory_service import (
    add_drop_to_inventory,
    remove_drop_from_inventory,
)

# 🔧 НАСТРОЙКИ БАЛАНСА
RATIO_BORDER = 1.5
LOW_CHANCE = 0.8   # < 1.5x
HIGH_CHANCE = 0.05  # >= 1.5x


def calc_upgrade_chance(from_price: float, to_price: float) -> float:
    ratio = to_price / from_price
    return HIGH_CHANCE if ratio >= RATIO_BORDER else LOW_CHANCE





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

    if to_drop.price <= from_drop.price:
        raise HTTPException(400, "Target drop must be more expensive")

    # 3️⃣ ПЫТАЕМСЯ СНЯТЬ ПРЕДМЕТ ИЗ ИНВЕНТАРЯ
    removed = remove_drop_from_inventory(user, from_drop_id, count=1)
    if not removed:
        raise HTTPException(400, "Drop not in inventory")

    # 4️⃣ шанс + ролл
    chance = calc_upgrade_chance(from_drop.price, to_drop.price)
    roll = random.random()
    win = roll <= chance

    # 5️⃣ если выиграл — добавляем новый предмет
    if win:
        add_drop_to_inventory(user, to_drop_id, count=1)

    upgrade_log = UpgradeLog(
        user_id=user_id,
        from_drop_id=from_drop_id,
        to_drop_id=to_drop_id,
        chance=chance,
        roll=roll,
        result='win' if win else 'lose'
    )

    db.add(upgrade_log)

    # 6️⃣ сохраняем изменения
    db.commit()
    db.refresh(user)



    return {
        "result": "win" if win else "lose",
        "chance": chance,
        "roll": round(roll, 4),  # полезно для отладки
        "user_id": user_id,
        "from_drop_id": from_drop_id,
        "to_drop_id": to_drop_id,
        "inventory": user.inventory,
    }
