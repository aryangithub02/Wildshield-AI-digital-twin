import os
from pathlib import Path
import torch

BASE_DIR = Path(__file__).resolve().parent
YAML_PATH = BASE_DIR / "WildShield-Dataset" / "data.yaml"

def train_wildshield_model(
    model_name="yolo11n.pt", 
    epochs=50, 
    batch=8, 
    imgsz=640,
    device=None
):
    try:
        from ultralytics import YOLO
    except ImportError:
        print("[ERROR] ultralytics package is not installed. Please run: pip install ultralytics")
        return

    if not YAML_PATH.exists():
        print(f"[ERROR] data.yaml not found at {YAML_PATH}. Run build_wildshield_dataset.py first.")
        return

    # Auto-detect device
    if device is None:
        device = 0 if torch.cuda.is_available() else "cpu"

    print(f"[INFO] Using device: {device} (CUDA available: {torch.cuda.is_available()})")
    print(f"[INFO] Initializing YOLO training with {model_name}...")
    model = YOLO(model_name)

    # Surveillance & farm augmentation hyperparameters
    results = model.train(
        data=str(YAML_PATH),
        epochs=epochs,
        batch=batch,
        imgsz=imgsz,
        device=device,
        optimizer="AdamW",
        lr0=0.001,
        lrf=0.01,
        
        # Farm & Night Surveillance Augmentations
        hsv_h=0.015,       # Color hue variance
        hsv_s=0.7,         # Desaturation (monochrome/IR simulation)
        hsv_v=0.5,         # Exposure/brightness variations (low-light, shadows)
        degrees=10.0,      # Sloped camera angles
        translate=0.1,     # Perimeter boundaries
        scale=0.4,         # Distance variation (small/far animals)
        shear=2.0,         # Perspective distortion
        fliplr=0.5,        # Horizontal flip
        flipud=0.0,        # No upside down flip
        mosaic=1.0,        # Multiple animals & cluttered background
        mixup=0.15,        # Crop occlusion & partial visibility
        copy_paste=0.1,    # Animal herds
        
        # Logging & Model outputs
        val=True,
        save=True,
        project="WildShield-Experiments",
        name="wildshield_surveillance_v1"
    )
    print("[OK] Training complete. Model weights saved to WildShield-Experiments/wildshield_surveillance_v1/weights/best.pt")

if __name__ == "__main__":
    train_wildshield_model()

