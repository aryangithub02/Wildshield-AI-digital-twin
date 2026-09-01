"""
WildShield AI — Complete Database Transfer to Supabase Script
Transfers Farmers, Farms, Farm Zones, Devices, Detections, Intrusions, Prevention Actions, Notifications, and Analytics Events into Supabase PostgreSQL.
"""

import json
import logging
from datetime import datetime
from backend.database import (
    SessionLocal, Farmer, Farm, FarmZone, Device,
    Detection, Intrusion, PreventionAction, Notification, AnalyticsEvent
)
from backend.supabase_db import (
    SupabaseSessionLocal, init_supabase_db,
    HistoricalFarmer, HistoricalFarm, HistoricalFarmZone, HistoricalDevice,
    HistoricalDetection, HistoricalIntrusion, HistoricalPreventionAction,
    HistoricalNotification, HistoricalAnalyticsEvent, HistoricalAnalyticsSummary
)

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("wildshield.transfer")

def transfer_all():
    logger.info("[TRANSFER] Initializing Supabase PostgreSQL schema...")
    if not init_supabase_db():
        logger.error("[TRANSFER FAILED] Could not connect to Supabase PostgreSQL.")
        return

    hot_db = SessionLocal()
    sup_db = SupabaseSessionLocal()

    try:
        # ==========================================
        # 1. Farmers
        # ==========================================
        hot_farmers = hot_db.query(Farmer).all()
        logger.info(f"[TRANSFER] Found {len(hot_farmers)} farmers...")
        for f in hot_farmers:
            if not sup_db.query(HistoricalFarmer).filter(HistoricalFarmer.farmer_id == f.farmer_id).first():
                sup_db.add(HistoricalFarmer(
                    farmer_id=f.farmer_id,
                    name=f.name,
                    phone=f.phone,
                    email=f.email,
                    created_at=f.created_at or datetime.utcnow()
                ))
        sup_db.commit()

        # ==========================================
        # 2. Farms
        # ==========================================
        hot_farms = hot_db.query(Farm).all()
        logger.info(f"[TRANSFER] Found {len(hot_farms)} farms...")
        for fm in hot_farms:
            if not sup_db.query(HistoricalFarm).filter(HistoricalFarm.farm_id == fm.farm_id).first():
                sup_db.add(HistoricalFarm(
                    farm_id=fm.farm_id,
                    farm_name=fm.farm_name,
                    owner_id=fm.owner_id,
                    location=fm.location,
                    area=fm.area,
                    crop=fm.crop,
                    created_at=fm.created_at or datetime.utcnow()
                ))
        sup_db.commit()

        # ==========================================
        # 3. Farm Zones
        # ==========================================
        hot_zones = hot_db.query(FarmZone).all()
        logger.info(f"[TRANSFER] Found {len(hot_zones)} zones...")
        for z in hot_zones:
            if not sup_db.query(HistoricalFarmZone).filter(HistoricalFarmZone.zone_id == z.zone_id).first():
                sup_db.add(HistoricalFarmZone(
                    zone_id=z.zone_id,
                    farm_id=z.farm_id,
                    zone_name=z.zone_name,
                    zone_type=z.zone_type,
                    node_code=z.node_code,
                    geofence=z.geofence or "{}",
                    created_at=z.created_at or datetime.utcnow()
                ))
        sup_db.commit()

        # ==========================================
        # 4. Devices
        # ==========================================
        hot_devices = hot_db.query(Device).all()
        logger.info(f"[TRANSFER] Found {len(hot_devices)} devices...")
        for d in hot_devices:
            if not sup_db.query(HistoricalDevice).filter(HistoricalDevice.device_id == d.device_id).first():
                sup_db.add(HistoricalDevice(
                    device_id=d.device_id,
                    farm_id=d.farm_id,
                    farmer_id=d.farmer_id,
                    node_name=d.node_name,
                    device_type=d.device_type,
                    camera_status=d.camera_status,
                    network_status=d.network_status,
                    battery_level=d.battery_level,
                    solar_status=d.solar_status,
                    fcm_token=d.fcm_token,
                    platform=d.platform,
                    status=d.status,
                    latitude=d.latitude,
                    longitude=d.longitude,
                    last_seen=d.last_seen,
                    created_at=d.created_at or datetime.utcnow()
                ))
        sup_db.commit()

        # ==========================================
        # 5. Detections
        # ==========================================
        hot_detections = hot_db.query(Detection).all()
        logger.info(f"[TRANSFER] Found {len(hot_detections)} detections in Hot DB...")
        det_count = 0
        for d in hot_detections:
            existing = sup_db.query(HistoricalDetection).filter(HistoricalDetection.event_id == d.event_id).first()
            if not existing:
                img_ref = d.image_path or d.annotated_image_path or d.annotated_image
                if img_ref and len(img_ref) > 500:
                    img_ref = f"/api/events/{d.event_id}/image"

                sup_db.add(HistoricalDetection(
                    event_id=d.event_id,
                    farm_id=d.farm_id or "WS-FARM-001",
                    device_id=d.device_id or "FN-1",
                    camera_id=getattr(d, 'camera_id', 'FN-1'),
                    node_id=getattr(d, 'node_id', 'FN-1'),
                    zone_id=d.zone_id or "ZONE-01",
                    farm_zone=getattr(d, 'farm_zone', 'North Field'),
                    species=d.species,
                    species_code=getattr(d, 'species_code', 'WS-WL-WB'),
                    code=getattr(d, 'code', 'WS-WL-WB'),
                    confidence=d.confidence or 95.0,
                    bbox=d.bbox or "[]",
                    threat_level=d.threat_level or "HIGH",
                    intrusion=d.intrusion if d.intrusion is not None else True,
                    inside_geofence=getattr(d, 'inside_geofence', True),
                    source=d.source or "LIVE",
                    image_url=img_ref,
                    inference_time_ms=d.inference_time_ms or 94.5,
                    decision_action=getattr(d, 'decision_action', 'Siren + Floodlight'),
                    prevention_status=getattr(d, 'prevention_status', 'COMPLETED'),
                    actuators_json=d.actuators_json or "{}",
                    notification_status=getattr(d, 'notification_status', 'SENT'),
                    status=d.status or "DETECTED",
                    timestamp=d.timestamp or "",
                    time_formatted=getattr(d, 'time_formatted', ''),
                    raw_payload_json=d.raw_payload_json,
                    detected_at=d.detected_at or "",
                    archived_at=datetime.utcnow(),
                    created_at=d.created_at or datetime.utcnow()
                ))
                det_count += 1
        sup_db.commit()
        logger.info(f"[TRANSFER OK] Synchronized {det_count} detections to Supabase.")

        # ==========================================
        # 6. Intrusions
        # ==========================================
        hot_intrusions = hot_db.query(Intrusion).all()
        logger.info(f"[TRANSFER] Found {len(hot_intrusions)} intrusions in Hot DB...")
        int_count = 0
        for i in hot_intrusions:
            existing = sup_db.query(HistoricalIntrusion).filter(HistoricalIntrusion.intrusion_id == i.intrusion_id).first()
            if not existing:
                sup_db.add(HistoricalIntrusion(
                    intrusion_id=i.intrusion_id,
                    event_id=i.event_id,
                    farm_id=i.farm_id or "WS-FARM-001",
                    device_id=getattr(i, 'device_id', 'FN-1'),
                    species=i.species,
                    species_code=getattr(i, 'species_code', 'WS-WL-WB'),
                    confidence=getattr(i, 'confidence', 95.0),
                    zone_id=i.zone_id or "ZONE-01",
                    threat_level=i.threat_level or "HIGH",
                    status=i.status or "CLEARED",
                    entered_at=i.entered_at or "",
                    exited_at=i.exited_at or "",
                    source=getattr(i, 'source', 'LIVE'),
                    archived_at=datetime.utcnow(),
                    created_at=i.created_at or datetime.utcnow()
                ))
                int_count += 1
        sup_db.commit()
        logger.info(f"[TRANSFER OK] Synchronized {int_count} intrusions to Supabase.")

        # ==========================================
        # 7. Prevention Actions
        # ==========================================
        hot_prev = hot_db.query(PreventionAction).all()
        logger.info(f"[TRANSFER] Found {len(hot_prev)} prevention actions...")
        prev_count = 0
        for p in hot_prev:
            existing = sup_db.query(HistoricalPreventionAction).filter(HistoricalPreventionAction.prevention_id == p.prevention_id).first()
            if not existing:
                sup_db.add(HistoricalPreventionAction(
                    prevention_id=p.prevention_id,
                    event_id=p.event_id,
                    siren=p.siren,
                    floodlight=p.floodlight,
                    speaker=p.speaker,
                    sprinkler=p.sprinkler,
                    decision=p.decision or "Siren + Floodlight",
                    status=p.status or "COMPLETED",
                    activated_at=p.activated_at or "",
                    deactivated_at=p.deactivated_at,
                    archived_at=datetime.utcnow(),
                    created_at=p.created_at or datetime.utcnow()
                ))
                prev_count += 1
        sup_db.commit()
        logger.info(f"[TRANSFER OK] Synchronized {prev_count} prevention actions to Supabase.")

        # ==========================================
        # 8. Notifications
        # ==========================================
        hot_notifs = hot_db.query(Notification).all()
        logger.info(f"[TRANSFER] Found {len(hot_notifs)} notifications...")
        notif_count = 0
        for n in hot_notifs:
            existing = sup_db.query(HistoricalNotification).filter(HistoricalNotification.notification_id == n.notification_id).first()
            if not existing:
                sup_db.add(HistoricalNotification(
                    notification_id=n.notification_id,
                    event_id=n.event_id,
                    farmer_id=n.farmer_id or "FARMER-001",
                    title=n.title,
                    message=n.message,
                    notification_type=n.notification_type or "INTRUSION_ALERT",
                    fcm_token=n.fcm_token,
                    status=n.status or "READ",
                    sent_at=n.sent_at or "",
                    read_at=n.read_at,
                    archived_at=datetime.utcnow(),
                    created_at=n.created_at or ""
                ))
                notif_count += 1
        sup_db.commit()
        logger.info(f"[TRANSFER OK] Synchronized {notif_count} notifications to Supabase.")

        # ==========================================
        # 9. Analytics Events
        # ==========================================
        hot_analytics = hot_db.query(AnalyticsEvent).all()
        logger.info(f"[TRANSFER] Found {len(hot_analytics)} analytics events...")
        ana_count = 0
        for a in hot_analytics:
            existing = sup_db.query(HistoricalAnalyticsEvent).filter(HistoricalAnalyticsEvent.event_id == a.event_id).first()
            if not existing:
                sup_db.add(HistoricalAnalyticsEvent(
                    farm_id=a.farm_id or "WS-FARM-001",
                    event_id=a.event_id,
                    species=a.species,
                    zone_id=a.zone_id or "ZONE-01",
                    threat_level=a.threat_level or "HIGH",
                    prevention_used=a.prevention_used or "Siren + Floodlight",
                    source=a.source or "LIVE",
                    timestamp=a.timestamp or "",
                    created_at=a.created_at or datetime.utcnow()
                ))
                ana_count += 1
        sup_db.commit()
        logger.info(f"[TRANSFER OK] Synchronized {ana_count} analytics events to Supabase.")

        # ==========================================
        # 10. Aggregated Historical Analytics Summary
        # ==========================================
        today_str = datetime.utcnow().strftime("%Y-%m-%d")
        all_sup_dets = sup_db.query(HistoricalDetection).all()
        species_map = {}
        for sd in all_sup_dets:
            species_map[sd.species] = species_map.get(sd.species, 0) + 1

        summary_existing = sup_db.query(HistoricalAnalyticsSummary).filter(
            HistoricalAnalyticsSummary.date == today_str
        ).first()

        if summary_existing:
            summary_existing.total_detections = len(all_sup_dets)
            summary_existing.total_intrusions = sup_db.query(HistoricalIntrusion).count()
            summary_existing.high_threat_events = sum(1 for d in all_sup_dets if d.threat_level in ["HIGH", "CRITICAL"])
            summary_existing.prevention_actions = sup_db.query(HistoricalPreventionAction).count()
            summary_existing.notifications_sent = sup_db.query(HistoricalNotification).count()
            summary_existing.species_breakdown_json = json.dumps(species_map)
        else:
            sup_db.add(HistoricalAnalyticsSummary(
                date=today_str,
                total_detections=len(all_sup_dets),
                total_intrusions=sup_db.query(HistoricalIntrusion).count(),
                high_threat_events=sum(1 for d in all_sup_dets if d.threat_level in ["HIGH", "CRITICAL"]),
                prevention_actions=sup_db.query(HistoricalPreventionAction).count(),
                notifications_sent=sup_db.query(HistoricalNotification).count(),
                species_breakdown_json=json.dumps(species_map),
                archived_at=datetime.utcnow()
            ))
        sup_db.commit()
        logger.info("[TRANSFER COMPLETE] All tables successfully transferred and stored in Supabase PostgreSQL!")
        print("[SUCCESS] All analytic data, detections, notifications, prevention, farm, devices and integrations transferred directly into Supabase PostgreSQL!")
    except Exception as e:
        sup_db.rollback()
        logger.error(f"[TRANSFER ERROR] Failed transfer: {e}")
        raise e
    finally:
        hot_db.close()
        sup_db.close()

if __name__ == "__main__":
    transfer_all()
