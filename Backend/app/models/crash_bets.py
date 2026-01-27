from sqlalchemy import Column, Integer, Float, DateTime, ForeignKey, Boolean
from sqlalchemy.orm import relationship
from datetime import datetime
from app.database import Base

class CrashBets(Base):
    __tablename__ = "crash_bets"
    __table_args__ = {"mysql_autoincrement": True}  # 🔥 КРИТИЧНО

    id = Column(
        Integer,
        primary_key=True,
        autoincrement=True
    )

    round_id = Column(
        Integer,
        ForeignKey("crash_rounds.id", ondelete="CASCADE"),
        nullable=False
    )

    user_id = Column(
        Integer,
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False
    )

    amount = Column(Float, nullable=False)

    cashout_multiplier = Column(Float, nullable=True)
    profit = Column(Float, nullable=True)

    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)

    gift = Column(Boolean, nullable=False, default=False)
    gift_id = Column(Integer, nullable=True)
    auto_cashout_x = Column(Float, nullable=True)

    round = relationship("CrashRounds", back_populates="bets")
    user = relationship("Users", back_populates="crash_bets")
