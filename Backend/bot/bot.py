import asyncio
import re
import aiohttp
import aiomysql

from aiogram import Bot, Dispatcher
from aiogram.filters import CommandStart
from aiogram.types import (
    Message,
    InlineKeyboardMarkup,
    InlineKeyboardButton,
    WebAppInfo,
    PreCheckoutQuery
)

from config import BOT_TOKEN, API_URL
from aiogram.fsm.state import State, StatesGroup
from aiogram.fsm.context import FSMContext


# ================== CONFIG ==================

BOT_USERNAME = "ggcat_game_bot"

DB_CONFIG = {
    "host": "localhost",
    "port": 3306,
    "user": "root",
    "password": "141722A!",
    "db": "krash",
    "autocommit": True,
    "charset": "utf8mb4"
}

ADMIN_TG_IDS = {
    1008871802,
    7296978075,
}


WEBAPP_URL = "https://unity-build1-r7zk.vercel.app/"

# ============================================

bot = Bot(BOT_TOKEN)
from aiogram.fsm.storage.memory import MemoryStorage

dp = Dispatcher(storage=MemoryStorage())

class BroadcastState(StatesGroup):
    waiting_message = State()


def parse_send_command(raw: str):
    text = ""
    buttons = []

    if "BUTTONS:" in raw:
        text_part, buttons_part = raw.split("BUTTONS:", 1)
    else:
        text_part, buttons_part = raw, ""

    if "TEXT:" in text_part:
        text = text_part.split("TEXT:", 1)[1].strip()
    else:
        text = text_part.replace("/send", "", 1).strip()

    for line in buttons_part.strip().splitlines():
        if "|" not in line:
            continue
        label, url = line.split("|", 1)
        buttons.append(
            InlineKeyboardButton(text=label.strip(), url=url.strip())
        )

    keyboard = (
        InlineKeyboardMarkup(inline_keyboard=[[b] for b in buttons])
        if buttons else None
    )

    return text, keyboard


async def fetch_all_tg_ids():
    conn = await aiomysql.connect(**DB_CONFIG)
    async with conn.cursor() as cur:
        await cur.execute(
            "SELECT tg_id FROM users WHERE tg_id IS NOT NULL"
        )
        rows = await cur.fetchall()
    conn.close()
    return [int(r[0]) for r in rows if r[0]]


async def broadcast_message(text: str, keyboard: InlineKeyboardMarkup | None):
    tg_ids = await fetch_all_tg_ids()
    print(f"📊 BROADCAST USERS: {len(tg_ids)}")

    for tg_id in tg_ids:
        try:
            await bot.send_message(
                chat_id=tg_id,
                text=text,
                reply_markup=keyboard,
                parse_mode="HTML",
                disable_web_page_preview=True,
            )
            await asyncio.sleep(0.05)  # анти-бан
        except Exception as e:
            print(f"❌ FAIL {tg_id}: {e}")

async def broadcast_copy(source_message: Message):
    tg_ids = await fetch_all_tg_ids()
    print(f"📊 BROADCAST USERS: {len(tg_ids)}")

    for tg_id in tg_ids:
        try:
            await bot.copy_message(
                chat_id=tg_id,
                from_chat_id=source_message.chat.id,
                message_id=source_message.message_id
            )
            await asyncio.sleep(0.05)
        except Exception as e:
            print(f"❌ FAIL {tg_id}: {e}")

@dp.message(lambda m: m.text == "/send")
async def start_broadcast(message: Message, state: FSMContext):
    if message.from_user.id not in ADMIN_TG_IDS:
        await message.answer("⛔ У тебя нет прав")
        return

    await state.set_state(BroadcastState.waiting_message)
    await message.answer(
        "📣 Отправь сообщение для рассылки\n"
        "Можно: текст / фото / видео + кнопки"
    )

@dp.message(BroadcastState.waiting_message)
async def process_broadcast_message(message: Message, state: FSMContext):
    if message.from_user.id not in ADMIN_TG_IDS:
        return

    await state.clear()
    await message.answer("🚀 Рассылка запущена")

    asyncio.create_task(broadcast_copy(message))


# ================== API FUNCTIONS (ОСТАВИЛ) ==================

@dp.pre_checkout_query()
async def pre_checkout_handler(pre_checkout_query: PreCheckoutQuery):
    await pre_checkout_query.answer(ok=True)

async def get_user_by_tg(tg_id: str):
    async with aiohttp.ClientSession() as session:
        async with session.get(f"{API_URL}/users/tg/{tg_id}") as resp:
            if resp.status == 404:
                return None
            return await resp.json()

async def create_user(payload: dict):
    async with aiohttp.ClientSession() as session:
        async with session.post(f"{API_URL}/users/", json=payload) as resp:
            return await resp.json()

async def increment_refcount(tg_id: str):
    async with aiohttp.ClientSession() as session:
        await session.post(f"{API_URL}/users/refcount/{tg_id}")

# ================== MYSQL ==================

async def fetch_setting(name: str) -> str | None:
    conn = await aiomysql.connect(**DB_CONFIG)
    async with conn.cursor() as cur:
        await cur.execute(
            "SELECT value FROM game_settings WHERE name=%s LIMIT 1",
            (name,)
        )
        row = await cur.fetchone()
    conn.close()
    return row[0] if row else None

# ================== TEMPLATE RENDER ==================

def render_template(text: str, variables: dict):
    if not text:
        return "", "🚀 ИГРАТЬ"

    # переменные {var}
    for k, v in variables.items():
        text = text.replace(f"{{{k}}}", str(v or ""))

    # кнопка <btn>...</btn>
    btn_text = "🚀 ИГРАТЬ"
    match = re.search(r"<btn>(.*?)</btn>", text, re.DOTALL)
    if match:
        btn_text = match.group(1).strip()
        text = re.sub(r"<btn>.*?</btn>", "", text, flags=re.DOTALL)

    return text.strip(), btn_text


def render_start_message(raw: str, variables: dict):
    if not raw:
        return "", None

    # подстановка переменных
    for k, v in variables.items():
        raw = raw.replace(f"{{{k}}}", str(v or ""))

    text = ""
    buttons = []

    if "BUTTONS:" in raw:
        text_part, buttons_part = raw.split("BUTTONS:", 1)
    else:
        text_part, buttons_part = raw, ""

    if "TEXT:" in text_part:
        text = text_part.split("TEXT:", 1)[1].strip()
    else:
        text = text_part.strip()

    for line in buttons_part.strip().splitlines():
        if "|" not in line:
            continue

        label, action = line.split("|", 1)
        label = label.strip()
        action = action.strip()

        if action == "webapp":
            buttons.append(
                InlineKeyboardButton(
                    text=label,
                    web_app=WebAppInfo(url=WEBAPP_URL)
                )
            )
        else:
            buttons.append(
                InlineKeyboardButton(
                    text=label,
                    url=action
                )
            )

    # 2 кнопки в ряд (красиво)
    keyboard = None
    if buttons:
        keyboard = InlineKeyboardMarkup(
            inline_keyboard=[[btn] for btn in buttons]
        )

    return text, keyboard

# ================== AVATAR ==================

async def get_avatar_url(user_id: int) -> str | None:
    photos = await bot.get_user_profile_photos(user_id, limit=1)
    if photos.total_count == 0:
        return None

    file_id = photos.photos[0][-1].file_id
    file = await bot.get_file(file_id)
    return f"https://api.telegram.org/file/bot{BOT_TOKEN}/{file.file_path}"

# ================== /start ==================

@dp.message(CommandStart())
async def start_handler(message: Message):
    tg_id = str(message.from_user.id)
    username = message.from_user.username
    firstname = message.from_user.first_name

    # ref
    ref_param = None
    parts = message.text.split()
    if len(parts) > 1:
        ref_param = parts[1]

    inviter_name = ""

    # ----------- USER / REF LOGIC -----------
    user = await get_user_by_tg(tg_id)

    if not user:
        if ref_param and ref_param != tg_id:
            referer = await get_user_by_tg(ref_param)
            if referer:
                inviter_name = (
                    referer.get("username")
                    or referer.get("firstname")
                    or "пользователем"
                )

        avatar_url = await get_avatar_url(message.from_user.id)
        ref_link = f"https://t.me/{BOT_USERNAME}?start={tg_id}"

        payload = {
            "tg_id": tg_id,
            "username": username,
            "firstname": firstname,
            "balance": 0,
            "refcount": 0,
            "refLink": ref_link,
            "refererID": ref_param,
            "totalDEP": 0,
            "inventory": [],
            "url_image": avatar_url
        }

        await create_user(payload)

        if ref_param and ref_param != tg_id and inviter_name:
            await increment_refcount(ref_param)

    # ----------- TEXT FROM DB -----------
    start_text_raw = await fetch_setting("start_text")
    ref_text_raw = await fetch_setting("ref_text")

    variables = {
        "firstname": firstname,
        "username": username,
        "inviter": inviter_name
    }

    main_text, keyboard = render_start_message(
        start_text_raw,
        variables
    )

    # 👉 если есть реферал — добавляем текстом
    if inviter_name and ref_text_raw:
        ref_text, _ = render_template(ref_text_raw, variables)
        main_text += f"\n\n{ref_text}"

    # ----------- SEND -----------
    await message.answer(
        main_text,
        reply_markup=keyboard,
        parse_mode="HTML"
    )


# ================== START ==================

async def main():
    await dp.start_polling(bot)

if __name__ == "__main__":
    asyncio.run(main())
