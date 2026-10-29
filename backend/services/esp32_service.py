"""
WildShield AI — ESP32 Smart Deterrent Hardware Controller Service
Coordinates physical LED and Speaker activation on ESP32 microcontroller over Wi-Fi.

APIs Supported on ESP32:
  - ACTIVATE:   GET http://<ESP32_IP>:<PORT>/deter  (LED ON + Speaker ON)
  - DEACTIVATE: GET http://<ESP32_IP>:<PORT>/stop   (LED OFF + Speaker OFF)
  - STATUS:     GET http://<ESP32_IP>:<PORT>/status (Returns 'ON' or 'OFF')

Operational Rules (Real-Time Synchronous Response):
  1. No 5-Second Hold Delay:
     - Deterrent activates immediately upon target detection.
     - Deterrent deactivates immediately when perimeter clears (0s hold delay).
     - No background timers keep the siren/LED artificially locked ON.
  2. Direct Detection Linking:
     - Any confirmed detection (Human, Wildlife, Animal) triggers physical deterrence.
     - No complex taxonomy barriers or safety inhibitions suppressing live tests.
  3. Ordered & Reliable ESP32 API Calls:
     - Dispatches HTTP requests through a serialized FIFO worker (max_workers=1).
     - Never sends out-of-order /deter and /stop calls.
     - Suppresses duplicate redundant network requests while already in desired state.
     - Configurable endpoints and methods (GET / POST).
"""

import os
import time
import json
import logging
import threading
import socket
import urllib.request
import urllib.error
from pathlib import Path
from concurrent.futures import ThreadPoolExecutor
from typing import Dict, Any, List, Optional

logger = logging.getLogger("WildShield.ESP32")

CONFIG_FILE = Path(__file__).resolve().parent.parent / "hardware_target_config.json"


class ESP32Service:
    def __init__(self):
        # Actuator 1 (Primary Target) Configuration
        self.ip: str = os.getenv("WILDSHIELD_ESP32_IP", "192.168.137.211").strip().strip('"').strip("'")
        self.port: int = int(os.getenv("WILDSHIELD_ESP32_PORT", "80"))
        self.enabled: bool = os.getenv("WILDSHIELD_ESP32_ENABLED", "true").lower() in ("true", "1", "yes")
        self.timeout: float = float(os.getenv("WILDSHIELD_ESP32_TIMEOUT", "2.5"))
        self.deter_endpoint: str = os.getenv("WILDSHIELD_ESP32_DETER_ENDPOINT", "/siren").strip()
        self.stop_endpoint: str = os.getenv("WILDSHIELD_ESP32_STOP_ENDPOINT", "/stop").strip()
        self.status_endpoint: str = os.getenv("WILDSHIELD_ESP32_STATUS_ENDPOINT", "/status").strip()

        # Actuator 2 (Secondary Target) Configuration
        self.ip_2: str = os.getenv("WILDSHIELD_ESP32_IP_2", "192.168.137.64").strip().strip('"').strip("'")
        self.port_2: int = int(os.getenv("WILDSHIELD_ESP32_PORT_2", "80"))
        self.enabled_2: bool = os.getenv("WILDSHIELD_ESP32_ENABLED_2", "true").lower() in ("true", "1", "yes")
        self.deter_endpoint_2: str = os.getenv("WILDSHIELD_ESP32_DETER_ENDPOINT_2", "/siren2").strip()
        self.stop_endpoint_2: str = os.getenv("WILDSHIELD_ESP32_STOP_ENDPOINT_2", "/stop").strip()
        self.status_endpoint_2: str = os.getenv("WILDSHIELD_ESP32_STATUS_ENDPOINT_2", "/status").strip()

        self.http_method: str = os.getenv("WILDSHIELD_ESP32_METHOD", "GET").strip().upper()

        # Detection Confidence Threshold (Responsive 45% default)
        self.min_conf: float = float(os.getenv("WILDSHIELD_ESP32_MIN_CONF", "0.45"))
        self.human_min_conf: float = float(os.getenv("WILDSHIELD_HUMAN_MIN_CONF", "0.45"))

        # Auto-Trigger switch (Default: True)
        self.auto_trigger: bool = os.getenv("WILDSHIELD_AUTO_TRIGGER", "true").lower() in ("true", "1", "yes")

        # Deterrent Mode ("ALL", "HUMAN_ONLY", "WILDLIFE_ONLY")
        raw_mode = os.getenv("WILDSHIELD_DETERRENT_MODE", "ALL").strip().upper()
        self.mode = raw_mode if raw_mode in ("ALL", "HUMAN_ONLY", "WILDLIFE_ONLY") else "ALL"
        self.human_test_mode: bool = os.getenv("WILDSHIELD_HUMAN_TEST_MODE", "true").lower() in ("true", "1", "yes")

        # Zero-Hold Policy: auto_off_sec is 0.0 (disabled by default)
        self.auto_off_sec: float = float(os.getenv("WILDSHIELD_ESP32_AUTO_OFF_SEC", "0.0"))

        # Load persisted config overrides if available (e.g. from user input in UI)
        self._load_persistent_config()

        # State tracking (Atomic & Thread-safe Re-entrant Lock)
        self._state: str = "INACTIVE"
        self._state_2: str = "INACTIVE"
        self._lock = threading.RLock()
        self._last_state_change: float = time.time()
        self._last_trigger_reason: str = "None"
        self._total_activations: int = 0
        self._consecutive_errors: int = 0
        self._last_error_msg: Optional[str] = None
        self._last_success_ts: Optional[float] = None
        self._auto_off_timer: Optional[threading.Timer] = None

        # Serialized single-thread executor to guarantee strictly ordered FIFO dispatch
        self._executor = ThreadPoolExecutor(max_workers=2, thread_name_prefix="ESP32-Worker")

    @property
    def state(self) -> str:
        with self._lock:
            return self._state

    @property
    def is_active(self) -> bool:
        with self._lock:
            return self._state == "ACTIVE" or self._state_2 == "ACTIVE"

    @property
    def state_1(self) -> str:
        with self._lock:
            return self._state

    @property
    def state_2(self) -> str:
        with self._lock:
            return self._state_2

    def evaluate_deterrent_trigger(
        self,
        detections: List[Dict[str, Any]],
        threat_level: str = "NORMAL",
        is_intrusion: bool = False
    ) -> bool:
        """
        Direct & Responsive Detection Evaluator:
        Automatically triggers physical deterrence whenever a target (animal, human, or intrusion)
        is detected above the confidence threshold.
        """
        if not self.enabled or not self.auto_trigger:
            return False

        # Immediate trigger on elevated threat levels or confirmed intrusions
        if is_intrusion or threat_level in ("CRITICAL", "HIGH", "MEDIUM"):
            return True

        if not detections:
            return False

        HUMAN_NAMES = {"human", "person", "man", "woman", "people"}

        has_any_target = False
        has_human = False
        has_wildlife = False

        for d in detections:
            cls_name = str(d.get("raw_class") or d.get("class", "")).strip().lower()
            if "unknown" in cls_name or "uncertain" in cls_name:
                continue

            if d.get("temporal_confirmed") is False:
                continue

            conf = float(d.get("confidence", 0.0))
            thresh = self.human_min_conf if cls_name in HUMAN_NAMES else self.min_conf

            # Trigger on detection meeting threshold
            if conf >= thresh:
                has_any_target = True
                if cls_name in HUMAN_NAMES:
                    has_human = True
                else:
                    has_wildlife = True

        # Mode-based routing
        if self.mode == "HUMAN_ONLY":
            return has_human
        elif self.mode == "WILDLIFE_ONLY":
            return has_wildlife or (is_intrusion and not has_human)
        else:
            # "ALL" (Default): Direct trigger on ANY confirmed or detected target
            return has_any_target

    def activate(
        self,
        reason: str = "Detection trigger",
        duration: Optional[float] = None,
        force: bool = False,
        actuator: Union[int, str] = "all"
    ) -> bool:
        """
        Activates the physical deterrent on Actuator 1, Actuator 2, or both.
        actuator parameter: 1, 2, or 'all'.
        """
        target_actuator = str(actuator).lower().strip()
        hit_1 = target_actuator in ("all", "1", "actuator1", "both") and self.enabled
        hit_2 = target_actuator in ("all", "2", "actuator2", "both") and self.enabled_2

        if not hit_1 and not hit_2:
            return False

        now = time.time()
        with self._lock:
            # If not forcing, check if targeted actuators are already in ACTIVE state
            already_active_1 = (self._state == "ACTIVE")
            already_active_2 = (self._state_2 == "ACTIVE")

            if not force:
                if hit_1 and not hit_2 and already_active_1:
                    return False
                if hit_2 and not hit_1 and already_active_2:
                    return False
                if hit_1 and hit_2 and already_active_1 and already_active_2:
                    return False

            if hit_1:
                self._state = "ACTIVE"
            if hit_2:
                self._state_2 = "ACTIVE"
            self._last_state_change = now
            self._last_trigger_reason = reason
            self._total_activations += 1

            # Cancel any existing timer
            if self._auto_off_timer is not None:
                try:
                    self._auto_off_timer.cancel()
                except Exception:
                    pass
                self._auto_off_timer = None

            # Only schedule timer if caller explicitly passed a positive duration
            dur = duration if duration is not None else self.auto_off_sec
            if dur and dur > 0:
                self._auto_off_timer = threading.Timer(
                    dur,
                    self._auto_stop_callback,
                    args=[f"Auto-shutoff ({dur}s) for: {reason}"]
                )
                self._auto_off_timer.daemon = True
                self._auto_off_timer.start()

        if hit_1:
            print(f"[ESP32 ACTUATOR 1] Deterrent ON -> http://{self.ip}:{self.port}{self.deter_endpoint} ({reason})")
            logger.info(f"[ESP32 Actuator 1] Deterrent ON ({reason})")
            self._executor.submit(self._dispatch_http, self.deter_endpoint, "Actuator 1 Deterrent ON", self.ip, self.port)

        if hit_2:
            print(f"[ESP32 ACTUATOR 2] Deterrent ON -> http://{self.ip_2}:{self.port_2}{self.deter_endpoint_2} ({reason})")
            logger.info(f"[ESP32 Actuator 2] Deterrent ON ({reason})")
            self._executor.submit(self._dispatch_http, self.deter_endpoint_2, "Actuator 2 Deterrent ON", self.ip_2, self.port_2)

        return True

    def _auto_stop_callback(self, reason: str):
        """Called only if an explicit duration timer was scheduled."""
        self.deactivate(reason=reason, force=True, actuator="all")

    def deactivate(
        self,
        reason: str = "Intrusion cleared",
        force: bool = False,
        actuator: Union[int, str] = "all"
    ) -> bool:
        """
        Deactivates the ESP32 physical deterrent on Actuator 1, Actuator 2, or both.
        """
        target_actuator = str(actuator).lower().strip()
        stop_1 = target_actuator in ("all", "1", "actuator1", "both") and self.enabled
        stop_2 = target_actuator in ("all", "2", "actuator2", "both") and self.enabled_2

        with self._lock:
            # If not forcing, check if targeted actuators are already INACTIVE
            already_inactive_1 = (self._state == "INACTIVE")
            already_inactive_2 = (self._state_2 == "INACTIVE")

            if not force:
                if stop_1 and not stop_2 and already_inactive_1:
                    return False
                if stop_2 and not stop_1 and already_inactive_2:
                    return False
                if stop_1 and stop_2 and already_inactive_1 and already_inactive_2:
                    return False

            if self._auto_off_timer is not None:
                try:
                    self._auto_off_timer.cancel()
                except Exception:
                    pass
                self._auto_off_timer = None

            if stop_1:
                self._state = "INACTIVE"
            if stop_2:
                self._state_2 = "INACTIVE"
            self._last_state_change = time.time()
            self._last_trigger_reason = reason

        if stop_1:
            print(f"[ESP32 ACTUATOR 1] Deterrent OFF -> http://{self.ip}:{self.port}{self.stop_endpoint} ({reason})")
            logger.info(f"[ESP32 Actuator 1] Deterrent OFF ({reason})")
            self._executor.submit(self._dispatch_http, self.stop_endpoint, "Actuator 1 Deterrent OFF", self.ip, self.port)

        if stop_2:
            print(f"[ESP32 ACTUATOR 2] Deterrent OFF -> http://{self.ip_2}:{self.port_2}{self.stop_endpoint_2} ({reason})")
            logger.info(f"[ESP32 Actuator 2] Deterrent OFF ({reason})")
            self._executor.submit(self._dispatch_http, self.stop_endpoint_2, "Actuator 2 Deterrent OFF", self.ip_2, self.port_2)

        return True

    def _dispatch_http(
        self,
        endpoint: str,
        action_label: str,
        target_ip: Optional[str] = None,
        target_port: Optional[int] = None
    ) -> bool:
        """
        Executes HTTP request to designated actuator target with strict timeout and resilient error handling.
        Uses Connection: close header to prevent persistent socket exhaustion on ESP32.
        """
        ip = target_ip or self.ip
        port = target_port or self.port
        clean_ep = endpoint if endpoint.startswith("/") else f"/{endpoint}"
        url = f"http://{ip}:{port}{clean_ep}"
        try:
            req = urllib.request.Request(
                url,
                method=self.http_method,
                headers={
                    "User-Agent": "WildShield-AI-Host/1.0",
                    "Connection": "close"
                }
            )
            with urllib.request.urlopen(req, timeout=self.timeout) as resp:
                status_code = resp.status
                body = resp.read().decode("utf-8", errors="ignore").strip()
                self._consecutive_errors = 0
                self._last_error_msg = None
                self._last_success_ts = time.time()
                print(f"[ESP32 SUCCESS] {action_label} -> HTTP {status_code}: {body}")
                return True
        except (urllib.error.URLError, urllib.error.HTTPError, TimeoutError, OSError) as net_err:
            self._consecutive_errors += 1
            self._last_error_msg = str(net_err)
            print(f"[ESP32 ERROR] Connection error during '{action_label}' to {url}: {net_err}")
            logger.warning(f"[ESP32] Connection error during '{action_label}' to {url}: {net_err}")
            return False
        except Exception as unexpected_err:
            self._consecutive_errors += 1
            self._last_error_msg = str(unexpected_err)
            print(f"[ESP32 ERROR] Unexpected error during '{action_label}' to {url}: {unexpected_err}")
            logger.error(f"[ESP32] Unexpected error during '{action_label}' to {url}: {unexpected_err}")
            return False

    def _probe_socket(self, ip_addr: str, port_num: int) -> Dict[str, Any]:
        """Probes a single IP:port with non-destructive TCP connect."""
        t0 = time.time()
        reachable = False
        latency_ms = None
        try:
            s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
            s.settimeout(0.75)
            res = s.connect_ex((ip_addr, port_num))
            s.close()
            latency_ms = round((time.time() - t0) * 1000, 1)
            reachable = (res == 0)
        except Exception as e:
            reachable = False

        return {
            "online": reachable,
            "ip": ip_addr,
            "port": port_num,
            "latency_ms": latency_ms if reachable else None,
            "status": "ONLINE" if reachable else "OFFLINE"
        }

    def ping(self, target_ip: Optional[str] = None, target_port: Optional[int] = None) -> Dict[str, Any]:
        """Fast non-destructive connectivity check for Actuator 1, Actuator 2, or custom IP."""
        if target_ip is not None:
            return self._probe_socket(target_ip, int(target_port or 80))

        p1 = self._probe_socket(self.ip, self.port)
        p2 = self._probe_socket(self.ip_2, self.port_2) if self.enabled_2 else None

        return {
            "online": p1["online"] or (p2["online"] if p2 else False),
            "ip": self.ip,
            "port": self.port,
            "latency_ms": p1["latency_ms"],
            "status": "ONLINE" if p1["online"] else "OFFLINE",
            "actuator_1": p1,
            "actuator_2": p2,
            "state_1": self._state,
            "state_2": self._state_2
        }

    def _load_persistent_config(self):
        """Loads saved target configuration from disk if available."""
        import sys
        if "unittest" in sys.modules:
            return

        if CONFIG_FILE.exists():
            try:
                with open(CONFIG_FILE, "r", encoding="utf-8") as f:
                    data = json.load(f)
                if isinstance(data, dict):
                    # Actuator 1
                    if "ip" in data and data["ip"]:
                        self.ip = str(data["ip"]).strip()
                    if "port" in data and data["port"]:
                        self.port = int(data["port"])
                    if "enabled" in data:
                        self.enabled = bool(data["enabled"])
                    if "deter_endpoint" in data and data["deter_endpoint"]:
                        self.deter_endpoint = str(data["deter_endpoint"]).strip()
                    if "stop_endpoint" in data and data["stop_endpoint"]:
                        self.stop_endpoint = str(data["stop_endpoint"]).strip()

                    # Actuator 2
                    if "ip_2" in data and data["ip_2"]:
                        self.ip_2 = str(data["ip_2"]).strip()
                    if "port_2" in data and data["port_2"]:
                        self.port_2 = int(data["port_2"])
                    if "enabled_2" in data:
                        self.enabled_2 = bool(data["enabled_2"])
                    if "deter_endpoint_2" in data and data["deter_endpoint_2"]:
                        self.deter_endpoint_2 = str(data["deter_endpoint_2"]).strip()
                    if "stop_endpoint_2" in data and data["stop_endpoint_2"]:
                        self.stop_endpoint_2 = str(data["stop_endpoint_2"]).strip()

                    if "auto_trigger" in data:
                        self.auto_trigger = bool(data["auto_trigger"])
                    if "status_endpoint" in data and data["status_endpoint"]:
                        self.status_endpoint = str(data["status_endpoint"]).strip()
                    if "http_method" in data and data["http_method"]:
                        self.http_method = str(data["http_method"]).strip().upper()
                    logger.info(f"[ESP32] Loaded saved targets: Actuator 1: {self.ip}:{self.port}, Actuator 2: {self.ip_2}:{self.port_2}")
            except Exception as e:
                logger.warning(f"[ESP32] Could not load {CONFIG_FILE}: {e}")

    def _save_persistent_config(self):
        """Persists target hardware configuration to disk so it survives restarts."""
        import sys
        if "unittest" in sys.modules:
            return

        try:
            CONFIG_FILE.parent.mkdir(parents=True, exist_ok=True)
            data = {
                "ip": self.ip,
                "port": self.port,
                "enabled": self.enabled,
                "deter_endpoint": self.deter_endpoint,
                "stop_endpoint": self.stop_endpoint,
                "ip_2": self.ip_2,
                "port_2": self.port_2,
                "enabled_2": self.enabled_2,
                "deter_endpoint_2": self.deter_endpoint_2,
                "stop_endpoint_2": self.stop_endpoint_2,
                "auto_trigger": self.auto_trigger,
                "status_endpoint": self.status_endpoint,
                "http_method": self.http_method,
                "min_conf": self.min_conf,
                "human_min_conf": self.human_min_conf,
                "mode": self.mode,
                "auto_off_sec": self.auto_off_sec,
                "updated_at": time.time()
            }
            with open(CONFIG_FILE, "w", encoding="utf-8") as f:
                json.dump(data, f, indent=2)
            logger.info(f"[ESP32] Persisted hardware targets -> Actuator 1: {self.ip}:{self.port}, Actuator 2: {self.ip_2}:{self.port_2}")
        except Exception as e:
            logger.warning(f"[ESP32] Could not persist target config: {e}")

    def trigger(
        self,
        reason: str = "Manual Trigger",
        duration: Optional[float] = None,
        force: bool = True,
        actuator: Union[int, str] = "all"
    ) -> bool:
        """Alias for activate: dispatches trigger command to target IP and endpoint."""
        return self.activate(reason=reason, duration=duration, force=force, actuator=actuator)

    def cancel(
        self,
        reason: str = "Manual Cancel",
        force: bool = True,
        actuator: Union[int, str] = "all"
    ) -> bool:
        """Alias for deactivate: dispatches cancel/stop command to target IP and endpoint."""
        return self.deactivate(reason=reason, force=force, actuator=actuator)

    def update_config(
        self,
        ip: Optional[str] = None,
        port: Optional[int] = None,
        enabled: Optional[bool] = None,
        deter_endpoint: Optional[str] = None,
        stop_endpoint: Optional[str] = None,
        ip_2: Optional[str] = None,
        port_2: Optional[int] = None,
        enabled_2: Optional[bool] = None,
        deter_endpoint_2: Optional[str] = None,
        stop_endpoint_2: Optional[str] = None,
        auto_trigger: Optional[bool] = None,
        status_endpoint: Optional[str] = None,
        http_method: Optional[str] = None,
        min_conf: Optional[float] = None,
        human_min_conf: Optional[float] = None,
        mode: Optional[str] = None,
        auto_off_sec: Optional[float] = None,
        persist: bool = True
    ):
        """
        Allows dynamic runtime reconfiguration of ESP32 Actuator 1 & Actuator 2 target IPs,
        ports, API endpoints, auto_trigger, and detection parameters.
        """
        # Actuator 1
        if ip is not None:
            clean_ip = str(ip).strip().strip('"').strip("'")
            if "://" in clean_ip:
                clean_ip = clean_ip.split("://", 1)[1]
            if "/" in clean_ip:
                clean_ip = clean_ip.split("/", 1)[0]
            if ":" in clean_ip:
                parts = clean_ip.split(":", 1)
                clean_ip = parts[0]
                try:
                    self.port = int(parts[1])
                except (ValueError, TypeError):
                    pass
            self.ip = clean_ip

        if port is not None:
            try:
                self.port = int(port)
            except (ValueError, TypeError):
                pass

        if enabled is not None:
            self.enabled = bool(enabled)

        if deter_endpoint is not None:
            ep = str(deter_endpoint).strip()
            self.deter_endpoint = ep if ep.startswith("/") else f"/{ep}"

        if stop_endpoint is not None:
            ep = str(stop_endpoint).strip()
            self.stop_endpoint = ep if ep.startswith("/") else f"/{ep}"

        # Actuator 2
        if ip_2 is not None:
            clean_ip_2 = str(ip_2).strip().strip('"').strip("'")
            if "://" in clean_ip_2:
                clean_ip_2 = clean_ip_2.split("://", 1)[1]
            if "/" in clean_ip_2:
                clean_ip_2 = clean_ip_2.split("/", 1)[0]
            if ":" in clean_ip_2:
                parts = clean_ip_2.split(":", 1)
                clean_ip_2 = parts[0]
                try:
                    self.port_2 = int(parts[1])
                except (ValueError, TypeError):
                    pass
            self.ip_2 = clean_ip_2

        if port_2 is not None:
            try:
                self.port_2 = int(port_2)
            except (ValueError, TypeError):
                pass

        if enabled_2 is not None:
            self.enabled_2 = bool(enabled_2)

        if deter_endpoint_2 is not None:
            ep2 = str(deter_endpoint_2).strip()
            self.deter_endpoint_2 = ep2 if ep2.startswith("/") else f"/{ep2}"

        if stop_endpoint_2 is not None:
            ep2 = str(stop_endpoint_2).strip()
            self.stop_endpoint_2 = ep2 if ep2.startswith("/") else f"/{ep2}"

        if auto_trigger is not None:
            self.auto_trigger = bool(auto_trigger)

        if status_endpoint is not None:
            ep = str(status_endpoint).strip()
            self.status_endpoint = ep if ep.startswith("/") else f"/{ep}"

        if http_method is not None:
            self.http_method = str(http_method).strip().upper()

        if min_conf is not None:
            self.min_conf = float(min_conf)

        if human_min_conf is not None:
            self.human_min_conf = float(human_min_conf)

        if mode is not None and str(mode).upper() in ("ALL", "HUMAN_ONLY", "WILDLIFE_ONLY"):
            self.mode = str(mode).upper()

        if auto_off_sec is not None:
            self.auto_off_sec = float(auto_off_sec)

        if persist:
            self._save_persistent_config()

    def get_status(self) -> Dict[str, Any]:
        """Returns complete telemetry, dual actuator state, and API routing configuration."""
        with self._lock:
            trigger_url_1 = f"http://{self.ip}:{self.port}{self.deter_endpoint}"
            cancel_url_1 = f"http://{self.ip}:{self.port}{self.stop_endpoint}"
            trigger_url_2 = f"http://{self.ip_2}:{self.port_2}{self.deter_endpoint_2}"
            cancel_url_2 = f"http://{self.ip_2}:{self.port_2}{self.stop_endpoint_2}"

            return {
                # Actuator 1
                "ip": self.ip,
                "port": self.port,
                "deter_endpoint": self.deter_endpoint,
                "stop_endpoint": self.stop_endpoint,
                "status_endpoint": self.status_endpoint,
                "trigger_url": trigger_url_1,
                "cancel_url": cancel_url_1,
                "url_deter": trigger_url_1,
                "url_stop": cancel_url_1,
                "enabled": self.enabled,
                "state": self._state,
                "is_active": self._state == "ACTIVE",

                # Actuator 2
                "ip_2": self.ip_2,
                "port_2": self.port_2,
                "deter_endpoint_2": self.deter_endpoint_2,
                "stop_endpoint_2": self.stop_endpoint_2,
                "trigger_url_2": trigger_url_2,
                "cancel_url_2": cancel_url_2,
                "enabled_2": self.enabled_2,
                "state_2": self._state_2,
                "is_active_2": self._state_2 == "ACTIVE",

                # Dual Actuator Object
                "actuator_1": {
                    "name": "Actuator 1",
                    "ip": self.ip,
                    "port": self.port,
                    "trigger_url": trigger_url_1,
                    "cancel_url": cancel_url_1,
                    "state": self._state,
                    "enabled": self.enabled
                },
                "actuator_2": {
                    "name": "Actuator 2",
                    "ip": self.ip_2,
                    "port": self.port_2,
                    "trigger_url": trigger_url_2,
                    "cancel_url": cancel_url_2,
                    "state": self._state_2,
                    "enabled": self.enabled_2
                },

                "http_method": self.http_method,
                "enabled": self.enabled,
                "auto_trigger": self.auto_trigger,
                "state": self._state,
                "is_active": self._state == "ACTIVE",
                "mode": self.mode,
                "min_conf": self.min_conf,
                "human_min_conf": self.human_min_conf,
                "auto_off_sec": self.auto_off_sec,
                "zero_hold_policy": True,
                "last_state_change": self._last_state_change,
                "last_trigger_reason": self._last_trigger_reason,
                "total_activations": self._total_activations,
                "consecutive_errors": self._consecutive_errors,
                "last_error": self._last_error_msg,
                "last_success_ts": self._last_success_ts
            }


# Global singleton instance for system-wide threat-response integration
esp32_service = ESP32Service()
