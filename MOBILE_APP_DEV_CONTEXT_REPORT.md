# WildShield AI — Mobile App Development Context & Architecture Report
**Document Version:** 1.0.0  
**Target Audience:** Mobile App Engineers (Flutter / React Native / Kotlin / Swift), Backend Integrators, UX/UI Designers  
**Project Repository:** `Wildshield-AI-digital-twin`  
**System Status:** Production Ready / Edge YOLOv11 Tensor Integrated  

---

## 1. Executive Summary & Problem Context

### 1.1 What is WildShield AI?
**WildShield AI** is an autonomous, non-lethal wildlife intrusion detection, digital twin monitoring, and smart deterrent system designed to mitigate Human-Wildlife Conflict (HWC) and crop destruction in agricultural buffer zones adjoining wildlife sanctuaries and forest fringes.

### 1.2 The Edge & Cloud Ecosystem
* **Field Hardware (Perimeter Nodes):** 5 solar-powered Farmer Nodes (`FN-01` to `FN-05`) equipped with PIR motion sensors, dual IR/RGB optical cameras, ESP32 microcontrollers, and LoRa SX1278 (868 MHz) mesh transceivers.
* **Central Edge AI Hub:** NVIDIA Jetson Orin Nano / Edge CPU running real-time YOLOv11 object classification and boundary geofence analytics.
* **Actuators:** Directional LED floodlights, ultrasonic multi-frequency sirens, acoustic predator sound speakers (tiger/leopard roars), overhead water jet sprinklers, and Forest Department dispatches.
* **Companion Mobile App (Your Target Build):** The critical handheld interface for farmers, farm managers, and forest rangers to receive real-time intrusion alarms, inspect camera feeds, review crop harm forecasts, and manually override deterrents.

```
+-----------------------------------------------------------------------------------+
|                            WILDSHIELD SYSTEM ARCHITECTURE                         |
+-----------------------------------------------------------------------------------+
|                                                                                   |
|   [ Perimeter Nodes FN-1..FN-5 ] ---(LoRa SX1278 Mesh)---> [ Central AI Hub ]     |
|   (PIR + Camera + Actuators)                               (Jetson / FastAPI)     |
|                                                                    |              |
|                                                                    v              |
|                 +-------------------------------------------------------+         |
|                 | REST API & WebSocket Server (FastAPI / Port 8000)     |         |
|                 +-------------------------------------------------------+         |
|                                     |                                             |
|                     +---------------+---------------+                             |
|                     |                               |                             |
|                     v                               v                             |
|          [ Web Digital Twin ]            [ MOBILE APPLICATION ]                  |
|          (React + Tailwind)              (Flutter / React Native)                 |
|                                          - Instant Critical Push Alarms          |
|                                          - Real YOLO Live Frame & Bounding Boxes |
|                                          - Farmer-Friendly Behaviour & Damage    |
|                                          - Remote Actuator Control & SMS Fallback|
|                                                                                   |
+-----------------------------------------------------------------------------------+
```

---

## 2. Target Personas & Core User Flows

| Persona | Primary Goal | Critical Mobile Feature Needs |
| :--- | :--- | :--- |
| **Smallholder Farmer** | Protect standing crops from nocturnal raids without endangering own life. | Simple large buttons, local language audio & text (Hindi/Marathi/English), loud alarm override even on DND/Silent, one-tap manual deterrent trigger. |
| **Farm Supervisor / Estate Admin** | Oversee perimeter security across 5–10 camera nodes, check battery levels. | Node health dashboard, crop sensitivity selector (Cotton/Rice/Sugarcane), LoRa mesh connectivity monitor, intrusion history reports. |
| **Forest Department Ranger** | Rapidly detect dangerous megataxa (Gaur, Elephant) before village entry. | Emergency dispatch alerts, GPS vector coordinates, species identification with confidence score, safety caution badges. |

---

## 3. Species Taxonomy, Safety Rules & Deterrent Matrix

The mobile app must strictly implement the following 10-class taxonomy and safety policies aligned with the trained YOLO model (`best.pt`):

| Code | Animal | Scientific Name | Default Threat | Farm Damage Description | Assigned Deterrent Response | Safety Rule |
| :--- | :--- | :--- | :---: | :--- | :--- | :--- |
| **`WS-WL-WB`** | **Wild Boar** | *Sus scrofa* | 🔴 High (92/100) | Rooting tubers, soil excavation, grain consumption & repeat nocturnal raids. | Siren + LED Floodlight + Predator Audio (Tiger Roar) | High flight distance; aggressive if cornered with sounder. |
| **`WS-WL-NG`** | **Nilgai** | *Boselaphus tragocamelus* | 🔴 High (84/100) | Cereal & pulse crop loss, structural trampling, dung fouling. | Directional LED Floodlight + Acoustic Alarm | Peak early morning & late evening feeding windows. |
| **`WS-WL-SD`** | **Spotted Deer** | *Axis axis* | 🟠 Medium (58/100) | Herbaceous young shoot consumption & grazing. | Soft Flash Light + Low-Frequency Sound | **Avoid loud sirens** to prevent panic stampede into farm fences. |
| **`WS-WL-RM`** | **Rhesus Macaque** | *Macaca mulatta* | 🔴 High (82/100) | Orchard fruit plucking, branch breaking, destructive troop raids. | Smart Sprinkler Pulse + Primate Distress Call | Troop raids; high waste-to-consumption ratio. |
| **`WS-WL-LG`** | **Langur** | *Semnopithecus entellus* | 🟠 Med–High (65/100) | Leaf stripping, blossom damage, canopy fruit consumption. | Overhead Sprinkler + Visual Strobe Flash | Retreats into upper tree canopy. |
| **`WS-WL-GR`** | **Gaur** | *Bos gaurus* | 🔴 Very High (98/100) | Massive biomass loss, fence flattening, extreme human life risk. | Non-Contact Strobe + Forest Department Dispatch | ⚠️ **EXTREME SAFETY RISK: Never approach or chase.** |
| **`WS-DM-CT`** | **Cattle** | *Bos taurus/indicus* | 🟡 Medium (28/100) | Casual foliage grazing, boundary path trampling. | Water Sprinkler Pulse + Warning Buzzer | Domestic livestock discrimination: **Sirens inhibited.** |
| **`WS-DM-GT`** | **Goat** | *Capra hircus* | 🟢 Low (20/100) | Seedling browsing & young leaf consumption. | Local Warning Beep + Boundary Check Alert | Domestic control. |
| **`WS-HM-HU`** | **Human** | *Homo sapiens* | ⚠️ Context (15/100) | Farm worker, farmer, or night trespasser. | Telemetry Logging + Silent App Push | 🚨 **CRITICAL SAFETY RULE: Wildlife deterrents strictly INHIBITED.** |
| **`WS-WL-EL`** | **Elephant** | *Elephas maximus* | 🔴 High (96/100) | Sugarcane/Paddy consumption, fence flattening, village risk. | Directional LED Strobe + Forest Department Alert | Inhibit village sirens to prevent panic stampedes. |

---

## 4. Farmer-Friendly Terminology Standard

The mobile application UI must **never** use technical AI/computer vision jargon. Always map backend variables to the farmer-friendly dictionary:

| Technical Variable | Farmer-Friendly Label | Allowed Display Values |
| :--- | :--- | :--- |
| `behavior_mode` | **What It Is Doing:** | `Eating Crops`, `Grazing`, `Moving`, `Resting`, `Moving in Group` |
| `activity_window` | **Usually Active:** | `Night`, `Morning & Evening`, `Day` |
| `crop_damage_risk` | **Possible Crop Damage:** | `Eating Crops`, `Trampling Crops`, `Fruit Damage`, `No Major Damage` |
| `geofence_location` | **Where It Is:** | `Inside Farm (Crop Field)`, `Farm Boundary (Near Entrance)` |
| `threat_score` | **Risk Level:** | `Low` (Green), `Medium` (Amber), `High` (Red), `Very High` (Dark Red) |
| `deterrent_action` | **Action:** | `Watching`, `Warning Activated`, `Deterrent Activated`, `Farmer Alert` |

---

## 5. Backend API & Telemetry Contract

The mobile app connects to the WildShield FastAPI backend (Default: `http://127.0.0.1:8000` or production LAN/Cloud URL).

### 5.1 System Health & Model Status
* **Endpoint:** `GET /api/status`
* **Response (200 OK):**
```json
{
  "status": "online",
  "model_loaded": true,
  "model_path": "runs/detect/WildShield-Experiments/wildshield_surveillance_v1-2/weights/best.pt",
  "classes": {
    "0": "Wild Boar",
    "1": "Nilgai",
    "2": "Spotted Deer",
    "3": "Rhesus Macaque",
    "4": "Langur",
    "5": "Gaur",
    "6": "Cattle",
    "7": "Goat",
    "8": "Human",
    "9": "Vehicle"
  },
  "device": "cpu",
  "version": "1.2.0"
}
```

### 5.2 Live Image Inference (Upload / Camera Trigger)
* **Endpoint:** `POST /api/detect` (Multipart Form)
* **Request:** `file` (Image binary), `conf` (float, default `0.25`), `node_id` (int, 1–5)
* **Response (200 OK):**
```json
{
  "event_id": "WS-EVT-439201",
  "status": "SUCCESS",
  "inference_time_ms": 142.5,
  "camera_id": "FN-1",
  "node_name": "Farmer Node 1",
  "time_formatted": "10:23:15 PM",
  "detection_count": 1,
  "primary_detection": {
    "class": "Wild Boar",
    "code": "WS-WL-WB",
    "emoji": "🐗",
    "confidence_pct": 95.5,
    "bbox": [12, 18, 274, 168],
    "normalized_bbox": [0.04, 0.09, 0.91, 0.84],
    "threat": "HIGH",
    "intrusion": true,
    "responses": ["Siren + LED Floodlight", "Predator Roar Audio"],
    "actuators": {
      "siren": true,
      "floodlight": true,
      "speaker": true,
      "sprinkler": false
    }
  },
  "annotated_image": "data:image/jpeg;base64,/9j/4AAQSkZJRg..."
}
```

### 5.3 Test Dataset Images Feed (Demo / Simulation Mode)
* **Endpoint:** `GET /api/test-images`
* **Response (200 OK):** Array of all 54 test images from `WildShield-Dataset/test/images`.
* **Endpoint:** `POST /api/test-detect`
* **Payload:** `{"filename": "WS-WL-WB-00006.jpg", "conf": 0.25, "node_id": 1}`

### 5.4 Historical Incident Logs
* **Endpoint:** `GET /api/events`
* **Response (200 OK):** Array of past intrusion telemetry entries with timestamp, species, camera node, confidence, and repellent actions taken.

---

## 6. Mobile Application Screen Architecture

```
+-----------------------------------------------------------------------------------+
|                           MOBILE APP SCREEN HIERARCHY                             |
+-----------------------------------------------------------------------------------+
|                                                                                   |
|  [1. Home / Live Feed Screen]                                                     |
|     ├── Live Geofence Map (Nodes FN-1..FN-5 with dynamic status pins)             |
|     ├── Latest Intrusion Alert Hero Card (Live YOLO bounding box photo)           |
|     ├── Farmer-Friendly Behavior & Damage Summary                                 |
|     └── Quick Manual Deterrent Actuation Bar (Siren / Light / Water)              |
|                                                                                   |
|  [2. Full-Screen Critical Alarm Modal]                                            |
|     ├── Triggered automatically on HIGH/CRITICAL intrusion                        |
|     ├── Flashing Red/Amber Visual Banner + Audio Siren (Bypasses DND)             |
|     ├── Species Photo with YOLO Box & Bounding Vector                             |
|     ├── Big Action Buttons: "DEPLOY DETERRENT", "CALL FOREST RANGER", "DISMISS"   |
|                                                                                   |
|  [3. Multi-Node Camera Grid]                                                      |
|     ├── Live 1080p Stream from FN-01 to FN-05                                     |
|     └── Switch between Thermal IR Night Vision & Standard RGB                     |
|                                                                                   |
|  [4. History & Incident Timeline]                                                 |
|     ├── Chronological audit stream with date grouping                             |
|     └── 8-Step Cognitive Decision Tree viewer for every incident                  |
|                                                                                   |
|  [5. Settings & Hardware Health]                                                  |
|     ├── Crop Selection (Cotton - Sprinkler Guard / Rice / Sugarcane)              |
|     ├── Confidence Threshold Slider (20% - 90%, Default: 50%)                     |
|     ├── Node Battery & LoRa Signal Strength (RSSI)                                |
|     └── Language Switcher (English 🇬🇧, हिन्दी 🇮🇳, मराठी 🇮🇳)                        |
|                                                                                   |
+-----------------------------------------------------------------------------------+
```

---

## 7. Critical Technical Requirements for Mobile Dev

### 7.1 High-Priority Push Notifications (FCM / APNs)
* **Critical Alerts Entitlement (iOS) / Notification Channel with Audio Attributes (Android):**
  * High-risk intrusions (`Wild Boar`, `Nilgai`, `Gaur`, `Elephant`) must play an audible alert sound even if the farmer's device is in **Silent Mode** or **Do Not Disturb (DND)**.
  * Push payload must include `event_id`, `species`, `code`, `confidence`, `node_id`, `image_url`, and `threat_level`.

### 7.2 Offline Operation & SMS Fallback
* In remote farmlands with intermittent 4G/5G data:
  * Perimeter nodes continue autonomous local deterrence via ESP32.
  * When cellular data drops, the GSM module on the Central Hub sends an **emergency SMS text message**:
    > *"WildShield Alert: Wild Boar detected at North Field (FN-1). High crop risk. Siren activated at 10:23 PM."*
  * The mobile app must parse incoming SMS messages from the farm's GSM number and populate the local SQLite/WatermelonDB event stream offline.

### 7.3 Multilingual Support (i18n)
All labels, push notifications, and voice prompts must support 3 languages seamlessly:
1. **English (`en`)**
2. **Hindi (`hi` — `हिन्दी`)**
3. **Marathi (`mr` — `मराठी`)**

### 7.4 Crop-Aware Moisture Guard
* If the user has selected **Cotton**, the mobile app must visually show a badge:
  `Cotton Active: Water Sprinklers Disabled to Prevent Boll Rot`.
* If **Rice** or **Vegetables** is selected, water jet sprinklers are fully enabled.

---

## 8. Development Starter Checklist

- [ ] **Step 1:** Clone repo and verify backend runs on `http://localhost:8000` via `python -m uvicorn backend.server:app --port 8000`.
- [ ] **Step 2:** Configure HTTP client in mobile framework with base URL and timeout handling (1500 ms).
- [ ] **Step 3:** Implement WebSocket listener or 3-second polling on `GET /api/status` and `GET /api/events`.
- [ ] **Step 4:** Render Base64 / URL annotated images in the Live Feed card using standard caching (`cached_network_image` / `react-native-fast-image`).
- [ ] **Step 5:** Integrate Google Fonts (`Inter` or `Roboto`) with high-contrast colors matching the dark theme palette (`#020617` background, `#0b0f19` cards, `#22c55e` primary green, `#ef4444` red alert, `#f59e0b` amber caution).
- [ ] **Step 6:** Test complete round-trip flow: Trigger dataset event in backend $\rightarrow$ Receive Push on Mobile $\rightarrow$ Inspect YOLO box $\rightarrow$ Trigger remote deterrent override.
