from sqlalchemy import Column, Integer, Boolean, DateTime, ForeignKey
from datetime import datetime

from app.database import Base


class RouletteSpins(Base):
    __tablename__ = "roulette_spins"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    drop_id = Column(Integer, ForeignKey("drops.id", ondelete="CASCADE"), nullable=False)
    is_free = Column(Boolean, nullable=False, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
