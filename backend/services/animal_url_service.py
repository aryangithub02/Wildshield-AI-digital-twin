"""
WildShield AI — Animal Target URL Service
Persists custom trigger URLs for all 10 animal classes + Human.
Dispatches target URLs over HTTP (GET/POST) whenever a species is detected.
"""

import os
import sys
import json
import time
import ctypes
import logging
import threading
import urllib.request
import urllib.error
from pathlib import Path
from concurrent.futures import ThreadPoolExecutor
from typing import Dict, Any, Optional

logger = logging.getLogger("WildShield.AnimalUrls")

CONFIG_PATH = Path(__file__).resolve().parent.parent / "animal_urls_config.json"

class HostAudioPlayer:
    """Hardware audio output player using native Windows MCI for Human deterrence sound."""
    def __init__(self):
        self._lock = threading.Lock()
        self.alias = "wildshield_server_human_audio"
        self.last_played = 0.0
        self.cooldown = 4.0
        self.project_root = Path(__file__).resolve().parent.parent.parent
        self.audio_file = self.project_root / "audios" / "0001.mp3"
        if not self.audio_file.exists():
            self.audio_file = self.project_root / "public" / "audios" / "0001.mp3"

    def play_human_sound(self):
        if sys.platform != "win32":
            return
        now = time.monotonic()
        if now - self.last_played < self.cooldown:
            return
        self.last_played = now

        def _worker():
            with self._lock:
                try:
                    if not self.audio_file.exists():
                        return
                    winmm = ctypes.windll.winmm
                    kernel32 = ctypes.windll.kernel32
                    buf = ctypes.create_unicode_buffer(512)
                    kernel32.GetShortPathNameW(str(self.audio_file.resolve()), buf, 512)
                    short_path = buf.value or str(self.audio_file.resolve())

                    winmm.mciSendStringW(f"close {self.alias}", None, 0, None)
                    cmd_open = f"open {short_path} type mpegvideo alias {self.alias}"
                    res_open = winmm.mciSendStringW(cmd_open, None, 0, None)
                    if res_open == 0:
                        winmm.mciSendStringW(f"play {self.alias}", None, 0, None)
                        print(f"[HOST AUDIO] 🔊 Playing Track 0001 ({self.audio_file.name}) on speaker for HUMAN detection")
                except Exception as e:
                    logger.debug(f"[HOST AUDIO] Audio notice: {e}")

        threading.Thread(target=_worker, daemon=True).start()

DEFAULT_URLS = {
    "Elephant": "http://192.168.137.211/siren?track=4",
    "Wild Boar": "http://192.168.137.211/siren?track=3",
    "Deer": "http://192.168.137.211/siren?track=2",
    "Nilgai": "http://192.168.137.211/siren?track=3",
    "Monkey": "http://192.168.137.211/siren?track=3",
    "Leopard": "http://192.168.137.211/siren?track=4",
    "Bear": "http://192.168.137.211/siren?track=1",
    "Cattle": "http://192.168.137.211/siren?track=4",
    "Goat": "http://192.168.137.211/siren?track=4",
    "Wild Dogs": "http://192.168.137.211/siren?track=3",
    "Human": "http://192.168.137.211/siren"
}

DEFAULT_METHODS = {
    "Elephant": "POST",
    "Wild Boar": "POST",
    "Deer": "POST",
    "Nilgai": "POST",
    "Monkey": "POST",
    "Leopard": "POST",
    "Bear": "POST",
    "Cattle": "POST",
    "Goat": "POST",
    "Wild Dogs": "POST",
    "Human": "POST"
}

class AnimalUrlService:
    def __init__(self):
        self._lock = threading.RLock()
        self.urls: Dict[str, str] = dict(DEFAULT_URLS)
        self.methods: Dict[str, str] = dict(DEFAULT_METHODS)
        self.host_audio = HostAudioPlayer()
        self._executor = ThreadPoolExecutor(max_workers=3, thread_name_prefix="AnimalUrlDispatcher")
        self._load_config()

    def _load_config(self):
        with self._lock:
            if CONFIG_PATH.exists():
                try:
                    with open(CONFIG_PATH, "r", encoding="utf-8") as f:
                        data = json.load(f)
                        if isinstance(data.get("urls"), dict):
                            self.urls.update(data["urls"])
                        if isinstance(data.get("methods"), dict):
                            self.methods.update(data["methods"])
                    logger.info(f"[AnimalUrlService] Loaded {len(self.urls)} animal target URLs from {CONFIG_PATH.name}")
                except Exception as e:
                    logger.warning(f"[AnimalUrlService] Could not parse {CONFIG_PATH}: {e}")

    def save_config(self, urls: Optional[Dict[str, str]] = None, methods: Optional[Dict[str, str]] = None):
        with self._lock:
            if urls:
                self.urls.update(urls)
            if methods:
                self.methods.update(methods)
            try:
                with open(CONFIG_PATH, "w", encoding="utf-8") as f:
                    json.dump({"urls": self.urls, "methods": self.methods}, f, indent=2)
                return True
            except Exception as e:
                logger.error(f"[AnimalUrlService] Failed to save config to {CONFIG_PATH}: {e}")
                return False

    def get_urls(self) -> Dict[str, Any]:
        with self._lock:
            return {
                "urls": dict(self.urls),
                "methods": dict(self.methods)
            }

    def normalize_species(self, species: str) -> str:
        s = str(species).lower().strip()
        if "elephant" in s:
            return "Elephant"
        if "boar" in s or "pig" in s or "wb" in s:
            return "Wild Boar"
        if "deer" in s or "chital" in s or "axis" in s or "sd" in s:
            return "Deer"
        if "nilgai" in s or "blue bull" in s or "ng" in s:
            return "Nilgai"
        if "monkey" in s or "macaque" in s or "langur" in s or "rm" in s:
            return "Monkey"
        if "leopard" in s or "panther" in s:
            return "Leopard"
        if "bear" in s:
            return "Bear"
        if "cattle" in s or "cow" in s or "bull" in s or "ct" in s:
            return "Cattle"
        if "goat" in s or "sheep" in s or "gt" in s:
            return "Goat"
        if "dog" in s or "jackal" in s or "canine" in s:
            return "Wild Dogs"
        if "human" in s or "person" in s or "man" in s or "woman" in s or "intruder" in s or "hu" in s:
            return "Human"
        return "Elephant"

    def dispatch(self, species: str, metadata: Optional[Dict[str, Any]] = None):
        canonical = self.normalize_species(species)

        # Policy: play deterrent sound strictly on Human detection
        if canonical == "Human":
            self.host_audio.play_human_sound()

        with self._lock:
            url = self.urls.get(canonical, "").strip()
            method = self.methods.get(canonical, "POST").upper()

        if not url:
            return False

        self._executor.submit(self._send_request, url, method, canonical, metadata or {})
        return True

    def _send_request(self, url: str, method: str, species: str, metadata: Dict[str, Any]):
        try:
            print(f"[AnimalUrlDispatcher] 🚀 Dispatching {method} -> {url} for species: {species}")
            logger.info(f"[AnimalUrlDispatcher] {method} {url} (species={species})")
            
            data_bytes = None
            headers = {"User-Agent": "WildShield-AI/2.0"}

            if method == "POST":
                payload = {
                    "species": species,
                    "threat": metadata.get("threat", "HIGH"),
                    "confidence": metadata.get("confidence_pct", metadata.get("confidence", 95.0)),
                    "timestamp": metadata.get("time_formatted", ""),
                    "source": "WildShield Central AI Engine"
                }
                data_bytes = json.dumps(payload).encode("utf-8")
                headers["Content-Type"] = "application/json"

            req = urllib.request.Request(url, data=data_bytes, headers=headers, method=method)
            with urllib.request.urlopen(req, timeout=3.0) as resp:
                status_code = resp.getcode()
                print(f"[AnimalUrlDispatcher] ✅ Success {status_code} from {url}")
                return status_code
        except Exception as e:
            print(f"[AnimalUrlDispatcher] ⚠️ Dispatch notice for {url}: {e}")
            return None


animal_url_service = AnimalUrlService()
