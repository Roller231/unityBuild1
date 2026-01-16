# app/services/roulette_drop_service.py

import random
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.core.config import settings
from app.models import Drops

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
    drops = db.query(Drops).all()
    if not drops:
        raise ValueError("No drops available")

    drops_sorted = sorted(drops, key=lambda d: d.price)

    cheap_count = max(1, int(len(drops_sorted) * settings.roulette_free_cheap_pct))
    mid_count = max(1, int(len(drops_sorted) * settings.roulette_free_mid_pct))

    cheap = drops_sorted[:cheap_count]
    mid = drops_sorted[:mid_count]

    r = random.random()

    if r < settings.roulette_free_cheap_chance:
        pool = cheap
    else:
        pool = mid

    return random.choice(pool)


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

    # 1) решаем ветку: дороже/дешевле
    is_higher = random.random() < float(settings.roulette_higher_chance)

    if is_higher:
        low = bet_price * float(settings.roulette_higher_min_mult)
        high = bet_price * float(settings.roulette_higher_max_mult)
        candidates = _filter_by_price_range(drops, low, high)
    else:
        mn_mult, mx_mult = _pick_weighted_bucket(
            _get_cheaper_buckets_from_settings()
        )
        low = bet_price * float(mn_mult)
        high = bet_price * float(mx_mult)
        candidates = _filter_by_price_range(drops, low, high)

    # 2) фолбэк — если в диапазоне нет дропов, расширяем диапазон
    if not candidates:
        expand = bet_price * float(settings.roulette_fallback_expand_pct)
        low2 = max(0.0, low - expand)
        high2 = high + expand
        candidates = _filter_by_price_range(drops, low2, high2)

    # 3) ещё фолбэк — если всё равно пусто, берём ближайшие по цене
    if not candidates:
        drops_sorted = sorted(drops, key=lambda d: abs(float(d.price) - bet_price))
        candidates = drops_sorted[:max(1, min(30, len(drops_sorted)))]

    # 4) анти-повтор
    if last_drop_id:
        filtered = [d for d in candidates if d.id != last_drop_id]
        if filtered:
            candidates = filtered

    return random.choice(candidates)

