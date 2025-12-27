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

WEBAPP_URL = "https://unity-build1-r7zk.vercel.app/"

# ============================================

bot = Bot(BOT_TOKEN)
dp = Dispatcher()

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

    # ----------- USER / REF LOGIC (КАК БЫЛО) -----------
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

    # ----------- TEXTS FROM DB -----------
    start_text_raw = await fetch_setting("start_text")
    ref_text_raw = await fetch_setting("ref_text")

    variables = {
        "firstname": firstname,
        "username": username,
        "inviter": inviter_name
    }

    main_text, btn_text = render_template(start_text_raw, variables)

    if inviter_name and ref_text_raw:
        ref_text, _ = render_template(ref_text_raw, variables)
        main_text += f"\n\n{ref_text}"

    # ----------- BUTTON -----------
    keyboard = InlineKeyboardMarkup(
        inline_keyboard=[
            [
                InlineKeyboardButton(
                    text=btn_text,
                    web_app=WebAppInfo(url=WEBAPP_URL)
                )
            ]
        ]
    )

    await message.answer(
        main_text,
        reply_markup=keyboard,
        parse_mode="Markdown"
    )

# ================== START ==================

async def main():
    await dp.start_polling(bot)

if __name__ == "__main__":
    asyncio.run(main())
