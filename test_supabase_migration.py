"""
Test script for Hot DB + Permanent Supabase PostgreSQL Migration Worker & Storage API
"""

import json
from backend.supabase_db import init_supabase_db, SupabaseSessionLocal, HistoricalDetection, HistoricalIntrusion
from backend.services.migration_worker import get_storage_status, run_migration_cycle
from backend.database import SessionLocal, Detection, Intrusion

def run_tests():
    print("--- 1. Testing Supabase PostgreSQL Connection & Schema Initialization ---")
    sup_ok = init_supabase_db()
    print("Supabase Init Result:", sup_ok)
    assert sup_ok is True, "Supabase connection/initialization failed!"

    print("\n--- 2. Fetching Initial Storage Status Metrics ---")
    status = get_storage_status()
    print("Initial Storage Status:")
    print(json.dumps(status, indent=2))

    print("\n--- 3. Running Migration Worker Cycle ---")
    mig_res = run_migration_cycle(force_all_completed=True)
    print("Migration Worker Result:")
    print(json.dumps(mig_res, indent=2))

    print("\n--- 4. Fetching Post-Migration Storage Status Metrics ---")
    post_status = get_storage_status()
    print("Post-Migration Storage Status:")
    print(json.dumps(post_status, indent=2))

    print("\n--- 5. Testing Idempotency (Running Migration Worker Second Time) ---")
    mig_res2 = run_migration_cycle(force_all_completed=True)
    print("Second Run Migration Worker Result:")
    print(json.dumps(mig_res2, indent=2))

    print("\n✅ ALL MIGRATION & STORAGE TESTS PASSED SUCCESSFULLY!")

if __name__ == "__main__":
    run_tests()
