import anyio
import httpx
from datetime import datetime
from typing import Iterable, Optional

# =================================================
# 🤖 BOT ДЛЯ ВЫВОДОВ
# =================================================

WITHDRAW_BOT_TOKEN = "8373168551:AAF8tmoeEJy0hHqprfPaoVUpw_siMWbBlLE"
WITHDRAW_TG_API = f"https://api.telegram.org/bot{WITHDRAW_BOT_TOKEN}"

ADMIN_TG_IDS = [
    1008871802,
    414135760,
]

# ❗ адрес твоего backend
BACKEND_BASE_URL = "https://ggcat.org"


# =================================================
# 🧠 HELPERS
# =================================================

async def _send_message(chat_id: int, payload: dict):
    async with httpx.AsyncClient(timeout=10) as client:
        await client.post(
            f"{WITHDRAW_TG_API}/sendMessage",
            json=payload,
        )


async def _notify_admins(chat_ids: Iterable[int], payload: dict):
    for admin_id in chat_ids:
        try:
            payload_with_chat = payload | {"chat_id": admin_id}
            await _send_message(admin_id, payload_with_chat)
        except Exception as e:
            # ❌ ничего не ломаем
            print(f"[WITHDRAW_TG_ERROR] {admin_id}: {e}")


# =================================================
# 🔔 ПУБЛИЧНАЯ ФУНКЦИЯ (ВЫЗЫВАЕШЬ ЕЁ)
# =================================================

def notify_withdraw_request(
    *,
    request_id: int,
    user_id: int,
    username: Optional[str],
    tg_id: Optional[str],
    withdraw_type: str,
    ton_amount: Optional[float],
    drop_id: Optional[int],
):
    """
    🔔 Безопасно вызывается из sync FastAPI роутов
    """

    type_label = "💎 TON" if withdraw_type == "ton" else "🎁 DROP"

    amount_text = (
        f"<b>{ton_amount} TON</b>"
        if withdraw_type == "ton"
        else f"Drop ID: <code>{drop_id}</code>"
    )

    text = (
        "📤 <b>НОВАЯ ЗАЯВКА НА ВЫВОД</b>\n\n"
        f"🆔 Request ID: <code>{request_id}</code>\n"
        f"👤 User ID: <code>{user_id}</code>\n"
        f"👤 Username: @{username if username else '—'}\n"
        f"📨 TG ID: <code>{tg_id if tg_id else '—'}</code>\n\n"
        f"📦 Тип: {type_label}\n"
        f"💰 Сумма: {amount_text}\n\n"
        f"🕒 {datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S')} UTC"
    )

    keyboard = {
        "inline_keyboard": [
            [
                {
                    "text": "✅ Подтвердить",
                    "url": f"{BACKEND_BASE_URL}/withdraw/{request_id}/complete",
                },
                {
                    "text": "❌ Отменить",
                    "url": f"{BACKEND_BASE_URL}/withdraw/{request_id}/cancel",
                },
            ]
        ]
    }

    payload = {
        "text": text,
        "parse_mode": "HTML",
        "reply_markup": keyboard,
        "disable_web_page_preview": True,
    }

    # ✅ КЛЮЧЕВОЙ МОМЕНТ — ТОЧНО КАК У ТЕБЯ В DEPOSIT
    anyio.from_thread.run(_notify_admins, ADMIN_TG_IDS, payload)
