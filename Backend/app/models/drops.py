from sqlalchemy import Column, Integer, String, Float, DateTime
from datetime import datetime

from sqlalchemy.orm import relationship

from app.database import Base

class Drops(Base):
    __tablename__ = "drops"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    rarity = Column(String(255), nullable=False)
    price = Column(Float, nullable=False)
    icon = Column(String(255))
    created_at = Column(DateTime, default=datetime.utcnow)


    def __str__(self):
        return f"{self.name} [{self.rarity}] — ${self.price}"