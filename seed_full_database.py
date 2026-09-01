"""
WildShield AI — Full Database Seeder Script
Populates Neon PostgreSQL database with realistic detections, active intrusions, alerts, notifications, and analytics.
"""

import json
from datetime import datetime, timedelta
from backend.database import (
    SessionLocal, init_db, Farmer, Farm, FarmZone, Device,
    Detection, Intrusion, PreventionAction, Notification, AnalyticsEvent
)

def seed_full_data():
    print("[SEEDER] Initializing database connection and table schema...")
    init_db()
    db = SessionLocal()

    try:
        # 1. Farmers
        if db.query(Farmer).count() == 0:
            db.add(Farmer(
                farmer_id="FARMER-001",
                name="Rajesh Patel",
                phone="+91 98220 12345",
                email="rajesh.patel@wildshield.ai"
            ))

        # 2. Farms
        if db.query(Farm).count() == 0:
            db.add(Farm(
                farm_id="WS-FARM-001",
                farm_name="Demo Farm (Wardha)",
                owner_id="FARMER-001",
                location="Wardha, Maharashtra",
                area=12.5,
                crop="Cotton & Pulses"
            ))

        # 3. Farm Zones
        if db.query(FarmZone).count() == 0:
            zones = [
                FarmZone(zone_id="ZONE-01", farm_id="WS-FARM-001", zone_name="North Field", zone_type="CROP", node_code="FN-1"),
                FarmZone(zone_id="ZONE-02", farm_id="WS-FARM-001", zone_name="East Orchard", zone_type="ORCHARD", node_code="FN-2"),
                FarmZone(zone_id="ZONE-03", farm_id="WS-FARM-001", zone_name="South-East Pulse Field", zone_type="CROP", node_code="FN-3"),
                FarmZone(zone_id="ZONE-04", farm_id="WS-FARM-001", zone_name="South-West Grassland", zone_type="BUFFER", node_code="FN-4"),
                FarmZone(zone_id="ZONE-05", farm_id="WS-FARM-001", zone_name="West Vegetable Field", zone_type="CROP", node_code="FN-5"),
            ]
            db.add_all(zones)

        # 4. Devices
        if db.query(Device).count() == 0:
            devices = [
                Device(device_id="FN-1", farm_id="WS-FARM-001", farmer_id="FARMER-001", node_name="Farmer Node 01 (North Field)", device_type="FARMER_NODE", camera_status="ONLINE", network_status="ONLINE", battery_level=87, solar_status="CHARGING", latitude=21.1465, longitude=79.0880, platform="android", status="ONLINE"),
                Device(device_id="FN-2", farm_id="WS-FARM-001", farmer_id="FARMER-001", node_name="Farmer Node 02 (East Field)", device_type="FARMER_NODE", camera_status="ONLINE", network_status="ONLINE", battery_level=89, solar_status="CHARGING", latitude=21.1460, longitude=79.0895, platform="android", status="ONLINE"),
                Device(device_id="FN-3", farm_id="WS-FARM-001", farmer_id="FARMER-001", node_name="Farmer Node 03 (South-East Field)", device_type="FARMER_NODE", camera_status="ONLINE", network_status="ONLINE", battery_level=91, solar_status="CHARGING", latitude=21.1448, longitude=79.0892, platform="android", status="ONLINE"),
                Device(device_id="FN-4", farm_id="WS-FARM-001", farmer_id="FARMER-001", node_name="Farmer Node 04 (South-West Field)", device_type="FARMER_NODE", camera_status="ONLINE", network_status="ONLINE", battery_level=93, solar_status="CHARGING", latitude=21.1449, longitude=79.0868, platform="android", status="ONLINE"),
                Device(device_id="FN-5", farm_id="WS-FARM-001", farmer_id="FARMER-001", node_name="Farmer Node 05 (West Field)", device_type="FARMER_NODE", camera_status="ONLINE", network_status="ONLINE", battery_level=95, solar_status="CHARGING", latitude=21.1462, longitude=79.0865, platform="android", status="ONLINE"),
            ]
            db.add_all(devices)

        db.commit()
        print("[SEEDER] Standard Farm, Zones, and Devices verified.")

        # 5. Detections & Intrusions Data
        sample_detections = [
            {
                "event_id": "WS-EVT-20260901-00101",
                "intrusion_id": "WS-INT-20260901-00101",
                "species": "Wild Boar",
                "species_code": "WS-WL-WB",
                "confidence": 96.8,
                "threat_level": "HIGH",
                "zone_id": "ZONE-01",
                "farm_zone": "North Field",
                "camera_id": "FN-1",
                "decision_action": "Siren + Floodlight",
                "prevention_status": "ACTIVE",
                "actuators": {"siren": True, "floodlight": True, "speaker": False, "sprinkler": False},
                "source": "LIVE",
                "time_formatted": "08:45 AM",
                "timestamp": (datetime.utcnow() - timedelta(minutes=15)).isoformat(),
                "is_intrusion": True,
                "intrusion_status": "ACTIVE"
            },
            {
                "event_id": "WS-EVT-20260901-00102",
                "intrusion_id": "WS-INT-20260901-00102",
                "species": "Nilgai",
                "species_code": "WS-WL-NG",
                "confidence": 94.2,
                "threat_level": "HIGH",
                "zone_id": "ZONE-02",
                "farm_zone": "East Orchard",
                "camera_id": "FN-2",
                "decision_action": "Floodlight + Siren",
                "prevention_status": "ACTIVE",
                "actuators": {"siren": True, "floodlight": True, "speaker": False, "sprinkler": False},
                "source": "SIMULATION",
                "time_formatted": "08:12 AM",
                "timestamp": (datetime.utcnow() - timedelta(minutes=48)).isoformat(),
                "is_intrusion": True,
                "intrusion_status": "ACTIVE"
            },
            {
                "event_id": "WS-EVT-20260901-00103",
                "intrusion_id": "WS-INT-20260901-00103",
                "species": "Spotted Deer",
                "species_code": "WS-WL-SD",
                "confidence": 91.5,
                "threat_level": "MEDIUM",
                "zone_id": "ZONE-03",
                "farm_zone": "South-East Pulse Field",
                "camera_id": "FN-3",
                "decision_action": "Floodlight + Mild Alarm",
                "prevention_status": "COMPLETED",
                "actuators": {"siren": True, "floodlight": True, "speaker": False, "sprinkler": False},
                "source": "LIVE",
                "time_formatted": "07:30 AM",
                "timestamp": (datetime.utcnow() - timedelta(hours=1, minutes=30)).isoformat(),
                "is_intrusion": True,
                "intrusion_status": "CLEARED"
            },
            {
                "event_id": "WS-EVT-20260901-00104",
                "intrusion_id": "WS-INT-20260901-00104",
                "species": "Rhesus Macaque",
                "species_code": "WS-WL-RM",
                "confidence": 89.4,
                "threat_level": "HIGH",
                "zone_id": "ZONE-05",
                "farm_zone": "West Vegetable Field",
                "camera_id": "FN-5",
                "decision_action": "Predator Audio + Floodlight",
                "prevention_status": "COMPLETED",
                "actuators": {"siren": False, "floodlight": True, "speaker": True, "sprinkler": False},
                "source": "LIVE",
                "time_formatted": "06:50 AM",
                "timestamp": (datetime.utcnow() - timedelta(hours=2, minutes=10)).isoformat(),
                "is_intrusion": True,
                "intrusion_status": "CLEARED"
            },
            {
                "event_id": "WS-EVT-20260901-00105",
                "intrusion_id": "WS-INT-20260901-00105",
                "species": "Gaur",
                "species_code": "WS-WL-GR",
                "confidence": 97.8,
                "threat_level": "CRITICAL",
                "zone_id": "ZONE-04",
                "farm_zone": "South-West Grassland",
                "camera_id": "FN-4",
                "decision_action": "Siren + Floodlight + Farmer Alert",
                "prevention_status": "COMPLETED",
                "actuators": {"siren": True, "floodlight": True, "speaker": False, "sprinkler": False},
                "source": "SIMULATION",
                "time_formatted": "05:15 AM",
                "timestamp": (datetime.utcnow() - timedelta(hours=3, minutes=45)).isoformat(),
                "is_intrusion": True,
                "intrusion_status": "CLOSED"
            },
            {
                "event_id": "WS-EVT-20260831-00098",
                "intrusion_id": "WS-INT-20260831-00098",
                "species": "Cattle",
                "species_code": "WS-DM-CT",
                "confidence": 93.0,
                "threat_level": "LOW",
                "zone_id": "ZONE-01",
                "farm_zone": "North Field",
                "camera_id": "FN-1",
                "decision_action": "Farmer Notification Only",
                "prevention_status": "COMPLETED",
                "actuators": {"siren": False, "floodlight": False, "speaker": False, "sprinkler": False},
                "source": "LIVE",
                "time_formatted": "11:45 PM",
                "timestamp": (datetime.utcnow() - timedelta(hours=9, minutes=15)).isoformat(),
                "is_intrusion": False,
                "intrusion_status": "CLEARED"
            },
            {
                "event_id": "WS-EVT-20260831-00097",
                "intrusion_id": "WS-INT-20260831-00097",
                "species": "Langur",
                "species_code": "WS-WL-LG",
                "confidence": 92.1,
                "threat_level": "MEDIUM",
                "zone_id": "ZONE-02",
                "farm_zone": "East Orchard",
                "camera_id": "FN-2",
                "decision_action": "Predator Audio + Floodlight",
                "prevention_status": "COMPLETED",
                "actuators": {"siren": False, "floodlight": True, "speaker": True, "sprinkler": False},
                "source": "SIMULATION",
                "time_formatted": "09:30 PM",
                "timestamp": (datetime.utcnow() - timedelta(hours=11, minutes=30)).isoformat(),
                "is_intrusion": True,
                "intrusion_status": "CLOSED"
            },
            {
                "event_id": "WS-EVT-20260831-00096",
                "intrusion_id": "WS-INT-20260831-00096",
                "species": "Wild Boar",
                "species_code": "WS-WL-WB",
                "confidence": 98.2,
                "threat_level": "HIGH",
                "zone_id": "ZONE-03",
                "farm_zone": "South-East Pulse Field",
                "camera_id": "FN-3",
                "decision_action": "Siren + Floodlight",
                "prevention_status": "COMPLETED",
                "actuators": {"siren": True, "floodlight": True, "speaker": False, "sprinkler": False},
                "source": "LIVE",
                "time_formatted": "08:15 PM",
                "timestamp": (datetime.utcnow() - timedelta(hours=12, minutes=45)).isoformat(),
                "is_intrusion": True,
                "intrusion_status": "CLOSED"
            }
        ]

        print(f"[SEEDER] Processing {len(sample_detections)} detection events...")
        for item in sample_detections:
            # Check if event already exists
            existing_evt = db.query(Detection).filter(Detection.event_id == item["event_id"]).first()
            if not existing_evt:
                raw_payload = {
                    "event_id": item["event_id"],
                    "intrusion_id": item["intrusion_id"],
                    "farm_id": "WS-FARM-001",
                    "source": item["source"],
                    "timestamp": item["timestamp"],
                    "time_formatted": item["time_formatted"],
                    "camera_id": item["camera_id"],
                    "node_id": item["camera_id"],
                    "node_name": item["farm_zone"],
                    "inference_time_ms": 88.5,
                    "detection_count": 1,
                    "status": "DETECTED",
                    "intrusion": item["is_intrusion"],
                    "max_threat": item["threat_level"],
                    "primary_detection": {
                        "class": item["species"],
                        "code": item["species_code"],
                        "confidence": item["confidence"] / 100.0,
                        "confidence_pct": item["confidence"],
                        "bbox": [150, 120, 450, 380]
                    },
                    "location": {
                        "zone": item["farm_zone"],
                        "distance_m": 12.5,
                        "inside_geofence": item["is_intrusion"]
                    },
                    "threat": {"level": item["threat_level"]},
                    "decision": {"action": item["decision_action"], "actuators": item["actuators"]},
                    "prevention": {**item["actuators"], "status": item["prevention_status"]},
                    "notification": {"status": "SENT", "channel": "FCM"}
                }

                # 1. Add Detection
                det_record = Detection(
                    event_id=item["event_id"],
                    farm_id="WS-FARM-001",
                    device_id=item["camera_id"],
                    camera_id=item["camera_id"],
                    node_id=item["camera_id"],
                    zone_id=item["zone_id"],
                    farm_zone=item["farm_zone"],
                    species=item["species"],
                    species_code=item["species_code"],
                    code=item["species_code"],
                    confidence=item["confidence"],
                    bbox=json.dumps([150, 120, 450, 380]),
                    threat_level=item["threat_level"],
                    intrusion=item["is_intrusion"],
                    inside_geofence=item["is_intrusion"],
                    source=item["source"],
                    inference_time_ms=88.5,
                    decision_action=item["decision_action"],
                    prevention_status=item["prevention_status"],
                    actuators_json=json.dumps(item["actuators"]),
                    notification_status="SENT",
                    status="DETECTED",
                    timestamp=item["timestamp"],
                    time_formatted=item["time_formatted"],
                    detected_at=item["timestamp"],
                    raw_payload_json=json.dumps(raw_payload)
                )
                db.add(det_record)

            # 2. Add Intrusion Record
            existing_int = db.query(Intrusion).filter(Intrusion.intrusion_id == item["intrusion_id"]).first()
            if not existing_int:
                int_record = Intrusion(
                    intrusion_id=item["intrusion_id"],
                    event_id=item["event_id"],
                    farm_id="WS-FARM-001",
                    device_id=item["camera_id"],
                    species=item["species"],
                    species_code=item["species_code"],
                    confidence=item["confidence"],
                    zone_id=item["zone_id"],
                    threat_level=item["threat_level"],
                    status=item["intrusion_status"],
                    entered_at=item["timestamp"],
                    exited_at=(datetime.fromisoformat(item["timestamp"]) + timedelta(minutes=15)).isoformat() if item["intrusion_status"] != "ACTIVE" else None,
                    source=item["source"]
                )
                db.add(int_record)

            # 3. Add Prevention Action
            existing_prev = db.query(PreventionAction).filter(PreventionAction.event_id == item["event_id"]).first()
            if not existing_prev:
                prev_record = PreventionAction(
                    prevention_id=f"PREV-{item['event_id']}",
                    event_id=item["event_id"],
                    siren=item["actuators"].get("siren", False),
                    floodlight=item["actuators"].get("floodlight", False),
                    speaker=item["actuators"].get("speaker", False),
                    sprinkler=item["actuators"].get("sprinkler", False),
                    decision=item["decision_action"],
                    status=item["prevention_status"],
                    activated_at=item["timestamp"]
                )
                db.add(prev_record)

            # 4. Add Analytics Event
            existing_ana = db.query(AnalyticsEvent).filter(AnalyticsEvent.event_id == item["event_id"]).first()
            if not existing_ana:
                ana_record = AnalyticsEvent(
                    farm_id="WS-FARM-001",
                    event_id=item["event_id"],
                    species=item["species"],
                    zone_id=item["zone_id"],
                    threat_level=item["threat_level"],
                    prevention_used=item["decision_action"],
                    source=item["source"],
                    timestamp=item["timestamp"]
                )
                db.add(ana_record)

        # 6. Notifications Data
        sample_notifications = [
            {
                "notification_id": "NOTIF-001",
                "event_id": "WS-EVT-20260901-00101",
                "title": "🚨 CRITICAL INTRUSION ALERT",
                "message": "Wild Boar detected in North Field. Ultrasonic Siren & LED Floodlight engaged.",
                "type": "INTRUSION_ALERT",
                "status": "SENT",
                "created_at": (datetime.utcnow() - timedelta(minutes=15)).isoformat()
            },
            {
                "notification_id": "NOTIF-002",
                "event_id": "WS-EVT-20260901-00102",
                "title": "⚠️ HIGH THREAT DETECTED",
                "message": "Nilgai detected entering East Orchard perimeter.",
                "type": "INTRUSION_ALERT",
                "status": "SENT",
                "created_at": (datetime.utcnow() - timedelta(minutes=48)).isoformat()
            },
            {
                "notification_id": "NOTIF-003",
                "event_id": "WS-EVT-20260901-00103",
                "title": "🔔 SPECIES MONITORED",
                "message": "Spotted Deer detected near South-East Pulse Field boundary.",
                "type": "INTRUSION_ALERT",
                "status": "READ",
                "created_at": (datetime.utcnow() - timedelta(hours=1, minutes=30)).isoformat()
            },
            {
                "notification_id": "NOTIF-004",
                "event_id": "WS-EVT-20260901-00104",
                "title": "🐒 PRIMATE INTRUSION",
                "message": "Rhesus Macaque troop detected in West Vegetable Field. Sprinkler pulse activated.",
                "type": "INTRUSION_ALERT",
                "status": "READ",
                "created_at": (datetime.utcnow() - timedelta(hours=2, minutes=10)).isoformat()
            },
            {
                "notification_id": "NOTIF-005",
                "event_id": "SYS-INFO-001",
                "title": "⚡ HARDWARE NODE STATUS",
                "message": "Farmer Node 01 solar charging optimal (87% battery level).",
                "type": "SYSTEM_INFO",
                "status": "READ",
                "created_at": (datetime.utcnow() - timedelta(hours=4)).isoformat()
            },
            {
                "notification_id": "NOTIF-006",
                "event_id": "SYS-INFO-002",
                "title": "🛡️ SYSTEM GEOFENCE ACTIVE",
                "message": "All 5 Farmer Edge Nodes online and active on perimeter.",
                "type": "SYSTEM_INFO",
                "status": "READ",
                "created_at": (datetime.utcnow() - timedelta(hours=5)).isoformat()
            },
            {
                "notification_id": "NOTIF-007",
                "event_id": "WS-EVT-20260901-00103",
                "title": "✅ INTRUSION CLEARED",
                "message": "Spotted Deer exited South-East Pulse Field perimeter safely.",
                "type": "INTRUSION_CLEARED",
                "status": "READ",
                "created_at": (datetime.utcnow() - timedelta(hours=1, minutes=15)).isoformat()
            }
        ]

        for notif in sample_notifications:
            existing_notif = db.query(Notification).filter(Notification.notification_id == notif["notification_id"]).first()
            if not existing_notif:
                n_rec = Notification(
                    notification_id=notif["notification_id"],
                    event_id=notif["event_id"],
                    farmer_id="FARMER-001",
                    title=notif["title"],
                    message=notif["message"],
                    notification_type=notif["type"],
                    status=notif["status"],
                    created_at=notif["created_at"],
                    sent_at=notif["created_at"]
                )
                db.add(n_rec)

        db.commit()
        print(f"[SEEDER SUCCESS] Seeding completed! Real detection events, intrusions, alerts & notifications saved to Neon PostgreSQL.")
    except Exception as err:
        db.rollback()
        print(f"[SEEDER ERROR] Failed to seed database: {err}")
        raise err
    finally:
        db.close()

if __name__ == "__main__":
    seed_full_data()
