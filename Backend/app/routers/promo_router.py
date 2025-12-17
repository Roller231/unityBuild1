# app/routers/promo_router.py

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import ReferralPromos, UserPromos
from app.models.users import Users
from app.services.promo_service import activate_promo
from app.core.config import settings
router = APIRouter(prefix="/promo", tags=["Promo"])

@router.get("/referral/my")
def get_my_referral_promo(
    user_id: int,
    db: Session = Depends(get_db),
):
    promo = (
        db.query(ReferralPromos)
        .filter_by(owner_user_id=user_id, active=True)
        .first()
    )

    if not promo:
        return {
            "exists": False
        }

    return {
        "exists": True,
        "code": promo.code,
        "reward": promo.reward
    }

@router.post("/activate")
def activate_promo_api(
    user_id: int,
    code: str,
    db: Session = Depends(get_db),
):
    user = db.query(Users).filter(Users.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    try:
        return activate_promo(db, user, code)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/referral/create")
def create_referral_promo(
    user_id: int,
    code: str,
    db: Session = Depends(get_db),
):
    code = code.upper().strip()


    # 2. пользователь
    user = db.query(Users).filter_by(id=user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # 3. уже есть реф-промик?
    existing_user_promo = (
        db.query(ReferralPromos)
        .filter_by(owner_user_id=user.id)
        .first()
    )
    if existing_user_promo:
        raise HTTPException(
            status_code=400,
            detail="You already have a referral promo code"
        )

    # 4. проверка уникальности
    existing_code = (
        db.query(ReferralPromos)
        .filter_by(code=code)
        .first()
    )
    if existing_code:
        raise HTTPException(
            status_code=400,
            detail="This referral code is already taken"
        )

    # 5. награда (фикс, на бэке)
    REF_REWARD = settings.referral_reward_ton

    promo = ReferralPromos(
        owner_user_id=user.id,
        code=code,
        reward=REF_REWARD,
        active=True
    )

    db.add(promo)
    db.commit()

    return {
        "status": "created",
        "code": promo.code,
        "reward": promo.reward
    }

@router.put("/referral/update")
def update_referral_code(
    user_id: int,
    new_code: str,
    db: Session = Depends(get_db),
):
    new_code = new_code.upper().strip()



    # 2. пользователь
    user = db.query(Users).filter_by(id=user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # 3. его реф-код
    promo = (
        db.query(ReferralPromos)
        .filter_by(owner_user_id=user.id)
        .first()
    )
    if not promo:
        raise HTTPException(
            status_code=404,
            detail="Referral promo not found"
        )

    # 4. если код не меняется
    if promo.code == new_code:
        return {
            "status": "unchanged",
            "code": promo.code
        }

    # 5. проверка уникальности
    exists = (
        db.query(ReferralPromos)
        .filter(ReferralPromos.code == new_code)
        .first()
    )
    if exists:
        raise HTTPException(
            status_code=400,
            detail="This referral code is already taken"
        )

    # 6. обновление
    promo.code = new_code
    db.commit()

    return {
        "status": "updated",
        "code": promo.code
    }


@router.get("/referral/activations")
def get_referral_activations(
    user_id: int,
    db: Session = Depends(get_db),
):
    """
    Пользователи, которые:
    1) ввели реферальный промокод
    2) или пришли по реферальной ссылке
    """

    result = {}

    # -------------------------------------------------
    # 1️⃣ Через реферальный ПРОМОКОД
    # -------------------------------------------------
    promo_activations = (
        db.query(UserPromos, Users)
        .join(Users, Users.id == UserPromos.user_id)
        .filter(UserPromos.referral_owner_id == user_id)
        .all()
    )

    for user_promo, invited in promo_activations:
        result[invited.id] = {
            "user_id": invited.id,
            "username": invited.username,
            "firstname": invited.firstname,
            "avatar": invited.url_image,
            "activated_at": user_promo.activated_at,
            "source": "promo",
            "totalDEP": invited.totalDEP or 0
        }

    # -------------------------------------------------
    # 2️⃣ Через реферальную ССЫЛКУ
    # -------------------------------------------------
    inviter = db.query(Users).filter_by(id=user_id).first()
    if inviter and inviter.tg_id:
        link_activations = (
            db.query(Users)
            .filter(Users.refererID == inviter.tg_id)
            .all()
        )
    else:
        link_activations = []

    for invited in link_activations:
        # если уже есть через промо — не дублируем
        if invited.id in result:
            continue

        result[invited.id] = {
            "user_id": invited.id,
            "username": invited.username,
            "firstname": invited.firstname,
            "avatar": invited.url_image,
            "activated_at": invited.created_at,
            "source": "link",
            "totalDEP": invited.totalDEP or 0
        }

    return {
        "count": len(result),
        "users": list(result.values())
    }
