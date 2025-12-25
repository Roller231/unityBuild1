from sqlalchemy.orm import Session
from app.models.users import Users

# 🔢 базовые настройки уровней
BASE_XP = 1000      # сколько нужно для 1 → 2
XP_STEP = 200       # +200 к каждому следующему уровню


def xp_for_next_level(level: int) -> int:
    """
    Сколько XP нужно для апа на следующий уровень
    """
    return BASE_XP + (level - 1) * XP_STEP


def add_user_xp(
    *,
    db: Session,
    user: Users,
    xp_amount: int,
    commit: bool = True,
) -> dict:
    """
    Добавляет XP пользователю и повышает уровень при необходимости.

    Можно безопасно вызывать:
    - из /games/play
    - из crash
    - из депозитов
    - из pvp
    - где угодно

    Возвращает dict для фронта / логики:
    {
        leveled_up: bool,
        levels_gained: int,
        old_level: int,
        new_level: int,
        current_xp: int,
        next_level_xp: int
    }
    """

    # ❌ защита от мусора
    if xp_amount <= 0:
        return {
            "leveled_up": False,
            "levels_gained": 0,
            "old_level": user.level,
            "new_level": user.level,
            "current_xp": user.xp,
            "next_level_xp": xp_for_next_level(user.level),
        }

    old_level = user.level
    user.xp += xp_amount

    levels_gained = 0

    # 🔁 поддержка мульти-апа
    while True:
        need_xp = xp_for_next_level(user.level)

        if user.xp >= need_xp:
            user.xp -= need_xp
            user.level += 1
            levels_gained += 1
        else:
            break

    if commit:
        db.add(user)
        db.commit()
        db.refresh(user)

    return {
        "leveled_up": levels_gained > 0,
        "levels_gained": levels_gained,
        "old_level": old_level,
        "new_level": user.level,
        "current_xp": user.xp,
        "next_level_xp": xp_for_next_level(user.level),
    }


def set_user_level(
    *,
    db: Session,
    user: Users,
    level: int,
    xp: int = 0,
) -> None:
    """
    ⚠️ Админ-функция.
    Принудительно выставляет уровень и XP.
    НЕ ИСПОЛЬЗОВАТЬ В ИГРАХ.
    """

    if level < 1:
        level = 1
    if xp < 0:
        xp = 0

    user.level = level
    user.xp = xp

    db.add(user)
    db.commit()
    db.refresh(user)
