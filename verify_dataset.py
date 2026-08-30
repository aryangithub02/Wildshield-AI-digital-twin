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
    9: "Vehicle"
}

def verify():
    print("=" * 60)
    print(" WILDSHIELD AI — DATASET HEALTH & VERIFICATION REPORT")
    print("=" * 60)

    if not DATASET_ROOT.exists():
        print("[ERROR] WildShield-Dataset directory does not exist.")
        return

    splits = ["train", "val", "test", "processed", "raw"]
    
    for s in splits:
        folder = DATASET_ROOT / s
        if not folder.exists():
            continue
            
        if s in ["train", "val", "test", "processed"]:
            img_dir = folder / "images"
            lbl_dir = folder / "labels"
            images = list(img_dir.glob("*.*")) if img_dir.exists() else []
            labels = list(lbl_dir.glob("*.txt")) if lbl_dir.exists() else []
            print(f"\n[{s.upper()} SPLIT]")
            print(f"  Images: {len(images)}")
            print(f"  Labels: {len(labels)}")
            
            # Count classes in labels
            class_counter = Counter()
            for lbl_file in labels:
                with open(lbl_file, "r", encoding="utf-8") as f:
                    for line in f:
                        parts = line.strip().split()
                        if parts:
                            cid = int(parts[0])
                            class_counter[cid] += 1
            
            if class_counter:
                print("  Class Distribution:")
                for cid, count in sorted(class_counter.items()):
                    cname = TARGET_CLASSES.get(cid, f"Unknown ({cid})")
                    print(f"    - ID {cid:2d} ({cname:15s}): {count:4d} instances")

        elif s == "raw":
            raw_images = list((DATASET_ROOT / "raw").glob("**/*.*"))
            print(f"\n[RAW DATASET REPOSITORY]")
            print(f"  Total Raw Images: {len(raw_images)}")
            for sub in (DATASET_ROOT / "raw").iterdir():
                if sub.is_dir():
                    count = len(list(sub.glob("*.*")))
                    print(f"    - {sub.name:25s}: {count:4d} images")

    print("\n" + "=" * 60)

if __name__ == "__main__":
    verify()
