# WildShield AI — Complete API Documentation & Full-Stack Sync Guide
**Connecting FastAPI Backend, Web Digital Twin & Mobile App (React Native / Expo)**

---

## 1. System Architecture: Single Source of Truth

```
                           +-----------------------------------------------+
                           |          WildShield AI FastAPI Server         |
                           |       Host: 0.0.0.0:8000  (Edge PC / Hub)     |
                           |   YOLOv11 Tensor Engine (best.pt) + In-Memory |
                           +-----------------------------------------------+
                                    │                             ▲
           ┌────────────────────────┴─────────────────────────────┴────────────────────────┐
           │ Real-Time WebSocket (/ws)                            │ REST APIs (/api/*)     |
           ▼                                                      ▼                        ▼
+-----------------------+                              +-----------------------+  +-----------------------+
|    Web Digital Twin   |                              |   Mobile App (Expo)   |  |   Perimeter IoT Nodes |
| (React + Vite + Map)  |                              |  (Farmer Handheld)    |  |  (ESP32 / Camera / PIR|
+-----------------------+                              +-----------------------+  +-----------------------+
```

When an animal is detected (or simulated):
1. **Backend** processes YOLO inference via `process_pil_inference()`.
2. **Backend Broadcasts** JSON event to all connected Web & Mobile clients via **WebSocket (`ws://<SERVER_IP>:8000/ws`)**.
3. **Web Digital Twin** updates its 2D/3D Map, AI Decision Engine, and Threat Analysis.
4. **Mobile App** updates its Live Feed, triggers high-priority audio alarm, updates the Behavior card, and displays the camera frame with bounding boxes.

---

## 2. API Endpoints Reference

### 2.1 Server Status & Health
* **Method & URL:** `GET /api/status`
* **Purpose:** Checks if the YOLO model is loaded, reports active classes and hardware device (CPU/CUDA).
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

---

### 2.2 Live Image Inference
* **Method & URL:** `POST /api/detect`
* **Content-Type:** `multipart/form-data`
* **Form Fields:**
  * `file`: Image binary (JPEG / PNG)
  * `conf`: `0.25` to `0.90` (Optional, default `0.25`)
  * `node_id`: `1` to `5` (Optional, default `1`)
* **Response (200 OK):**
```json
{
  "event_id": "WS-EVT-892014",
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
  "detections": [
    {
      "class": "Wild Boar",
      "code": "WS-WL-WB",
      "emoji": "🐗",
      "confidence_pct": 95.5,
      "bbox": [12, 18, 274, 168],
      "threat": "HIGH"
    }
  ],
  "annotated_image": "data:image/jpeg;base64,/9j/4AAQSkZJRg..."
}
```

---

### 2.3 Test Dataset Simulation Inference
* **Method & URL:** `POST /api/test-detect`
* **Content-Type:** `application/json`
* **Payload:**
```json
{
  "filename": "WS-WL-WB-00006.jpg",
  "conf": 0.25,
  "node_id": 1
}
```
* **Response (200 OK):** Returns the exact detection payload above with `source_file: "WS-WL-WB-00006.jpg"`.

---

### 2.4 Available Dataset Images List
* **Method & URL:** `GET /api/test-images`
* **Response (200 OK):**
```json
{
  "count": 54,
  "images": [
    { "filename": "WS-WL-WB-00006.jpg", "url": "/static-test-images/WS-WL-WB-00006.jpg" },
    { "filename": "WS-WL-NG-00016.jpg", "url": "/static-test-images/WS-WL-NG-00016.jpg" },
    { "filename": "WS-WL-SD-00106.jpg", "url": "/static-test-images/WS-WL-SD-00106.jpg" },
    { "filename": "WS-DM-CT-00023.jpg", "url": "/static-test-images/WS-DM-CT-00023.jpg" },
    { "filename": "WS-DM-GT-00053.jpg", "url": "/static-test-images/WS-DM-GT-00053.jpg" }
  ]
}
```

---

### 2.5 Historical Incident Events Stream
* **Method & URL:** `GET /api/events`
* **Response (200 OK):**
```json
{
  "count": 12,
  "events": [
    {
      "event_id": "WS-EVT-892014",
      "species": "Wild Boar",
      "code": "WS-WL-WB",
      "threat": "HIGH",
      "confidence": 95.5,
      "time": "10:23:15 PM",
      "location": "North Field",
      "camera": "FN-1",
      "intrusion": true,
      "action": "Siren + LED Floodlight",
      "responses": ["Siren + LED Floodlight", "Predator Roar Audio"]
    }
  ]
}
```

---

### 2.6 Remote Actuator Trigger / Override
* **Method & URL:** `POST /api/trigger-response`
* **Content-Type:** `application/json`
* **Payload:**
```json
{
  "detection_id": "WS-EVT-892014",
  "species": "Wild Boar",
  "mode": "MANUAL",
  "actuators": {
    "siren": true,
    "floodlight": true,
    "speaker": true,
    "sprinkler": false
  }
}
```

---

### 2.7 Real-Time WebSocket Protocol
* **WebSocket URL:** `ws://<SERVER_IP>:8000/ws`
* **Broadcast Message Format (Sent automatically on every detection):**
```json
{
  "type": "DETECTION_EVENT",
  "data": {
    "event_id": "WS-EVT-892014",
    "camera_id": "FN-1",
    "node_name": "Farmer Node 1",
    "time_formatted": "10:23:15 PM",
    "primary_detection": {
      "class": "Wild Boar",
      "code": "WS-WL-WB",
      "emoji": "🐗",
      "confidence_pct": 95.5,
      "threat": "HIGH",
      "intrusion": true,
      "responses": ["Siren + LED Floodlight"]
    },
    "annotated_image": "data:image/jpeg;base64,..."
  }
}
```

---

## 3. How to Connect the Mobile App (`WildShieldAI App`)

### Step 1: Find Your Computer's Local IP Address
Open PowerShell and run:
```powershell
ipconfig
```
Look for **IPv4 Address** (for example: `192.168.1.15` or `10.0.0.5`).

> ⚠️ **Important for Mobile:**
> * On an **Android Emulator**: Use `http://10.0.2.2:8000` or your LAN IP `http://192.168.x.x:8000`.
> * On a **Physical Phone (Expo Go)**: Your phone and PC must be on the **same Wi-Fi**. Use `http://192.168.x.x:8000`.
> * Do **NOT** use `localhost` inside the mobile app because `localhost` refers to the mobile phone itself!

---

### Step 2: Create `src/services/api.ts` in your Mobile App
In your `WildShieldAI App` project, create `src/services/api.ts`:

```typescript
// c:\Users\lenovo\OneDrive\Desktop\WildShieldAI App\src\services\api.ts

// Replace with your PC's IP address (run `ipconfig` to find it)
export const SERVER_IP = "192.168.1.15"; // e.g. 192.168.1.15
export const API_BASE_URL = `http://${SERVER_IP}:8000`;
export const WS_BASE_URL = `ws://${SERVER_IP}:8000/ws`;

export interface DetectionEvent {
  event_id: string;
  camera_id: string;
  node_name: string;
  time_formatted: string;
  primary_detection: {
    class: string;
    code: string;
    emoji: string;
    confidence_pct: number;
    threat: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
    intrusion: boolean;
    responses: string[];
    actuators: {
      siren: boolean;
      floodlight: boolean;
      speaker: boolean;
      sprinkler: boolean;
    };
  };
  annotated_image?: string;
}

// 1. Fetch backend health
export async function getBackendStatus() {
  try {
    const res = await fetch(`${API_BASE_URL}/api/status`);
    return await res.json();
  } catch (error) {
    console.warn("Backend offline:", error);
    return null;
  }
}

// 2. Fetch history events
export async function getEvents() {
  try {
    const res = await fetch(`${API_BASE_URL}/api/events`);
    const data = await res.json();
    return data.events || [];
  } catch (error) {
    console.warn("Failed to fetch events:", error);
    return [];
  }
}

// 3. Trigger manual test dataset detection
export async function testDetect(filename: string, nodeId: number = 1) {
  const res = await fetch(`${API_BASE_URL}/api/test-detect`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ filename, conf: 0.25, node_id: nodeId }),
  });
  return await res.json();
}

// 4. Trigger Actuator
export async function triggerActuator(species: string, actuators: any) {
  const res = await fetch(`${API_BASE_URL}/api/trigger-response`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      species,
      mode: "MANUAL",
      actuators,
    }),
  });
  return await res.json();
}
```

---

### Step 3: Create `src/hooks/useWildShieldLiveSync.ts` for Instant Sync

```typescript
// c:\Users\lenovo\OneDrive\Desktop\WildShieldAI App\src\hooks\useWildShieldLiveSync.ts
import { useState, useEffect, useRef } from 'react';
import { WS_BASE_URL, getEvents, DetectionEvent } from '../services/api';

export function useWildShieldLiveSync() {
  const [latestEvent, setLatestEvent] = useState<DetectionEvent | null>(null);
  const [eventHistory, setEventHistory] = useState<any[]>([]);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    // 1. Initial load of history
    getEvents().then(setEventHistory);

    // 2. Open WebSocket connection
    function connect() {
      const ws = new WebSocket(WS_BASE_URL);
      wsRef.current = ws;

      ws.onopen = () => {
        console.log("🟢 Connected to WildShield WebSocket");
        setIsConnected(true);
      };

      ws.onmessage = (e) => {
        try {
          const payload = JSON.parse(e.data);
          if (payload.type === "DETECTION_EVENT") {
            const newEvent: DetectionEvent = payload.data;
            setLatestEvent(newEvent);
            setEventHistory((prev) => [newEvent, ...prev]);
          }
        } catch (err) {
          console.error("WS parse error:", err);
        }
      };

      ws.onerror = (err) => {
        console.warn("WS error:", err);
        setIsConnected(false);
      };

      ws.onclose = () => {
        console.log("🔴 Disconnected from WS. Reconnecting in 3s...");
        setIsConnected(false);
        setTimeout(connect, 3000);
      };
    }

    connect();

    return () => {
      if (wsRef.current) wsRef.current.close();
    };
  }, []);

  return { latestEvent, eventHistory, isConnected };
}
```

---

### Step 4: Use in `AlertsScreen.tsx` (or `HomeScreen.tsx`)

In your mobile app screen, simply use the hook:

```tsx
import React from 'react';
import { View, Text, Image, StyleSheet, ScrollView } from 'react-native';
import { useWildShieldLiveSync } from '../hooks/useWildShieldLiveSync';

export default function AlertsScreen() {
  const { latestEvent, isConnected, eventHistory } = useWildShieldLiveSync();

  return (
    <ScrollView style={styles.container}>
      {/* Connection Banner */}
      <View style={[styles.badge, { backgroundColor: isConnected ? '#166534' : '#991b1b' }]}>
        <Text style={styles.badgeText}>
          {isConnected ? "🟢 LIVE BACKEND SYNCED" : "🔴 OFFLINE / RECONNECTING"}
        </Text>
      </View>

      {/* Latest Live Detection Card */}
      {latestEvent ? (
        <View style={styles.card}>
          <Text style={styles.title}>
            {latestEvent.primary_detection.emoji} {latestEvent.primary_detection.class}
          </Text>
          <Text style={styles.subtitle}>
            Code: {latestEvent.primary_detection.code} • {latestEvent.primary_detection.confidence_pct}% Confidence
          </Text>
          <Text style={styles.detail}>Camera: {latestEvent.camera_id} • {latestEvent.time_formatted}</Text>

          {latestEvent.annotated_image && (
            <Image 
              source={{ uri: latestEvent.annotated_image }} 
              style={styles.image} 
              resizeMode="cover"
            />
          )}

          <Text style={styles.action}>
            Action: {latestEvent.primary_detection.responses.join(', ')}
          </Text>
        </View>
      ) : (
        <Text style={styles.waiting}>Waiting for live wildlife intrusion...</Text>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#020617', padding: 16 },
  badge: { padding: 8, borderRadius: 8, alignItems: 'center', marginBottom: 16 },
  badgeText: { color: '#ffffff', fontWeight: 'bold', fontSize: 12 },
  card: { backgroundColor: '#0b0f19', padding: 16, borderRadius: 12, borderWidth: 1, borderColor: '#1e293b' },
  title: { fontSize: 18, fontWeight: 'bold', color: '#f8fafc' },
  subtitle: { fontSize: 13, color: '#22c55e', marginTop: 4 },
  detail: { fontSize: 12, color: '#94a3b8', marginTop: 2 },
  image: { width: '100%', height: 200, borderRadius: 8, marginTop: 12 },
  action: { fontSize: 12, color: '#fbbf24', marginTop: 10, fontWeight: 'bold' },
  waiting: { color: '#64748b', textAlign: 'center', marginTop: 40 }
});
```
