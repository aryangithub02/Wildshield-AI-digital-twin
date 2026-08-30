"""
WildShield AI — Notification & Firebase Cloud Messaging (FCM) Service
Handles notification dispatch, cooldown deduplication, and mobile device registry.
"""

import os
import time
from typing import Dict, Any, List, Optional
from datetime import datetime
from backend.services.websocket_manager import ws_manager
from backend.database import SessionLocal, NotificationRecord, DeviceRecord

# Optional Firebase Admin SDK initialization if credentials provided
FIREBASE_APP = None
FIREBASE_CREDENTIALS_PATH = os.getenv("FIREBASE_CREDENTIALS", "")

if FIREBASE_CREDENTIALS_PATH and os.path.exists(FIREBASE_CREDENTIALS_PATH):
    try:
        import firebase_admin
        from firebase_admin import credentials, messaging
        cred = credentials.Certificate(FIREBASE_CREDENTIALS_PATH)
        FIREBASE_APP = firebase_admin.initialize_app(cred)
        print("[FIREBASE] Firebase Admin SDK initialized successfully.")
    except Exception as e:
        print(f"[FIREBASE] Warning: Failed to initialize Firebase Admin SDK: {e}")


class NotificationService:
    def __init__(self):
        self.last_notification_time: Dict[str, float] = {}
        self.cooldown_seconds = 30 # 30s cooldown per species to avoid notification spam

    async def send_event_notification(
        self,
        event_id: str,
        species: str,
        confidence: float,
        farm_zone: str,
        threat_level: str,
        action_taken: str,
        farmer_id: str = "FARMER-001"
    ) -> Optional[Dict[str, Any]]:
        """Dispatch push notification & in-app alert for high/critical threats."""
        now = time.time()
        cooldown_key = f"{farmer_id}:{species}:{farm_zone}"
        
        # Check cooldown deduplication (unless CRITICAL)
        if threat_level != "CRITICAL":
            last_sent = self.last_notification_time.get(cooldown_key, 0)
            if now - last_sent < self.cooldown_seconds:
                return None

        self.last_notification_time[cooldown_key] = now
        notification_id = f"NOTIF-{int(now*1000)%100000:05d}"
        
        title = "🚨 WILDLIFE INTRUSION ALERT" if threat_level in ["HIGH", "CRITICAL"] else "⚠️ Wildlife Activity Detected"
        conf_pct = int(confidence * 100) if confidence <= 1.0 else int(confidence)
        message = f"{species} detected near {farm_zone} (Confidence: {conf_pct}%). Response engaged: {action_taken}."

        notif_data = {
            "notification_id": notification_id,
            "event_id": event_id,
            "farmer_id": farmer_id,
            "title": title,
            "message": message,
            "priority": threat_level,
            "species": species,
            "farm_zone": farm_zone,
            "action_taken": action_taken,
            "status": "SENT",
            "channel": "FCM" if FIREBASE_APP else "WEBSOCKET_INAPP",
            "created_at": datetime.utcnow().isoformat()
        }

        # 1. Store in Database
        db = SessionLocal()
        try:
            record = NotificationRecord(
                notification_id=notification_id,
                event_id=event_id,
                farmer_id=farmer_id,
                title=title,
                message=message,
                notification_type="INTRUSION_ALERT",
                status="SENT",
                created_at=notif_data["created_at"],
                sent_at=notif_data["created_at"]
            )
            db.add(record)
            db.commit()
        except Exception as e:
            db.rollback()
            print(f"[NOTIF ERROR] Failed to persist notification: {e}")
        finally:
            db.close()

        # 2. Push via WebSocket to connected mobile apps & web dashboards
        await ws_manager.broadcast_event(
            event_type="NOTIFICATION_SENT",
            data=notif_data,
            priority=threat_level
        )

        # 3. Push via Firebase Admin FCM if available
        if FIREBASE_APP:
            try:
                from firebase_admin import messaging
                db = SessionLocal()
                devices = db.query(DeviceRecord).filter(DeviceRecord.farmer_id == farmer_id).all()
                tokens = [d.fcm_token for d in devices if d.fcm_token]
                db.close()

                if tokens:
                    multicast_msg = messaging.MulticastMessage(
                        notification=messaging.Notification(
                            title=title,
                            body=message
                        ),
                        data={
                            "event_id": event_id,
                            "species": species,
                            "threat_level": threat_level,
                            "farm_zone": farm_zone
                        },
                        tokens=tokens
                    )
                    messaging.send_multicast(multicast_msg)
                    print(f"[FIREBASE FCM] Sent multicast notification to {len(tokens)} devices.")
            except Exception as e:
                print(f"[FIREBASE FCM ERROR] Failed to send push: {e}")

        return notif_data

    def get_recent_notifications(self, limit: int = 50) -> List[Dict[str, Any]]:
        db = SessionLocal()
        try:
            records = db.query(NotificationRecord).order_by(NotificationRecord.created_at.desc()).limit(limit).all()
            return [
                {
                    "notification_id": r.notification_id,
                    "event_id": r.event_id,
                    "farmer_id": r.farmer_id,
                    "title": r.title,
                    "message": r.message,
                    "priority": r.priority,
                    "species": r.species,
                    "farm_zone": r.farm_zone,
                    "action_taken": r.action_taken,
                    "status": r.status,
                    "channel": r.channel,
                    "created_at": r.created_at
                }
                for r in records
            ]
        finally:
            db.close()


notification_service = NotificationService()
