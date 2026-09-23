"""
WildShield AI - Camera Package
Phase 1: Camera Input & Camera Manager
"""

from .camera_config import (
    CameraConfig,
    DEFAULT_CAMERA_ID,
    DEFAULT_FRAME_WIDTH,
    DEFAULT_FRAME_HEIGHT,
    DEFAULT_FPS,
)
from .camera_manager import (
    CameraManager,
    CameraStatus,
)

from .low_latency_capture import LowLatencyCaptureService

__all__ = [
    "CameraConfig",
    "CameraManager",
    "CameraStatus",
    "LowLatencyCaptureService",
    "DEFAULT_CAMERA_ID",
    "DEFAULT_FRAME_WIDTH",
    "DEFAULT_FRAME_HEIGHT",
    "DEFAULT_FPS",
]
