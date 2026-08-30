"""
WildShield AI — Central Communication & Synchronization Layer Schemas
Standardized data contracts for Web, Mobile, Jetson, and IoT nodes.
"""

from typing import Dict, List, Optional, Any, Union
from pydantic import BaseModel, Field
from datetime import datetime


# ==========================================
# 1. Detection & Classification Schemas
# ==========================================

class BoundingBox(BaseModel):
    x1: float
    y1: float
    x2: float
    y2: float


class DetectionObject(BaseModel):
    detection_id: str
    species: str = Field(..., alias="class")
    code: str
    domain: str = "Wildlife"
    scientific_name: Optional[str] = None
    emoji: Optional[str] = "🐾"
    confidence: float
    confidence_pct: float
    threat: str = "LOW" # LOW, MEDIUM, HIGH, CRITICAL
    risk_level: str = "MODERATE"
    intrusion: bool = False
    responses: List[str] = []
    actuators: Dict[str, bool] = {}
    description: Optional[str] = None
    bbox: List[float] # [x1, y1, x2, y2] in pixel coords
    normalized_bbox: List[float] # [x1, y1, x2, y2] in 0-1
    camera_id: str = "FN-1"
    node_name: str = "North Field"

    class Config:
        populate_by_name = True


# ==========================================
# 2. Central Event Model & Sub-Structures
# ==========================================

class LocationInfo(BaseModel):
    zone: str = "North Field"
    distance_m: Optional[float] = 15.0
    direction: Optional[str] = "Crop Center"
    inside_geofence: bool = True
    coordinates: Optional[Dict[str, float]] = None


class BehaviourInfo(BaseModel):
    activity: str = "Moving toward crop"
    possible_damage: str = "Crop damage"
    risk_score: Optional[int] = 85


class ThreatInfo(BaseModel):
    level: str = "HIGH" # LOW, MEDIUM, HIGH, CRITICAL
    reason: str = "Wildlife detected inside farm perimeter"


class DecisionInfo(BaseModel):
    action: str = "Siren + Floodlight"
    recommended_actuators: Dict[str, bool] = {
        "siren": True,
        "floodlight": True,
        "speaker": False,
        "sprinkler": False
    }


class PreventionInfo(BaseModel):
    siren: bool = False
    floodlight: bool = False
    speaker: bool = False
    sprinkler: bool = False
    status: str = "STANDBY" # STANDBY, REQUESTED, ACTIVATING, ACTIVE, COMPLETED, FAILED


class NotificationInfo(BaseModel):
    status: str = "SENT" # PENDING, SENT, DELIVERED, READ, FAILED
    channel: str = "FCM" # FCM, SMS, IN_APP, WEBSOCKET


class StandardEventPayload(BaseModel):
    event_id: str
    farm_id: str = "WS-FARM-001"
    source: str = "LIVE" # LIVE, SIMULATION, OFFLINE_SYNC
    detection: Dict[str, Any]
    location: LocationInfo
    behaviour: BehaviourInfo
    threat: ThreatInfo
    decision: DecisionInfo
    prevention: PreventionInfo
    notification: NotificationInfo
    status: str = "DETECTED" # DETECTED, INTRUSION_CONFIRMED, DECISION_MADE, PREVENTION_ACTIVE, NOTIFICATION_SENT, MONITORING, ANIMAL_EXITED, PREVENTION_COMPLETED, CLOSED
    timestamp: str
    time_formatted: Optional[str] = None
    annotated_image: Optional[str] = None
    raw_image_url: Optional[str] = None


# ==========================================
# 3. Farm & Zone Schemas
# ==========================================

class FarmZone(BaseModel):
    id: str
    name: str
    type: str # crop, boundary, buffer, orchard, riverbed
    risk_multiplier: float = 1.0
    geofence_active: bool = True
    polygon: Optional[List[List[float]]] = None


class FarmConfig(BaseModel):
    farm_id: str = "WS-FARM-001"
    name: str = "Demo Farm"
    farmer: str = "Rajesh Patel"
    crop: str = "Cotton & Pulses"
    area_acres: float = 12.5
    geofence_enabled: bool = True
    coordinates: Dict[str, float] = {"lat": 21.1458, "lng": 79.0882}
    zones: List[FarmZone] = []


# ==========================================
# 4. Device & IoT Node Schemas
# ==========================================

class FarmerNodeStatus(BaseModel):
    node_id: int
    code: str
    name: str
    zone: str
    status: str = "ONLINE" # ONLINE, OFFLINE, WARNING, ERROR
    camera: str = "ONLINE"
    pir: str = "ACTIVE"
    battery: int = 90
    solar_status: str = "CHARGING"
    network: str = "LoRa/WiFi"
    rssi: int = -65
    last_seen: str


class DeviceRegistrationRequest(BaseModel):
    farmer_id: str = "FARMER-001"
    device_id: str
    fcm_token: str
    farm_id: str = "WS-FARM-001"
    platform: Optional[str] = "android"


# ==========================================
# 5. Deterrent & Control Schemas
# ==========================================

class TriggerResponseRequest(BaseModel):
    detection_id: Optional[str] = None
    event_id: Optional[str] = None
    species: str = "Wild Boar"
    node_id: Optional[int] = 1
    actuators: Dict[str, bool]
    mode: Optional[str] = "simulation" # live_manual_override, simulation, auto
    triggered_by: Optional[str] = "OPERATOR" # OPERATOR, FARMER, AI_ENGINE


# ==========================================
# 6. Notification Schemas
# ==========================================

class NotificationModel(BaseModel):
    notification_id: str
    event_id: str
    farmer_id: str = "FARMER-001"
    device_id: Optional[str] = None
    title: str
    message: str
    priority: str = "HIGH" # LOW, MEDIUM, HIGH, CRITICAL
    species: str
    farm_zone: str
    action_taken: str
    created_at: str
    status: str = "SENT" # SENT, DELIVERED, READ
    channel: str = "FCM"


# ==========================================
# 7. Analytics & System Health Schemas
# ==========================================

class AnalyticsResponse(BaseModel):
    total_detections: int
    live_detections: int
    simulated_detections: int
    species_breakdown: Dict[str, int]
    high_threat_events: int
    deterrent_activations: int
    active_intrusions: int
    most_active_zone: str
    average_confidence: float
    model_benchmark: Dict[str, Any]
    last_updated: str


class SystemHealthResponse(BaseModel):
    status: str = "online"
    backend: str = "ONLINE"
    model: str = "LOADED"
    database: str = "ONLINE"
    mqtt: str = "ONLINE"
    firebase: str = "READY"
    websocket: str = "ACTIVE"
    device: str = "CUDA"
    weights_path: str
    classes_count: int
    active_connections: int
    total_recorded_events: int


# ==========================================
# 8. Sync Schemas
# ==========================================

class SyncBatchRequest(BaseModel):
    farmer_id: Optional[str] = "FARMER-001"
    device_id: Optional[str] = "ANDROID-001"
    last_sync_timestamp: Optional[str] = None
    offline_events: List[Dict[str, Any]] = []


class SyncBatchResponse(BaseModel):
    status: str = "success"
    server_time: str
    synced_count: int
    events: List[StandardEventPayload] = []
    message: str
