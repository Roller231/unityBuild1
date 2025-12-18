from sqlalchemy import Column, Integer, String, Float, DateTime, JSON
from datetime import datetime
from app.database import Base

class Cases(Base):
    __tablename__ = "cases"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    price = Column(Float, nullable=False)
    gradient_colors = Column(JSON)
    main_image = Column(String(255))
    lottie_anim = Column(String(255), nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow)

    def __str__(self):
        return f"{self.name} (${self.price})"

    def drops_pretty(self):
        if not self.case_drops:
            return "-"
        return ", ".join(
            f"{cd.drop.name} ({cd.chance}%)"
            for cd in self.case_drops
        )
