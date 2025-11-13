from sqlalchemy import Column, Integer, Float, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
from app.database import Base

class CrashBets(Base):
    __tablename__ = "crash_bets"

    id = Column(Integer, primary_key=True, index=True)
    round_id = Column(Integer, ForeignKey("crash_rounds.id", ondelete="CASCADE"))
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"))
    amount = Column(Float, nullable=False)
    cashout_multiplier = Column(Float)
    profit = Column(Float)
    created_at = Column(DateTime, default=datetime.utcnow)

    round = relationship("CrashRounds", back_populates="bets")
    user = relationship("Users", back_populates="crash_bets")
