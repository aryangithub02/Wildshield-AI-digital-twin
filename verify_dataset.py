import os
from pathlib import Path
from collections import Counter
from PIL import Image

BASE_DIR = Path(__file__).resolve().parent
DATASET_ROOT = BASE_DIR / "WildShield-Dataset"

TARGET_CLASSES = {
    0: "Wild Boar",
    1: "Nilgai",
    2: "Spotted Deer",
    3: "Rhesus Macaque",
    4: "Langur",
    5: "Gaur",
    6: "Cattle",
    7: "Goat",
    8: "Human",
    9: "Vehicle",
    10: "Tiger",
    11: "Asiatic Lion",
    12: "Dog"
}

def verify():
    print("=" * 65)
    print(" WILDSHIELD AI — DATASET HEALTH & VERIFICATION REPORT")
    print("=" * 65)

    if not DATASET_ROOT.exists():
        print("[ERROR] WildShield-Dataset directory does not exist.")
        return

    splits = ["train", "val", "test", "processed", "raw", "augmented"]
    
    for s in splits:
        folder = DATASET_ROOT / s
        if not folder.exists():
            continue
            
        if s in ["train", "val", "test", "processed"]:
            img_dir = folder / "images"
            lbl_dir = folder / "labels"
            images = (
                list(img_dir.glob("*.jpg")) + 
                list(img_dir.glob("*.jpeg")) + 
                list(img_dir.glob("*.png")) + 
                list(img_dir.glob("*.webp"))
            ) if img_dir.exists() else []
            labels = list(lbl_dir.glob("*.txt")) if lbl_dir.exists() else []
            print(f"\n[{s.upper()} SPLIT]")
            print(f"  Images : {len(images):,}")
            print(f"  Labels : {len(labels):,}")
            
            # Count classes in labels
            class_counter = Counter()
            for lbl_file in labels:
                try:
                    with open(lbl_file, "r", encoding="utf-8") as f:
                        for line in f:
                            parts = line.strip().split()
                            if parts:
                                cid = int(parts[0])
                                class_counter[cid] += 1
                except Exception:
                    pass
            
            if class_counter:
                print("  Class Distribution:")
                for cid in sorted(TARGET_CLASSES.keys()):
                    count = class_counter.get(cid, 0)
                    cname = TARGET_CLASSES.get(cid, f"Unknown ({cid})")
                    print(f"    - ID {cid:2d} ({cname:18s}): {count:5d} bounding boxes")

        elif s in ["raw", "augmented"]:
            images = (
                list(folder.glob("**/*.jpg")) + 
                list(folder.glob("**/*.jpeg")) + 
                list(folder.glob("**/*.png")) + 
                list(folder.glob("**/*.webp"))
            )
            print(f"\n[{s.upper()} REPOSITORY]")
            print(f"  Total Images: {len(images):,}")
            for sub in sorted(folder.iterdir()):
                if sub.is_dir():
                    count = len([f for f in sub.rglob("*") if f.is_file() and f.suffix.lower() in [".jpg", ".jpeg", ".png", ".webp", ".bmp"]])
                    print(f"    - {sub.name:25s}: {count:5d} images")

    print("\n" + "=" * 65)

if __name__ == "__main__":
    verify()
