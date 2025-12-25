import asyncio
import aiohttp

from aiogram import Bot, Dispatcher
from aiogram.filters import CommandStart
from aiogram.types import (
    Message,
    InlineKeyboardMarkup,
    InlineKeyboardButton,
    WebAppInfo, PreCheckoutQuery
)

from config import BOT_TOKEN, API_URL


BOT_USERNAME = "ggcat_game_bot"

bot = Bot(BOT_TOKEN)
dp = Dispatcher()


# ---------- API FUNCTIONS ----------

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


# ---------- GET AVATAR URL ----------

async def get_avatar_url(user_id: int) -> str | None:
    photos = await bot.get_user_profile_photos(user_id, limit=1)

    if photos.total_count == 0:
        return None

    file_id = photos.photos[0][-1].file_id
    file = await bot.get_file(file_id)

    return f"https://api.telegram.org/file/bot{BOT_TOKEN}/{file.file_path}"


# ---------- /start HANDLER ----------

@dp.message(CommandStart())
async def start_handler(message: Message):
    tg_id = str(message.from_user.id)
    username = message.from_user.username
    firstname = message.from_user.first_name

    # ref из /start
    ref_param = None
    parts = message.text.split()
    if len(parts) > 1:
        ref_param = parts[1]

    # проверяем пользователя
    user = await get_user_by_tg(tg_id)

    invited_text = ""

    # ---------- ЕСЛИ ПОЛЬЗОВАТЕЛЬ НОВЫЙ ----------
    if not user:
        # если пришёл по рефке — готовим текст
        if ref_param and ref_param != tg_id:
            referer = await get_user_by_tg(ref_param)
            if referer:
                inviter_name = referer.get("username") or referer.get("firstname") or "пользователем"
                invited_text = f"\n👥 **Вы приглашены пользователем:** `{inviter_name}`\n"

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

        # начисляем refcount ТОЛЬКО ОДИН РАЗ
        if ref_param and ref_param != tg_id:
            referer = await get_user_by_tg(ref_param)
            if referer:
                await increment_refcount(ref_param)

    # ---------- КНОПКА MINI APP ----------
    keyboard = InlineKeyboardMarkup(
        inline_keyboard=[
            [
                InlineKeyboardButton(
                    text="🚀 ИГРАТЬ",
                    web_app=WebAppInfo(
                        url="https://unity-build1-r7zk.vercel.app/"
                    )
                )
            ]
        ]
    )

    # ---------- СООБЩЕНИЕ ----------
    await message.answer(
        "🐱 **ggCat приветствует тебя!**\n\n"
        "🎰 Это игра *рулетка*\n"
        "💰 Крути — выигрывай — поднимай баланс\n"
        f"{invited_text}\n"
        "👇 Жми кнопку и играй прямо в Telegram!",
        reply_markup=keyboard,
        parse_mode="Markdown"
    )



# ---------- START ----------

async def main():
    await dp.start_polling(bot)


if __name__ == "__main__":
    asyncio.run(main())
