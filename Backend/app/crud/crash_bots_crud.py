from sqlalchemy.orm import Session
from app.models.crash_bots import CrashBots

def get_all_bots(db: Session):
    return db.query(CrashBots).all()
