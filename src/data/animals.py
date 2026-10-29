"""
WildShield AI — Real-Time Animal & Human Detection with Bluetooth Speaker Audio
Detects wildlife, domestic animals, and humans using YOLO.
Automatically plays deterrent sounds (0001.mp3 - 0005.mp3) on the connected Bluetooth speaker.

Sound Mappings:
  - Elephant:    Track 0004 (0004.mp3)
  - Wild Boar:   Track 0003 (0003.mp3)
  - Deer:        Track 0002 (0002.mp3)
  - Nilgai:      Track 0003 (0003.mp3)
  - Monkey:      Track 0003 (0003.mp3)
  - Leopard:     Track 0004 (0004.mp3)
  - Bear:        Track 0001 (0001.mp3)
  - Cattle:      Track 0004 (0004.mp3)
  - Goat:        Track 0004 (0004.mp3)
  - Wild Dogs:   Track 0003 (0003.mp3)
  - HUMAN:       Track 0001 (0001.mp3) [As requested: play 0001 for human]
"""

import os
import sys
import time
import ctypes
import threading
from pathlib import Path
import cv2
import requests
from ultralytics import YOLO

# ================= CONFIGURATION =================
# Camera Source: 0 = Built-in webcam / USB cam, 1 = DroidCam, 2 = OBS Virtual Camera
CAMERA_SOURCE = 0

# Detection thresholds (Only show and trigger on confidence over 75%)
CONFIDENCE_THRESHOLD = 0.75
REQUIRED_CONSECUTIVE_DETECTIONS = 2
AUDIO_COOLDOWN_SECONDS = 4.0  # Avoid sound overlapping or repeating every frame

# ESP32 Hardware Webhook Target (Default: http://192.168.137.211)
ESP32_IP = "192.168.137.211"
ESP32_BASE_URL = f"http://{ESP32_IP}"
ENABLE_ESP32_HTTP = True

# Audio directory (contains 0001.mp3 to 0005.mp3)
PROJECT_ROOT = Path(__file__).resolve().parent.parent.parent
AUDIOS_DIR = PROJECT_ROOT / "audios"
if not AUDIOS_DIR.exists():
    AUDIOS_DIR = PROJECT_ROOT / "public" / "audios"

# ================= SPECIES -> AUDIO MAPPING =================
# Format: "Species": (audio_filename, sound_id, esp32_endpoint)
SPECIES_AUDIO_MAP = {
    "elephant": ("0004.mp3", "0004", "elephant"),
    "wild boar": ("0003.mp3", "0003", "wildboar"),
    "deer": ("0002.mp3", "0002", "deer"),
    "spotted deer": ("0002.mp3", "0002", "deer"),
    "nilgai": ("0003.mp3", "0003", "nilgai"),
    "monkey": ("0003.mp3", "0003", "monkey"),
    "rhesus macaque": ("0003.mp3", "0003", "monkey"),
    "langur": ("0003.mp3", "0003", "monkey"),
    "leopard": ("0004.mp3", "0004", "leopard"),
    "bear": ("0001.mp3", "0001", "bear"),
    "cattle": ("0004.mp3", "0004", "cattle"),
    "cow": ("0004.mp3", "0004", "cattle"),
    "bull": ("0004.mp3", "0004", "cattle"),
    "goat": ("0004.mp3", "0004", "goat"),
    "sheep": ("0004.mp3", "0004", "goat"),
    "wild dogs": ("0003.mp3", "0003", "wilddog"),
    "wild dog": ("0003.mp3", "0003", "wilddog"),
    "dog": ("0003.mp3", "0003", "wilddog"),
    # HUMAN / PERSON -> PLAYS 0001.mp3
    "human": ("0001.mp3", "0001", "human"),
    "person": ("0001.mp3", "0001", "human"),
    "intruder": ("0001.mp3", "0001", "human"),
}

# ================= BLUETOOTH SPEAKER AUDIO ENGINE =================
class BluetoothSpeakerPlayer:
    """
    Hardware audio output player using native Windows MCI (Media Control Interface).
    Routes audio through the system default output device (Bluetooth Speaker / Headphones).
    Completely non-blocking — executes in background daemon threads so video stays at full FPS.
    """
    def __init__(self):
        self.winmm = ctypes.windll.winmm
        self.kernel32 = ctypes.windll.kernel32
        self.alias = "wildshield_bt_speaker"
        self._lock = threading.Lock()
        self.current_playing = None
        self.last_played_time = 0.0

    def _get_short_path(self, long_path_str):
        buf = ctypes.create_unicode_buffer(512)
        self.kernel32.GetShortPathNameW(long_path_str, buf, 512)
        return buf.value or long_path_str

    def stop(self):
        with self._lock:
            try:
                self.winmm.mciSendStringW(f"stop {self.alias}", None, 0, None)
                self.winmm.mciSendStringW(f"close {self.alias}", None, 0, None)
            except Exception:
                pass
            self.current_playing = None

    def play(self, audio_filename, blocking=False):
        def _worker():
            with self._lock:
                audio_path = AUDIOS_DIR / audio_filename
                if not audio_path.exists():
                    print(f"[AUDIO ERROR] File not found: {audio_path}")
                    return

                short_path = self._get_short_path(str(audio_path.resolve()))

                # Close any existing audio stream
                self.winmm.mciSendStringW(f"close {self.alias}", None, 0, None)

                # Open audio stream
                cmd_open = f"open {short_path} type mpegvideo alias {self.alias}"
                res_open = self.winmm.mciSendStringW(cmd_open, None, 0, None)
                if res_open != 0:
                    print(f"[AUDIO MCI ERROR] Open failed (code {res_open}) for: {audio_filename}")
                    return

                # Play on default audio output (Bluetooth speaker)
                res_play = self.winmm.mciSendStringW(f"play {self.alias}", None, 0, None)
                if res_play == 0:
                    self.current_playing = audio_filename
                    self.last_played_time = time.monotonic()
                    print(f"[BLUETOOTH SPEAKER] >>> Playing {audio_filename} <<<")
                else:
                    print(f"[AUDIO MCI ERROR] Play failed (code {res_play})")

        if blocking:
            _worker()
        else:
            t = threading.Thread(target=_worker, daemon=True)
            t.start()

speaker_player = BluetoothSpeakerPlayer()

# ================= ESP32 HTTP TRIGGER =================
http_session = requests.Session()

def trigger_esp32_endpoint(endpoint):
    if not ENABLE_ESP32_HTTP:
        return

    # Load dual actuator targets dynamically from persistent config if available
    targets = []
    cfg_file = PROJECT_ROOT / "backend" / "hardware_target_config.json"
    if cfg_file.exists():
        try:
            with open(cfg_file, "r", encoding="utf-8") as f:
                cfg = json.load(f)
                if cfg.get("enabled", True) and cfg.get("ip"):
                    ep1 = cfg.get("deter_endpoint", "/siren") if "siren" in endpoint or "deter" in endpoint else endpoint
                    targets.append(f"http://{cfg['ip']}:{cfg.get('port', 80)}/{ep1.lstrip('/')}")
                if cfg.get("enabled_2", True) and cfg.get("ip_2"):
                    ep2 = cfg.get("deter_endpoint_2", "/siren2") if "siren" in endpoint or "deter" in endpoint else endpoint
                    targets.append(f"http://{cfg['ip_2']}:{cfg.get('port_2', 80)}/{ep2.lstrip('/')}")
        except Exception:
            pass

    if not targets and ESP32_BASE_URL:
        targets.append(f"{ESP32_BASE_URL}/{endpoint.lstrip('/')}")

    def _worker():
        for url in targets:
            try:
                t0 = time.perf_counter()
                resp = http_session.get(url, timeout=(0.6, 1.2))
                elapsed = time.perf_counter() - t0
                print(f"[ESP32 DUAL ACTUATOR] {url} -> HTTP {resp.status_code} ({elapsed:.3f}s)")
            except requests.RequestException:
                pass

    threading.Thread(target=_worker, daemon=True).start()

# ================= LOAD YOLO MODELS =================
def find_model_weights():
    candidates = [
        PROJECT_ROOT / "runs" / "detect" / "WildShield-Experiments" / "wildshield_surveillance_v1-2" / "weights" / "best.pt",
        PROJECT_ROOT / "runs" / "detect" / "WildShield-Experiments" / "wildshield_trained_on_test" / "weights" / "best.pt",
        PROJECT_ROOT / "best.pt",
        PROJECT_ROOT / "yolo11n.pt"
    ]
    for c in candidates:
        if c.exists():
            return c
    return Path("yolo11n.pt")

model_path = find_model_weights()
print(f"[SYSTEM] Loading YOLO model from: {model_path}...")
model = YOLO(str(model_path))
print(f"[SYSTEM] Model loaded successfully. Classes: {len(model.names)}")

# Also load high-precision human detection model if custom model lacks person/human
person_model = None
has_human_in_custom = any("human" in str(v).lower() or "person" in str(v).lower() for v in model.names.values())
if not has_human_in_custom:
    try:
        coco_path = PROJECT_ROOT / "yolo11n.pt"
        if coco_path.exists():
            print("[SYSTEM] Loading secondary human detector (yolo11n.pt)...")
            person_model = YOLO(str(coco_path))
    except Exception as e:
        print(f"[WARNING] Could not load secondary human model: {e}")

# ================= MATCH SPECIES HELPER =================
def resolve_species_audio(cls_name):
    name_clean = str(cls_name).strip().lower()

    # Exact or synonym search
    for key, (audio_file, track_id, endpoint) in SPECIES_AUDIO_MAP.items():
        if key in name_clean or name_clean in key:
            return key.title(), audio_file, track_id, endpoint

    # Specific human fallback
    if "man" in name_clean or "woman" in name_clean or "people" in name_clean:
        return "Human", "0001.mp3", "0001", "human"

    # Default fallback
    return cls_name, "0004.mp3", "0004", "deter"

# ================= MAIN CAMERA LOOP =================
def main():
    print(f"\n=======================================================")
    print(f" WildShield AI — Real-Time Animal & Human Detection")
    print(f" Audio Target: Bluetooth Speaker / Default Audio Out")
    print(f" Audio Directory: {AUDIOS_DIR}")
    print(f" ESP32 Target: {ESP32_BASE_URL}")
    print(f" Camera Source: {CAMERA_SOURCE}")
    print(f" Press 'q' to Quit | 's' to Stop Sound | 't' to Test BT Sound")
    print(f"=======================================================\n")

    cap = cv2.VideoCapture(CAMERA_SOURCE)
    if not cap.isOpened():
        print(f"[ERROR] Could not open camera {CAMERA_SOURCE}. Trying camera index 1...")
        cap = cv2.VideoCapture(1)
        if not cap.isOpened():
            print("[ERROR] Camera could not be opened. Check CAMERA_SOURCE or USB/webcam connection.")
            return

    # Reduce buffer latency
    cap.set(cv2.CAP_PROP_BUFFERSIZE, 1)

    last_detected_species = None
    consecutive_count = 0
    last_trigger_time = 0.0
    active_speaker_banner = None
    banner_expiry_time = 0.0

    fps_last_time = time.time()
    fps = 0.0

    try:
        while True:
            ret, frame = cap.read()
            if not ret:
                time.sleep(0.03)
                continue

            # Calculate FPS
            now_time = time.time()
            fps = 0.9 * fps + 0.1 * (1.0 / max(0.001, now_time - fps_last_time))
            fps_last_time = now_time

            # 1. Run primary model inference
            results = model.predict(source=frame, conf=CONFIDENCE_THRESHOLD, imgsz=640, verbose=False)
            
            detected_target = None
            detected_conf = 0.0
            best_box = None

            if len(results) > 0 and results[0].boxes is not None:
                for box in results[0].boxes:
                    cls_id = int(box.cls[0])
                    conf = float(box.conf[0])
                    cls_name = model.names.get(cls_id, f"Class_{cls_id}")

                    if conf > detected_conf:
                        detected_conf = conf
                        detected_target = cls_name
                        best_box = box

            # 2. Run secondary human detector if primary didn't catch a human
            if person_model is not None and (detected_target is None or "human" not in str(detected_target).lower()):
                p_results = person_model.predict(source=frame, classes=[0], conf=CONFIDENCE_THRESHOLD, imgsz=640, verbose=False)
                if len(p_results) > 0 and p_results[0].boxes is not None and len(p_results[0].boxes) > 0:
                    p_box = p_results[0].boxes[0]
                    p_conf = float(p_box.conf[0])
                    if p_conf > detected_conf:
                        detected_conf = p_conf
                        detected_target = "Human"
                        best_box = p_box

            # 3. Decision Logic & Audio Playback (Strictly on Human Detection)
            now_mono = time.monotonic()
            
            if detected_target is not None:
                species_name, audio_file, track_id, endpoint = resolve_species_audio(detected_target)
                is_human = (
                    str(species_name).lower() in ("human", "person", "man", "woman", "people", "intruder")
                    or "human" in str(detected_target).lower()
                    or "person" in str(detected_target).lower()
                )

                # Check consecutive confirmations
                if detected_target == last_detected_species:
                    consecutive_count += 1
                else:
                    last_detected_species = detected_target
                    consecutive_count = 1

                # Fast trigger for human (immediate on first frame), standard for others
                is_confirmed = (consecutive_count >= 1) if is_human else (consecutive_count >= REQUIRED_CONSECUTIVE_DETECTIONS)
                cooldown_elapsed = (now_mono - last_trigger_time) >= AUDIO_COOLDOWN_SECONDS

                if is_human:
                    # ONLY PLAY SOUND ON HUMAN DETECTION
                    if is_confirmed and cooldown_elapsed:
                        last_trigger_time = now_mono
                        active_speaker_banner = f"🚨 HUMAN DETECTED! Playing Track 0001 ({audio_file}) on Speaker"
                        banner_expiry_time = now_mono + 3.5

                        print(f"\n[TARGET CONFIRMED] {species_name} ({detected_conf*100:.1f}%)")
                        print(f"  >>> 🚨 HUMAN DETECTED! Playing Track 0001 ({audio_file}) on Bluetooth Speaker <<<")

                        # Play sound on Bluetooth speaker / system audio
                        speaker_player.play(audio_file)

                        # Trigger ESP32 if online
                        trigger_esp32_endpoint(endpoint)
                else:
                    # Non-human targets: sound is muted as per policy (audio only plays on human detection)
                    if is_confirmed and cooldown_elapsed:
                        last_trigger_time = now_mono
                        print(f"\n[TARGET DETECTED] {species_name} ({detected_conf*100:.1f}%) — Sound muted (Audio enabled strictly on Human detection)")
                        trigger_esp32_endpoint(endpoint)

            else:
                consecutive_count = 0
                last_detected_species = None

            # 4. Render OpenCV Frame with Annotations & Audio Status
            annotated = frame.copy()

            # Draw bounding boxes if present
            if len(results) > 0 and results[0].boxes is not None:
                annotated = results[0].plot()

            # Draw HUD Overlay Banner
            h, w = annotated.shape[:2]
            
            # Top Header Bar
            cv2.rectangle(annotated, (0, 0), (w, 55), (15, 17, 23), -1)
            cv2.putText(annotated, "WILDSHIELD AI - LIVE BLUETOOTH SPEAKER MONITOR", (15, 25),
                        cv2.FONT_HERSHEY_SIMPLEX, 0.65, (0, 255, 150), 2)
            cv2.putText(annotated, f"FPS: {fps:.1f} | Conf Thresh: {int(CONFIDENCE_THRESHOLD*100)}%", (15, 45),
                        cv2.FONT_HERSHEY_SIMPLEX, 0.45, (180, 180, 180), 1)

            # Active Target Badge
            if detected_target is not None:
                badge_text = f"DETECTED: {detected_target.upper()} ({detected_conf*100:.1f}%)"
                color = (0, 0, 255) if "human" in detected_target.lower() else (0, 200, 255)
                cv2.putText(annotated, badge_text, (w - 380, 35),
                            cv2.FONT_HERSHEY_SIMPLEX, 0.65, color, 2)

            # Bottom Bluetooth Audio Status Banner
            if active_speaker_banner and now_mono < banner_expiry_time:
                cv2.rectangle(annotated, (0, h - 45), (w, h), (0, 120, 0), -1)
                cv2.putText(annotated, f">> {active_speaker_banner}", (20, h - 15),
                            cv2.FONT_HERSHEY_SIMPLEX, 0.60, (255, 255, 255), 2)
            else:
                cv2.rectangle(annotated, (0, h - 35), (w, h), (20, 24, 33), -1)
                cv2.putText(annotated, "Speaker Ready | Audio triggers strictly on HUMAN detection (0001.mp3) | Press 'q' to Quit", (20, h - 12),
                            cv2.FONT_HERSHEY_SIMPLEX, 0.45, (140, 140, 140), 1)

            cv2.imshow("WildShield AI - Bluetooth Speaker Live Detection", annotated)

            key = cv2.waitKey(1) & 0xFF
            if key == ord('q'):
                break
            elif key == ord('s'):
                print("[SYSTEM] Stopping Bluetooth speaker audio...")
                speaker_player.stop()
                active_speaker_banner = None
            elif key == ord('t'):
                print("[TEST] Playing test Track 0001 (0001.mp3) on Bluetooth speaker...")
                speaker_player.play("0001.mp3")
                active_speaker_banner = "MANUAL TEST: Playing 0001.mp3 on Bluetooth Speaker"
                banner_expiry_time = now_mono + 3.0

    finally:
        cap.release()
        cv2.destroyAllWindows()
        speaker_player.stop()
        http_session.close()
        print("\n[SYSTEM] Camera and Bluetooth audio session closed.")

if __name__ == "__main__":
    main()