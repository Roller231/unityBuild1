from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base

# поменяй user:password@host:port/krash под себя
DATABASE_URL="mysql+pymysql://remote_user:STRONG_PASSWORD@localhost:3306/krash"

engine = create_engine(
    DATABASE_URL,
    echo=False,
    future=True,
)

SessionLocal = sessionmaker(
    bind=engine,
    autocommit=False,
    autoflush=False,
)

Base = declarative_base()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
