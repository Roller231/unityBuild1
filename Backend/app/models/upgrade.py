from sqlalchemy import (
    Column,
    Integer,
    Float,
    Enum,
    DateTime,
    ForeignKey
)
from sqlalchemy.sql import func
from app.database import Base


class UpgradeLog(Base):
    __tablename__ = "upgrade_logs"

    id = Column(Integer, primary_key=True, index=True)

    user_id = Column(
        Integer,
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False
    )

    from_drop_id = Column(
        Integer,
        ForeignKey("drops.id", ondelete="CASCADE"),
        nullable=False
    )

    to_drop_id = Column(
        Integer,
        ForeignKey("drops.id", ondelete="CASCADE"),
        nullable=False
    )

    chance = Column(Float, nullable=False)
    roll = Column(Float, nullable=False)

    result = Column(
        Enum("win", "lose", name="upgrade_result_enum"),
        nullable=False
    )

    created_at = Column(
        DateTime(timezone=True),
        server_default=func.now()
    )
