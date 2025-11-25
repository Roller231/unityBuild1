# app/core/config.py
import os
from dataclasses import dataclass

@dataclass
class CrashSettings:
    # время в секундах на приём ставок перед началом раунда
    bet_phase_seconds: float = float(os.getenv("CRASH_BET_PHASE", 5.0))
    # пауза между раундами
    pause_between_rounds: float = float(os.getenv("CRASH_PAUSE_BETWEEN", 3.0))
    # шаг обновления коэффициента (мс)
    tick_ms: int = int(os.getenv("CRASH_TICK_MS", 50))
    # минимальный crash-коэффициент
    min_x: float = float(os.getenv("CRASH_MIN_X", 1.01))
    # максимальный crash-коэффициент (хард-кап)
    max_x: float = float(os.getenv("CRASH_MAX_X", 50.0))
    # начальный коэффициент
    start_x: float = float(os.getenv("CRASH_START_X", 1.00))
    # базовая скорость роста икса
    grow_speed: float = float(os.getenv("CRASH_GROW_SPEED", 0.015))
    # API-токен для WebSocket (очень простой вариант безопасности)
    ws_token: str = os.getenv("CRASH_WS_TOKEN", "supersecret")
    # Периодичность выпадения подарков (секунды)
    drop_interval_seconds: float = float(os.getenv("DROP_INTERVAL_SECONDS", 2.0))
    # шанс, что коэффициент будет высоким (0–1)
    luck_chance: float = float(os.getenv("CRASH_LUCK_CHANCE", 0.15))

    # множитель удачи (на сколько увеличить crash_point)
    luck_multiplier: float = float(os.getenv("CRASH_LUCK_MULTIPLIER", 1.5))

settings = CrashSettings()
