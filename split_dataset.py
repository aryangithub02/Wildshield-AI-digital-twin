import os
import shutil
import random
from pathlib import Path
from collections import defaultdict

BASE_DIR = Path(__file__).resolve().parent
DATASET_ROOT = BASE_DIR / "WildShield-Dataset"
PROCESSED_IMG = DATASET_ROOT / "processed" / "images"
PROCESSED_LBL = DATASET_ROOT / "processed" / "labels"

TRAIN_DIR = DATASET_ROOT / "train"
VAL_DIR = DATASET_ROOT / "val"
TEST_DIR = DATASET_ROOT / "test"

def get_sequence_key(filename: str) -> str:
    """Group augmented variants and burst sequence frames together to prevent data leakage."""
    stem = Path(filename).stem
    # Handle AUG_ prefix and _v1, _v2 suffixes
    if stem.startswith("AUG_"):
        stem = stem[4:]
    if "_v" in stem:
        stem = stem.split("_v")[0]
        
    parts = stem.split("-")
    if len(parts) >= 4:
        # e.g. WS-WL-WB-00001 or WS-WL-WB-CAM01-S01-F01
        return "-".join(parts[:4])
    return stem

def split_dataset(train_ratio=0.70, val_ratio=0.20, test_ratio=0.10, seed=42):
    random.seed(seed)
    
    images = (
        list(PROCESSED_IMG.glob("*.jpg")) + 
        list(PROCESSED_IMG.glob("*.jpeg")) + 
        list(PROCESSED_IMG.glob("*.png")) +
        list(PROCESSED_IMG.glob("*.webp"))
    )
    if not images:
        print("[WARN] No images found in 'processed/images'. Run auto_label.py first.")
        return

    print(f"[INFO] Found {len(images)} total processed images for splitting.")

    # Clean existing train/val/test images & labels
    for split in [TRAIN_DIR, VAL_DIR, TEST_DIR]:
        for sub in ["images", "labels"]:
            d = split / sub
            if d.exists():
                shutil.rmtree(d)
            d.mkdir(parents=True, exist_ok=True)

    sequence_groups = defaultdict(list)
    for img in images:
        seq_key = get_sequence_key(img.name)
        sequence_groups[seq_key].append(img)
        
    all_keys = list(sequence_groups.keys())
    random.shuffle(all_keys)
    
    total_seqs = len(all_keys)
    train_end = int(total_seqs * train_ratio)
    val_end = train_end + int(total_seqs * val_ratio)
    
    splits = {
        "train": all_keys[:train_end],
        "val": all_keys[train_end:val_end],
        "test": all_keys[val_end:]
    }
    
    for split_name, keys in splits.items():
        img_dest = DATASET_ROOT / split_name / "images"
        lbl_dest = DATASET_ROOT / split_name / "labels"
        
        count = 0
        for key in keys:
            for img_path in sequence_groups[key]:
                label_path = PROCESSED_LBL / f"{img_path.stem}.txt"
                
                shutil.copy2(img_path, img_dest / img_path.name)
                if label_path.exists():
                    shutil.copy2(label_path, lbl_dest / label_path.name)
                count += 1
                    
        print(f"[OK] Split '{split_name}': {count} images and annotations ({len(keys)} unique entities).")

if __name__ == "__main__":
    split_dataset()
