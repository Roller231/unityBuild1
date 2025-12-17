import asyncio
import random
import time
from app.database import SessionLocal
from app.crud.crash_bots_crud import get_all_bots
from app.services.crash_engine import crash_engine
from app.models import Drops

async def bot_loop():
    db = SessionLocal()
    bots = get_all_bots(db)
    drops = db.query(Drops).all()  # ✅ все дропы

    print(f"🤖 Loaded {len(bots)} bots")

    # 🟣 запоминаем когда последний раз бот делал ставку
    last_bet_time = {}

    while True:
        await asyncio.sleep(random.uniform(2, 6))

        if crash_engine.phase != "betting":
            continue

        bot = random.choice(bots)
        now = time.time()

        # ---------------------------------------------
        # 🛑 Анти-спам: бот может ставить только 1 раз в 30 сек
        # ---------------------------------------------
        if bot.id in last_bet_time:
            if now - last_bet_time[bot.id] < 30:
                # print(f"⏳ BOT {bot.nickname} пропускает — cooldown {30 - (now - last_bet_time[bot.id]):.1f} sec")
                continue
        gift = random.choice([True, False])
        # Запоминаем время ставки
        last_bet_time[bot.id] = now
        gift_id = None
        if gift and drops:
            drop = random.choice(drops)
            gift_id = drop.id
        amount = round(random.uniform(bot.min_bet, bot.max_bet), 2)


        auto_cashout_x = round(random.uniform(1.5, 3.0), 2)

        print(
            f"🤖 BOT [{bot.nickname}] (ID={bot.id}) ставит {amount} "
            f"{'🎁 gift' if gift else ''} в раунд {crash_engine.round_id} "
            f"(auto {auto_cashout_x}x)"
        )

        await crash_engine.place_bet(
            user_id=-bot.id,
            amount=amount,
            gift=int(gift),
            gift_id=gift_id,
            auto_cashout_x=auto_cashout_x
        )
