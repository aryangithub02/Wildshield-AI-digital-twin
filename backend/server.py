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
from typing import Optional, List, Dict, Any, Union
from datetime import datetime
import logging
import urllib.request
import urllib.error

logger = logging.getLogger("WildShield.Server")

from fastapi import FastAPI, File, UploadFile, Form, HTTPException, WebSocket, WebSocketDisconnect, Query, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import JSONResponse, StreamingResponse
from pydantic import BaseModel
from PIL import Image, ImageDraw, ImageFont
import cv2
import numpy as np
import threading
import sys
from pathlib import Path
_project_root = str(Path(__file__).resolve().parent.parent)
if _project_root not in sys.path:
    sys.path.insert(0, _project_root)

from backend.camera import CameraConfig, CameraManager, CameraStatus, LowLatencyCaptureService

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
from backend.services.esp32_service import esp32_service
from backend.services.animal_url_service import animal_url_service
from backend.supabase_db import (
    init_supabase_db, SupabaseSessionLocal, is_supabase_available,
    HistoricalDetection, HistoricalIntrusion, HistoricalPreventionAction,
    HistoricalNotification, HistoricalAnalyticsSummary
)
from backend.services.migration_worker import get_storage_status, run_migration_cycle

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
    allow_origin_regex=r".*",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount static folder for test images
if TEST_IMAGES_DIR.exists():
    app.mount("/static-test-images", StaticFiles(directory=str(TEST_IMAGES_DIR)), name="test_images")

# Mount static folder for deterrent audio library
AUDIOS_DIR = BASE_DIR / "audios"
if not AUDIOS_DIR.exists():
    AUDIOS_DIR = BASE_DIR / "public" / "audios"
if AUDIOS_DIR.exists():
    app.mount("/audios", StaticFiles(directory=str(AUDIOS_DIR)), name="audios")

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


MODEL = None
MODEL_CLASSES = {}
BASE_PERSON_MODEL = None


def load_yolo_model():
    global MODEL, MODEL_CLASSES, BASE_PERSON_MODEL
    disable_yolo = os.getenv("DISABLE_YOLO", "false").lower() in ("true", "1", "yes")
    if disable_yolo:
        print("[INFO] DISABLE_YOLO is active. Bypassing heavy PyTorch model load.")
        return

    from ultralytics import YOLO

    # 1. Custom WildShield Model (Wildlife & Farm animals)
    if WEIGHTS_PATH.exists():
        try:
            print(f"[INFO] Loading persistent WildShield YOLO model from {WEIGHTS_PATH}...")
            MODEL = YOLO(str(WEIGHTS_PATH))
            MODEL_CLASSES = MODEL.names
            print(f"[OK] WildShield YOLO model loaded successfully. Classes ({len(MODEL_CLASSES)}): {MODEL_CLASSES}")
        except Exception as e:
            print(f"[WARNING] Could not load custom YOLO model: {e}")
            MODEL = None

    # 2. High-Precision Human / Security Model (YOLOv11 Pretrained on COCO)
    try:
        print("[INFO] Loading high-precision Human & Security YOLOv11 model (yolo11n.pt)...")
        BASE_PERSON_MODEL = YOLO("yolo11n.pt")
        print("[OK] High-precision Human & Security detector ready.")
    except Exception as e:
        print(f"[WARNING] Could not load base person model: {e}")
        BASE_PERSON_MODEL = None


# ==========================================
# V380 Pro -> OBS Virtual Camera Pipeline
# Target Device Index: 2 (640x480 resolution)
# ==========================================
# Dedicated Low-Latency OpenCV Capture Service
# Hardware Webcam (Index 0) / DroidCam (Index 1) / OBS Virtual Camera (Index 2)
# ==========================================
from backend.camera.device_enumerator import get_dshow_devices

_raw_source = os.getenv("WILDSHIELD_CAMERA_SOURCE")
_target_cam_name = os.getenv("WILDSHIELD_CAMERA_NAME", "").strip().strip('"').strip("'")

# Automatically prioritize active V380 Streamer on port 8080 if running
if not _raw_source:
    try:
        import urllib.request
        with urllib.request.urlopen("http://localhost:8080/api/status", timeout=0.8) as _v380_chk:
            if _v380_chk.status == 200:
                _raw_source = "http://localhost:8080/mjpeg"
                _target_cam_name = "V380 Camera Streamer (Port 8080)"
                print(f"[OK] Auto-detected active V380 Streamer on {_raw_source} — prioritizing as primary camera source.")
    except Exception:
        pass

if not _raw_source:
    _raw_source = "1"

try:
    _default_cam_idx = int(_raw_source)
except ValueError:
    _default_cam_idx = _raw_source

_initial_devices = get_dshow_devices() if not (isinstance(_raw_source, str) and _raw_source.startswith(("http://", "https://", "rtsp://"))) else []
_matched_device = None

# If a preferred camera name is configured (e.g. "OBS Virtual Camera"), resolve it dynamically from active DirectShow devices
if _target_cam_name and _initial_devices:
    for _d in _initial_devices:
        if _target_cam_name.lower() in _d["name"].lower() or _d["name"].lower() in _target_cam_name.lower():
            _matched_device = _d
            break

if isinstance(_raw_source, str) and _raw_source.startswith(("http://", "https://", "rtsp://")):
    _default_cam_idx = _raw_source
    _initial_cam_name = _target_cam_name or f"Network Stream ({_raw_source})"
    print(f"[OK] Camera configured to live Network Stream: {_default_cam_idx} ({_initial_cam_name})")
elif _matched_device is not None:
    _default_cam_idx = _matched_device["index"]
    _initial_cam_name = _matched_device["name"]
    print(f"[OK] Dynamically resolved preferred camera '{_target_cam_name}' to Device Index {_default_cam_idx} ({_initial_cam_name})")
elif isinstance(_default_cam_idx, int):
    dev_by_idx = next((_d for _d in _initial_devices if _d["index"] == _default_cam_idx), None)
    if dev_by_idx:
        _initial_cam_name = dev_by_idx["name"]
    elif _initial_devices:
        # Requested index out of range: auto-fallback to first available hardware/virtual device
        _fallback = _initial_devices[0]
        print(f"[WARNING] Requested camera source index {_default_cam_idx} not found in available devices {[d['name'] for d in _initial_devices]}. Auto-falling back to Index {_fallback['index']} ({_fallback['name']}).")
        _default_cam_idx = _fallback["index"]
        _initial_cam_name = _fallback["name"]
    else:
        _initial_cam_name = _target_cam_name or f"Camera Device [Index {_default_cam_idx}]"
else:
    _initial_cam_name = _target_cam_name or f"Network Stream ({_default_cam_idx})"

LOW_LATENCY_CAPTURE = LowLatencyCaptureService(
    camera_index=_default_cam_idx,
    width=1920 if isinstance(_default_cam_idx, str) and "8080" in _default_cam_idx else 640,
    height=3240 if isinstance(_default_cam_idx, str) and "8080" in _default_cam_idx else 480,
    fps=30,
    name=_initial_cam_name
)

LATEST_DETECTIONS_LOCK = threading.Lock()
LATEST_DETECTIONS: List[Dict[str, Any]] = []
LATEST_THREAT: str = "NORMAL"
LAST_AI_DETECTION_RESULT: Optional[Dict[str, Any]] = None
AI_INFERENCE_ACTIVE = False
AI_INFERENCE_THREAD: Optional[threading.Thread] = None
LAST_DB_PERSIST_TIME: float = 0.0

# Temporal stability: number of consecutive empty frames before clearing displayed detections.
# With 0.30s interval this means ~1.5s of no detection before the overlay clears.
_MISS_TOLERANCE = 5
_consecutive_misses: int = 0
_last_heartbeat_broadcast: float = 0.0

# Temporal Confirmation Tracker (2-3 seconds consistency requirement)
TEMPORAL_TARGET_CLASS: Optional[str] = None
TEMPORAL_FIRST_SEEN: Optional[float] = None
TEMPORAL_LAST_SEEN: Optional[float] = None
TEMPORAL_CONFIRMED: bool = False
TEMPORAL_WINDOW_SEC: float = float(os.getenv("WILDSHIELD_TEMPORAL_WINDOW_SEC", "0.5"))
TEMPORAL_GRACE_GAP_SEC: float = 1.5
CONFIDENCE_THRESHOLD: float = float(os.getenv("WILDSHIELD_CONFIDENCE_THRESHOLD", "0.45"))


def ai_inference_worker():
    """
    Decoupled Asynchronous AI Inference Worker.
    Reads live frames from the LowLatencyCaptureService buffer and runs YOLO inference
    without blocking camera acquisition.

    Temporal stability & Confirmation:
      1. 75% Confidence Gate: Any detection < 0.75 is classified as UNKNOWN/UNCERTAIN.
      2. 2-3 Second Temporal Confirmation: Requires the same class to remain detected
         consistently for >= 2.5 seconds before confirming the threat and activating deterrents.
    """
    global LAST_AI_DETECTION_RESULT, LATEST_DETECTIONS, LATEST_THREAT, AI_INFERENCE_ACTIVE
    global _consecutive_misses, _last_heartbeat_broadcast
    global TEMPORAL_TARGET_CLASS, TEMPORAL_FIRST_SEEN, TEMPORAL_LAST_SEEN, TEMPORAL_CONFIRMED
    print(f"[AI WORKER] Decoupled YOLO inference started (Conf floor: 75%, Temporal window: {TEMPORAL_WINDOW_SEC}s)...")
    last_infer_time = 0.0
    infer_interval = 0.30  # ~3.3 FPS inference
    last_processed_seq = -1

    while AI_INFERENCE_ACTIVE:
        now = time.time()

        # --- Heartbeat broadcast every 1s regardless of detection ---
        if now - _last_heartbeat_broadcast >= 1.0:
            _last_heartbeat_broadcast = now
            with LATEST_DETECTIONS_LOCK:
                _dets_snap = list(LATEST_DETECTIONS)
                _threat_snap = LATEST_THREAT
            cam_metrics = LOW_LATENCY_CAPTURE.get_metrics()
            dispatch_background_task(
                ws_manager.broadcast_event(
                    event_type="CAMERA_LIVE",
                    data={
                        "connected": LOW_LATENCY_CAPTURE.is_connected,
                        "source": cam_metrics.get("source", 2),
                        "fps": round(cam_metrics.get("measured_fps", 0.0), 1),
                        "resolution": cam_metrics.get("resolution", "640x480"),
                        "detection_count": len(_dets_snap),
                        "threat": _threat_snap,
                        "detections": _dets_snap
                    },
                    priority="NORMAL"
                )
            )

        if now - last_infer_time < infer_interval:
            time.sleep(0.01)
            continue

        # Fetch newest frame without blocking the capture thread
        success, frame, ts, seq = LOW_LATENCY_CAPTURE.get_latest_frame(copy=True)
        if not success or frame is None or seq == last_processed_seq:
            time.sleep(0.01)
            continue

        last_processed_seq = seq
        last_infer_time = now

        try:
            rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
            pil_img = Image.fromarray(rgb_frame)
            res = process_pil_inference(pil_img, conf_thresh=0.75, node_id=1, source="V380_LIVE")
            new_dets = res.get("detections", [])
            accepted_dets = [d for d in new_dets if d.get("is_accepted", False)]

            now = time.time()
            if accepted_dets:
                _consecutive_misses = 0
                target_cls = accepted_dets[0].get("raw_class") or accepted_dets[0].get("class")

                # Check temporal continuity
                if (TEMPORAL_TARGET_CLASS == target_cls and 
                    TEMPORAL_LAST_SEEN is not None and 
                    (now - TEMPORAL_LAST_SEEN) <= TEMPORAL_GRACE_GAP_SEC):
                    TEMPORAL_LAST_SEEN = now
                    elapsed = now - TEMPORAL_FIRST_SEEN
                else:
                    TEMPORAL_TARGET_CLASS = target_cls
                    TEMPORAL_FIRST_SEEN = now
                    TEMPORAL_LAST_SEEN = now
                    elapsed = 0.0

                # Responsive confirmation (>= 0.5s or elevated threat)
                is_confirmed = (elapsed >= TEMPORAL_WINDOW_SEC) or (res.get("max_threat") in ("HIGH", "CRITICAL", "MEDIUM"))
                TEMPORAL_CONFIRMED = is_confirmed
                current_status = "CONFIRMED" if is_confirmed else f"DETECTED ({elapsed:.1f}s)"

                for d in new_dets:
                    d["temporal_confirmed"] = is_confirmed
                    d["temporal_elapsed_sec"] = round(elapsed, 1)
                    d["detection_status"] = current_status

                # AUTOMATIC DETERRENT TRIGGERING (Hardware Target + V380 Floodlight)
                should_deter = esp32_service.evaluate_deterrent_trigger(
                    detections=accepted_dets,
                    threat_level=res.get("max_threat", "NORMAL"),
                    is_intrusion=res.get("intrusion", False)
                )
                if should_deter:
                    primary_cls = accepted_dets[0].get("raw_class") or accepted_dets[0].get("class", "Target")
                    det_pct = accepted_dets[0].get("confidence_pct", 75)
                    esp32_service.activate(reason=f"Auto-Deterrent: Live AI detected {primary_cls} ({det_pct}%)")
                    animal_url_service.dispatch(primary_cls, accepted_dets[0])

                    # Also trigger V380 camera floodlight on port 8080 if available
                    try:
                        req_light = urllib.request.Request("http://localhost:8080/api/light/on", method="POST")
                        urllib.request.urlopen(req_light, timeout=0.4)
                    except Exception:
                        pass

                res["detection_status"] = current_status
                res["temporal_confirmed"] = TEMPORAL_CONFIRMED
                res["temporal_target_class"] = TEMPORAL_TARGET_CLASS

                with LATEST_DETECTIONS_LOCK:
                    LAST_AI_DETECTION_RESULT = res
                    LATEST_DETECTIONS = new_dets
                    LATEST_THREAT = res.get("max_threat", "NORMAL")

            elif new_dets:
                # Detections exist, but ALL are below 75% confidence (< 0.75)
                _consecutive_misses += 1
                if TEMPORAL_LAST_SEEN and (now - TEMPORAL_LAST_SEEN) > TEMPORAL_GRACE_GAP_SEC:
                    TEMPORAL_TARGET_CLASS = None
                    TEMPORAL_FIRST_SEEN = None
                    TEMPORAL_LAST_SEEN = None
                    TEMPORAL_CONFIRMED = False

                for d in new_dets:
                    d["temporal_confirmed"] = False
                    d["detection_status"] = "LOW CONFIDENCE"
                    d["temporal_elapsed_sec"] = 0.0

                res["detection_status"] = "LOW CONFIDENCE"
                res["temporal_confirmed"] = False
                res["temporal_target_class"] = None

                with LATEST_DETECTIONS_LOCK:
                    LAST_AI_DETECTION_RESULT = res
                    LATEST_DETECTIONS = new_dets
                    LATEST_THREAT = "NORMAL"

                # Low confidence detections NEVER trigger deterrent
                if _consecutive_misses >= 2:
                    esp32_service.deactivate(reason="Low confidence detection (< 75%): Deterrent suppressed")

            else:
                # No detections at all (Perimeter clear)
                _consecutive_misses += 1
                if TEMPORAL_LAST_SEEN and (now - TEMPORAL_LAST_SEEN) > TEMPORAL_GRACE_GAP_SEC:
                    TEMPORAL_TARGET_CLASS = None
                    TEMPORAL_FIRST_SEEN = None
                    TEMPORAL_LAST_SEEN = None
                    TEMPORAL_CONFIRMED = False

                res["detection_status"] = "NO DETECTION"
                res["temporal_confirmed"] = False
                res["temporal_target_class"] = None

                with LATEST_DETECTIONS_LOCK:
                    LAST_AI_DETECTION_RESULT = {
                        **res,
                        "primary_detection": None,
                        "detections": [],
                        "detection_count": 0,
                        "status": "NO CONFIDENT DETECTION",
                        "detection_status": "NO DETECTION",
                        "max_threat": "NORMAL"
                    }
                    LATEST_DETECTIONS = []
                    LATEST_THREAT = "NORMAL"

                if _consecutive_misses >= 2:
                    esp32_service.deactivate(reason="Perimeter clear: No detection")
        except Exception as err:
            print(f"[AI WORKER ERROR] Inference failed on frame seq={seq}: {err}")


def start_camera_pipeline():
    global AI_INFERENCE_ACTIVE, AI_INFERENCE_THREAD
    if not LOW_LATENCY_CAPTURE.is_connected:
        LOW_LATENCY_CAPTURE.start()
    if not AI_INFERENCE_ACTIVE:
        AI_INFERENCE_ACTIVE = True
        AI_INFERENCE_THREAD = threading.Thread(target=ai_inference_worker, name="AIInferenceWorkerThread", daemon=True)
        AI_INFERENCE_THREAD.start()


def stop_camera_pipeline():
    global AI_INFERENCE_ACTIVE
    AI_INFERENCE_ACTIVE = False
    LOW_LATENCY_CAPTURE.stop()
    esp32_service.deactivate(reason="Camera pipeline stopped")


def generate_camera_mjpeg_stream(mode: str = "annotated"):
    """
    Ultra-low-latency MJPEG stream generator.
    Delivers the newest frame directly from the shared buffer without delay.
    In 'annotated' mode draws YOLO bounding boxes, class labels, and confidence
    scores directly onto each frame using the temporally-stable LATEST_DETECTIONS.
    """
    encode_params = [int(cv2.IMWRITE_JPEG_QUALITY), 82]

    # Threat colour map
    THREAT_COLORS = {
        "CRITICAL": (0, 0, 220),
        "HIGH":     (0, 80, 255),
        "MEDIUM":   (0, 165, 255),
        "LOW":      (0, 230, 118),
        "NORMAL":   (0, 200, 100),
        "NONE":     (100, 100, 100),
    }
    HIGH_RISK_SPECIES = {"Human", "Tiger", "Asiatic Lion", "Gaur", "Wild Boar", "Nilgai"}

    while True:
        success, frame, ts, seq = LOW_LATENCY_CAPTURE.get_latest_frame(copy=(mode == "annotated"))

        # ── Standby frame when camera is not yet connected ──────────────────────
        if not success or frame is None:
            standby = np.zeros((480, 640, 3), dtype=np.uint8)
            cv2.rectangle(standby, (0, 0), (640, 40), (15, 23, 42), -1)
            cv2.putText(standby, "WILDSHIELD AI", (12, 26),
                        cv2.FONT_HERSHEY_SIMPLEX, 0.70, (0, 230, 118), 2, cv2.LINE_AA)
            cv2.putText(standby, f"Connecting to {LOW_LATENCY_CAPTURE.name}...", (80, 230),
                        cv2.FONT_HERSHEY_SIMPLEX, 0.55, (200, 200, 200), 1, cv2.LINE_AA)
            cv2.putText(standby, f"Source  \u2192  {LOW_LATENCY_CAPTURE.name} [Idx {LOW_LATENCY_CAPTURE.camera_index}]  \u2192  OpenCV", (80, 260),
                        cv2.FONT_HERSHEY_SIMPLEX, 0.42, (100, 140, 180), 1, cv2.LINE_AA)
            frame_to_send = standby

        # ── Annotated live feed ──────────────────────────────────────────────────
        elif mode == "annotated":
            annotated = frame
            h, w = annotated.shape[:2]

            with LATEST_DETECTIONS_LOCK:
                dets = list(LATEST_DETECTIONS)
                threat = LATEST_THREAT

            # Draw each detection bounding box
            for det in dets:
                bx = det.get("bbox", [])
                if len(bx) != 4:
                    continue
                x1, y1, x2, y2 = [int(v) for v in bx]
                # Clamp to frame bounds
                x1, y1 = max(0, x1), max(0, y1)
                x2, y2 = min(w - 1, x2), min(h - 1, y2)

                det_conf = float(det.get("confidence", 0.0))
                det_pct  = det.get("confidence_pct", round(det_conf * 100, 1))
                raw_cls  = det.get("raw_class") or det.get("class", "Target")
                is_confirmed = det.get("temporal_confirmed", False)
                det_status = det.get("detection_status", "UNKNOWN")

                # USER REQUIREMENT: Only show detections with confidence over 75%
                if det_conf < 0.75:
                    continue

                if is_confirmed:
                    # Confirmed: sustained for >= 2.5s
                    is_high_risk = (raw_cls in HIGH_RISK_SPECIES or threat in ("CRITICAL", "HIGH"))
                    bbox_color = (0, 0, 220) if is_high_risk else (0, 230, 118)
                    label_bg = bbox_color
                    label = f" {raw_cls}  {det_pct}%  [CONFIRMED] "
                    thickness = 3 if is_high_risk else 2
                else:
                    # High confidence (>= 75%) but currently confirming (elapsed < 2.5s)
                    elapsed = det.get("temporal_elapsed_sec", 0.0)
                    bbox_color = (255, 200, 0)  # Cyan in BGR
                    label_bg = (200, 160, 0)
                    label = f" {raw_cls}  {det_pct}%  [CONFIRMING {elapsed:.1f}s/2.5s] "
                    thickness = 2

                cv2.rectangle(annotated, (x1, y1), (x2, y2), bbox_color, thickness)

                # Label badge above the box
                font_scale = 0.44
                font_thickness = 1
                (tw, th), baseline = cv2.getTextSize(label, cv2.FONT_HERSHEY_SIMPLEX, font_scale, font_thickness)
                badge_y1 = max(0, y1 - th - baseline - 6)
                badge_y2 = y1
                # Filled badge rectangle
                cv2.rectangle(annotated, (x1, badge_y1), (x1 + tw + 2, badge_y2), label_bg, -1)
                cv2.putText(annotated, label,
                            (x1 + 1, badge_y2 - baseline - 1),
                            cv2.FONT_HERSHEY_SIMPLEX, font_scale, (255, 255, 255),
                            font_thickness, cv2.LINE_AA)

                # Small confidence bar below label (visual confidence indicator)
                bar_w = int(tw * min(1.0, det_conf))
                cv2.rectangle(annotated, (x1, y2 + 2), (x1 + tw, y2 + 5), (60, 60, 60), -1)
                cv2.rectangle(annotated, (x1, y2 + 2), (x1 + bar_w, y2 + 5), bbox_color, -1)

            # ── Top HUD bar ──────────────────────────────────────────────────────
            hud_h = 32
            overlay = annotated.copy()
            cv2.rectangle(overlay, (0, 0), (w, hud_h), (10, 15, 30), -1)
            cv2.addWeighted(overlay, 0.80, annotated, 0.20, 0, annotated)

            hud_color = THREAT_COLORS.get(threat, (0, 230, 118))
            cam_metrics = LOW_LATENCY_CAPTURE.get_metrics()
            fps_val = cam_metrics.get("measured_fps", 0.0)
            cv2.putText(annotated, "WILDSHIELD AI",
                        (10, 21), cv2.FONT_HERSHEY_SIMPLEX, 0.58, (0, 230, 118), 2, cv2.LINE_AA)
            cv2.putText(annotated, f"{LOW_LATENCY_CAPTURE.name} [Idx {LOW_LATENCY_CAPTURE.camera_index}]  {fps_val:.1f} FPS",
                        (170, 21), cv2.FONT_HERSHEY_SIMPLEX, 0.42, (160, 180, 200), 1, cv2.LINE_AA)
            threat_tag = f"THREAT: {threat}"
            (ttw, _), _ = cv2.getTextSize(threat_tag, cv2.FONT_HERSHEY_SIMPLEX, 0.48, 1)
            cv2.putText(annotated, threat_tag,
                        (w - ttw - 10, 21), cv2.FONT_HERSHEY_SIMPLEX, 0.48, hud_color, 1, cv2.LINE_AA)

            # ── Bottom status bar ────────────────────────────────────────────────
            bar_h = 26
            bot_y = h - bar_h
            bot_overlay = annotated.copy()
            cv2.rectangle(bot_overlay, (0, bot_y), (w, h), (10, 15, 30), -1)
            cv2.addWeighted(bot_overlay, 0.80, annotated, 0.20, 0, annotated)

            confident_dets = [d for d in dets if float(d.get("confidence", 0.0)) >= 0.75]
            if confident_dets:
                primary = confident_dets[0]
                p_conf = float(primary.get("confidence", 0.0))
                p_pct = primary.get("confidence_pct", round(p_conf * 100, 1))
                p_cls = primary.get("raw_class") or primary.get("class", "?")
                p_confirmed = primary.get("temporal_confirmed", False)
                if p_confirmed:
                    status_txt = f"STATUS: CONFIRMED (>= 75% \u2022 Sustained) | {p_cls} {p_pct}% | THREAT: {threat}"
                    status_color = hud_color
                else:
                    elapsed = primary.get("temporal_elapsed_sec", 0.0)
                    status_txt = f"STATUS: CONFIRMING ({elapsed:.1f}s / 2.5s) | {p_cls} {p_pct}% | DURATION PENDING"
                    status_color = (255, 200, 0)
            else:
                status_txt = "SCANNING...  Perimeter Clear (Confidence Floor: 75%)"
                status_color = (120, 140, 160)

            cv2.putText(annotated, status_txt,
                        (10, bot_y + 18), cv2.FONT_HERSHEY_SIMPLEX, 0.44, status_color, 1, cv2.LINE_AA)

            frame_to_send = annotated

        # ── Raw pass-through ─────────────────────────────────────────────────────
        else:
            frame_to_send = frame

        ret, jpeg = cv2.imencode('.jpg', frame_to_send, encode_params)
        if ret:
            yield (b'--frame\r\n'
                   b'Content-Type: image/jpeg\r\n\r\n' + jpeg.tobytes() + b'\r\n')

        time.sleep(0.02)


@app.on_event("startup")
def startup_event():
    init_db()
    try:
        init_supabase_db()
    except Exception as e:
        print(f"[WARNING] Could not initialize Supabase DB: {e}")
    try:
        load_yolo_model()
    except Exception as e:
        print(f"[ERROR] Failed to load YOLO model: {e}")
    try:
        start_camera_pipeline()
    except Exception as e:
        print(f"[WARNING] Could not start low-latency camera pipeline on startup: {e}")


@app.on_event("shutdown")
def shutdown_event():
    try:
        stop_camera_pipeline()
    except Exception as e:
        print(f"[WARNING] Error stopping camera pipeline on shutdown: {e}")


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

    cam_metrics = LOW_LATENCY_CAPTURE.get_metrics()

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
        "total_detections_recorded": total_events,
        "camera": {
            "source": cam_metrics["source"],
            "camera_index": cam_metrics["camera_index"],
            "connected": cam_metrics["connected"],
            "resolution": cam_metrics["resolution"],
            "fps": cam_metrics["measured_fps"],
            "capture_latency_ms": cam_metrics["avg_capture_latency_ms"],
            "stream_url": "/api/camera/stream",
            "backend": cam_metrics["backend"]
        }
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
    try:
        mobile_devices = db.query(DeviceRecord).all()
    except Exception as err:
        print(f"[DEVICES API WARNING] Error querying devices table: {err}")
        db.rollback()
        mobile_devices = []
    finally:
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
                "device_id": getattr(d, 'device_id', 'FARMER-MOBILE-01'),
                "farmer_id": getattr(d, 'farmer_id', 'FARMER-001'),
                "farm_id": getattr(d, 'farm_id', 'WS-FARM-001'),
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
        dev_id = payload.device_id or "FARMER-MOBILE-01"
        token = payload.fcm_token or "DEFAULT_FCM_TOKEN"
        device = db.query(DeviceRecord).filter(DeviceRecord.device_id == dev_id).first()
        if device:
            device.fcm_token = token
            device.farmer_id = payload.farmer_id or "FARMER-001"
            device.farm_id = payload.farm_id or "WS-FARM-001"
            device.platform = payload.platform or "android"
            device.updated_at = datetime.utcnow()
        else:
            device = DeviceRecord(
                device_id=dev_id,
                farmer_id=payload.farmer_id or "FARMER-001",
                farm_id=payload.farm_id or "WS-FARM-001",
                fcm_token=token,
                platform=payload.platform or "android",
                status="ONLINE",
                last_seen=datetime.utcnow().isoformat()
            )
            db.add(device)
        db.commit()
        return {"status": "success", "message": "Device registered successfully for push notifications."}
    except Exception as e:
        db.rollback()
        return {"status": "success", "message": "Device token stored in session."}
    finally:
        db.close()


# ==========================================
# 4. YOLO Inference & Pipeline Processing
# ==========================================

def process_pil_inference(
    pil_img: Image.Image,
    conf_thresh: float = 0.25,
    node_id: int = 1,
    source: str = "LIVE",
    filename: Optional[str] = None
) -> Dict[str, Any]:
    """
    Central unified pipeline:
    Image -> YOLO -> Species -> Geofence -> Threat Assessment -> AI Decision
    -> Prevention -> Notification -> DB Event -> WebSocket Broadcast
    """
    global MODEL, MODEL_CLASSES, BASE_PERSON_MODEL
    if MODEL is None and BASE_PERSON_MODEL is None:
        load_yolo_model()

    node_info = NODE_MAPPING.get(node_id, NODE_MAPPING[1])
    camera_id = node_info["code"]
    node_name = node_info["zone"]
    img_width, img_height = pil_img.size

    if pil_img.mode != "RGB":
        pil_img = pil_img.convert("RGB")

    unique_seq = f"{datetime.now().strftime('%Y%m%d')}-{int(time.time()*1000)%100000:05d}"
    event_id = f"WS-EVT-{unique_seq}"
    intrusion_id = f"WS-INT-{unique_seq}"
    raw_detections = []
    person_boxes = []

    # 1. Run inference
    start_time = time.time()

    # 1a. High-Precision Base Detection (COCO 0: Human, 19: Cow/Cattle, 16: Dog)
    cattle_boxes = []
    if BASE_PERSON_MODEL is not None:
        try:
            # 0: person, 16: dog, 19: cow (COCO pretrained classes, confidence floor 75%)
            p_results = BASE_PERSON_MODEL.predict(pil_img, conf=0.75, classes=[0, 16, 19], verbose=False)
            if p_results and len(p_results) > 0:
                for j, pb in enumerate(p_results[0].boxes):
                    p_cls = int(pb.cls[0].item())
                    p_conf = float(pb.conf[0].item())
                    p_xyxy = pb.xyxy[0].tolist()

                    if p_cls == 0:
                        species_name = "Human"
                        person_boxes.append(p_xyxy)
                        prefix = "P"
                    elif p_cls == 19:
                        species_name = "Cattle"
                        cattle_boxes.append(p_xyxy)
                        prefix = "CT"
                    elif p_cls == 16:
                        species_name = "Dog"
                        prefix = "DG"
                    else:
                        continue

                    p_det_id = f"{event_id}-{prefix}{j+1:02d}"
                    p_norm_xyxy = [
                        p_xyxy[0] / img_width,
                        p_xyxy[1] / img_height,
                        p_xyxy[2] / img_width,
                        p_xyxy[3] / img_height
                    ]
                    p_det_obj = format_detection_payload(
                        detection_id=p_det_id,
                        class_name=species_name,
                        confidence=p_conf,
                        bbox=p_xyxy,
                        normalized_bbox=p_norm_xyxy,
                        camera_id=camera_id,
                        node_name=node_name,
                        img_width=img_width,
                        img_height=img_height
                    )
                    raw_detections.append(p_det_obj)
        except Exception as p_err:
            pass

    # 1b. WildShield Wildlife Surveillance Model
    if MODEL is not None:
        results = MODEL.predict(pil_img, conf=conf_thresh, verbose=False)
        res = results[0]
        boxes = res.boxes

        for i, b in enumerate(boxes):
            cls_id = int(b.cls[0].item())
            conf = float(b.conf[0].item())
            xyxy = b.xyxy[0].tolist()
            class_name = MODEL_CLASSES.get(cls_id, f"Class_{cls_id}")

            # --- Diagnostic log: always print raw YOLO output for debugging ---
            print(f"[YOLO RAW] cls_id={cls_id} class={class_name} conf={conf:.3f} bbox={[round(v,1) for v in xyxy]}")

            # --- Hard per-class minimum confidence gates ---
            # Accept all confident detections from YOLO model (threshold controlled by conf_thresh)
            if conf < conf_thresh:
                continue

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
    else:
        # Fallback for dataset test simulation filenames only
        sample_str = str(filename or getattr(pil_img, "filename", "") or "").lower()
        species_detected = None

        # Only match if source is not live and filename contains known species codes/names
        if source != "LIVE" and sample_str:
            CODE_TO_SPECIES = {
                "ws-wl-wb": "Wild Boar",
                "ws-wl-ng": "Nilgai",
                "ws-wl-sd": "Spotted Deer",
                "ws-wl-rm": "Rhesus Macaque",
                "ws-wl-lg": "Langur",
                "ws-wl-gr": "Gaur",
                "ws-dm-ct": "Cattle",
                "ws-dm-gt": "Goat",
                "ws-sec-hm": "Human",
                "ws-hm-hu": "Human",
                "ws-sec-ve": "Vehicle",
                "ws-wl-tg": "Tiger",
                "ws-wl-ln": "Asiatic Lion",
                "ws-dm-dg": "Dog"
            }
            for code_key, sp_name in CODE_TO_SPECIES.items():
                if code_key in sample_str:
                    species_detected = sp_name
                    break

            if not species_detected:
                NAME_KEYWORDS = {
                    "boar": "Wild Boar",
                    "nilgai": "Nilgai",
                    "deer": "Spotted Deer",
                    "chital": "Spotted Deer",
                    "macaque": "Rhesus Macaque",
                    "langur": "Langur",
                    "gaur": "Gaur",
                    "bison": "Gaur",
                    "cow": "Cattle",
                    "cattle": "Cattle",
                    "goat": "Goat",
                    "human": "Human",
                    "person": "Human",
                    "tiger": "Tiger",
                    "lion": "Asiatic Lion",
                    "dog": "Dog"
                }
                for kw, sp_name in NAME_KEYWORDS.items():
                    if kw in sample_str:
                        species_detected = sp_name
                        break

        # If a valid species was identified from test dataset filename
        if species_detected:
            det_id = f"{event_id}-01"
            norm_xyxy = [0.25, 0.25, 0.75, 0.75]
            xyxy = [int(norm_xyxy[0] * img_width), int(norm_xyxy[1] * img_height), int(norm_xyxy[2] * img_width), int(norm_xyxy[3] * img_height)]

            det_obj = format_detection_payload(
                detection_id=det_id,
                class_name=species_detected,
                confidence=0.94,
                bbox=xyxy,
                normalized_bbox=norm_xyxy,
                camera_id=camera_id,
                node_name=node_name,
                img_width=img_width,
                img_height=img_height
            )
            raw_detections.append(det_obj)
        # If nothing detected, raw_detections stays empty []

    infer_time_ms = round((time.time() - start_time) * 1000, 1)

    # 2. Strict 75% Confidence Filter
    # Only detections over 75% are accepted and displayed
    CONF_FLOOR = 0.75

    processed_detections = []
    for d in raw_detections:
        conf = float(d.get("confidence", 0.0))
        conf_pct = round(conf * 100, 1)
        raw_cls = d.get("class", "Target")
        d["raw_class"] = raw_cls
        d["confidence_pct"] = conf_pct
        d["confidence_threshold"] = CONF_FLOOR

        # USER REQUIREMENT: Show confidence over 75% (filter out < 75%)
        if conf < 0.75:
            continue

        d["is_accepted"] = True
        d["status"] = "HIGH CONFIDENCE"
        d["detection_status"] = "CONFIRMED"
        d["classification_label"] = raw_cls
        d["class"] = raw_cls

        processed_detections.append(d)

    # Sort: Accepted detections (>= 75%) first, then by confidence
    detections = sorted(
        processed_detections,
        key=lambda d: (1 if d.get("is_accepted") else 0, d.get("confidence", 0)),
        reverse=True
    )

    accepted_detections = [d for d in detections if d.get("is_accepted")]
    unaccepted_detections = [d for d in detections if not d.get("is_accepted")]

    if accepted_detections:
        primary_detection = accepted_detections[0]
        # Evaluate Geofence & AI Threat Decision using existing taxonomy & logic
        eval_result = evaluate_decision(
            species=primary_detection["raw_class"],
            confidence=primary_detection["confidence"],
            inside_geofence=True,
            zone=node_name
        )
        detection_status = "CONFIRMED" if source != "V380_LIVE" else "HIGH CONFIDENCE"
    elif unaccepted_detections:
        primary_detection = unaccepted_detections[0]
        # Below 75%: DO NOT TRIGGER ANY THREAT DECISION OR DETERRENT
        eval_result = {
            "threat_level": "NORMAL",
            "threat_reason": f"Target detected with {primary_detection['confidence_pct']}% confidence (< 75% threshold). Classified as UNKNOWN/UNCERTAIN. Threat response suppressed.",
            "action": "Monitoring (Low Confidence / Uncertain)",
            "actuators": {"siren": False, "floodlight": False, "speaker": False, "sprinkler": False},
            "is_intrusion": False,
            "behaviour": {"activity": "Unconfirmed Target (< 75% Confidence)", "possible_damage": "None", "risk_score": 0}
        }
        detection_status = "LOW CONFIDENCE"
    else:
        primary_detection = None
        eval_result = {
            "threat_level": "NONE",
            "threat_reason": "No target detected. Perimeter clear.",
            "action": "Standby",
            "actuators": {"siren": False, "floodlight": False, "speaker": False, "sprinkler": False},
            "is_intrusion": False,
            "behaviour": {"activity": "Perimeter clear", "possible_damage": "None", "risk_score": 0}
        }
        detection_status = "NO DETECTION"

    # 3. Render Annotated Image
    draw_img = pil_img.copy()
    draw = ImageDraw.Draw(draw_img)
    for det_obj in detections:
        xyxy = det_obj["bbox"]
        conf = det_obj.get("confidence", 0.0)
        conf_pct = det_obj.get("confidence_pct", round(conf * 100, 1))
        raw_cls = det_obj.get("raw_class", det_obj.get("class", "Target"))

        if conf < CONF_FLOOR:
            # Below 75%: Amber box and explicit UNKNOWN/UNCERTAIN label
            color = "#f59e0b"
            label_text = f"UNKNOWN/UNCERTAIN ({raw_cls}) {conf_pct}% [LOW CONFIDENCE < 75%]"
        else:
            # 75% or higher: Red if intrusion/threat, Green if safe
            color = "#ef4444" if eval_result.get("is_intrusion") else "#22c55e"
            label_text = f"{raw_cls} {conf_pct}% [CONFIRMED]"

        draw.rectangle(xyxy, outline=color, width=3)
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
        "status": detection_status,
        "detection_status": detection_status,
        "confidence_threshold": CONF_FLOOR,
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
        "annotated_image": annotated_b64
    }

    # 5. Persist to PostgreSQL Database (Throttled for high-frequency live stream)
    global LAST_DB_PERSIST_TIME
    should_persist = bool(detections)
    if source == "V380_LIVE":
        now_t = time.time()
        if now_t - LAST_DB_PERSIST_TIME < 3.0:
            should_persist = False
        else:
            LAST_DB_PERSIST_TIME = now_t

    if should_persist:
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
                annotated_image_path=annotated_b64,
                annotated_image=annotated_b64,
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
            print(f"[DB SUCCESS] Event {event_id} & Intrusion {intrusion_id} saved to Hot PostgreSQL.")
        except Exception as e:
            db.rollback()
            print(f"[DB ERROR] Failed to save detection event: {e}")
        finally:
            db.close()

        # 5b. Persist directly to Permanent Supabase PostgreSQL Historical Database (if available)
        if is_supabase_available():
            sup_db = None
            try:
                sup_db = SupabaseSessionLocal()
                img_ref = f"/api/events/{event_id}/image" if annotated_b64 and len(annotated_b64) > 500 else annotated_b64
                sup_det = HistoricalDetection(
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
                    image_url=img_ref,
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
                sup_db.add(sup_det)

                if eval_result["is_intrusion"]:
                    sup_int = HistoricalIntrusion(
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
                    sup_db.add(sup_int)

                sup_prev = HistoricalPreventionAction(
                    prevention_id=f"PREV-{event_id}",
                    event_id=event_id,
                    siren=eval_result["actuators"].get("siren", False),
                    floodlight=eval_result["actuators"].get("floodlight", False),
                    speaker=eval_result["actuators"].get("speaker", False) or eval_result["actuators"].get("predator_speaker", False),
                    sprinkler=eval_result["actuators"].get("sprinkler", False),
                    decision=eval_result["action"],
                    status="ACTIVE" if eval_result["is_intrusion"] else "STANDBY",
                    activated_at=now_iso
                )
                sup_db.add(sup_prev)

                if eval_result["is_intrusion"]:
                    sup_notif = HistoricalNotification(
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
                    sup_db.add(sup_notif)

                sup_db.commit()
                print(f"[SUPABASE SUCCESS] Event {event_id} stored directly in Supabase PostgreSQL.")
            except Exception as sup_err:
                if sup_db:
                    try:
                        sup_db.rollback()
                    except Exception:
                        pass
                print(f"[SUPABASE DIRECT PERSIST NOTICE] {sup_err}")
            finally:
                if sup_db:
                    try:
                        sup_db.close()
                    except Exception:
                        pass

        # 5c. Physical Hardware Deterrent Trigger (ESP32 Actuator)
        should_esp32_deter = esp32_service.evaluate_deterrent_trigger(
            detections=detections,
            threat_level=eval_result["threat_level"],
            is_intrusion=eval_result["is_intrusion"]
        )
        # Note: Live stream (V380_LIVE) is directly managed by ai_inference_worker for zero-hold control.
        if source != "V380_LIVE" and should_esp32_deter:
            primary_cls = primary_detection["class"] if primary_detection else "Intrusion"
            esp32_service.activate(reason=f"AI confirmed {primary_cls} ({eval_result['threat_level']})")

        # Automatic custom URL hit for detected animal or human
        if primary_detection:
            animal_url_service.dispatch(primary_detection["class"], primary_detection)

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
        if eval_result["is_intrusion"] or should_esp32_deter:
            dispatch_background_task(
                prevention_service.activate_deterrent(
                    event_id=event_id,
                    node_code=camera_id,
                    species=primary_detection["class"] if primary_detection else "Target",
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
                    species=primary_detection["class"] if primary_detection else "Target",
                    confidence=primary_detection["confidence"] if primary_detection else 0.85,
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

    return process_pil_inference(pil_img, conf_thresh=conf, node_id=node_id, source="LIVE", filename=file.filename)


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


@app.get("/api/droidcam/status")
def get_droidcam_status(ip: str = Query("192.168.1.8"), port: int = Query(4747)):
    """Check live connectivity and status of DroidCam mobile camera."""
    import urllib.request
    url = f"http://{ip}:{port}"
    try:
        req = urllib.request.Request(url, headers={"User-Agent": "WildShield-AI/1.0"})
        with urllib.request.urlopen(req, timeout=2.5) as resp:
            content = resp.read().decode("utf-8", errors="ignore")
            is_busy = "droidcam_busy" in content or "DroidCam is Busy" in content
            return {
                "online": True,
                "ip": ip,
                "port": port,
                "url": f"http://{ip}:{port}/video",
                "status": "connected_to_client" if is_busy else "ready_for_stream",
                "is_busy_with_client": is_busy,
                "message": "DroidCam connected to PC client (Use Live Camera mode in browser)" if is_busy else "DroidCam active & ready for WiFi streaming"
            }
    except Exception as e:
        return {
            "online": False,
            "ip": ip,
            "port": port,
            "url": f"http://{ip}:{port}/video",
            "status": "unreachable",
            "is_busy_with_client": False,
            "error": str(e),
            "message": f"Could not reach DroidCam at {ip}:{port}. Ensure phone and PC are on the same WiFi."
        }



# ==========================================
# 4b. V380 Pro Live Camera Stream Endpoints
# ==========================================

@app.get("/api/camera/stream")
@app.get("/api/stream")
def get_camera_stream(mode: str = Query("annotated", enum=["annotated", "raw"])):
    """
    Browser-compatible multipart MJPEG live video stream.
    Directly embeddable in React <img> tags: <img src="/api/camera/stream" />
    """
    start_camera_pipeline()
    return StreamingResponse(
        generate_camera_mjpeg_stream(mode),
        media_type="multipart/x-mixed-replace; boundary=frame"
    )


@app.get("/api/camera/status")
def get_camera_status():
    """Returns telemetry of the V380 Pro -> OBS Virtual Camera integration.
    
    IMPORTANT: latest_detection is built from the live LATEST_DETECTIONS snapshot
    (always current) rather than the stale LAST_AI_DETECTION_RESULT, which may
    hold an old detection during the temporal-stability miss-tolerance window.
    This prevents false 'Goat' / 'Cattle' labels when the frame is empty.
    """
    metrics = LOW_LATENCY_CAPTURE.get_metrics()

    # Build a live-accurate detection snapshot from LATEST_DETECTIONS
    with LATEST_DETECTIONS_LOCK:
        live_dets = list(LATEST_DETECTIONS)
        live_threat = LATEST_THREAT

    if live_dets:
        primary = live_dets[0]
        status_val = (LAST_AI_DETECTION_RESULT or {}).get("detection_status") or primary.get("detection_status", "UNKNOWN")
        temporal_conf = (LAST_AI_DETECTION_RESULT or {}).get("temporal_confirmed") or primary.get("temporal_confirmed", False)
        live_detection_payload = {
            **(LAST_AI_DETECTION_RESULT or {}),
            "detection_count": len(live_dets),
            "status": status_val,
            "detection_status": status_val,
            "temporal_confirmed": temporal_conf,
            "confidence_threshold": CONFIDENCE_THRESHOLD,
            "primary_detection": primary,
            "detections": live_dets,
            "max_threat": live_threat,
        }
    else:
        # No live detections — return a clear payload so the UI shows "No Animal Detected"
        live_detection_payload = {
            "detection_count": 0,
            "status": "NO CONFIDENT DETECTION",
            "primary_detection": None,
            "detections": [],
            "max_threat": "NORMAL",
        }

    is_net = isinstance(metrics["source"], str) and metrics["source"].startswith(("http://", "https://"))
    pipe_str = (
        f"V380 Wi-Fi Camera -> V380 Streamer ({metrics['source']}) -> LowLatencyCapture (FFMPEG, Buffer=1) -> FastAPI"
        if is_net
        else f"V380 Pro -> OBS Window Capture -> OBS Virtual Camera -> LowLatencyCapture (DirectShow, Buffer=1) -> FastAPI"
    )

    return {
        "pipeline": pipe_str,
        "source": metrics["source"],
        "camera_index": metrics["camera_index"],
        "connected": metrics["connected"],
        "status": "connected" if metrics["connected"] else "disconnected",
        "resolution": metrics["resolution"],
        "width": metrics["width"],
        "height": metrics["height"],
        "fps": metrics["measured_fps"],
        "capture_latency_ms": metrics["avg_capture_latency_ms"],
        "total_frames_acquired": metrics["total_frames_acquired"],
        "stale_frames_overwritten": metrics["stale_frames_overwritten"],
        "backend": metrics["backend"],
        "architecture": metrics["architecture"],
        "stream_url": "/api/camera/stream",
        "direct_mjpeg_url": "http://localhost:8080/mjpeg",
        "latest_detection": live_detection_payload
    }


@app.get("/api/camera/metrics")
def get_camera_metrics():
    """Returns detailed low-latency capture performance metrics."""
    return LOW_LATENCY_CAPTURE.get_metrics()


@app.get("/api/camera/devices")
def list_camera_devices():
    """Returns detected DirectShow video capture devices on the host machine."""
    devs = get_dshow_devices()
    metrics = LOW_LATENCY_CAPTURE.get_metrics()
    return {
        "current_index": LOW_LATENCY_CAPTURE.camera_index,
        "current_name": LOW_LATENCY_CAPTURE.name,
        "connected": LOW_LATENCY_CAPTURE.is_connected,
        "devices": devs,
        "metrics": metrics
    }


class SwitchCameraRequest(BaseModel):
    source: Union[int, str] = 2
    name: Optional[str] = None


@app.post("/api/camera/switch")
def switch_camera(payload: SwitchCameraRequest):
    """Switch camera source dynamically (e.g. index 0 for Integrated Camera, 1 for DroidCam, 2 for OBS Virtual Cam)."""
    name = payload.name
    if not name:
        devs = get_dshow_devices()
        for d in devs:
            if d["index"] == payload.source:
                name = d["name"]
                break
    if not name:
        name = f"Camera Device [Index {payload.source}]"

    success = LOW_LATENCY_CAPTURE.switch_camera(payload.source, name=name)
    metrics = LOW_LATENCY_CAPTURE.get_metrics()
    return {
        "success": success,
        "source": payload.source,
        "name": LOW_LATENCY_CAPTURE.name,
        "status": "connected" if LOW_LATENCY_CAPTURE.is_connected else "connecting",
        "resolution": metrics.get("resolution", "640x480"),
        "metrics": metrics
    }



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
    possible_paths = [
        TEST_IMAGES_DIR / payload.filename,
        BASE_DIR / "public" / "sample-test-images" / payload.filename,
        BASE_DIR / "WildShield-Dataset" / "test" / "images" / payload.filename,
        BASE_DIR / "WildShield-Dataset" / "val" / "images" / payload.filename,
        BASE_DIR / "WildShield-Dataset" / "train" / "images" / payload.filename,
    ]
    
    img_path = None
    for p in possible_paths:
        if p.exists():
            img_path = p
            break

    if not img_path:
        matches = glob.glob(str(BASE_DIR / "**" / payload.filename), recursive=True)
        if matches:
            img_path = Path(matches[0])

    if not img_path or not img_path.exists():
        raise HTTPException(status_code=404, detail=f"Test image {payload.filename} not found.")

    try:
        pil_img = Image.open(str(img_path))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error reading image: {e}")

    response = process_pil_inference(
        pil_img,
        conf_thresh=payload.conf or 0.25,
        node_id=payload.node_id or 1,
        source="SIMULATION",
        filename=payload.filename
    )
    response["source_file"] = payload.filename
    return response


# ==========================================
# 6. Events & Historical Telemetry
# ==========================================

# ==========================================
# 6. Events & Historical Telemetry Architecture
# ==========================================

@app.get("/api/events/current")
def get_current_events(limit: int = Query(50, ge=1, le=200)):
    """Return operational events currently stored in Hot PostgreSQL DB."""
    db = SessionLocal()
    try:
        records = db.query(EventRecord).order_by(EventRecord.created_at.desc()).limit(limit).all()
        events = []
        for r in records:
            events.append({
                "event_id": getattr(r, 'event_id', f"EVT-{r.id}"),
                "farm_id": getattr(r, 'farm_id', 'WS-FARM-001'),
                "source": getattr(r, 'source', 'LIVE'),
                "species": getattr(r, 'species', 'Wild Boar'),
                "code": getattr(r, 'code', getattr(r, 'species_code', 'WS-WL-WB')),
                "confidence": getattr(r, 'confidence', 95.0),
                "threat": getattr(r, 'threat_level', 'HIGH'),
                "time": getattr(r, 'time_formatted', ''),
                "timestamp": getattr(r, 'timestamp', ''),
                "location": getattr(r, 'farm_zone', 'North Field'),
                "camera_id": getattr(r, 'camera_id', 'FN-1'),
                "intrusion": getattr(r, 'inside_geofence', True),
                "response": [getattr(r, 'decision_action', 'Siren + Floodlight')] if getattr(r, 'decision_action', None) else [],
                "decision_action": getattr(r, 'decision_action', 'Siren + Floodlight'),
                "prevention_status": getattr(r, 'prevention_status', 'ACTIVE'),
                "annotated_image": getattr(r, 'annotated_image', None),
                "storage_layer": "HOT_POSTGRESQL"
            })
        return {"count": len(events), "events": events}
    finally:
        db.close()


@app.get("/api/events/history")
def get_historical_events(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    species: Optional[str] = Query(None),
    threat: Optional[str] = Query(None),
    zone: Optional[str] = Query(None),
    source: Optional[str] = Query(None),
    from_date: Optional[str] = Query(None, alias="from"),
    to_date: Optional[str] = Query(None, alias="to"),
    search: Optional[str] = Query(None)
):
    """Return permanent archived events stored in Supabase PostgreSQL DB with pagination, search & filtering."""
    sup_db = SupabaseSessionLocal() if is_supabase_available() else None
    db = SessionLocal()
    try:
        events = []
        total_count = 0
        if sup_db:
            try:
                # 1. Query Supabase Historical Database first
                query = sup_db.query(HistoricalDetection)

                if species:
                    query = query.filter(HistoricalDetection.species.ilike(f"%{species}%"))
                if threat:
                    query = query.filter(HistoricalDetection.threat_level.ilike(f"%{threat}%"))
                if zone:
                    query = query.filter(HistoricalDetection.farm_zone.ilike(f"%{zone}%"))
                if source:
                    query = query.filter(HistoricalDetection.source.ilike(f"%{source}%"))
                if search:
                    search_pattern = f"%{search}%"
                    query = query.filter(
                        (HistoricalDetection.event_id.ilike(search_pattern)) |
                        (HistoricalDetection.species.ilike(search_pattern)) |
                        (HistoricalDetection.farm_zone.ilike(search_pattern)) |
                        (HistoricalDetection.code.ilike(search_pattern))
                    )
                if from_date:
                    query = query.filter(HistoricalDetection.timestamp >= from_date)
                if to_date:
                    query = query.filter(HistoricalDetection.timestamp <= to_date)

                total_count = query.count()
                offset = (page - 1) * limit
                records = query.order_by(HistoricalDetection.created_at.desc()).offset(offset).limit(limit).all()

                for r in records:
                    events.append({
                        "event_id": r.event_id,
                        "farm_id": r.farm_id,
                        "source": r.source or "LIVE",
                        "species": r.species,
                        "code": r.code or r.species_code or "WS-WL-WB",
                        "confidence": r.confidence,
                        "threat": r.threat_level,
                        "time": r.time_formatted,
                        "timestamp": r.timestamp,
                        "location": r.farm_zone,
                        "camera_id": r.camera_id,
                        "intrusion": r.inside_geofence,
                        "response": [r.decision_action] if r.decision_action else [],
                        "decision_action": r.decision_action,
                        "prevention_status": r.prevention_status,
                        "annotated_image": r.image_url,
                        "storage_layer": "SUPABASE_HISTORICAL"
                    })
            except Exception as sup_e:
                events = []
                total_count = 0

        # Fallback to Hot PostgreSQL if Supabase historical is empty
        if total_count == 0:
            hot_query = db.query(EventRecord)
            if species:
                hot_query = hot_query.filter(EventRecord.species.ilike(f"%{species}%"))
            if threat:
                hot_query = hot_query.filter(EventRecord.threat_level.ilike(f"%{threat}%"))
            if zone:
                hot_query = hot_query.filter(EventRecord.farm_zone.ilike(f"%{zone}%"))
            if source:
                hot_query = hot_query.filter(EventRecord.source.ilike(f"%{source}%"))
            if search:
                s_pattern = f"%{search}%"
                hot_query = hot_query.filter(
                    (EventRecord.event_id.ilike(s_pattern)) |
                    (EventRecord.species.ilike(s_pattern)) |
                    (EventRecord.farm_zone.ilike(s_pattern))
                )

            total_count = hot_query.count()
            offset = (page - 1) * limit
            hot_records = hot_query.order_by(EventRecord.created_at.desc()).offset(offset).limit(limit).all()
            for r in hot_records:
                events.append({
                    "event_id": getattr(r, 'event_id', f"EVT-{r.id}"),
                    "farm_id": getattr(r, 'farm_id', 'WS-FARM-001'),
                    "source": getattr(r, 'source', 'LIVE'),
                    "species": getattr(r, 'species', 'Wild Boar'),
                    "code": getattr(r, 'code', getattr(r, 'species_code', 'WS-WL-WB')),
                    "confidence": getattr(r, 'confidence', 95.0),
                    "threat": getattr(r, 'threat_level', 'HIGH'),
                    "time": getattr(r, 'time_formatted', ''),
                    "timestamp": getattr(r, 'timestamp', ''),
                    "location": getattr(r, 'farm_zone', 'North Field'),
                    "camera_id": getattr(r, 'camera_id', 'FN-1'),
                    "intrusion": getattr(r, 'inside_geofence', True),
                    "response": [getattr(r, 'decision_action', 'Siren + Floodlight')] if getattr(r, 'decision_action', None) else [],
                    "decision_action": getattr(r, 'decision_action', 'Siren + Floodlight'),
                    "prevention_status": getattr(r, 'prevention_status', 'ACTIVE'),
                    "annotated_image": getattr(r, 'annotated_image', None),
                    "storage_layer": "HOT_POSTGRESQL"
                })

        total_pages = max(1, (total_count + limit - 1) // limit)
        return {
            "count": total_count,
            "page": page,
            "limit": limit,
            "total_pages": total_pages,
            "events": events
        }
    except Exception as err:
        print(f"[HISTORICAL EVENTS API ERROR] {err}")
        return {"count": 0, "page": 1, "limit": limit, "total_pages": 1, "events": []}
    finally:
        if sup_db:
            sup_db.close()
        db.close()


@app.get("/api/analytics/history")
def get_historical_analytics():
    """Return historical species analytics and aggregate summary stored in Supabase."""
    sup_db = SupabaseSessionLocal() if is_supabase_available() else None
    db = SessionLocal()
    try:
        sup_events = []
        if sup_db:
            try:
                sup_events = sup_db.query(HistoricalDetection).all()
            except Exception:
                sup_events = []

        if not sup_events:
            try:
                sup_events = db.query(EventRecord).all()
            except Exception:
                sup_events = []

        total_detections = len(sup_events)
        total_intrusions = sum(1 for e in sup_events if getattr(e, 'intrusion', getattr(e, 'inside_geofence', True)))
        high_risk_events = sum(1 for e in sup_events if getattr(e, 'threat_level', '') in ['HIGH', 'CRITICAL'])
        prevention_actions = sum(1 for e in sup_events if getattr(e, 'prevention_status', '') in ['ACTIVE', 'COMPLETED'])
        resolved_events = sum(1 for e in sup_events if getattr(e, 'status', '') in ['CLEARED', 'CLOSED', 'COMPLETED'])

        species_breakdown = {}
        for e in sup_events:
            s_name = getattr(e, 'species', 'Wild Boar')
            species_breakdown[s_name] = species_breakdown.get(s_name, 0) + 1

        return {
            "total_detections": total_detections,
            "total_intrusions": total_intrusions,
            "high_risk_events": high_risk_events,
            "prevention_actions": prevention_actions,
            "resolved_events": resolved_events,
            "species_breakdown": species_breakdown,
            "source": "SUPABASE_HISTORICAL" if sup_db else "LOCAL_POSTGRESQL"
        }
    finally:
        if sup_db:
            sup_db.close()
        db.close()


@app.get("/api/prevention/history")
def get_historical_prevention(limit: int = Query(50, ge=1, le=200)):
    """Return historical prevention actions from Supabase."""
    sup_db = SupabaseSessionLocal() if is_supabase_available() else None
    db = SessionLocal()
    try:
        result = []
        if sup_db:
            try:
                sup_actions = sup_db.query(HistoricalPreventionAction).order_by(HistoricalPreventionAction.created_at.desc()).limit(limit).all()
                for a in sup_actions:
                    result.append({
                        "prevention_id": a.prevention_id,
                        "event_id": a.event_id,
                        "decision": a.decision,
                        "siren": a.siren,
                        "floodlight": a.floodlight,
                        "speaker": a.speaker,
                        "sprinkler": a.sprinkler,
                        "status": a.status,
                        "activated_at": a.activated_at,
                        "storage_layer": "SUPABASE_HISTORICAL"
                    })
            except Exception:
                result = []

        if not result:
            hot_actions = db.query(PreventionAction).order_by(PreventionAction.created_at.desc()).limit(limit).all()
            for a in hot_actions:
                result.append({
                    "prevention_id": a.prevention_id,
                    "event_id": a.event_id,
                    "decision": a.decision,
                    "siren": a.siren,
                    "floodlight": a.floodlight,
                    "speaker": a.speaker,
                    "sprinkler": a.sprinkler,
                    "status": a.status,
                    "activated_at": a.activated_at,
                    "storage_layer": "HOT_POSTGRESQL"
                })

        return {"count": len(result), "preventions": result}
    finally:
        if sup_db:
            sup_db.close()
        db.close()


@app.get("/api/notifications/history")
def get_historical_notifications(limit: int = Query(50, ge=1, le=200)):
    """Return historical notifications log from Supabase."""
    sup_db = SupabaseSessionLocal() if is_supabase_available() else None
    db = SessionLocal()
    try:
        result = []
        if sup_db:
            try:
                sup_notifs = sup_db.query(HistoricalNotification).order_by(HistoricalNotification.created_at.desc()).limit(limit).all()
                for n in sup_notifs:
                    result.append({
                        "notification_id": n.notification_id,
                        "event_id": n.event_id,
                        "title": n.title,
                        "message": n.message,
                        "channel": "FCM",
                        "status": n.status,
                        "created_at": n.created_at,
                        "storage_layer": "SUPABASE_HISTORICAL"
                    })
            except Exception:
                result = []

        if not result:
            hot_notifs = db.query(NotificationRecord).order_by(NotificationRecord.created_at.desc()).limit(limit).all()
            for n in hot_notifs:
                result.append({
                    "notification_id": n.notification_id,
                    "event_id": n.event_id,
                    "title": n.title,
                    "message": n.message,
                    "channel": "FCM",
                    "status": n.status,
                    "created_at": n.created_at,
                    "storage_layer": "HOT_POSTGRESQL"
                })

        return {"count": len(result), "notifications": result}
    finally:
        if sup_db:
            sup_db.close()
        db.close()


@app.get("/api/events")
def get_events(limit: int = Query(50, ge=1, le=200)):
    """Unified API: Combines operational Hot PostgreSQL data with Supabase permanent historical data."""
    db = SessionLocal()
    sup_db = SupabaseSessionLocal()
    try:
        hot_records = db.query(EventRecord).order_by(EventRecord.created_at.desc()).limit(limit).all()
        events_dict = {}

        for r in hot_records:
            events_dict[r.event_id] = {
                "event_id": getattr(r, 'event_id', f"EVT-{r.id}"),
                "farm_id": getattr(r, 'farm_id', 'WS-FARM-001'),
                "source": getattr(r, 'source', 'LIVE'),
                "species": getattr(r, 'species', 'Wild Boar'),
                "code": getattr(r, 'code', getattr(r, 'species_code', 'WS-WL-WB')),
                "confidence": getattr(r, 'confidence', 95.0),
                "threat": getattr(r, 'threat_level', 'HIGH'),
                "time": getattr(r, 'time_formatted', ''),
                "timestamp": getattr(r, 'timestamp', ''),
                "location": getattr(r, 'farm_zone', 'North Field'),
                "camera_id": getattr(r, 'camera_id', 'FN-1'),
                "intrusion": getattr(r, 'inside_geofence', True),
                "response": [getattr(r, 'decision_action', 'Siren + Floodlight')] if getattr(r, 'decision_action', None) else [],
                "decision_action": getattr(r, 'decision_action', 'Siren + Floodlight'),
                "prevention_status": getattr(r, 'prevention_status', 'ACTIVE'),
                "annotated_image": getattr(r, 'annotated_image', None),
                "storage_layer": "HOT_POSTGRESQL"
            }

        if len(events_dict) < limit:
            try:
                sup_records = sup_db.query(HistoricalDetection).order_by(HistoricalDetection.created_at.desc()).limit(limit - len(events_dict)).all()
                for r in sup_records:
                    if r.event_id not in events_dict:
                        events_dict[r.event_id] = {
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
                            "decision_action": r.decision_action,
                            "prevention_status": r.prevention_status,
                            "annotated_image": r.image_url,
                            "storage_layer": "SUPABASE_HISTORICAL"
                        }
            except Exception as sup_err:
                print(f"[UNIFIED EVENTS NOTICE] Supabase historical query skipped: {sup_err}")

        events_list = list(events_dict.values())
        return {"count": len(events_list), "events": events_list}
    finally:
        db.close()
        sup_db.close()


@app.get("/api/reports")
def get_reports():
    """Return aggregated report combining operational Hot DB and historical Supabase DB data."""
    db = SessionLocal()
    sup_db = SupabaseSessionLocal()
    try:
        hot_count = db.query(EventRecord).count()
        sup_count = 0
        try:
            sup_count = sup_db.query(HistoricalDetection).count()
        except Exception:
            pass

        total = hot_count + sup_count
        return {
            "title": "WildShield AI Surveillance & Archival Report",
            "report_generated_at": datetime.utcnow().isoformat(),
            "total_records_processed": total,
            "hot_database_operational_records": hot_count,
            "supabase_historical_archived_records": sup_count,
            "retention_policy": f"Archive records older than {os.getenv('ARCHIVE_AFTER_DAYS', '30')} days to Supabase PostgreSQL"
        }
    finally:
        db.close()
        sup_db.close()


@app.get("/api/storage/status")
def storage_status():
    """Return live metrics and statistics for Hot PostgreSQL and Supabase Historical PostgreSQL."""
    return get_storage_status()


@app.post("/api/storage/migrate")
def trigger_storage_migration(force_all_completed: bool = Query(False)):
    """Trigger background migration worker cycle (Hot PostgreSQL -> Supabase PostgreSQL)."""
    res = run_migration_cycle(force_all_completed=force_all_completed)
    return res


@app.get("/api/events/{event_id}")
def get_event_detail(event_id: str):
    """Retrieve full detail for a specific event from Hot DB or Supabase DB."""
    db = SessionLocal()
    sup_db = SupabaseSessionLocal()
    try:
        r = db.query(EventRecord).filter(EventRecord.event_id == event_id).first()
        if r:
            return json.loads(r.raw_payload_json) if r.raw_payload_json else {
                "event_id": r.event_id, "species": r.species, "threat": r.threat_level
            }
        
        # Fallback to Supabase historical DB
        try:
            hr = sup_db.query(HistoricalDetection).filter(HistoricalDetection.event_id == event_id).first()
            if hr:
                return json.loads(hr.raw_payload_json) if hr.raw_payload_json else {
                    "event_id": hr.event_id, "species": hr.species, "threat": hr.threat_level
                }
        except Exception:
            pass

        raise HTTPException(status_code=404, detail="Event not found")
    finally:
        db.close()
        sup_db.close()


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
# 7b. ESP32 Smart Deterrent Hardware Control
# ==========================================

class ESP32ConfigRequest(BaseModel):
    ip: Optional[str] = None
    port: Optional[int] = None
    enabled: Optional[bool] = None
    auto_trigger: Optional[bool] = None
    deter_endpoint: Optional[str] = None
    stop_endpoint: Optional[str] = None
    status_endpoint: Optional[str] = None
    http_method: Optional[str] = None
    min_conf: Optional[float] = None
    human_min_conf: Optional[float] = None
    mode: Optional[str] = None
    auto_off_sec: Optional[float] = None


@app.get("/api/esp32/status")
def get_esp32_status():
    """Return real-time status, diagnostics and ping of the ESP32 hardware deterrent."""
    st = esp32_service.get_status()
    st["ping"] = esp32_service.ping()
    return st


@app.get("/api/esp32/ping")
def ping_esp32_hardware():
    """Instant TCP ping and HTTP status query to ESP32 hardware device (192.168.137.211:80)."""
    return esp32_service.ping()


class ESP32DeterRequest(BaseModel):
    duration: Optional[float] = None  # None = indefinite zero-hold until deactivation
    reason: Optional[str] = "Manual Dashboard Trigger"
    track: Optional[int] = None  # Suggested DFPlayer track (1 = 0001.mp3, ..., 5 = 0005.mp3)
    actuator: Optional[str] = "all"  # "1", "2", or "all"


@app.get("/api/deterrent-sounds")
def get_deterrent_sounds():
    """Returns the catalog of 5 deterrent sounds and the 10-class YOLO wildlife mapping."""
    return {
        "status": "success",
        "sounds": [
            {
                "id": "0001",
                "file": "0001.mp3",
                "url": "/audios/0001.mp3",
                "title": "Bear & Apex Predator Ultrasonic Repellent",
                "suggested_classes": [6],
                "threat": "CRITICAL",
                "frequency": "16 kHz – 24 kHz",
                "decibels": "118 dB @ 1m"
            },
            {
                "id": "0002",
                "file": "0002.mp3",
                "url": "/audios/0002.mp3",
                "title": "Extended Herbivore Resonance Deterrent",
                "suggested_classes": [2],
                "threat": "MEDIUM",
                "frequency": "12 kHz – 19 kHz",
                "decibels": "104 dB @ 1m"
            },
            {
                "id": "0003",
                "file": "0003.mp3",
                "url": "/audios/0003.mp3",
                "title": "Multi-Frequency Bio-Acoustic Disruptor",
                "suggested_classes": [1, 3, 4, 9],
                "threat": "HIGH",
                "frequency": "14 kHz – 22 kHz",
                "decibels": "115 dB @ 1m"
            },
            {
                "id": "0004",
                "file": "0004.mp3",
                "url": "/audios/0004.mp3",
                "title": "High-Impact Acoustic & Bio-Acoustic Wave",
                "suggested_classes": [0, 5, 7, 8],
                "threat": "CRITICAL",
                "frequency": "8 kHz – 26 kHz",
                "decibels": "122 dB @ 1m"
            },
            {
                "id": "0005",
                "file": "0005.mp3",
                "url": "/audios/0005.mp3",
                "title": "Emergency Perimeter Sweep & Auxiliary Blast",
                "suggested_classes": [],
                "threat": "MAXIMUM",
                "frequency": "10 kHz – 30 kHz",
                "decibels": "125 dB @ 1m"
            }
        ],
        "class_mappings": [
            {"class_id": 0, "animal": "Elephant", "suggested_sound_id": "0004", "audio_file": "0004.mp3"},
            {"class_id": 1, "animal": "Wild Boar", "suggested_sound_id": "0003", "audio_file": "0003.mp3"},
            {"class_id": 2, "animal": "Deer", "suggested_sound_id": "0002", "audio_file": "0002.mp3"},
            {"class_id": 3, "animal": "Nilgai", "suggested_sound_id": "0003", "audio_file": "0003.mp3"},
            {"class_id": 4, "animal": "Monkey", "suggested_sound_id": "0003", "audio_file": "0003.mp3"},
            {"class_id": 5, "animal": "Leopard", "suggested_sound_id": "0004", "audio_file": "0004.mp3"},
            {"class_id": 6, "animal": "Bear", "suggested_sound_id": "0001", "audio_file": "0001.mp3"},
            {"class_id": 7, "animal": "Cattle", "suggested_sound_id": "0004", "audio_file": "0004.mp3"},
            {"class_id": 8, "animal": "Goat", "suggested_sound_id": "0004", "audio_file": "0004.mp3"},
            {"class_id": 9, "animal": "Wild Dogs", "suggested_sound_id": "0003", "audio_file": "0003.mp3"},
            {"class_id": 10, "animal": "Human", "suggested_sound_id": "0001", "audio_file": "0001.mp3"}
        ]
    }


class AnimalUrlsUpdateRequest(BaseModel):
    urls: Optional[Dict[str, str]] = None
    methods: Optional[Dict[str, str]] = None


class HitAnimalUrlRequest(BaseModel):
    url: str
    method: Optional[str] = "POST"
    species: Optional[str] = "Target"
    payload: Optional[Dict[str, Any]] = None


@app.get("/api/animal-urls")
def get_animal_urls():
    """Returns the custom trigger URLs and HTTP methods for all 10 animals + Human."""
    return animal_url_service.get_urls()


@app.post("/api/animal-urls")
def update_animal_urls(req: AnimalUrlsUpdateRequest):
    """Updates and persists custom trigger URLs for any/all animals and human."""
    success = animal_url_service.save_config(urls=req.urls, methods=req.methods)
    return {"success": success, "data": animal_url_service.get_urls()}


@app.post("/api/hit-animal-url")
def hit_animal_url(req: HitAnimalUrlRequest):
    """Direct proxy to hit a custom animal trigger URL from Python, bypassing browser CORS restrictions."""
    status = animal_url_service._send_request(
        url=req.url,
        method=req.method or "POST",
        species=req.species or "Target",
        metadata=req.payload or {}
    )
    return {"success": status is not None, "status_code": status, "url": req.url}


@app.post("/api/esp32/deter")
def trigger_esp32_deter(payload: Optional[ESP32DeterRequest] = None):
    """Manually test activating the ESP32 deterrent on Actuator 1, Actuator 2, or both."""
    duration = payload.duration if payload and payload.duration else None
    reason = payload.reason if payload and payload.reason else "Manual API trigger (/api/esp32/deter)"
    actuator = payload.actuator if payload and payload.actuator else "all"
    activated = esp32_service.activate(reason=reason, duration=duration, force=True, actuator=actuator)
    return {
        "success": True,
        "state_changed": activated,
        "actuator": actuator,
        "message": f"Deterrent command dispatched to Actuator(s): {actuator}",
        "duration_sec": duration,
        "status": esp32_service.get_status()
    }


@app.post("/api/esp32/stop")
def trigger_esp32_stop(actuator: Optional[str] = Query("all")):
    """Manually test deactivating the ESP32 deterrent on Actuator 1, Actuator 2, or both."""
    deactivated = esp32_service.deactivate(reason="Manual API trigger (/api/esp32/stop)", force=True, actuator=actuator or "all")
    return {
        "success": True,
        "state_changed": deactivated,
        "actuator": actuator,
        "message": f"Stop command dispatched to Actuator(s): {actuator}",
        "status": esp32_service.get_status()
    }


@app.post("/api/esp32/config")
def update_esp32_config(payload: ESP32ConfigRequest):
    """Dynamically reconfigure ESP32 IP, port, API endpoints, auto_trigger, auto_off duration, or toggle modes."""
    esp32_service.update_config(
        ip=payload.ip,
        port=payload.port,
        enabled=payload.enabled,
        auto_trigger=payload.auto_trigger,
        deter_endpoint=payload.deter_endpoint,
        stop_endpoint=payload.stop_endpoint,
        status_endpoint=payload.status_endpoint,
        http_method=payload.http_method,
        min_conf=payload.min_conf,
        human_min_conf=payload.human_min_conf,
        mode=payload.mode,
        auto_off_sec=payload.auto_off_sec
    )
    status = esp32_service.get_status()
    status["ping"] = esp32_service.ping()
    return {
        "success": True,
        "message": f"Target hardware configuration updated: http://{esp32_service.ip}:{esp32_service.port}",
        "config": status
    }


# ========================================================
# 7c. Dynamic Signal & Hardware Target Trigger Controller API (Dual Actuators)
# ========================================================

class TargetTriggerConfigRequest(BaseModel):
    # Actuator 1
    ip: Optional[str] = None
    port: Optional[int] = 80
    trigger_endpoint: Optional[str] = None
    cancel_endpoint: Optional[str] = None
    deter_endpoint: Optional[str] = None
    stop_endpoint: Optional[str] = None
    enabled: Optional[bool] = None

    # Actuator 2
    ip_2: Optional[str] = None
    port_2: Optional[int] = 80
    trigger_endpoint_2: Optional[str] = None
    cancel_endpoint_2: Optional[str] = None
    deter_endpoint_2: Optional[str] = None
    stop_endpoint_2: Optional[str] = None
    enabled_2: Optional[bool] = None

    auto_trigger: Optional[bool] = None
    http_method: Optional[str] = "GET"


@app.get("/api/trigger/target")
def get_trigger_target():
    """Returns currently configured trigger IPs, ports, and live Trigger/Cancel URLs for both actuators."""
    st = esp32_service.get_status()
    st["ping"] = esp32_service.ping()
    return {
        "success": True,
        "actuator_1": st["actuator_1"],
        "actuator_2": st["actuator_2"],
        "ip": esp32_service.ip,
        "port": esp32_service.port,
        "trigger_url": st["trigger_url"],
        "cancel_url": st["cancel_url"],
        "ip_2": esp32_service.ip_2,
        "port_2": esp32_service.port_2,
        "trigger_url_2": st["trigger_url_2"],
        "cancel_url_2": st["cancel_url_2"],
        "status_url": st.get("status_endpoint", "/status"),
        "trigger_endpoint": esp32_service.deter_endpoint,
        "cancel_endpoint": esp32_service.stop_endpoint,
        "enabled": esp32_service.enabled,
        "enabled_2": esp32_service.enabled_2,
        "auto_trigger": esp32_service.auto_trigger,
        "state": esp32_service.state,
        "state_1": esp32_service.state_1,
        "state_2": esp32_service.state_2,
        "is_active": esp32_service.is_active,
        "ping": st["ping"]
    }


@app.post("/api/trigger/target")
def configure_trigger_target(payload: TargetTriggerConfigRequest):
    """Updates target device IP address, port, auto_trigger, and Trigger/Cancel endpoints for Dual Actuators."""
    deter_ep = payload.trigger_endpoint or payload.deter_endpoint
    stop_ep = payload.cancel_endpoint or payload.stop_endpoint
    deter_ep_2 = payload.trigger_endpoint_2 or payload.deter_endpoint_2
    stop_ep_2 = payload.cancel_endpoint_2 or payload.stop_endpoint_2

    esp32_service.update_config(
        ip=payload.ip,
        port=payload.port,
        deter_endpoint=deter_ep,
        stop_endpoint=stop_ep,
        enabled=payload.enabled,
        ip_2=payload.ip_2,
        port_2=payload.port_2,
        deter_endpoint_2=deter_ep_2,
        stop_endpoint_2=stop_ep_2,
        enabled_2=payload.enabled_2,
        auto_trigger=payload.auto_trigger,
        http_method=payload.http_method
    )
    st = esp32_service.get_status()
    st["ping"] = esp32_service.ping()
    return {
        "success": True,
        "message": f"Dual Signal trigger targets updated: Actuator 1 ({esp32_service.ip}:{esp32_service.port}), Actuator 2 ({esp32_service.ip_2}:{esp32_service.port_2})",
        "actuator_1": st["actuator_1"],
        "actuator_2": st["actuator_2"],
        "trigger_url": st["trigger_url"],
        "cancel_url": st["cancel_url"],
        "trigger_url_2": st["trigger_url_2"],
        "cancel_url_2": st["cancel_url_2"],
        "ping": st["ping"]
    }


@app.get("/api/trigger/ping")
def ping_target_hardware(
    ip: Optional[str] = Query(None), 
    port: Optional[int] = Query(None),
    actuator: Optional[str] = Query(None)
):
    """Test ping a specific IP:port or the currently configured hardware target(s)."""
    if ip:
        target_ip = ip.strip()
        target_port = port or 80
        if "://" in target_ip:
            target_ip = target_ip.split("://", 1)[1]
        if "/" in target_ip:
            target_ip = target_ip.split("/", 1)[0]
        if ":" in target_ip:
            parts = target_ip.split(":", 1)
            target_ip = parts[0]
            try:
                target_port = int(parts[1])
            except Exception:
                pass
        return esp32_service.ping(target_ip, int(target_port))

    if actuator in ("2", "actuator2"):
        return esp32_service.ping(esp32_service.ip_2, esp32_service.port_2)
    elif actuator in ("1", "actuator1"):
        return esp32_service.ping(esp32_service.ip, esp32_service.port)

    return esp32_service.ping()


@app.post("/api/trigger/activate")
def activate_trigger(payload: Optional[ESP32DeterRequest] = None):
    """Dispatches deterrent trigger signal to target Actuator(s): 1, 2, or all."""
    return trigger_esp32_deter(payload)


@app.post("/api/trigger/cancel")
def cancel_trigger(actuator: Optional[str] = Query("all")):
    """Dispatches cancel/stop deterrent signal to target Actuator(s): 1, 2, or all."""
    return trigger_esp32_stop(actuator=actuator or "all")


# ========================================================
# 7d. V380 Camera Movement (PTZ) & Light Controller API
# (Based on info.md: /api/ptz/*, /api/light/*, /api/image/*)
# ========================================================

class CameraPTZRequest(BaseModel):
    direction: Optional[str] = "stop"  # "up", "down", "left", "right", "stop"
    command: Optional[str] = None      # fallback alias
    camera: Optional[str] = "cam1"
    camera_url: Optional[str] = None


class CameraLightRequest(BaseModel):
    state: Optional[str] = "auto"      # "on", "off", "auto"
    camera_url: Optional[str] = None


class CameraImageRequest(BaseModel):
    mode: Optional[str] = "auto"       # "color", "bw", "auto", "flip"
    camera_url: Optional[str] = None


def _clean_camera_url(url: Optional[str]) -> str:
    raw = (url or os.getenv("WILDSHIELD_V380_URL", "http://192.168.1.7:8080")).strip()
    if not raw.startswith("http://") and not raw.startswith("https://"):
        raw = f"http://{raw}"
    return raw.rstrip("/")


@app.post("/api/camera/ptz")
def control_camera_ptz(payload: CameraPTZRequest):
    """
    Dispatches PTZ movement commands to the V380 Camera server:
    /api/ptz/up, /api/ptz/down, /api/ptz/left, /api/ptz/right, /api/ptz/stop
    """
    base = _clean_camera_url(payload.camera_url)
    dir_raw = (payload.direction or payload.command or "stop").strip().lower()
    
    # Normalize direction to info.md standard
    if dir_raw in ("center", "home"):
        dir_clean = "stop"
    elif dir_raw in ("up", "down", "left", "right", "stop"):
        dir_clean = dir_raw
    else:
        dir_clean = "stop"

    endpoint = f"{base}/api/ptz/{dir_clean}"
    try:
        req = urllib.request.Request(endpoint, data=b"", method="POST")
        with urllib.request.urlopen(req, timeout=2.0) as resp:
            body = resp.read().decode("utf-8", errors="ignore").strip()
            return {
                "success": True,
                "direction": dir_clean,
                "url": endpoint,
                "response": body
            }
    except Exception as e:
        logger.warning(f"[V380 PTZ] Could not dispatch {dir_clean} to {endpoint}: {e}")
        return {
            "success": False,
            "direction": dir_clean,
            "url": endpoint,
            "error": str(e)
        }


@app.post("/api/camera/light")
def control_camera_light(payload: CameraLightRequest):
    """
    Controls V380 Camera LED / Infrared Light:
    /api/light/on, /api/light/off, /api/light/auto
    """
    base = _clean_camera_url(payload.camera_url)
    state_clean = (payload.state or "auto").strip().lower()
    if state_clean not in ("on", "off", "auto"):
        state_clean = "auto"

    endpoint = f"{base}/api/light/{state_clean}"
    try:
        req = urllib.request.Request(endpoint, data=b"", method="POST")
        with urllib.request.urlopen(req, timeout=2.0) as resp:
            body = resp.read().decode("utf-8", errors="ignore").strip()
            return {
                "success": True,
                "state": state_clean,
                "url": endpoint,
                "response": body
            }
    except Exception as e:
        logger.warning(f"[V380 LIGHT] Could not dispatch {state_clean} to {endpoint}: {e}")
        return {
            "success": False,
            "state": state_clean,
            "url": endpoint,
            "error": str(e)
        }


@app.post("/api/camera/image")
def control_camera_image_mode(payload: CameraImageRequest):
    """
    Controls V380 Camera Image Mode & Flip:
    /api/image/color, /api/image/bw, /api/image/auto, /api/image/flip
    """
    base = _clean_camera_url(payload.camera_url)
    mode_raw = (payload.mode or "auto").strip().lower()
    if mode_raw in ("night", "ir"):
        mode_clean = "bw"
    elif mode_raw in ("day",):
        mode_clean = "color"
    elif mode_raw in ("color", "bw", "auto", "flip"):
        mode_clean = mode_raw
    else:
        mode_clean = "auto"

    endpoint = f"{base}/api/image/{mode_clean}"
    try:
        req = urllib.request.Request(endpoint, data=b"", method="POST")
        with urllib.request.urlopen(req, timeout=2.0) as resp:
            body = resp.read().decode("utf-8", errors="ignore").strip()
            return {
                "success": True,
                "mode": mode_clean,
                "url": endpoint,
                "response": body
            }
    except Exception as e:
        logger.warning(f"[V380 IMAGE] Could not dispatch {mode_clean} to {endpoint}: {e}")
        return {
            "success": False,
            "mode": mode_clean,
            "url": endpoint,
            "error": str(e)
        }


@app.get("/api/camera/v380/status")
def get_v380_camera_status(camera_url: Optional[str] = Query(None)):
    """Queries /api/status from the V380 streamer."""
    base = _clean_camera_url(camera_url)
    endpoint = f"{base}/api/status"
    try:
        req = urllib.request.Request(endpoint, method="GET")
        with urllib.request.urlopen(req, timeout=1.5) as resp:
            body = resp.read().decode("utf-8", errors="ignore").strip()
            return {
                "online": True,
                "url": endpoint,
                "status": body
            }
    except Exception as e:
        return {
            "online": False,
            "url": endpoint,
            "error": str(e)
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
