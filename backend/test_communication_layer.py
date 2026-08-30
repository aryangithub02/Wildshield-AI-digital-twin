"""
WildShield AI — Automated Test Suite for Central Communication & Synchronization Layer
Tests all REST endpoints, YOLO inference, database persistence, and offline reconciliation.
"""

import sys
import os
import json
import time
from fastapi.testclient import TestClient

# Add project root to path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from backend.server import app

client = TestClient(app)

def run_tests():
    print("\n" + "="*70)
    print(" [TEST] WILDSHIELD AI - COMMUNICATION LAYER VERIFICATION SUITE")
    print("="*70 + "\n")

    # 1. Test Health Status
    print("[TEST 1/10] Verifying System Health & Model Status (/api/status)...")
    res = client.get("/api/status")
    assert res.status_code == 200, f"Status code failed: {res.status_code}"
    status_data = res.json()
    print(f"  + Backend Status: {status_data.get('backend')}")
    print(f"  + YOLO Model Status: {status_data.get('model')}")
    print(f"  + Database: {status_data.get('database')}")
    print(f"  + Class Count: {status_data.get('classes_count')}")

    # 2. Test Farm Configuration & Zones
    print("\n[TEST 2/10] Verifying Farm Configuration (/api/farm & /api/farm/zones)...")
    res = client.get("/api/farm")
    assert res.status_code == 200
    farm_data = res.json()
    assert farm_data["farm_id"] == "WS-FARM-001"
    print(f"  + Farm Name: {farm_data['name']} (Crop: {farm_data['crop']})")
    print(f"  + Zones Count: {len(farm_data['zones'])}")

    res_zones = client.get("/api/farm/zones")
    assert res_zones.status_code == 200
    print(f"  + Retrieved {len(res_zones.json())} configured agricultural surveillance zones.")

    # 3. Test Devices Status
    print("\n[TEST 3/10] Verifying IoT Farmer Nodes & Devices (/api/devices)...")
    res = client.get("/api/devices")
    assert res.status_code == 200
    dev_data = res.json()
    print(f"  + Active Farmer Nodes: {len(dev_data.get('farmer_nodes', []))}")
    for node in dev_data.get('farmer_nodes', [])[:2]:
        print(f"    - {node['code']}: {node['name']} ({node['zone']}) - Battery: {node['battery']}%")

    # 4. Test Device Registration / FCM Token
    print("\n[TEST 4/10] Verifying FCM Push Token Registration (/api/devices/register)...")
    reg_payload = {
        "device_id": "TEST-DEV-ANDROID-001",
        "farmer_id": "FARMER-001",
        "farm_id": "WS-FARM-001",
        "fcm_token": "fcm_test_token_abc123xyz_wildshield",
        "platform": "android"
    }
    res = client.post("/api/devices/register", json=reg_payload)
    assert res.status_code == 200
    print("  + Registered farmer mobile device for push notifications.")

    # 5. Test Dataset Test Images Listing
    print("\n[TEST 5/10] Verifying Dataset Test Images (/api/test-images)...")
    res = client.get("/api/test-images")
    assert res.status_code == 200
    images_data = res.json()
    images = images_data.get("images", [])
    print(f"  + Available Unseen Test Images: {len(images)}")

    # 6. Test YOLO Model Inference on Test Image (Simulation)
    test_filename = images[0]["filename"] if images else "WS-WL-WB-00006.jpg"
    print(f"\n[TEST 6/10] Running YOLO Inference on Dataset Image: {test_filename} (/api/test-detect)...")
    det_payload = {
        "filename": test_filename,
        "conf": 0.25,
        "node_id": 1
    }
    res = client.post("/api/test-detect", json=det_payload)
    assert res.status_code == 200, f"Inference failed: {res.text}"
    det_data = res.json()
    print(f"  + Event ID: {det_data.get('event_id')}")
    print(f"  + Inference Time: {det_data.get('inference_time_ms')} ms")
    print(f"  + Threat Level: {det_data.get('max_threat')}")
    print(f"  + AI Decision: {det_data.get('decision', {}).get('action')}")
    print(f"  + Actuator State: {det_data.get('prevention')}")
    if det_data.get('primary_detection'):
        prim = det_data['primary_detection']
        print(f"  + Primary Detected Species: {prim.get('class')} ({prim.get('confidence_pct')}%)")

    # 7. Test Historical Events & Database Persistence
    print("\n[TEST 7/10] Verifying Database Event Storage & Retrieval (/api/events)...")
    res = client.get("/api/events")
    assert res.status_code == 200
    events_data = res.json()
    print(f"  + Total Persistent Events in Database: {events_data.get('count')}")
    assert events_data.get('count', 0) > 0, "Event was not persisted to database"

    # 8. Test Prevention & Manual Trigger
    print("\n[TEST 8/10] Verifying Deterrent Trigger & Override (/api/trigger-response)...")
    trig_payload = {
        "species": "Wild Boar",
        "node_id": 1,
        "actuators": {"siren": True, "floodlight": True, "speaker": True, "sprinkler": False},
        "mode": "test_verification",
        "triggered_by": "OPERATOR_TEST"
    }
    res = client.post("/api/trigger-response", json=trig_payload)
    assert res.status_code == 200
    print(f"  + Deterrent Response Message: {res.json().get('message')}")

    # 9. Test Offline Synchronization & Deduplication
    print("\n[TEST 9/10] Verifying Offline Sync & Deduplication (/api/sync-events & /api/sync)...")
    mock_offline_event_id = f"WS-OFFLINE-{int(time.time()*1000)%100000}"
    sync_payload = {
        "events": [
            {
                "event_id": mock_offline_event_id,
                "species": "Wild Boar",
                "code": "WS-WL-WB",
                "confidence": 93.8,
                "risk": "HIGH",
                "zone": "North Field",
                "camera_id": "FN-1",
                "action": "Siren + Floodlight Activated"
            }
        ]
    }
    # Ingest first time -> 1 synced
    res_sync1 = client.post("/api/sync-events", json=sync_payload)
    assert res_sync1.status_code == 200
    assert res_sync1.json().get("synced_count") == 1
    print(f"  + Offline batch ingested: 1 new event saved.")

    # Ingest second time -> deduplicated
    res_sync2 = client.post("/api/sync-events", json=sync_payload)
    assert res_sync2.status_code == 200
    assert res_sync2.json().get("duplicate_count") == 1
    print(f"  + Deduplication verified: Duplicate event safely skipped.")

    # Catch-up sync check
    res_catchup = client.get("/api/sync")
    assert res_catchup.status_code == 200
    print(f"  + Catch-up sync endpoint (/api/sync) returned {res_catchup.json().get('count')} records.")

    # 10. Test Analytics Computation
    print("\n[TEST 10/10] Verifying Live Analytics & Separate Model Benchmark (/api/analytics)...")
    res = client.get("/api/analytics")
    assert res.status_code == 200
    analytics_data = res.json()
    print(f"  + Live Total Detections: {analytics_data.get('total_detections')}")
    print(f"  + High Threat Events: {analytics_data.get('high_threat_events')}")
    print(f"  + Deterrent Activations: {analytics_data.get('deterrent_activations')}")
    print(f"  + Most Active Zone: {analytics_data.get('most_active_zone')}")
    print(f"  + Fixed Model Benchmark mAP@50: {analytics_data.get('model_benchmark', {}).get('mAP_50')}%")

    print("\n" + "="*70)
    print(" [SUCCESS] ALL 10 VERIFICATION TESTS PASSED SUCCESSFULLY!")
    print("="*70 + "\n")

if __name__ == "__main__":
    run_tests()
