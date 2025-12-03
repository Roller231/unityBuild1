from fastapi import APIRouter, WebSocket
import asyncio
import random
from app.database import SessionLocal
from app.crud.crash_bots_crud import get_all_bots
from app.services.crash_engine import crash_engine

router = APIRouter(prefix="/ws", tags=["Crash Bots WS"])

@router.websocket("/crash-bots")
async def crash_bots_ws(websocket: WebSocket):
    await websocket.accept()
    print("🤖 BOT WS CONNECTED")

    db = SessionLocal()
    bots = get_all_bots(db)

    while True:
        await asyncio.sleep(random.uniform(2, 6))  # бот делает ставку каждые 2–6 сек

        if crash_engine.current_round is None:
            continue  # если нет раунда – не ставим

        bot = random.choice(bots)

        amount = round(random.uniform(bot.min_bet, bot.max_bet), 2)
        gift = random.choice([True, False])

        # Имитация JSON который отправляет клиент
        data = {
            "event": "bet",
            "user_id": -bot.id,              # отрицательные ID = боты
            "amount": amount,
            "gift": gift,
            "gift_id": 1,
            "auto_cashout_x": None
        }
        print(
            f"🤖 BOT [{bot.nickname}] (ID={bot.id}) сделал ставку "
            f"{amount} {'🎁(gift)' if gift else ''} в раунд {crash_engine.round_id}"
        )
        # Добавляем ставку напрямую в движок
        result = await crash_engine.place_bet(
            user_id=data["user_id"],
            amount=data["amount"],
            gift=data["gift"],
            gift_id=data["gift_id"],
            auto_cashout_x=None
        )

        # Отправляем назад боту чисто формально
        await websocket.send_json({"event": "bet_result", **result})
