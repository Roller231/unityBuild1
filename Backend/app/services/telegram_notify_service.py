import anyio
import httpx
import asyncio
from datetime import datetime
from typing import Iterable, Optional

# =================================================
# 🔔 НАСТРОЙКИ (ПРЯМО В КОДЕ)
# =================================================

# ❗ ТЕСТОВЫЙ BOT TOKEN (как ты просил)
BOT_TOKEN = "8577709747:AAGg7kbQhP90gvOCJj5FPSiClgIdcZkPgsM"

# Кому слать уведомления
ADMIN_TG_IDS = [
    1008871802,
    7296978075,
]

TELEGRAM_API = f"https://api.telegram.org/bot{BOT_TOKEN}"


# =================================================
# 🧠 ВНУТРЕННИЕ ХЕЛПЕРЫ
# =================================================

async def _send_message(chat_id: int, text: str):
    async with httpx.AsyncClient(timeout=5) as client:
        await client.post(
            f"{TELEGRAM_API}/sendMessage",
            json={
                "chat_id": chat_id,
                "text": text,
                "parse_mode": "HTML",
                "disable_web_page_preview": True,
            },
        )


async def _notify_many(chat_ids: Iterable[int], text: str):
    for tg_id in chat_ids:
        try:
            await _send_message(tg_id, text)
        except Exception as e:
            # ❌ НИЧЕГО НЕ ЛОМАЕМ, ТОЛЬКО ЛОГ
            print(f"[TG_NOTIFY_ERROR] {tg_id}: {e}")


# =================================================
# 🔥 ПУБЛИЧНАЯ ФУНКЦИЯ (ЮЗАЕШЬ ЕЁ)
# =================================================

def notify_success_deposit(
    *,
    user_id: int,
    username: str | None,
    amount: float,
    currency: str,
    bonus: float = 0.0,
):
    """
    🔔 Отправляет уведомление админам о УСПЕШНОМ депозите.
    Без await — безопасно для FastAPI.
    """

    text = (
        "💰 <b>УСПЕШНЫЙ ДЕПОЗИТ</b>\n\n"
        f"🆔 User ID: <code>{user_id}</code>\n"
        f"👤 Username: @{username if username else '—'}\n\n"
        f"💵 Сумма: <b>{amount}</b> {currency}\n"
        f"🎁 Бонус: <b>{bonus}</b>\n\n"
        f"🕒 {datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S')} UTC"
    )

    # 🚀 не блокируем основной поток
    asyncio.create_task(_notify_many(ADMIN_TG_IDS, text))


# =================================================
# 👤 УВЕДОМЛЕНИЕ О РЕГИСТРАЦИИ
# =================================================

def notify_user_registration(
    *,
    user_id: int,
    tg_id: Optional[str],
    username: Optional[str],
):
    """
    Безопасно вызывается из sync FastAPI роутов
    """

    text = (
        "🆕 <b>НОВАЯ РЕГИСТРАЦИЯ</b>\n\n"
        f"🆔 User ID: <code>{user_id}</code>\n"
        f"📨 TG ID: <code>{tg_id if tg_id else '—'}</code>\n"
        f"👤 Username: @{username if username else '—'}\n"
        f"🕒 {datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S')} UTC"
    )

    # ✅ КЛЮЧЕВОЙ ФИКС
    anyio.from_thread.run(_notify_many, ADMIN_TG_IDS, text)