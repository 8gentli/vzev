import os
import logging
from datetime import datetime
from dotenv import load_dotenv

from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from apscheduler.schedulers.background import BackgroundScheduler
import httpx

from sqlalchemy.orm import Session
from database import SessionLocal, PowerLog

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
            db.commit()
            db.close()
            logger.info(f"Saved: PV={pv_kw}kW, Cons={cons_kw}kW, Surplus={surplus_kw}kW")
            
    except Exception as e:
        logger.error(f"Error polling Solar-Log: {e}")

@app.on_event("startup")
def startup_event():
    scheduler.add_job(poll_solarlog, "interval", minutes=1)
    scheduler.start()

@app.on_event("shutdown")
def shutdown_event():
    scheduler.shutdown()


from zoneinfo import ZoneInfo

def get_local_now():
    return datetime.now(ZoneInfo("Europe/Zurich")).replace(tzinfo=None)

@app.get("/api/v1/surplus/daily")
def get_daily_surplus(db: Session = Depends(get_db)):
    """ Serves today's history up to the current minute from the SQLite DB, padded from 05:00 to 22:00 """
    from datetime import timedelta
    now = get_local_now()
    
    # If before 5 AM, show the previous day
    target_date = now - timedelta(days=1) if now.hour < 5 else now
    
    start_time = target_date.replace(hour=5, minute=0, second=0, microsecond=0)
    end_time = target_date.replace(hour=22, minute=0, second=0, microsecond=0)
    
    logs = db.query(PowerLog).filter(PowerLog.timestamp >= start_time, PowerLog.timestamp <= end_time).order_by(PowerLog.timestamp.asc()).all()
    
    # Map logs into a dictionary by ISO time string (without seconds so it matches minute padding)
    log_map = {log.timestamp.replace(second=0, microsecond=0).isoformat(): log for log in logs}
    
    history = []
    current_surplus = 0.0
    
    current = start_time
    while current <= end_time:
        time_iso = current.isoformat()
        if time_iso in log_map:
            log = log_map[time_iso]
            val = log.surplus_kw
            surp = round(val, 2) if val and val > 0 else None
            history.append({
                "time": time_iso,
                "pv": round(log.pv_power_kw, 2),
                "consumption": round(log.consumption_kw, 2),
                "surplus": surp
            })
            current_surplus = surp if surp else 0.0
        else:
            history.append({
                "time": time_iso,
                "pv": None,
                "consumption": None,
                "surplus": None
            })
        current += timedelta(minutes=1)
        
    return {
        "currentSurplus": max(0, current_surplus),
        "history": history
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
