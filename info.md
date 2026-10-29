# V380 Camera Control & Stream URLs Reference

This document contains all URLs and API endpoints for video feeds, PTZ movement, light toggles, and color/flip settings for the V380 Camera streamer and decoder server.

---

## 📌 Server Details
- **Local IP (LAN):** `192.168.1.7`
- **Localhost:** `localhost` / `127.0.0.1`
- **HTTP Server Port:** `8080`
- **RTSP Server Port:** `8554`
- **Physical Camera IP:** `192.168.1.13:8800` (Device ID: `124074165`)

---

## 1. 📺 Video Feeds & Streams

| Feature | Protocol / Type | Localhost URL | LAN Network URL | Notes |
| :--- | :--- | :--- | :--- | :--- |
| **Web UI Dashboard** | HTTP (HTML) | `http://localhost:8080` | `http://192.168.1.7:8080` | Interactive web controller with live multi-lens feeds |
| **MJPEG Live Stream** | HTTP (MJPEG) | `http://localhost:8080/mjpeg` | `http://192.168.1.7:8080/mjpeg` | Directly viewable in Chrome/Firefox/Safari, OBS Browser source |
| **RTSP Live Stream** | RTSP (H.264) | `rtsp://localhost:8554/live` | `rtsp://192.168.1.7:8554/live` | Low latency stream for VLC, OBS Media Source, Home Assistant |
| **Snapshot JPEG** | HTTP (Image) | `http://localhost:8080/snapshot` | `http://192.168.1.7:8080/snapshot` | Instant full-resolution static snapshot |
| **ONVIF Service** | HTTP (SOAP) | `http://localhost:8080/onvif/device_service` | `http://192.168.1.7:8080/onvif/device_service` | ONVIF Device Manager / NVR integration |

---

## 2. 🕹️ PTZ Movement Controls

> **Note:** The REST API requires an **HTTP POST** request.

| Action | Direction | Endpoint URL (Localhost) | Endpoint URL (LAN) | Method |
| :--- | :--- | :--- | :--- | :--- |
| **Pan Right** | Right (➡️) | `http://localhost:8080/api/ptz/right` | `http://192.168.1.7:8080/api/ptz/right` | `POST` |
| **Pan Left** | Left (⬅️) | `http://localhost:8080/api/ptz/left` | `http://192.168.1.7:8080/api/ptz/left` | `POST` |
| **Tilt Up** | Up (⬆️) | `http://localhost:8080/api/ptz/up` | `http://192.168.1.7:8080/api/ptz/up` | `POST` |
| **Tilt Down** | Down (⬇️) | `http://localhost:8080/api/ptz/down` | `http://192.168.1.7:8080/api/ptz/down` | `POST` |
| **Stop Move** | Stop (⏹️) | `http://localhost:8080/api/ptz/stop` | `http://192.168.1.7:8080/api/ptz/stop` | `POST` |

---

## 3. 💡 Light Controls (LED / Infrared)

| Action | State | Endpoint URL (Localhost) | Endpoint URL (LAN) | Method |
| :--- | :--- | :--- | :--- | :--- |
| **Light ON** | Force On | `http://localhost:8080/api/light/on` | `http://192.168.1.7:8080/api/light/on` | `POST` |
| **Light OFF** | Force Off | `http://localhost:8080/api/light/off` | `http://192.168.1.7:8080/api/light/off` | `POST` |
| **Light Auto** | Auto Mode | `http://localhost:8080/api/light/auto` | `http://192.168.1.7:8080/api/light/auto` | `POST` |

---

## 4. 🎨 Color & Image Mode (Day / Night / Flip)

| Action | Mode | Endpoint URL (Localhost) | Endpoint URL (LAN) | Method |
| :--- | :--- | :--- | :--- | :--- |
| **Color (Day)** | Full Color Day Mode | `http://localhost:8080/api/image/color` | `http://192.168.1.7:8080/api/image/color` | `POST` |
| **B&W (Night)** | Black & White IR Mode | `http://localhost:8080/api/image/bw` | `http://192.168.1.7:8080/api/image/bw` | `POST` |
| **Auto Color/IR** | Automatic Day / Night | `http://localhost:8080/api/image/auto` | `http://192.168.1.7:8080/api/image/auto` | `POST` |
| **Flip Image** | Rotate / Flip 180° | `http://localhost:8080/api/image/flip` | `http://192.168.1.7:8080/api/image/flip` | `POST` |

---

## 5. ℹ️ System Status

| Action | Endpoint URL (Localhost) | Endpoint URL (LAN) | Method |
| :--- | :--- | :--- | :--- |
| **Check Status** | `http://localhost:8080/api/status` | `http://192.168.1.7:8080/api/status` | `GET` |

---

## 6. 💻 Ready-to-Use Command Snippets

### cURL Commands

```bash
# PTZ Movement
curl -X POST http://localhost:8080/api/ptz/up
curl -X POST http://localhost:8080/api/ptz/down
curl -X POST http://localhost:8080/api/ptz/left
curl -X POST http://localhost:8080/api/ptz/right
curl -X POST http://localhost:8080/api/ptz/stop

# Light Controls
curl -X POST http://localhost:8080/api/light/on
curl -X POST http://localhost:8080/api/light/off
curl -X POST http://localhost:8080/api/light/auto

# Color & Flip Controls
curl -X POST http://localhost:8080/api/image/color
curl -X POST http://localhost:8080/api/image/bw
curl -X POST http://localhost:8080/api/image/auto
curl -X POST http://localhost:8080/api/image/flip

# Status
curl http://localhost:8080/api/status
```

### PowerShell Commands

```powershell
# PTZ Movement
Invoke-RestMethod -Uri "http://localhost:8080/api/ptz/up" -Method Post
Invoke-RestMethod -Uri "http://localhost:8080/api/ptz/down" -Method Post
Invoke-RestMethod -Uri "http://localhost:8080/api/ptz/left" -Method Post
Invoke-RestMethod -Uri "http://localhost:8080/api/ptz/right" -Method Post
Invoke-RestMethod -Uri "http://localhost:8080/api/ptz/stop" -Method Post

# Light Controls
Invoke-RestMethod -Uri "http://localhost:8080/api/light/on" -Method Post
Invoke-RestMethod -Uri "http://localhost:8080/api/light/off" -Method Post
Invoke-RestMethod -Uri "http://localhost:8080/api/light/auto" -Method Post

# Color & Flip Controls
Invoke-RestMethod -Uri "http://localhost:8080/api/image/color" -Method Post
Invoke-RestMethod -Uri "http://localhost:8080/api/image/bw" -Method Post
Invoke-RestMethod -Uri "http://localhost:8080/api/image/auto" -Method Post
Invoke-RestMethod -Uri "http://localhost:8080/api/image/flip" -Method Post
```

### JavaScript / Browser Console

```javascript
// Function to send command
const sendCmd = (path) => fetch(`http://localhost:8080${path}`, { method: 'POST' });

// Examples:
sendCmd('/api/ptz/right'); // Pan right
sendCmd('/api/ptz/up');    // Tilt up
sendCmd('/api/ptz/stop');  // Stop movement
sendCmd('/api/light/on');  // Turn light on
sendCmd('/api/image/flip');// Flip image 180
```

---

## 7. 🔗 Integration Notes
- **OBS Studio:** Add a **Media Source** with URL `rtsp://127.0.0.1:8554/live` (uncheck "Local File"), or add a **Browser Source** with `http://127.0.0.1:8080/mjpeg`.
- **Home Assistant / Stream Deck:** Bind buttons to HTTP POST requests to control PTZ, toggle the light, and switch between color and night modes.
