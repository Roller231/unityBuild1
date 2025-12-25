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
import time


# ---------------------------------------------------------------------
# INTERNAL BET STATE (in-memory only)
# ---------------------------------------------------------------------
class CrashBetState:
    def __init__(self, user_id: int, amount: float):
        self.user_id = user_id
        self.amount = amount
        self.cashout_x: Optional[float] = None
        self.auto_cashout_x: Optional[float] = None
        self.profit: Optional[float] = None
        self.db_id: Optional[int] = None



# ---------------------------------------------------------------------
# CRASH ENGINE
# ---------------------------------------------------------------------
class CrashEngine:
    def __init__(self):
        self.clients: Set[WebSocket] = set()
        self.lock = asyncio.Lock()
        self.betting_ends_at: Optional[float] = None

        self.round_id: Optional[int] = None
        self.crash_point: float = 0.0
        self.multiplier: float = settings.start_x
        self.started_at: Optional[float] = None  # ⬅ время старта раунда
        self.phase: str = "idle"  # idle | betting | running | crashed
        self.next_round_pending_bets: List[dict] = []

        self.bets: Dict[int, CrashBetState] = {}

    # -----------------------------------------------------------------
    # WEBSOCKET MANAGEMENT
    # -----------------------------------------------------------------
    async def add_client(self, ws: WebSocket):
        async with self.lock:
            self.clients.add(ws)
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
        multiplier = self.multiplier

        if self.phase == "running" and self.started_at:
            elapsed = time.monotonic() - self.started_at
            multiplier = self.calc_multiplier(elapsed)

        await ws.send_json({
            "event": "state",
            "phase": self.phase,
            "round_id": self.round_id,
            "crash_point": self.crash_point if self.phase != "betting" else None,
            "multiplier": multiplier,
            "betting_ends_at": self.betting_ends_at if self.phase == "betting" else None,
        })

    def calc_multiplier(self, elapsed: float) -> float:
        return round(settings.start_x + elapsed * settings.grow_speed, 2)

    # -----------------------------------------------------------------
    # GAME MECHANICS
    # -----------------------------------------------------------------
    def generate_crash_point(self) -> float:
        r = random.random()

        # 🔴 1.00–1.05 → 30%
        if r < 0.30:
            x = random.uniform(1.00, 1.05)

        # 🟠 1.05–1.20 → 25%
        elif r < 0.55:
            x = random.uniform(1.05, 1.20)

        # 🟡 1.20–1.60 → 25%
        elif r < 0.80:
            x = random.uniform(1.20, 1.60)

        # 🟢 1.60–3.00 → 18%
        elif r < 0.98:
            x = random.uniform(1.60, 3.00)

        # 🔵 3.00–MAX → 2%
        else:
            x = random.uniform(3.00, settings.max_x)

        return round(min(x, settings.max_x), 2)

    # -----------------------------------------------------------------
    # PLACE BET
    # -----------------------------------------------------------------
    async def place_bet(
        self,
        user_id: int,
        amount: float,
        gift: bool = False,
        gift_id: Optional[int] = None,
        auto_cashout_x: Optional[float] = None
    ) -> dict:

        is_bot = user_id < 0

        async with self.lock:
            if self.phase != "betting":
                self.next_round_pending_bets.append({
                    "user_id": user_id,
                    "amount": amount,
                    "gift": gift,
                    "gift_id": gift_id,
                    "auto_cashout_x": auto_cashout_x
                })
                return {
                    "ok": True,
                    "queued": True,
                    "message": "bet saved for next round"
                }

            if user_id in self.bets:
                return {"ok": False, "error": "already_bet"}

            db: Session = SessionLocal()
            try:
                user = None

                if not is_bot:
                    user = db.query(Users).filter(Users.id == user_id).with_for_update().first()
                    if not user:
                        return {"ok": False, "error": "user_not_found"}

                # -------------------------------------------------------
                #   СТАВКА ПОДАРКОМ
                # -------------------------------------------------------
                if gift and not is_bot:
                    if not gift_id:
                        return {"ok": False, "error": "gift_id_required"}

                    # --- поиск подарка в инвентаре ---
                    gift_item = None
                    for item in user.inventory or []:
                        if str(item.get("drop_id")) == str(gift_id):
                            gift_item = item
                            break

                    if gift_item is None:
                        return {"ok": False, "error": "gift_not_in_inventory"}

                    from sqlalchemy.ext.mutable import MutableDict

                    # сделать элемент изменяемым для SQLAlchemy
                    idx = user.inventory.index(gift_item)
                    gift_item = MutableDict(gift_item)
                    user.inventory[idx] = gift_item

                    # --- берём цену подарка ---
                    from app.models import Drops
                    drop = db.query(Drops).filter(Drops.id == gift_id).first()
                    if not drop:
                        return {"ok": False, "error": "gift_not_found"}

                    amount = drop.price  # ставка = цена подарка

                    # --- уменьшаем количество ---
                    gift_item["count"] -= 1
                    if gift_item["count"] <= 0:
                        user.inventory.remove(gift_item)

                    balance_before = user.balance  # баланс не меняем


                # -------------------------------------------------------
                #   ОБЫЧНАЯ СТАВКА ТОННАМИ
                # -------------------------------------------------------
                else:
                    if amount <= 0:
                        return {"ok": False, "error": "bad_amount"}

                    if is_bot:
                        balance_before = 0  # у бота баланс не используется
                    else:
                        if (user.balance or 0) < amount:
                            return {"ok": False, "error": "not_enough_balance"}

                        balance_before = user.balance
                        user.balance -= amount

                # -------------------------------------------------------
                # Убеждаемся, что раунд существует
                # -------------------------------------------------------
                if self.round_id is None:
                    new_round = CrashRounds(
                        round_number=None,
                        crash_point=0,
                        started_at=None,
                        ended_at=None,
                        total_bet=0,
                        total_payout=0,
                    )
                    db.add(new_round)
                    db.flush()
                    self.round_id = new_round.id

                # -------------------------------------------------------
                # Создаём ставку
                # -------------------------------------------------------
                bet = CrashBets(
                    round_id=self.round_id,
                    user_id=user_id,
                    amount=amount,
                    cashout_multiplier=None,
                    profit=None,
                    gift=gift,
                    gift_id=gift_id,
                    auto_cashout_x=auto_cashout_x,
                    created_at=datetime.utcnow(),
                )
                db.add(bet)

                # обновляем сумму ставок
                round_row = db.query(CrashRounds).get(self.round_id)
                round_row.total_bet += amount

                # -------------------------------------------------------
                # транзакция
                # -------------------------------------------------------
                if not is_bot:
                    tx = Transactions(
                        user_id=user_id,
                        type="crash_bet_gift" if gift else "crash_bet",
                        amount=amount,
                        balance_before=balance_before,
                        balance_after=user.balance,
                        related_round_id=self.round_id,
                        created_at=datetime.utcnow()
                    )
                    db.add(tx)

                db.commit()
                db.refresh(bet)

                # -------------------------------------------------------
                # Состояние в памяти
                # -------------------------------------------------------
                # Боты не имеют user.balance, но ставка должна работать
                st = CrashBetState(user_id=user_id, amount=amount)
                st.db_id = bet.id
                st.auto_cashout_x = auto_cashout_x
                self.bets[user_id] = st

            finally:
                db.close()

        await self.broadcast({
            "event": "bet_placed",
            "user_id": user_id,
            "amount": amount,
            "gift": gift
        })

        return {"ok": True}


    # -----------------------------------------------------------------
    # AUTO CASHOUT
    # -----------------------------------------------------------------
    async def _auto_cashout(self, user_id: int, multiplier: float):
        is_bot = user_id < 0

        bet = self.bets.get(user_id)
        if not bet or bet.cashout_x is not None:
            return

        bet.cashout_x = multiplier

        db = SessionLocal()
        try:
            bet_row = db.get(CrashBets, bet.db_id)
            user_row = db.query(Users).get(user_id)

            profit = bet.amount * multiplier - bet.amount
            bet.profit = profit

            bet_row.cashout_multiplier = multiplier
            bet_row.profit = profit

            if not is_bot:
                balance_before = user_row.balance
                user_row.balance += bet.amount + profit

                tx = Transactions(
                    user_id=user_id,
                    type="crash_auto_cashout",
                    amount=profit,
                    balance_before=balance_before,
                    balance_after=user_row.balance,
                    related_round_id=self.round_id,
                    created_at=datetime.utcnow()
                )
                db.add(tx)

            # increase total payout
            round_row = db.query(CrashRounds).get(self.round_id)
            round_row.total_payout += (bet.amount + profit)

            db.commit()
        finally:
            db.close()

        await self.broadcast({
            "event": "cashout",
            "user_id": user_id,
            "multiplier": multiplier,
            "auto": True
        })

    # -----------------------------------------------------------------
    # MANUAL CASHOUT
    # -----------------------------------------------------------------
    async def cashout(self, user_id: int):
        is_bot = user_id < 0

        async with self.lock:
            if self.phase != "running":
                return {"ok": False, "error": "not_running"}

            bet = self.bets.get(user_id)
            if not bet:
                return {"ok": False, "error": "no_bet"}

            if bet.cashout_x is not None:
                return {"ok": False, "error": "already_cashout"}

            bet.cashout_x = self.multiplier

        db = SessionLocal()
        try:
            bet_row = db.query(CrashBets).filter(CrashBets.id == bet.db_id).with_for_update().first()
            user_row = db.query(Users).filter(Users.id == user_id).with_for_update().first()

            multiplier = bet.cashout_x
            profit = bet.amount * multiplier - bet.amount  # ← корректный профит

            bet.profit = profit

            bet_row.cashout_multiplier = multiplier
            bet_row.profit = profit

            if not is_bot:
                balance_before = user_row.balance
                user_row.balance += bet.amount + profit

                tx = Transactions(
                    user_id=user_id,
                    type="crash_cashout",
                    amount=profit,
                    balance_before=balance_before,
                    balance_after=user_row.balance,
                    related_round_id=self.round_id,
                    created_at=datetime.utcnow()
                )
                db.add(tx)

            round_row = db.query(CrashRounds).filter(CrashRounds.id == self.round_id).first()
            round_row.total_payout += (bet.amount + profit)

            db.commit()  # ← commit обязательно
            db.refresh(bet_row)
        finally:
            db.close()

        await self.broadcast({
            "event": "cashout",
            "user_id": user_id,
            "multiplier": self.multiplier,
            "auto": False
        })

        return {"ok": True}

    # -----------------------------------------------------------------
    # GAME LOOP
    # -----------------------------------------------------------------
    async def game_loop(self):
        while True:
            async with self.lock:
                self.bets = {}
                self.multiplier = settings.start_x
                self.crash_point = self.generate_crash_point()
                self.phase = "betting"
                self.betting_ends_at = time.time() + settings.bet_phase_seconds
                self.started_at = None  # ⬅️ важно, сбрасываем
                # --- СОЗДАЁМ НОВЫЙ РАУНД ---
                db = SessionLocal()
                try:
                    # получаем последний номер раунда
                    last_number = db.query(CrashRounds.round_number).order_by(CrashRounds.id.desc()).first()
                    next_number = (last_number[0] + 1) if last_number else 1

                    new_round = CrashRounds(
                        round_number=next_number,
                        crash_point=self.crash_point,
                        started_at=None,
                        ended_at=None,
                        total_bet=0,
                        total_payout=0
                    )

                    db.add(new_round)
                    db.commit()
                    db.refresh(new_round)
                    self.round_id = new_round.id
                finally:
                    db.close()

                # --- ПЕРЕНОС ОТЛОЖЕННЫХ СТАВОК ТОЛЬКО ОДИН РАЗ ---
                pending = list(self.next_round_pending_bets)
                self.next_round_pending_bets.clear()

                if pending:
                    db = SessionLocal()
                    try:
                        for p in pending:
                            user = db.query(Users).filter(Users.id == p["user_id"]).with_for_update().first()
                            if not user:
                                continue

                            amount = p["amount"]
                            gift = p["gift"]
                            gift_id = p["gift_id"]
                            auto_cashout_x = p["auto_cashout_x"]

                            balance_before = user.balance

                            # --- TON ставка ---
                            if not gift:
                                if user.balance < amount:
                                    continue
                                user.balance -= amount

                            # --- Gift ставка ---
                            else:
                                gift_item = None
                                for item in user.inventory or []:
                                    if str(item.get("drop_id")) == str(gift_id):
                                        gift_item = item
                                        break
                                if not gift_item:
                                    continue

                                from sqlalchemy.ext.mutable import MutableDict
                                idx = user.inventory.index(gift_item)
                                gift_item = MutableDict(gift_item)
                                user.inventory[idx] = gift_item

                                from app.models import Drops
                                drop = db.query(Drops).filter(Drops.id == gift_id).first()
                                if not drop:
                                    continue

                                amount = drop.price
                                gift_item["count"] -= 1
                                if gift_item["count"] <= 0:
                                    user.inventory.remove(gift_item)

                            # ---- создаём CrashBet ----
                            bet = CrashBets(
                                round_id=self.round_id,
                                user_id=p["user_id"],
                                amount=amount,
                                gift=gift,
                                gift_id=gift_id,
                                cashout_multiplier=None,
                                profit=None,
                                auto_cashout_x=auto_cashout_x,
                                created_at=datetime.utcnow(),
                            )
                            db.add(bet)
                            db.flush()

                            # ---- транзакция ----
                            tx = Transactions(
                                user_id=p["user_id"],
                                type="crash_bet_gift" if gift else "crash_bet",
                                amount=amount,
                                balance_before=balance_before,
                                balance_after=user.balance,
                                related_round_id=self.round_id,
                                created_at=datetime.utcnow()
                            )
                            db.add(tx)

                            # ---- сохраняем в память ----
                            st = CrashBetState(p["user_id"], amount)
                            st.db_id = bet.id
                            st.auto_cashout_x = auto_cashout_x
                            self.bets[p["user_id"]] = st

                        db.commit()
                    finally:
                        db.close()

            # ---- ОПОВЕЩАЕМ О НОВОМ РАУНДЕ ----
            await self.broadcast({
                "event": "new_round",
                "round_id": self.round_id,
                "crash_point_max_hint": self.crash_point,
                "betting_ends_at": self.betting_ends_at
            })

            await asyncio.sleep(settings.bet_phase_seconds)

            async with self.lock:
                self.phase = "running"
                self.started_at = time.monotonic()
                self.betting_ends_at = None

            await self.broadcast({"event": "round_start"})

            tick_s = settings.tick_ms / 1000

            while True:
                async with self.lock:
                    elapsed = time.monotonic() - self.started_at
                    current_x = self.calc_multiplier(elapsed)

                    if current_x >= self.crash_point:
                        break

                    self.multiplier = current_x

                    # AUTO CASHOUT
                    for uid, bet in list(self.bets.items()):
                        if bet.auto_cashout_x is not None and bet.cashout_x is None:
                            if current_x >= bet.auto_cashout_x:
                                await self._auto_cashout(uid, bet.auto_cashout_x)

                await self.broadcast({
                    "event": "tick",
                    "round_id": self.round_id,
                    "multiplier": current_x,
                })

                await asyncio.sleep(tick_s)

            async with self.lock:
                self.phase = "crashed"
                crashed_x = self.crash_point

            await self.broadcast({
                "event": "crash",
                "multiplier": crashed_x,
            })

            await self._finalize_losers()

            await asyncio.sleep(settings.pause_between_rounds)

    # -----------------------------------------------------------------
    # FINALIZE LOSERS
    # -----------------------------------------------------------------
    async def _finalize_losers(self):
        async with self.lock:
            losers = [b for b in self.bets.values() if b.cashout_x is None]
            round_id = self.round_id

        if not losers:
            return

        db = SessionLocal()
        try:
            for bet in losers:
                bet_row = db.get(CrashBets, bet.db_id)

                if bet_row:
                    bet_row.cashout_multiplier = None
                    bet_row.profit = -bet.amount

            db.commit()
        finally:
            db.close()


# GLOBAL ENGINE INSTANCE
crash_engine = CrashEngine()
