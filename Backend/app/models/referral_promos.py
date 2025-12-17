from sqlalchemy import Column, Integer, String, Float, Boolean, ForeignKey
from sqlalchemy.orm import relationship
from app.database import Base


class ReferralPromos(Base):
    __tablename__ = "referral_promos"

    id = Column(Integer, primary_key=True)
    owner_user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    code = Column(String(50), unique=True, nullable=False)
    reward = Column(Float, nullable=False)
    active = Column(Boolean, default=True)

    owner = relationship("Users")
