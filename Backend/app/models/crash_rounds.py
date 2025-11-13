from sqlalchemy import Column, Integer, Float, DateTime
from sqlalchemy.orm import relationship
from app.database import Base

class CrashRounds(Base):
    __tablename__ = "crash_rounds"

    id = Column(Integer, primary_key=True, index=True)
    round_number = Column(Integer, unique=True, index=True)
    crash_point = Column(Float)
    started_at = Column(DateTime)
    ended_at = Column(DateTime)
    total_bet = Column(Float)
    total_payout = Column(Float)

    bets = relationship("CrashBets", back_populates="round")
    transactions = relationship("Transactions", back_populates="round")
