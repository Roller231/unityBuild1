# app/routers/drops_ws_router.py

import asyncio
from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from sqlalchemy.orm import Session
from app.database import SessionLocal
from app.models import Drops


router = APIRouter(prefix="/ws", tags=["Drops WebSocket"])

clients = set()


# 🔥 получаем ТОЛЬКО live-дропы
def get_drops_direct():
    db: Session = SessionLocal()

    drops = (
        db.query(Drops)
        .filter(Drops.UseInLive == True)  # ✅ ВАЖНО
        .all()
    )

    db.close()

    return [
        {
            "id": d.id,
            "name": d.name,
            "icon": d.icon,
        }
        for d in drops
    ]


@router.websocket("/drops/global")
async def drops_global_ws(websocket: WebSocket):
    await websocket.accept()
    clients.add(websocket)

    print(f"🔌 Drops WS: client connected ({len(clients)} total)")

    try:
        while True:
            await asyncio.sleep(30)

    except WebSocketDisconnect:
        clients.remove(websocket)
        print(f"❌ Drops WS: client disconnected ({len(clients)} total)")
