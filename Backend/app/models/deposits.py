from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Numeric
from sqlalchemy.sql import func
from app.database import Base


class Deposits(Base):
    __tablename__ = "deposits"

    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    username = Column(String, nullable=False)

    amount = Column(Numeric(12, 2), nullable=False)
    currency = Column(String, default="XTR")  # Stars
    type_deposit = Column(String, nullable=False)  # stars / ton / cryptobot

    invoice_id = Column(String, unique=True, index=True)
    payload = Column(String, unique=True)

    status = Column(String, default="pending")  # pending / success / failed

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    completed_at = Column(DateTime(timezone=True))
