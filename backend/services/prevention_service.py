"""
WildShield AI — Prevention & Actuator State Service
Coordinates deterrent activation lifecycle and actuator states across Web & Mobile.
"""

from typing import Dict, Any, Optional
import asyncio
from datetime import datetime
from backend.services.websocket_manager import ws_manager


class PreventionService:
    def __init__(self):
        # Current active deterrent state per node
        self.node_prevention_states: Dict[str, Dict[str, Any]] = {
            "FN-1": {"status": "STANDBY", "siren": False, "floodlight": False, "speaker": False, "sprinkler": False},
            "FN-2": {"status": "STANDBY", "siren": False, "floodlight": False, "speaker": False, "sprinkler": False},
            "FN-3": {"status": "STANDBY", "siren": False, "floodlight": False, "speaker": False, "sprinkler": False},
            "FN-4": {"status": "STANDBY", "siren": False, "floodlight": False, "speaker": False, "sprinkler": False},
            "FN-5": {"status": "STANDBY", "siren": False, "floodlight": False, "speaker": False, "sprinkler": False},
        }

    def get_prevention_status(self, node_code: str = "FN-1") -> Dict[str, Any]:
        return self.node_prevention_states.get(node_code, {
            "status": "STANDBY", "siren": False, "floodlight": False, "speaker": False, "sprinkler": False
        })

    def get_all_prevention_states(self) -> Dict[str, Dict[str, Any]]:
        return self.node_prevention_states

    async def activate_deterrent(
        self,
        event_id: str,
        node_code: str,
        species: str,
        actuators: Dict[str, bool],
        duration_seconds: int = 15,
        triggered_by: str = "AI_ENGINE",
        intrusion_id: Optional[str] = None
    ):
        """
        Engage hardware actuators, broadcast state to Web & Mobile,
        and schedule auto-deactivation after animal deterrence.
        """
        int_id = intrusion_id or f"WS-INT-{event_id.replace('WS-EVT-', '')}"
        self.node_prevention_states[node_code] = {
            "status": "ACTIVE",
            "siren": actuators.get("siren", False),
            "floodlight": actuators.get("floodlight", False),
            "speaker": actuators.get("speaker", False),
            "sprinkler": actuators.get("sprinkler", False),
            "event_id": event_id,
            "intrusion_id": int_id,
            "species": species,
            "triggered_by": triggered_by,
            "activated_at": datetime.utcnow().isoformat()
        }

        # Broadcast ACTIVATED event
        await ws_manager.broadcast_event(
            event_type="PREVENTION_ACTIVATED",
            data={
                "event_id": event_id,
                "intrusion_id": int_id,
                "node_code": node_code,
                "species": species,
                "actuators": actuators,
                "status": "ACTIVE",
                "triggered_by": triggered_by
            },
            priority="HIGH"
        )

        # Launch background task for simulated deterrent completion
        asyncio.create_task(self._auto_deactivate_task(event_id, int_id, node_code, species, duration_seconds))

    async def _auto_deactivate_task(self, event_id: str, intrusion_id: str, node_code: str, species: str, duration: int):
        await asyncio.sleep(duration)
        current = self.node_prevention_states.get(node_code, {})
        if current.get("event_id") == event_id and current.get("status") == "ACTIVE":
            now_iso = datetime.utcnow().isoformat()
            
            # 1. Update Neon DB Intrusion record to CLEARED
            try:
                from backend.database import SessionLocal, Intrusion, PreventionAction
                db = SessionLocal()
                int_rec = db.query(Intrusion).filter(Intrusion.event_id == event_id).first()
                if int_rec:
                    int_rec.status = "CLEARED"
                    int_rec.exited_at = now_iso
                prev_rec = db.query(PreventionAction).filter(PreventionAction.event_id == event_id).first()
                if prev_rec:
                    prev_rec.status = "COMPLETED"
                    prev_rec.deactivated_at = now_iso
                db.commit()
                db.close()
            except Exception as e:
                print(f"[DB ERROR] Failed to update intrusion clearance: {e}")

            # Reset node state
            self.node_prevention_states[node_code] = {
                "status": "STANDBY",
                "siren": False,
                "floodlight": False,
                "speaker": False,
                "sprinkler": False,
                "event_id": None,
                "deactivated_at": now_iso
            }

            # Broadcast DEACTIVATED event
            await ws_manager.broadcast_event(
                event_type="DETERRENT_DEACTIVATED",
                data={
                    "event_id": event_id,
                    "intrusion_id": intrusion_id,
                    "node_code": node_code,
                    "species": species,
                    "status": "COMPLETED",
                    "message": f"Deterrent cycle completed. {species} has retreated from perimeter."
                },
                priority="INFO"
            )

            # Broadcast ANIMAL_EXITED
            await ws_manager.broadcast_event(
                event_type="ANIMAL_EXITED",
                data={
                    "event_id": event_id,
                    "intrusion_id": intrusion_id,
                    "node_code": node_code,
                    "status": "CLEARED"
                },
                priority="INFO"
            )

            # Brief pause then close intrusion
            await asyncio.sleep(2)
            try:
                db = SessionLocal()
                int_rec = db.query(Intrusion).filter(Intrusion.event_id == event_id).first()
                if int_rec:
                    int_rec.status = "CLOSED"
                db.commit()
                db.close()
            except Exception as e:
                print(f"[DB ERROR] Failed to close intrusion: {e}")

            # Broadcast PREVENTION_COMPLETED
            await ws_manager.broadcast_event(
                event_type="PREVENTION_COMPLETED",
                data={
                    "event_id": event_id,
                    "intrusion_id": intrusion_id,
                    "status": "CLOSED"
                },
                priority="INFO"
            )


    async def manual_override(self, node_code: str, actuators: Dict[str, bool], operator_id: str = "OPERATOR"):
        """Manual control from Web Command Center or Mobile App."""
        is_active = any(actuators.values())
        self.node_prevention_states[node_code] = {
            "status": "ACTIVE" if is_active else "STANDBY",
            "siren": actuators.get("siren", False),
            "floodlight": actuators.get("floodlight", False),
            "speaker": actuators.get("speaker", False),
            "sprinkler": actuators.get("sprinkler", False),
            "triggered_by": operator_id,
            "updated_at": datetime.utcnow().isoformat()
        }

        event_type = "DETERRENT_ACTIVATED" if is_active else "DETERRENT_DEACTIVATED"
        await ws_manager.broadcast_event(
            event_type=event_type,
            data={
                "node_code": node_code,
                "actuators": actuators,
                "status": "ACTIVE" if is_active else "STANDBY",
                "triggered_by": operator_id
            },
            priority="HIGH" if is_active else "LOW"
        )


prevention_service = PreventionService()
