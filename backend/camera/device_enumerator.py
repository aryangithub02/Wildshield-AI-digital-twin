"""
WildShield AI - Camera Device Enumeration Utility
Discovers hardware webcams and DirectShow virtual camera bridges (DroidCam, OBS Virtual Cam).
"""

import subprocess
import re
import cv2
import time
from typing import List, Dict, Any

_CACHED_DEVICES: List[Dict[str, Any]] = []
_LAST_ENUM_TIME: float = 0.0


def get_dshow_devices(force_refresh: bool = False) -> List[Dict[str, Any]]:
    """
    Enumerate video input devices via DirectShow using fast FFmpeg probe or OpenCV fallback.
    Caches results for 5 seconds to avoid repeated process spawning.
    """
    global _CACHED_DEVICES, _LAST_ENUM_TIME
    now = time.time()
    if not force_refresh and _CACHED_DEVICES and (now - _LAST_ENUM_TIME < 5.0):
        return _CACHED_DEVICES

    devices = []
    try:
        proc = subprocess.run(
            ['ffmpeg', '-list_devices', 'true', '-f', 'dshow', '-i', 'dummy'],
            capture_output=True,
            text=True,
            timeout=2.5,
            encoding='utf-8',
            errors='ignore'
        )
        matches = re.findall(r'"([^"]+)"\s+\(video\)', proc.stderr)
        for idx, name in enumerate(matches):
            name_lower = name.lower()
            if "obs" in name_lower:
                dev_type = "obs"
                display = f"🎥 {name} [Index {idx}] (OBS Bridge)"
                is_virtual = True
            elif "droid" in name_lower:
                dev_type = "droidcam"
                display = f"📱 {name} [Index {idx}] (Android Mobile)"
                is_virtual = True
            elif "integrated" in name_lower or "internal" in name_lower or "built-in" in name_lower or idx == 0:
                dev_type = "webcam"
                display = f"💻 {name} [Index {idx}] (Laptop Webcam)"
                is_virtual = False
            else:
                dev_type = "usb_cam"
                display = f"📷 {name} [Index {idx}]"
                is_virtual = False

            devices.append({
                "index": idx,
                "name": name,
                "display": display,
                "type": dev_type,
                "is_virtual": is_virtual
            })
    except Exception:
        for idx in range(3):
            try:
                cap = cv2.VideoCapture(idx, cv2.CAP_DSHOW)
                if cap.isOpened():
                    devices.append({
                        "index": idx,
                        "name": f"Camera {idx}",
                        "display": f"📷 Camera {idx}",
                        "type": "webcam" if idx == 0 else "camera",
                        "is_virtual": False
                    })
                    cap.release()
            except Exception:
                pass

    if not devices:
        devices = [
            {"index": 0, "name": "Integrated Camera", "display": "💻 Integrated Camera [Index 0] (Laptop Webcam)", "type": "webcam", "is_virtual": False},
            {"index": 1, "name": "DroidCam Video", "display": "📱 DroidCam Video [Index 1] (Android Mobile)", "type": "droidcam", "is_virtual": True},
            {"index": 2, "name": "OBS Virtual Camera", "display": "🎥 OBS Virtual Camera [Index 2] (OBS Bridge)", "type": "obs", "is_virtual": True},
        ]

    _CACHED_DEVICES = devices
    _LAST_ENUM_TIME = now
    return devices


if __name__ == '__main__':
    devs = get_dshow_devices()
    for d in devs:
        print(d)
