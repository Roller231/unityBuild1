# app/routers/crash_ws_router.py
from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from app.core.security import verify_ws_token
from app.services.crash_engine import crash_engine

router = APIRouter(prefix="/ws", tags=["Crash WebSocket"])

@router.websocket("/crash")
async def crash_ws(websocket: WebSocket):
    await websocket.accept()

    # простая проверка токена
    await verify_ws_token(websocket)

    await crash_engine.add_client(websocket)

    try:
        while True:
            data = await websocket.receive_json()
            event = data.get("event")

            if event == "bet":
                user_id = int(data["user_id"])
                amount = float(data["amount"])
                result = await crash_engine.place_bet(user_id, amount)
                await websocket.send_json({"event": "bet_result", **result})

            elif event == "cashout":
                user_id = int(data["user_id"])
                result = await crash_engine.cashout(user_id)
                await websocket.send_json({"event": "cashout_result", **result})

            else:
                await websocket.send_json({"event": "error", "error": "unknown_event"})
    except WebSocketDisconnect:
        await crash_engine.remove_client(websocket)
