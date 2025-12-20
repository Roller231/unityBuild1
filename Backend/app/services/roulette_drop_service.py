# app/services/roulette_drop_service.py

import random
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.models import Drops

def choose_free_spin_drop(db: Session) -> Drops:
    drops = db.query(Drops).all()
    if not drops:
        raise ValueError("No drops available")

    # сортируем по цене
    drops_sorted = sorted(drops, key=lambda d: d.price)

    # нижние 20% — ОСНОВНОЙ пул
    min_count = max(1, int(len(drops_sorted) * 0.2))
    cheap = drops_sorted[:min_count]

    # нижние 40% — редкий бонус
    mid = drops_sorted[:max(1, int(len(drops_sorted) * 0.4))]

    r = random.random()

    if r < 0.97:
        pool = cheap
    else:
        pool = mid

    return random.choice(pool)


def choose_paid_spin_drop(
    db: Session,
    bet_price: float,
    last_drop_id: int | None = None
) -> Drops:
    drops = db.query(Drops).all()
    if not drops:
        raise ValueError("No drops available")

    # --- Пулы ---
    cheaper = [
        d for d in drops
        if d.price < bet_price * 0.9
    ]

    near = [
        d for d in drops
        if bet_price * 0.9 <= d.price <= bet_price * 1.05
    ]

    higher = [
        d for d in drops
        if bet_price * 1.05 < d.price <= bet_price * 1.3
    ]

    jackpot = [
        d for d in drops
        if d.price > bet_price * 1.3
    ]

    # фолбэки
    if not cheaper:
        cheaper = near or drops
    if not near:
        near = cheaper
    if not higher:
        higher = near
    if not jackpot:
        jackpot = higher

    # --- ВЕСА (важно) ---
    pools = [
        (cheaper, 0.45),   # чаще дешевле
        (near,    0.25),
        (higher,  0.25),   # суммарно 30–35% выше ставки
        (jackpot, 0.05),
    ]

    r = random.random()
    acc = 0.0

    for pool, weight in pools:
        acc += weight
        if r <= acc:
            candidates = pool
            break
    else:
        candidates = cheaper

    # --- АНТИ-ПОВТОР ---
    if last_drop_id:
        filtered = [d for d in candidates if d.id != last_drop_id]
        if filtered:
            candidates = filtered

    return random.choice(candidates)

