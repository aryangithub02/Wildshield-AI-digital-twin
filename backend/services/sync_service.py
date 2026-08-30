"""
WildShield AI — Offline-First Reconciliation & Sync Service
Handles mobile offline batch ingestion, event deduplication, and database synchronization.
"""

from typing import List, Dict, Any
from datetime import datetime
import json
from backend.database import SessionLocal, EventRecord
from backend.services.websocket_manager import ws_manager


class SyncService:
    def sync_offline_events(self, offline_events: List[Dict[str, Any]]) -> Dict[str, Any]:
        """
        Ingest offline recorded events, apply global deduplication by event_id,
        and reconcile with PostgreSQL/SQLite.
        """
        db = SessionLocal()
        synced_records = []
        duplicate_count = 0

        try:
            for item in offline_events:
                event_id = item.get("event_id") or item.get("eventId")
                if not event_id:
                    continue

                # Check if event already exists
                existing = db.query(EventRecord).filter(EventRecord.event_id == event_id).first()
                if existing:
                    duplicate_count += 1
                    continue

                # Create standardized record
                species = item.get("species", "Wild Boar")
                confidence = float(item.get("confidence", 90.0))
                threat = item.get("threat") or item.get("risk", "HIGH")
                zone = item.get("zone") or item.get("farmZone", "North Field")
                camera_id = item.get("camera_id") or item.get("cameraId", "FN-1")
                timestamp = item.get("timestamp") or datetime.utcnow().isoformat()
                time_formatted = item.get("time_formatted") or item.get("timeFormatted", datetime.now().strftime("%I:%M:%S %p"))

                new_record = EventRecord(
                    event_id=event_id,
                    farm_id=item.get("farm_id", "WS-FARM-001"),
                    source="OFFLINE_SYNC",
                    species=species,
                    code=item.get("code", "WS-WL-WB"),
                    confidence=confidence,
                    threat_level=threat,
                    farm_zone=zone,
                    camera_id=camera_id,
                    node_id=camera_id,
                    inside_geofence=True,
                    decision_action=item.get("action", "Siren + Floodlight Activated"),
                    prevention_status="COMPLETED",
                    actuators_json=json.dumps(item.get("actuators", {"siren": True, "floodlight": True})),
                    notification_status="SYNCED",
                    status="CLOSED",
                    timestamp=timestamp,
                    time_formatted=time_formatted,
                    annotated_image=item.get("annotated_image"),
                    raw_payload_json=json.dumps(item)
                )
                db.add(new_record)
                synced_records.append(event_id)

            db.commit()
        except Exception as e:
            db.rollback()
            print(f"[SYNC ERROR] Error saving offline sync: {e}")
            raise e
        finally:
            db.close()

        return {
            "synced_count": len(synced_records),
            "duplicate_count": duplicate_count,
            "synced_event_ids": synced_records
        }

    def get_events_since(self, since_timestamp: str = None, limit: int = 100) -> List[Dict[str, Any]]:
        """Retrieve events logged after a given timestamp for client catch-up."""
        db = SessionLocal()
        try:
            query = db.query(EventRecord)
            if since_timestamp:
                query = query.filter(EventRecord.timestamp > since_timestamp)
            records = query.order_by(EventRecord.created_at.desc()).limit(limit).all()

            results = []
            for r in records:
                try:
                    payload = json.loads(r.raw_payload_json) if r.raw_payload_json else {}
                except Exception:
                    payload = {}

                results.append({
                    "event_id": r.event_id,
                    "farm_id": r.farm_id,
                    "source": r.source,
                    "species": r.species,
                    "code": r.code,
                    "confidence": r.confidence,
                    "threat": r.threat_level,
                    "location": r.farm_zone,
                    "camera_id": r.camera_id,
                    "status": r.status,
                    "time": r.time_formatted,
                    "timestamp": r.timestamp,
                    "prevention": r.prevention_status,
                    "decision": r.decision_action,
                    "raw": payload
                })
            return results
        finally:
            db.close()


sync_service = SyncService()
