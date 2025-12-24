# app/core/config.py
import os
from dataclasses import dataclass
from dotenv import load_dotenv

@dataclass
class CrashSettings:
    load_dotenv()

    # ============================================================
    # 🎮 CRASH GAME SETTINGS
    # ============================================================

    # время в секундах на приём ставок перед началом раунда
    bet_phase_seconds: float = float(os.getenv("CRASH_BET_PHASE", 10.0))

    # пауза между раундами
    pause_between_rounds: float = float(os.getenv("CRASH_PAUSE_BETWEEN", 3.0))

    # шаг обновления коэффициента (мс)
    tick_ms: int = int(os.getenv("CRASH_TICK_MS", 50))

    # минимальный crash-коэффициент
    min_x: float = float(os.getenv("CRASH_MIN_X", 1.00))

    # максимальный crash-коэффициент (хард-кап)
    max_x: float = float(os.getenv("CRASH_MAX_X", 6.0))

    # начальный коэффициент
    start_x: float = float(os.getenv("CRASH_START_X", 1.00))

    # базовая скорость роста коэффициента
    grow_speed: float = float(os.getenv("CRASH_GROW_SPEED", 0.2))

    # шанс, что коэффициент будет высоким (0–1)
    luck_chance: float = float(os.getenv("CRASH_LUCK_CHANCE", 0.15))

    # множитель удачи (на сколько увеличить crash_point)
    luck_multiplier: float = float(os.getenv("CRASH_LUCK_MULTIPLIER", 1.5))


    # ============================================================
    # 🔌 WEBSOCKET / SECURITY SETTINGS
    # ============================================================

    # API-токен для WebSocket (простой вариант безопасности)
    ws_token: str = os.getenv("CRASH_WS_TOKEN", "supersecret")


    # ============================================================
    # 🎁 DROPS / GIFTS SETTINGS
    # ============================================================

    # периодичность выпадения подарков (секунды)
    drop_interval_seconds: float = float(os.getenv("DROP_INTERVAL_SECONDS", 2))


    # ============================================================
    # 🎟️ PROMO / REFERRAL SETTINGS
    # ============================================================

    # награда за реферала (TON)
    referral_reward_ton: float = float(
        os.getenv("REFERRAL_REWARD_TON", 1.5)
    )




    # ============================================================
    # 👥 ONLINE USERS (FAKE / DISPLAY)
    # ============================================================

    # часовой пояс для расчёта онлайна (например, Europe/Moscow)
    online_timezone: str = os.getenv("ONLINE_TIMEZONE", "Europe/Moscow")

    # как часто обновлять онлайн (секунды)
    online_update_interval_seconds: int = int(
        os.getenv("ONLINE_UPDATE_INTERVAL", 300)  # 5 минут
    )

    # ночной онлайн (00:00 – 07:59)
    online_night_min: int = int(os.getenv("ONLINE_NIGHT_MIN", 80))
    online_night_max: int = int(os.getenv("ONLINE_NIGHT_MAX", 120))

    # дневной онлайн (08:00 – 21:59)
    online_day_min: int = int(os.getenv("ONLINE_DAY_MIN", 180))
    online_day_max: int = int(os.getenv("ONLINE_DAY_MAX", 260))


    # ============================================================
    # 💱 CURRENCY / RATES SETTINGS
    # ============================================================

    # базовая валюта
    rate_coins_usd: float = float(os.getenv("RATE_COINS_USD", 1))

    # премиум валюты
    rate_gems_usd: float = float(os.getenv("RATE_GEMS_USD", 100))
    rate_stars_usd: float = float(os.getenv("RATE_STARS_USD", 50))
    rate_shields_usd: float = float(os.getenv("RATE_SHIELDS_USD", 10))




    # ============================================================
    # 🎰 ROULETTE (PAID SPIN) SETTINGS
    # ============================================================

    # шанс попасть в ветку "дороже ставки"
    roulette_higher_chance: float = float(os.getenv("ROULETTE_HIGHER_CHANCE", 0.05))

    # Бакеты для ветки "дешевле ставки".
    # Каждый бакет: (weight, min_mult, max_mult)
    # min/max — множители от bet_price.
    # Пример: 0.8..0.9 значит цена в диапазоне [bet*0.8, bet*0.9]
    roulette_cheaper_buckets = [
        (0.20, 0.80, 0.90),  # "около -20%" диапазон
        (0.30, 0.70, 0.80),  # "около -30%"
        (0.40, 0.50, 0.70),  # "около -50%..-30%"
        (0.10, 0.90, 0.95),  # "слегка дешевле"
    ]

    # Ветка "дороже ставки"
    roulette_higher_min_mult: float = float(os.getenv("ROULETTE_HIGHER_MIN_MULT", 1.05))
    roulette_higher_max_mult: float = float(os.getenv("ROULETTE_HIGHER_MAX_MULT", 1.30))

    # Защита от пустых пулов — насколько расширять диапазон (в долях ставки)
    roulette_fallback_expand_pct: float = float(os.getenv("ROULETTE_FALLBACK_EXPAND_PCT", 0.10))




    # ============================================================
    # ⚔️ PVP SETTINGS
    # ============================================================

    # -------- РЕЗУЛЬТАТ БОЯ --------
    # сумма должна быть = 1.0
    pvp_win_chance: float = float(os.getenv("PVP_WIN_CHANCE", 0.45))
    pvp_lose_chance: float = float(os.getenv("PVP_LOSE_CHANCE", 0.45))
    pvp_draw_chance: float = float(os.getenv("PVP_DRAW_CHANCE", 0.10))

    # -------- СТАВКА БОТА (ОТ СТАВКИ ИГРОКА) --------
    # бот ставит от -X% до +Y% от ставки игрока
    pvp_bot_deviation_min: float = float(os.getenv("PVP_BOT_DEV_MIN", 0.10))
    pvp_bot_deviation_max: float = float(os.getenv("PVP_BOT_DEV_MAX", 0.20))

    # шанс, что бот поставит больше ставки игрока
    pvp_bot_higher_chance: float = float(os.getenv("PVP_BOT_HIGHER_CHANCE", 0.50))

    # -------- ТАЙМИНГИ БОТОВ --------
    # задержка перед появлением бота
    pvp_bot_spawn_min_sec: float = float(os.getenv("PVP_BOT_SPAWN_MIN", 2))
    pvp_bot_spawn_max_sec: float = float(os.getenv("PVP_BOT_SPAWN_MAX", 4))

    # длительность боя
    pvp_fight_min_sec: float = float(os.getenv("PVP_FIGHT_MIN", 4))
    pvp_fight_max_sec: float = float(os.getenv("PVP_FIGHT_MAX", 8))
    print("dsadasd")
    print(os.getenv("PVP_FIGHT_MAX"))
    # кулдаун бота после боя
    pvp_bot_cooldown_min_sec: float = float(os.getenv("PVP_BOT_COOLDOWN_MIN", 5))
    pvp_bot_cooldown_max_sec: float = float(os.getenv("PVP_BOT_COOLDOWN_MAX", 10))

    # ⏳ пауза перед уходом
    pvp_bot_leave_delay_min_sec: float = float(os.getenv("PVP_BOT_LEAVE_MIN", 2))
    pvp_bot_leave_delay_max_sec: float = float(os.getenv("PVP_BOT_LEAVE_MAX", 4))

    # ============================================================
    # 🎰 UPGRADE BALANCE
    # ============================================================

    upgrade_base_chance: float = float(
        os.getenv("UPGRADE_BASE_CHANCE", 0.80)
    )

    upgrade_decay_factor: float = float(
        os.getenv("UPGRADE_DECAY_FACTOR", 1.8)
    )

    upgrade_min_chance: float = float(
        os.getenv("UPGRADE_MIN_CHANCE", 0.03)
    )

    upgrade_max_chance: float = float(
        os.getenv("UPGRADE_MAX_CHANCE", 0.80)
    )

    # шанс апгрейда в минус или в равную цену (фиксированный)
    upgrade_down_chance: float = float(
        os.getenv("UPGRADE_DOWN_CHANCE", 0.95)
    )


settings = CrashSettings()
