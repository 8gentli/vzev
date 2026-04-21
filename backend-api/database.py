from sqlalchemy import create_engine, Column, Integer, Float, DateTime
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
import os
import datetime
from zoneinfo import ZoneInfo

def get_local_now():
    return datetime.datetime.now(ZoneInfo("Europe/Zurich")).replace(tzinfo=None)

# To ensure the directory exists when using a volume
db_dir = "/app/data"
if not os.path.exists(db_dir) and os.path.exists("/app"):
    os.makedirs(db_dir, exist_ok=True)
    
# In local dev it might not be in /app, so default to local path if not in docker
db_path = f"{db_dir}/vzev.db" if os.path.exists("/app") else "./vzev.db"

SQLALCHEMY_DATABASE_URL = f"sqlite:///{db_path}"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False}
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

class PowerLog(Base):
    __tablename__ = "power_logs"

    id = Column(Integer, primary_key=True, index=True)
    timestamp = Column(DateTime, default=get_local_now, index=True)
    pv_power_kw = Column(Float, default=0.0)
    consumption_kw = Column(Float, default=0.0)
    surplus_kw = Column(Float, default=0.0)

Base.metadata.create_all(bind=engine)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
