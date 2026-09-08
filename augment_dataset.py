import os
import random
import numpy as np
from pathlib import Path
from PIL import Image, ImageEnhance, ImageFilter, ImageOps
from concurrent.futures import ThreadPoolExecutor

BASE_DIR = Path(__file__).resolve().parent
SOURCE_DATASET = BASE_DIR / "Wildshield AI Workflow" / "wildshield ai Dataset"
AUG_OUTPUT_DIR = BASE_DIR / "WildShield-Dataset" / "augmented"

TARGET_AUG_MULTIPLIERS = {
    "Asiatic Lion": 10,
    "Indian Bison": 8,
    "Indian Cow": 8,
    "Indian Dog": 10,
    "Indian Macaque": 8,
    "Langur": 10,
    "tiger": 8,
    "Goat Dataset": 2,
    "Cattle Dataset": 2,
    "Wild Boar Dataset": 1,
}

def apply_night_vision(img: Image.Image) -> Image.Image:
    """Simulate infrared / night-vision capture."""
    gray = ImageOps.grayscale(img)
    enhancer = ImageEnhance.Contrast(gray)
    high_contrast = enhancer.enhance(1.3)
    rgb = high_contrast.convert("RGB")
    np_img = np.array(rgb, dtype=np.float32)
    np_img[:, :, 0] *= 0.4
    np_img[:, :, 2] *= 0.4
    np_img[:, :, 1] *= 0.9
    np_img = np.clip(np_img, 0, 255).astype(np.uint8)
    return Image.fromarray(np_img)

def apply_fog_haze(img: Image.Image) -> Image.Image:
    img_rgb = img.convert("RGB")
    haze_layer = Image.new("RGB", img.size, (200, 210, 215))
    return Image.blend(img_rgb, haze_layer, alpha=random.uniform(0.2, 0.35))

def apply_shadow_dusk(img: Image.Image) -> Image.Image:
    enhancer_b = ImageEnhance.Brightness(img)
    dimmed = enhancer_b.enhance(random.uniform(0.5, 0.75))
    enhancer_c = ImageEnhance.Contrast(dimmed)
    return enhancer_c.enhance(random.uniform(1.1, 1.3))

def apply_motion_blur(img: Image.Image) -> Image.Image:
    return img.filter(ImageFilter.GaussianBlur(radius=random.uniform(1.0, 2.0)))

def apply_geometric_transforms(img: Image.Image) -> Image.Image:
    res = img.copy()
    if random.random() > 0.5:
        res = ImageOps.mirror(res)
    
    angle = random.uniform(-10, 10)
    res = res.rotate(angle, resample=Image.BICUBIC, expand=False)
    
    if random.random() > 0.5:
        w, h = res.size
        crop_factor = random.uniform(0.88, 0.98)
        cw, ch = int(w * crop_factor), int(h * crop_factor)
        x1 = random.randint(0, w - cw)
        y1 = random.randint(0, h - ch)
        res = res.crop((x1, y1, x1 + cw, y1 + ch)).resize((w, h), Image.Resampling.BILINEAR)
        
    return res

def apply_color_jitter(img: Image.Image) -> Image.Image:
    res = img.convert("RGB")
    res = ImageEnhance.Brightness(res).enhance(random.uniform(0.8, 1.25))
    res = ImageEnhance.Contrast(res).enhance(random.uniform(0.8, 1.3))
    res = ImageEnhance.Color(res).enhance(random.uniform(0.7, 1.3))
    return res

def augment_single_image(img: Image.Image, aug_idx: int) -> Image.Image:
    img_mod = apply_geometric_transforms(img)
    mode = aug_idx % 5
    if mode == 0:
        img_mod = apply_night_vision(img_mod)
    elif mode == 1:
        img_mod = apply_fog_haze(img_mod)
    elif mode == 2:
        img_mod = apply_shadow_dusk(img_mod)
    elif mode == 3:
        img_mod = apply_motion_blur(img_mod)
    else:
        img_mod = apply_color_jitter(img_mod)
    return img_mod

def process_image_file(args):
    img_path, out_cat_dir, multiplier = args
    count = 0
    try:
        with Image.open(img_path) as orig_img:
            orig_img = orig_img.convert("RGB")
            # Resize large camera trap photos to standard surveillance resolution if very big
            if orig_img.width > 1280 or orig_img.height > 1280:
                orig_img.thumbnail((1280, 1280), Image.Resampling.BILINEAR)
                
            for i in range(multiplier):
                aug_img = augment_single_image(orig_img, i)
                out_name = f"AUG_{img_path.stem}_v{i+1}.jpg"
                out_file = out_cat_dir / out_name
                aug_img.save(out_file, "JPEG", quality=85)
                count += 1
    except Exception:
        pass
    return count

def run_augmentation():
    print("=" * 60)
    print(" WILDSHIELD AI — FAST SURVEILLANCE DATA AUGMENTATION")
    print("=" * 60)
    
    if not SOURCE_DATASET.exists():
        print(f"[ERROR] Source dataset not found at {SOURCE_DATASET}")
        return
        
    AUG_OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    
    categories = [d for d in SOURCE_DATASET.iterdir() if d.is_dir()]
    all_tasks = []
    
    for cat_dir in sorted(categories):
        cat_name = cat_dir.name
        multiplier = TARGET_AUG_MULTIPLIERS.get(cat_name, 3)
        
        all_images = [
            f for f in cat_dir.rglob("*") 
            if f.is_file() and f.suffix.lower() in [".jpg", ".jpeg", ".png", ".webp", ".bmp"]
        ]
        
        if not all_images:
            continue
            
        out_cat_dir = AUG_OUTPUT_DIR / cat_name
        out_cat_dir.mkdir(parents=True, exist_ok=True)
        
        if len(all_images) > 600:
            sample_source = random.sample(all_images, 400)
        else:
            sample_source = all_images
            
        print(f"[QUEUE] {cat_name:20s}: {len(sample_source)} source images x {multiplier} augmentations")
        for img_path in sample_source:
            all_tasks.append((img_path, out_cat_dir, multiplier))
            
    print(f"\n[INFO] Launching ThreadPool with {len(all_tasks)} image jobs...")
    total_generated = 0
    with ThreadPoolExecutor(max_workers=8) as executor:
        results = executor.map(process_image_file, all_tasks)
        total_generated = sum(results)
        
    print("\n" + "=" * 60)
    print(f"[SUCCESS] Generated {total_generated} Augmented Images in {AUG_OUTPUT_DIR}")
    print("=" * 60)

if __name__ == "__main__":
    run_augmentation()
