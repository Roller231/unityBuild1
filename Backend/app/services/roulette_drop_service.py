# app/services/roulette_drop_service.py

import random
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.core.config import settings
from app.models import Drops
from app.models.transactions import Transactions
from datetime import datetime

def _get_cheaper_buckets_from_settings():
    return [
        (
            settings.roulette_cheap_bucket_1_weight,
            settings.roulette_cheap_bucket_1_min,
            settings.roulette_cheap_bucket_1_max,
        ),
        (
            settings.roulette_cheap_bucket_2_weight,
            settings.roulette_cheap_bucket_2_min,
            settings.roulette_cheap_bucket_2_max,
        ),
        (
            settings.roulette_cheap_bucket_3_weight,
            settings.roulette_cheap_bucket_3_min,
            settings.roulette_cheap_bucket_3_max,
        ),
        (
            settings.roulette_cheap_bucket_4_weight,
            settings.roulette_cheap_bucket_4_min,
            settings.roulette_cheap_bucket_4_max,
        ),
    ]


def choose_free_spin_drop(db: Session) -> Drops:
    drops = (
        db.query(Drops)
        .filter(Drops.price >= 0.2, Drops.price <= 1.0)
        .all()
    )

    if not drops:
        raise ValueError("No drops in free spin range")

    drops_sorted = sorted(drops, key=lambda d: float(d.price))

    # bias < 1 → чаще дешёвые
    bias = float(0.5)  # например 0.35
    r = random.random() ** (1 / bias)

    index = int(r * len(drops_sorted))
    index = min(index, len(drops_sorted) - 1)

    return drops_sorted[index]



def _pick_weighted_bucket(buckets: list[tuple[float, float, float]]) -> tuple[float, float]:
    """
    buckets: [(weight, min_mult, max_mult), ...]
    Возвращает (min_mult, max_mult).
    """
    total = sum(w for w, _, _ in buckets)
    if total <= 0:
        # если кто-то сломал конфиг
        return 0.0, 1.0

    r = random.random() * total
    acc = 0.0
    for w, mn, mx in buckets:
        acc += w
        if r <= acc:
            return mn, mx

    # фолбэк
    return buckets[-1][1], buckets[-1][2]

def _filter_by_price_range(drops: list[Drops], low: float, high: float) -> list[Drops]:
    return [d for d in drops if low <= float(d.price) <= high]

def choose_paid_spin_drop(
    db: Session,
    bet_price: float,
    last_drop_id: int | None = None
) -> Drops:
    drops = db.query(Drops).all()
    if not drops:
        raise ValueError("No drops available")

    win_chance = float(settings.roulette_win_chance)  # например 0.30
    win_range = float(settings.roulette_win_range)    # например 40
    lose_range = float(settings.roulette_lose_range)  # например 40

    is_win = random.random() < win_chance

    if is_win:
        low = bet_price
        high = bet_price + win_range
    else:
        low = max(0.0, bet_price - lose_range)
        high = bet_price

    candidates = [
        d for d in drops
        if low <= float(d.price) <= high
    ]

    # 🔁 фолбэк 1 — расширяем диапазон
    if not candidates:
        expand = bet_price * 0.5
        candidates = [
            d for d in drops
            if (low - expand) <= float(d.price) <= (high + expand)
        ]

    # 🔁 фолбэк 2 — ближайшие по цене
    if not candidates:
        candidates = sorted(
            drops,
            key=lambda d: abs(float(d.price) - bet_price)
        )[:30]

    # 🔁 анти-повтор
    if last_drop_id:
        filtered = [d for d in candidates if d.id != last_drop_id]
        if filtered:
            candidates = filtered

    return random.choice(candidates)


