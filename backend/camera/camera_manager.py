"""
WildShield AI - Camera Manager Module
Phase 1: Camera Input & Camera Manager

Provides an abstract, production-grade interface for video frame acquisition
across local webcams, USB cameras, and network streams (RTSP/HTTP/ESP32-CAM).
"""

import enum
import logging
import platform
import time
from typing import Optional, Tuple, Union

import cv2
import numpy as np

from .camera_config import CameraConfig

# Configure module-level logger
logger = logging.getLogger("WildShield.CameraManager")
if not logger.handlers:
    handler = logging.StreamHandler()
    formatter = logging.Formatter(
        "[%(asctime)s] [%(name)s] [%(levelname)s] %(message)s",
        datefmt="%Y-%m-%d %H:%M:%S"
    )
    handler.setFormatter(formatter)
    logger.addHandler(handler)
    logger.setLevel(logging.INFO)


class CameraStatus(enum.Enum):
    """Camera connection lifecycle states."""
    DISCONNECTED = "disconnected"
    CONNECTING = "connecting"
    CONNECTED = "connected"
    ERROR = "error"


class CameraManager:
    """
    Manages camera device lifecycle, frame reading, resolution negotiation,
    and failure recovery for WildShield AI.
    """

    def __init__(self, config: Optional[CameraConfig] = None):
        """
        Initializes the CameraManager with the provided or default configuration.

        Args:
            config (Optional[CameraConfig]): Camera configuration settings.
        """
        self.config: CameraConfig = config if config is not None else CameraConfig()
        self._cap: Optional[cv2.VideoCapture] = None
        self._status: CameraStatus = CameraStatus.DISCONNECTED
        self._consecutive_failures: int = 0
        self._actual_width: int = 0
        self._actual_height: int = 0
        self._actual_fps: float = 0.0
        self._last_frame_time: float = 0.0
        self._frame_count: int = 0

    @property
    def status(self) -> CameraStatus:
        """Returns current camera status."""
        return self._status

    @property
    def is_connected(self) -> bool:
        """Returns True if the camera is actively connected and capturing."""
        if str(self.config.source).lower() in ("mock", "synthetic", "test_pattern"):
            return self._status == CameraStatus.CONNECTED
        return self._status == CameraStatus.CONNECTED and self._cap is not None and self._cap.isOpened()

    def connect(self) -> bool:
        """
        Connects to the configured camera source and configures video properties.
        Attempts to set requested resolution gracefully without crashing on failure.

        Returns:
            bool: True if connection succeeded, False otherwise.
        """
        self._status = CameraStatus.CONNECTING
        logger.info(
            f"Connecting to camera source '{self.config.source}' ({self.config.name})..."
        )

        try:
            # Handle mock/synthetic source for test environments without hardware
            if str(self.config.source).lower() in ("mock", "synthetic", "test_pattern"):
                self._status = CameraStatus.CONNECTED
                self._actual_width = self.config.target_width
                self._actual_height = self.config.target_height
                self._actual_fps = float(self.config.target_fps)
                self._consecutive_failures = 0
                self._last_frame_time = time.time()
                logger.info(
                    f"Mock synthetic camera initialized: {self._actual_width}x{self._actual_height} @ {self._actual_fps} FPS"
                )
                return True

            self._cap = self._open_capture_device()

            # Check if camera opened successfully
            if not self._cap or not self._cap.isOpened():
                self._status = CameraStatus.ERROR
                logger.error(
                    f"Failed to open camera source: '{self.config.source}'. "
                    "Ensure the webcam device is plugged in, not in use by another app, "
                    "or verify the stream URL / file path."
                )
                return False

            # Configure requested resolution and properties
            self._apply_camera_properties()

            # Query actual physical/stream properties
            self._actual_width = int(self._cap.get(cv2.CAP_PROP_FRAME_WIDTH)) or 640
            self._actual_height = int(self._cap.get(cv2.CAP_PROP_FRAME_HEIGHT)) or 480
            self._actual_fps = float(self._cap.get(cv2.CAP_PROP_FPS)) or 30.0

            # Validate by reading a test frame (with retry warmup)
            success = False
            test_frame = None
            for _ in range(5):
                try:
                    success, test_frame = self._cap.read()
                    if success and test_frame is not None and test_frame.size > 0:
                        break
                except Exception:
                    pass
                time.sleep(0.05)

            if not success or test_frame is None:
                self._status = CameraStatus.ERROR
                logger.error(
                    f"Camera opened on source '{self.config.source}', but failed to read initial frame."
                )
                self.release()
                return False

            # Update actual dimensions from test frame if available
            if test_frame is not None:
                self._actual_height, self._actual_width = test_frame.shape[:2]

            self._status = CameraStatus.CONNECTED
            self._consecutive_failures = 0
            self._last_frame_time = time.time()

            logger.info(
                f"Camera connected successfully! Resolution: {self._actual_width}x{self._actual_height}, "
                f"FPS: {self._actual_fps:.1f}, Source: '{self.config.source}'"
            )
            return True

        except Exception as e:
            self._status = CameraStatus.ERROR
            logger.exception(f"Unexpected error during camera connection: {e}")
            self.release()
            return False

    def _open_capture_device(self) -> Optional[cv2.VideoCapture]:
        """
        Attempts to open VideoCapture using appropriate platform backends with fallback.
        """
        if isinstance(self.config.source, int):
            # For integer hardware indices, test backends in preferred order
            backends = [cv2.CAP_ANY]
            if platform.system() == "Windows":
                # Prefer DirectShow (CAP_DSHOW) for hardware webcams and OBS Virtual Camera, then MSMF
                backends = [cv2.CAP_DSHOW, cv2.CAP_MSMF, cv2.CAP_ANY]
            elif platform.system() == "Linux":
                backends = [cv2.CAP_V4L2, cv2.CAP_ANY]

            for backend in backends:
                try:
                    cap = cv2.VideoCapture(self.config.source, backend)
                    if cap and cap.isOpened():
                        # Warmup test
                        for _ in range(3):
                            ret, frame = cap.read()
                            if ret and frame is not None:
                                return cap
                            time.sleep(0.05)
                    if cap:
                        cap.release()
                except Exception:
                    continue
            return None
        else:
            # String URL or video file path
            return cv2.VideoCapture(self.config.source)

    def _generate_synthetic_frame(self) -> np.ndarray:
        """Generates a synthetic surveillance test frame for demo/testing purposes."""
        h, w = self._actual_height or 720, self._actual_width or 1280
        frame = np.zeros((h, w, 3), dtype=np.uint8)
        
        # Background gradient
        for y in range(h):
            val = int(20 + 30 * (y / h))
            frame[y, :] = (val, val + 10, val + 5)

        # Draw grid lines to simulate perimeter grid
        for gx in range(0, w, 80):
            cv2.line(frame, (gx, 0), (gx, h), (40, 50, 45), 1)
        for gy in range(0, h, 60):
            cv2.line(frame, (0, gy), (w, gy), (40, 50, 45), 1)

        # Draw simulated timestamp & synthetic tag
        timestamp_str = time.strftime("%Y-%m-%d %H:%M:%S")
        cv2.putText(
            frame,
            f"[SYNTHETIC SURVEILLANCE FEED] - {timestamp_str}",
            (30, h - 50),
            cv2.FONT_HERSHEY_SIMPLEX,
            0.6,
            (100, 255, 150),
            1,
            cv2.LINE_AA
        )

        # Draw a moving mock perimeter marker
        t = time.time()
        mx = int((w / 2) + np.sin(t * 1.5) * (w / 4))
        my = int((h / 2) + np.cos(t * 1.5) * (h / 4))
        cv2.circle(frame, (mx, my), 24, (0, 215, 255), 2)
        cv2.putText(
            frame,
            "PERIMETER SENSOR SIM",
            (mx - 80, my - 32),
            cv2.FONT_HERSHEY_SIMPLEX,
            0.45,
            (0, 215, 255),
            1,
            cv2.LINE_AA
        )

        return frame

    def _apply_camera_properties(self) -> None:
        """
        Attempts to apply target resolution and FPS properties to VideoCapture.
        Catches and logs any backend warnings without throwing exceptions.
        """
        if not self._cap or not self._cap.isOpened():
            return

        # On network streams (URLs) or when using MSMF, don't force unnegotiated frame dimensions
        if self.config.is_network_stream:
            return

        try:
            # Set Target FPS & buffer size
            if self.config.target_fps > 0:
                self._cap.set(cv2.CAP_PROP_FPS, float(self.config.target_fps))
            self._cap.set(cv2.CAP_PROP_BUFFERSIZE, 1)

            # On Windows MSMF backend, setting arbitrary resolutions before initial frame read
            # can invalidate the stream reader. Only apply if explicitly non-default.
            if self.config.target_width != 1280 or self.config.target_height != 720:
                self._cap.set(cv2.CAP_PROP_FRAME_WIDTH, float(self.config.target_width))
                self._cap.set(cv2.CAP_PROP_FRAME_HEIGHT, float(self.config.target_height))

        except Exception as prop_err:
            logger.warning(
                f"Note: Could not set one or more camera hardware properties: {prop_err}. "
                "Defaulting to camera's native hardware settings."
            )

    def read(self) -> Optional[np.ndarray]:
        """
        Primary interface for downstream AI/detection modules (e.g. YOLO in Phase 2).
        Reads and returns the next frame from the camera.

        Returns:
            Optional[np.ndarray]: Captured BGR video frame, or None if read failed.
        """
        success, frame = self.read_with_status()
        return frame if success else None

    def read_with_status(self) -> Tuple[bool, Optional[np.ndarray]]:
        """
        Reads the next frame and returns an explicit (success_flag, frame) tuple.
        Gracefully tracks consecutive read failures and transitions state to ERROR
        if failures exceed the configured threshold.

        Returns:
            Tuple[bool, Optional[np.ndarray]]: (True, frame) if successful, (False, None) otherwise.
        """
        if not self.is_connected:
            return False, None

        # Return simulated synthetic frame if mock source
        if str(self.config.source).lower() in ("mock", "synthetic", "test_pattern"):
            self._frame_count += 1
            self._last_frame_time = time.time()
            return True, self._generate_synthetic_frame()

        if self._cap is None:
            return False, None

        try:
            success, frame = self._cap.read()

            # Automatic loop for video files when end-of-file is reached
            if not success and self.config.is_video_file:
                total_frames = self._cap.get(cv2.CAP_PROP_FRAME_COUNT)
                if total_frames > 0:
                    self._cap.set(cv2.CAP_PROP_POS_FRAMES, 0)
                    success, frame = self._cap.read()

            if success and frame is not None and frame.size > 0:
                self._consecutive_failures = 0
                self._frame_count += 1
                self._last_frame_time = time.time()
                return True, frame
            else:
                self._consecutive_failures += 1
                logger.warning(
                    f"Failed to grab frame (consecutive failures: {self._consecutive_failures}/{self.config.max_consecutive_failures})"
                )

                if self._consecutive_failures >= self.config.max_consecutive_failures:
                    self._status = CameraStatus.ERROR
                    logger.error(
                        f"Exceeded max consecutive frame read failures ({self.config.max_consecutive_failures}). "
                        "Marking camera status as ERROR."
                    )

                return False, None

        except Exception as e:
            self._consecutive_failures += 1
            logger.error(f"Exception during frame capture: {e}")
            if self._consecutive_failures >= self.config.max_consecutive_failures:
                self._status = CameraStatus.ERROR
            return False, None

    def get_resolution(self) -> Tuple[int, int]:
        """
        Returns the active camera frame resolution.

        Returns:
            Tuple[int, int]: (width, height) in pixels.
        """
        return (self._actual_width, self._actual_height)

    def get_fps(self) -> float:
        """
        Returns the reported frame rate from the video capture device.

        Returns:
            float: Frames per second.
        """
        return self._actual_fps

    @staticmethod
    def find_available_cameras(max_tested: int = 6) -> list:
        """
        Probes local camera indices (0 to max_tested - 1) and returns a list of available device indices.
        Useful for auto-detecting DroidCam virtual camera or external webcams.

        Returns:
            list: List of dicts with camera index and availability.
        """
        available = []
        for idx in range(max_tested):
            cap = None
            try:
                if platform.system() == "Windows":
                    cap = cv2.VideoCapture(idx, cv2.CAP_MSMF)
                    if not cap or not cap.isOpened():
                        if cap:
                            cap.release()
                        cap = cv2.VideoCapture(idx, cv2.CAP_DSHOW)
                else:
                    cap = cv2.VideoCapture(idx)

                if cap and cap.isOpened():
                    ret, _ = cap.read()
                    w = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH)) or 640
                    h = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT)) or 480
                    available.append({
                        "index": idx,
                        "width": w,
                        "height": h,
                        "label": f"Camera Device {idx}" + (" (DroidCam / External)" if idx > 0 else " (Integrated / Primary)")
                    })
            except Exception:
                pass
            finally:
                if cap:
                    cap.release()
        return available

    def get_source_info(self) -> str:
        """
        Returns a human-readable descriptor of the active camera source.

        Returns:
            str: Description of camera source (e.g. 'Webcam (Device 0)' or 'Network Stream').
        """
        if self.config.is_usb_or_builtin:
            if isinstance(self.config.source, int) and self.config.source == 1:
                return f"V380 Pro -> OBS Virtual Camera (Index {self.config.source})"
            if isinstance(self.config.source, int) and self.config.source > 1:
                return f"External/DroidCam Device (Index {self.config.source})"
            return f"Built-in/USB Webcam (Index {self.config.source})"
        elif self.config.is_network_stream:
            if "4747" in str(self.config.source):
                return f"DroidCam WiFi Stream ({self.config.source})"
            return f"Network Stream ({self.config.source})"
        else:
            return f"Custom Source ({self.config.source})"

    def release(self) -> None:
        """
        Gracefully releases the VideoCapture hardware device and updates status.
        Safe to call multiple times.
        """
        if self._cap is not None:
            try:
                self._cap.release()
                logger.info(f"Released camera device '{self.config.source}'.")
            except Exception as e:
                logger.warning(f"Error while releasing camera: {e}")
            finally:
                self._cap = None

        if self._status != CameraStatus.ERROR:
            self._status = CameraStatus.DISCONNECTED

    def __enter__(self) -> "CameraManager":
        """Context manager entry point."""
        self.connect()
        return self

    def __exit__(self, exc_type, exc_val, exc_tb) -> None:
        """Context manager exit point ensuring clean hardware release."""
        self.release()
