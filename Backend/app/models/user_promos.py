from sqlalchemy import Column, Integer, Boolean, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
from app.database import Base


class UserPromos(Base):
    __tablename__ = "user_promos"

    id = Column(Integer, primary_key=True)

    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)

    promo_id = Column(
        Integer,
        ForeignKey("promo_codes.id"),
        nullable=True   # 👈 ВАЖНО: для рефов = NULL
    )

    referral_owner_id = Column(
        Integer,
        ForeignKey("users.id"),
        nullable=True   # 👈 ВОТ ЭТОГО ПОЛЯ НЕ ХВАТАЛО
    )

    activated_at = Column(DateTime, default=datetime.utcnow)
    completed = Column(Boolean, default=False)

    remaining_wager_games = Column(Integer, default=0)
    remaining_freespins = Column(Integer, default=0)

    # relationships (по желанию, но полезно)
    user = relationship("Users", foreign_keys=[user_id])
    promo = relationship("PromoCodes", foreign_keys=[promo_id])
    referral_owner = relationship("Users", foreign_keys=[referral_owner_id])
