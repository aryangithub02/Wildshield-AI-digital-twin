"""
WildShield AI - Phase 1: Camera Test Application
Autonomous Wildlife Intrusion Prevention System

Demonstrates modular camera initialization, live frame capture, real-time HUD
overlay displaying camera telemetry (status, resolution, FPS), and graceful
resource teardown upon pressing 'q'.
"""

import argparse
import os
import sys
import time
from pathlib import Path

# Ensure backend directory is in sys.path for both local and root execution
CURRENT_DIR = Path(__file__).resolve().parent
if str(CURRENT_DIR) not in sys.path:
    sys.path.insert(0, str(CURRENT_DIR))

import cv2
import numpy as np

from camera import CameraConfig, CameraManager, CameraStatus


def draw_hud_overlay(frame: np.ndarray, camera: CameraManager, measured_fps: float) -> np.ndarray:
    """
    Renders an informative, high-contrast Heads-Up Display (HUD) overlay on the video frame.

    Args:
        frame (np.ndarray): The captured BGR video frame.
        camera (CameraManager): Active CameraManager instance.
        measured_fps (float): Real-time calculated display FPS.

    Returns:
        np.ndarray: Frame with HUD graphics and telemetry text.
    """
    output = frame.copy()
    h, w = output.shape[:2]

    # Draw semi-transparent header bar
    overlay = output.copy()
    header_height = 80
    cv2.rectangle(overlay, (0, 0), (w, header_height), (15, 23, 42), -1)  # Dark slate background
    cv2.rectangle(overlay, (0, h - 35), (w, h), (15, 23, 42), -1)         # Footer bar
    alpha = 0.75
    output = cv2.addWeighted(overlay, alpha, output, 1 - alpha, 0)

    # Title & Badge
    cv2.putText(
        output,
        "WILDSHIELD AI | Phase 1: Camera Manager",
        (16, 30),
        cv2.FONT_HERSHEY_SIMPLEX,
        0.7,
        (0, 230, 118),  # Vibrant Emerald
        2,
        cv2.LINE_AA
    )

    # Telemetry metrics
    status_text = f"Status: {camera.status.value.upper()}"
    status_color = (0, 255, 0) if camera.status == CameraStatus.CONNECTED else (0, 0, 255)
    
    cv2.putText(
        output,
        status_text,
        (16, 60),
        cv2.FONT_HERSHEY_SIMPLEX,
        0.55,
        status_color,
        1,
        cv2.LINE_AA
    )

    res_w, res_h = camera.get_resolution()
    telemetry_text = f"Res: {res_w}x{res_h} | FPS: {measured_fps:.1f} | Source: {camera.get_source_info()}"
    cv2.putText(
        output,
        telemetry_text,
        (220, 60),
        cv2.FONT_HERSHEY_SIMPLEX,
        0.55,
        (220, 220, 220),
        1,
        cv2.LINE_AA
    )

    # Footer instruction
    footer_text = "Press 'q' or 'ESC' on the video window to safely exit."
    cv2.putText(
        output,
        footer_text,
        (16, h - 12),
        cv2.FONT_HERSHEY_SIMPLEX,
        0.5,
        (180, 180, 180),
        1,
        cv2.LINE_AA
    )

    return output


def parse_arguments() -> argparse.Namespace:
    """Parses command-line arguments for custom camera testing options."""
    parser = argparse.ArgumentParser(
        description="WildShield AI - Phase 1 Camera Input & Manager Runner"
    )
    parser.add_argument(
        "--source",
        type=str,
        default=None,
        help="Camera device index (e.g., 0, 1), video file path (.mp4), stream URL (rtsp://, http://), or 'mock'"
    )
    parser.add_argument(
        "--droidcam",
        action="store_true",
        help="Attempt to use DroidCam mobile camera (device index 1 or probe available virtual cameras)"
    )
    parser.add_argument(
        "--ip-stream",
        type=str,
        default=None,
        help="Direct DroidCam / IP Webcam URL (e.g., http://192.168.1.15:4747/video or http://192.168.1.15:8080/video)"
    )
    parser.add_argument(
        "--list-cameras",
        action="store_true",
        help="Probe and list all accessible camera devices on this computer"
    )
    parser.add_argument(
        "--mock",
        action="store_true",
        help="Run using synthetic simulated video stream (useful when no physical webcam is plugged in)"
    )
    parser.add_argument(
        "--width",
        type=int,
        default=None,
        help="Target frame width in pixels (default: 1280)"
    )
    parser.add_argument(
        "--height",
        type=int,
        default=None,
        help="Target frame height in pixels (default: 720)"
    )
    return parser.parse_args()


def main():
    """Main entry point for Phase 1 Camera Input test."""
    args = parse_arguments()

    print("=" * 65)
    print("  WILDSHIELD AI - Autonomous Wildlife Intrusion Prevention System")
    print("  Phase 1: Camera Input & Camera Manager Test")
    print("=" * 65)

    if args.list_cameras:
        print("[*] Probing connected camera devices...")
        cams = CameraManager.find_available_cameras(max_tested=8)
        if not cams:
            print(" [-] No hardware or virtual camera devices were found.")
        else:
            print(f"[+] Found {len(cams)} accessible camera device(s):")
            for c in cams:
                print(f"    - Index {c['index']}: {c['label']} ({c['width']}x{c['height']})")
        print("=" * 65)
        sys.exit(0)

    # Determine camera source preference
    source = "mock" if args.mock else args.source
    if args.ip_stream:
        source = args.ip_stream
    elif args.droidcam:
        # Default DroidCam virtual camera on Windows is index 1 or 2
        source = 1 if source is None else source

    # 1. Initialize configuration (loads CLI arg, env variable, or default 0)
    config = CameraConfig.from_env(custom_source=source)
    if args.width:
        config.target_width = args.width
    if args.height:
        config.target_height = args.height

    print(f"[*] Camera Configuration:")
    print(f"    - Source: {config.source} ({config.name})")
    print(f"    - Target Resolution: {config.target_width}x{config.target_height}")
    print(f"    - Target FPS: {config.target_fps}")
    print(f"    - Max Consecutive Failures: {config.max_consecutive_failures}")

    # 2. Instantiate Camera Manager
    camera = CameraManager(config=config)

    print("\n[*] Initializing camera connection...")
    if not camera.connect():
        print("\n" + "!" * 65)
        print(" [ERROR] Could not connect to camera.")
        print(" Possible causes:")
        print("   1. Physical webcam is unplugged, disabled, or not recognized.")
        print("   2. Another application (Teams, Zoom, Browser) is using the webcam.")
        print("   3. Camera permissions are blocked in Windows Privacy Settings.")
        print("   4. If using an IP/ESP32-CAM stream, verify the network URL is reachable.")
        print("")
        print(" [TIP] You can also run with a sample video file or synthetic test feed:")
        print('   - Run synthetic demo:  python backend/main.py --mock')
        print('   - Run with video file: python backend/main.py --source "sample_video.mp4"')
        print("!" * 65)
        sys.exit(1)

    actual_w, actual_h = camera.get_resolution()
    print(f"[+] Camera connected successfully!")
    print(f"    - Active Resolution: {actual_w}x{actual_h}")
    print(f"    - Hardware FPS: {camera.get_fps():.1f}")
    print(f"    - Status: {camera.status.value}")
    print("\n[*] Starting live video stream window. Press 'q' to stop.\n")

    window_name = "WildShield AI - Camera Feed (Phase 1)"
    cv2.namedWindow(window_name, cv2.WINDOW_NORMAL)
    cv2.resizeWindow(window_name, min(actual_w, 1280), min(actual_h, 720))

    # FPS calculation tracking
    fps_start_time = time.time()
    fps_frame_count = 0
    measured_fps = 0.0

    try:
        while True:
            # 3. Read frame from CameraManager
            # (Phase 2 YOLO model will call this exact line: `frame = camera.read()`)
            frame = camera.read()

            if frame is None:
                # Camera read failed or stream lost
                if camera.status == CameraStatus.ERROR:
                    print("[!] Camera entered ERROR state due to consecutive frame drops.")
                    break
                # Short yield before retry
                time.sleep(0.01)
                continue

            fps_frame_count += 1
            elapsed = time.time() - fps_start_time
            if elapsed >= 0.5:
                measured_fps = fps_frame_count / elapsed
                fps_frame_count = 0
                fps_start_time = time.time()

            # Render Heads-Up Display
            annotated_frame = draw_hud_overlay(frame, camera, measured_fps)

            # Display frame
            cv2.imshow(window_name, annotated_frame)

            # Check for user exit ('q' or ESC)
            key = cv2.waitKey(1) & 0xFF
            if key == ord('q') or key == ord('Q') or key == 27:
                print("\n[*] Exit requested by user ('q' key pressed).")
                break

            # Check if window was closed via OS 'X' button
            if cv2.getWindowProperty(window_name, cv2.WND_PROP_VISIBLE) < 1:
                print("\n[*] Video window closed by user.")
                break

    except KeyboardInterrupt:
        print("\n[*] Interrupted via Keyboard (Ctrl+C).")
    finally:
        # 4. Proper cleanup of resources
        print("[*] Releasing camera and closing OpenCV windows...")
        camera.release()
        cv2.destroyAllWindows()
        print("[+] Teardown complete. WildShield AI camera subsystem shut down cleanly.\n")


if __name__ == "__main__":
    main()
