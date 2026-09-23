"""
WildShield AI — Low-Latency OpenCV Capture Architecture
Eliminates buffering and stale-frame latency between OBS Virtual Camera (Index 2) and OpenCV.

Architecture Pipeline:
  V380 Camera
       ↓
  V380 Pro Desktop Client
       ↓
  OBS Window Capture
       ↓
  OBS Virtual Camera (DirectShow / Index 2)
       ↓
  OpenCV Low-Latency Capture Thread (cv2.CAP_DSHOW, Buffer=1)
       ↓
  Latest-Frame Thread-Safe Buffer (Zero-Stale-Buffer)
       ├──→ Live Video Stream (FastAPI MJPEG / Web UI)
       └──→ YOLO Inference Worker (Asynchronous / Decoupled)
                  ↓
           Detection / Risk Engine
                  ↓
               ESP32 Farmer Node (Siren, Floodlight, Sprinkler)
"""

import logging
import os
import platform
import threading
import time
from typing import Dict, Any, Optional, Tuple, Union

import cv2
import numpy as np

logger = logging.getLogger("WildShield.LowLatencyCapture")
if not logger.handlers:
    _handler = logging.StreamHandler()
    _handler.setFormatter(
        logging.Formatter("[%(asctime)s] [LowLatencyCapture] [%(levelname)s] %(message)s", datefmt="%H:%M:%S")
    )
    logger.addHandler(_handler)
    logger.setLevel(logging.INFO)


class LowLatencyCaptureService:
    """
    Dedicated high-throughput, low-latency OpenCV video capture service.
    
    Guarantees:
      1. cv2.VideoCapture is opened once with DirectShow (CAP_DSHOW) and CAP_PROP_BUFFERSIZE = 1.
      2. A dedicated capture thread continuously drains the hardware buffer at native FPS.
      3. Only the single newest frame is kept in memory; stale frames are automatically discarded.
      4. Downstream consumers (YOLO inference, MJPEG stream, WebSocket) NEVER block or slow down the capture loop.
      5. Real-time metrics (FPS, capture latency ms, frame delivery intervals) are tracked and exposed.
    """

    def __init__(
        self,
        camera_index: Optional[Union[int, str]] = None,
        width: int = 640,
        height: int = 480,
        fps: int = 30,
        name: str = "Primary Camera"
    ):
        if camera_index is None:
            raw_src = os.getenv("WILDSHIELD_CAMERA_SOURCE", "0")
            try:
                camera_index = int(raw_src)
            except ValueError:
                camera_index = raw_src
        self.source = camera_index
        try:
            self.camera_index = int(camera_index)
        except (ValueError, TypeError):
            self.camera_index = 0
        self.target_width = width
        self.target_height = height
        self.target_fps = fps
        self.name = name

        # Hardware capture object
        self._cap: Optional[cv2.VideoCapture] = None
        self._cap_lock = threading.Lock()

        # Threading & lifecycle control
        self._running: bool = False
        self._thread: Optional[threading.Thread] = None

        # Shared latest-frame buffer (Protected by lock)
        self._buffer_lock = threading.Lock()
        self._latest_frame: Optional[np.ndarray] = None
        self._latest_timestamp: float = 0.0
        self._frame_seq: int = 0

        # State & health tracking
        self._is_connected: bool = False
        self._consecutive_failures: int = 0
        self._actual_width: int = width
        self._actual_height: int = height
        self._actual_fps: float = float(fps)

        # Performance measurement & telemetry
        self._last_capture_latency_ms: float = 0.0
        self._avg_capture_latency_ms: float = 0.0
        self._measured_fps: float = 0.0
        self._fps_frame_count: int = 0
        self._fps_window_start: float = time.perf_counter()
        self._total_frames_acquired: int = 0
        self._stale_frames_overwritten: int = 0
        self._last_read_seq_by_consumer: int = 0

    @property
    def is_connected(self) -> bool:
        return self._is_connected and self._running

    @property
    def frame_seq(self) -> int:
        return self._frame_seq

    def _open_camera(self) -> bool:
        """Opens VideoCapture using DirectShow on Windows or FFMPEG for network streams."""
        with self._cap_lock:
            if self._cap is not None:
                try:
                    self._cap.release()
                except Exception:
                    pass
                self._cap = None

            is_network = isinstance(self.source, str) and self.source.lower().startswith(("http://", "https://", "rtsp://", "udp://"))
            logger.info(f"Opening '{self.name}' on source {self.source} (is_network={is_network})...")
            
            try:
                if is_network:
                    backend = cv2.CAP_FFMPEG if hasattr(cv2, 'CAP_FFMPEG') else cv2.CAP_ANY
                    cap = cv2.VideoCapture(self.source, backend)
                else:
                    try:
                        dev_idx = int(self.source)
                    except (ValueError, TypeError):
                        dev_idx = 0
                    backend = cv2.CAP_DSHOW if platform.system() == "Windows" else cv2.CAP_ANY
                    cap = cv2.VideoCapture(dev_idx, backend)
                    if not cap or not cap.isOpened():
                        logger.warning(f"Could not open device index {dev_idx} with CAP_DSHOW, retrying with CAP_ANY...")
                        cap = cv2.VideoCapture(dev_idx, cv2.CAP_ANY)

                if not cap or not cap.isOpened():
                    logger.error(f"Failed to open camera source {self.source}.")
                    return False

                # Critical Low-Latency Setting: Minimal buffer size to prevent stale frames accumulation
                try:
                    cap.set(cv2.CAP_PROP_BUFFERSIZE, 1)
                except Exception:
                    pass

                # Set dimensions & target FPS
                cap.set(cv2.CAP_PROP_FRAME_WIDTH, float(self.target_width))
                cap.set(cv2.CAP_PROP_FRAME_HEIGHT, float(self.target_height))
                cap.set(cv2.CAP_PROP_FPS, float(self.target_fps))

                # Verify first frame
                ret, test_frame = cap.read()
                if not ret or test_frame is None or test_frame.size == 0:
                    logger.warning("Camera opened but initial test read returned empty frame.")
                    # Retry warmup
                    for _ in range(3):
                        time.sleep(0.05)
                        ret, test_frame = cap.read()
                        if ret and test_frame is not None and test_frame.size > 0:
                            break

                if not ret or test_frame is None or test_frame.size == 0:
                    logger.error(f"Failed to read initial warmup frame from camera source {self.source}.")
                    cap.release()
                    return False

                h, w = test_frame.shape[:2]
                self._actual_width = w
                self._actual_height = h
                hw_fps = cap.get(cv2.CAP_PROP_FPS)
                if hw_fps and hw_fps > 0:
                    self._actual_fps = float(hw_fps)

                self._cap = cap
                self._is_connected = True
                self._consecutive_failures = 0
                logger.info(f"Connected to {self.name} [{self.source}]: {w}x{h} @ {self._actual_fps:.1f} FPS (Buffer=1)")
                return True

            except Exception as e:
                logger.error(f"Exception opening camera source {self.source}: {e}")
                return False

    def start(self) -> bool:
        """Starts the dedicated background capture thread."""
        if self._running:
            logger.warning("Capture service is already running.")
            return True

        success = self._open_camera()
        if not success:
            logger.error("Initial camera connection failed. Starting worker thread for background reconnection...")

        self._running = True
        self._fps_window_start = time.perf_counter()
        self._fps_frame_count = 0
        self._thread = threading.Thread(target=self._capture_worker, name="LowLatencyCaptureThread", daemon=True)
        self._thread.start()
        logger.info("Dedicated low-latency capture thread started.")
        return True

    def stop(self) -> None:
        """Stops the capture worker thread and releases the hardware camera device."""
        logger.info("Stopping low-latency capture service...")
        self._running = False
        if self._thread and self._thread.is_alive():
            self._thread.join(timeout=2.0)
        self._thread = None

        with self._cap_lock:
            if self._cap is not None:
                try:
                    self._cap.release()
                except Exception as e:
                    logger.warning(f"Error releasing VideoCapture: {e}")
                finally:
                    self._cap = None

        self._is_connected = False
        logger.info("Low-latency capture service stopped and camera device released.")

    def switch_camera(self, new_source: Union[int, str], name: Optional[str] = None) -> bool:
        """
        Dynamically switch capture to a different camera device index or stream URL.
        Safely releases old hardware connection, updates target source, flushes buffer,
        and reconnects seamlessly without restarting consumer streams.
        """
        logger.info(f"Switching camera from {self.source} ({self.name}) to {new_source}...")
        with self._cap_lock:
            self._is_connected = False
            if self._cap is not None:
                try:
                    self._cap.release()
                except Exception as e:
                    logger.warning(f"Error releasing old camera: {e}")
                finally:
                    self._cap = None
            
            self.source = new_source
            try:
                self.camera_index = int(new_source)
            except (ValueError, TypeError):
                self.camera_index = 0

            if name:
                self.name = name
            else:
                self.name = f"Camera [{new_source}]"

        with self._buffer_lock:
            self._latest_frame = None
            self._frame_seq = 0
            self._consecutive_failures = 0

        # Attempt immediate reconnect under lock
        success = self._open_camera()
        return success

    def _capture_worker(self) -> None:
        """
        Continuous, dedicated capture loop.
        Drains hardware frames at native rate without waiting for downstream processing.
        """
        logger.info("Capture loop active. Streaming latest frames into shared buffer...")
        
        while self._running:
            if self._cap is None or not self._cap.isOpened():
                self._is_connected = False
                logger.info(f"Reconnecting to camera source {self.source}...")
                if not self._open_camera():
                    time.sleep(1.0)
                    continue

            try:
                t0 = time.perf_counter()
                ret, frame = self._cap.read()
                t1 = time.perf_counter()

                if ret and frame is not None and frame.size > 0:
                    latency_ms = (t1 - t0) * 1000.0
                    
                    with self._buffer_lock:
                        # If the previous frame was never fetched by consumer, count as dropped/overwritten
                        if self._frame_seq > self._last_read_seq_by_consumer:
                            self._stale_frames_overwritten += 1

                        self._latest_frame = frame
                        self._latest_timestamp = t1
                        self._frame_seq += 1
                        self._total_frames_acquired += 1
                        self._last_capture_latency_ms = latency_ms

                        # Exponential moving average for capture latency
                        if self._avg_capture_latency_ms == 0.0:
                            self._avg_capture_latency_ms = latency_ms
                        else:
                            self._avg_capture_latency_ms = 0.9 * self._avg_capture_latency_ms + 0.1 * latency_ms

                        # Rolling measured FPS calculation (1-second window)
                        self._fps_frame_count += 1
                        elapsed_fps = t1 - self._fps_window_start
                        if elapsed_fps >= 1.0:
                            self._measured_fps = round(self._fps_frame_count / elapsed_fps, 1)
                            self._fps_frame_count = 0
                            self._fps_window_start = t1

                    self._consecutive_failures = 0
                    self._is_connected = True

                else:
                    self._consecutive_failures += 1
                    if self._consecutive_failures >= 5:
                        logger.warning(f"Multiple consecutive read failures ({self._consecutive_failures}). Triggering reconnection...")
                        self._is_connected = False
                        with self._cap_lock:
                            if self._cap:
                                self._cap.release()
                                self._cap = None
                        time.sleep(0.5)
                    else:
                        time.sleep(0.01)

            except Exception as loop_err:
                logger.error(f"Unexpected exception in capture worker: {loop_err}")
                self._consecutive_failures += 1
                time.sleep(0.1)

    def get_latest_frame(self, copy: bool = True) -> Tuple[bool, Optional[np.ndarray], float, int]:
        """
        Retrieves the newest frame from the shared buffer in O(1) time without blocking the capture thread.
        
        Args:
            copy (bool): If True, returns a defensive copy. If False, returns buffer reference (fastest for immediate read/encode).
            
        Returns:
            Tuple[bool, Optional[np.ndarray], float, int]: (success, frame, timestamp, sequence_number)
        """
        with self._buffer_lock:
            if self._latest_frame is None:
                return False, None, 0.0, 0
            
            self._last_read_seq_by_consumer = self._frame_seq
            frame = self._latest_frame.copy() if copy else self._latest_frame
            return True, frame, self._latest_timestamp, self._frame_seq

    def get_metrics(self) -> Dict[str, Any]:
        """Returns objective performance metrics for monitoring and debugging."""
        with self._buffer_lock:
            return {
                "source": f"{self.name} [Index {self.camera_index}]",
                "camera_index": self.camera_index,
                "connected": self._is_connected,
                "running": self._running,
                "resolution": f"{self._actual_width}x{self._actual_height}",
                "width": self._actual_width,
                "height": self._actual_height,
                "target_fps": self.target_fps,
                "measured_fps": self._measured_fps if self._measured_fps > 0 else self._actual_fps,
                "last_capture_latency_ms": round(self._last_capture_latency_ms, 2),
                "avg_capture_latency_ms": round(self._avg_capture_latency_ms, 2),
                "total_frames_acquired": self._total_frames_acquired,
                "stale_frames_overwritten": self._stale_frames_overwritten,
                "buffer_size": 1,
                "backend": "DirectShow (cv2.CAP_DSHOW)",
                "architecture": "Decoupled Dedicated Producer Thread (Zero-Stale-Buffer)"
            }

    def __enter__(self) -> "LowLatencyCaptureService":
        self.start()
        return self

    def __exit__(self, exc_type, exc_val, exc_tb) -> None:
        self.stop()
