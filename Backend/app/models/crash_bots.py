from sqlalchemy import Column, Integer, String, Float
from app.database import Base

class CrashBots(Base):
    __tablename__ = "crash_bots"

    id = Column(Integer, primary_key=True, index=True)
    nickname = Column(String(255), nullable=False)
    avatar_url = Column(String(255), nullable=False)
    min_bet = Column(Float, default=0)
    max_bet = Column(Float, default=5)
