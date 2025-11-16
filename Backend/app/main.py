# main.py

import asyncio
import random
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings

from app.database import Base, engine
from app.models import *

from app.routers import (
    drops_router,
    cases_router,
    case_drops_router,
    users_router,
    crash_rounds_router,
    crash_bets_router,
    transactions_router,
    crash_ws_router,
    drops_ws_router
)

from app.services.crash_engine import crash_engine

app = FastAPI(title="Krash Backend")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

Base.metadata.create_all(bind=engine)

# REST endpoints
app.include_router(drops_router.router)
app.include_router(cases_router.router)
app.include_router(case_drops_router.router)
app.include_router(users_router.router)
app.include_router(crash_rounds_router.router)
app.include_router(crash_bets_router.router)
app.include_router(transactions_router.router)

# WS endpoints
app.include_router(crash_ws_router.router)
app.include_router(drops_ws_router.router)


# 🔥 GLOBAL DROP STREAM
async def drop_global_stream():
    await asyncio.sleep(1)
    print("🔥 DROP STREAM STARTED")

    while True:

        if drops_ws_router.clients:

            # получаем дропы из DB
            drops = drops_ws_router.get_drops_direct()

            if not drops:
                print("⚠️ No drops in DB")
                await asyncio.sleep(2)
                continue

            drop = random.choice(drops)

            print(f"🎁 Sending drop: {drop} to {len(drops_ws_router.clients)} clients")

            for ws in list(drops_ws_router.clients):
                try:
                    await ws.send_json({"event": "drop", "data": drop})
                except Exception as e:
                    print(f"⚠️ WS error: {e}")
                    drops_ws_router.clients.remove(ws)

        await asyncio.sleep(settings.drop_interval_seconds)


@app.on_event("startup")
async def startup_event():
    asyncio.create_task(crash_engine.game_loop())
    asyncio.create_task(drop_global_stream())
