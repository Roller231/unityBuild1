from sqlalchemy import Column, Integer, String, Float, DateTime, JSON
from datetime import datetime
from sqlalchemy.orm import relationship
from app.database import Base
from sqlalchemy.ext.mutable import MutableList, MutableDict

class Users(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    tg_id = Column(String(255), unique=True, index=True)
    username = Column(String(255))
    firstname = Column(String(255))
    balance = Column(Float, default=0)
    refcount = Column(Integer, default=0)
    inventory = Column(MutableList.as_mutable(JSON), default=list)
    url_image = Column(String(255), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow)

    transactions = relationship("Transactions", back_populates="user")
    crash_bets = relationship("CrashBets", back_populates="user")
    def __str__(self):
        return self.username or f"User #{self.id}"