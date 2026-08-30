import os
import shutil
from pathlib import Path
from PIL import Image

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

COCO_TO_WS = {
    19: 6,  # cow -> Cattle
    18: 7,  # sheep/goat -> Goat
    0:  8,  # person -> Human
    2:  9,  # car -> Vehicle
    7:  9,  # truck -> Vehicle
    3:  9,  # motorcycle -> Vehicle
}

def auto_annotate():
    """
    Generate initial bounding boxes for raw images.
    Uses ultralytics if installed, otherwise produces centered bounding box priors.
    """
    image_paths = list(RAW_DIR.glob("**/*.jpg")) + list(RAW_DIR.glob("**/*.png"))
    print(f"[INFO] Found {len(image_paths)} images across raw classes.")

    has_yolo = False
    try:
        from ultralytics import YOLO
        print("[INFO] Loading YOLO detector for pseudo-label bootstrapping...")
        detector = YOLO("yolo11n.pt")  # lightweight base model
        has_yolo = True
    except ImportError:
        print("[INFO] ultralytics not installed. Generating centered heuristic bounding boxes for annotation bootstrap.")

    annotated_count = 0
    for img_path in image_paths:
        parent_name = img_path.parent.name
        class_id = int(parent_name.split("_")[0]) if "_" in parent_name else 0

        label_file = PROCESSED_LBL / f"{img_path.stem}.txt"
        out_image = PROCESSED_IMG / img_path.name
        
        yolo_boxes = []

        if has_yolo:
            try:
                results = detector.predict(source=str(img_path), conf=0.30, verbose=False)
                boxes = results[0].boxes
                if len(boxes) > 0:
                    for b in boxes:
                        coco_cls = int(b.cls[0].item())
                        ws_cls = COCO_TO_WS.get(coco_cls, class_id)
                        x, y, w, h = b.xywhn[0].tolist()
                        yolo_boxes.append(f"{ws_cls} {x:.6f} {y:.6f} {w:.6f} {h:.6f}")
            except Exception as e:
                pass

        # Fallback heuristic box (center crop prior: x=0.5, y=0.5, w=0.8, h=0.8)
        if not yolo_boxes:
            yolo_boxes.append(f"{class_id} 0.500000 0.500000 0.800000 0.800000")

        with open(label_file, "w", encoding="utf-8") as f:
            f.write("\n".join(yolo_boxes) + "\n")
            
        shutil.copy2(img_path, out_image)
        annotated_count += 1

    print(f"[OK] Successfully prepared {annotated_count} images & labels in {PROCESSED_DIR}")

if __name__ == "__main__":
    auto_annotate()
