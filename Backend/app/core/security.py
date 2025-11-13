# app/core/security.py
from fastapi import WebSocket, WebSocketException, status
from app.core.config import settings

async def verify_ws_token(websocket: WebSocket):
    token = websocket.query_params.get("token")
    if not token or token != settings.ws_token:
        # можно отправить сообщение и закрыть
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
        raise WebSocketException(code=status.WS_1008_POLICY_VIOLATION, reason="Invalid token")
