# main.py

import asyncio
import random
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from sqladmin import Admin, ModelView

from app.core.config import settings
from app.database import Base, engine
from app.services.crash_bots_engine import bot_loop
# models
from app.models.users import Users
from app.models.drops import Drops
from app.models.cases import Cases
from app.models.case_drops import CaseDrops
from app.models.crash_bets import CrashBets
from app.models.crash_rounds import CrashRounds
from app.models.transactions import Transactions
from app.routers import crash_bots_router
from app.models.crash_bots import CrashBots
from app.models.promo_codes import PromoCodes
from app.models.user_promos import UserPromos
from app.models.referral_promos import ReferralPromos





# routers
from app.routers import (
    drops_router,
    cases_router,
    case_drops_router,
    users_router,
    crash_rounds_router,
    crash_bets_router,
    transactions_router,
    crash_ws_router,
    drops_ws_router,
    rates_router,
    games_router,
    promo_router
)

from app.services.crash_engine import crash_engine


# ---------------------------------------------------------
#                 APP CONFIG
# ---------------------------------------------------------
app = FastAPI(title="Krash Backend")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

import mimetypes

mimetypes.add_type("image/webp", ".webp")

app.mount(
    "/media",
    StaticFiles(directory="media"),
    name="media"
)

Base.metadata.create_all(bind=engine)


# ---------------------------------------------------------
#                 ROUTERS
# ---------------------------------------------------------
app.include_router(drops_router.router)
app.include_router(cases_router.router)
app.include_router(case_drops_router.router)
app.include_router(users_router.router)
app.include_router(crash_rounds_router.router)
app.include_router(crash_bets_router.router)
app.include_router(transactions_router.router)
app.include_router(crash_bots_router.router)
app.include_router(rates_router.router)
app.include_router(promo_router.router)
app.include_router(games_router.router)



# WS
app.include_router(crash_ws_router.router)
app.include_router(drops_ws_router.router)


# ---------------------------------------------------------
#                STREAM SYSTEM
# ---------------------------------------------------------
async def drop_global_stream():
    await asyncio.sleep(1)
    print("🔥 DROP STREAM STARTED")

    while True:
        if drops_ws_router.clients:

            drops = drops_ws_router.get_drops_direct()

            if not drops:
                print("⚠️ No drops in DB")
                await asyncio.sleep(2)
                continue

            drop = random.choice(drops)

            print(f"🎁 Sending drop: {drop} to {len(drops_ws_router.clients)} clients")

            for ws in list(drops_ws_router.clients):
                try:
                    await ws.send_json({"event": "drop", "data": drop})
                except Exception as e:
                    print(f"⚠️ WS error: {e}")
                    drops_ws_router.clients.remove(ws)

        await asyncio.sleep(settings.drop_interval_seconds)





@app.on_event("startup")
async def startup_event():
    asyncio.create_task(crash_engine.game_loop())
    asyncio.create_task(drop_global_stream())
    asyncio.create_task(bot_loop())  # ← запускаем ботов!

# ---------------------------------------------------------
#               🔥 FASTAPI ADMIN PANEL
# ---------------------------------------------------------

from sqladmin.authentication import AuthenticationBackend
from starlette.requests import Request


class SimpleAuth(AuthenticationBackend):
    async def login(self, request: Request) -> bool:
        form = await request.form()
        username = form.get("username")
        password = form.get("password")

        # ---------- ТУТ ЛОГИН/ПАРОЛЬ ----------
        if username == "admin" and password == "123456":
            request.session.update({"logged_in": True})
            return True

        return False

    async def logout(self, request: Request) -> bool:
        request.session.clear()
        return True

    async def authenticate(self, request: Request) -> bool:
        return request.session.get("logged_in", False)


admin = Admin(
    app,
    engine,
    authentication_backend=SimpleAuth(secret_key="supersecret"),
)


# =========================================================
#                ADMIN VIEWS (ПОЛНЫЙ РЕФАКТОР)
# =========================================================

# ------- USERS -------
class UsersAdmin(ModelView, model=Users):
    column_list = ["id", "username", "firstname", "balance", "refcount", "created_at"]
    form_excluded_columns = ["transactions", "crash_bets"]

class CrashBotsAdmin(ModelView, model=CrashBots):
    column_list = ["id", "nickname", "avatar_url", "min_bet", "max_bet"]


# ------- DROPS -------
class DropsAdmin(ModelView, model=Drops):
    column_list = ["id", "name", "rarity", "price", "icon", "created_at"]
    form_excluded_columns = ["case_drops"]


# ------- CASES -------
from sqlalchemy import text

class CasesAdmin(ModelView, model=Cases):
    column_list = [
        "id",
        "name",
        "price",
        "gradient_colors",
        "main_image",
        "created_at",
        "drops_pretty",
    ]

    def drops_pretty(self, obj):
        sql = text("""
            SELECT drops.name, case_drops.chance
            FROM case_drops
            JOIN drops ON drops.id = case_drops.drop_id
            WHERE case_drops.case_id = :case_id
        """)

        with engine.connect() as conn:
            rows = conn.execute(sql, {"case_id": obj.id}).fetchall()

        if not rows:
            return "-"

        return ", ".join(
            f"{name} ({chance}%)"
            for name, chance in rows
        )

    column_formatters = {
        "drops_pretty": lambda obj, value: CasesAdmin.drops_pretty(self=None, obj=obj)
    }

    form_excluded_columns = ["case_drops"]



# ------- CASE DROPS -------
class CaseDropsAdmin(ModelView, model=CaseDrops):
    column_list = ["case", "drop", "chance"]

    # чтобы выпадающие списки искали по названию дропа и кейса
    form_ajax_refs = {
        "case": {"fields": ["name"]},
        "drop": {"fields": ["name"]},
    }


# ------- CRASH ROUNDS -------
class CrashRoundsAdmin(ModelView, model=CrashRounds):
    column_list = ["id", "round_number", "crash_point", "started_at", "ended_at", "total_bet", "total_payout"]
    form_excluded_columns = ["bets"]


# ------- CRASH BETS -------
from sqlalchemy.orm import selectinload

class CrashBetsAdmin(ModelView, model=CrashBets):
    column_list = [
        "id", "round", "user", "amount", "cashout_multiplier",
        "profit", "gift", "gift_id", "auto_cashout_x", "created_at"
    ]

    def get_query(self, request):
        return (
            super().get_query(request)
            .options(selectinload(CrashBets.round))
            .options(selectinload(CrashBets.user))
        )



# ------- TRANSACTIONS -------
class TransactionsAdmin(ModelView, model=Transactions):
    column_list = [
        "id", "user", "type", "amount",
        "balance_before", "balance_after",
        "related_round", "created_at"
    ]

    form_ajax_refs = {
        "user": {"fields": ["username"]},
        "round": {"fields": ["round_number"]},
    }

# ------- PROMO CODES -------
class PromoCodesAdmin(ModelView, model=PromoCodes):
    column_list = [
        "id", "code", "type", "value",
        "wager_games", "max_uses",
        "used_count", "active", "created_at"
    ]


class UserPromosAdmin(ModelView, model=UserPromos):
    column_list = [
        "id", "user", "promo",
        "remaining_wager_games",
        "remaining_freespins",
        "completed", "activated_at"
    ]

    form_ajax_refs = {
        "user": {"fields": ["username"]},
        "promo": {"fields": ["code"]},
    }


class ReferralPromosAdmin(ModelView, model=ReferralPromos):
    column_list = [
        "id", "code", "owner",
        "reward", "active"
    ]

    form_ajax_refs = {
        "owner": {"fields": ["username"]},
    }

# Register all views
admin.add_view(UsersAdmin)
admin.add_view(DropsAdmin)
admin.add_view(CasesAdmin)
admin.add_view(CaseDropsAdmin)
admin.add_view(CrashBetsAdmin)
admin.add_view(CrashRoundsAdmin)
admin.add_view(TransactionsAdmin)
admin.add_view(CrashBotsAdmin)
admin.add_view(PromoCodesAdmin)
admin.add_view(UserPromosAdmin)
admin.add_view(ReferralPromosAdmin)
