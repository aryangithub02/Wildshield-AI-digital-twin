import os
import shutil
import hashlib
from pathlib import Path
from PIL import Image

# ==========================================
# 1. DIRECTORY CONFIGURATION
# ==========================================
BASE_DIR = Path(__file__).resolve().parent
DATASET_ROOT = BASE_DIR / "WildShield-Dataset"
RAW_DIR = DATASET_ROOT / "raw"
PROCESSED_DIR = DATASET_ROOT / "processed"
REJECTED_DIR = DATASET_ROOT / "rejected"

TRAIN_IMG = DATASET_ROOT / "train" / "images"
TRAIN_LBL = DATASET_ROOT / "train" / "labels"
VAL_IMG = DATASET_ROOT / "val" / "images"
VAL_LBL = DATASET_ROOT / "val" / "labels"
TEST_IMG = DATASET_ROOT / "test" / "images"
TEST_LBL = DATASET_ROOT / "test" / "labels"

# Source folders
DS1_PATH = BASE_DIR / "Animals Datasets 1" / "animals" / "animals"
DS2_PATH = BASE_DIR / "Animals Datasets 2" / "data"

TARGET_CLASSES = {
    0: {"name": "Wild Boar", "type": "WL", "code": "WB"},
    1: {"name": "Nilgai", "type": "WL", "code": "NG"},
    2: {"name": "Spotted Deer", "type": "WL", "code": "SD"},
    3: {"name": "Rhesus Macaque", "type": "WL", "code": "RM"},
    4: {"name": "Langur", "type": "WL", "code": "LG"},
    5: {"name": "Gaur", "type": "WL", "code": "GR"},
    6: {"name": "Cattle", "type": "DM", "code": "CT"},
    7: {"name": "Goat", "type": "DM", "code": "GT"},
    8: {"name": "Human", "type": "HM", "code": "HM"},
    9: {"name": "Vehicle", "type": "VH", "code": "VH"}
}

def init_folders():
    """Create the standard WildShield folder hierarchy."""
    for p in [RAW_DIR, PROCESSED_DIR, REJECTED_DIR, 
              TRAIN_IMG, TRAIN_LBL, VAL_IMG, VAL_LBL, TEST_IMG, TEST_LBL]:
        p.mkdir(parents=True, exist_ok=True)
    print("[OK] Initialized WildShield-Dataset folder structure.")

# ==========================================
# 2. IMAGE INTEGRITY & DEDUPLICATION
# ==========================================
def is_valid_image(img_path):
    """Verify if the image can be opened and is not corrupted."""
    try:
        with Image.open(img_path) as img:
            img.verify()
        return True
    except Exception:
        return False

def get_file_hash(filepath):
    """Compute MD5 hash to prevent exact duplicate images."""
    hasher = hashlib.md5()
    with open(filepath, "rb") as f:
        buf = f.read(65536)
        while len(buf) > 0:
            hasher.update(buf)
            buf = f.read(65536)
    return hasher.hexdigest()

# ==========================================
# 3. CONSOLIDATE LOCAL DATASETS WITH WS IDs
# ==========================================
def import_local_datasets():
    seen_hashes = set()
    counters = {cid: 1 for cid in TARGET_CLASSES}
    total_imported = 0
    total_rejected = 0

    # Source mapping: (Path, Target Class ID)
    source_mapping = []
    
    # Dataset 1
    if DS1_PATH.exists():
        source_mapping.extend([
            (DS1_PATH / "boar", 0),
            (DS1_PATH / "deer", 2),
            (DS1_PATH / "cow", 6),
            (DS1_PATH / "ox", 6),
            (DS1_PATH / "goat", 7),
        ])
    
    # Dataset 2
    if DS2_PATH.exists():
        source_mapping.extend([
            (DS2_PATH / "Wild Boar", 0),
            (DS2_PATH / "Nilgai", 1),
            (DS2_PATH / "Chital", 2),
        ])

    for source_dir, class_id in source_mapping:
        if not source_dir.exists():
            continue
            
        class_meta = TARGET_CLASSES[class_id]
        class_folder_name = f"{class_id}_{class_meta['name'].replace(' ', '_')}"
        target_raw_sub = RAW_DIR / class_folder_name
        target_raw_sub.mkdir(parents=True, exist_ok=True)
        
        for img_file in source_dir.glob("*.*"):
            if img_file.suffix.lower() not in [".jpg", ".jpeg", ".png", ".webp", ".bmp"]:
                continue
                
            if not is_valid_image(img_file):
                shutil.copy2(img_file, REJECTED_DIR / f"corrupted_{img_file.name}")
                total_rejected += 1
                continue
                
            img_hash = get_file_hash(img_file)
            if img_hash in seen_hashes:
                continue
            seen_hashes.add(img_hash)
            
            # Format: WS-[TYPE]-[SPECIES]-[ID]
            seq_num = counters[class_id]
            counters[class_id] += 1
            ws_id = f"WS-{class_meta['type']}-{class_meta['code']}-{seq_num:05d}"
            dest_file = target_raw_sub / f"{ws_id}{img_file.suffix.lower()}"
            
            shutil.copy2(img_file, dest_file)
            total_imported += 1

    print(f"[OK] Imported {total_imported} deduplicated images into {RAW_DIR}")
    if total_rejected > 0:
        print(f"[WARN] Rejected {total_rejected} corrupted images into {REJECTED_DIR}")

# ==========================================
# 4. HUGGING FACE INGESTION (OPTIONAL)
# ==========================================
def import_huggingface_dataset():
    """
    Download and extract relevant species from NoeFlandre/IndiaAnimals
    """
    try:
        from datasets import load_dataset
        print("[INFO] Checking for NoeFlandre/IndiaAnimals on Hugging Face...")
        ds = load_dataset("NoeFlandre/IndiaAnimals", split="train")
        
        hf_mapping = {
            "Wild Boar": 0,
            "Nilgai": 1,
            "Chital": 2,
            "Rhesus Macaque": 3,
            "Gray Langur": 4,
            "Gaur": 5
        }
        
        counters = {cid: 10000 for cid in TARGET_CLASSES}
        saved_count = 0
        for item in ds:
            label = item.get("label") or item.get("species")
            if label in hf_mapping:
                class_id = hf_mapping[label]
                class_meta = TARGET_CLASSES[class_id]
                target_folder = RAW_DIR / f"{class_id}_{class_meta['name'].replace(' ', '_')}"
                target_folder.mkdir(parents=True, exist_ok=True)
                
                img = item["image"]
                seq_num = counters[class_id]
                counters[class_id] += 1
                ws_id = f"WS-{class_meta['type']}-{class_meta['code']}-{seq_num:05d}"
                file_path = target_folder / f"{ws_id}.jpg"
                img.save(file_path, "JPEG")
                saved_count += 1
                
        print(f"[OK] Downloaded {saved_count} images from Hugging Face dataset.")
    except ImportError:
        print("[INFO] Hugging Face 'datasets' package not installed. Skipping online HF fetch.")
    except Exception as e:
        print(f"[INFO] HF Dataset notice: {e}")

# ==========================================
# 5. GENERATE data.yaml FOR YOLO
# ==========================================
def generate_yolo_yaml():
    yaml_content = f"""# WildShield AI - Dataset Configuration
path: {DATASET_ROOT.as_posix()}
train: train/images
val: val/images
test: test/images

names:
"""
    for cid, meta in TARGET_CLASSES.items():
        yaml_content += f"  {cid}: {meta['name']}\n"

    yaml_path = DATASET_ROOT / "data.yaml"
    with open(yaml_path, "w", encoding="utf-8") as f:
        f.write(yaml_content)
    print(f"[OK] Created YOLO dataset config: {yaml_path}")

if __name__ == "__main__":
    init_folders()
    import_local_datasets()
    import_huggingface_dataset()
    generate_yolo_yaml()
