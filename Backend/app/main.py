# app/main.py
import asyncio
from fastapi import FastAPI

from app.database import Base, engine
from app.models import *  # чтобы create_all видел все таблицы

from app.routers import (
    drops_router,
    cases_router,
    case_drops_router,
    users_router,
    crash_rounds_router,
    crash_bets_router,
    transactions_router,
)
from app.routers import crash_ws_router
from app.services.crash_engine import crash_engine

Base.metadata.create_all(bind=engine)

app = FastAPI(title="Krash Backend")

# REST роутеры
app.include_router(drops_router.router)
app.include_router(cases_router.router)
app.include_router(case_drops_router.router)
app.include_router(users_router.router)
app.include_router(crash_rounds_router.router)
app.include_router(crash_bets_router.router)
app.include_router(transactions_router.router)

# WebSocket роутер
app.include_router(crash_ws_router.router)


@app.on_event("startup")
async def startup_event():
    # запускаем бесконечный Crash-цикл
    asyncio.create_task(crash_engine.game_loop())
