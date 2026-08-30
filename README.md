# WildShield AI — Digital Twin & Smart Deterrent System

WildShield AI is an intelligent agricultural surveillance and autonomous deterrence platform that prevents human-wildlife conflict and crop damage using edge YOLO AI models and IoT Digital Twin telemetry.

---

## Quick Start

### 1. Start Persistent YOLO Inference Backend
```bash
# Start FastAPI backend (loads runs/detect/WildShield-Experiments/wildshield_surveillance_v1-2/weights/best.pt persistently)
python -m uvicorn backend.server:app --host 127.0.0.1 --port 8000 --reload
```

### 2. Start Frontend Dashboard
```bash
# In a separate terminal
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## Features & Integration

* **YOLOv11 Edge Detection**: Live persistent model loading (`best.pt`) with real-time inference on test images, uploaded photos, and webcam feeds.
* **Standard WildShield Identifier Schema**:
  * `WS-WL-WB` — Wild Boar (Siren + Floodlight)
  * `WS-WL-SD` — Spotted Deer (Floodlight + Alarm)
  * `WS-WL-NG` — Nilgai (Floodlight + Alarm)
  * `WS-DM-CT` — Cattle (Sprinkler / Warning)
  * `WS-DM-GT` — Goat (Warning)
* **Real-time Digital Twin**: Synchronizes `Farm → Camera Node → Detection Zone → Animal → Intrusion → Response`.
* **Telemetry & Actuator Controls**: Safe simulation test modes for ultrasonic sirens, strobes, predator speakers, and sprinkler actuators.
* **Full Documentation**: See [INTEGRATION_GUIDE.md](file:///c:/Users/lenovo/OneDrive/Desktop/Wildshield%20AI%20digital%20twin/INTEGRATION_GUIDE.md) and [WILDSHIELD_ID_SPECIFICATION_REPORT.md](file:///c:/Users/lenovo/OneDrive/Desktop/Wildshield%20AI%20digital%20twin/WILDSHIELD_ID_SPECIFICATION_REPORT.md).
