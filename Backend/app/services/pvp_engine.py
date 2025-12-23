# app/services/pvp_engine.py

import asyncio
import random
from datetime import datetime
from time import time
from typing import Dict, Optional, Set
from app.core.config import settings
from fastapi import WebSocket
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.database import SessionLocal
from app.models import Users, Drops, CrashBots
from app.models.pvp_games import PvPGames
from app.models.transactions import Transactions
from app.services.inventory_service import add_drop_to_inventory


# ---------------------------------------------------------------------
# INTERNAL PvP BET STATE (in-memory)
# ---------------------------------------------------------------------
class PvPBetState:
    def __init__(self, user_id: int, amount: float):
        self.user_id = user_id
        self.amount = amount
        self.bot_id: Optional[int] = None
        self.bot_bet: Optional[float] = None
        self.result: Optional[str] = None


# ---------------------------------------------------------------------
# PvP ENGINE
# ---------------------------------------------------------------------
class PvPEngine:
    def __init__(self):
        self.clients: Set[WebSocket] = set()
        self.lock = asyncio.Lock()

        # in-memory bets
        self.bets: Dict[int, PvPBetState] = {}

        # live bots feed
        self.active_bots = []

        self.active_bot_ids: Set[int] = set()
        self.bot_cooldowns: Dict[int, float] = {}  # bot_id -> timestamp
    # -------------------------------------------------------------
    # WEBSOCKET MANAGEMENT
    # -------------------------------------------------------------
    async def add_client(self, ws: WebSocket):
        async with self.lock:
            self.clients.add(ws)

        # сразу отдаём текущих ботов
        await ws.send_json({
            "event": "pvp_bots_update",
            "bots": self.active_bots
        })

    async def remove_client(self, ws: WebSocket):
        async with self.lock:
            self.clients.discard(ws)

    async def broadcast(self, payload: dict):
        dead = []
        for ws in list(self.clients):
            try:
                await ws.send_json(payload)
            except Exception:
                dead.append(ws)

        for ws in dead:
            await self.remove_client(ws)

    # -------------------------------------------------------------
    # LIVE FEED BOT LOOP
    # -------------------------------------------------------------
    async def bots_loop(self):
        while True:
            await asyncio.sleep(
                random.uniform(
                    settings.pvp_bot_spawn_min_sec,
                    settings.pvp_bot_spawn_max_sec
                )
            )

            if not self.clients:
                continue

            now = time()

            db: Session = SessionLocal()
            try:
                bots = db.query(CrashBots).all()
                if not bots:
                    continue

                # ❌ исключаем активных и на кулдауне
                available_bots = [
                    b for b in bots
                    if b.id not in self.active_bot_ids
                       and self.bot_cooldowns.get(b.id, 0) <= now
                ]

                if not available_bots:
                    continue

                bot = random.choice(available_bots)
                bet = round(random.uniform(bot.min_bet, bot.max_bet), 2)

                bot_state = {
                    "id": f"{bot.id}-{random.randint(1000, 9999)}",
                    "bot_id": bot.id,
                    "nickname": bot.nickname,
                    "avatar_url": bot.avatar_url,
                    "bet": bet,
                    "status": "in_battle"
                }

                async with self.lock:
                    self.active_bots.append(bot_state)
                    self.active_bots = self.active_bots[-3:]
                    self.active_bot_ids.add(bot.id)

                await self.broadcast({
                    "event": "pvp_bots_update",
                    "bots": self.active_bots
                })

                asyncio.create_task(self.bot_lifecycle(bot_state))

            finally:
                db.close()

    async def bot_lifecycle(self, bot_state: dict):
        # ⏳ бой
        await asyncio.sleep(
            random.uniform(
                settings.pvp_fight_min_sec,
                settings.pvp_fight_max_sec
            )
        )

        bot_state["status"] = random.choice(["win", "lose"])

        await self.broadcast({
            "event": "pvp_bots_update",
            "bots": self.active_bots
        })

        # ⏳ пауза перед уходом
        await asyncio.sleep(
            random.uniform(
                settings.pvp_bot_leave_delay_min_sec,
                settings.pvp_bot_leave_delay_max_sec
            )
        )

        cooldown = random.uniform(
            settings.pvp_bot_cooldown_min_sec,
            settings.pvp_bot_cooldown_max_sec
        )

        async with self.lock:
            self.active_bots = [
                b for b in self.active_bots if b["id"] != bot_state["id"]
            ]

            self.active_bot_ids.discard(bot_state["bot_id"])
            self.bot_cooldowns[bot_state["bot_id"]] = time() + cooldown

        await self.broadcast({
            "event": "pvp_bots_update",
            "bots": self.active_bots
        })

    # -------------------------------------------------------------
    # PLACE BET (MAIN GAME)
    # -------------------------------------------------------------
    async def place_bet(
        self,
        user_id: int,
        amount: float,
        gift: bool = False,
        gift_id: Optional[int] = None
    ) -> dict:

        async with self.lock:
            db: Session = SessionLocal()
            try:
                user = db.query(Users).filter(Users.id == user_id).with_for_update().first()
                if not user:
                    return {"ok": False, "error": "user_not_found"}

                import json
                user_bet_amount = amount  # то, что реально ставит юзер (для фронта)
                bet_value = amount  # внутренняя стоимость ставки

                # -------------------------------------------------
                # GIFT BET — как в roulette (100% dirty)
                # -------------------------------------------------
                if gift:
                    if not gift_id:
                        return {"ok": False, "error": "gift_id_required"}

                    # ищем подарок в инвентаре
                    gift_item = None
                    for item in user.inventory or []:
                        if int(item.get("drop_id")) == int(gift_id) and int(item.get("count", 0)) > 0:
                            gift_item = item
                            break

                    if not gift_item:
                        return {"ok": False, "error": "gift_not_in_inventory"}

                    # цена подарка
                    drop = db.query(Drops).filter_by(id=int(gift_id)).first()
                    if not drop:
                        return {"ok": False, "error": "gift_not_found"}

                    bet_value = float(drop.price)  # стоимость подарка
                    user_bet_amount = 0  # 👈 ВАЖНО: ставка подарком

                    # ✅ мутируем как в рулетке: новый MutableList + MutableDict
                    from sqlalchemy.ext.mutable import MutableDict, MutableList

                    inventory = MutableList(list(user.inventory or []))  # новый объект списка
                    idx = inventory.index(gift_item)

                    mutable_item = MutableDict(dict(gift_item))  # новый объект dict
                    mutable_item["count"] = int(mutable_item.get("count", 0)) - 1

                    if mutable_item["count"] <= 0:
                        inventory.pop(idx)
                    else:
                        inventory[idx] = mutable_item

                    user.inventory = inventory




                # -------------------------------------------------
                # TON BET
                # -------------------------------------------------
                else:
                    if user.balance < amount:
                        return {"ok": False, "error": "not_enough_balance"}
                    bet_value = amount
                    user_bet_amount = amount

                    balance_before = user.balance
                    user.balance -= amount

                    tx = Transactions(
                        user_id=user_id,
                        type="pvp_bet",
                        amount=bet_value,
                        balance_before=balance_before,
                        balance_after=user.balance,
                        created_at=datetime.utcnow()
                    )
                    db.add(tx)

                # -------------------------------------------------
                # BOT PICK (SAFE)
                # -------------------------------------------------
                bots = db.query(CrashBots).all()
                if not bots:
                    return {"ok": False, "error": "bot_not_found"}

                bot = random.choice(bots)

                bot_data = {
                    "id": bot.id,
                    "nickname": bot.nickname,
                    "avatar_url": bot.avatar_url,
                }

                bot_bet_payload = self.generate_bot_bet_relative(
                    db=db,
                    user_amount=bet_value,
                    force_type="gift" if gift else "coins"
                )

                if bot_bet_payload["type"] == "coins":
                    bot_bet = bot_bet_payload["amount"]
                else:
                    bot_bet = bot_bet_payload["gift"]["price"]

                # -------------------------------------------------
                # RESULT (50%)
                # -------------------------------------------------
                roll = random.random()
                acc = settings.pvp_win_chance

                if roll < acc:
                    result = "win"
                else:
                    acc += settings.pvp_lose_chance
                    if roll < acc:
                        result = "lose"
                    else:
                        result = "draw"

                # -------------------------------------------------
                # RESULT HANDLING
                # -------------------------------------------------
                if result == "win":
                    balance_before = user.balance

                    # 💰 coins vs coins
                    if bot_bet_payload["type"] == "coins":
                        payout = bet_value + bot_bet
                        user.balance += payout

                    # 🎁 gift vs gift
                    else:
                        # возвращаем подарок игрока
                        add_drop_to_inventory(
                            user=user,
                            drop_id=gift_id,
                            count=1
                        )

                        # даём подарок бота
                        add_drop_to_inventory(
                            user=user,
                            drop_id=bot_bet_payload["gift"]["id"],
                            count=1
                        )

                    tx = Transactions(
                        user_id=user_id,
                        type="pvp_win",
                        amount=bet_value,
                        balance_before=balance_before,
                        balance_after=user.balance,
                        created_at=datetime.utcnow()
                    )
                    db.add(tx)

                elif result == "draw":
                    # 🤝 НИЧЬЯ — возвращаем ставку игроку

                    if gift:
                        # возвращаем подарок
                        add_drop_to_inventory(
                            user=user,
                            drop_id=gift_id,
                            count=1
                        )
                    else:
                        balance_before = user.balance
                        user.balance += bet_value

                        tx = Transactions(
                            user_id=user_id,
                            type="pvp_draw",
                            amount=bet_value,
                            balance_before=balance_before,
                            balance_after=user.balance,
                            created_at=datetime.utcnow()
                        )
                        db.add(tx)

                # lose — ничего не делаем

                # -------------------------------------------------
                # SAVE GAME
                # -------------------------------------------------
                game = PvPGames(
                    user_id=user_id,
                    bot_id=bot_data["id"],
                    bot_bet=bot_bet,
                    user_bet=user_bet_amount,
                    gift=gift,
                    gift_id=gift_id,
                    result=result,
                    created_at=datetime.utcnow()
                )

                db.add(game)
                db.commit()

            finally:
                db.close()

        return {
            "ok": True,
            "result": result,
            "bot": {
                "id": bot_data["id"],
                "nickname": bot_data["nickname"],
                "avatar_url": bot_data["avatar_url"],
                **bot_bet_payload
            }
        ,
            "user_bet": user_bet_amount,
            "bot_bet": bot_bet,
        }

    def generate_bot_bet_relative(
            self,
            db: Session,
            user_amount: float,
            force_type: str  # "coins" | "gift"
    ) -> dict:
        """
        Бот ставит ТОЛЬКО тем же типом, что и пользователь
        """
        deviation = random.uniform(
            settings.pvp_bot_deviation_min,
            settings.pvp_bot_deviation_max
        )
        sign = random.choice([-1, 1])
        target = round(max(0.1, user_amount * (1 + sign * deviation)), 2)

        # -------------------------
        # COINS → COINS
        # -------------------------
        if force_type == "coins":
            return {
                "type": "coins",
                "amount": target
            }

        # -------------------------
        # GIFT → GIFT
        # -------------------------
        drops = db.query(Drops).all()
        if not drops:
            # fallback — если дропов нет, хотя быть не должно
            return {
                "type": "coins",
                "amount": target
            }

        # ближайший по цене дроп
        drop = min(drops, key=lambda d: abs(float(d.price) - target))

        return {
            "type": "gift",
            "gift": {
                "id": drop.id,
                "price": float(drop.price),
                "icon": getattr(drop, "icon", None),
                "name": getattr(drop, "name", None),
            }
        }


# GLOBAL INSTANCE
pvp_engine = PvPEngine()
