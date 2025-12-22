# app/models/pvp_games.py
from sqlalchemy import Column, Integer, Float, DateTime, Enum, ForeignKey
from datetime import datetime
from app.database import Base

class PvPGames(Base):
    __tablename__ = "pvp_games"

    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)

    bot_id = Column(Integer, ForeignKey("crash_bots.id"), nullable=False)
    bot_bet = Column(Float, nullable=False)

    user_bet = Column(Float, nullable=False)
    gift = Column(Integer, default=0)
    gift_id = Column(Integer, nullable=True)

    result = Column(Enum("win", "lose", "draw"), nullable=False)

    created_at = Column(DateTime, default=datetime.utcnow)
