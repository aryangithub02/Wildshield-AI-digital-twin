"""
WildShield AI — Permanent Supabase PostgreSQL Historical Database Layer
Provides connection management, schema definition, and session handling for long-term historical storage.
"""

import os
import json
from datetime import datetime
from typing import Optional, List, Dict, Any
from dotenv import load_dotenv
from pathlib import Path
from sqlalchemy import (
    create_engine, Column, String, Integer, Float, Boolean, Text, DateTime, Index, text
)
from sqlalchemy.orm import declarative_base, sessionmaker, scoped_session

ENV_PATH = Path(__file__).resolve().parent.parent / ".env"
load_dotenv(dotenv_path=ENV_PATH)

DEFAULT_SUPABASE_URL = "postgresql://postgres:Aryan%40DB2310@db.rugvcrvbyopborvkegpf.supabase.co:5432/postgres"
SUPABASE_DATABASE_URL = os.getenv("SUPABASE_DATABASE_URL", DEFAULT_SUPABASE_URL)

# Strip any channel_binding if present
if "channel_binding=" in SUPABASE_DATABASE_URL:
    SUPABASE_DATABASE_URL = SUPABASE_DATABASE_URL.replace("&channel_binding=require", "").replace("?channel_binding=require", "?")
    if SUPABASE_DATABASE_URL.endswith("?"):
        SUPABASE_DATABASE_URL = SUPABASE_DATABASE_URL[:-1]

supabase_engine = create_engine(
    SUPABASE_DATABASE_URL,
    pool_size=5,
    max_overflow=10,
    pool_recycle=300,
    pool_pre_ping=True,
    connect_args={"connect_timeout": 5}
)

SupabaseSessionLocal = scoped_session(sessionmaker(autocommit=False, autoflush=False, bind=supabase_engine))
SupabaseBase = declarative_base()


# ==========================================
# 1. Farmers Table (Supabase)
# ==========================================
class HistoricalFarmer(SupabaseBase):
    __tablename__ = "farmers_historical"

    id = Column(Integer, primary_key=True, autoincrement=True)
    farmer_id = Column(String(64), unique=True, index=True, nullable=False, default="FARMER-001")
    name = Column(String(128), nullable=False, default="Rajesh Patel")
    phone = Column(String(32), default="+91 98220 12345")
    email = Column(String(128), default="rajesh.patel@wildshield.ai")
    created_at = Column(DateTime, default=datetime.utcnow)


# ==========================================
# 2. Farms Table (Supabase)
# ==========================================
class HistoricalFarm(SupabaseBase):
    __tablename__ = "farms_historical"

    id = Column(Integer, primary_key=True, autoincrement=True)
    farm_id = Column(String(64), unique=True, index=True, nullable=False, default="WS-FARM-001")
    farm_name = Column(String(128), nullable=False, default="Demo Farm (Wardha)")
    owner_id = Column(String(64), default="FARMER-001")
    location = Column(String(256), default="Wardha, Maharashtra")
    area = Column(Float, default=12.5)
    crop = Column(String(128), default="Cotton & Pulses")
    created_at = Column(DateTime, default=datetime.utcnow)


# ==========================================
# 3. Farm Zones Table (Supabase)
# ==========================================
class HistoricalFarmZone(SupabaseBase):
    __tablename__ = "farm_zones_historical"

    id = Column(Integer, primary_key=True, autoincrement=True)
    zone_id = Column(String(64), unique=True, index=True, nullable=False)
    farm_id = Column(String(64), default="WS-FARM-001", index=True)
    zone_name = Column(String(128), nullable=False)
    zone_type = Column(String(64), default="CROP")
    node_code = Column(String(32), default="FN-1")
    geofence = Column(Text, default="{}")
    created_at = Column(DateTime, default=datetime.utcnow)


# ==========================================
# 4. Devices Table (Supabase)
# ==========================================
class HistoricalDevice(SupabaseBase):
    __tablename__ = "devices_historical"

    id = Column(Integer, primary_key=True, autoincrement=True)
    device_id = Column(String(64), unique=True, index=True, nullable=False)
    farm_id = Column(String(64), default="WS-FARM-001", index=True)
    farmer_id = Column(String(64), default="FARMER-001")
    node_name = Column(String(128), default="Farmer Node 01")
    device_type = Column(String(64), default="FARMER_NODE")
    camera_status = Column(String(32), default="ONLINE")
    network_status = Column(String(32), default="ONLINE")
    battery_level = Column(Integer, default=87)
    solar_status = Column(String(32), default="CHARGING")
    fcm_token = Column(String(256), nullable=True)
    platform = Column(String(32), default="android")
    status = Column(String(32), default="ONLINE")
    latitude = Column(Float, default=21.1465)
    longitude = Column(Float, default=79.0880)
    last_seen = Column(String(64), default="Just now")
    created_at = Column(DateTime, default=datetime.utcnow)


# ==========================================
# 5. Historical Detections Table
# ==========================================
class HistoricalDetection(SupabaseBase):
    __tablename__ = "detections_historical"

    id = Column(Integer, primary_key=True, autoincrement=True)
    event_id = Column(String(64), unique=True, index=True, nullable=False)
    farm_id = Column(String(64), default="WS-FARM-001", index=True)
    device_id = Column(String(64), default="FN-1", index=True)
    camera_id = Column(String(64), default="FN-1")
    node_id = Column(String(64), default="FN-1")
    zone_id = Column(String(64), default="ZONE-01")
    farm_zone = Column(String(128), default="North Field")
    species = Column(String(64), index=True, nullable=False)
    species_code = Column(String(32), default="WS-WL-WB")
    code = Column(String(32), default="WS-WL-WB")
    confidence = Column(Float, nullable=False)
    bbox = Column(Text, default="[]")
    threat_level = Column(String(32), default="HIGH", index=True)
    intrusion = Column(Boolean, default=True)
    inside_geofence = Column(Boolean, default=True)
    source = Column(String(32), default="LIVE", index=True)
    dataset_filename = Column(String(256), nullable=True)
    image_url = Column(Text, nullable=True)
    inference_time_ms = Column(Float, default=94.5)
    decision_action = Column(String(128), default="Siren + Floodlight")
    prevention_status = Column(String(32), default="ACTIVE")
    actuators_json = Column(Text, default="{}")
    notification_status = Column(String(32), default="SENT")
    status = Column(String(32), default="DETECTED")
    timestamp = Column(String(64), default="")
    time_formatted = Column(String(64), default="")
    raw_payload_json = Column(Text, nullable=True)
    detected_at = Column(String(64), default="")
    archived_at = Column(DateTime, default=datetime.utcnow)
    created_at = Column(DateTime, default=datetime.utcnow)


# ==========================================
# 6. Historical Intrusions Table
# ==========================================
class HistoricalIntrusion(SupabaseBase):
    __tablename__ = "intrusions_historical"

    id = Column(Integer, primary_key=True, autoincrement=True)
    intrusion_id = Column(String(64), unique=True, index=True, nullable=False)
    event_id = Column(String(64), index=True, nullable=False)
    farm_id = Column(String(64), default="WS-FARM-001", index=True)
    device_id = Column(String(64), default="FN-1", index=True)
    species = Column(String(64), nullable=False)
    species_code = Column(String(32), default="WS-WL-WB")
    confidence = Column(Float, default=95.0)
    zone_id = Column(String(64), default="ZONE-01")
    threat_level = Column(String(32), default="HIGH")
    status = Column(String(32), default="CLEARED", index=True)
    entered_at = Column(String(64), default="")
    exited_at = Column(String(64), nullable=True)
    source = Column(String(32), default="SIMULATION", index=True)
    archived_at = Column(DateTime, default=datetime.utcnow)
    created_at = Column(DateTime, default=datetime.utcnow)


# ==========================================
# 7. Historical Prevention Actions Table
# ==========================================
class HistoricalPreventionAction(SupabaseBase):
    __tablename__ = "prevention_actions_historical"

    id = Column(Integer, primary_key=True, autoincrement=True)
    prevention_id = Column(String(64), unique=True, index=True, nullable=False)
    event_id = Column(String(64), index=True, nullable=False)
    siren = Column(Boolean, default=False)
    floodlight = Column(Boolean, default=False)
    speaker = Column(Boolean, default=False)
    sprinkler = Column(Boolean, default=False)
    decision = Column(String(128), default="Siren + Floodlight")
    status = Column(String(32), default="COMPLETED", index=True)
    activated_at = Column(String(64), default="")
    deactivated_at = Column(String(64), nullable=True)
    archived_at = Column(DateTime, default=datetime.utcnow)
    created_at = Column(DateTime, default=datetime.utcnow)


# ==========================================
# 8. Historical Notifications Table
# ==========================================
class HistoricalNotification(SupabaseBase):
    __tablename__ = "notifications_historical"

    id = Column(Integer, primary_key=True, autoincrement=True)
    notification_id = Column(String(64), unique=True, index=True, nullable=False)
    event_id = Column(String(64), index=True, nullable=False)
    farmer_id = Column(String(64), default="FARMER-001")
    title = Column(String(128), nullable=False)
    message = Column(Text, nullable=False)
    notification_type = Column(String(32), default="INTRUSION_ALERT")
    fcm_token = Column(String(256), nullable=True)
    status = Column(String(32), default="READ", index=True)
    sent_at = Column(String(64), default="")
    read_at = Column(String(64), nullable=True)
    archived_at = Column(DateTime, default=datetime.utcnow)
    created_at = Column(String(64), default="")


# ==========================================
# 9. Historical Analytics Events Table
# ==========================================
class HistoricalAnalyticsEvent(SupabaseBase):
    __tablename__ = "analytics_events_historical"

    id = Column(Integer, primary_key=True, autoincrement=True)
    farm_id = Column(String(64), default="WS-FARM-001", index=True)
    event_id = Column(String(64), index=True, nullable=False)
    species = Column(String(64), index=True, nullable=False)
    zone_id = Column(String(64), default="ZONE-01")
    threat_level = Column(String(32), default="HIGH")
    prevention_used = Column(String(128), default="Siren + Floodlight")
    source = Column(String(32), default="LIVE", index=True)
    timestamp = Column(String(64), default="")
    created_at = Column(DateTime, default=datetime.utcnow)


# ==========================================
# 10. Aggregated Historical Analytics Summary
# ==========================================
class HistoricalAnalyticsSummary(SupabaseBase):
    __tablename__ = "analytics_summary"

    id = Column(Integer, primary_key=True, autoincrement=True)
    date = Column(String(32), unique=True, index=True, nullable=False)
    total_detections = Column(Integer, default=0)
    total_intrusions = Column(Integer, default=0)
    high_threat_events = Column(Integer, default=0)
    prevention_actions = Column(Integer, default=0)
    notifications_sent = Column(Integer, default=0)
    species_breakdown_json = Column(Text, default="{}")
    archived_at = Column(DateTime, default=datetime.utcnow)


def init_supabase_db():
    """Create all historical tables in Supabase PostgreSQL if they do not exist."""
    try:
        SupabaseBase.metadata.create_all(bind=supabase_engine, checkfirst=True)
        print("[SUPABASE DB] Connected & historical tables verified in Supabase PostgreSQL.")
        return True
    except Exception as e:
        err_str = str(e).lower()
        if "already exists" in err_str or "duplicate key" in err_str:
            print("[SUPABASE DB] Connected & historical tables confirmed in Supabase PostgreSQL.")
            return True
        print(f"[SUPABASE DB WARNING] Failed to connect or create tables in Supabase: {e}")
        return False


def get_supabase_db():
    """Dependency for obtaining Supabase database session."""
    db = SupabaseSessionLocal()
    try:
        yield db
    finally:
        db.close()
