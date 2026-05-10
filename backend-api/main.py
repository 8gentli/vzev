import os
import logging
from datetime import datetime, timedelta
from zoneinfo import ZoneInfo
from dotenv import load_dotenv

from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from apscheduler.schedulers.background import BackgroundScheduler
import httpx

from sqlalchemy.orm import Session
from database import SessionLocal, PowerLog

RETENTION_DAYS = 30


def get_local_now():
    return datetime.now(ZoneInfo("Europe/Zurich")).replace(tzinfo=None)


def retention_cleanup(db: Session) -> int:
    cutoff = get_local_now() - timedelta(days=RETENTION_DAYS)
    return db.query(PowerLog).filter(PowerLog.timestamp < cutoff).delete(synchronize_session=False)

# Load config
load_dotenv()
SOLARLOG_URL = os.getenv("SOLARLOG_URL", "http://solar-log/getjp")
HA_URL = os.getenv("HA_URL", "http://homeassistant.local:8123")
HA_TOKEN = os.getenv("HA_TOKEN", "")

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI()
scheduler = BackgroundScheduler()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def poll_solarlog():
    """ Runs every minute in a background thread to poll the Solar-Log JSON interface """
    logger.info("Polling Solar-Log...")
    try:
        # Standard SolarLog data payload to get current values
        payload = {"801":{"170":None}}
        with httpx.Client(timeout=10.0) as client:
            response = client.post(SOLARLOG_URL, json=payload)
            response.raise_for_status()
            data = response.json()
            
            # The exact indices vary per firmware, but usually:
            # 101 = current PV power in watts (PAC)
            # 110 = current consumption in watts
            base_data = data.get("801", {}).get("170", {})
            raw_pv = base_data.get("101", 0)
            raw_cons = base_data.get("110", 0)
            
            pv_kw = float(raw_pv) / 1000.0 if raw_pv else 0.0
            cons_kw = float(raw_cons) / 1000.0 if raw_cons else 0.0
            surplus_kw = max(0.0, round(pv_kw - cons_kw, 2))
            
            # Save to local SQLite
            db = SessionLocal()
            log_entry = PowerLog(pv_power_kw=pv_kw, consumption_kw=cons_kw, surplus_kw=surplus_kw)
            db.add(log_entry)
            deleted = retention_cleanup(db)
            if deleted:
                logger.info(f"Retention: removed {deleted} power_logs older than {RETENTION_DAYS} days")
            db.commit()
            db.close()
            logger.info(f"Saved: PV={pv_kw}kW, Cons={cons_kw}kW, Surplus={surplus_kw}kW")
            
    except Exception as e:
        logger.error(f"Error polling Solar-Log: {e}")

@app.on_event("startup")
def startup_event():
    db = SessionLocal()
    try:
        n = retention_cleanup(db)
        if n:
            logger.info(f"Startup retention: removed {n} power_logs older than {RETENTION_DAYS} days")
        db.commit()
    finally:
        db.close()
    scheduler.add_job(poll_solarlog, "interval", minutes=1)
    scheduler.start()

@app.on_event("shutdown")
def shutdown_event():
    scheduler.shutdown()


@app.get("/api/v1/surplus/daily")
def get_daily_surplus(
    db: Session = Depends(get_db),
    date: str | None = None,
):
    """Minute grid 05:00–22:00 for one calendar day (Europe/Zurich). Optional `date=YYYY-MM-DD`.
    `currentSurplus` is always the latest live value (most recent DB row), not the selected day."""
    now = get_local_now()

    latest = db.query(PowerLog).order_by(PowerLog.timestamp.desc()).first()
    current_surplus_val = 0.0
    if latest is not None and latest.surplus_kw is not None and latest.surplus_kw > 0:
        current_surplus_val = round(float(latest.surplus_kw), 2)

    first_log = db.query(PowerLog).order_by(PowerLog.timestamp.asc()).first()
    first_log_date = first_log.timestamp.date().isoformat() if first_log else None
    last_log_date = latest.timestamp.date().isoformat() if latest else None

    if date:
        try:
            d = datetime.strptime(date, "%Y-%m-%d").date()
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid date, use YYYY-MM-DD")
        day_start = datetime(d.year, d.month, d.day, 5, 0, 0, 0)
        day_end = datetime(d.year, d.month, d.day, 22, 0, 0, 0)
        requested_date = d.isoformat()
    else:
        anchor = now - timedelta(days=1) if now.hour < 5 else now
        day_start = anchor.replace(hour=5, minute=0, second=0, microsecond=0)
        day_end = anchor.replace(hour=22, minute=0, second=0, microsecond=0)
        requested_date = day_start.date().isoformat()

    logs = (
        db.query(PowerLog)
        .filter(PowerLog.timestamp >= day_start, PowerLog.timestamp <= day_end)
        .order_by(PowerLog.timestamp.asc())
        .all()
    )

    log_map = {log.timestamp.replace(second=0, microsecond=0).isoformat(): log for log in logs}

    history = []
    current = day_start
    while current <= day_end:
        time_iso = current.isoformat()
        if time_iso in log_map:
            log = log_map[time_iso]
            val = log.surplus_kw
            surp = round(val, 2) if val and val > 0 else None
            history.append({
                "time": time_iso,
                "pv": round(log.pv_power_kw, 2),
                "consumption": round(log.consumption_kw, 2),
                "surplus": surp,
            })
        else:
            history.append({
                "time": time_iso,
                "pv": None,
                "consumption": None,
                "surplus": None,
            })
        current += timedelta(minutes=1)

    return {
        "currentSurplus": max(0, current_surplus_val),
        "history": history,
        "meta": {
            "requestedDate": requested_date,
            "firstLogDate": first_log_date,
            "lastLogDate": last_log_date,
        },
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
