"""
WildShield AI — Communication Layer Performance & Benchmark Suite
Measures REST latency, WebSocket throughput, DB persistence speed, and YOLO inference pipeline latency.
"""

import sys
import os
import time
import statistics
from fastapi.testclient import TestClient

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from backend.server import app

client = TestClient(app)

def benchmark_endpoint(method, url, payload=None, iterations=50):
    latencies = []
    for _ in range(iterations):
        t0 = time.perf_counter()
        if method == "GET":
            res = client.get(url)
        elif method == "POST":
            res = client.post(url, json=payload)
        t1 = time.perf_counter()
        assert res.status_code == 200, f"Failed on {url}: {res.status_code}"
        latencies.append((t1 - t0) * 1000) # Convert to ms

    avg = statistics.mean(latencies)
    median = statistics.median(latencies)
    p95 = sorted(latencies)[int(len(latencies) * 0.95)]
    min_lat = min(latencies)
    max_lat = max(latencies)
    return {
        "avg_ms": round(avg, 2),
        "median_ms": round(median, 2),
        "p95_ms": round(p95, 2),
        "min_ms": round(min_lat, 2),
        "max_ms": round(max_lat, 2),
        "req_per_sec": round(1000 / avg, 1) if avg > 0 else 0
    }

def run_performance_benchmarks():
    print("\n" + "="*75)
    print(" [BENCHMARK] WILDSHIELD AI - COMMUNICATION LAYER PERFORMANCE TEST")
    print("="*75 + "\n")

    # 1. Benchmark Core REST APIs
    endpoints = [
        ("GET", "/api/status", None, "System Health & Status Check"),
        ("GET", "/api/farm", None, "Farm Boundary & Zone Metadata"),
        ("GET", "/api/devices", None, "IoT Farmer Nodes & Battery Telemetry"),
        ("GET", "/api/events?limit=20", None, "Historical Detection Query"),
        ("GET", "/api/analytics", None, "Live Event Aggregation & Analytics"),
        ("POST", "/api/trigger-response", {
            "species": "Wild Boar", "node_id": 1,
            "actuators": {"siren": True, "floodlight": True, "speaker": True, "sprinkler": False}
        }, "Deterrent Trigger & Override Command"),
        ("POST", "/api/sync-events", {
            "events": [{
                "event_id": f"PERF-EVT-{i}",
                "species": "Wild Boar", "confidence": 95, "zone": "North Field"
            } for i in range(5)]
        }, "Offline Batch Sync (5 events / payload)")
    ]

    results = {}
    print(f"{'Endpoint':<30} | {'Avg (ms)':<9} | {'Median':<8} | {'p95 (ms)':<8} | {'Throughput (req/s)':<18}")
    print("-" * 80)

    for method, url, payload, desc in endpoints:
        res = benchmark_endpoint(method, url, payload, iterations=40)
        results[url] = res
        print(f"{url:<30} | {res['avg_ms']:<9.2f} | {res['median_ms']:<8.2f} | {res['p95_ms']:<8.2f} | {res['req_per_sec']:<18.1f}")

    # 2. Test Images & YOLO Model Edge Inference Pipeline Speed
    print("\n" + "-"*80)
    print(" [AI PIPELINE] YOLOv11 Detection + Threat Assessment + DB Event Pipeline")
    print("-" * 80)

    images_res = client.get("/api/test-images").json()
    test_img = images_res.get("images", [{}])[0].get("filename", "WS-WL-WB-00006.jpg")

    inference_latencies = []
    for _ in range(5):
        t0 = time.perf_counter()
        det_res = client.post("/api/test-detect", json={"filename": test_img, "conf": 0.25, "node_id": 1})
        t1 = time.perf_counter()
        assert det_res.status_code == 200
        inference_latencies.append((t1 - t0) * 1000)

    avg_pipeline = round(statistics.mean(inference_latencies), 2)
    min_pipeline = round(min(inference_latencies), 2)
    max_pipeline = round(max(inference_latencies), 2)

    print(f"  + Test Image Processed       : {test_img}")
    print(f"  + Full Pipeline Latency (Avg): {avg_pipeline} ms (Min: {min_pipeline} ms, Max: {max_pipeline} ms)")
    print(f"  + YOLO Model Inference Time  : ~{det_res.json().get('inference_time_ms')} ms (reported by Engine)")
    print(f"  + Decision & DB Persist Time : ~{round(avg_pipeline - det_res.json().get('inference_time_ms', 0), 2)} ms")

    print("\n" + "="*75)
    print(" [RESULT SUMMARY] Performance benchmarks completed successfully!")
    print("="*75 + "\n")

if __name__ == "__main__":
    run_performance_benchmarks()
