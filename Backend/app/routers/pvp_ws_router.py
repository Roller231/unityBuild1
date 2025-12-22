# app/routers/pvp_ws_router.py

from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from app.core.security import verify_ws_token
from app.services.pvp_engine import pvp_engine

router = APIRouter(prefix="/ws", tags=["PvP WebSocket"])

@router.websocket("/pvp")
async def pvp_ws(websocket: WebSocket):
    await websocket.accept()
    await pvp_engine.add_client(websocket)

    try:
        while True:
            data = await websocket.receive_json()
            event = data.get("event")

            if event == "bet":
                try:
                    result = await pvp_engine.place_bet(
                        user_id=int(data["user_id"]),
                        amount=float(data.get("amount", 0)),
                        gift=bool(data.get("gift", False)),
                        gift_id=data.get("gift_id")
                    )

                    await websocket.send_json({
                        "event": "pvp_result",
                        **result
                    })

                except Exception as e:
                    # 🔥 ВОТ ОН — ТЕКСТ ОШИБКИ
                    await websocket.send_json({
                        "event": "pvp_result",
                        "ok": False,
                        "error": "internal_error",
                        "detail": str(e)
                    })

    except WebSocketDisconnect:
        await pvp_engine.remove_client(websocket)
