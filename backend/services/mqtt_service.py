"""
WildShield AI — MQTT IoT Farmer Node Service
Publishes deterrent commands to edge nodes and listens to telemetry.
"""

import os
import json
from typing import Dict, Any, Optional
from datetime import datetime
from backend.services.websocket_manager import ws_manager

MQTT_BROKER = os.getenv("MQTT_BROKER", "localhost")
MQTT_PORT = int(os.getenv("MQTT_PORT", "1883"))


class MQTTService:
    def __init__(self):
        self.is_connected = False
        self.client = None
        self._init_client()

    def _init_client(self):
        try:
            import paho.mqtt.client as mqtt
            self.client = mqtt.Client(client_id="WildShield_Central_Hub")
            self.client.on_connect = self._on_connect
            self.client.on_message = self._on_message
            # Non-blocking connect attempt
            try:
                self.client.connect_async(MQTT_BROKER, MQTT_PORT, keepalive=60)
                self.client.loop_start()
            except Exception as e:
                print(f"[MQTT] Broker {MQTT_BROKER}:{MQTT_PORT} not reachable (running in virtual edge mode): {e}")
        except ImportError:
            print("[MQTT] paho-mqtt package not installed. Running in virtual node emulation mode.")

    def _on_connect(self, client, userdata, flags, rc):
        if rc == 0:
            self.is_connected = True
            print(f"[MQTT] Connected to MQTT Broker at {MQTT_BROKER}:{MQTT_PORT}")
            client.subscribe("wildshield/farms/+/nodes/+/status")
        else:
            print(f"[MQTT] Failed to connect, code: {rc}")

    def _on_message(self, client, userdata, msg):
        try:
            payload = json.loads(msg.payload.decode())
            print(f"[MQTT RECV] Topic: {msg.topic}, Payload: {payload}")
        except Exception as e:
            print(f"[MQTT ERROR] Failed to parse message: {e}")

    def publish_deterrent_command(
        self,
        farm_id: str,
        node_id: str,
        event_id: str,
        command: str,
        actuators: Dict[str, bool]
    ) -> bool:
        """Publish actuator trigger command to a specific node."""
        topic = f"wildshield/farms/{farm_id}/nodes/{node_id}/commands"
        payload = {
            "event_id": event_id,
            "command": command,
            "actuators": actuators,
            "timestamp": datetime.utcnow().isoformat()
        }
        
        if self.client and self.is_connected:
            try:
                self.client.publish(topic, json.dumps(payload), qos=1)
                print(f"[MQTT PUB] Published command to {topic}")
                return True
            except Exception as e:
                print(f"[MQTT PUB ERROR] {e}")
                return False
        else:
            # Virtual node mode: log command
            print(f"[MQTT VIRTUAL] Command routed to {topic}: {payload}")
            return True


mqtt_service = MQTTService()
