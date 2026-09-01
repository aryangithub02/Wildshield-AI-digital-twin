# 🛡️ WildShield AI — Digital Twin & Smart Deterrent System

[![FastAPI](https://img.shields.io/badge/FastAPI-0.100+-009688.svg?style=flat&logo=fastapi)](https://fastapi.tiangolo.com/)
[![React](https://img.shields.io/badge/React-18.0+-61DAFB.svg?style=flat&logo=react)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-5.0+-646CFF.svg?style=flat&logo=vite)](https://vitejs.dev/)
[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-3ECF8E.svg?style=flat&logo=supabase)](https://supabase.com/)
[![Neon](https://img.shields.io/badge/Neon-PostgreSQL-00E599.svg?style=flat&logo=postgresql)](https://neon.tech/)
[![YOLOv11](https://img.shields.io/badge/YOLOv11-Edge_AI-FF6F00.svg?style=flat)](https://ultralytics.com/)
[![Expo](https://img.shields.io/badge/Expo-React_Native-000020.svg?style=flat&logo=expo)](https://expo.dev/)

**WildShield AI** is an intelligent agricultural surveillance and autonomous deterrence digital twin platform engineered to prevent human-wildlife conflict and mitigate crop destruction.

It combines custom-trained **YOLOv11 Computer Vision**, a **Hot Database (Neon/PostgreSQL)** + **Permanent Historical Database (Supabase PostgreSQL)** dual storage architecture, low-latency **WebSocket Telemetry**, and real-time synchronization between a **React Web Digital Twin Dashboard** and an **Expo Mobile App**.

---

## 🏗️ Architecture Overview

```
                      Web Digital Twin Dashboard / Expo Mobile App
                                           │
                                  (REST & WebSockets)
                                           ▼
                            FastAPI Orchestrator Hub
                                           │
           ┌───────────────────────────────┴───────────────────────────────┐
           ▼                                                               ▼
Operational Hot PostgreSQL DB                                Permanent Supabase Historical DB
(Neon Cloud / Local Fallback)                               (postgresql://postgres:***@supabase.co)
           │                                                               ▲
           └────────────────── Migration & Sync Worker ────────────────────┘
                                (INSERT → VERIFY → DELETE)
```

---

## ⚡ 1-Click Launch (Windows)

If you are on Windows, simply double-click the included launcher script:
```bash
start_wildshield.bat
```
This launcher automatically opens 3 dedicated terminal windows:
1. **FastAPI Backend Hub** on `http://localhost:8000` (with live reload)
2. **Vite Web Dashboard** on `http://localhost:5173`
3. **Expo Mobile App** Metro bundler (QR code for Expo Go)

---

## 📋 Prerequisites

Before running manually, make sure you have the following installed:
- **Python 3.10+** ([Download Python](https://www.python.org/downloads/))
- **Node.js 18+ & npm** ([Download Node.js](https://nodejs.org/))
- **Git** ([Download Git](https://git-scm.com/))
- *(Optional for Mobile App)*: **Expo Go** app on your iOS or Android phone

---

## 🚀 Manual Step-by-Step Installation & Run Guide

### Step 1: Clone the Repository
```bash
git clone https://github.com/aryangithub02/Wildshield-AI-digital-twin.git
cd Wildshield-AI-digital-twin
```

---

### Step 2: Set Up Python Backend & Dependencies
```bash
# Create and activate virtual environment (optional but recommended)
python -m venv venv
# On Windows:
venv\Scripts\activate
# On Linux/macOS:
source venv/bin/activate

# Install Python requirements
pip install -r requirements.txt
```

---

### Step 3: Configure Environment Variables (`.env`)
Create a `.env` file in the root folder (`Wildshield AI digital twin/.env`):

```env
# 1. Hot Operational Database (Neon PostgreSQL or Local PostgreSQL)
POSTGRES_DATABASE_URL=postgresql://neondb_owner:npg_NFQR2KEz9oYT@ep-cold-sound-ax2lq6zu-pooler.c-4.us-east-2.aws.neon.tech/neondb?sslmode=require
DATABASE_URL=postgresql://neondb_owner:npg_NFQR2KEz9oYT@ep-cold-sound-ax2lq6zu-pooler.c-4.us-east-2.aws.neon.tech/neondb?sslmode=require

# 2. Permanent Historical Database (Supabase PostgreSQL)
SUPABASE_DATABASE_URL=postgresql://postgres:Aryan%40DB2310@db.rugvcrvbyopborvkegpf.supabase.co:5432/postgres

# 3. Data Archival & Retention Policy
ARCHIVE_AFTER_DAYS=30

# 4. Frontend & WebSocket Configuration
VITE_API_BASE_URL=http://127.0.0.1:8000
VITE_WS_URL=ws://127.0.0.1:8000/ws
```

> **Note:** If Neon PostgreSQL transfer quota is reached or network is unavailable, the backend automatically falls back to local SQLite (`wildshield.db`) gracefully so your local app never crashes!

---

### Step 4: Seed & Synchronize Databases
Populate initial operational data and synchronize historical tables in Supabase:

```bash
# 1. Seed Hot PostgreSQL with initial devices, zones, and real detection events
python seed_full_database.py

# 2. Transfer and initialize all tables directly in Supabase PostgreSQL
python transfer_all_to_supabase.py
```

---

### Step 5: Start the FastAPI Backend Server
```bash
python -m uvicorn backend.server:app --host 0.0.0.0 --port 8000 --reload
```
- 🌐 **API Base**: `http://localhost:8000`
- 📚 **Interactive Swagger API Docs**: `http://localhost:8000/docs`
- ⚡ **WebSocket Stream**: `ws://localhost:8000/ws`

---

### Step 6: Start the Web Digital Twin Frontend
Open a new terminal window:
```bash
# Install Web App dependencies
npm install

# Start Vite dev server
npm run dev
```
Open **[http://localhost:5173](http://localhost:5173)** in your browser.

---

### Step 7: Start the Expo Mobile App (Optional)
If you have cloned the `WildShieldAI App` mobile companion:
```bash
cd "../WildShieldAI App"
npm install
npx expo start
```
Scan the displayed QR code with your phone camera (iOS) or **Expo Go** app (Android) to open the mobile app on your device.

---

## 🎯 Authoritative Animal Action & Deterrent Matrix

WildShield AI uses a 10-species taxonomy and autonomous deterrence matrix:

| Species | Code | Threat | Recommended Action | Actuator Triggers (`siren`, `floodlight`, `speaker`, `sprinkler`) |
| :--- | :--- | :--- | :--- | :--- |
| **Wild Boar** | `WS-WL-WB` | `HIGH` | Siren + Floodlight | Siren: ON, Floodlight: ON, Speaker: OFF, Sprinkler: OFF |
| **Nilgai** | `WS-WL-NG` | `HIGH` | Floodlight + Siren | Siren: ON, Floodlight: ON, Speaker: OFF, Sprinkler: OFF |
| **Spotted Deer** | `WS-WL-SD` | `MEDIUM` | Floodlight + Mild Alarm | Siren: ON, Floodlight: ON, Speaker: OFF, Sprinkler: OFF |
| **Rhesus Macaque** | `WS-WL-RM` | `HIGH` | Predator Audio + Floodlight | Siren: OFF, Floodlight: ON, Speaker: ON, Sprinkler: OFF |
| **Langur** | `WS-WL-LG` | `MEDIUM` | Predator Audio + Floodlight | Siren: OFF, Floodlight: ON, Speaker: ON, Sprinkler: OFF |
| **Gaur** | `WS-WL-GR` | `CRITICAL` | Siren + Floodlight + Farmer Alert | Siren: ON, Floodlight: ON, Speaker: OFF, Sprinkler: OFF |
| **Cattle** | `WS-DM-CT` | `LOW` | Farmer Notification Only | Siren: OFF, Floodlight: OFF, Speaker: OFF, Sprinkler: OFF |
| **Goat** | `WS-DM-GT` | `LOW` | Farmer Notification Only | Siren: OFF, Floodlight: OFF, Speaker: OFF, Sprinkler: OFF |
| **Human** | `WS-SEC-HM` | `CRITICAL` | Emergency Farmer Alert + Floodlight | Siren: OFF, Floodlight: ON, Speaker: OFF, Sprinkler: OFF |
| **Vehicle** | `WS-SEC-VE` | `MEDIUM` | Warning + Farmer Alert | Siren: ON, Floodlight: ON, Speaker: OFF, Sprinkler: OFF |

---

## 📡 REST API & Telemetry Endpoints

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/events` | Unified real-time & historical events list |
| `GET` | `/api/events/current` | Hot Database operational detection events |
| `GET` | `/api/events/history` | Supabase permanent historical events (paginated & filtered) |
| `GET` | `/api/intrusions/active` | Active perimeter geofence intrusions |
| `POST` | `/api/intrusions/{id}/clear` | Mark intrusion as cleared when animal exits |
| `GET` | `/api/analytics` | Real-time analytics, threat counts, species breakdown |
| `GET` | `/api/analytics/history` | Supabase permanent historical analytics summary |
| `GET` | `/api/prevention/history` | Supabase historical hardware actuator activations |
| `GET` | `/api/notifications/history` | Historical farmer alert notifications log |
| `GET` | `/api/storage/status` | Live metrics for Hot DB vs. Supabase Historical DB |
| `POST` | `/api/storage/migrate` | Trigger background migration worker cycle |
| `POST` | `/api/test-detect` | Run YOLO inference on dataset test sample |
| `WS` | `/ws` | Real-time WebSocket connection for live telemetry |

---

## 🧪 Testing & Verification

Run automated test scripts to verify end-to-end database, AI, and migration pipelines:

```bash
# Test Supabase connection, schema & migration worker idempotency
python test_supabase_migration.py

# Test full end-to-end integration (FastAPI + YOLO + WebSockets + DB)
python test_e2e_integration.py
```

---

## 🛠️ Troubleshooting & FAQ

1. **Port 8000 already in use**:
   - Change the port in your launch command: `python -m uvicorn backend.server:app --port 8080 --reload` and update `VITE_API_BASE_URL` in `.env`.
2. **Mobile app cannot connect to backend**:
   - Ensure your phone and computer are on the **same Wi-Fi network**.
   - In `WildShieldAI App/src/services/api.ts`, replace `127.0.0.1` or `localhost` with your computer's local IP address (e.g., `192.168.1.X` or `10.15.54.X`).
3. **Database connection issues**:
   - If Supabase or Neon passwords contain special characters such as `@`, ensure they are percent-encoded (`@` → `%40`) in `.env`.

---

## 📜 License
Distributed under the MIT License. Built with ❤️ for Wildlife Conservation and Farmer Safety.
