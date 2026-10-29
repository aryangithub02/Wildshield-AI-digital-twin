"""
Unit & Integration Tests for WildShield AI — ESP32 Smart Deterrent Hardware Integration
Verifies:
  1. Config loading (IP 172.22.103.193, timeout, zero-hold policy, endpoints)
  2. State-driven actuator logic (no repeated requests while in same state)
  3. Direct detection evaluation (any target triggers physical deterrent immediately)
  4. Non-blocking error handling (network timeout / connection error doesn't crash)
  5. Configurable API endpoints & HTTP method
"""

import unittest
from unittest.mock import patch, MagicMock
from backend.services.esp32_service import ESP32Service


class TestESP32Service(unittest.TestCase):
    def setUp(self):
        # Create fresh instance for testing
        self.service = ESP32Service()
        self.service.ip = "192.168.137.211"
        self.service.port = 80
        self.service.timeout = 0.5
        self.service.auto_off_sec = 0.0
        self.service.min_conf = 0.35
        self.service.human_min_conf = 0.35

    def test_default_config(self):
        """Test default IP, zero-hold policy, and endpoints configuration."""
        self.assertEqual(self.service.ip, "192.168.137.211")
        self.assertEqual(self.service.port, 80)
        self.assertEqual(self.service.deter_endpoint, "/siren")
        self.assertEqual(self.service.stop_endpoint, "/stop")
        self.assertEqual(self.service.status_endpoint, "/status")
        self.assertEqual(self.service.auto_off_sec, 0.0)
        self.assertEqual(self.service.state, "INACTIVE")
        self.assertFalse(self.service.is_active)

    @patch("backend.services.esp32_service.urllib.request.urlopen")
    def test_activate_state_transition_and_zero_hold(self, mock_urlopen):
        """Test that activating switches state to ACTIVE without scheduling a 5s auto-off timer."""
        mock_resp = MagicMock()
        mock_resp.status = 200
        mock_resp.read.return_value = b"DETERRENT ON"
        mock_urlopen.return_value.__enter__.return_value = mock_resp

        # 1. Activation: should issue HTTP request to /deter and have NO auto-off timer
        result1 = self.service.activate(reason="Target detected")
        self.assertTrue(result1)
        self.assertEqual(self.service.state, "ACTIVE")
        self.assertTrue(self.service.is_active)
        self.assertIsNone(self.service._auto_off_timer, "Zero-hold policy: no auto-off timer should be scheduled")

        # Allow worker thread to execute
        import time
        time.sleep(0.1)
        self.assertTrue(mock_urlopen.called)
        first_call_count = mock_urlopen.call_count

        # 2. Second activation while already ACTIVE: must be a no-op (NO repeated requests)
        result2 = self.service.activate(reason="Target still present")
        self.assertFalse(result2)  # State didn't change
        time.sleep(0.05)
        self.assertEqual(mock_urlopen.call_count, first_call_count, "Repeated activate should not send another HTTP request")

    @patch("backend.services.esp32_service.urllib.request.urlopen")
    def test_deactivate_state_transition_and_idempotency(self, mock_urlopen):
        """Test that deactivation switches state to INACTIVE and cancels any timer."""
        mock_resp = MagicMock()
        mock_resp.status = 200
        mock_resp.read.return_value = b"DETERRENT OFF"
        mock_urlopen.return_value.__enter__.return_value = mock_resp

        # Put into ACTIVE state
        self.service._state = "ACTIVE"
        import time

        # 1. First deactivation: should issue HTTP request to /stop
        result1 = self.service.deactivate(reason="Intrusion cleared")
        self.assertTrue(result1)
        self.assertEqual(self.service.state, "INACTIVE")
        self.assertFalse(self.service.is_active)
        time.sleep(0.1)
        self.assertTrue(mock_urlopen.called)
        first_call_count = mock_urlopen.call_count

        # 2. Second deactivation while already INACTIVE: must be a no-op
        result2 = self.service.deactivate(reason="Already cleared")
        self.assertFalse(result2)
        time.sleep(0.05)
        self.assertEqual(mock_urlopen.call_count, first_call_count, "Repeated deactivate should not send another HTTP request")

    def test_detection_trigger_all_targets(self):
        """Verify 75% confidence threshold and temporal confirmation logic."""
        self.service.mode = "ALL"
        self.service.min_conf = 0.75
        self.service.human_min_conf = 0.75

        # Confident Human (>= 75%) with temporal confirmation -> Trigger
        self.assertTrue(self.service.evaluate_deterrent_trigger([{"class": "Human", "confidence": 0.85, "temporal_confirmed": True}]))

        # Confident Wild Boar (>= 75%) with temporal confirmation -> Trigger
        self.assertTrue(self.service.evaluate_deterrent_trigger([{"class": "Wild Boar", "confidence": 0.76, "temporal_confirmed": True}]))

        # High confidence (>= 75%) but NOT yet temporally confirmed (temporal_confirmed=False) -> No trigger
        self.assertFalse(self.service.evaluate_deterrent_trigger([{"class": "Human", "confidence": 0.90, "temporal_confirmed": False}]))

        # Target below 75% confidence floor (< 0.75, e.g. 67.8% or 37.1%) -> No trigger
        self.assertFalse(self.service.evaluate_deterrent_trigger([{"class": "Human", "confidence": 0.678}]))
        self.assertFalse(self.service.evaluate_deterrent_trigger([{"class": "Goat", "confidence": 0.371}]))

        # UNKNOWN/UNCERTAIN classified detection -> No trigger
        self.assertFalse(self.service.evaluate_deterrent_trigger([{"class": "UNKNOWN/UNCERTAIN (Goat)", "confidence": 0.40}]))

        # Empty detections -> No trigger
        self.assertFalse(self.service.evaluate_deterrent_trigger([]))

    def test_custom_api_endpoints_and_method(self):
        """Verify configurable endpoints and HTTP method dispatch."""
        self.service.update_config(
            deter_endpoint="/custom_deter",
            stop_endpoint="/custom_stop",
            status_endpoint="/custom_status",
            http_method="POST"
        )
        self.assertEqual(self.service.deter_endpoint, "/custom_deter")
        self.assertEqual(self.service.stop_endpoint, "/custom_stop")
        self.assertEqual(self.service.status_endpoint, "/custom_status")
        self.assertEqual(self.service.http_method, "POST")

        status = self.service.get_status()
        self.assertEqual(status["url_deter"], f"http://{self.service.ip}:{self.service.port}/custom_deter")
        self.assertEqual(status["url_stop"], f"http://{self.service.ip}:{self.service.port}/custom_stop")

    @patch("backend.services.esp32_service.urllib.request.urlopen")
    def test_network_failure_resilience(self, mock_urlopen):
        """Verify that an ESP32 network timeout or connection error does not crash the service."""
        import urllib.error
        mock_urlopen.side_effect = urllib.error.URLError("Connection refused (Test)")

        # Activate should catch the error and log, without raising exception
        activated = self.service.activate(reason="Network failure test")
        self.assertTrue(activated)
        import time
        time.sleep(0.1)
        self.assertGreater(self.service._consecutive_errors, 0)
        self.assertIsNotNone(self.service._last_error_msg)


if __name__ == "__main__":
    unittest.main()
