"""
WildShield AI - Camera Configuration Module
Phase 1: Camera Input & Camera Manager

Defines configuration settings for camera sources (laptop webcam, USB camera,
RTSP/HTTP network streams, or ESP32-CAM).
"""

import os
from dataclasses import dataclass
from typing import Union

# Default Configuration Constants (Targeting Primary Hardware Webcam or OBS/DroidCam Bridge)
DEFAULT_CAMERA_ID: int = int(os.getenv("WILDSHIELD_CAMERA_SOURCE", "0"))
DEFAULT_FRAME_WIDTH: int = 640
DEFAULT_FRAME_HEIGHT: int = 480
DEFAULT_FPS: int = 30
DEFAULT_MAX_CONSECUTIVE_FAILURES: int = 10


@dataclass
class CameraConfig:
    """
    Configuration dataclass for camera connection and capture parameters.
    
    Attributes:
        source (Union[int, str]): Camera device index (e.g., 0 for built-in webcam)
                                  or stream URL (e.g., 'rtsp://...', 'http://...').
        target_width (int): Desired frame width in pixels.
        target_height (int): Desired frame height in pixels.
        target_fps (int): Desired capture frames per second.
        max_consecutive_failures (int): Number of consecutive read failures before
                                        marking camera status as ERROR.
        name (str): Friendly name/label for the camera source.
    """
    source: Union[int, str] = DEFAULT_CAMERA_ID
    target_width: int = DEFAULT_FRAME_WIDTH
    target_height: int = DEFAULT_FRAME_HEIGHT
    target_fps: int = DEFAULT_FPS
    max_consecutive_failures: int = DEFAULT_MAX_CONSECUTIVE_FAILURES
    name: str = "Primary Camera"

    @property
    def is_network_stream(self) -> bool:
        """Returns True if the camera source is a network URL (RTSP/HTTP/ESP32)."""
        if isinstance(self.source, str):
            source_lower = self.source.lower()
            return source_lower.startswith(("rtsp://", "http://", "https://", "udp://"))
        return False

    @property
    def is_video_file(self) -> bool:
        """Returns True if the source points to a local video file (.mp4, .avi, etc.)."""
        if isinstance(self.source, str) and not self.is_network_stream:
            return self.source.lower().endswith((".mp4", ".avi", ".mov", ".mkv", ".wmv", ".webm"))
        return False

    @property
    def is_usb_or_builtin(self) -> bool:
        """Returns True if the source is an integer hardware device index."""
        return isinstance(self.source, int)

    @property
    def is_obs_virtual_cam(self) -> bool:
        """Returns True if source represents the OBS Virtual Camera bridge (Index 2 or OBS in name)."""
        if isinstance(self.source, int) and self.source == 2:
            return True
        return "obs" in str(self.name).lower() or "v380" in str(self.name).lower()

    @property
    def is_droidcam(self) -> bool:
        """Returns True if source indicates a DroidCam virtual camera or DroidCam stream."""
        if isinstance(self.source, int) and self.source > 0 and not self.is_obs_virtual_cam:
            return True
        if isinstance(self.source, str) and ("4747" in self.source or "droid" in self.source.lower()):
            return True
        return "droid" in self.name.lower()

    @classmethod
    def from_env(cls, custom_source: Union[int, str, None] = None) -> "CameraConfig":
        """
        Loads camera configuration from environment variables or custom parameters,
        falling back to defaults.
        """
        if custom_source is not None:
            raw_source = str(custom_source)
        else:
            raw_source = os.getenv("WILDSHIELD_CAMERA_SOURCE", str(DEFAULT_CAMERA_ID))
        
        # Parse source as int if numeric, otherwise treat as stream URL or file path
        try:
            source: Union[int, str] = int(raw_source)
        except ValueError:
            source = raw_source

        width = int(os.getenv("WILDSHIELD_FRAME_WIDTH", str(DEFAULT_FRAME_WIDTH)))
        height = int(os.getenv("WILDSHIELD_FRAME_HEIGHT", str(DEFAULT_FRAME_HEIGHT)))
        fps = int(os.getenv("WILDSHIELD_FRAME_FPS", str(DEFAULT_FPS)))
        failures = int(os.getenv("WILDSHIELD_MAX_FAILURES", str(DEFAULT_MAX_CONSECUTIVE_FAILURES)))
        name = os.getenv("WILDSHIELD_CAMERA_NAME", "Primary Camera")

        return cls(
            source=source,
            target_width=width,
            target_height=height,
            target_fps=fps,
            max_consecutive_failures=failures,
            name=name
        )
