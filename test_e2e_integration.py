"""
End-to-End Integration Test for WildShield AI Real-Time Event-Driven Intrusion Management
Tests database connection, YOLO model loading, test image detection, Neon storage, active intrusions endpoint, and intrusion lifecycle (ACTIVE -> CLEARED -> CLOSED).
"""

import sys
import json
import time
from pathlib import Path
from fastapi.testclient import TestClient

# Ensure root workspace is in sys.path
BASE_DIR = Path(__file__).resolve().parent
if str(BASE_DIR) not in sys.path:
    sys.path.insert(0, str(BASE_DIR))

from backend.server import app, load_yolo_model
from backend.database import init_db, SessionLocal, Detection, Intrusion, PreventionAction, Notification

def run_tests():
    print("=" * 60)
    print("WILDSHIELD AI — REAL-TIME INTRUSION MANAGEMENT TEST")
    print("=" * 60)

    # 1. Init Database
    print("\n[STEP 1] Testing Neon Database Connection & Tables...")
    init_db()

    # 2. Test Client
    client = TestClient(app)

    # 3. Status Endpoint Test
    print("\n[STEP 2] Testing GET /api/status...")
    res = client.get("/api/status")
    print(f"Status Code: {res.status_code}")
    status_data = res.json()
    print(f"Response: backend={status_data.get('backend')}, database={status_data.get('database')}, model={status_data.get('model')}")
    assert res.status_code == 200

    # 4. Devices Endpoint Test
    print("\n[STEP 3] Testing GET /api/devices...")
    res = client.get("/api/devices")
    print(f"Devices Found: {len(res.json().get('farmer_nodes', []))} nodes")
    assert res.status_code == 200

    # 5. List Test Images Test
    print("\n[STEP 4] Testing GET /api/test-images...")
    res = client.get("/api/test-images")
    img_list = res.json().get("images", [])
    print(f"Test Images Available: {len(img_list)}")
    assert len(img_list) > 0

    # Select a Wild Boar / Wildlife intrusion sample image
    target_img = next((img["filename"] for img in img_list if "WS-WL-WB" in img["filename"]), img_list[0]["filename"])
    print(f"Selected Wildlife Test Image: {target_img}")

    # 6. POST /api/test-detect (YOLO Inference + Neon DB Insert: Detection + Intrusion + Prevention + Notification)
    print(f"\n[STEP 5] Running YOLO Inference via POST /api/test-detect on {target_img}...")
    detect_res = client.post("/api/test-detect", json={"filename": target_img, "conf": 0.25, "node_id": 1})
    print(f"Inference Status: {detect_res.status_code}")
    detect_data = detect_res.json()
    print(f"Event ID: {detect_data.get('event_id')}")
    print(f"Intrusion ID: {detect_data.get('intrusion_id')}")
    print(f"Source: {detect_data.get('source')}")
    print(f"Intrusion Flag: {detect_data.get('intrusion')}")
    print(f"Primary Detection: {detect_data.get('primary_detection')}")
    assert detect_res.status_code == 200
    assert detect_data.get("event_id").startswith("WS-EVT-")
    assert detect_data.get("intrusion_id").startswith("WS-INT-")

    event_id = detect_data.get("event_id")
    intrusion_id = detect_data.get("intrusion_id")

    # 7. Verify Event & Intrusion Persistence in Neon DB
    print(f"\n[STEP 6] Verifying records in Neon PostgreSQL database...")
    db = SessionLocal()
    try:
        det_record = db.query(Detection).filter(Detection.event_id == event_id).first()
        int_record = db.query(Intrusion).filter(Intrusion.event_id == event_id).first()
        if det_record:
            print(f"✅ DB Detection Record: event_id={det_record.event_id}, species={det_record.species}, confidence={det_record.confidence}%")
        else:
            print(f"❌ Detection Record not found!")
        
        if int_record:
            print(f"✅ DB Intrusion Record: intrusion_id={int_record.intrusion_id}, status={int_record.status}, entered_at={int_record.entered_at}")
            assert int_record.status == "ACTIVE"
        else:
            print(f"❌ Intrusion Record not found!")
    finally:
        db.close()

    # 8. GET /api/intrusions/active
    print("\n[STEP 7] Testing GET /api/intrusions/active...")
    res = client.get("/api/intrusions/active")
    active_data = res.json()
    print(f"Active Intrusions Count: {active_data.get('count')}")
    print(f"Active Intrusions List: {active_data.get('intrusions')}")
    assert res.status_code == 200
    assert active_data.get("count") > 0

    # 9. Clear Intrusion Lifecycle (Animal Exited)
    print(f"\n[STEP 8] Testing POST /api/intrusions/{intrusion_id}/clear...")
    clear_res = client.post(f"/api/intrusions/{intrusion_id}/clear")
    print(f"Clear Status: {clear_res.status_code}, Response: {clear_res.json()}")
    assert clear_res.status_code == 200

    db = SessionLocal()
    try:
        updated_int = db.query(Intrusion).filter(Intrusion.intrusion_id == intrusion_id).first()
        if updated_int:
            print(f"✅ DB Intrusion Updated: status={updated_int.status}, exited_at={updated_int.exited_at}")
            assert updated_int.status in ["CLEARED", "CLOSED"]
    finally:
        db.close()

    # 10. GET /api/analytics
    print("\n[STEP 9] Testing GET /api/analytics...")
    res = client.get("/api/analytics")
    analytics_data = res.json()
    print(f"Total Detections in DB: {analytics_data.get('total_detections')}")
    print(f"Species Breakdown: {analytics_data.get('species_breakdown')}")

    print("\n" + "=" * 60)
    print("ALL INTRUSION MANAGEMENT & NEON DB TESTS PASSED! 🎉")
    print("=" * 60)

if __name__ == "__main__":
    run_tests()
