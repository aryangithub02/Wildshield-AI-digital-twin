# 🛡️ WildShield AI — Digital Twin & Smart Deterrent System

[![FastAPI](https://img.shields.io/badge/FastAPI-0.100+-009688.svg?style=flat&logo=fastapi)](https://fastapi.tiangolo.com/)
[![React](https://img.shields.io/badge/React-18.0+-61DAFB.svg?style=flat&logo=react)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-5.0+-646CFF.svg?style=flat&logo=vite)](https://vitejs.dev/)
[![Neon PostgreSQL](https://img.shields.io/badge/Neon_PostgreSQL-Database-00E599.svg?style=flat&logo=postgresql)](https://neon.tech/)
[![YOLOv11](https://img.shields.io/badge/YOLOv11-Surveillance_AI-FF6F00.svg?style=flat)](https://ultralytics.com/)
[![Vercel](https://img.shields.io/badge/Vercel-Deployed-000000.svg?style=flat&logo=vercel)](https://vercel.com/)

**WILDSHIELD AI** is an intelligent agricultural surveillance and autonomous deterrence platform designed to prevent human-wildlife conflict and crop destruction. Using central Edge AI hubs running custom-trained **YOLOv11** models, **Neon PostgreSQL** persistent relational storage, and real-time **WebSocket** telemetry, WildShield AI detects wildlife intrusions, computes species-specific deterrence matrix actions, and synchronizes real-time state across desktop Web Digital Twins and mobile Expo applications.

---

## 🌟 Key Features

* **🤖 YOLOv11 Edge Computer Vision**:
  - Persistent model loading (`runs/detect/WildShield-Experiments/wildshield_surveillance_v1-2/weights/best.pt`).
  - Supports live webcam streams, uploaded photos, and 54 sample test dataset images.
  - Authoritative 10-class species identification (`Wild Boar`, `Nilgai`, `Spotted Deer`, `Rhesus Macaque`, `Langur`, `Gaur`, `Cattle`, `Goat`, `Human`, `Vehicle`).

* **🐘 Real Event-Driven Intrusion Management Engine**:
  - Automatically generates distinct Event IDs (`WS-EVT-YYYYMMDD-XXXXX`) and Intrusion IDs (`WS-INT-YYYYMMDD-XXXXX`).
  - Active intrusion lifecycle management (`ACTIVE` → `CLEARED` → `CLOSED`).
  - Domestic vs. Wildlife discrimination (avoids alarming on docile cattle or goats).

* **🐘 Neon PostgreSQL Persistent Database**:
  - Fully transactional schema: `farmers`, `farms`, `farm_zones`, `devices`, `detections`, `intrusions`, `prevention_actions`, `notifications`, `analytics_events`.
  - Automatic column migration and persistent state queries (`GET /api/intrusions/active`, `GET /api/analytics`).

* **⚡ Real-Time WebSocket Telemetry**:
  - Low-latency WebSocket hub (`/ws`) broadcasting 13 real-time event types (`INTRUSION_CREATED`, `PREVENTION_ACTIVATED`, `ANIMAL_EXITED`, `PREVENTION_COMPLETED`).
  - Synchronizes Web Digital Twin map overlays and Mobile App push notifications.

* **🔊 Master Deterrent Matrix & Hardware Emulation**:
  - Species-tailored deterrent activation (Ultrasonic Siren, Directional LED Strobe, Predator Roar Speakers, Crop-Aware Sprinklers).
  - Crop Guard logic (e.g. automatically inhibits sprinklers on high-sensitivity Cotton fields).

---

## 🏗️ System Architecture

```mermaid
flowchart TD
    A[Camera Feed / Dataset Image / Mobile] -->|Post Image Frame| B[FastAPI Edge Hub]
    B -->|YOLOv11 Inference| C[Object Detection & BBox]
    C -->|Geofence Verification| D[Intrusion Decision Engine]
    D -->|Write Event & Intrusion| E[(Neon PostgreSQL)]
    D -->|Broadcast WebSocket Events| F[WebSocket Hub]
    F -->|Real-Time Telemetry| G[Web Digital Twin Dashboard]
    F -->|Real-Time Push Alerts| H[React Native / Expo Mobile App]
    D -->|MQTT Actuator Commands| I[ESP32 Deterrent Nodes]
```

---

## 📊 Standard WildShield Identifier Schema

| Species | Code | Category | Threat Level | Primary Deterrent Response |
| :--- | :--- | :--- | :--- | :--- |
| **Wild Boar** | `WS-WL-WB` | Wildlife | `HIGH / CRITICAL` | Ultrasonic Siren + LED Floodlight |
| **Nilgai** | `WS-WL-NG` | Wildlife | `HIGH` | Directional Strobe + Acoustic Alarm |
| **Spotted Deer** | `WS-WL-SD` | Wildlife | `MEDIUM` | Soft Floodlight + Low-Frequency Alarm |
| **Rhesus Macaque** | `WS-WL-RM` | Wildlife | `HIGH` | Smart Sprinkler Pulse + Primate Distress Audio |
| **Langur** | `WS-WL-LG` | Wildlife | `MEDIUM-HIGH` | Overhead Sprinkler + Visual Strobe |
| **Gaur** | `WS-WL-GR` | Wildlife | `CRITICAL` | Non-Contact Strobe + Forest Department Alert |
| **Cattle** | `WS-DM-CT` | Domestic | `LOW (Monitored)` | Water Sprinkler Pulse + Warning Buzzer |
| **Goat** | `WS-DM-GT` | Domestic | `LOW (Monitored)` | Local Warning Beep + App Log |
| **Human** | `WS-HM-HU` | Human | `INHIBITED` | Silent App Alert (Wildlife Deterrents Bypassed) |

---

## 🚀 Quick Start & Local Setup

### 1. Clone & Install Dependencies
```bash
# Clone the repository
git clone https://github.com/aryangithub02/Wildshield-AI-digital-twin.git
cd Wildshield-AI-digital-twin

# Install Web App dependencies
npm install

# Install Python backend dependencies
pip install -r requirements.txt
```

### 2. Configure Environment Variables
Create a `.env` file in the project root:
```env
DATABASE_URL=postgresql://neondb_owner:npg_kyaHfWR0OhD2@ep-floral-resonance-za1ksthg-pooler.c-2.eu-west-2.aws.neon.tech/neondb?sslmode=require
VITE_API_BASE_URL=http://127.0.0.1:8000
VITE_WS_URL=ws://127.0.0.1:8000/ws
```

### 3. Start Backend FastAPI Server
```bash
python -m uvicorn backend.server:app --host 127.0.0.1 --port 8000 --reload
```

### 4. Start Web Digital Twin Dashboard
```bash
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## 🧪 Automated Testing

Execute the end-to-end integration test suite to verify database connectivity, YOLO model loading, active intrusion queries, and clearance lifecycle:

```bash
python test_e2e_integration.py
```

---

## ☁️ Deployment

### Vercel Serverless Function Deployment
This repository is pre-configured for instant **Vercel** serverless deployment:
- [`api/index.py`](file:///c:/Users/lenovo/OneDrive/Desktop/Wildshield%20AI%20digital%20twin/api/index.py): Serverless ASGI handler.
- [`vercel.json`](file:///c:/Users/lenovo/OneDrive/Desktop/Wildshield%20AI%20digital%20twin/vercel.json): Route rewrites for `/api/(.*)` to `@vercel/python` and static Vite output.

```bash
# Deploy to Vercel via CLI
vercel --prod
```

---

## 📚 Documentation & Integration Guides

- 📖 **[Integration Guide](file:///c:/Users/lenovo/OneDrive/Desktop/Wildshield%20AI%20digital%20twin/INTEGRATION_GUIDE.md)**: Full API specification & WebSocket event payload schemas.
- 📖 **[Identifier Specification Report](file:///c:/Users/lenovo/OneDrive/Desktop/Wildshield%20AI%20digital%20twin/WILDSHIELD_ID_SPECIFICATION_REPORT.md)**: Master Deterrent Matrix & species classification guide.
- 📖 **[Deployment Guide](file:///c:/Users/lenovo/OneDrive/Desktop/Wildshield%20AI%20digital%20twin/deployment.md)**: Comprehensive production deployment guide for Vercel, Netlify, and Docker.

---

## 📜 License

Distributed under the MIT License. See `LICENSE` for details.
