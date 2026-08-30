"""
WildShield AI — Central Neon PostgreSQL Persistent Database Layer
SQLAlchemy relational models & connection pooler for Neon Cloud Database.
"""

import os
import json
from datetime import datetime
from typing import List, Dict, Any, Optional
from dotenv import load_dotenv
from pathlib import Path
from sqlalchemy import (
    create_engine, Column, String, Integer, Float, Boolean, Text, DateTime, ForeignKey, Index
)
from sqlalchemy.orm import declarative_base, sessionmaker, scoped_session, relationship

# Load environment variables from .env
ENV_PATH = Path(__file__).resolve().parent.parent / ".env"
load_dotenv(dotenv_path=ENV_PATH)

DEFAULT_NEON_URL = "postgresql://neondb_owner:npg_kyaHfWR0OhD2@ep-floral-resonance-za1ksthg-pooler.c-2.eu-west-2.aws.neon.tech/neondb?sslmode=require"
DATABASE_URL = os.getenv("DATABASE_URL", DEFAULT_NEON_URL)

# Strip channel_binding if present to avoid driver parse warning if needed
if "channel_binding=" in DATABASE_URL:
    DATABASE_URL = DATABASE_URL.replace("&channel_binding=require", "").replace("?channel_binding=require", "?")
    if DATABASE_URL.endswith("?"):
        DATABASE_URL = DATABASE_URL[:-1]

# Connection pooling for Neon PostgreSQL
connect_args = {"check_same_thread": False} if "sqlite" in DATABASE_URL else {
    "connect_timeout": 15
}

engine = create_engine(
    DATABASE_URL,
    pool_size=10,
    max_overflow=20,
    pool_recycle=300,
    pool_pre_ping=True,
    connect_args=connect_args
)

SessionLocal = scoped_session(sessionmaker(autocommit=False, autoflush=False, bind=engine))
Base = declarative_base()


# ==========================================
# 1. Farmers Table
# ==========================================
class Farmer(Base):
    __tablename__ = "farmers"

    id = Column(Integer, primary_key=True, autoincrement=True)
    farmer_id = Column(String(64), unique=True, index=True, nullable=False, default="FARMER-001")
    name = Column(String(128), nullable=False, default="Rajesh Patel")
    phone = Column(String(32), default="+91 98220 12345")
    email = Column(String(128), default="rajesh.patel@wildshield.ai")
    created_at = Column(DateTime, default=datetime.utcnow)


# ==========================================
# 2. Farms Table
# ==========================================
class Farm(Base):
    __tablename__ = "farms"

    id = Column(Integer, primary_key=True, autoincrement=True)
    farm_id = Column(String(64), unique=True, index=True, nullable=False, default="WS-FARM-001")
    farm_name = Column(String(128), nullable=False, default="Demo Farm (Wardha)")
    owner_id = Column(String(64), default="FARMER-001")
    location = Column(String(256), default="Wardha, Maharashtra")
    area = Column(Float, default=12.5) # In acres
    crop = Column(String(128), default="Cotton & Pulses")
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


# ==========================================
# 3. Farm Zones Table
# ==========================================
class FarmZone(Base):
    __tablename__ = "farm_zones"

    id = Column(Integer, primary_key=True, autoincrement=True)
    zone_id = Column(String(64), unique=True, index=True, nullable=False)
    farm_id = Column(String(64), default="WS-FARM-001", index=True)
    zone_name = Column(String(128), nullable=False)
    zone_type = Column(String(64), default="CROP") # CROP, BOUNDARY, WATER, STORAGE, BUFFER, ORCHARD
    node_code = Column(String(32), default="FN-1")
    geofence = Column(Text, default="{}") # Polygon / GeoJSON
    created_at = Column(DateTime, default=datetime.utcnow)


# ==========================================
# 4. Devices Table (IoT Nodes & Mobile Tokens)
# ==========================================
class Device(Base):
    __tablename__ = "devices"

    id = Column(Integer, primary_key=True, autoincrement=True)
    device_id = Column(String(64), unique=True, index=True, nullable=False)
    farm_id = Column(String(64), default="WS-FARM-001", index=True)
    farmer_id = Column(String(64), default="FARMER-001")
    node_name = Column(String(128), default="Farmer Node 01")
    device_type = Column(String(64), default="FARMER_NODE") # FARMER_NODE, CAMERA_EDGE, MOBILE_APP
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
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)



# ==========================================
# 5. Detections Table (Central Detection Records)
# ==========================================
class Detection(Base):
    __tablename__ = "detections"

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
    bbox = Column(Text, default="[]") # JSON [x1, y1, x2, y2]
    threat_level = Column(String(32), default="HIGH", index=True) # LOW, MEDIUM, HIGH, CRITICAL
    intrusion = Column(Boolean, default=True)
    inside_geofence = Column(Boolean, default=True)
    source = Column(String(32), default="LIVE", index=True) # LIVE, SIMULATION, OFFLINE_SYNC
    image_path = Column(String(256), nullable=True)
    annotated_image_path = Column(Text, nullable=True) # Base64 data URI or CDN URL
    annotated_image = Column(Text, nullable=True)
    inference_time_ms = Column(Float, default=94.5)
    decision_action = Column(String(128), default="Siren + Floodlight")
    prevention_status = Column(String(32), default="ACTIVE")
    actuators_json = Column(Text, default="{}")
    notification_status = Column(String(32), default="SENT")
    status = Column(String(32), default="DETECTED")
    timestamp = Column(String(64), default=datetime.utcnow().isoformat)
    time_formatted = Column(String(64), default="")
    raw_payload_json = Column(Text, nullable=True)
    detected_at = Column(String(64), default=datetime.utcnow().isoformat)
    created_at = Column(DateTime, default=datetime.utcnow)



# ==========================================
# 6. Intrusions Table
# ==========================================
class Intrusion(Base):
    __tablename__ = "intrusions"

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
    status = Column(String(32), default="ACTIVE", index=True) # ACTIVE, CLEARED, CLOSED
    entered_at = Column(String(64), default=datetime.utcnow().isoformat)
    exited_at = Column(String(64), nullable=True)
    source = Column(String(32), default="SIMULATION", index=True)
    created_at = Column(DateTime, default=datetime.utcnow)



# ==========================================
# 7. Prevention Actions Table
# ==========================================
class PreventionAction(Base):
    __tablename__ = "prevention_actions"

    id = Column(Integer, primary_key=True, autoincrement=True)
    prevention_id = Column(String(64), unique=True, index=True, nullable=False)
    event_id = Column(String(64), index=True, nullable=False)
    siren = Column(Boolean, default=False)
    floodlight = Column(Boolean, default=False)
    speaker = Column(Boolean, default=False)
    sprinkler = Column(Boolean, default=False)
    decision = Column(String(128), default="Siren + Floodlight")
    status = Column(String(32), default="PENDING", index=True) # PENDING, ACTIVE, COMPLETED, FAILED
    activated_at = Column(String(64), default=datetime.utcnow().isoformat)
    deactivated_at = Column(String(64), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)


# ==========================================
# 8. Notifications Table
# ==========================================
class Notification(Base):
    __tablename__ = "notifications"

    id = Column(Integer, primary_key=True, autoincrement=True)
    notification_id = Column(String(64), unique=True, index=True, nullable=False)
    event_id = Column(String(64), index=True, nullable=False)
    farmer_id = Column(String(64), default="FARMER-001")
    title = Column(String(128), nullable=False)
    message = Column(Text, nullable=False)
    notification_type = Column(String(32), default="INTRUSION_ALERT")
    fcm_token = Column(String(256), nullable=True)
    status = Column(String(32), default="SENT", index=True) # PENDING, SENT, DELIVERED, READ, FAILED
    created_at = Column(String(64), default=datetime.utcnow().isoformat)
    sent_at = Column(String(64), default=datetime.utcnow().isoformat)
    read_at = Column(String(64), nullable=True)


# ==========================================
# 9. Analytics Events Table
# ==========================================
class AnalyticsEvent(Base):
    __tablename__ = "analytics_events"

    id = Column(Integer, primary_key=True, autoincrement=True)
    farm_id = Column(String(64), default="WS-FARM-001", index=True)
    event_id = Column(String(64), index=True, nullable=False)
    species = Column(String(64), index=True, nullable=False)
    zone_id = Column(String(64), default="ZONE-01")
    threat_level = Column(String(32), default="HIGH")
    prevention_used = Column(String(128), default="Siren + Floodlight")
    source = Column(String(32), default="LIVE", index=True) # LIVE, SIMULATION
    timestamp = Column(String(64), default=datetime.utcnow().isoformat)
    created_at = Column(DateTime, default=datetime.utcnow)


# Alias detection_events for backward compatibility
EventRecord = Detection
DeviceRecord = Device
NotificationRecord = Notification


def seed_database(db):
    """Seed initial Farm, Zones, Devices and Farmer if tables are empty."""
    # 1. Seed Farmer
    if db.query(Farmer).count() == 0:
        db.add(Farmer(
            farmer_id="FARMER-001",
            name="Rajesh Patel",
            phone="+91 98220 12345",
            email="rajesh.patel@wildshield.ai"
        ))

    # 2. Seed Farm
    if db.query(Farm).count() == 0:
        db.add(Farm(
            farm_id="WS-FARM-001",
            farm_name="Demo Farm (Wardha)",
            owner_id="FARMER-001",
            location="Wardha, Maharashtra",
            area=12.5,
            crop="Cotton & Pulses"
        ))

    # 3. Seed Farm Zones
    if db.query(FarmZone).count() == 0:
        zones = [
            FarmZone(zone_id="ZONE-01", farm_id="WS-FARM-001", zone_name="North Field", zone_type="CROP", node_code="FN-1"),
            FarmZone(zone_id="ZONE-02", farm_id="WS-FARM-001", zone_name="East Orchard", zone_type="ORCHARD", node_code="FN-2"),
            FarmZone(zone_id="ZONE-03", farm_id="WS-FARM-001", zone_name="South-East Pulse Field", zone_type="CROP", node_code="FN-3"),
            FarmZone(zone_id="ZONE-04", farm_id="WS-FARM-001", zone_name="South-West Grassland", zone_type="BUFFER", node_code="FN-4"),
            FarmZone(zone_id="ZONE-05", farm_id="WS-FARM-001", zone_name="West Vegetable Field", zone_type="CROP", node_code="FN-5"),
        ]
        db.add_all(zones)

    # 4. Seed Devices
    if db.query(Device).count() == 0:
        devices = [
            Device(device_id="FN-1", farm_id="WS-FARM-001", node_name="Farmer Node 01 (North Field)", device_type="FARMER_NODE", camera_status="ONLINE", network_status="ONLINE", battery_level=87, solar_status="CHARGING", latitude=21.1465, longitude=79.0880),
            Device(device_id="FN-2", farm_id="WS-FARM-001", node_name="Farmer Node 02 (East Field)", device_type="FARMER_NODE", camera_status="ONLINE", network_status="ONLINE", battery_level=89, solar_status="CHARGING", latitude=21.1460, longitude=79.0895),
            Device(device_id="FN-3", farm_id="WS-FARM-001", node_name="Farmer Node 03 (South-East Field)", device_type="FARMER_NODE", camera_status="ONLINE", network_status="ONLINE", battery_level=91, solar_status="CHARGING", latitude=21.1448, longitude=79.0892),
            Device(device_id="FN-4", farm_id="WS-FARM-001", node_name="Farmer Node 04 (South-West Field)", device_type="FARMER_NODE", camera_status="ONLINE", network_status="ONLINE", battery_level=93, solar_status="CHARGING", latitude=21.1449, longitude=79.0868),
            Device(device_id="FN-5", farm_id="WS-FARM-001", node_name="Farmer Node 05 (West Field)", device_type="FARMER_NODE", camera_status="ONLINE", network_status="ONLINE", battery_level=95, solar_status="CHARGING", latitude=21.1462, longitude=79.0865),
        ]
        db.add_all(devices)

    db.commit()


from sqlalchemy import (
    create_engine, Column, String, Integer, Float, Boolean, Text, DateTime, ForeignKey, Index, text
)

def init_db():
    """Create all database tables on Neon PostgreSQL, run safe migrations and seed defaults."""
    Base.metadata.create_all(bind=engine)
    
    # Run column migrations for existing PostgreSQL tables if necessary
    if "postgresql" in DATABASE_URL:
        try:
            with engine.connect() as conn:
                conn.execute(text("ALTER TABLE devices ADD COLUMN IF NOT EXISTS farmer_id VARCHAR(64) DEFAULT 'FARMER-001';"))
                conn.execute(text("ALTER TABLE devices ADD COLUMN IF NOT EXISTS platform VARCHAR(32) DEFAULT 'android';"))
                conn.execute(text("ALTER TABLE devices ADD COLUMN IF NOT EXISTS status VARCHAR(32) DEFAULT 'ONLINE';"))
                conn.execute(text("ALTER TABLE detections ADD COLUMN IF NOT EXISTS species_code VARCHAR(32) DEFAULT 'WS-WL-WB';"))
                conn.execute(text("ALTER TABLE detections ADD COLUMN IF NOT EXISTS code VARCHAR(32) DEFAULT 'WS-WL-WB';"))
                conn.execute(text("ALTER TABLE detections ADD COLUMN IF NOT EXISTS farm_zone VARCHAR(128) DEFAULT 'North Field';"))
                conn.execute(text("ALTER TABLE detections ADD COLUMN IF NOT EXISTS camera_id VARCHAR(64) DEFAULT 'FN-1';"))
                conn.execute(text("ALTER TABLE detections ADD COLUMN IF NOT EXISTS node_id VARCHAR(64) DEFAULT 'FN-1';"))
                conn.execute(text("ALTER TABLE detections ADD COLUMN IF NOT EXISTS inside_geofence BOOLEAN DEFAULT TRUE;"))
                conn.execute(text("ALTER TABLE detections ADD COLUMN IF NOT EXISTS decision_action VARCHAR(128) DEFAULT 'Siren + Floodlight';"))
                conn.execute(text("ALTER TABLE detections ADD COLUMN IF NOT EXISTS prevention_status VARCHAR(32) DEFAULT 'ACTIVE';"))
                conn.execute(text("ALTER TABLE detections ADD COLUMN IF NOT EXISTS actuators_json TEXT DEFAULT '{}';"))
                conn.execute(text("ALTER TABLE detections ADD COLUMN IF NOT EXISTS notification_status VARCHAR(32) DEFAULT 'SENT';"))
                conn.execute(text("ALTER TABLE detections ADD COLUMN IF NOT EXISTS status VARCHAR(32) DEFAULT 'DETECTED';"))
                conn.execute(text("ALTER TABLE detections ADD COLUMN IF NOT EXISTS timestamp VARCHAR(64) DEFAULT '';"))
                conn.execute(text("ALTER TABLE detections ADD COLUMN IF NOT EXISTS time_formatted VARCHAR(64) DEFAULT '';"))
                conn.execute(text("ALTER TABLE detections ADD COLUMN IF NOT EXISTS annotated_image TEXT;"))
                conn.execute(text("ALTER TABLE detections ADD COLUMN IF NOT EXISTS raw_payload_json TEXT;"))
                conn.execute(text("ALTER TABLE detections ADD COLUMN IF NOT EXISTS source VARCHAR(32) DEFAULT 'LIVE';"))
                conn.execute(text("ALTER TABLE intrusions ADD COLUMN IF NOT EXISTS device_id VARCHAR(64) DEFAULT 'FN-1';"))
                conn.execute(text("ALTER TABLE intrusions ADD COLUMN IF NOT EXISTS species_code VARCHAR(32) DEFAULT 'WS-WL-WB';"))
                conn.execute(text("ALTER TABLE intrusions ADD COLUMN IF NOT EXISTS confidence FLOAT DEFAULT 95.0;"))
                conn.execute(text("ALTER TABLE intrusions ADD COLUMN IF NOT EXISTS source VARCHAR(32) DEFAULT 'SIMULATION';"))
                conn.commit()
        except Exception as mig_err:
            print(f"[DATABASE MIGRATION NOTICE] {mig_err}")

    db = SessionLocal()
    try:
        seed_database(db)
        print("[DATABASE] Neon PostgreSQL connected & tables verified.")
    except Exception as e:
        db.rollback()
        print(f"[DATABASE ERROR] Failed to seed Neon database: {e}")

    finally:
        db.close()


def get_db():
    """Dependency for obtaining database session."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
