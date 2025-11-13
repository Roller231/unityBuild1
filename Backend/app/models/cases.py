from sqlalchemy import Column, Integer, String, Float, DateTime, JSON
from datetime import datetime
from app.database import Base

class Cases(Base):
    __tablename__ = "cases"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    price = Column(Float, nullable=False)
    gradient_colors = Column(JSON)  # [{},{}] или массив цветов
    main_image = Column(String(255))
    created_at = Column(DateTime, default=datetime.utcnow)
