from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import datetime
from app.services.withdraw_tg_bot import notify_withdraw_request

from app.database import get_db
from app.models.users import Users
from app.models.withdraw_requests import WithdrawRequests
from app.models.transactions import Transactions
from app.schemas.withdraw_schema import WithdrawCreate, WithdrawOut
from app.services.inventory_service import (
    add_drop_to_inventory,
    remove_drop_from_inventory,
)

router = APIRouter(prefix="/withdraw", tags=["Withdraw"])



def _complete_withdraw_logic(request_id: int, db: Session):
    req = (
        db.query(WithdrawRequests)
        .filter(WithdrawRequests.id == request_id)
        .with_for_update()
        .first()
    )

    if not req:
        raise HTTPException(404, "Withdraw request not found")

    if req.status != "pending":
        return {"ok": False, "status": req.status}

    req.status = "processed"
    req.processed_at = datetime.utcnow()
    db.commit()

    return {"ok": True, "status": "processed"}


def _cancel_withdraw_logic(request_id: int, db: Session):
    req = (
        db.query(WithdrawRequests)
        .filter(WithdrawRequests.id == request_id)
        .with_for_update()
        .first()
    )

    if not req:
        raise HTTPException(404, "Withdraw request not found")

    if req.status != "pending":
        return {"ok": False, "status": req.status}

    user = (
        db.query(Users)
        .filter(Users.id == req.user_id)
        .with_for_update()
        .first()
    )

    if not user:
        raise HTTPException(404, "User not found")

    if req.type == "ton":
        user.balance += float(req.ton_amount or 0)
    elif req.type == "drop":
        add_drop_to_inventory(
            user=user,
            drop_id=req.drop_id,
            count=1,
        )

    req.status = "rejected"
    req.processed_at = datetime.utcnow()
    db.commit()

    return {"ok": True, "status": "rejected"}



# =================================================
# 🔎 ПРОВЕРКА ДОСТУПНОСТИ ВЫВОДА
# =================================================
@router.get("/can")
def can_withdraw(
    user_id: int,
    db: Session = Depends(get_db),
):
    user = db.query(Users).filter(Users.id == user_id).first()
    if not user:
        raise HTTPException(404, "User not found")

    # 1️⃣ уровень
    if user.level < 2:
        return {
            "can": False,
            "reason": "low_level",
            "level": user.level,
            "total_deposit": 0,
        }

    # 2️⃣ сумма депозитов
    total_deposit = (
        db.query(func.coalesce(func.sum(Transactions.amount), 0))
        .filter(
            Transactions.user_id == user.id,
            Transactions.type == "deposit",
        )
        .scalar()
    )

    total_deposit = float(total_deposit or 0)

    if total_deposit <= 2.8:
        return {
            "can": False,
            "reason": "low_deposit_sum",
            "level": user.level,
            "total_deposit": total_deposit,
        }

    return {
        "can": True,
        "level": user.level,
        "total_deposit": total_deposit,
    }


from fastapi import BackgroundTasks

@router.post("/", response_model=WithdrawOut)
def create_withdraw_request(
    data: WithdrawCreate,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
):
    user = (
        db.query(Users)
        .filter(Users.id == data.user_id)
        .with_for_update()
        .first()
    )
    if not user:
        raise HTTPException(404, "User not found")

    # ---------------- TON ----------------
    if data.type == "ton":
        amount = float(data.ton_amount or 0)

        if amount <= 0:
            raise HTTPException(400, "Invalid ton_amount")

        if (user.balance or 0) < amount:
            raise HTTPException(400, "Not enough balance")

        user.balance -= amount

    # ---------------- DROP ----------------
    elif data.type == "drop":
        ok = remove_drop_from_inventory(
            user=user,
            drop_id=data.drop_id,
            count=1,
        )
        if not ok:
            raise HTTPException(400, "Drop not found or not enough quantity")

    else:
        raise HTTPException(400, "Invalid withdraw type")

    req = WithdrawRequests(
        user_id=user.id,
        tg_id=user.tg_id,
        username=user.username,
        type=data.type,
        ton_amount=data.ton_amount,
        drop_id=data.drop_id,
        status="pending",
        created_at=datetime.utcnow(),
    )

    db.add(req)
    db.commit()
    db.refresh(req)

    # 🔥 УВЕДОМЛЕНИЕ В ФОНЕ
    background_tasks.add_task(
        notify_withdraw_request,
        request_id=req.id,
        user_id=user.id,
        username=user.username,
        tg_id=user.tg_id,
        withdraw_type=req.type,
        ton_amount=req.ton_amount,
        drop_id=req.drop_id,
    )

    return req



@router.get("/{request_id}/complete")
def complete_withdraw(
    request_id: int,
    db: Session = Depends(get_db),
):
    return _complete_withdraw_logic(request_id, db)


@router.get("/{request_id}/cancel")
def cancel_withdraw(
    request_id: int,
    db: Session = Depends(get_db),
):
    return _cancel_withdraw_logic(request_id, db)

