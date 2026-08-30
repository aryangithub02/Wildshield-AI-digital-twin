# WildShield AI — Edge Inference API Documentation
**Document Version:** 1.0.0  
**Base URL:** `http://127.0.0.1:8000` (or `http://localhost:8000`)  
**Specification Standard:** Conforms to `WILDSHIELD_ID_SPECIFICATION_REPORT.md`  
**Model:** YOLOv11 Surveillance v1.2 (`runs/detect/WildShield-Experiments/wildshield_surveillance_v1-2/weights/best.pt`)

---

## 1. Overview & Architecture

The WildShield AI Edge Inference API provides persistent, low-latency wildlife detection, bounding box extraction, telemetry formatting, and autonomous threat-escalation protocols for agricultural surveillance and digital twin tracking.

### Interactive OpenAPI / Swagger UI
* **Swagger UI:** [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)
* **ReDoc UI:** [http://127.0.0.1:8000/redoc](http://127.0.0.1:8000/redoc)
* **OpenAPI JSON Spec:** [http://127.0.0.1:8000/openapi.json](http://127.0.0.1:8000/openapi.json)

---

## 2. Master WildShield Taxonomy & Response Matrix

| Class ID | Species / Entity | WildShield Code | Domain | Default Threat | Intrusion | Automated Response Protocol |
| :---: | :--- | :---: | :---: | :---: | :---: | :--- |
| `0` | **Wild Boar** | `WS-WL-WB` | Wildlife | `HIGH` / `CRITICAL` | `true` | **Siren + Floodlight + Speaker** |
| `1` | **Nilgai** (Blue Bull) | `WS-WL-NG` | Wildlife | `MEDIUM` | `true` | **Floodlight + Alarm** |
| `2` | **Spotted Deer** (Chital) | `WS-WL-SD` | Wildlife | `MEDIUM` | `true` | **Floodlight + Alarm** |
| `3` | **Rhesus Macaque** | `WS-WL-RM` | Wildlife | `LOW` | `true` | **Sprinkler / Warning** |
| `4` | **Gray Langur** | `WS-WL-LG` | Wildlife | `LOW` | `true` | **Sprinkler / Warning** |
| `5` | **Gaur** (Indian Bison) | `WS-WL-GR` | Wildlife | `CRITICAL` | `true` | **Siren + Floodlight** |
| `6` | **Cattle** (Cow / Ox) | `WS-DM-CT` | Domestic | `LOW` | `false` | **Sprinkler / Warning Buzzer** |
| `7` | **Goat** / Sheep | `WS-DM-GT` | Domestic | `LOW` | `false` | **Warning Beep** |
| `8` | **Human** | `WS-HM-HM` | Human | `ALERT` | `false` | **Security Alert** |
| `9` | **Vehicle** | `WS-VH-VH` | Vehicle | `NEUTRAL` | `false` | **Log Only** |

---

## 3. Endpoints Reference

### 3.1 Health & Engine Status
Check system status, active inference device (CPU/CUDA), persistent model weights path, and registered class mapping.

* **Endpoint:** `GET /api/status`
* **Content-Type:** `application/json`

#### Response Example (`200 OK`):
```json
{
  "status": "online",
  "model_loaded": true,
  "weights_path": "C:\\Users\\lenovo\\OneDrive\\Desktop\\Wildshield AI digital twin\\runs\\detect\\WildShield-Experiments\\wildshield_surveillance_v1-2\\weights\\best.pt",
  "device": "cpu",
  "cuda_available": false,
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
  "test_images_count": 53,
  "total_detections_recorded": 12
}
```

#### cURL Example:
```bash
curl -X GET "http://127.0.0.1:8000/api/status"
```

---

### 3.2 Test Dataset Inference
Execute YOLO model inference on any pre-loaded unseen test image stored in `WildShield-Dataset/test/images/`.

* **Endpoint:** `POST /api/test-detect`
* **Content-Type:** `application/json`

#### Request Body:
```json
{
  "filename": "WS-WL-WB-00004.jpg",
  "conf": 0.25,
  "node_id": 1
}
```

#### Parameters:
| Field | Type | Required | Default | Description |
| :--- | :--- | :---: | :---: | :--- |
| `filename` | `string` | **Yes** | — | Name of test image file in `WildShield-Dataset/test/images/` |
| `conf` | `float` | No | `0.25` | Confidence threshold (0.0 to 1.0) |
| `node_id` | `integer` | No | `1` | Farmer Node ID (1: FN-1 North, 2: FN-2 East, 3: FN-3 South-East, 4: FN-4 South-West, 5: FN-5 West) |

#### Response Example (`200 OK`):
```json
{
  "event_id": "WS-EVT-48192",
  "timestamp": "2026-08-29T19:14:09Z",
  "time_formatted": "07:14:09 PM",
  "camera_id": "FN-1",
  "node_name": "North Field",
  "inference_time_ms": 142.5,
  "detection_count": 1,
  "intrusion": true,
  "max_threat": "HIGH",
  "primary_detection": {
    "detection_id": "WS-EVT-48192-01",
    "class": "Wild Boar",
    "code": "WS-WL-WB",
    "domain": "Wildlife",
    "scientific_name": "Sus scrofa",
    "emoji": "🐗",
    "confidence": 0.542,
    "confidence_pct": 54.2,
    "threat": "HIGH",
    "risk_level": "CRITICAL",
    "intrusion": true,
    "responses": ["Siren", "Floodlight"],
    "actuators": {
      "siren": true,
      "floodlight": true,
      "speaker": true,
      "sprinkler": false
    },
    "description": "Wild Boar breach detected. High risk of crop damage.",
    "bbox": [120.5, 80.0, 420.2, 360.8],
    "normalized_bbox": [0.1883, 0.1250, 0.6565, 0.5637],
    "camera_id": "FN-1",
    "node_name": "North Field",
    "timestamp": "2026-08-29T19:14:09.123456",
    "time_formatted": "07:14:09 PM",
    "date_formatted": "29 Aug 2026"
  },
  "detections": [
    {
      "detection_id": "WS-EVT-48192-01",
      "class": "Wild Boar",
      "code": "WS-WL-WB",
      "confidence": 0.542,
      "confidence_pct": 54.2,
      "threat": "HIGH",
      "intrusion": true,
      "bbox": [120.5, 80.0, 420.2, 360.8],
      "normalized_bbox": [0.1883, 0.1250, 0.6565, 0.5637]
    }
  ],
  "annotated_image": "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQ...",
  "source_file": "WS-WL-WB-00004.jpg"
}
```

#### cURL Example:
```bash
curl -X POST "http://127.0.0.1:8000/api/test-detect" \
  -H "Content-Type: application/json" \
  -d '{"filename": "WS-WL-WB-00004.jpg", "conf": 0.25, "node_id": 1}'
```

---

### 3.3 List Test Images
Retrieve the catalogue of unseen test dataset images with metadata and species hints.

* **Endpoint:** `GET /api/test-images`
* **Content-Type:** `application/json`

#### Response Example (`200 OK`):
```json
{
  "count": 53,
  "images": [
    {
      "filename": "WS-DM-CT-00007.jpg",
      "code": "WS-DM-CT",
      "species_hint": "Cattle",
      "url": "/static-test-images/WS-DM-CT-00007.jpg",
      "size_kb": 176.6
    },
    {
      "filename": "WS-WL-WB-00004.jpg",
      "code": "WS-WL-WB",
      "species_hint": "Wild Boar",
      "url": "/static-test-images/WS-WL-WB-00004.jpg",
      "size_kb": 1682.6
    }
  ]
}
```

---

### 3.4 Uploaded Image Inference
Send a raw image file via multipart form-data.

* **Endpoint:** `POST /api/detect`
* **Content-Type:** `multipart/form-data`

#### Form Parameters:
| Parameter | Type | Required | Description |
| :--- | :--- | :---: | :--- |
| `file` | `binary` | **Yes** | Image binary (JPEG, PNG, WebP) |
| `conf` | `float` | No (Default `0.25`) | Confidence threshold |
| `node_id` | `integer` | No (Default `1`) | Farmer Node ID (1 to 5) |

#### cURL Example:
```bash
curl -X POST "http://127.0.0.1:8000/api/detect" \
  -F "file=@/path/to/surveillance_photo.jpg" \
  -F "conf=0.25" \
  -F "node_id=1"
```

---

### 3.5 Webcam / Base64 Frame Inference
Send a captured camera frame as a base64 encoded string.

* **Endpoint:** `POST /api/detect-frame`
* **Content-Type:** `application/json`

#### Request Body:
```json
{
  "image": "data:image/jpeg;base64,/9j/4AAQSkZJRg...",
  "conf": 0.25,
  "node_id": 1
}
```

#### cURL Example:
```bash
curl -X POST "http://127.0.0.1:8000/api/detect-frame" \
  -H "Content-Type: application/json" \
  -d '{"image": "data:image/jpeg;base64,/9j/4AA...", "conf": 0.25, "node_id": 1}'
```

---

### 3.6 Event Telemetry History
Fetch recent recorded detection and intrusion events.

* **Endpoint:** `GET /api/events`
* **Content-Type:** `application/json`

#### Response Example (`200 OK`):
```json
{
  "count": 3,
  "events": [
    {
      "event_id": "WS-EVT-48192",
      "species": "Wild Boar",
      "code": "WS-WL-WB",
      "threat": "HIGH",
      "confidence": 54.2,
      "time": "07:14:09 PM",
      "location": "North Field",
      "camera_id": "FN-1",
      "intrusion": true,
      "response": ["Siren", "Floodlight"]
    }
  ]
}
```

---

### 3.7 Modular Hardware Deterrent Trigger (Simulation & Safety Test Mode)
Simulate or trigger hardware actuator response protocols.

* **Endpoint:** `POST /api/trigger-response`
* **Content-Type:** `application/json`

#### Request Body:
```json
{
  "detection_id": "WS-EVT-48192",
  "species": "Wild Boar",
  "actuators": {
    "siren": true,
    "floodlight": true,
    "speaker": true,
    "sprinkler": false
  },
  "mode": "simulation"
}
```

#### Response Example (`200 OK`):
```json
{
  "status": "success",
  "mode": "simulation",
  "detection_id": "WS-EVT-48192",
  "species": "Wild Boar",
  "active_actuators": ["siren", "floodlight", "speaker"],
  "message": "Deterrent protocol engaged for Wild Boar: siren, floodlight, speaker",
  "timestamp": "2026-08-29T19:14:10Z"
}
```

---

## 4. Code Integration Examples

### Python Integration Example
```python
import urllib.request
import json

API_BASE = "http://127.0.0.1:8000"

def run_wildshield_inference(test_filename: str):
    url = f"{API_BASE}/api/test-detect"
    payload = json.dumps({
        "filename": test_filename,
        "conf": 0.25,
        "node_id": 1
    }).encode("utf-8")
    
    req = urllib.request.Request(url, data=payload, headers={"Content-Type": "application/json"})
    with urllib.request.urlopen(req) as resp:
        result = json.loads(resp.read().decode("utf-8"))
        
    primary = result.get("primary_detection")
    if primary:
        print(f"Species: {primary['class']} [{primary['code']}]")
        print(f"Confidence: {primary['confidence_pct']}%")
        print(f"Intrusion: {result['intrusion']}")
        print(f"Responses: {primary['responses']}")
        print(f"Bounding Box: {primary['bbox']}")
    else:
        print("No target detected above confidence threshold.")

if __name__ == "__main__":
    run_wildshield_inference("WS-WL-WB-00004.jpg")
```

### JavaScript / React Frontend Example
```javascript
// Test dataset inference
async function detectTestImage(filename, nodeId = 1) {
  const response = await fetch("http://127.0.0.1:8000/api/test-detect", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      filename: filename,
      conf: 0.25,
      node_id: nodeId
    })
  });
  
  const data = await response.json();
  console.log("Detection event:", data.event_id);
  console.log("Species detected:", data.primary_detection?.class);
  console.log("WildShield Code:", data.primary_detection?.code);
  console.log("Deterrent Protocol:", data.primary_detection?.responses);
  return data;
}
```

---

## 5. Error Codes & Handling

| HTTP Status | Error Detail | Resolution |
| :---: | :--- | :--- |
| `400 Bad Request` | `No image file provided` / `Failed to decode base64 image` | Ensure file is attached or base64 format is valid (`data:image/jpeg;base64,...`) |
| `404 Not Found` | `Test image {filename} not found` | Verify image exists in `WildShield-Dataset/test/images/` |
| `500 Server Error` | `Model weights not found` | Verify file `runs/detect/WildShield-Experiments/wildshield_surveillance_v1-2/weights/best.pt` exists |
| `WinError 10013` | `Socket access forbidden` | Port 8000 is occupied by another process. Run with `--port 8001` or terminate the existing process |
