"""
WildShield AI — Automated Database Migration & Archival Worker
Migrates old, completed operational records from Hot PostgreSQL to Supabase Historical PostgreSQL.

Flow:
1. Find eligible completed records older than ARCHIVE_AFTER_DAYS.
2. Read record from Hot DB.
3. Insert into Supabase PostgreSQL.
4. Verify Supabase insertion.
5. Delete from Hot DB only after verification.
6. Record metrics and errors.
"""

import os
import json
import logging
from datetime import datetime, timedelta
from typing import Dict, Any, List

from backend.database import (
    SessionLocal, Detection, Intrusion, PreventionAction, Notification, AnalyticsEvent
)
from backend.supabase_db import (
    SupabaseSessionLocal, init_supabase_db,
    HistoricalDetection, HistoricalIntrusion, HistoricalPreventionAction,
    HistoricalNotification, HistoricalAnalyticsSummary
)

logger = logging.getLogger("wildshield.migration_worker")
logging.basicConfig(level=logging.INFO)

# Global in-memory metrics tracking
MIGRATION_METRICS: Dict[str, Any] = {
    "last_migration_time": None,
    "migration_success_count": 0,
    "migration_failure_count": 0,
    "last_run_status": "IDLE",
    "last_run_summary": {}
}


def get_retention_days() -> int:
    """Retrieve retention threshold in days from environment variable ARCHIVE_AFTER_DAYS."""
    try:
        return int(os.getenv("ARCHIVE_AFTER_DAYS", "30"))
    except ValueError:
        return 30


def get_storage_status() -> Dict[str, Any]:
    """
    Return monitoring statistics for Hot PostgreSQL and Supabase Historical PostgreSQL databases.
    """
    retention_days = get_retention_days()
    cutoff_dt = datetime.utcnow() - timedelta(days=retention_days)

    hot_db = SessionLocal()
    supabase_db = SupabaseSessionLocal()

    try:
        # Hot DB metrics
        hot_detections = hot_db.query(Detection).count()
        hot_intrusions = hot_db.query(Intrusion).count()
        hot_prevention = hot_db.query(PreventionAction).count()
        hot_notifications = hot_db.query(Notification).count()
        hot_total = hot_detections + hot_intrusions + hot_prevention + hot_notifications

        # Eligible for migration in Hot DB (created before cutoff_dt and in completed/closed/cleared state)
        eligible_intrusions = hot_db.query(Intrusion).filter(
            Intrusion.created_at <= cutoff_dt,
            Intrusion.status.in_(["CLEARED", "CLOSED", "RESOLVED"])
        ).count()

        eligible_detections = hot_db.query(Detection).filter(
            Detection.created_at <= cutoff_dt,
            Detection.prevention_status.in_(["COMPLETED", "STANDBY", "CLEARED"])
        ).count()

        eligible_notifications = hot_db.query(Notification).filter(
            Notification.status.in_(["SENT", "DELIVERED", "READ", "FAILED"])
        ).count()

        eligible_total = eligible_intrusions + eligible_detections

        # Supabase DB metrics
        archived_detections = 0
        archived_intrusions = 0
        archived_prevention = 0
        archived_notifications = 0

        try:
            archived_detections = supabase_db.query(HistoricalDetection).count()
            archived_intrusions = supabase_db.query(HistoricalIntrusion).count()
            archived_prevention = supabase_db.query(HistoricalPreventionAction).count()
            archived_notifications = supabase_db.query(HistoricalNotification).count()
        except Exception as sup_err:
            logger.warning(f"Could not query Supabase storage stats: {sup_err}")

        archived_total = archived_detections + archived_intrusions + archived_prevention + archived_notifications

        return {
            "status": "online",
            "hot_database_records": {
                "total": hot_total,
                "detections": hot_detections,
                "intrusions": hot_intrusions,
                "prevention_actions": hot_prevention,
                "notifications": hot_notifications
            },
            "archived_database_records": {
                "total": archived_total,
                "detections": archived_detections,
                "intrusions": archived_intrusions,
                "prevention_actions": archived_prevention,
                "notifications": archived_notifications
            },
            "eligible_for_migration": eligible_total,
            "last_migration_time": MIGRATION_METRICS.get("last_migration_time"),
            "migration_success_count": MIGRATION_METRICS.get("migration_success_count", 0),
            "migration_failure_count": MIGRATION_METRICS.get("migration_failure_count", 0),
            "retention_days": retention_days,
            "cutoff_timestamp": cutoff_dt.isoformat(),
            "architecture": {
                "hot_database": "Operational PostgreSQL (Neon/Local)",
                "historical_database": "Permanent Supabase PostgreSQL",
                "orchestrator": "FastAPI Unified Communication Layer"
            }
        }
    finally:
        hot_db.close()
        supabase_db.close()


def run_migration_cycle(force_all_completed: bool = False) -> Dict[str, Any]:
    """
    Executes a complete migration cycle:
    1. Query completed/closed records older than ARCHIVE_AFTER_DAYS (or all completed if forced).
    2. Insert into Supabase.
    3. Verify Supabase record exists.
    4. Delete from Hot PostgreSQL.
    """
    retention_days = get_retention_days()
    cutoff_dt = datetime.utcnow() - timedelta(days=retention_days)

    logger.info(f"[MIGRATION WORKER] Starting archival cycle. Retention: {retention_days} days (Cutoff: {cutoff_dt.isoformat()})...")

    # Initialize Supabase DB tables if needed
    if not init_supabase_db():
        msg = "Supabase PostgreSQL unavailable. Aborting migration cycle to protect data."
        logger.error(f"[MIGRATION WORKER] {msg}")
        MIGRATION_METRICS["last_run_status"] = "FAILED"
        MIGRATION_METRICS["migration_failure_count"] += 1
        return {"status": "error", "message": msg}

    hot_db = SessionLocal()
    supabase_db = SupabaseSessionLocal()

    migrated_intrusions = 0
    migrated_detections = 0
    migrated_prevention = 0
    migrated_notifications = 0
    failed_count = 0

    try:
        # =========================================================
        # 1. Migrate Completed Intrusions (CLEARED, CLOSED, RESOLVED)
        # =========================================================
        int_query = hot_db.query(Intrusion).filter(
            Intrusion.status.in_(["CLEARED", "CLOSED", "RESOLVED"])
        )
        if not force_all_completed:
            int_query = int_query.filter(Intrusion.created_at <= cutoff_dt)

        eligible_intrusions = int_query.all()
        logger.info(f"[MIGRATION WORKER] Found {len(eligible_intrusions)} eligible intrusions to migrate.")

        for item in eligible_intrusions:
            try:
                # 1. Insert into Supabase (if not already present)
                existing = supabase_db.query(HistoricalIntrusion).filter(
                    HistoricalIntrusion.intrusion_id == item.intrusion_id
                ).first()

                if not existing:
                    hist_int = HistoricalIntrusion(
                        intrusion_id=item.intrusion_id,
                        event_id=item.event_id,
                        farm_id=item.farm_id or "WS-FARM-001",
                        device_id=getattr(item, 'device_id', 'FN-1'),
                        species=item.species,
                        species_code=getattr(item, 'species_code', 'WS-WL-WB'),
                        confidence=getattr(item, 'confidence', 95.0),
                        zone_id=item.zone_id or "ZONE-01",
                        threat_level=item.threat_level,
                        status=item.status,
                        entered_at=item.entered_at or "",
                        exited_at=item.exited_at or "",
                        source=getattr(item, 'source', 'LIVE'),
                        archived_at=datetime.utcnow(),
                        created_at=item.created_at or datetime.utcnow()
                    )
                    supabase_db.add(hist_int)
                    supabase_db.commit()

                # 2. Verify Supabase record exists
                verify = supabase_db.query(HistoricalIntrusion).filter(
                    HistoricalIntrusion.intrusion_id == item.intrusion_id
                ).first()

                if verify:
                    # 3. Delete from Hot DB only AFTER successful verification
                    hot_db.delete(item)
                    hot_db.commit()
                    migrated_intrusions += 1
                else:
                    logger.error(f"[MIGRATION ERROR] Verification failed for intrusion {item.intrusion_id}")
                    failed_count += 1
            except Exception as e:
                supabase_db.rollback()
                hot_db.rollback()
                logger.error(f"[MIGRATION ERROR] Failed migrating intrusion {item.intrusion_id}: {e}")
                failed_count += 1

        # =========================================================
        # 2. Migrate Historical Detections (COMPLETED, STANDBY, CLEARED)
        # =========================================================
        det_query = hot_db.query(Detection).filter(
            Detection.prevention_status.in_(["COMPLETED", "STANDBY", "CLEARED"])
        )
        if not force_all_completed:
            det_query = det_query.filter(Detection.created_at <= cutoff_dt)

        eligible_detections = det_query.all()
        logger.info(f"[MIGRATION WORKER] Found {len(eligible_detections)} eligible detection events to migrate.")

        for item in eligible_detections:
            try:
                existing = supabase_db.query(HistoricalDetection).filter(
                    HistoricalDetection.event_id == item.event_id
                ).first()

                if not existing:
                    # Handle image reference: avoid heavy Base64 inside DB
                    img_url = item.image_path or item.annotated_image_path
                    if img_url and len(img_url) > 500: # Base64 string fallback
                        img_url = f"/api/events/{item.event_id}/image"

                    hist_det = HistoricalDetection(
                        event_id=item.event_id,
                        farm_id=item.farm_id or "WS-FARM-001",
                        device_id=item.device_id or "FN-1",
                        camera_id=getattr(item, 'camera_id', 'FN-1'),
                        node_id=getattr(item, 'node_id', 'FN-1'),
                        zone_id=item.zone_id or "ZONE-01",
                        farm_zone=getattr(item, 'farm_zone', 'North Field'),
                        species=item.species,
                        species_code=getattr(item, 'species_code', 'WS-WL-WB'),
                        code=getattr(item, 'code', 'WS-WL-WB'),
                        confidence=item.confidence,
                        bbox=item.bbox or "[]",
                        threat_level=item.threat_level,
                        intrusion=item.intrusion,
                        inside_geofence=getattr(item, 'inside_geofence', True),
                        source=item.source or "LIVE",
                        dataset_filename=getattr(item, 'dataset_filename', None),
                        image_url=img_url,
                        inference_time_ms=item.inference_time_ms or 94.5,
                        decision_action=getattr(item, 'decision_action', 'Siren + Floodlight'),
                        prevention_status=getattr(item, 'prevention_status', 'COMPLETED'),
                        actuators_json=item.actuators_json or "{}",
                        notification_status=getattr(item, 'notification_status', 'SENT'),
                        status=item.status or "DETECTED",
                        timestamp=item.timestamp or "",
                        time_formatted=getattr(item, 'time_formatted', ''),
                        raw_payload_json=item.raw_payload_json,
                        detected_at=item.detected_at or "",
                        archived_at=datetime.utcnow(),
                        created_at=item.created_at or datetime.utcnow()
                    )
                    supabase_db.add(hist_det)
                    supabase_db.commit()

                # Verify
                verify = supabase_db.query(HistoricalDetection).filter(
                    HistoricalDetection.event_id == item.event_id
                ).first()

                if verify:
                    hot_db.delete(item)
                    hot_db.commit()
                    migrated_detections += 1
                else:
                    logger.error(f"[MIGRATION ERROR] Verification failed for detection {item.event_id}")
                    failed_count += 1
            except Exception as e:
                supabase_db.rollback()
                hot_db.rollback()
                logger.error(f"[MIGRATION ERROR] Failed migrating detection {item.event_id}: {e}")
                failed_count += 1

        # =========================================================
        # 3. Migrate Completed Prevention Actions
        # =========================================================
        prev_query = hot_db.query(PreventionAction).filter(
            PreventionAction.status.in_(["COMPLETED", "FAILED", "CANCELLED", "STANDBY"])
        )
        if not force_all_completed:
            prev_query = prev_query.filter(PreventionAction.created_at <= cutoff_dt)

        eligible_prev = prev_query.all()
        for item in eligible_prev:
            try:
                existing = supabase_db.query(HistoricalPreventionAction).filter(
                    HistoricalPreventionAction.prevention_id == item.prevention_id
                ).first()

                if not existing:
                    hist_prev = HistoricalPreventionAction(
                        prevention_id=item.prevention_id,
                        event_id=item.event_id,
                        siren=item.siren,
                        floodlight=item.floodlight,
                        speaker=item.speaker,
                        sprinkler=item.sprinkler,
                        decision=item.decision,
                        status=item.status,
                        activated_at=item.activated_at or "",
                        deactivated_at=item.deactivated_at,
                        archived_at=datetime.utcnow(),
                        created_at=item.created_at or datetime.utcnow()
                    )
                    supabase_db.add(hist_prev)
                    supabase_db.commit()

                verify = supabase_db.query(HistoricalPreventionAction).filter(
                    HistoricalPreventionAction.prevention_id == item.prevention_id
                ).first()

                if verify:
                    hot_db.delete(item)
                    hot_db.commit()
                    migrated_prevention += 1
            except Exception as e:
                supabase_db.rollback()
                hot_db.rollback()
                logger.error(f"[MIGRATION ERROR] Failed migrating prevention action {item.prevention_id}: {e}")

        # Update metrics
        total_migrated = migrated_intrusions + migrated_detections + migrated_prevention
        MIGRATION_METRICS["last_migration_time"] = datetime.utcnow().isoformat()
        MIGRATION_METRICS["migration_success_count"] += total_migrated
        MIGRATION_METRICS["migration_failure_count"] += failed_count
        MIGRATION_METRICS["last_run_status"] = "SUCCESS" if failed_count == 0 else "PARTIAL_SUCCESS"
        MIGRATION_METRICS["last_run_summary"] = {
            "migrated_detections": migrated_detections,
            "migrated_intrusions": migrated_intrusions,
            "migrated_prevention_actions": migrated_prevention,
            "failed_records": failed_count,
            "timestamp": datetime.utcnow().isoformat()
        }

        logger.info(f"[MIGRATION SUCCESS] Migrated {total_migrated} records to Supabase PostgreSQL (Failed: {failed_count}).")
        return {
            "status": "success",
            "message": f"Successfully migrated {total_migrated} records to Supabase PostgreSQL.",
            "summary": MIGRATION_METRICS["last_run_summary"]
        }
    except Exception as general_err:
        logger.error(f"[MIGRATION FATAL ERROR] {general_err}")
        MIGRATION_METRICS["last_run_status"] = "ERROR"
        MIGRATION_METRICS["migration_failure_count"] += 1
        return {"status": "error", "message": str(general_err)}
    finally:
        hot_db.close()
        supabase_db.close()
