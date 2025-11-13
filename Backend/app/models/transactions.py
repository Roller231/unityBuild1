from sqlalchemy import Column, Integer, Float, DateTime, String, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
from app.database import Base

class Transactions(Base):
    __tablename__ = "transactions"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"))
    type = Column(String(255), nullable=False)   # deposit / withdraw / bet / win / etc
    amount = Column(Float, nullable=False)
    balance_before = Column(Float)
    balance_after = Column(Float)
    related_round_id = Column(Integer, ForeignKey("crash_rounds.id", ondelete="SET NULL"))
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("Users", back_populates="transactions")
    round = relationship("CrashRounds", back_populates="transactions")
