import os
import sys
from pathlib import Path
import unittest
from unittest.mock import MagicMock, patch

# Ensure backend directory is in sys.path
CURRENT_DIR = Path(__file__).resolve().parent
if str(CURRENT_DIR) not in sys.path:
    sys.path.insert(0, str(CURRENT_DIR))

import numpy as np

from camera import CameraConfig, CameraManager, CameraStatus


class TestCameraConfig(unittest.TestCase):
    """Tests for CameraConfig initialization and environment variable loading."""

    def test_default_values(self):
        config = CameraConfig()
        self.assertEqual(config.source, 1)
        self.assertEqual(config.target_width, 640)
        self.assertEqual(config.target_height, 480)
        self.assertEqual(config.target_fps, 30)
        self.assertEqual(config.max_consecutive_failures, 10)
        self.assertTrue(config.is_usb_or_builtin)
        self.assertFalse(config.is_network_stream)

    def test_network_stream_source(self):
        config = CameraConfig(source="http://192.168.1.100:81/stream", name="ESP32-CAM")
        self.assertTrue(config.is_network_stream)
        self.assertFalse(config.is_usb_or_builtin)

    def test_rtsp_stream_source(self):
        config = CameraConfig(source="rtsp://admin:pass@192.168.1.50:554/ch1", name="IP Camera")
        self.assertTrue(config.is_network_stream)
        self.assertFalse(config.is_usb_or_builtin)

    @patch.dict("os.environ", {
        "WILDSHIELD_CAMERA_SOURCE": "1",
        "WILDSHIELD_FRAME_WIDTH": "1920",
        "WILDSHIELD_FRAME_HEIGHT": "1080",
        "WILDSHIELD_FRAME_FPS": "60",
        "WILDSHIELD_MAX_FAILURES": "5",
        "WILDSHIELD_CAMERA_NAME": "External USB Cam"
    })
    def test_from_env_numeric(self):
        config = CameraConfig.from_env()
        self.assertEqual(config.source, 1)
        self.assertEqual(config.target_width, 1920)
        self.assertEqual(config.target_height, 1080)
        self.assertEqual(config.target_fps, 60)
        self.assertEqual(config.max_consecutive_failures, 5)
        self.assertEqual(config.name, "External USB Cam")

    @patch.dict("os.environ", {
        "WILDSHIELD_CAMERA_SOURCE": "http://esp32cam.local/stream",
        "WILDSHIELD_FRAME_WIDTH": "800",
        "WILDSHIELD_FRAME_HEIGHT": "600"
    })
    def test_from_env_url(self):
        config = CameraConfig.from_env()
        self.assertEqual(config.source, "http://esp32cam.local/stream")
        self.assertEqual(config.target_width, 800)
        self.assertEqual(config.target_height, 600)
        self.assertTrue(config.is_network_stream)


class TestCameraManager(unittest.TestCase):
    """Tests for CameraManager logic, connection, frame reading, and error handling."""

    def setUp(self):
        self.config = CameraConfig(source=0, max_consecutive_failures=3)
        self.manager = CameraManager(config=self.config)

    def test_initial_state(self):
        self.assertEqual(self.manager.status, CameraStatus.DISCONNECTED)
        self.assertFalse(self.manager.is_connected)
        self.assertIsNone(self.manager.read())

    @patch("cv2.VideoCapture")
    def test_successful_connect(self, mock_videocapture_cls):
        mock_cap = MagicMock()
        mock_cap.isOpened.return_value = True
        fake_frame = np.zeros((720, 1280, 3), dtype=np.uint8)
        mock_cap.read.return_value = (True, fake_frame)
        mock_cap.get.side_effect = lambda prop: {
            3: 1280,  # CAP_PROP_FRAME_WIDTH
            4: 720,   # CAP_PROP_FRAME_HEIGHT
            5: 30.0   # CAP_PROP_FPS
        }.get(prop, 0.0)

        mock_videocapture_cls.return_value = mock_cap

        result = self.manager.connect()
        self.assertTrue(result)
        self.assertEqual(self.manager.status, CameraStatus.CONNECTED)
        self.assertTrue(self.manager.is_connected)
        self.assertEqual(self.manager.get_resolution(), (1280, 720))

    @patch("cv2.VideoCapture")
    def test_failed_connect_camera_not_opened(self, mock_videocapture_cls):
        mock_cap = MagicMock()
        mock_cap.isOpened.return_value = False
        mock_videocapture_cls.return_value = mock_cap

        result = self.manager.connect()
        self.assertFalse(result)
        self.assertEqual(self.manager.status, CameraStatus.ERROR)
        self.assertFalse(self.manager.is_connected)

    @patch("cv2.VideoCapture")
    def test_read_frame_success(self, mock_videocapture_cls):
        mock_cap = MagicMock()
        mock_cap.isOpened.return_value = True
        fake_frame = np.ones((720, 1280, 3), dtype=np.uint8) * 128
        mock_cap.read.return_value = (True, fake_frame)
        mock_videocapture_cls.return_value = mock_cap

        self.manager.connect()
        frame = self.manager.read()

        self.assertIsNotNone(frame)
        self.assertEqual(frame.shape, (720, 1280, 3))
        self.assertEqual(self.manager.status, CameraStatus.CONNECTED)

    @patch("cv2.VideoCapture")
    def test_consecutive_failure_triggers_error_status(self, mock_videocapture_cls):
        mock_cap = MagicMock()
        mock_cap.isOpened.return_value = True
        fake_frame = np.ones((720, 1280, 3), dtype=np.uint8)
        mock_cap.read.return_value = (True, fake_frame)
        mock_videocapture_cls.return_value = mock_cap

        self.manager.connect()
        self.assertEqual(self.manager.status, CameraStatus.CONNECTED)

        # Simulate frame drops
        mock_cap.read.return_value = (False, None)
        
        # Read 1st failure (< threshold 3)
        f1 = self.manager.read()
        self.assertIsNone(f1)
        self.assertEqual(self.manager.status, CameraStatus.CONNECTED)

        # Read 2nd failure (< threshold 3)
        f2 = self.manager.read()
        self.assertIsNone(f2)
        self.assertEqual(self.manager.status, CameraStatus.CONNECTED)

        # Read 3rd failure (>= threshold 3)
        f3 = self.manager.read()
        self.assertIsNone(f3)
        self.assertEqual(self.manager.status, CameraStatus.ERROR)

    def test_mock_synthetic_camera(self):
        config = CameraConfig(source="mock", target_width=640, target_height=480, target_fps=15)
        manager = CameraManager(config=config)
        
        self.assertTrue(manager.connect())
        self.assertEqual(manager.status, CameraStatus.CONNECTED)
        self.assertEqual(manager.get_resolution(), (640, 480))
        
        frame = manager.read()
        self.assertIsNotNone(frame)
        self.assertEqual(frame.shape, (480, 640, 3))
        
        manager.release()
        self.assertEqual(manager.status, CameraStatus.DISCONNECTED)

    @patch("cv2.VideoCapture")
    def test_context_manager(self, mock_videocapture_cls):
        mock_cap = MagicMock()
        mock_cap.isOpened.return_value = True
        fake_frame = np.ones((720, 1280, 3), dtype=np.uint8)
        mock_cap.read.return_value = (True, fake_frame)
        mock_videocapture_cls.return_value = mock_cap

        with CameraManager(self.config) as cam:
            self.assertTrue(cam.is_connected)
            f = cam.read()
            self.assertIsNotNone(f)

        # After exiting context, camera must be released
        mock_cap.release.assert_called_once()
        self.assertEqual(cam.status, CameraStatus.DISCONNECTED)


if __name__ == "__main__":
    unittest.main()
