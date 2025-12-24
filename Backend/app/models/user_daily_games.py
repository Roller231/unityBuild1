# app/models/user_daily_games.py

from sqlalchemy import Column, Integer, Date, ForeignKey, Boolean
from app.database import Base

class UserDailyGames(Base):
    __tablename__ = "user_daily_games"

    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), primary_key=True)
    day_date = Column(Date, primary_key=True)

    games_played = Column(Integer, default=0)

    was_free_spin = Column(Boolean, default=False)
    was_free_case = Column(Boolean, default=False)
    usedPromoToday = Column(Boolean, default=False)

    # 🆕 НОВОЕ
    usedFirst = Column(Boolean, default=False)     # бонус за 1й вход
    usedTenDays = Column(Boolean, default=False)   # бонус за 10й вход
