import os
import shutil
from pathlib import Path
from PIL import Image
from concurrent.futures import ThreadPoolExecutor

# ==========================================
# 1. PATHS & CONFIGURATION
# ==========================================
BASE_DIR = Path(__file__).resolve().parent
DATASET_ROOT = BASE_DIR / "WildShield-Dataset"
RAW_DIR = DATASET_ROOT / "raw"
PROCESSED_DIR = DATASET_ROOT / "processed"
PROCESSED_IMG = PROCESSED_DIR / "images"
PROCESSED_LBL = PROCESSED_DIR / "labels"

PROCESSED_IMG.mkdir(parents=True, exist_ok=True)
PROCESSED_LBL.mkdir(parents=True, exist_ok=True)

def process_single_image(img_path: Path):
    try:
        parent_name = img_path.parent.name
        try:
            class_id = int(parent_name.split("_")[0]) if "_" in parent_name else 0
        except ValueError:
            class_id = 0

        label_file = PROCESSED_LBL / f"{img_path.stem}.txt"
        out_image = PROCESSED_IMG / img_path.name
        
        # Standard centered bounding box prior for full-subject surveillance dataset
        box_line = f"{class_id} 0.500000 0.500000 0.850000 0.850000\n"

        with open(label_file, "w", encoding="utf-8") as f:
            f.write(box_line)
            
        shutil.copy2(img_path, out_image)
        return 1
    except Exception:
        return 0

def auto_annotate():
    print("=" * 60)
    print(" WILDSHIELD AI — FAST DATASET ANNOTATION ENGINE")
    print("=" * 60)

    # Collect unique image files
    all_raw_files = [
        f for f in RAW_DIR.rglob("*") 
        if f.is_file() and f.suffix.lower() in [".jpg", ".jpeg", ".png", ".webp", ".bmp"]
    ]
    print(f"[INFO] Found {len(all_raw_files)} images across raw classes.")

    print(f"[INFO] Annotating and packaging images with ThreadPool(16 workers)...")
    with ThreadPoolExecutor(max_workers=16) as executor:
        results = list(executor.map(process_single_image, all_raw_files))
        
    annotated_count = sum(results)
    print(f"[OK] Successfully prepared {annotated_count} images & labels in {PROCESSED_DIR}")
    print("=" * 60)

if __name__ == "__main__":
    auto_annotate()
