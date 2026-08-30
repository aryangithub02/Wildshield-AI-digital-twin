"""
WildShield AI — Real-Time WebSocket Connection Manager
Handles multi-client Web & Mobile registry, event broadcasting, and lifecycle updates.
"""

from typing import List, Dict, Any, Optional
from fastapi import WebSocket, WebSocketDisconnect
from datetime import datetime
import json
import asyncio


class WebSocketManager:
    def __init__(self):
        # Maps active WebSocket instances to client metadata
        self.active_connections: Dict[WebSocket, Dict[str, Any]] = {}
        self.lock = asyncio.Lock()

    async def connect(self, websocket: WebSocket, client_type: str = "web", client_id: str = "unknown"):
        """Accept WebSocket and register client in connection pool."""
        await websocket.accept()
        async with self.lock:
            self.active_connections[websocket] = {
                "client_type": client_type,
                "client_id": client_id,
                "connected_at": datetime.utcnow().isoformat(),
            }
        print(f"[WS] Client connected: {client_type.upper()} ({client_id}). Total: {len(self.active_connections)}")

    async def disconnect(self, websocket: WebSocket):
        """Unregister client gracefully."""
        async with self.lock:
            if websocket in self.active_connections:
                info = self.active_connections.pop(websocket)
                print(f"[WS] Client disconnected: {info['client_type'].upper()} ({info['client_id']}). Total: {len(self.active_connections)}")

    async def broadcast_event(self, event_type: str, data: Dict[str, Any], priority: str = "INFO"):
        """
        Broadcast standardized event to all connected Web and Mobile clients.
        Standard types:
        - DETECTION_EVENT
        - INTRUSION_STARTED
        - THREAT_UPDATED
        - DECISION_MADE
        - DETERRENT_ACTIVATED
        - DETERRENT_DEACTIVATED
        - NOTIFICATION_CREATED
        - NOTIFICATION_SENT
        - ANIMAL_EXITED
        - EVENT_CLOSED
        - DEVICE_STATUS
        - SYSTEM_STATUS
        - SYNC_COMPLETED
        - ERROR
        """
        payload = {
            "type": event_type,
            "timestamp": datetime.utcnow().isoformat(),
            "priority": priority,
            "data": data
        }

        stale = []
        async with self.lock:
            targets = list(self.active_connections.keys())

        for ws in targets:
            try:
                await ws.send_json(payload)
            except Exception as e:
                stale.append(ws)

        for ws in stale:
            await self.disconnect(ws)

    def get_connected_count(self) -> int:
        return len(self.active_connections)


# Global singleton instance
ws_manager = WebSocketManager()
