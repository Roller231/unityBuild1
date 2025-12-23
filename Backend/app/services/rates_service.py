# ============================================================
# 💱 RATES / CURRENCY HELPERS
# ============================================================
from app.core.config import settings


def get_rates():
    """
    Статичные курсы (USD)
    """
    return {
        "coins": settings.rate_coins_usd,
        "gems": settings.rate_gems_usd,
        "stars": settings.rate_stars_usd,
        "shields": settings.rate_shields_usd,
    }
