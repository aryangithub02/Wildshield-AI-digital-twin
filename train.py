import os
import shutil
from pathlib import Path
import torch

BASE_DIR = Path(__file__).resolve().parent
YAML_PATH = BASE_DIR / "WildShield-Dataset" / "data.yaml"
TARGET_WEIGHTS_DIR = BASE_DIR / "runs" / "detect" / "WildShield-Experiments" / "wildshield_surveillance_v1-2" / "weights"

def train_wildshield_model(
    model_name="yolo11n.pt", 
    epochs=10, 
    batch=32, 
    imgsz=320,
    device="cpu",
    workers=0
):
    try:
        from ultralytics import YOLO
    except ImportError:
        print("[ERROR] ultralytics package is not installed. Please run: pip install ultralytics")
        return

    if not YAML_PATH.exists():
        print(f"[ERROR] data.yaml not found at {YAML_PATH}. Run build_wildshield_dataset.py first.")
        return

    print("=" * 65)
    print(" WILDSHIELD AI — YOLO SURVEILLANCE MODEL TRAINING")
    print(f" Device: {device} | Base Model: {model_name} | Epochs: {epochs} | Batch: {batch} | ImgSz: {imgsz}")
    print("=" * 65)

    model = YOLO(model_name)

    project_dir = BASE_DIR / "runs" / "detect" / "WildShield-Experiments"

    # Train transfer-learning model with surveillance hyperparameters
    results = model.train(
        data=str(YAML_PATH),
        epochs=epochs,
        batch=batch,
        imgsz=imgsz,
        device=device,
        workers=workers,
        optimizer="AdamW",
        lr0=0.002,
        lrf=0.01,
        
        # Surveillance Augmentations
        hsv_h=0.015,
        hsv_s=0.5,
        hsv_v=0.4,
        degrees=8.0,
        translate=0.1,
        scale=0.3,
        fliplr=0.5,
        mosaic=0.8,
        
        # Logging & Saving
        val=True,
        save=True,
        project=str(project_dir),
        name="wildshield_surveillance_v1-2",
        exist_ok=True
    )
    
    best_pt = project_dir / "wildshield_surveillance_v1-2" / "weights" / "best.pt"
    if best_pt.exists():
        print(f"\n[OK] Training completed successfully!")
        print(f"[OK] Best weights saved to: {best_pt}")
        
        # Run test set evaluation
        print("\n[INFO] Evaluating model on unseen test set (1,071 images)...")
        try:
            val_model = YOLO(str(best_pt))
            metrics = val_model.val(data=str(YAML_PATH), split="test", imgsz=imgsz, device=device, workers=0)
            print("=" * 65)
            print(" WILDSHIELD AI — TEST SET BENCHMARK RESULTS")
            print(f" mAP50    : {metrics.box.map50 * 100:.2f}%")
            print(f" mAP50-95 : {metrics.box.map * 100:.2f}%")
            print(f" Precision: {metrics.box.mp * 100:.2f}%")
            print(f" Recall   : {metrics.box.mr * 100:.2f}%")
            print("=" * 65)
        except Exception as e:
            print(f"[INFO] Validation notice: {e}")
            
    return results

if __name__ == "__main__":
    train_wildshield_model()
