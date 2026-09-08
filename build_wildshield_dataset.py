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
AUG_DIR = DATASET_ROOT / "augmented"

TRAIN_IMG = DATASET_ROOT / "train" / "images"
TRAIN_LBL = DATASET_ROOT / "train" / "labels"
VAL_IMG = DATASET_ROOT / "val" / "images"
VAL_LBL = DATASET_ROOT / "val" / "labels"
TEST_IMG = DATASET_ROOT / "test" / "images"
TEST_LBL = DATASET_ROOT / "test" / "labels"

# Primary & Secondary Source folders
PRIMARY_DS_PATH = BASE_DIR / "Wildshield AI Workflow" / "wildshield ai Dataset"
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
    9: {"name": "Vehicle", "type": "VH", "code": "VH"},
    10: {"name": "Tiger", "type": "WL", "code": "TG"},
    11: {"name": "Asiatic Lion", "type": "WL", "code": "LN"},
    12: {"name": "Dog", "type": "DM", "code": "DG"}
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

    # Source mapping list of tuples: (source_directory, class_id, max_samples)
    source_mapping = []

    # 1. PRIMARY USER DATASET (Wildshield AI Workflow / wildshield ai Dataset)
    if PRIMARY_DS_PATH.exists():
        source_mapping.extend([
            (PRIMARY_DS_PATH / "Wild Boar Dataset", 0, 3000), # Sample up to 3000 to keep balance
            (PRIMARY_DS_PATH / "Indian Macaque", 3, None),
            (PRIMARY_DS_PATH / "Langur", 4, None),
            (PRIMARY_DS_PATH / "Indian Bison", 5, None),
            (PRIMARY_DS_PATH / "Cattle Dataset", 6, 1200),
            (PRIMARY_DS_PATH / "Indian Cow", 6, None),
            (PRIMARY_DS_PATH / "Goat Dataset", 7, 1000),
            (PRIMARY_DS_PATH / "tiger", 10, None),
            (PRIMARY_DS_PATH / "Asiatic Lion", 11, None),
            (PRIMARY_DS_PATH / "Indian Dog", 12, None),
        ])

    # 2. AUGMENTED DATASET (WildShield-Dataset/augmented)
    if AUG_DIR.exists():
        source_mapping.extend([
            (AUG_DIR / "Wild Boar Dataset", 0, 1000),
            (AUG_DIR / "Indian Macaque", 3, None),
            (AUG_DIR / "Langur", 4, None),
            (AUG_DIR / "Indian Bison", 5, None),
            (AUG_DIR / "Cattle Dataset", 6, 1000),
            (AUG_DIR / "Indian Cow", 6, None),
            (AUG_DIR / "Goat Dataset", 7, 1000),
            (AUG_DIR / "tiger", 10, None),
            (AUG_DIR / "Asiatic Lion", 11, None),
            (AUG_DIR / "Indian Dog", 12, None),
        ])

    # 3. SECONDARY DATASETS (Nilgai, Spotted Deer, supplementary classes)
    if DS2_PATH.exists():
        source_mapping.extend([
            (DS2_PATH / "Nilgai", 1, None),
            (DS2_PATH / "Chital", 2, None),
            (DS2_PATH / "Wild Boar", 0, 200),
            (DS2_PATH / "Asiatic Lion", 11, None),
            (DS2_PATH / "Indian Leopard", 10, None),
        ])
    
    if DS1_PATH.exists():
        source_mapping.extend([
            (DS1_PATH / "deer", 2, None),
            (DS1_PATH / "dog", 12, None),
            (DS1_PATH / "tiger", 10, None),
            (DS1_PATH / "lion", 11, None),
        ])

    for source_dir, class_id, max_samples in source_mapping:
        if not source_dir.exists():
            continue
            
        class_meta = TARGET_CLASSES[class_id]
        class_folder_name = f"{class_id}_{class_meta['name'].replace(' ', '_')}"
        target_raw_sub = RAW_DIR / class_folder_name
        target_raw_sub.mkdir(parents=True, exist_ok=True)
        
        all_imgs = [
            f for f in source_dir.rglob("*") 
            if f.is_file() and f.suffix.lower() in [".jpg", ".jpeg", ".png", ".webp", ".bmp"]
        ]
        
        if max_samples and len(all_imgs) > max_samples:
            import random
            all_imgs = random.sample(all_imgs, max_samples)
            
        for img_file in all_imgs:
            if not is_valid_image(img_file):
                try:
                    shutil.copy2(img_file, REJECTED_DIR / f"corrupted_{img_file.name}")
                    total_rejected += 1
                except Exception:
                    pass
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

    print(f"[OK] Consolidated {total_imported} deduplicated images into {RAW_DIR}")
    if total_rejected > 0:
        print(f"[WARN] Rejected {total_rejected} corrupted images into {REJECTED_DIR}")

# ==========================================
# 4. GENERATE data.yaml FOR YOLO
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
    generate_yolo_yaml()
