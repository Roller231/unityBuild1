# app/services/promo_service.py

from sqlalchemy.orm import Session

from app.models import Users
from app.models.promo_codes import PromoCodes
from app.models.user_promos import UserPromos
from app.models.referral_promos import ReferralPromos


def get_active_user_promo(db: Session, user_id: int):
    return (
        db.query(UserPromos)
        .filter(
            UserPromos.user_id == user_id,
            UserPromos.completed == False
        )
        .first()
    )

def get_active_global_promo(db: Session, user_id: int):
    """
    Активный ГЛОБАЛЬНЫЙ промо:
    - completed = False
    - promo_id IS NOT NULL
    """
    return (
        db.query(UserPromos)
        .filter(
            UserPromos.user_id == user_id,
            UserPromos.completed == False,
            UserPromos.promo_id.isnot(None)
        )
        .first()
    )

def activate_promo(db, user, code: str):
    code = code.upper().strip()

    # =================================================
    # 1️⃣ РЕФЕРАЛЬНЫЙ ПРОМО (РАЗРЕШЁН ВСЕГДА)
    # =================================================
    ref = (
        db.query(ReferralPromos)
        .filter_by(code=code, active=True)
        .first()
    )

    if ref:
        # нельзя самому себе
        if ref.owner_user_id == user.id:
            raise ValueError("You cannot use your own referral code")

        # нельзя использовать реф больше 1 раза
        used_ref = (
            db.query(UserPromos)
            .filter(
                UserPromos.user_id == user.id,
                UserPromos.referral_owner_id.isnot(None)
            )
            .first()
        )
        if used_ref:
            raise ValueError("Referral promo already used")



        # начисляем награду
        user.balance += ref.reward

        owner = db.query(Users).filter_by(id=ref.owner_user_id).first()
        if owner:
            owner.balance += ref.reward
            owner.refcount += 1

        # фиксируем использование рефа
        db.add(UserPromos(
            user_id=user.id,
            promo_id=None,
            referral_owner_id=ref.owner_user_id,
            completed=True
        ))

        db.commit()

        return {
            "type": "referral",
            "reward": ref.reward
        }

    # =================================================
    # 2️⃣ ГЛОБАЛЬНЫЙ ПРОМО (ТОЛЬКО ЕСЛИ НЕТ АКТИВНОГО)
    # =================================================
    if get_active_global_promo(db, user.id):
        raise ValueError("Finish your current promo first")

    promo = (
        db.query(PromoCodes)
        .filter_by(code=code, active=True)
        .first()
    )

    if not promo:
        raise ValueError("Invalid promo")

    used_before = (
        db.query(UserPromos)
        .filter(
            UserPromos.user_id == user.id,
            UserPromos.promo_id == promo.id
        )
        .first()
    )
    if used_before:
        raise ValueError("You have already used this promo code")
    user_promo = UserPromos(
        user_id=user.id,
        promo_id=promo.id,
        completed=False,
        remaining_wager_games=promo.wager_games or 0,
        remaining_freespins=promo.value if promo.type == "freespin" else 0
    )

    db.add(user_promo)
    promo.used_count = (promo.used_count or 0) + 1
    db.commit()

    return {
        "type": promo.type,
        "value": promo.value
    }

