from sqlalchemy import (
    Column, Integer, String, DateTime, Enum, ForeignKey, DECIMAL
)
from datetime import datetime
from app.database import Base

class WithdrawRequests(Base):
    __tablename__ = "withdraw_requests"

    id = Column(Integer, primary_key=True)

    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    tg_id = Column(String(255), nullable=False)
    username = Column(String(255))

    type = Column(Enum("ton", "drop"), nullable=False)

    ton_amount = Column(DECIMAL(12, 4), nullable=True)
    drop_id = Column(Integer, ForeignKey("drops.id", ondelete="SET NULL"), nullable=True)

    status = Column(
        Enum("pending", "approved", "rejected", "processed"),
        default="pending",
        nullable=False
    )

    comment = Column(String(255), nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow)
    processed_at = Column(DateTime, nullable=True)
