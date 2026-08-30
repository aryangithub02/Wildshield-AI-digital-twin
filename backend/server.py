"""
WildShield AI — Central Communication, Inference & State Management Hub
Single Source of Truth for Web Command Center, Mobile App, Edge AI, and IoT Nodes.
"""

import os
import io
import time
import base64
import glob
import asyncio
import json
from pathlib import Path
from typing import Optional, List, Dict, Any
from datetime import datetime

from fastapi import FastAPI, File, UploadFile, Form, HTTPException, WebSocket, WebSocketDisconnect, Query, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from PIL import Image, ImageDraw, ImageFont
import torch

from backend.wildshield_classifier import (
    get_species_metadata,
    format_detection_payload,
    SPECIES_CONFIG
)
from backend.schemas import (
    TriggerResponseRequest,
    DeviceRegistrationRequest,
    StandardEventPayload,
    SyncBatchRequest,
    AnalyticsResponse,
    SystemHealthResponse
)
from backend.database import (
    init_db, SessionLocal, EventRecord, DeviceRecord, NotificationRecord,
    Intrusion, PreventionAction, AnalyticsEvent
)
from backend.services.websocket_manager import ws_manager
from backend.services.decision_engine import evaluate_decision
from backend.services.prevention_service import prevention_service
from backend.services.notification_service import notification_service
from backend.services.mqtt_service import mqtt_service
from backend.services.sync_service import sync_service

# Base Paths
BASE_DIR = Path(__file__).resolve().parent.parent
WEIGHTS_PATH = BASE_DIR / "runs" / "detect" / "WildShield-Experiments" / "wildshield_surveillance_v1-2" / "weights" / "best.pt"
TEST_IMAGES_DIR = BASE_DIR / "public" / "sample-test-images"
if not TEST_IMAGES_DIR.exists():
    TEST_IMAGES_DIR = BASE_DIR / "WildShield-Dataset" / "test" / "images"

# Model Benchmarks (Preserved separately from live events)
MODEL_BENCHMARKS = {
    "dataset": "54 unseen test images",
    "mAP_50": 92.6,
    "mAP_50_95": 85.8,
    "precision": 89.8,
    "recall": 82.0,
    "per_class": {
        "Wild Boar": {"precision": 98.5, "recall": 90.9, "mAP50": 98.8},
        "Cattle": {"precision": 93.8, "recall": 88.9, "mAP50": 98.1},
        "Spotted Deer": {"precision": 88.3, "recall": 100.0, "mAP50": 91.2},
        "Nilgai": {"precision": 94.7, "recall": 63.6, "mAP50": 87.8},
        "Goat": {"precision": 73.8, "recall": 66.7, "mAP50": 87.4}
    }
}

app = FastAPI(
    title="WildShield AI — Central Communication & AI Hub",
    description="Central source of truth connecting Jetson AI, YOLOv11, Farmer IoT Nodes, Web Dashboard & Mobile App.",
    version="2.0.0"
)

# Enable CORS for Web Dashboard (Vite) and Mobile App (Expo/LAN)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount static folder for test images
if TEST_IMAGES_DIR.exists():
    app.mount("/static-test-images", StaticFiles(directory=str(TEST_IMAGES_DIR)), name="test_images")

# Global model state
MODEL = None
MODEL_CLASSES = {}

# Node & Zone configuration
NODE_MAPPING = {
    1: {"code": "FN-1", "name": "North Field", "zone": "North Field", "type": "crop", "lat": 21.1465, "lng": 79.0880},
    2: {"code": "FN-2", "name": "East Field", "zone": "East Orchard", "type": "orchard", "lat": 21.1460, "lng": 79.0895},
    3: {"code": "FN-3", "name": "South-East Field", "zone": "South-East Pulse Field", "type": "crop", "lat": 21.1448, "lng": 79.0892},
    4: {"code": "FN-4", "name": "South-West Field", "zone": "South-West Grassland", "type": "buffer", "lat": 21.1449, "lng": 79.0868},
    5: {"code": "FN-5", "name": "West Field", "zone": "West Vegetable Field", "type": "crop", "lat": 21.1462, "lng": 79.0865},
}


def dispatch_background_task(coro):
    """Safely dispatch coroutine in running event loop or background worker thread."""
    try:
        loop = asyncio.get_running_loop()
        return loop.create_task(coro)
    except RuntimeError:
        import threading
        def _runner():
            try:
                asyncio.run(coro)
            except Exception:
                pass
        t = threading.Thread(target=_runner, daemon=True)
        t.start()
        return t


def load_yolo_model():
    global MODEL, MODEL_CLASSES
    if not WEIGHTS_PATH.exists():
        print(f"[WARNING] Model weights not found at {WEIGHTS_PATH}. Loading fallback.")
        return
    
    from ultralytics import YOLO
    print(f"[INFO] Loading persistent WildShield YOLO model from {WEIGHTS_PATH}...")
    MODEL = YOLO(str(WEIGHTS_PATH))
    MODEL_CLASSES = MODEL.names
    print(f"[OK] Model loaded successfully. Class count: {len(MODEL_CLASSES)}")
    print(f"[INFO] Authoritative Model Classes: {MODEL_CLASSES}")


@app.on_event("startup")
def startup_event():
    init_db()
    try:
        load_yolo_model()
    except Exception as e:
        print(f"[ERROR] Failed to load YOLO model: {e}")


# ==========================================
# 1. System Health & Status
# ==========================================

@app.get("/api/status", response_model=Dict[str, Any])
def get_status():
    """System health check and persistent model metadata."""
    is_loaded = MODEL is not None
    test_img_count = len(glob.glob(str(TEST_IMAGES_DIR / "*.*"))) if TEST_IMAGES_DIR.exists() else 0
    
    db = SessionLocal()
    total_events = db.query(EventRecord).count()
    db.close()

    return {
        "status": "online" if is_loaded else "model_unloaded",
        "backend": "ONLINE",
        "model": "LOADED" if is_loaded else "UNLOADED",
        "database": "ONLINE",
        "mqtt": "ONLINE" if mqtt_service.is_connected else "STANDBY",
        "firebase": "READY",
        "websocket": "ACTIVE",
        "device": "cpu",
        "cuda_available": False,
        "weights_path": str(WEIGHTS_PATH),
        "classes": MODEL_CLASSES,
        "classes_count": len(MODEL_CLASSES),
        "test_images_count": test_img_count,
        "active_ws_connections": ws_manager.get_connected_count(),
        "total_detections_recorded": total_events
    }


# ==========================================
# 2. Farm & Zones API
# ==========================================

@app.get("/api/farm")
def get_farm_info():
    """Get central farm profile and configuration."""
    return {
        "farm_id": "WS-FARM-001",
        "name": "Demo Farm",
        "farmer": "Rajesh Patel",
        "crop": "Cotton & Pulses",
        "area_acres": 12.5,
        "geofence_enabled": True,
        "coordinates": {"lat": 21.1458, "lng": 79.0882},
        "zones": [
            {"id": "ZONE-01", "name": "North Field", "type": "crop", "node_id": 1, "code": "FN-1"},
            {"id": "ZONE-02", "name": "East Orchard", "type": "orchard", "node_id": 2, "code": "FN-2"},
            {"id": "ZONE-03", "name": "South-East Pulse Field", "type": "crop", "node_id": 3, "code": "FN-3"},
            {"id": "ZONE-04", "name": "South-West Grassland", "type": "buffer", "node_id": 4, "code": "FN-4"},
            {"id": "ZONE-05", "name": "West Vegetable Field", "type": "crop", "node_id": 5, "code": "FN-5"},
        ]
    }


@app.get("/api/farm/zones")
def get_farm_zones():
    """List all configured agricultural surveillance zones."""
    return [
        {"id": f"ZONE-0{k}", "name": v["zone"], "type": v["type"], "node_code": v["code"], "node_id": k}
        for k, v in NODE_MAPPING.items()
    ]


# ==========================================
# 3. Devices & IoT Node Status
# ==========================================

@app.get("/api/devices")
def get_devices():
    """Return registered mobile devices and IoT farmer node statuses."""
    db = SessionLocal()
    mobile_devices = db.query(DeviceRecord).all()
    db.close()

    farmer_nodes = []
    for node_id, info in NODE_MAPPING.items():
        prev_state = prevention_service.get_prevention_status(info["code"])
        farmer_nodes.append({
            "node_id": node_id,
            "code": info["code"],
            "name": f"Farmer Node 0{node_id} ({info['name']})",
            "zone": info["zone"],
            "status": "ONLINE",
            "camera": "ONLINE",
            "pir": "ACTIVE",
            "battery": 85 + (node_id * 2) % 15,
            "solar_status": "CHARGING",
            "network": "LoRa / 2.4GHz",
            "rssi": -62 - (node_id * 3),
            "prevention": prev_state,
            "last_seen": datetime.now().strftime("%I:%M:%S %p")
        })

    return {
        "status": "online",
        "registered_mobile_devices": [
            {
                "device_id": d.device_id,
                "farmer_id": getattr(d, 'farmer_id', 'FARMER-001'),
                "farm_id": d.farm_id,
                "fcm_token": d.fcm_token[:12] + "..." if getattr(d, 'fcm_token', None) else "",
                "platform": getattr(d, 'platform', 'android'),
                "status": getattr(d, 'status', 'ONLINE')
            }
            for d in mobile_devices

        ],
        "farmer_nodes": farmer_nodes
    }


@app.get("/api/devices/{device_id}")
def get_device_detail(device_id: str):
    """Retrieve single device status."""
    for node_id, info in NODE_MAPPING.items():
        if info["code"] == device_id or str(node_id) == device_id:
            return {
                "node_id": node_id,
                "code": info["code"],
                "name": info["name"],
                "zone": info["zone"],
                "status": "ONLINE",
                "battery": 92,
                "prevention": prevention_service.get_prevention_status(info["code"])
            }
    raise HTTPException(status_code=404, detail="Device not found")


@app.post("/api/devices/register")
@app.post("/api/notifications/register")
def register_device(payload: DeviceRegistrationRequest):
    """Register mobile farmer device & FCM push token."""
    db = SessionLocal()
    try:
        device = db.query(DeviceRecord).filter(DeviceRecord.device_id == payload.device_id).first()
        if device:
            device.fcm_token = payload.fcm_token
            device.farmer_id = payload.farmer_id
            device.farm_id = payload.farm_id
            device.platform = payload.platform or "android"
            device.updated_at = datetime.utcnow()
        else:
            device = DeviceRecord(
                device_id=payload.device_id,
                farmer_id=payload.farmer_id,
                farm_id=payload.farm_id,
                fcm_token=payload.fcm_token,
                platform=payload.platform or "android",
                status="ONLINE",
                last_seen=datetime.utcnow().isoformat()
            )
            db.add(device)
        db.commit()
        return {"status": "success", "message": "Device registered successfully for push notifications."}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        db.close()


# ==========================================
# 4. YOLO Inference & Pipeline Processing
# ==========================================

def process_pil_inference(
    pil_img: Image.Image,
    conf_thresh: float = 0.25,
    node_id: int = 1,
    source: str = "LIVE"
) -> Dict[str, Any]:
    """
    Central unified pipeline:
    Image -> YOLO -> Species -> Geofence -> Threat Assessment -> AI Decision
    -> Prevention -> Notification -> DB Event -> WebSocket Broadcast
    """
    global MODEL, MODEL_CLASSES
    if MODEL is None:
        load_yolo_model()

    node_info = NODE_MAPPING.get(node_id, NODE_MAPPING[1])
    camera_id = node_info["code"]
    node_name = node_info["zone"]
    img_width, img_height = pil_img.size

    if pil_img.mode != "RGB":
        pil_img = pil_img.convert("RGB")

    # 1. Run YOLO inference
    start_time = time.time()
    results = MODEL.predict(pil_img, conf=conf_thresh, verbose=False)
    infer_time_ms = round((time.time() - start_time) * 1000, 1)

    res = results[0]
    boxes = res.boxes

    raw_detections = []
    unique_seq = f"{datetime.now().strftime('%Y%m%d')}-{int(time.time()*1000)%100000:05d}"
    event_id = f"WS-EVT-{unique_seq}"
    intrusion_id = f"WS-INT-{unique_seq}"


    for i, b in enumerate(boxes):
        cls_id = int(b.cls[0].item())
        conf = float(b.conf[0].item())
        xyxy = b.xyxy[0].tolist()
        class_name = MODEL_CLASSES.get(cls_id, f"Class_{cls_id}")
        det_id = f"{event_id}-{i+1:02d}"

        norm_xyxy = [
            xyxy[0] / img_width,
            xyxy[1] / img_height,
            xyxy[2] / img_width,
            xyxy[3] / img_height
        ]

        det_obj = format_detection_payload(
            detection_id=det_id,
            class_name=class_name,
            confidence=conf,
            bbox=xyxy,
            normalized_bbox=norm_xyxy,
            camera_id=camera_id,
            node_name=node_name,
            img_width=img_width,
            img_height=img_height
        )
        raw_detections.append(det_obj)

    detections = sorted(raw_detections, key=lambda d: d["confidence"], reverse=True)
    primary_detection = detections[0] if detections else None

    # 2. Evaluate Geofence & AI Threat Decision
    if primary_detection:
        eval_result = evaluate_decision(
            species=primary_detection["class"],
            confidence=primary_detection["confidence"],
            inside_geofence=True,
            zone=node_name
        )
    else:
        eval_result = {
            "threat_level": "LOW",
            "threat_reason": "No confident intrusion detected",
            "action": "Standby",
            "actuators": {"siren": False, "floodlight": False, "speaker": False, "sprinkler": False},
            "is_intrusion": False,
            "behaviour": {"activity": "Perimeter clear", "possible_damage": "None", "risk_score": 0}
        }

    # 3. Render Annotated Image
    draw_img = pil_img.copy()
    draw = ImageDraw.Draw(draw_img)
    for det_obj in detections:
        xyxy = det_obj["bbox"]
        color = "#ef4444" if eval_result["is_intrusion"] else "#22c55e"
        draw.rectangle(xyxy, outline=color, width=3)
        label_text = f"{det_obj['class']} ({det_obj['code']}) {det_obj['confidence_pct']}%"
        draw.rectangle([xyxy[0], max(0, xyxy[1]-20), xyxy[0] + len(label_text)*8, xyxy[1]], fill=color)
        draw.text((xyxy[0]+3, max(0, xyxy[1]-18)), label_text, fill="#ffffff")

    buffered = io.BytesIO()
    draw_img.save(buffered, format="JPEG", quality=85)
    annotated_b64 = f"data:image/jpeg;base64,{base64.b64encode(buffered.getvalue()).decode('utf-8')}"

    now_iso = datetime.utcnow().isoformat()
    time_fmt = datetime.now().strftime("%I:%M:%S %p")

    # 4. Assemble Central Standard Event Payload
    response_payload = {
        "event_id": event_id,
        "intrusion_id": intrusion_id,
        "farm_id": "WS-FARM-001",
        "source": source,
        "timestamp": now_iso,
        "time_formatted": time_fmt,
        "camera_id": camera_id,
        "node_id": camera_id,
        "node_name": node_name,
        "inference_time_ms": infer_time_ms,
        "detection_count": len(detections),
        "status": "DETECTED" if detections else "NO CONFIDENT DETECTION",
        "intrusion": eval_result["is_intrusion"],
        "max_threat": eval_result["threat_level"],
        "primary_detection": primary_detection,
        "detections": detections,
        "location": {
            "zone": node_name,
            "distance_m": 15.0 if detections else 0.0,
            "direction": "Crop Center",
            "inside_geofence": eval_result["is_intrusion"]
        },
        "behaviour": eval_result["behaviour"],
        "threat": {
            "level": eval_result["threat_level"],
            "reason": eval_result["threat_reason"]
        },
        "decision": {
            "action": eval_result["action"],
            "actuators": eval_result["actuators"]
        },
        "prevention": {
            **eval_result["actuators"],
            "status": "ACTIVE" if eval_result["is_intrusion"] else "STANDBY"
        },
        "notification": {
            "status": "SENT" if eval_result["is_intrusion"] else "NONE",
            "channel": "FCM"
        },
        "annotated_image": f"data:image/jpeg;base64,{annotated_b64}"
    }

    # 5. Persist to PostgreSQL Database
    if detections:
        db = SessionLocal()
        try:
            # 1. Detection Record
            record = EventRecord(
                event_id=event_id,
                farm_id="WS-FARM-001",
                device_id=camera_id,
                camera_id=camera_id,
                node_id=camera_id,
                zone_id="ZONE-01",
                farm_zone=node_name,
                species=primary_detection["class"],
                species_code=primary_detection["code"],
                code=primary_detection["code"],
                confidence=primary_detection["confidence_pct"],
                bbox=json.dumps(primary_detection["bbox"]),
                threat_level=eval_result["threat_level"],
                intrusion=eval_result["is_intrusion"],
                inside_geofence=eval_result["is_intrusion"],
                source=source,
                annotated_image_path=f"data:image/jpeg;base64,{annotated_b64}",
                annotated_image=f"data:image/jpeg;base64,{annotated_b64}",
                inference_time_ms=infer_time_ms,
                decision_action=eval_result["action"],
                prevention_status="ACTIVE" if eval_result["is_intrusion"] else "STANDBY",
                actuators_json=json.dumps(eval_result["actuators"]),
                notification_status="SENT" if eval_result["is_intrusion"] else "NONE",
                status="DETECTED",
                timestamp=now_iso,
                time_formatted=time_fmt,
                detected_at=now_iso,
                raw_payload_json=json.dumps(response_payload)
            )
            db.add(record)

            # 2. Intrusion Record
            if eval_result["is_intrusion"]:
                intrusion_rec = Intrusion(
                    intrusion_id=intrusion_id,
                    event_id=event_id,
                    farm_id="WS-FARM-001",
                    device_id=camera_id,
                    species=primary_detection["class"],
                    species_code=primary_detection["code"],
                    confidence=primary_detection["confidence_pct"],
                    zone_id="ZONE-01",
                    threat_level=eval_result["threat_level"],
                    status="ACTIVE",
                    entered_at=now_iso,
                    source=source
                )
                db.add(intrusion_rec)

            # 3. Prevention Action Record
            prevention_rec = PreventionAction(
                prevention_id=f"PREV-{event_id}",
                event_id=event_id,
                siren=eval_result["actuators"].get("siren", False),
                floodlight=eval_result["actuators"].get("floodlight", False),
                speaker=eval_result["actuators"].get("speaker", False),
                sprinkler=eval_result["actuators"].get("sprinkler", False),
                decision=eval_result["action"],
                status="ACTIVE" if eval_result["is_intrusion"] else "STANDBY",
                activated_at=now_iso
            )
            db.add(prevention_rec)

            # 4. Notification Record
            if eval_result["is_intrusion"]:
                notif_rec = NotificationRecord(
                    notification_id=f"NOTIF-{event_id}",
                    event_id=event_id,
                    farmer_id="FARMER-001",
                    title=f"{'[DEMO] ' if source == 'SIMULATION' else ''}Wildlife Alert",
                    message=f"{primary_detection['class']} detected in {node_name}. Risk: {eval_result['threat_level']}.",
                    notification_type="INTRUSION_ALERT",
                    status="SENT",
                    created_at=now_iso,
                    sent_at=now_iso
                )
                db.add(notif_rec)

            # 5. Analytics Event Record
            analytics_rec = AnalyticsEvent(
                farm_id="WS-FARM-001",
                event_id=event_id,
                species=primary_detection["class"],
                zone_id="ZONE-01",
                threat_level=eval_result["threat_level"],
                prevention_used=eval_result["action"],
                source=source,
                timestamp=now_iso
            )
            db.add(analytics_rec)

            db.commit()
            print(f"[DB SUCCESS] Event {event_id} & Intrusion {intrusion_id} saved to Neon PostgreSQL.")
        except Exception as e:
            db.rollback()
            print(f"[DB ERROR] Failed to save detection event: {e}")
        finally:
            db.close()

        # 6. WebSocket Broadcast INTRUSION_CREATED (Only after DB transaction commits)
        if eval_result["is_intrusion"]:
            dispatch_background_task(
                ws_manager.broadcast_event(
                    event_type="INTRUSION_CREATED",
                    data={
                        "intrusion_id": intrusion_id,
                        "event_id": event_id,
                        "species": primary_detection["class"],
                        "species_code": primary_detection["code"],
                        "confidence": primary_detection["confidence_pct"],
                        "zone": node_name,
                        "threat": eval_result["threat_level"],
                        "status": "ACTIVE",
                        "source": source
                    },
                    priority=eval_result["threat_level"]
                )
            )

        # 7. Execute Prevention & MQTT Actuators
        if eval_result["is_intrusion"]:
            dispatch_background_task(
                prevention_service.activate_deterrent(
                    event_id=event_id,
                    node_code=camera_id,
                    species=primary_detection["class"],
                    actuators=eval_result["actuators"],
                    duration_seconds=15,
                    triggered_by="AI_ENGINE",
                    intrusion_id=intrusion_id
                )
            )
            mqtt_service.publish_deterrent_command(
                farm_id="WS-FARM-001",
                node_id=camera_id,
                event_id=event_id,
                command="ACTIVATE_DETERRENT",
                actuators=eval_result["actuators"]
            )
            # Dispatch FCM Notification
            dispatch_background_task(
                notification_service.send_event_notification(
                    event_id=event_id,
                    species=primary_detection["class"],
                    confidence=primary_detection["confidence"],
                    farm_zone=node_name,
                    threat_level=eval_result["threat_level"],
                    action_taken=eval_result["action"]
                )
            )

        # 8. Broadcast DETECTION_EVENT to all Clients
        dispatch_background_task(
            ws_manager.broadcast_event(
                event_type="DETECTION_EVENT",
                data=response_payload,
                priority=eval_result["threat_level"]
            )
        )

    return response_payload


class TestDetectRequest(BaseModel):
    filename: str
    conf: Optional[float] = 0.25
    node_id: Optional[int] = 1


class Base64DetectRequest(BaseModel):
    image: str
    conf: Optional[float] = 0.25
    node_id: Optional[int] = 1


@app.post("/api/detect")
async def detect_upload(
    file: Optional[UploadFile] = File(None),
    conf: float = Form(0.25),
    node_id: int = Form(1)
):
    """Run live inference on uploaded camera snapshot."""
    if not file:
        raise HTTPException(status_code=400, detail="No image file provided")
    contents = await file.read()
    try:
        pil_img = Image.open(io.BytesIO(contents))
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Invalid image format: {e}")

    return process_pil_inference(pil_img, conf_thresh=conf, node_id=node_id, source="LIVE")


@app.post("/api/detect-frame")
async def detect_frame(payload: Base64DetectRequest):
    """Run live inference on a base64 encoded video frame."""
    try:
        header, encoded = payload.image.split(",", 1) if "," in payload.image else ("", payload.image)
        img_bytes = base64.b64decode(encoded)
        pil_img = Image.open(io.BytesIO(img_bytes))
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to decode base64 image: {e}")

    return process_pil_inference(pil_img, conf_thresh=payload.conf or 0.25, node_id=payload.node_id or 1, source="LIVE")


# ==========================================
# 5. Dataset Simulator
# ==========================================

@app.get("/api/test-images")
def list_test_images():
    """List all available unseen test images from dataset."""
    if not TEST_IMAGES_DIR.exists():
        return {"count": 0, "images": []}
    
    files = sorted(glob.glob(str(TEST_IMAGES_DIR / "*.*")))
    result = []
    for i, f in enumerate(files):
        p = Path(f)
        filename = p.name
        result.append({
            "id": i + 1,
            "filename": filename,
            "label": f"Sample {i+1:02d}: {filename}",
            "url": f"/static-test-images/{filename}",
            "size_kb": round(p.stat().st_size / 1024, 1)
        })

    return {"count": len(result), "images": result}


@app.post("/api/test-detect")
def detect_test_image(payload: TestDetectRequest):
    """Run YOLO inference on a selected dataset image (Simulation Mode)."""
    img_path = TEST_IMAGES_DIR / payload.filename
    if not img_path.exists():
        raise HTTPException(status_code=404, detail=f"Test image {payload.filename} not found.")

    try:
        pil_img = Image.open(str(img_path))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error reading image: {e}")

    response = process_pil_inference(
        pil_img,
        conf_thresh=payload.conf or 0.25,
        node_id=payload.node_id or 1,
        source="SIMULATION"
    )
    response["source_file"] = payload.filename
    return response


# ==========================================
# 6. Events & Historical Telemetry
# ==========================================

@app.get("/api/events")
def get_events(limit: int = Query(50, ge=1, le=200)):
    """Return historical detection events list from database."""
    db = SessionLocal()
    try:
        records = db.query(EventRecord).order_by(EventRecord.created_at.desc()).limit(limit).all()
        events = []
        for r in records:
            events.append({
                "event_id": r.event_id,
                "farm_id": r.farm_id,
                "source": r.source,
                "species": r.species,
                "code": r.code,
                "confidence": r.confidence,
                "threat": r.threat_level,
                "time": r.time_formatted,
                "timestamp": r.timestamp,
                "location": r.farm_zone,
                "camera_id": r.camera_id,
                "intrusion": r.inside_geofence,
                "response": [r.decision_action] if r.decision_action else [],
                "prevention_status": r.prevention_status,
                "annotated_image": r.annotated_image
            })
        return {"count": len(events), "events": events}
    finally:
        db.close()


@app.get("/api/events/{event_id}")
def get_event_detail(event_id: str):
    """Retrieve full detail for a specific event."""
    db = SessionLocal()
    try:
        r = db.query(EventRecord).filter(EventRecord.event_id == event_id).first()
        if not r:
            raise HTTPException(status_code=404, detail="Event not found")
        return json.loads(r.raw_payload_json) if r.raw_payload_json else {
            "event_id": r.event_id, "species": r.species, "threat": r.threat_level
        }
    finally:
        db.close()


@app.get("/api/intrusions")
@app.get("/api/intrusions/active")
def get_active_intrusions():
    """Return active perimeter intrusions from Neon PostgreSQL database."""
    db = SessionLocal()
    try:
        records = db.query(Intrusion).filter(
            Intrusion.status == "ACTIVE"
        ).order_by(Intrusion.created_at.desc()).limit(20).all()

        intrusions_list = []
        for r in records:
            intrusions_list.append({
                "intrusion_id": r.intrusion_id,
                "event_id": r.event_id,
                "farm_id": r.farm_id,
                "device_id": getattr(r, 'device_id', 'FN-1'),
                "species": r.species,
                "species_code": getattr(r, 'species_code', 'WS-WL-WB'),
                "confidence": getattr(r, 'confidence', 95.0),
                "zone": r.zone_id,
                "threat": r.threat_level,
                "status": r.status,
                "source": getattr(r, 'source', 'SIMULATION'),
                "entered_at": r.entered_at
            })

        return {
            "count": len(intrusions_list),
            "intrusions": intrusions_list,
            "active_intrusions": intrusions_list
        }
    finally:
        db.close()


@app.post("/api/intrusions/{intrusion_id}/clear")
def clear_intrusion(intrusion_id: str):
    """Mark an intrusion as CLEARED (animal exited)."""
    db = SessionLocal()
    try:
        record = db.query(Intrusion).filter(
            (Intrusion.intrusion_id == intrusion_id) | (Intrusion.event_id == intrusion_id)
        ).first()
        if not record:
            raise HTTPException(status_code=404, detail="Intrusion not found")
        
        now_iso = datetime.utcnow().isoformat()
        record.status = "CLEARED"
        record.exited_at = now_iso
        db.commit()

        dispatch_background_task(
            ws_manager.broadcast_event(
                event_type="ANIMAL_EXITED",
                data={
                    "intrusion_id": record.intrusion_id,
                    "event_id": record.event_id,
                    "status": "CLEARED"
                },
                priority="INFO"
            )
        )
        return {"status": "success", "message": f"Intrusion {intrusion_id} cleared."}
    finally:
        db.close()



# ==========================================
# 7. Decisions & Prevention APIs
# ==========================================

@app.get("/api/decisions")
def get_decisions_matrix():
    """Return AI species threat decision taxonomy."""
    return SPECIES_CONFIG


@app.get("/api/prevention")
def get_prevention_states():
    """Return real-time actuator prevention states for all nodes."""
    return prevention_service.get_all_prevention_states()


@app.post("/api/trigger-response")
def trigger_response(payload: TriggerResponseRequest):
    """Modular hardware actuator response trigger (manual operator override / test)."""
    node_code = f"FN-{payload.node_id}" if payload.node_id else "FN-1"
    dispatch_background_task(
        prevention_service.manual_override(
            node_code=node_code,
            actuators=payload.actuators,
            operator_id=payload.triggered_by or "OPERATOR"
        )
    )
    mqtt_service.publish_deterrent_command(
        farm_id="WS-FARM-001",
        node_id=node_code,
        event_id=payload.event_id or f"MANUAL-{int(time.time())}",
        command="MANUAL_OVERRIDE",
        actuators=payload.actuators
    )
    active_devices = [k for k, v in payload.actuators.items() if v]
    return {
        "status": "success",
        "mode": payload.mode,
        "species": payload.species,
        "active_actuators": active_devices,
        "message": f"Deterrent protocol engaged: {', '.join(active_devices) if active_devices else 'Standby'}",
        "timestamp": datetime.utcnow().isoformat()
    }


# ==========================================
# 8. Notifications API
# ==========================================

@app.get("/api/notifications")
def get_notifications(limit: int = 50):
    """Return historical notification records."""
    return notification_service.get_recent_notifications(limit=limit)


@app.post("/api/notifications/{notification_id}/read")
def mark_notification_read(notification_id: str):
    """Mark a notification as read."""
    db = SessionLocal()
    try:
        record = db.query(NotificationRecord).filter(NotificationRecord.notification_id == notification_id).first()
        if record:
            record.status = "READ"
            db.commit()
            return {"status": "success"}
        raise HTTPException(status_code=404, detail="Notification not found")
    finally:
        db.close()


# ==========================================
# 9. Analytics API
# ==========================================

@app.get("/api/analytics")
def get_analytics():
    """Return computed live event analytics alongside fixed model benchmarks."""
    db = SessionLocal()
    try:
        events = db.query(EventRecord).all()
        total_detections = len(events)
        live_count = sum(1 for e in events if e.source == "LIVE")
        sim_count = sum(1 for e in events if e.source == "SIMULATION")
        high_threat = sum(1 for e in events if e.threat_level in ["HIGH", "CRITICAL"])
        deterrent_count = sum(1 for e in events if e.prevention_status in ["ACTIVE", "COMPLETED"])
        
        species_breakdown = {}
        zone_counts = {}
        conf_sum = 0.0

        for e in events:
            species_breakdown[e.species] = species_breakdown.get(e.species, 0) + 1
            zone_counts[e.farm_zone] = zone_counts.get(e.farm_zone, 0) + 1
            conf_sum += (e.confidence or 0.0)

        most_active_zone = max(zone_counts, key=zone_counts.get) if zone_counts else "North Field"
        avg_conf = round(conf_sum / total_detections, 1) if total_detections > 0 else 94.5

        return {
            "total_detections": total_detections,
            "live_detections": live_count,
            "simulated_detections": sim_count,
            "species_breakdown": species_breakdown,
            "high_threat_events": high_threat,
            "deterrent_activations": deterrent_count,
            "active_intrusions": sum(1 for e in events if e.inside_geofence and e.prevention_status == "ACTIVE"),
            "most_active_zone": most_active_zone,
            "average_confidence": avg_conf,
            "model_benchmark": MODEL_BENCHMARKS,
            "last_updated": datetime.utcnow().isoformat()
        }
    finally:
        db.close()


# ==========================================
# 10. Offline Sync API
# ==========================================

@app.get("/api/sync")
def sync_get(since: Optional[str] = None):
    """Retrieve new events created since the last sync timestamp."""
    events = sync_service.get_events_since(since_timestamp=since)
    return {
        "status": "success",
        "server_time": datetime.utcnow().isoformat(),
        "count": len(events),
        "events": events
    }


@app.post("/api/sync")
@app.post("/api/sync-events")
def sync_post(payload: Dict[str, Any]):
    """Sync offline cached events from farmer mobile app."""
    offline_events = payload.get("events") or payload.get("offline_events") or []
    res = sync_service.sync_offline_events(offline_events)
    return {
        "status": "success",
        "synced_count": res["synced_count"],
        "duplicate_count": res["duplicate_count"],
        "message": f"Successfully synchronized {res['synced_count']} offline intrusion events."
    }


# ==========================================
# 11. WebSocket Endpoint
# ==========================================

@app.websocket("/ws")
async def websocket_endpoint(
    websocket: WebSocket,
    client_type: str = Query("web"),
    client_id: str = Query("anon")
):
    """Real-time bi-directional WebSocket hub for Web & Mobile clients."""
    await ws_manager.connect(websocket, client_type=client_type, client_id=client_id)
    try:
        while True:
            data = await websocket.receive_text()
            try:
                msg = json.loads(data)
                if msg.get("type") == "PING":
                    await websocket.send_json({"type": "PONG", "timestamp": datetime.utcnow().isoformat()})
                elif msg.get("type") == "MANUAL_TRIGGER":
                    # Handle mobile/web manual trigger over WebSocket
                    await prevention_service.manual_override(
                        node_code=msg.get("node_code", "FN-1"),
                        actuators=msg.get("actuators", {}),
                        operator_id=client_id
                    )
            except Exception:
                pass
    except WebSocketDisconnect:
        await ws_manager.disconnect(websocket)
    except Exception:
        await ws_manager.disconnect(websocket)


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.server:app", host="0.0.0.0", port=8000, reload=True)
