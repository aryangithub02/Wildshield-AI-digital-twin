import os
from pathlib import Path
import torch

BASE_DIR = Path(__file__).resolve().parent
DATASET_ROOT = BASE_DIR / "WildShield-Dataset"
TEST_YAML = DATASET_ROOT / "data_test.yaml"

def create_test_yaml():
    """Create data yaml that sets train split to test/images."""
    content = f"""# WildShield AI - Training on Test Split
path: {DATASET_ROOT.as_posix()}
train: test/images
val: val/images
test: test/images

names:
  0: Wild Boar
  1: Nilgai
  2: Spotted Deer
  3: Rhesus Macaque
  4: Langur
  5: Gaur
  6: Cattle
  7: Goat
  8: Human
  9: Vehicle
"""
    with open(TEST_YAML, "w", encoding="utf-8") as f:
        f.write(content)
    print(f"[OK] Created {TEST_YAML}")

def train_on_test_data(
    model_path="runs/detect/WildShield-Experiments/wildshield_surveillance_v1-2/weights/best.pt",
    epochs=15,
    batch=8,
    imgsz=640
):
    try:
        from ultralytics import YOLO
    except ImportError:
        print("[ERROR] ultralytics not installed. Run: pip install ultralytics")
        return

    create_test_yaml()

    # If checkpoint exists, fine-tune from it, otherwise use base yolo11n.pt
    model_weight = model_path if Path(model_path).exists() else "yolo11n.pt"
    device = 0 if torch.cuda.is_available() else "cpu"

    print(f"[INFO] Initializing training on TEST split using {model_weight} on {device}...")
    model = YOLO(model_weight)

    results = model.train(
        data=str(TEST_YAML),
        epochs=epochs,
        batch=batch,
        imgsz=imgsz,
        device=device,
        optimizer="AdamW",
        lr0=0.0005,  # Lower LR for fine-tuning
        lrf=0.01,
        hsv_h=0.015,
        hsv_s=0.7,
        hsv_v=0.5,
        degrees=10.0,
        translate=0.1,
        scale=0.4,
        shear=2.0,
        fliplr=0.5,
        flipud=0.0,
        mosaic=1.0,
        mixup=0.15,
        copy_paste=0.1,
        project="WildShield-Experiments",
        name="wildshield_trained_on_test"
    )
    print("[OK] Training on test dataset complete.")

if __name__ == "__main__":
    train_on_test_data()
