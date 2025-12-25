# app/routers/online_ws_router.py

from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from app.services.online_engine import online_engine

router = APIRouter(prefix="/ws", tags=["Online"])

@router.websocket("/online")
async def online_ws(ws: WebSocket):
    await ws.accept()
    await online_engine.add_client(ws)

    try:
        while True:
            await ws.receive_text()
    except WebSocketDisconnect:
        await online_engine.remove_client(ws)
