from http.client import HTTPException

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.crud.crash_bots_crud import get_all_bots
from app.models import CrashBots

router = APIRouter(prefix="/crash-bots", tags=["Crash Bots"])

@router.get("/")
def list_bots(db: Session = Depends(get_db)):
    bots = get_all_bots(db)
    return [
        {
            "id": bot.id,
            "nickname": bot.nickname,
            "avatar_url": bot.avatar_url,
            "min_bet": bot.min_bet,
            "max_bet": bot.max_bet,
        }
        for bot in bots
    ]


@router.get("/{bot_id}")
def get_bot(bot_id: int, db: Session = Depends(get_db)):
    bot = db.query(CrashBots).filter(CrashBots.id == bot_id).first()
    if not bot:
        raise HTTPException(404, "Bot not found")

    return {
        "id": bot.id,
        "nickname": bot.nickname,
        "avatar_url": bot.avatar_url,
        "min_bet": bot.min_bet,
        "max_bet": bot.max_bet,
    }
