# app/services/crash_engine.py
import asyncio
import random
from datetime import datetime
from typing import Dict, List, Optional, Set

from fastapi import WebSocket
from sqlalchemy.orm import Session

from app.database import SessionLocal
from app.core.config import settings
from app.models import Users, CrashRounds, CrashBets, Transactions

class CrashBetState:
    def __init__(self, user_id: int, amount: float):
        self.user_id = user_id
        self.amount = amount
        self.cashout_x: Optional[float] = None
        self.profit: Optional[float] = None
        self.db_id: Optional[int] = None  # id в таблице crash_bets


class CrashEngine:
    def __init__(self):
        self.clients: Set[WebSocket] = set()
        self.lock = asyncio.Lock()

        self.round_id: Optional[int] = None
        self.crash_point: float = 0.0
        self.multiplier: float = settings.start_x
        self.phase: str = "idle"  # idle | betting | running | crashed

        # user_id -> CrashBetState
        self.bets: Dict[int, CrashBetState] = {}

    # ---------- Работа с клиентами ----------

    async def add_client(self, ws: WebSocket):
        async with self.lock:
            self.clients.add(ws)
        # отправляем текущее состояние
        await self.send_state(ws)

    async def remove_client(self, ws: WebSocket):
        async with self.lock:
            self.clients.discard(ws)

    async def broadcast(self, data: dict):
        dead_clients = []
        for ws in list(self.clients):
            try:
                await ws.send_json(data)
            except Exception:
                dead_clients.append(ws)
        for ws in dead_clients:
            await self.remove_client(ws)

    async def send_state(self, ws: WebSocket):
        state = {
            "event": "state",
            "phase": self.phase,
            "round_id": self.round_id,
            "crash_point": self.crash_point if self.phase != "betting" else None,
            "multiplier": self.multiplier,
        }
        await ws.send_json(state)

    # ---------- Генерация crash-коэффициента ----------

    def generate_crash_point(self) -> float:
        """
        Простой рандом с ограничением [min_x, max_x].
        Можно заменить на provably fair позже.
        """
        r = random.random()
        # базовая формула с тяжелым хвостом
        x = 1 / (1 - r + 1e-5)
        x = max(settings.min_x, min(x, settings.max_x))
        return round(x, 2)

    # ---------- Публичные методы для ставок / кэшаута ----------

    async def place_bet(self, user_id: int, amount: float) -> dict:
        async with self.lock:
            if self.phase != "betting":
                return {"ok": False, "error": "bets_closed"}

            if user_id in self.bets:
                return {"ok": False, "error": "already_bet"}

            if amount <= 0:
                return {"ok": False, "error": "bad_amount"}

            # проверяем баланс и списываем деньги
            db: Session = SessionLocal()
            try:
                user = db.query(Users).filter(Users.id == user_id).with_for_update().first()
                if not user:
                    return {"ok": False, "error": "user_not_found"}

                if (user.balance or 0) < amount:
                    return {"ok": False, "error": "not_enough_balance"}

                balance_before = user.balance
                user.balance -= amount

                # создаём запись раунда, если вдруг нет (подстраховка)
                if self.round_id is None:
                    round_obj = CrashRounds(
                        round_number=None,
                        crash_point=0,
                        started_at=None,
                        ended_at=None,
                        total_bet=0,
                        total_payout=0,
                    )
                    db.add(round_obj)
                    db.flush()
                    self.round_id = round_obj.id

                # создаём bet
                bet = CrashBets(
                    round_id=self.round_id,
                    user_id=user_id,
                    amount=amount,
                    cashout_multiplier=None,
                    profit=None,
                    created_at=datetime.utcnow(),
                )
                db.add(bet)
                db.flush()

                # создаём транзакцию (списание на ставку)
                tx = Transactions(
                    user_id=user_id,
                    type="crash_bet",
                    amount=amount,
                    balance_before=balance_before,
                    balance_after=user.balance,
                    related_round_id=self.round_id,
                    created_at=datetime.utcnow(),
                )
                db.add(tx)

                db.commit()

                # локальное состояние
                state = CrashBetState(user_id=user_id, amount=amount)
                state.db_id = bet.id
                self.bets[user_id] = state
            finally:
                db.close()

        await self.broadcast({
            "event": "bet_placed",
            "user_id": user_id,
            "amount": amount,
        })
        return {"ok": True}

    async def cashout(self, user_id: int) -> dict:
        async with self.lock:
            if self.phase != "running":
                return {"ok": False, "error": "not_running"}

            bet = self.bets.get(user_id)
            if not bet:
                return {"ok": False, "error": "no_bet"}

            if bet.cashout_x is not None:
                return {"ok": False, "error": "already_cashout"}

            bet.cashout_x = self.multiplier

            # считаем прибыль и немедленно записываем в базу и на баланс
            db: Session = SessionLocal()
            try:
                bet_row = db.query(CrashBets).filter(CrashBets.id == bet.db_id).with_for_update().first()
                user = db.query(Users).filter(Users.id == user_id).with_for_update().first()

                if not bet_row or not user:
                    return {"ok": False, "error": "db_error"}

                profit = bet.amount * bet.cashout_x - bet.amount
                bet.profit = profit

                bet_row.cashout_multiplier = bet.cashout_x
                bet_row.profit = profit

                balance_before = user.balance
                user.balance += bet.amount + profit  # возвращаем ставку + профит

                tx = Transactions(
                    user_id=user_id,
                    type="crash_cashout",
                    amount=profit,
                    balance_before=balance_before,
                    balance_after=user.balance,
                    related_round_id=self.round_id,
                    created_at=datetime.utcnow(),
                )
                db.add(tx)

                db.commit()
            finally:
                db.close()

        await self.broadcast({
            "event": "cashout",
            "user_id": user_id,
            "multiplier": self.multiplier,
        })

        return {"ok": True}

    # ---------- Основной бесконечный цикл игры ----------

    async def game_loop(self):
        """
        Бесконечный цикл:
        - betting: приём ставок
        - running: рост коэффициента до crash_point
        - crashed: пауза, расчёт
        """
        while True:
            # --- создаём новый раунд ---
            async with self.lock:
                self.bets = {}
                self.multiplier = settings.start_x
                self.crash_point = self.generate_crash_point()
                self.phase = "betting"

                db: Session = SessionLocal()
                try:
                    round_obj = CrashRounds(
                        round_number=None,
                        crash_point=self.crash_point,
                        started_at=None,
                        ended_at=None,
                        total_bet=0,
                        total_payout=0,
                    )
                    db.add(round_obj)
                    db.commit()
                    db.refresh(round_obj)
                    self.round_id = round_obj.id
                finally:
                    db.close()

            await self.broadcast({
                "event": "new_round",
                "round_id": self.round_id,
                "crash_point_max_hint": self.crash_point,  # можно не показывать полностью на фронте
                "bet_phase_seconds": settings.bet_phase_seconds,
            })

            # --- фаза ставок ---
            await asyncio.sleep(settings.bet_phase_seconds)

            async with self.lock:
                self.phase = "running"

            await self.broadcast({"event": "round_start"})

            # --- рост коэффициента ---
            tick = settings.tick_ms / 1000.0
            while True:
                async with self.lock:
                    if self.multiplier >= self.crash_point:
                        break
                    self.multiplier = round(self.multiplier * (1 + settings.grow_speed), 2)
                    current_x = self.multiplier

                await self.broadcast({
                    "event": "tick",
                    "multiplier": current_x,
                })

                await asyncio.sleep(tick)

            # --- краш ---
            async with self.lock:
                self.phase = "crashed"
                crashed_x = self.crash_point

            await self.broadcast({
                "event": "crash",
                "multiplier": crashed_x,
            })

            # --- фиксим проигравших в базе ---
            await self._finalize_losers()

            # --- пауза перед новым раундом ---
            await asyncio.sleep(settings.pause_between_rounds)

    async def _finalize_losers(self):
        """
        Все, кто не сделал cashout, уже проиграли – фиксируем их убыток в БД.
        """
        async with self.lock:
            losing_bets: List[CrashBetState] = [
                b for b in self.bets.values() if b.cashout_x is None
            ]
            round_id = self.round_id

        if not losing_bets or round_id is None:
            return

        db: Session = SessionLocal()
        try:
            for bet in losing_bets:
                bet_row = db.query(CrashBets).filter(CrashBets.id == bet.db_id).with_for_update().first()
                if not bet_row:
                    continue
                bet_row.cashout_multiplier = None
                bet_row.profit = -bet.amount
                # деньги уже списаны при ставке, баланс менять не надо
            db.commit()
        finally:
            db.close()


# глобальный экземпляр движка
crash_engine = CrashEngine()
