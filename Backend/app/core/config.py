import os
from dataclasses import dataclass
from dotenv import load_dotenv

load_dotenv()


async def load_game_settings(conn) -> dict:
    rows = await conn.fetch("SELECT name, value FROM game_settings")
    return {row["name"]: row["value"] for row in rows}


@dataclass
class CrashSettings:
    # ============================================================
    # 🎮 CRASH GAME SETTINGS
    # ============================================================

    bet_phase_seconds: float = float(os.getenv("CRASH_BET_PHASE", 10.0))
    pause_between_rounds: float = float(os.getenv("CRASH_PAUSE_BETWEEN", 3.0))
    tick_ms: int = int(os.getenv("CRASH_TICK_MS", 50))
    min_x: float = float(os.getenv("CRASH_MIN_X", 1.00))
    max_x: float = float(os.getenv("CRASH_MAX_X", 6.0))
    start_x: float = float(os.getenv("CRASH_START_X", 1.00))
    grow_speed: float = float(os.getenv("CRASH_GROW_SPEED", 0.2))
    luck_chance: float = float(os.getenv("CRASH_LUCK_CHANCE", 0.15))
    luck_multiplier: float = float(os.getenv("CRASH_LUCK_MULTIPLIER", 1.5))

    # ============================================================
    # 🔌 SECURITY
    # ============================================================

    ws_token: str = os.getenv("CRASH_WS_TOKEN", "supersecret")

    # ============================================================
    # 🎁 DROPS
    # ============================================================

    drop_interval_seconds: float = float(os.getenv("DROP_INTERVAL_SECONDS", 2))

    # ============================================================
    # 🎟️ PROMO
    # ============================================================

    referral_reward_ton: float = float(os.getenv("REFERRAL_REWARD_TON", 0.5))

    # ============================================================
    # 👥 ONLINE
    # ============================================================

    online_timezone: str = os.getenv("ONLINE_TIMEZONE", "Europe/Moscow")
    online_update_interval_seconds: int = int(os.getenv("ONLINE_UPDATE_INTERVAL", 300))
    online_night_min: int = int(os.getenv("ONLINE_NIGHT_MIN", 80))
    online_night_max: int = int(os.getenv("ONLINE_NIGHT_MAX", 120))
    online_day_min: int = int(os.getenv("ONLINE_DAY_MIN", 180))
    online_day_max: int = int(os.getenv("ONLINE_DAY_MAX", 260))

    # ============================================================
    # 💱 RATES
    # ============================================================

    rate_coins_usd: float = float(os.getenv("RATE_COINS_USD", 1))
    rate_gems_usd: float = float(os.getenv("RATE_GEMS_USD", 100))
    rate_stars_usd: float = float(os.getenv("RATE_STARS_USD", 50))
    rate_shields_usd: float = float(os.getenv("RATE_SHIELDS_USD", 10))

    # ============================================================
    # 🎰 ROULETTE
    # ============================================================

    roulette_higher_chance: float = float(os.getenv("ROULETTE_HIGHER_CHANCE", 0.05))
    roulette_higher_min_mult: float = float(os.getenv("ROULETTE_HIGHER_MIN_MULT", 1.05))
    roulette_higher_max_mult: float = float(os.getenv("ROULETTE_HIGHER_MAX_MULT", 1.30))
    roulette_fallback_expand_pct: float = float(os.getenv("ROULETTE_FALLBACK_EXPAND_PCT", 0.10))

    roulette_cheaper_buckets = [
        (0.20, 0.80, 0.90),
        (0.30, 0.70, 0.80),
        (0.40, 0.50, 0.70),
        (0.10, 0.90, 0.95),
    ]

    # ============================================================
    # ⚔️ PVP
    # ============================================================

    pvp_win_chance: float = float(os.getenv("PVP_WIN_CHANCE", 0.45))
    pvp_lose_chance: float = float(os.getenv("PVP_LOSE_CHANCE", 0.45))
    pvp_draw_chance: float = float(os.getenv("PVP_DRAW_CHANCE", 0.10))

    pvp_bot_deviation_min: float = float(os.getenv("PVP_BOT_DEV_MIN", 0.10))
    pvp_bot_deviation_max: float = float(os.getenv("PVP_BOT_DEV_MAX", 0.20))
    pvp_bot_higher_chance: float = float(os.getenv("PVP_BOT_HIGHER_CHANCE", 0.50))

    pvp_bot_spawn_min_sec: float = float(os.getenv("PVP_BOT_SPAWN_MIN", 0.3))
    pvp_bot_spawn_max_sec: float = float(os.getenv("PVP_BOT_SPAWN_MAX", 1.8))
    pvp_fight_min_sec: float = float(os.getenv("PVP_FIGHT_MIN", 4))
    pvp_fight_max_sec: float = float(os.getenv("PVP_FIGHT_MAX", 8))
    pvp_bot_cooldown_min_sec: float = float(os.getenv("PVP_BOT_COOLDOWN_MIN", 5))
    pvp_bot_cooldown_max_sec: float = float(os.getenv("PVP_BOT_COOLDOWN_MAX", 10))
    pvp_bot_leave_delay_min_sec: float = float(os.getenv("PVP_BOT_LEAVE_MIN", 2))
    pvp_bot_leave_delay_max_sec: float = float(os.getenv("PVP_BOT_LEAVE_MAX", 4))

    crash_pct_1: float = float(os.getenv("CRASH_PCT_1", 0.30))
    crash_pct_2: float = float(os.getenv("CRASH_PCT_2", 0.25))
    crash_pct_3: float = float(os.getenv("CRASH_PCT_3", 0.25))
    crash_pct_4: float = float(os.getenv("CRASH_PCT_4", 0.18))
    crash_pct_5: float = float(os.getenv("CRASH_PCT_5", 0.02))
    # ============================================================
    # 🎰 UPGRADE
    # ============================================================

    upgrade_base_chance: float = float(os.getenv("UPGRADE_BASE_CHANCE", 0.80))
    upgrade_decay_factor: float = float(os.getenv("UPGRADE_DECAY_FACTOR", 1.8))
    upgrade_min_chance: float = float(os.getenv("UPGRADE_MIN_CHANCE", 0.03))
    upgrade_max_chance: float = float(os.getenv("UPGRADE_MAX_CHANCE", 0.80))
    upgrade_down_chance: float = float(os.getenv("UPGRADE_DOWN_CHANCE", 0.95))

    roulette_free_cheap_pct: float = float(os.getenv("ROULETTE_FREE_CHEAP_PCT", 0.20))
    roulette_free_mid_pct: float = float(os.getenv("ROULETTE_FREE_MID_PCT", 0.40))
    roulette_free_cheap_chance: float = float(os.getenv("ROULETTE_FREE_CHEAP_CHANCE", 0.97))
    roulette_free_mid_chance: float = float(os.getenv("ROULETTE_FREE_MID_CHANCE", 0.03))

    # ============================================================
    # 🎰 ROULETTE — PAID SPIN
    # ============================================================

    roulette_higher_chance: float = float(os.getenv("ROULETTE_HIGHER_CHANCE", 0.05))
    roulette_higher_min_mult: float = float(os.getenv("ROULETTE_HIGHER_MIN_MULT", 1.05))
    roulette_higher_max_mult: float = float(os.getenv("ROULETTE_HIGHER_MAX_MULT", 1.30))

    roulette_cheap_bucket_1_weight: float = float(os.getenv("ROULETTE_CHEAP_BUCKET_1_WEIGHT", 0.20))
    roulette_cheap_bucket_1_min: float = float(os.getenv("ROULETTE_CHEAP_BUCKET_1_MIN", 0.80))
    roulette_cheap_bucket_1_max: float = float(os.getenv("ROULETTE_CHEAP_BUCKET_1_MAX", 0.90))

    roulette_cheap_bucket_2_weight: float = float(os.getenv("ROULETTE_CHEAP_BUCKET_2_WEIGHT", 0.30))
    roulette_cheap_bucket_2_min: float = float(os.getenv("ROULETTE_CHEAP_BUCKET_2_MIN", 0.70))
    roulette_cheap_bucket_2_max: float = float(os.getenv("ROULETTE_CHEAP_BUCKET_2_MAX", 0.80))

    roulette_cheap_bucket_3_weight: float = float(os.getenv("ROULETTE_CHEAP_BUCKET_3_WEIGHT", 0.40))
    roulette_cheap_bucket_3_min: float = float(os.getenv("ROULETTE_CHEAP_BUCKET_3_MIN", 0.50))
    roulette_cheap_bucket_3_max: float = float(os.getenv("ROULETTE_CHEAP_BUCKET_3_MAX", 0.70))

    roulette_cheap_bucket_4_weight: float = float(os.getenv("ROULETTE_CHEAP_BUCKET_4_WEIGHT", 0.10))
    roulette_cheap_bucket_4_min: float = float(os.getenv("ROULETTE_CHEAP_BUCKET_4_MIN", 0.90))
    roulette_cheap_bucket_4_max: float = float(os.getenv("ROULETTE_CHEAP_BUCKET_4_MAX", 0.95))

    roulette_fallback_expand_pct: float = float(os.getenv("ROULETTE_FALLBACK_EXPAND_PCT", 0.10))
    daily_reward_ton: float = float(os.getenv("DAILY_REWARD_TON", 0.5))
    ten_days_reward_ton: float = float(os.getenv("TEN_DAYS_REWARD_TON", 1.0))



    # ============================================================
    # 🎰 ROULETTE — PAID SPIN (NEW LOGIC)
    # ============================================================

    # шанс, что дроп будет дороже ставки (например 0.30 = 30%)
    roulette_win_chance: float = float(os.getenv("ROULETTE_WIN_CHANCE", 0.4))

    # максимальная разница В БОЛЬШУЮ сторону (TON)
    roulette_win_range: float = float(os.getenv("ROULETTE_WIN_RANGE", 25.0))

    # максимальная разница В МЕНЬШУЮ сторону (TON)
    roulette_lose_range: float = float(os.getenv("ROULETTE_LOSE_RANGE", 40.0))


    # bias < 1 → чаще дешёвые дропы
    roulette_free_bias: float = float(os.getenv("ROULETTE_FREE_BIAS", 0.35))


    # ============================================================
    # 🔁 APPLY DB OVERRIDES
    # ============================================================

    def apply_db_settings(self, db_settings: dict):
        for field_name in self.__dataclass_fields__:
            db_key = field_name.upper()
            if db_key not in db_settings:
                continue

            current = getattr(self, field_name)
            raw = db_settings[db_key]

            try:
                setattr(self, field_name, type(current)(raw))
            except Exception:
                pass


settings = CrashSettings()
