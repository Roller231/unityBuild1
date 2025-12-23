from sqlalchemy import Column, Integer, Float, ForeignKey
from sqlalchemy.orm import relationship
from app.database import Base


class CaseDrops(Base):
    __tablename__ = "case_drops"

    case_id = Column(
        Integer,
        ForeignKey("cases.id", ondelete="CASCADE"),
        primary_key=True
    )
    drop_id = Column(
        Integer,
        ForeignKey("drops.id", ondelete="CASCADE"),
        primary_key=True
    )

    chance = Column(Float, nullable=False)

    # 🔥 порядок дропа в кейсе
    position = Column(Integer, nullable=False, default=0)

    case = relationship("Cases", backref="case_drops")
    drop = relationship("Drops", backref="case_drops")
