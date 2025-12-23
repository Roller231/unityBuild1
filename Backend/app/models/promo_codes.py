from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, Enum
from app.database import Base
import enum
from datetime import datetime


class PromoType(str, enum.Enum):
    deposit_percent = "deposit_percent"
    deposit_fixed = "deposit_fixed"
    freespin = "freespin"
    ref_fixed = "ref_fixed"
    freecase = "freecase"  # 🎁 НОВЫЙ ТИП


class PromoCodes(Base):
    __tablename__ = "promo_codes"

    id = Column(Integer, primary_key=True)
    code = Column(String(50), unique=True, nullable=False)
    type = Column(Enum(PromoType), nullable=False)

    value = Column(Float, nullable=False)
    wager_games = Column(Integer, default=0)

    max_uses = Column(Integer)
    used_count = Column(Integer, default=0)

    active = Column(Boolean, default=True)
    starts_at = Column(DateTime, default=datetime.utcnow)
    ends_at = Column(DateTime)

    created_at = Column(DateTime, default=datetime.utcnow)
