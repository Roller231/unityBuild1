# app/services/online_engine.py

import asyncio
import random
from datetime import datetime
from typing import Dict, Set
from zoneinfo import ZoneInfo
from fastapi import WebSocket
from app.core.config import settings


class OnlineEngine:
    def __init__(self):
        self.clients: Set[WebSocket] = set()
        self.lock = asyncio.Lock()

        self.is_day: bool | None = None

        # текущий онлайн по режимам
        self.values: Dict[int, int] = {}

    # -------------------------
    # DAY / NIGHT
    # -------------------------
    def _is_day_now(self) -> bool:
        tz = ZoneInfo(settings.online_timezone)
        hour = datetime.now(tz).hour
        return 9 <= hour < 23   # день: 09–23

    def _pick_new_base(self):
        if self.is_day:
            min_v = settings.online_day_min
            max_v = settings.online_day_max
        else:
            min_v = settings.online_night_min
            max_v = settings.online_night_max

        # ❗ ОДИН РАЗ выбираем базу для каждого режима
        self.values = {
            mode: random.randint(min_v, max_v)
            for mode in range(1, 5)
        }

    # -------------------------
    # WS MANAGEMENT
    # -------------------------
    async def add_client(self, ws: WebSocket):
        async with self.lock:
            self.clients.add(ws)
            data = dict(self.values)  # копия, не ссылка

        await ws.send_json({
            "event": "online_update",
            "data": data
        })

    async def remove_client(self, ws: WebSocket):
        async with self.lock:
            self.clients.discard(ws)

    async def broadcast(self):
        payload = {
            "event": "online_update",
            "data": self.values
        }

        dead = []
        for ws in list(self.clients):
            try:
                await ws.send_json(payload)
            except Exception:
                dead.append(ws)

        for ws in dead:
            await self.remove_client(ws)

    # -------------------------
    # MAIN LOOP
    # -------------------------
    async def loop(self):
        # 🔹 первичная инициализация
        self.is_day = self._is_day_now()
        self._pick_new_base()

        while True:
            await asyncio.sleep(settings.online_update_interval_seconds)

            now_is_day = self._is_day_now()

            if now_is_day != self.is_day:
                self.is_day = now_is_day
                self._pick_new_base()
                await self.broadcast()
                continue

            for mode in self.values:
                delta = random.randint(-10, 10)
                self.values[mode] = max(0, self.values[mode] + delta)

            await self.broadcast()


online_engine = OnlineEngine()
