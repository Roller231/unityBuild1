# app/services/roulette_drop_service.py

import random
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.models import Drops

def choose_free_spin_drop(db: Session) -> Drops:
    drops = db.query(Drops).all()
    if not drops:
        raise ValueError("No drops available")

    # 1️⃣ средняя цена
    avg_price = db.query(func.avg(Drops.price)).scalar() or 0

    # 2️⃣ группы по цене
    cheap = [d for d in drops if d.price < avg_price / 2]
    mid = [d for d in drops if avg_price <= d.price <= avg_price * 1.5]

    # фолбэки
    if not cheap:
        cheap = drops
    if not mid:
        mid = cheap

    # 3️⃣ вероятность
    r = random.random()
    pool = cheap if r < 0.98 else mid

    return random.choice(pool)

def choose_paid_spin_drop(db: Session, bet_price: float) -> Drops:
    drops = db.query(Drops).all()
    if not drops:
        raise ValueError("No drops available")

    near = [
        d for d in drops
        if bet_price * 0.8 <= d.price <= bet_price * 1.05
    ]

    better = [
        d for d in drops
        if bet_price * 1.05 < d.price <= bet_price * 1.3
    ]

    jackpot = [
        d for d in drops
        if bet_price * 1.3 < d.price <= bet_price * 2
    ]

    # фолбэки
    if not near:
        near = [d for d in drops if d.price <= bet_price]
    if not better:
        better = near
    if not jackpot:
        jackpot = better

    r = random.random()

    if r < 0.90:
        pool = near
    elif r < 0.98:
        pool = better
    else:
        pool = jackpot

    return random.choice(pool)
