import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Volume2, Lightbulb, ShieldAlert, Sparkles, Cpu, 
  Play, Film, Scan, Smartphone, FileText, ArrowRight,
  Camera, Upload, RefreshCw, CheckCircle2, AlertTriangle,
  FolderOpen, Zap, VideoOff, Wifi, Eye, Radio, SwitchCamera,
  Info, ExternalLink, Settings, RadioTower, Video, Layers, 
  Maximize2, Crosshair, ChevronUp, ChevronDown, ChevronLeft, 
  ChevronRight, ZoomIn, ZoomOut, Square, RotateCcw, Target,
  ChevronDown as ChevronDownIcon, ChevronUp as ChevronUpIcon,
  Shield, Activity, BellRing
} from 'lucide-react';
import { getTranslation } from '../utils/translations';
import { SPECIES_TAXONOMY, getSpeciesMetadataByName } from '../utils/speciesMapping';
import TargetTriggerController from './TargetTriggerController';
import V380CameraMovementController from './V380CameraMovementController';

export default function AIDetectionTab({ 
  simulationState, 
  currentScenario, 
  language,
  onLiveDetection 
}) {
  const t = (key) => getTranslation(language, key);

  // Input source: 'v380_stream' | 'webcam' | 'dataset' | 'upload' | 'simulation'
  const [sourceMode, setSourceMode] = useState('v380_stream');
  const [backendStatus, setBackendStatus] = useState({ online: false, checking: true, info: null });
  const [apiBaseUrl, setApiBaseUrl] = useState(import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000");
  const [testImages, setTestImages] = useState([]);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [isInferring, setIsInferring] = useState(false);
  const [confidenceThreshold, setConfidenceThreshold] = useState(0.25);
  const [selectedNodeId, setSelectedNodeId] = useState(1);

  // V380 Pro Live Stream State
  const [directFeedUrl, setDirectFeedUrl] = useState(() => 
    localStorage.getItem('wildshield_v380_direct_feed_url') || 'http://localhost:8080/mjpeg'
  );
  // Default to 'annotated' (/api/camera/stream) so OBS Virtual Camera stream is active by default
  const [feedSourceType, setFeedSourceType] = useState(() => 
    localStorage.getItem('wildshield_feed_source_type') || 'annotated'
  ); // 'annotated' (/api/camera/stream) | 'raw' (/api/camera/stream?mode=raw) | 'direct' (http://localhost:8080/mjpeg)
  const [showFeedUrlEditor, setShowFeedUrlEditor] = useState(false);
  const [customFeedUrlInput, setCustomFeedUrlInput] = useState(() => 
    localStorage.getItem('wildshield_v380_direct_feed_url') || 'http://localhost:8080/mjpeg'
  );
  const [v380StreamMode, setV380StreamMode] = useState('annotated'); // 'annotated' | 'raw'
  const [v380StreamKey, setV380StreamKey] = useState(Date.now());
  const [v380CameraStatus, setV380CameraStatus] = useState(null);
  const [showArchitectureModal, setShowArchitectureModal] = useState(false);

  // Backend DirectShow Hardware/Virtual Device Management (Index 0 = Integrated, 1 = DroidCam, 2 = OBS)
  const [backendDevices, setBackendDevices] = useState([]);
  const [currentBackendDevice, setCurrentBackendDevice] = useState(2);
  const [switchingCamera, setSwitchingCamera] = useState(false);

  // 3-Lens V380 Multiview Selection: 'all' (3-Lens Full) | 'cam1' (Top Fixed) | 'cam2' (Mid Fixed) | 'cam3' (PTZ)
  const [selectedV380Cam, setSelectedV380Cam] = useState('all');
  const [autoTrackActive, setAutoTrackActive] = useState(true);
  const [isTrackingActive, setIsTrackingActive] = useState(false);
  const [ptzActionMessage, setPtzActionMessage] = useState(null);
  const [activeIntelTab, setActiveIntelTab] = useState('classification'); // 'classification' | 'history' | 'system'

  // Collapsible Secondary Drawers
  const [showPipelineDrawer, setShowPipelineDrawer] = useState(false);
  const [showActuatorsDrawer, setShowActuatorsDrawer] = useState(true);
  const [showDiagnosticsDrawer, setShowDiagnosticsDrawer] = useState(false);

  // ESP32 Smart Deterrent Hardware State
  const [esp32Status, setEsp32Status] = useState({
    online: true,
    state: "INACTIVE",
    is_active: false,
    ip: "192.168.137.172",
    port: 80,
    last_trigger_reason: "None",
    latency: null,
    loading: false
  });

  // Single Source of Truth for Live Model Inference Result
  const [liveDetectionResult, setLiveDetectionResult] = useState(null);
  const [recentEvents, setRecentEvents] = useState([]);
  
  // Camera & DroidCam Device Management
  const [webcamActive, setWebcamActive] = useState(false);
  const [availableCameras, setAvailableCameras] = useState([]);
  const [selectedCameraId, setSelectedCameraId] = useState(
    () => localStorage.getItem('wildshield_selected_camera_id') || ""
  );
  const [activeCameraLabel, setActiveCameraLabel] = useState("Camera");
  const [isDroidCamDevice, setIsDroidCamDevice] = useState(false);
  
  // Direct WiFi Stream State (DroidCam / IP WebCam)
  const [droidCamIp, setDroidCamIp] = useState(
    () => localStorage.getItem('wildshield_droidcam_ip') || "192.168.1.8"
  );
  const [droidCamPort, setDroidCamPort] = useState("4747");
  const [droidCamStatus, setDroidCamStatus] = useState({ online: false, checking: false, message: "" });

  const fetchEsp32Status = useCallback(async () => {
    try {
      const res = await fetch(`${apiBaseUrl}/api/esp32/status`);
      if (res.ok) {
        const data = await res.json();
        setEsp32Status(prev => ({
          ...prev,
          online: data.ping ? data.ping.online : true,
          latency: data.ping?.latency_ms,
          state: data.state,
          is_active: data.is_active,
          ip: data.ip,
          port: data.port,
          total_activations: data.total_activations,
          last_trigger_reason: data.last_trigger_reason
        }));
      }
    } catch (err) {
      // offline
    }
  }, [apiBaseUrl]);

  useEffect(() => {
    fetchEsp32Status();
    const interval = setInterval(fetchEsp32Status, 3000);
    return () => clearInterval(interval);
  }, [fetchEsp32Status]);

  const handleTriggerEsp32 = async (duration = null) => {
    try {
      setEsp32Status(prev => ({ ...prev, loading: true }));
      const res = await fetch(`${apiBaseUrl}/api/esp32/deter`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ duration, reason: "Manual UI Trigger" })
      });
      if (res.ok) {
        setPtzActionMessage("⚡ ESP32 FIRED: LED ON + SIREN ON");
        if (ptzTimeoutRef.current) clearTimeout(ptzTimeoutRef.current);
        ptzTimeoutRef.current = setTimeout(() => setPtzActionMessage(null), 3000);
        fetchEsp32Status();
      }
    } catch (err) {
      setPtzActionMessage("⚠️ ESP32 Connection Error");
    } finally {
      setEsp32Status(prev => ({ ...prev, loading: false }));
    }
  };

  const handleStopEsp32 = async () => {
    try {
      setEsp32Status(prev => ({ ...prev, loading: true }));
      const res = await fetch(`${apiBaseUrl}/api/esp32/stop`, {
        method: "POST"
      });
      if (res.ok) {
        setPtzActionMessage("⏹ ESP32 STOPPED: LED OFF + SIREN OFF");
        if (ptzTimeoutRef.current) clearTimeout(ptzTimeoutRef.current);
        ptzTimeoutRef.current = setTimeout(() => setPtzActionMessage(null), 2500);
        fetchEsp32Status();
      }
    } catch (err) {
      // ignore
    } finally {
      setEsp32Status(prev => ({ ...prev, loading: false }));
    }
  };


  // Continuous Auto-Scan Live Inference
  const [autoScanActive, setAutoScanActive] = useState(false);
  const [showCameraGuide, setShowCameraGuide] = useState(false);
  const [uploadedImagePreview, setUploadedImagePreview] = useState(null);
  const [snapshotToast, setSnapshotToast] = useState(null);

  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const fileInputRef = useRef(null);
  const autoScanIntervalRef = useRef(null);
  const ptzTimeoutRef = useRef(null);

  // Fallback scenario for simulation demo mode only
  const activeScenario = currentScenario || {
    species: "Wild Boar",
    emoji: "🐗",
    threat: "HIGH",
    nodeId: 1,
    nodeName: "FN-1",
    confidenceBase: 91.5,
    confidenceMax: 95.8,
    actuators: { siren: true, floodlight: true, speaker: true, sprinkler: false }
  };

  // Helper: Enumerate and categorize video devices
  const enumerateCameraDevices = useCallback(async () => {
    if (!navigator.mediaDevices || !navigator.mediaDevices.enumerateDevices) return [];
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoInputs = devices.filter(d => d.kind === 'videoinput');
      
      const formatted = videoInputs.map((dev, idx) => {
        const label = dev.label || `Camera ${idx + 1}`;
        const isObs = /obs/i.test(label);
        const isDroid = /droidcam|droid|android|phone|wireless/i.test(label);
        const isIntegrated = /integrated|internal|facetime|built-in/i.test(label);
        return {
          deviceId: dev.deviceId,
          label,
          displayLabel: isObs 
            ? `🎥 ${label} (OBS Virtual Camera)`
            : isDroid 
            ? `📱 ${label} (Android Mobile)`
            : isIntegrated 
            ? `💻 ${label} (Integrated)` 
            : `📷 ${label}`,
          isObsCam: isObs,
          isDroidCam: isDroid,
          isIntegrated
        };
      });

      setAvailableCameras(formatted);

      // Auto-select OBS Cam if present, or DroidCam, or saved preference
      const savedId = localStorage.getItem('wildshield_selected_camera_id');
      const savedExists = formatted.some(c => c.deviceId === savedId);

      if (!savedExists) {
        const obsDevice = formatted.find(c => c.isObsCam);
        const droidDevice = formatted.find(c => c.isDroidCam);
        if (obsDevice) {
          setSelectedCameraId(obsDevice.deviceId);
          localStorage.setItem('wildshield_selected_camera_id', obsDevice.deviceId);
        } else if (droidDevice) {
          setSelectedCameraId(droidDevice.deviceId);
          localStorage.setItem('wildshield_selected_camera_id', droidDevice.deviceId);
        } else if (formatted.length > 0) {
          setSelectedCameraId(formatted[0].deviceId);
        }
      }

      return formatted;
    } catch (err) {
      console.warn("Could not enumerate camera devices:", err);
      return [];
    }
  }, []);

  // Fetch backend DirectShow capture devices (Integrated, DroidCam, OBS Virtual Cam)
  const fetchBackendDevices = useCallback(async () => {
    try {
      const res = await fetch(`${apiBaseUrl}/api/camera/devices`);
      if (res.ok) {
        const data = await res.json();
        setBackendDevices(data.devices || []);
        if (data.current_index !== undefined) {
          setCurrentBackendDevice(data.current_index);
        }
      }
    } catch (e) {
      console.warn("Could not fetch backend camera devices:", e);
    }
  }, [apiBaseUrl]);

  // Dynamically switch backend DirectShow capture source
  const handleSwitchBackendDevice = async (deviceIndex, deviceName) => {
    setSwitchingCamera(true);
    try {
      const res = await fetch(`${apiBaseUrl}/api/camera/switch`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ source: deviceIndex, name: deviceName })
      });
      if (res.ok) {
        const data = await res.json();
        setCurrentBackendDevice(data.source);
        setV380StreamKey(Date.now());
        setPtzActionMessage(`⚡ Switched camera to ${data.name}`);
        if (ptzTimeoutRef.current) clearTimeout(ptzTimeoutRef.current);
        ptzTimeoutRef.current = setTimeout(() => setPtzActionMessage(null), 3000);
      }
    } catch (e) {
      console.error("Camera switch failed:", e);
      setPtzActionMessage("⚠️ Camera switch failed");
    } finally {
      setSwitchingCamera(false);
      fetchBackendDevices();
    }
  };

  // Check DroidCam IP Connectivity
  const checkDroidCamIpStatus = useCallback(async (ip = droidCamIp, port = droidCamPort) => {
    setDroidCamStatus(prev => ({ ...prev, checking: true }));
    try {
      const res = await fetch(`${apiBaseUrl}/api/droidcam/status?ip=${encodeURIComponent(ip)}&port=${encodeURIComponent(port)}`);
      if (res.ok) {
        const data = await res.json();
        setDroidCamStatus({
          online: data.online,
          checking: false,
          status: data.status,
          message: data.message
        });
      } else {
        setDroidCamStatus({
          online: false,
          checking: false,
          status: "OFFLINE",
          message: "Could not reach DroidCam IP endpoint."
        });
      }
    } catch (e) {
      setDroidCamStatus({
        online: false,
        checking: false,
        status: "ERROR",
        message: "Network request failed. Is the DroidCam app running?"
      });
    }
  }, [apiBaseUrl, droidCamIp, droidCamPort]);

  useEffect(() => {
    checkBackendAndFetchImages();
    fetchRecentEvents();
    enumerateCameraDevices();
    checkDroidCamIpStatus();
    fetchBackendDevices();

    if (navigator.mediaDevices && navigator.mediaDevices.addEventListener) {
      navigator.mediaDevices.addEventListener('devicechange', enumerateCameraDevices);
      return () => {
        navigator.mediaDevices.removeEventListener('devicechange', enumerateCameraDevices);
      };
    }
  }, [enumerateCameraDevices, checkDroidCamIpStatus, fetchBackendDevices]);

  // V380 Pro Live Stream Polling & Telemetry
  useEffect(() => {
    let timer;
    if (sourceMode === 'v380_stream') {
      const pollV380 = async () => {
        try {
          const res = await fetch(`${apiBaseUrl}/api/camera/status`);
          if (res.ok) {
            const data = await res.json();
            setV380CameraStatus(data);
            setBackendStatus(prev => ({ ...prev, online: true, checking: false }));

            const det = data.latest_detection;
            if (det) {
              if ((det.detection_count ?? 0) > 0 && det.primary_detection) {
                setLiveDetectionResult(det);
                if (onLiveDetection) {
                  onLiveDetection(det);
                }
              } else {
                setLiveDetectionResult({
                  detection_count: 0,
                  status: "NO CONFIDENT DETECTION",
                  primary_detection: null,
                  detections: [],
                  max_threat: "NORMAL",
                });
              }
            }
          }
        } catch (e) {
          // ignore
        }
      };
      pollV380();
      timer = setInterval(pollV380, 700);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [sourceMode, apiBaseUrl, onLiveDetection]);

  // Ensure stream is attached to video element whenever streamRef or webcamActive changes
  useEffect(() => {
    if (webcamActive && streamRef.current && videoRef.current) {
      if (videoRef.current.srcObject !== streamRef.current) {
        videoRef.current.srcObject = streamRef.current;
        videoRef.current.play().catch(e => console.warn("Video playback autoplay handled:", e));
      }
    }
  }, [webcamActive, sourceMode]);

  // Cleanup stream on unmount
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop());
      }
      if (autoScanIntervalRef.current) {
        clearInterval(autoScanIntervalRef.current);
      }
      if (ptzTimeoutRef.current) {
        clearTimeout(ptzTimeoutRef.current);
      }
    };
  }, []);

  // Start / Switch Webcam Stream with specific device ID
  const startWebcam = async (targetDeviceId = selectedCameraId) => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current && videoRef.current.srcObject) {
      const tracks = videoRef.current.srcObject.getTracks();
      tracks.forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }

    setLiveDetectionResult(null);
    setSourceMode('webcam');

    try {
      let constraints = {
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      };

      if (targetDeviceId) {
        constraints.video.deviceId = { exact: targetDeviceId };
      }

      let stream;
      try {
        stream = await navigator.mediaDevices.getUserMedia(constraints);
      } catch (exactErr) {
        if (targetDeviceId) {
          constraints.video.deviceId = { ideal: targetDeviceId };
          stream = await navigator.mediaDevices.getUserMedia(constraints);
        } else {
          throw exactErr;
        }
      }

      streamRef.current = stream;
      setWebcamActive(true);

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        try {
          await videoRef.current.play();
        } catch (playErr) {
          console.warn("Video play handled:", playErr);
        }
      }

      await enumerateCameraDevices();
      const activeTrack = stream.getVideoTracks()[0];
      const activeLabel = activeTrack?.label || "Live Camera";
      setActiveCameraLabel(activeLabel);
      setIsDroidCamDevice(/droidcam|droid|android|phone/i.test(activeLabel));

      if (activeTrack?.getSettings()?.deviceId) {
        const currentId = activeTrack.getSettings().deviceId;
        setSelectedCameraId(currentId);
        localStorage.setItem('wildshield_selected_camera_id', currentId);
      }
    } catch (err) {
      console.error("Camera access failed:", err);
      alert(`Unable to access camera device: ${err.message}\nIf using DroidCam, ensure the DroidCam app & client are connected.`);
      setWebcamActive(false);
    }
  };

  const stopWebcam = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current && videoRef.current.srcObject) {
      const tracks = videoRef.current.srcObject.getTracks();
      tracks.forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
    setWebcamActive(false);
    setAutoScanActive(false);
  };

  const toggleWebcam = () => {
    if (webcamActive) {
      stopWebcam();
    } else {
      startWebcam(selectedCameraId);
    }
  };

  const handleCameraChange = (newDeviceId) => {
    setSelectedCameraId(newDeviceId);
    localStorage.setItem('wildshield_selected_camera_id', newDeviceId);
    if (webcamActive) {
      startWebcam(newDeviceId);
    }
  };

  // Synchronize selected test image with currentScenario from live demo simulation
  useEffect(() => {
    if (currentScenario?.sourceFile && testImages.length > 0) {
      const idx = testImages.findIndex(img => img.filename === currentScenario.sourceFile);
      if (idx !== -1 && idx !== selectedImageIndex) {
        setSelectedImageIndex(idx);
      }
    }
  }, [currentScenario?.sourceFile, testImages]);

  const checkBackendAndFetchImages = async () => {
    setBackendStatus(prev => ({ ...prev, checking: true }));
    const candidateBases = Array.from(new Set([apiBaseUrl, "", "http://127.0.0.1:8000", "http://localhost:8000"])).filter(b => b !== null && b !== undefined);

    let foundBase = null;
    let foundData = null;

    for (const base of candidateBases) {
      try {
        const url = base ? `${base}/api/status` : `/api/status`;
        const res = await fetch(url, { signal: AbortSignal.timeout(1500) });
        if (res.ok) {
          foundData = await res.json();
          foundBase = base;
          break;
        }
      } catch (e) {
        // try next candidate
      }
    }

    if (foundData) {
      const activeBase = foundBase !== null ? foundBase : "";
      setApiBaseUrl(activeBase);
      setBackendStatus({ online: true, checking: false, info: foundData });

      try {
        const testImgUrl = activeBase ? `${activeBase}/api/test-images` : `/api/test-images`;
        const imgsRes = await fetch(testImgUrl);
        if (imgsRes.ok) {
          const imgsData = await imgsRes.json();
          const imgsList = imgsData.images || [];
          setTestImages(imgsList);
          if (imgsList.length > 0 && sourceMode === 'dataset') {
            runTestImageInference(imgsList[0].filename, selectedNodeId, activeBase);
          }
        }
      } catch (e) {
        console.warn("Failed to fetch test images:", e);
      }
    } else {
      setBackendStatus({ online: false, checking: false, info: null });
    }
  };

  const fetchRecentEvents = async (base = apiBaseUrl) => {
    try {
      const res = await fetch(`${base}/api/events`);
      if (res.ok) {
        const data = await res.json();
        setRecentEvents(data.events || []);
      }
    } catch (e) {
      // Ignored in offline mode
    }
  };

  const runTestImageInference = async (filename, nodeId = selectedNodeId, base = apiBaseUrl) => {
    if (!filename) return;
    setLiveDetectionResult(null);
    setIsInferring(true);
    setSourceMode('dataset');

    try {
      const res = await fetch(`${base}/api/test-detect`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          filename,
          conf: confidenceThreshold,
          node_id: nodeId
        })
      });

      if (res.ok) {
        const data = await res.json();
        setLiveDetectionResult(data);
        fetchRecentEvents(base);
        if (onLiveDetection) {
          onLiveDetection(data);
        }
      } else {
        setLiveDetectionResult({
          detection_count: 0,
          status: "NO CONFIDENT DETECTION",
          primary_detection: null,
          detections: [],
          camera_id: `FN-${nodeId}`,
          node_name: `Farmer Node ${nodeId}`
        });
      }
    } catch (err) {
      console.error("Error during test image inference:", err);
      setLiveDetectionResult(null);
    } finally {
      setIsInferring(false);
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLiveDetectionResult(null);
    setSourceMode('upload');

    const reader = new FileReader();
    reader.onload = async (event) => {
      setUploadedImagePreview(event.target.result);
      setIsInferring(true);

      try {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("conf", confidenceThreshold.toString());
        formData.append("node_id", selectedNodeId.toString());

        const res = await fetch(`${apiBaseUrl}/api/detect`, {
          method: "POST",
          body: formData
        });

        if (res.ok) {
          const data = await res.json();
          setLiveDetectionResult(data);
          fetchRecentEvents();
          if (onLiveDetection) {
            onLiveDetection(data);
          }
        }
      } catch (err) {
        console.error("Inference upload failed:", err);
      } finally {
        setIsInferring(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const captureWebcamFrame = async () => {
    if (!videoRef.current || !webcamActive || isInferring) return;
    try {
      const canvas = document.createElement("canvas");
      canvas.width = videoRef.current.videoWidth || 1280;
      canvas.height = videoRef.current.videoHeight || 720;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
      const base64Data = canvas.toDataURL("image/jpeg", 0.85);

      setIsInferring(true);

      const res = await fetch(`${apiBaseUrl}/api/detect-frame`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          image: base64Data,
          conf: confidenceThreshold,
          node_id: selectedNodeId
        })
      });

      if (res.ok) {
        const data = await res.json();
        setLiveDetectionResult(data);
        fetchRecentEvents();
        if (onLiveDetection) {
          onLiveDetection(data);
        }
      }
    } catch (err) {
      console.error("Camera frame inference failed:", err);
    } finally {
      setIsInferring(false);
    }
  };

  useEffect(() => {
    if (autoScanActive && webcamActive) {
      autoScanIntervalRef.current = setInterval(() => {
        captureWebcamFrame();
      }, 1600);
    } else {
      if (autoScanIntervalRef.current) {
        clearInterval(autoScanIntervalRef.current);
        autoScanIntervalRef.current = null;
      }
    }

    return () => {
      if (autoScanIntervalRef.current) {
        clearInterval(autoScanIntervalRef.current);
        autoScanIntervalRef.current = null;
      }
    };
  }, [autoScanActive, webcamActive, confidenceThreshold, selectedNodeId]);

  const handleTestResponseTrigger = async (actuators) => {
    if (!liveDetectionResult?.primary_detection && sourceMode !== 'simulation') return;
    try {
      await fetch(`${apiBaseUrl}/api/trigger-response`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          detection_id: liveDetectionResult?.event_id || "TEST-ALERT-01",
          species: liveDetectionResult?.primary_detection?.class || activeScenario.species,
          actuators: actuators || liveDetectionResult?.primary_detection?.actuators || { siren: true, floodlight: true },
          mode: "simulation"
        })
      });
      setPtzActionMessage("ALERT DISPATCHED: Siren + Floodlight Activated");
      if (ptzTimeoutRef.current) clearTimeout(ptzTimeoutRef.current);
      ptzTimeoutRef.current = setTimeout(() => setPtzActionMessage(null), 2500);
    } catch (e) {
      // Ignored
    }
  };

  // PTZ Control handler with feedback
  const handlePtzCommand = (command) => {
    const labels = {
      up: "TILT UP ▲",
      down: "TILT DOWN ▼",
      left: "PAN LEFT ◀",
      right: "PAN RIGHT ▶",
      center: "RE-CENTERING HOME ⌂",
      stop: "PTZ MOTION HALTED ⏹",
      zoomIn: "OPTICAL ZOOM IN [+]",
      zoomOut: "OPTICAL ZOOM OUT [-]"
    };
    setPtzActionMessage(`PTZ: ${labels[command] || command.toUpperCase()}`);
    if (ptzTimeoutRef.current) clearTimeout(ptzTimeoutRef.current);
    ptzTimeoutRef.current = setTimeout(() => setPtzActionMessage(null), 2200);

    // Optional dispatch to backend
    fetch(`${apiBaseUrl}/api/camera/ptz`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ camera: selectedV380Cam, command })
    }).catch(() => {});
  };

  const handleTakeSnapshot = () => {
    if (sourceMode === 'v380_stream' && directFeedUrl) {
      try {
        const snapUrl = directFeedUrl.replace(/\/mjpeg.*$/, '/snapshot');
        const link = document.createElement('a');
        link.href = snapUrl;
        link.target = '_blank';
        link.download = `v380_snapshot_${Date.now()}.jpg`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        setSnapshotToast("Full-Resolution Snapshot (1920x3240) Saved from Port 8080");
      } catch (err) {
        setSnapshotToast("Snapshot Captured & Logged to Edge Storage");
      }
    } else {
      setSnapshotToast("Snapshot Captured & Logged to Edge Storage");
    }
    setTimeout(() => setSnapshotToast(null), 2500);
  };

  // Real detection states & 75% Confidence Floor
  const isRealModelMode = sourceMode === 'v380_stream' || sourceMode === 'dataset' || sourceMode === 'upload' || sourceMode === 'webcam' || Boolean(liveDetectionResult?.primary_detection);
  
  // USER REQUIREMENT: Show confidence over 75% — filter out any candidate under 75%
  const candidateDet = isRealModelMode ? liveDetectionResult?.primary_detection : null;
  const candidateConf = candidateDet 
    ? Number(candidateDet.confidence_pct ?? (candidateDet.confidence !== undefined ? candidateDet.confidence * 100 : 0)) 
    : 0;

  // primaryDet is ONLY considered when confidence >= 75%
  const primaryDet = (candidateDet && candidateConf >= 75) ? candidateDet : null;

  // Confidence calculation for confident detections (>= 75%)
  const rawConf = primaryDet 
    ? Number(primaryDet.confidence_pct ?? (primaryDet.confidence !== undefined ? primaryDet.confidence * 100 : 0)) 
    : (sourceMode === 'simulation' && simulationState >= 2 ? activeScenario.confidenceBase : 0);

  const isBelowConfidenceThreshold = false; // Low confidence targets filtered out completely
  const isHighConfidence = isRealModelMode ? Boolean(primaryDet) : (simulationState >= 2 && simulationState <= 4);
  const isTemporalConfirmed = isRealModelMode 
    ? Boolean(primaryDet?.temporal_confirmed ?? liveDetectionResult?.temporal_confirmed) 
    : (simulationState >= 3);
  const isConfirming = isHighConfidence && !isTemporalConfirmed;

  // Detection Status Badge: CONFIRMED | CONFIRMING | SCANNING
  let detectionStatus = "UNKNOWN";
  if (!primaryDet && sourceMode !== 'simulation') {
    detectionStatus = "SCANNING";
  } else if (isConfirming) {
    const elapsed = primaryDet?.temporal_elapsed_sec ?? liveDetectionResult?.temporal_elapsed_sec;
    detectionStatus = elapsed !== undefined ? `CONFIRMING (${Number(elapsed).toFixed(1)}s)` : "CONFIRMING";
  } else if (isTemporalConfirmed && isHighConfidence) {
    detectionStatus = "CONFIRMED";
  } else if (sourceMode === 'simulation') {
    detectionStatus = simulationState >= 3 ? "CONFIRMED" : (simulationState === 2 ? "CONFIRMING" : "UNKNOWN");
  }

  // hasConfidentTarget is strictly true ONLY when confidence >= 75% AND temporally confirmed
  const hasConfidentTarget = isHighConfidence && isTemporalConfirmed;

  const rawCandidateSpecies = primaryDet 
    ? (primaryDet.raw_class || (primaryDet.class ? String(primaryDet.class).replace(/^UNKNOWN\/UNCERTAIN \((.*)\)$/, '$1') : "Target"))
    : (sourceMode === 'simulation' ? activeScenario.species : null);

  const meta = rawCandidateSpecies ? getSpeciesMetadataByName(rawCandidateSpecies) : null;
  
  // When no target over 75%, display "SCANNING (CONFIDENCE >= 75%)"
  const displaySpecies = primaryDet 
    ? (primaryDet.raw_class || primaryDet.class) 
    : (sourceMode === 'simulation' ? activeScenario.species : "SCANNING (CONFIDENCE >= 75%)");

  const displayCode = primaryDet 
    ? primaryDet.code 
    : (meta ? meta.code : (hasConfidentTarget ? "WS-SEC-HM" : "WS-SCAN-00"));

  const displayConfidence = rawConf >= 75 ? rawConf.toFixed(1) : "0.0";

  // Suppress threat decision & deterrent if confirming or scanning
  const displayThreat = (!hasConfidentTarget) 
    ? "NORMAL" 
    : (primaryDet ? (primaryDet.threat || "NORMAL") : (sourceMode === 'simulation' ? activeScenario.threat : "NORMAL"));

  const displayIntrusion = (isBelowConfidenceThreshold || isConfirming)
    ? false
    : Boolean(primaryDet ? primaryDet.intrusion : (sourceMode === 'simulation' && simulationState >= 3));

  const displayEmoji = isBelowConfidenceThreshold 
    ? "❓" 
    : (primaryDet ? primaryDet.emoji : (meta ? meta.emoji : "👤"));

  const displayScientific = isBelowConfidenceThreshold
    ? `Confidence below 75% gate (Candidate: ${rawCandidateSpecies || 'Unknown'})`
    : (primaryDet ? (primaryDet.scientific_name || meta?.scientific || "Wildlife target") : (meta?.scientific || "Homo sapiens"));

  const displayTime = liveDetectionResult?.time_formatted || "2026-09-24 20:50:53";
  const displayNode = liveDetectionResult?.node_name || activeScenario.nodeName;
  const displayCameraId = liveDetectionResult?.camera_id || "FN-1";

  // Actuator active states (synced with both AI inference and physical ESP32 node)
  const isSirenTriggered = ((isRealModelMode 
    ? (hasConfidentTarget && primaryDet?.actuators?.siren && displayIntrusion)
    : (simulationState === 4 && activeScenario.actuators.siren))) || esp32Status.is_active;

  const isLightTriggered = ((isRealModelMode
    ? (hasConfidentTarget && primaryDet?.actuators?.floodlight && displayIntrusion)
    : (simulationState === 4 && activeScenario.actuators.floodlight))) || esp32Status.is_active;

  const isAlertTriggered = isRealModelMode
    ? (hasConfidentTarget && displayIntrusion)
    : (simulationState >= 3 && simulationState <= 4);

  const isLogTriggered = isRealModelMode
    ? (hasConfidentTarget)
    : (simulationState >= 3 && simulationState <= 4);

  const getThreatBlocksCount = () => {
    if (displayThreat === 'HIGH' || displayThreat === 'CRITICAL') return 5;
    if (displayThreat === 'MEDIUM' || displayThreat === 'WARNING') return 3;
    if (displayThreat === 'LOW') return 1;
    return 0;
  };

  const getThreatBadgeColor = (threat) => {
    if (threat === 'HIGH' || threat === 'CRITICAL') return "text-red-400 border-red-500/30 bg-red-500/10 font-bold";
    if (threat === 'MEDIUM' || threat === 'WARNING') return "text-amber-400 border-amber-500/30 bg-amber-500/10";
    return "text-green-400 border-green-500/30 bg-green-500/10";
  };

  // CSS Cropping for 3-lens vertical composite V380 stream (1920x3240)
  // Cam 1 = Top (Fixed Lens 1), Cam 2 = Middle (Fixed Lens 2), Cam 3 = Bottom (PTZ Lens)
  const getCameraCropStyle = (camId) => {
    if (sourceMode !== 'v380_stream') {
      return { width: '100%', height: '100%', objectFit: 'contain' };
    }
    switch (camId) {
      case 'cam1':
        // Top 1/3 (Fixed Lens 1)
        return {
          position: 'absolute',
          top: '0%',
          left: '0%',
          width: '100%',
          height: '300%',
          maxWidth: 'none',
          objectFit: 'cover'
        };
      case 'cam2':
        // Middle 1/3 (Fixed Lens 2)
        return {
          position: 'absolute',
          top: '-100%',
          left: '0%',
          width: '100%',
          height: '300%',
          maxWidth: 'none',
          objectFit: 'cover'
        };
      case 'cam3':
        // Bottom 1/3 (PTZ Lens)
        return {
          position: 'absolute',
          top: '-200%',
          left: '0%',
          width: '100%',
          height: '300%',
          maxWidth: 'none',
          objectFit: 'cover'
        };
      case 'raw':
        return {
          width: '100%',
          height: '100%',
          objectFit: 'contain'
        };
      case 'all':
      default:
        // Full 3-lens vertical composite fallback
        return {
          width: '100%',
          height: '100%',
          objectFit: 'contain'
        };
    }
  };

  // Live video stream URL: Directly from http://localhost:8080/mjpeg when feedSourceType is 'direct'
  const streamSrcUrl = feedSourceType === 'direct'
    ? `${directFeedUrl}${directFeedUrl.includes('?') ? '&' : '?'}t=${v380StreamKey}`
    : `${apiBaseUrl || ''}/api/camera/stream?mode=${v380StreamMode}&t=${v380StreamKey}`;

  return (
    <div className="space-y-4 select-none text-left font-sans pb-10">
      
      {/* ======================================================== */}
      {/* 1. COMPACT CAMERA CONTROL BAR (Top Horizontal Level)     */}
      {/* ======================================================== */}
      <div className="bg-[#0b0f19] border border-slate-900 rounded-xl px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 shadow-md">
        
        {/* Left: Input Source Selector Pills */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400 mr-1 flex items-center gap-1.5">
            <Radio className="h-3 w-3 text-emerald-400" />
            CAMERA SOURCE:
          </span>

          {/* OBS Virtual Camera & Live Stream Button */}
          <button
            onClick={() => {
              setSourceMode('v380_stream');
              if (feedSourceType === 'direct') {
                setFeedSourceType('annotated');
                localStorage.setItem('wildshield_feed_source_type', 'annotated');
              }
              if (webcamActive) stopWebcam();
            }}
            className={`px-3 py-1 rounded-lg text-xs font-mono font-semibold transition-all flex items-center gap-1.5 border ${
              sourceMode === 'v380_stream'
                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/60 shadow-[0_0_14px_rgba(16,185,129,0.3)] ring-1 ring-emerald-500/30'
                : 'bg-slate-900/60 text-slate-400 border-slate-800 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <Video className="h-3.5 w-3.5 text-emerald-400" />
            <span>OBS VIRTUAL CAM</span>
            <span className="text-[8px] px-1.5 py-0.2 rounded bg-emerald-950 text-emerald-400 border border-emerald-800/60 font-bold">LIVE</span>
          </button>

          {/* Live Browser Webcam / DroidCam Button */}
          <button
            onClick={() => {
              setSourceMode('webcam');
              if (!webcamActive) toggleWebcam();
            }}
            className={`px-3 py-1 rounded-lg text-xs font-mono font-semibold transition-all flex items-center gap-1.5 border ${
              sourceMode === 'webcam'
                ? 'bg-blue-500/20 text-blue-300 border-blue-500/60 shadow-[0_0_14px_rgba(59,130,246,0.3)] ring-1 ring-blue-500/30'
                : 'bg-slate-900/60 text-slate-400 border-slate-800 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <Smartphone className="h-3.5 w-3.5 text-blue-400" />
            <span>BROWSER CAM / DROIDCAM</span>
          </button>

          {/* Test Dataset Samples */}
          <button
            onClick={() => {
              setSourceMode('dataset');
              if (webcamActive) stopWebcam();
              if (testImages.length > 0) {
                runTestImageInference(testImages[selectedImageIndex]?.filename || testImages[0]?.filename);
              }
            }}
            className={`px-3 py-1 rounded-lg text-xs font-mono font-semibold transition-all flex items-center gap-1.5 border ${
              sourceMode === 'dataset'
                ? 'bg-amber-500/15 text-amber-400 border-amber-500/50 shadow-[0_0_12px_rgba(245,158,11,0.2)]'
                : 'bg-slate-900/60 text-slate-400 border-slate-800 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <FolderOpen className="h-3.5 w-3.5" />
            <span>TEST DATASET ({testImages.length})</span>
          </button>

          {/* Upload Photo Button */}
          <button
            onClick={() => {
              if (webcamActive) stopWebcam();
              fileInputRef.current?.click();
            }}
            className={`px-3 py-1 rounded-lg text-xs font-mono font-semibold transition-all flex items-center gap-1.5 border ${
              sourceMode === 'upload'
                ? 'bg-purple-500/15 text-purple-400 border-purple-500/50 shadow-[0_0_12px_rgba(168,85,247,0.2)]'
                : 'bg-slate-900/60 text-slate-400 border-slate-800 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <Upload className="h-3.5 w-3.5" />
            <span>UPLOAD PHOTO</span>
          </button>
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileUpload} 
            accept="image/*" 
            className="hidden" 
          />

          {/* Demo Simulation Button */}
          <button
            onClick={() => {
              setSourceMode('simulation');
              if (webcamActive) stopWebcam();
            }}
            className={`px-3 py-1 rounded-lg text-xs font-mono font-semibold transition-all flex items-center gap-1.5 border ${
              sourceMode === 'simulation'
                ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/50 shadow-[0_0_12px_rgba(16,185,129,0.2)]'
                : 'bg-slate-900/60 text-slate-400 border-slate-800 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <Zap className="h-3.5 w-3.5" />
            <span>DEMO SIMULATION</span>
          </button>
        </div>

        {/* Right: Telemetry & Dynamic Device Controls */}
        <div className="flex flex-wrap items-center gap-2.5 ml-auto">
          {/* Active Backend DirectShow Device Dropdown */}
          {sourceMode === 'v380_stream' && (
            <div className="flex items-center gap-1.5 bg-slate-900/90 border border-slate-800 rounded-lg px-2 py-1 text-[11px] font-mono">
              <span className="text-slate-400 flex items-center gap-1 font-bold">
                <Camera className="h-3 w-3 text-emerald-400" />
                <span className="hidden sm:inline">DEVICE:</span>
              </span>
              <select
                value={currentBackendDevice}
                disabled={switchingCamera}
                onChange={(e) => {
                  const val = isNaN(Number(e.target.value)) ? e.target.value : Number(e.target.value);
                  const matched = backendDevices.find(d => d.index === val);
                  handleSwitchBackendDevice(val, matched?.name);
                }}
                className="bg-black text-emerald-300 border border-slate-700 rounded px-2 py-0.5 text-xs font-mono focus:outline-none focus:border-emerald-500 cursor-pointer max-w-[210px] truncate"
              >
                {backendDevices.length > 0 ? (
                  backendDevices.map((d) => (
                    <option key={d.index} value={d.index}>
                      {d.name.toLowerCase().includes("obs") ? "🎥 " : d.type === "droidcam" ? "📱 " : "💻 "}
                      {d.name} [Index {d.index}]
                    </option>
                  ))
                ) : (
                  <option value={2}>🎥 OBS Virtual Camera [Index 2]</option>
                )}
              </select>
              {switchingCamera && <RefreshCw className="h-3 w-3 text-emerald-400 animate-spin" />}
            </div>
          )}

          {/* Browser Webcam Device Dropdown */}
          {sourceMode === 'webcam' && (
            <div className="flex items-center gap-1.5 bg-slate-900/90 border border-slate-800 rounded-lg px-2 py-1 text-[11px] font-mono">
              <span className="text-slate-400 flex items-center gap-1 font-bold">
                <Camera className="h-3 w-3 text-blue-400" />
                <span className="hidden sm:inline">CAM:</span>
              </span>
              <select
                value={selectedCameraId}
                onChange={(e) => handleCameraChange(e.target.value)}
                className="bg-black text-blue-300 border border-slate-700 rounded px-2 py-0.5 text-xs font-mono focus:outline-none focus:border-blue-500 cursor-pointer max-w-[200px] truncate"
              >
                {availableCameras.map((cam) => (
                  <option key={cam.deviceId} value={cam.deviceId}>
                    {cam.displayLabel}
                  </option>
                ))}
              </select>
              <button
                onClick={toggleWebcam}
                className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                  webcamActive ? 'bg-red-500/20 text-red-400 border border-red-500/40' : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                }`}
              >
                {webcamActive ? 'STOP' : 'START'}
              </button>
            </div>
          )}

          {/* Stream HUD Toggle (OBS AI HUD vs RAW OBS vs 8080 Direct) */}
          {sourceMode === 'v380_stream' && (
            <div className="flex items-center gap-2">
              <div className="flex items-center p-0.5 bg-slate-900 rounded-lg border border-slate-800 text-[10px] font-mono">
                <button
                  onClick={() => {
                    setFeedSourceType('annotated');
                    localStorage.setItem('wildshield_feed_source_type', 'annotated');
                  }}
                  className={`px-2.5 py-1 rounded font-bold transition-all flex items-center gap-1.5 ${
                    feedSourceType === 'annotated'
                      ? 'bg-emerald-500 text-slate-950 shadow-[0_0_10px_rgba(16,185,129,0.4)]'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                  title="Live OBS Virtual Camera stream with real-time YOLOv11 bounding boxes via backend port 8000"
                >
                  <Sparkles className="h-3 w-3" />
                  <span>OBS AI HUD</span>
                </button>
                <button
                  onClick={() => {
                    setFeedSourceType('raw');
                    localStorage.setItem('wildshield_feed_source_type', 'raw');
                  }}
                  className={`px-2.5 py-1 rounded font-bold transition-all flex items-center gap-1.5 ${
                    feedSourceType === 'raw'
                      ? 'bg-blue-500 text-white shadow-[0_0_10px_rgba(59,130,246,0.4)]'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                  title="Clean OBS Virtual Camera stream without bounding boxes"
                >
                  <Video className="h-3 w-3" />
                  <span>RAW OBS</span>
                </button>
                <button
                  onClick={() => {
                    setFeedSourceType('direct');
                    localStorage.setItem('wildshield_feed_source_type', 'direct');
                  }}
                  className={`px-2 py-1 rounded font-bold transition-all flex items-center gap-1 ${
                    feedSourceType === 'direct'
                      ? 'bg-amber-500 text-slate-950 shadow-[0_0_10px_rgba(245,158,11,0.4)]'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                  title="Direct stream from http://localhost:8080/mjpeg"
                >
                  <span>8080 MJPEG</span>
                </button>
              </div>

              {/* Feed URL badge / Editor trigger */}
              <button
                onClick={() => setShowFeedUrlEditor(prev => !prev)}
                className={`px-2.5 py-1 rounded-lg border text-[10px] font-mono transition-all flex items-center gap-1.5 ${
                  showFeedUrlEditor
                    ? 'bg-emerald-950/60 border-emerald-500 text-emerald-300 ring-1 ring-emerald-500/50'
                    : 'bg-slate-900 border-slate-800 text-emerald-400 hover:border-slate-700'
                }`}
                title="Configure Direct Feed URL"
              >
                <Wifi className="h-3 w-3 text-emerald-400" />
                <span className="hidden sm:inline font-bold truncate max-w-[140px]">{directFeedUrl}</span>
                <span className="sm:hidden font-bold">Feed</span>
                <Settings className="h-2.5 w-2.5 text-slate-400" />
              </button>
            </div>
          )}

          {/* Refresh Stream Button */}
          <button
            onClick={() => {
              setV380StreamKey(Date.now());
              if (sourceMode === 'dataset') checkBackendAndFetchImages();
            }}
            title="Refresh Stream Feed"
            className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-emerald-400 transition-all"
          >
            <RefreshCw className="h-3.5 w-3.5" />
          </button>

          {/* Pipeline Info Modal Toggle */}
          <button
            onClick={() => setShowArchitectureModal(true)}
            title="View Pipeline Architecture"
            className="hidden sm:flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 text-[10px] font-mono text-slate-300 hover:text-emerald-400 transition-all"
          >
            <RadioTower className="h-3 w-3" />
            <span>Pipeline</span>
          </button>
        </div>

      </div>

      {/* --- COLLAPSIBLE DIRECT FEED URL CONFIGURATION BANNER --- */}
      {sourceMode === 'v380_stream' && showFeedUrlEditor && (
        <div className="bg-[#0b0f19] border border-emerald-500/40 rounded-xl p-3 flex flex-wrap items-center justify-between gap-3 shadow-xl animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="flex flex-wrap items-center gap-2.5 text-xs font-mono text-slate-300">
            <span className="flex items-center gap-1.5 text-emerald-400 font-bold">
              <Radio className="h-3.5 w-3.5 animate-pulse" />
              MJPEG STREAM URL:
            </span>
            <input
              type="text"
              value={customFeedUrlInput}
              onChange={(e) => setCustomFeedUrlInput(e.target.value)}
              placeholder="http://localhost:8080/mjpeg"
              className="bg-black border border-slate-700 focus:border-emerald-500 rounded-lg px-3 py-1 text-emerald-300 font-mono text-xs w-72 sm:w-96 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
            <button
              onClick={() => {
                const clean = customFeedUrlInput.trim();
                setDirectFeedUrl(clean);
                localStorage.setItem('wildshield_v380_direct_feed_url', clean);
                setV380StreamKey(Date.now());
                setShowFeedUrlEditor(false);
              }}
              className="px-3 py-1 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-lg text-xs shadow-md transition-all"
            >
              Apply Feed
            </button>
          </div>
          <div className="flex items-center gap-2 text-[10px] font-mono text-slate-400">
            <span className="text-slate-500">Presets:</span>
            <button
              onClick={() => {
                setCustomFeedUrlInput('http://localhost:8080/mjpeg');
                setDirectFeedUrl('http://localhost:8080/mjpeg');
                localStorage.setItem('wildshield_v380_direct_feed_url', 'http://localhost:8080/mjpeg');
                setV380StreamKey(Date.now());
              }}
              className="px-2 py-0.5 rounded bg-slate-900 border border-slate-700 hover:border-emerald-500 text-slate-200 transition-colors"
            >
              localhost:8080
            </button>
            <button
              onClick={() => {
                const lan = `http://${window.location.hostname || '192.168.1.7'}:8080/mjpeg`;
                setCustomFeedUrlInput(lan);
                setDirectFeedUrl(lan);
                localStorage.setItem('wildshield_v380_direct_feed_url', lan);
                setV380StreamKey(Date.now());
              }}
              className="px-2 py-0.5 rounded bg-slate-900 border border-slate-700 hover:border-emerald-500 text-slate-200 transition-colors"
            >
              Host:8080
            </button>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 2. PRIMARY LIVE MONITORING WORKSPACE (Dominant Feed)     */}
      {/* ======================================================== */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-4 items-start">
        
        {/* ------------------------------------------------------ */}
        {/* LEFT COLUMN: Large Live Surveillance Camera Workspace  */}
        {/* Occupies ~70-75% horizontal width on desktop (8 or 9)  */}
        {/* ------------------------------------------------------ */}
        <div className="xl:col-span-8 2xl:col-span-9 space-y-3">
          
          {/* Main Camera Viewport Card */}
          <div className="relative aspect-[16/10] sm:aspect-[16/9] w-full bg-black rounded-xl border border-slate-800 overflow-hidden shadow-2xl flex items-center justify-center crt-overlay">
            
            {/* Scanline CRT overlay */}
            <div className="absolute top-0 left-0 w-full h-[2px] bg-emerald-500/15 shadow-[0_0_12px_rgba(16,185,129,0.6)] animate-scanline pointer-events-none z-10" />

            {/* --- TOP HUD OVERLAY --- */}
            {/* Top-Left: LIVE Badge & Active Camera Telemetry */}
            <div className="absolute top-3 left-3 z-20 flex items-center gap-2 font-mono text-[9px] text-white bg-black/80 backdrop-blur-md px-2.5 py-1 rounded-lg border border-slate-800 shadow-md">
              <span className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-red-600 font-bold text-white text-[8px] animate-pulse">
                <span className="h-1.5 w-1.5 rounded-full bg-white animate-ping" />
                LIVE
              </span>
              <span className="text-slate-300 font-bold">
                {sourceMode === 'v380_stream'
                  ? (selectedV380Cam === 'cam1' ? 'V380 Cam 1 (Top)' : selectedV380Cam === 'cam2' ? 'V380 Cam 2 (Mid)' : selectedV380Cam === 'cam3' ? 'V380 Cam 3 (PTZ)' : 'V380 3-Lens (Composite)')
                  : sourceMode === 'webcam'
                  ? (isDroidCamDevice ? `DroidCam (${droidCamIp})` : activeCameraLabel)
                  : sourceMode.toUpperCase()}
              </span>
              <span className="text-slate-500 hidden sm:inline">|</span>
              <span className="text-emerald-400 font-semibold hidden sm:inline">
                {sourceMode === 'v380_stream' && feedSourceType === 'direct' ? '1920x3240 (Direct MJPEG)' : (v380CameraStatus?.resolution || '1920x3240')}
              </span>
              <span className="text-slate-500 hidden sm:inline">•</span>
              <span className="text-emerald-400 font-semibold hidden sm:inline">{v380CameraStatus?.fps || 30} FPS</span>
              {v380CameraStatus?.capture_latency_ms !== undefined && (
                <>
                  <span className="text-slate-500 hidden md:inline">•</span>
                  <span className="text-green-400 font-mono hidden md:inline">{v380CameraStatus.capture_latency_ms} ms</span>
                </>
              )}
            </div>

            {/* Top-Right: Detection Status & Threat Level Badges */}
            <div className="absolute top-3 right-3 z-20 flex items-center gap-2">
              {/* Detection Status Indicator Badge */}
              <div className={`font-mono text-[10px] font-extrabold px-2.5 py-1 rounded-lg flex items-center gap-1.5 shadow-xl border ${
                detectionStatus === 'CONFIRMED'
                  ? 'bg-red-600/90 text-white border-red-500 shadow-[0_0_14px_rgba(239,68,68,0.5)]'
                  : detectionStatus.startsWith('CONFIRMING')
                  ? 'bg-cyan-600/90 text-white border-cyan-400 animate-pulse'
                  : detectionStatus === 'LOW CONFIDENCE'
                  ? 'bg-amber-500/90 text-slate-950 border-amber-400 font-black'
                  : 'bg-slate-900/80 text-slate-400 border-slate-700 backdrop-blur-sm'
              }`}>
                <span className={`h-1.5 w-1.5 rounded-full ${
                  detectionStatus === 'CONFIRMED' ? 'bg-white animate-ping' :
                  detectionStatus.startsWith('CONFIRMING') ? 'bg-cyan-200 animate-ping' :
                  detectionStatus === 'LOW CONFIDENCE' ? 'bg-slate-950' : 'bg-slate-500'
                }`} />
                <span>{detectionStatus}</span>
              </div>

              {/* Threat Level Prominent Badge */}
              <div className={`font-mono text-[10px] font-extrabold px-3 py-1 rounded-lg flex items-center gap-1.5 shadow-xl border ${
                displayThreat === 'CRITICAL' || displayThreat === 'HIGH'
                  ? 'bg-red-600/90 text-white border-red-500 shadow-[0_0_18px_rgba(239,68,68,0.5)] animate-pulse'
                  : displayThreat === 'MEDIUM' || displayThreat === 'WARNING'
                  ? 'bg-amber-600/90 text-white border-amber-500'
                  : 'bg-emerald-950/80 text-emerald-400 border-emerald-500/40 backdrop-blur-sm'
              }`}>
                <ShieldAlert className="h-3.5 w-3.5" />
                <span>THREAT: {displayThreat}</span>
              </div>
            </div>

            {/* Tactical PTZ Action Notification on Screen */}
            <AnimatePresence>
              {ptzActionMessage && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="absolute top-12 left-1/2 -translate-x-1/2 z-30 bg-black/90 border border-emerald-500/60 text-emerald-400 font-mono text-xs font-bold px-3 py-1 rounded-lg shadow-2xl backdrop-blur-md flex items-center gap-2"
                >
                  <Crosshair className="h-3.5 w-3.5 animate-spin" />
                  <span>{ptzActionMessage}</span>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Snapshot Toast Feedback */}
            <AnimatePresence>
              {snapshotToast && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="absolute bottom-14 left-1/2 -translate-x-1/2 z-30 bg-blue-600 text-white font-mono text-xs font-bold px-3 py-1.5 rounded-lg shadow-2xl flex items-center gap-2"
                >
                  <CheckCircle2 className="h-4 w-4" />
                  <span>{snapshotToast}</span>
                </motion.div>
              )}
            </AnimatePresence>

            {/* --- VIDEO FEED CONTENT DISPLAY --- */}
            {sourceMode === 'v380_stream' ? (
              /* V380 Live Feed Viewport with Lens Crop / Multiview */
              /* NOTE: The backend OpenCV MJPEG stream (/api/camera/stream) renders real-time YOLO bounding boxes dynamically */
              <div className="relative w-full h-full flex items-center justify-center overflow-hidden bg-black">
                <img
                  key={v380StreamKey}
                  src={streamSrcUrl}
                  alt="V380 Pro Live Stream"
                  style={getCameraCropStyle(selectedV380Cam)}
                  onError={() => {
                    setTimeout(() => setV380StreamKey(Date.now()), 2000);
                  }}
                />
              </div>
            ) : sourceMode === 'webcam' ? (
              /* Local Webcam / DroidCam Stream */
              <div className="relative w-full h-full flex items-center justify-center bg-black overflow-hidden">
                <video 
                  ref={videoRef} 
                  className={`w-full h-full object-cover ${webcamActive ? 'block' : 'hidden'}`} 
                  autoPlay 
                  muted 
                  playsInline 
                />
                {!webcamActive && (
                  <div className="text-center space-y-2 text-slate-500 p-8 z-10">
                    <VideoOff className="h-10 w-10 text-slate-600 mx-auto animate-pulse" />
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wide">
                      Camera Stream Off
                    </p>
                    <button
                      onClick={toggleWebcam}
                      className="px-4 py-1.5 rounded-lg bg-blue-500 hover:bg-blue-400 text-slate-950 text-xs font-mono font-bold shadow-lg"
                    >
                      Start DroidCam / WebCam
                    </button>
                  </div>
                )}
                {/* Bounding Boxes for WebCam (Only show confidence over 75%) */}
                {webcamActive && liveDetectionResult?.detections?.filter(det => {
                  const detConf = Number(det.confidence_pct ?? (det.confidence ? det.confidence * 100 : 0));
                  return detConf >= 75;
                }).map((det, idx) => {
                  const detConf = Number(det.confidence_pct ?? (det.confidence ? det.confidence * 100 : 0));
                  const isDetConfirmed = det.temporal_confirmed ?? isTemporalConfirmed;
                  const borderColor = isDetConfirmed ? '#ef4444' : '#06b6d4';
                  const shadowColor = isDetConfirmed ? 'rgba(239,68,68,0.5)' : 'rgba(6,182,212,0.5)';
                  const labelBg = isDetConfirmed ? 'bg-red-600 text-white' : 'bg-cyan-600 text-white';
                  const labelText = det.raw_class || det.class;
                  const statusTag = isDetConfirmed ? 'CONFIRMED' : 'CONFIRMING';

                  return (
                    <div
                      key={idx}
                      className="absolute pointer-events-none z-10 transition-all duration-150"
                      style={{
                        left: `${det.normalized_bbox[0] * 100}%`,
                        top: `${det.normalized_bbox[1] * 100}%`,
                        width: `${(det.normalized_bbox[2] - det.normalized_bbox[0]) * 100}%`,
                        height: `${(det.normalized_bbox[3] - det.normalized_bbox[1]) * 100}%`,
                        border: `2px solid ${borderColor}`,
                        boxShadow: `0 0 10px ${shadowColor}`
                      }}
                    >
                      <div className={`absolute -top-6 left-0 font-mono text-[8px] font-bold px-1.5 py-0.5 rounded shadow flex items-center gap-1 ${labelBg}`}>
                        <span>{labelText}</span>
                        <span>{det.confidence_pct}%</span>
                        <span className="text-[7px] uppercase px-1 rounded bg-black/40 text-white">{statusTag}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : sourceMode === 'dataset' && liveDetectionResult ? (
              /* Dataset Inference Mode */
              <div className="relative w-full h-full flex items-center justify-center bg-black">
                {liveDetectionResult.annotated_image ? (
                  <img
                    src={liveDetectionResult.annotated_image.startsWith("data:") ? liveDetectionResult.annotated_image : `data:image/jpeg;base64,${liveDetectionResult.annotated_image}`}
                    alt="Dataset YOLO Inference"
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <img
                    src={`/sample-test-images/${liveDetectionResult.source_file}`}
                    alt="Dataset Source"
                    className="w-full h-full object-contain"
                  />
                )}
              </div>
            ) : sourceMode === 'upload' && uploadedImagePreview ? (
              /* Uploaded Image Mode */
              <div className="relative w-full h-full flex items-center justify-center bg-black">
                <img src={uploadedImagePreview} alt="Uploaded Frame" className="w-full h-full object-contain" />
              </div>
            ) : (
              /* Fallback / Simulation Mode */
              <div className="relative w-full h-full flex items-center justify-center bg-black">
                <img
                  src={meta?.fallbackImage || "/ed-van-duijn-414NZVxzc20-unsplash.jpg"}
                  alt={activeScenario.species}
                  className="w-full h-full object-cover filter brightness-[0.75]"
                />
              </div>
            )}

            {/* --- BOTTOM HUD OVERLAY --- */}
            {/* Bottom-Left: Live Timestamp & Video Specs */}
            <div className="absolute bottom-2.5 left-3 z-20 font-mono text-[9px] text-slate-300 bg-black/80 backdrop-blur-md px-2.5 py-1 rounded-lg border border-slate-800 flex items-center gap-2">
              <span className="text-slate-100 font-bold">{displayTime}</span>
              <span className="text-slate-600">|</span>
              <span className="text-emerald-400 font-bold">
                {selectedV380Cam === 'cam1' ? 'Cam 1 (Top)' : selectedV380Cam === 'cam2' ? 'Cam 2 (Mid)' : selectedV380Cam === 'cam3' ? 'Cam 3 (PTZ)' : '3-Lens View'}
              </span>
              <span className="text-slate-600">|</span>
              <span className="text-emerald-300">{feedSourceType === 'direct' ? 'Direct MJPEG (8080)' : 'AI HUD (8000)'}</span>
              <span className="text-slate-600">|</span>
              <span>1920x3240</span>
            </div>

            {/* Bottom-Right: Lens View Toggles & Action Icons */}
            <div className="absolute bottom-2.5 right-3 z-20 flex items-center gap-1.5 bg-black/80 backdrop-blur-md p-1 rounded-lg border border-slate-800">
              {sourceMode === 'v380_stream' && (
                <div className="flex items-center gap-1 pr-1 mr-1 border-r border-slate-800 font-mono text-[9px]">
                  {[
                    { id: 'all', label: '3-LENS' },
                    { id: 'cam1', label: 'CAM 1' },
                    { id: 'cam2', label: 'CAM 2' },
                    { id: 'cam3', label: 'CAM 3 (PTZ)' }
                  ].map((cam) => (
                    <button
                      key={cam.id}
                      onClick={() => setSelectedV380Cam(cam.id)}
                      className={`px-1.5 py-0.5 rounded font-bold transition-all ${
                        selectedV380Cam === cam.id
                          ? 'bg-emerald-500 text-slate-950 shadow-sm'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {cam.label}
                    </button>
                  ))}
                </div>
              )}
              <button 
                onClick={handleTakeSnapshot} 
                title="Capture Snapshot" 
                className="p-1 hover:text-emerald-400 text-slate-400 transition-colors"
              >
                <Camera className="h-3.5 w-3.5" />
              </button>
              <button 
                onClick={() => handlePtzCommand('center')} 
                title="Center Target" 
                className="p-1 hover:text-blue-400 text-slate-400 transition-colors"
              >
                <Crosshair className="h-3.5 w-3.5" />
              </button>
            </div>

          </div>

          {/* ====================================================== */}
          {/* UNDER-CAMERA STRIP: 3-Lens Views + PTZ Controls + Act  */}
          {/* ====================================================== */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-stretch">
            
            {/* SUB-SECTION 1: Camera Views Strip (All, Cam 1, Cam 2, Cam 3) */}
            <div className="md:col-span-5 bg-[#0b0f19] border border-slate-900 rounded-xl p-3 shadow-md flex flex-col justify-between">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-mono font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  CAMERA VIEWS (V380 - 3 LENS)
                </span>
                <span className="text-[9px] font-mono text-slate-500">Click to switch feed</span>
              </div>

              {/* 4 Camera Thumbnails Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                
                {/* 0. Full 3-Lens Composite Thumbnail */}
                <div 
                  onClick={() => setSelectedV380Cam('all')}
                  className={`cursor-pointer rounded-lg border overflow-hidden transition-all bg-black relative group ${
                    selectedV380Cam === 'all'
                      ? 'border-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.3)] ring-1 ring-emerald-500/50'
                      : 'border-slate-800/80 hover:border-slate-700'
                  }`}
                >
                  <div className="p-1 bg-slate-950/80 flex items-center justify-between text-[8px] font-mono border-b border-slate-900">
                    <span className="flex items-center gap-1 text-slate-300 font-bold truncate">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                      3-Lens
                    </span>
                    {selectedV380Cam === 'all' && (
                      <span className="bg-emerald-500 text-slate-950 font-extrabold text-[6px] px-1 rounded">
                        ON
                      </span>
                    )}
                  </div>
                  <div className="aspect-[4/3] w-full relative overflow-hidden bg-black flex items-center justify-center">
                    <img 
                      src={streamSrcUrl} 
                      alt="3-Lens All" 
                      style={getCameraCropStyle('all')} 
                      className="group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                  <div className="p-0.5 bg-slate-950/90 text-[7px] font-mono text-slate-400 text-center truncate">
                    1920x3240
                  </div>
                </div>

                {/* 1. Cam 1 - Top Fixed Thumbnail */}
                <div 
                  onClick={() => setSelectedV380Cam('cam1')}
                  className={`cursor-pointer rounded-lg border overflow-hidden transition-all bg-black relative group ${
                    selectedV380Cam === 'cam1'
                      ? 'border-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.3)] ring-1 ring-emerald-500/50'
                      : 'border-slate-800/80 hover:border-slate-700'
                  }`}
                >
                  <div className="p-1 bg-slate-950/80 flex items-center justify-between text-[8px] font-mono border-b border-slate-900">
                    <span className="flex items-center gap-1 text-slate-300 font-bold truncate">
                      <span className="h-1.5 w-1.5 rounded-full bg-red-500" />
                      Cam 1 Top
                    </span>
                    {selectedV380Cam === 'cam1' && (
                      <span className="bg-emerald-500 text-slate-950 font-extrabold text-[6px] px-1 rounded">
                        ON
                      </span>
                    )}
                  </div>
                  <div className="aspect-[4/3] w-full relative overflow-hidden bg-black">
                    <img 
                      src={streamSrcUrl} 
                      alt="Cam 1 Top" 
                      style={getCameraCropStyle('cam1')} 
                      className="group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                  <div className="p-0.5 bg-slate-950/90 text-[7px] font-mono text-slate-400 text-center truncate">
                    Fixed Lens
                  </div>
                </div>

                {/* 2. Cam 2 - Mid Fixed Thumbnail */}
                <div 
                  onClick={() => setSelectedV380Cam('cam2')}
                  className={`cursor-pointer rounded-lg border overflow-hidden transition-all bg-black relative group ${
                    selectedV380Cam === 'cam2'
                      ? 'border-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.3)] ring-1 ring-emerald-500/50'
                      : 'border-slate-800/80 hover:border-slate-700'
                  }`}
                >
                  <div className="p-1 bg-slate-950/80 flex items-center justify-between text-[8px] font-mono border-b border-slate-900">
                    <span className="flex items-center gap-1 text-slate-300 font-bold truncate">
                      <span className="h-1.5 w-1.5 rounded-full bg-red-500" />
                      Cam 2 Mid
                    </span>
                    {selectedV380Cam === 'cam2' && (
                      <span className="bg-emerald-500 text-slate-950 font-extrabold text-[6px] px-1 rounded">
                        ON
                      </span>
                    )}
                  </div>
                  <div className="aspect-[4/3] w-full relative overflow-hidden bg-black">
                    <img 
                      src={streamSrcUrl} 
                      alt="Cam 2 Mid" 
                      style={getCameraCropStyle('cam2')} 
                      className="group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                  <div className="p-0.5 bg-slate-950/90 text-[7px] font-mono text-slate-400 text-center truncate">
                    Fixed Lens
                  </div>
                </div>

                {/* 3. Cam 3 - Bottom PTZ Thumbnail */}
                <div 
                  onClick={() => setSelectedV380Cam('cam3')}
                  className={`cursor-pointer rounded-lg border overflow-hidden transition-all bg-black relative group ${
                    selectedV380Cam === 'cam3'
                      ? 'border-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.3)] ring-1 ring-emerald-500/50'
                      : 'border-slate-800/80 hover:border-slate-700'
                  }`}
                >
                  <div className="p-1 bg-slate-950/80 flex items-center justify-between text-[8px] font-mono border-b border-slate-900">
                    <span className="flex items-center gap-1 text-emerald-400 font-bold truncate">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      Cam 3 PTZ
                    </span>
                    {selectedV380Cam === 'cam3' && (
                      <span className="bg-emerald-500 text-slate-950 font-extrabold text-[6px] px-1 rounded">
                        ON
                      </span>
                    )}
                  </div>
                  <div className="aspect-[4/3] w-full relative overflow-hidden bg-black">
                    <img 
                      src={streamSrcUrl} 
                      alt="Cam 3 PTZ" 
                      style={getCameraCropStyle('cam3')} 
                      className="group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                  <div className="p-0.5 bg-slate-950/90 text-[7px] font-mono text-emerald-400 text-center truncate font-bold">
                    PTZ Active
                  </div>
                </div>

              </div>
            </div>

            {/* SUB-SECTION 2: V380 Camera Movement & Light Controller (info.md: /api/ptz/*, /api/light/*) */}
            <div className="md:col-span-7 space-y-2">
              <V380CameraMovementController 
                apiBaseUrl={apiBaseUrl}
                onFeedbackMessage={(msg) => {
                  setPtzActionMessage(msg);
                  if (ptzTimeoutRef.current) clearTimeout(ptzTimeoutRef.current);
                  ptzTimeoutRef.current = setTimeout(() => setPtzActionMessage(null), 2500);
                }}
              />

              {/* Quick Surveillance Actions Bar */}
              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={() => setIsTrackingActive(!isTrackingActive)}
                  className={`py-1.5 px-2.5 rounded-lg text-xs font-mono font-bold transition-all flex items-center justify-center gap-1.5 border ${
                    isTrackingActive
                      ? 'bg-emerald-500 text-slate-950 border-emerald-400 shadow-[0_0_12px_rgba(16,185,129,0.4)]'
                      : 'bg-emerald-950/40 hover:bg-emerald-900/60 border-emerald-500/40 text-emerald-400'
                  }`}
                >
                  <Target className="h-3.5 w-3.5" />
                  <span>{isTrackingActive ? 'Tracking ON' : 'Auto-Track'}</span>
                </button>

                <button
                  onClick={handleTakeSnapshot}
                  className="py-1.5 px-2.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-200 text-xs font-mono font-semibold transition-all flex items-center justify-center gap-1.5"
                >
                  <Camera className="h-3.5 w-3.5 text-blue-400" />
                  <span>Snapshot</span>
                </button>

                <button
                  onClick={() => handleTestResponseTrigger()}
                  className="py-1.5 px-2.5 rounded-lg bg-red-950/60 hover:bg-red-900/80 border border-red-600/60 text-red-200 text-xs font-mono font-bold transition-all flex items-center justify-center gap-1.5 shadow-[0_0_10px_rgba(239,68,68,0.2)]"
                >
                  <BellRing className="h-3.5 w-3.5 text-red-400 animate-bounce" />
                  <span>Alarm Alert</span>
                </button>
              </div>
            </div>

          </div>

        </div>

        {/* ------------------------------------------------------ */}
        {/* RIGHT COLUMN: Compact AI Intelligence Panel            */}
        {/* Placed beside the video on desktop (~25-30% width)     */}
        {/* ------------------------------------------------------ */}
        <div className="xl:col-span-4 2xl:col-span-3 space-y-3">
          
          <div className="bg-[#0b0f19] border border-slate-900 rounded-xl p-4 shadow-xl space-y-4">
            
            {/* Header: AI Detection with Latency Badge */}
            <div className="flex items-center justify-between border-b border-slate-900 pb-2.5">
              <div className="flex items-center gap-2 font-sans font-bold text-xs uppercase tracking-wider text-slate-100">
                <span className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
                <span>AI DETECTION</span>
              </div>
              <div className="text-[10px] font-mono text-emerald-400 font-bold flex items-center gap-1 bg-emerald-950/60 border border-emerald-500/30 px-2 py-0.5 rounded">
                <span>✦</span>
                <span>{v380CameraStatus?.capture_latency_ms ? `${v380CameraStatus.capture_latency_ms} ms` : '33.5 ms'}</span>
              </div>
            </div>

            {/* Highlighted Current Detection Card */}
            <div className={`p-3.5 rounded-xl border transition-all ${
              detectionStatus === 'CONFIRMED'
                ? 'bg-red-950/20 border-red-500/40 shadow-[0_0_15px_rgba(239,68,68,0.15)]'
                : detectionStatus.startsWith('CONFIRMING')
                ? 'bg-cyan-950/20 border-cyan-500/40 shadow-[0_0_15px_rgba(6,182,212,0.15)]'
                : detectionStatus === 'LOW CONFIDENCE'
                ? 'bg-amber-950/20 border-amber-500/40 shadow-[0_0_15px_rgba(245,158,11,0.15)]'
                : 'bg-slate-950/60 border-slate-800'
            }`}>
              <div className="flex items-center justify-between">
                
                {/* Left: Species Icon & Name */}
                <div className="flex items-center gap-3">
                  <div className={`h-11 w-11 rounded-lg border flex items-center justify-center text-2xl ${
                    detectionStatus === 'CONFIRMED'
                      ? 'bg-red-500/15 border-red-500/30 text-red-400'
                      : detectionStatus.startsWith('CONFIRMING')
                      ? 'bg-cyan-500/15 border-cyan-500/30 text-cyan-400'
                      : detectionStatus === 'LOW CONFIDENCE'
                      ? 'bg-amber-500/15 border-amber-500/30 text-amber-400'
                      : 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400'
                  }`}>
                    {displayEmoji}
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[9px] font-mono text-slate-500 uppercase tracking-wider">
                        Current Detection
                      </span>
                      <span className={`px-1.5 py-0.2 rounded text-[7px] font-mono font-bold uppercase border ${
                        detectionStatus === 'CONFIRMED' ? 'bg-red-500/20 text-red-400 border-red-500/30' :
                        detectionStatus.startsWith('CONFIRMING') ? 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30 animate-pulse' :
                        detectionStatus === 'LOW CONFIDENCE' ? 'bg-amber-500/20 text-amber-400 border-amber-500/30 font-black' :
                        'bg-slate-800 text-slate-400 border-slate-700'
                      }`}>
                        {detectionStatus}
                      </span>
                    </div>
                    <span className="text-lg font-extrabold text-slate-100 font-sans block leading-tight">
                      {displaySpecies}
                    </span>
                    <span className="text-[9px] text-slate-400 italic block">
                      *{displayScientific}*
                    </span>
                  </div>
                </div>

                {/* Right: Big Confidence Percentage */}
                <div className="text-right">
                  <span className={`text-2xl font-black font-mono block leading-none ${
                    detectionStatus === 'CONFIRMED'
                      ? 'text-red-400'
                      : detectionStatus.startsWith('CONFIRMING')
                      ? 'text-cyan-400'
                      : detectionStatus === 'LOW CONFIDENCE'
                      ? 'text-amber-400'
                      : 'text-emerald-400'
                  }`}>
                    {displayConfidence}%
                  </span>
                  <span className="text-[8px] font-mono uppercase tracking-wider block mt-1">
                    {Number(displayConfidence) >= 75 ? (
                      <span className="text-emerald-400 font-bold">✓ Met &ge; 75%</span>
                    ) : (
                      <span className="text-amber-400 font-bold">&lt; 75% Gate</span>
                    )}
                  </span>
                </div>

              </div>
            </div>

            {/* Threat Level & Status Row (2 Columns) */}
            <div className="grid grid-cols-2 gap-2.5">
              
              {/* Threat Level Box */}
              <div className="bg-slate-950/80 border border-slate-900 rounded-lg p-2.5 space-y-1">
                <span className="text-[8px] font-mono text-slate-500 block uppercase tracking-wider">
                  THREAT LEVEL
                </span>
                <div className="flex items-center justify-between">
                  <span className={`text-xs font-mono font-extrabold uppercase ${
                    displayThreat === 'CRITICAL' || displayThreat === 'HIGH' ? 'text-red-400' :
                    displayThreat === 'MEDIUM' ? 'text-amber-400' : 'text-emerald-400'
                  }`}>
                    {displayThreat}
                  </span>
                  {/* 5-segment LED gauge */}
                  <div className="flex gap-0.5">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <div
                        key={i}
                        className={`h-2.5 w-2 rounded-sm ${
                          i <= getThreatBlocksCount()
                            ? (displayThreat === 'CRITICAL' || displayThreat === 'HIGH')
                              ? 'bg-red-500 shadow-[0_0_6px_rgba(239,68,68,0.5)]'
                              : 'bg-amber-500'
                            : 'bg-slate-900'
                        }`}
                      />
                    ))}
                  </div>
                </div>
              </div>

              {/* Status Box */}
              <div className="bg-slate-950/80 border border-slate-900 rounded-lg p-2.5 space-y-1">
                <span className="text-[8px] font-mono text-slate-500 block uppercase tracking-wider">
                  DETECTION STATUS
                </span>
                <div className={`flex items-center gap-1.5 text-xs font-mono font-bold ${
                  detectionStatus === 'CONFIRMED' ? 'text-red-400' :
                  detectionStatus.startsWith('CONFIRMING') ? 'text-cyan-400' :
                  detectionStatus === 'LOW CONFIDENCE' ? 'text-amber-400' :
                  'text-slate-400'
                }`}>
                  <Eye className="h-3.5 w-3.5" />
                  <span className="truncate">{detectionStatus}</span>
                </div>
              </div>

            </div>

            {/* 4-Item Quick Metadata Grid */}
            <div className="grid grid-cols-4 gap-1.5 p-2 bg-slate-950/90 rounded-lg border border-slate-900 text-center font-mono">
              <div className="space-y-0.5">
                <span className="text-[7px] text-slate-500 uppercase block">CAMERA</span>
                <span className="text-[10px] text-slate-200 font-bold block truncate">Cam 1 (PTZ)</span>
              </div>
              <div className="space-y-0.5">
                <span className="text-[7px] text-slate-500 uppercase block">TRACKING ID</span>
                <span className="text-[10px] text-emerald-400 font-bold block truncate">{displayCameraId}</span>
              </div>
              <div className="space-y-0.5">
                <span className="text-[7px] text-slate-500 uppercase block">FRAMES</span>
                <span className="text-[10px] text-slate-200 font-bold block">12</span>
              </div>
              <div className="space-y-0.5">
                <span className="text-[7px] text-slate-500 uppercase block">DECISION</span>
                <span className={`text-[10px] font-bold block truncate ${isBelowConfidenceThreshold ? 'text-amber-400' : (hasConfidentTarget ? 'text-red-400' : 'text-slate-400')}`}>
                  {isBelowConfidenceThreshold ? 'Filtered' : (hasConfidentTarget ? 'Trigger' : 'Monitor')}
                </span>
              </div>
            </div>

            {/* Secondary Intelligence Tab Navigation */}
            <div className="space-y-3 pt-1 border-t border-slate-900">
              <div className="flex items-center p-0.5 bg-slate-950 rounded-lg border border-slate-900 text-[10px] font-mono">
                <button
                  onClick={() => setActiveIntelTab('classification')}
                  className={`flex-1 py-1 rounded font-bold transition-all ${
                    activeIntelTab === 'classification'
                      ? 'bg-slate-900 text-slate-100 border border-slate-800 shadow'
                      : 'text-slate-500 hover:text-slate-300'
                  }`}
                >
                  Classification
                </button>
                <button
                  onClick={() => setActiveIntelTab('history')}
                  className={`flex-1 py-1 rounded font-bold transition-all ${
                    activeIntelTab === 'history'
                      ? 'bg-slate-900 text-slate-100 border border-slate-800 shadow'
                      : 'text-slate-500 hover:text-slate-300'
                  }`}
                >
                  Detection History
                </button>
                <button
                  onClick={() => setActiveIntelTab('system')}
                  className={`flex-1 py-1 rounded font-bold transition-all ${
                    activeIntelTab === 'system'
                      ? 'bg-slate-900 text-slate-100 border border-slate-800 shadow'
                      : 'text-slate-500 hover:text-slate-300'
                  }`}
                >
                  System Info
                </button>
              </div>

              {/* Tab 1: Classification Score Bars */}
              {activeIntelTab === 'classification' && (
                <div className="space-y-2 text-[10px] font-mono">
                  {isBelowConfidenceThreshold && (
                    <div className="p-2 rounded bg-amber-500/10 border border-amber-500/30 text-amber-300 text-[9px] font-mono mb-2 flex items-center justify-between">
                      <span>⚠️ UNKNOWN/UNCERTAIN ({rawCandidateSpecies || 'Candidate'})</span>
                      <span className="font-bold">{displayConfidence}% (&lt; 75% Gate)</span>
                    </div>
                  )}
                  {isConfirming && (
                    <div className="p-2 rounded bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-[9px] font-mono mb-2 flex items-center justify-between animate-pulse">
                      <span>⏳ CONFIRMING {rawCandidateSpecies}</span>
                      <span className="font-bold">{displayConfidence}% (2.5s window)</span>
                    </div>
                  )}
                  {[
                    SPECIES_TAXONOMY[8], // Human
                    SPECIES_TAXONOMY[0], // Wild Boar
                    SPECIES_TAXONOMY[2], // Spotted Deer
                    SPECIES_TAXONOMY[1], // Nilgai
                    SPECIES_TAXONOMY[6], // Cattle
                    SPECIES_TAXONOMY[7], // Goat
                  ].map((tax) => {
                    const isCandidateMatch = rawCandidateSpecies && rawCandidateSpecies.toLowerCase() === tax.class.toLowerCase();
                    const isSelected = hasConfidentTarget && isCandidateMatch;
                    const isCandidateActive = (isHighConfidence || isBelowConfidenceThreshold) && isCandidateMatch;
                    const scorePct = isCandidateActive ? `${displayConfidence}%` : "0.0%";
                    const barColor = isSelected ? 'bg-red-500' : (isConfirming && isCandidateMatch ? 'bg-cyan-500' : (isBelowConfidenceThreshold && isCandidateMatch ? 'bg-amber-500' : 'bg-slate-800'));
                    const textColor = isSelected ? 'text-red-400 font-bold' : (isConfirming && isCandidateMatch ? 'text-cyan-400 font-bold' : (isBelowConfidenceThreshold && isCandidateMatch ? 'text-amber-400 font-bold' : 'text-slate-400'));

                    return (
                      <div key={tax.class} className="space-y-1">
                        <div className="flex justify-between font-sans">
                          <span className={textColor}>
                            {tax.class}
                            {isBelowConfidenceThreshold && isCandidateMatch && " (Low Conf)"}
                            {isConfirming && isCandidateMatch && " (Confirming)"}
                          </span>
                          <span className={`${textColor} font-mono`}>
                            {scorePct}
                          </span>
                        </div>
                        <div className="h-1.5 w-full bg-slate-950 rounded-full overflow-hidden border border-slate-900">
                          <div 
                            className={`h-full rounded-full transition-all duration-500 ${barColor}`} 
                            style={{ width: isCandidateActive ? `${Math.min(Number(displayConfidence), 100)}%` : '0%' }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Tab 2: Compact Detection History */}
              {activeIntelTab === 'history' && (
                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {(recentEvents.length > 0 ? recentEvents.slice(0, 4) : [
                    { species: "Human", code: "WS-SEC-HM", location: "North Field", time: "20:50:53", confidence: 84.3, threat: "CRITICAL" },
                    { species: "Wild Boar", code: "WS-WL-WB", location: "North Field", time: "20:23:15", confidence: 94.2, threat: "HIGH" },
                    { species: "Spotted Deer", code: "WS-WL-SD", location: "West Field", time: "19:58:42", confidence: 93.9, threat: "MEDIUM" },
                    { species: "Nilgai", code: "WS-WL-NG", location: "East Field", time: "19:42:11", confidence: 96.2, threat: "MEDIUM" }
                  ]).map((row, idx) => (
                    <div key={idx} className="p-2 rounded bg-slate-950 border border-slate-900 flex items-center justify-between text-[9px] font-mono">
                      <div>
                        <span className="text-slate-200 font-bold block">{row.species}</span>
                        <span className="text-slate-500 block">{row.time} • {row.location}</span>
                      </div>
                      <div className="text-right">
                        <span className="text-emerald-400 font-bold block">{row.confidence}%</span>
                        <span className={`px-1 py-0.2 rounded text-[7px] font-bold uppercase border ${getThreatBadgeColor(row.threat)}`}>
                          {row.threat}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Tab 3: System Diagnostics Info */}
              {activeIntelTab === 'system' && (
                <div className="space-y-1.5 text-[9px] font-mono text-slate-400 p-2 bg-slate-950 rounded-lg border border-slate-900">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Capture Device:</span>
                    <span className="text-slate-200 font-bold">{v380CameraStatus?.source || 'OBS Virtual Cam [Idx 2]'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Resolution:</span>
                    <span className="text-slate-200">{v380CameraStatus?.resolution || '640x480'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Frame Delivery:</span>
                    <span className="text-emerald-400 font-bold">{v380CameraStatus?.fps || 30} FPS</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">AI Model Tensor:</span>
                    <span className="text-slate-200">YOLOv11 PyTorch (FP32)</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Zero-Stale Buffer:</span>
                    <span className="text-slate-200">1 Frame (Low-Latency)</span>
                  </div>
                </div>
              )}

            </div>

          </div>

        </div>

      </div>

      {/* ======================================================== */}
      {/* 3. COLLAPSIBLE SECONDARY DRAWERS (Underneath Workspace)   */}
      {/* ======================================================== */}
      <div className="space-y-2 pt-2">
        
        {/* Drawer 1: Detection Pipeline Stepper */}
        <div className="bg-[#0b0f19] border border-slate-900 rounded-xl overflow-hidden shadow-md">
          <button
            onClick={() => setShowPipelineDrawer(!showPipelineDrawer)}
            className="w-full px-4 py-2.5 flex items-center justify-between text-left hover:bg-slate-900/30 transition-colors"
          >
            <span className="text-xs font-mono font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
              <Layers className="h-3.5 w-3.5 text-emerald-400" />
              SURVEILLANCE DIGITAL TWIN PIPELINE CHAIN
            </span>
            <div className="flex items-center gap-2 text-slate-500">
              <span className="text-[10px] font-mono hidden sm:inline">
                {showPipelineDrawer ? "Hide Details" : "Show Full 7-Step Chain"}
              </span>
              {showPipelineDrawer ? <ChevronUpIcon className="h-4 w-4" /> : <ChevronDownIcon className="h-4 w-4" />}
            </div>
          </button>

          {showPipelineDrawer && (
            <div className="p-4 border-t border-slate-900/80 bg-slate-950/40">
              <div className="flex flex-col md:flex-row justify-between items-center gap-3 py-1 overflow-x-auto">
                {[
                  { id: 1, label: "Frame Capture", sub: "V380 Pro OBS Bridge" },
                  { id: 2, label: "Object Detection", sub: hasConfidentTarget ? `BBox: [${primaryDet?.bbox?.map(x=>Math.round(x)).join(', ') || '120, 95, 340, 480'}]` : 'Spatial Localization' },
                  { id: 3, label: "YOLO Inference", sub: `${v380CameraStatus?.capture_latency_ms || 33.5}ms Pass` },
                  { id: 4, label: "Species Class", sub: isBelowConfidenceThreshold ? `UNKNOWN/UNCERTAIN (< 75%)` : `${displaySpecies} [${displayCode}]` },
                  { id: 5, label: "Threat Assess", sub: isBelowConfidenceThreshold ? `Suppressed (< 75% Gate)` : (isConfirming ? `Pending (${displayConfidence}%)` : `Threat: ${displayThreat} (${displayConfidence}%)`) },
                  { id: 6, label: "Decision Engine", sub: isBelowConfidenceThreshold ? "Suppressed / Standby" : (isConfirming ? "Confirmation Window" : (displayThreat === 'CRITICAL' ? "Human Security Alert" : "Automated Deterrent")) },
                  { id: 7, label: "Alert & Response", sub: isBelowConfidenceThreshold ? "Deterrent Suppressed" : "Dispatched to Farmer Hub" }
                ].map((step, index, arr) => (
                  <React.Fragment key={step.id}>
                    <div className="flex items-center gap-2">
                      <div className="h-7 w-7 rounded-full bg-emerald-500 text-slate-950 font-mono text-xs font-bold flex items-center justify-center shadow">
                        {step.id}
                      </div>
                      <div className="text-left leading-tight">
                        <p className="text-[10px] font-bold text-slate-200">{step.label}</p>
                        <p className="text-[8px] font-mono text-slate-400">{step.sub}</p>
                      </div>
                    </div>
                    {index < arr.length - 1 && (
                      <ArrowRight className="hidden md:block h-3.5 w-3.5 text-slate-700" />
                    )}
                  </React.Fragment>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Drawer 2: Deterrent Response Actuators & ESP32 Node */}
        <div className="bg-[#0b0f19] border border-slate-900 rounded-xl overflow-hidden shadow-md">
          <button
            onClick={() => setShowActuatorsDrawer(!showActuatorsDrawer)}
            className="w-full px-4 py-2.5 flex items-center justify-between text-left hover:bg-slate-900/30 transition-colors"
          >
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                <Shield className="h-3.5 w-3.5 text-blue-400" />
                HARDWARE DETERRENT ACTUATORS (ESP32 EDGE NODE: {esp32Status.ip})
              </span>
              <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${
                esp32Status.online 
                  ? esp32Status.is_active 
                    ? "bg-red-500/20 text-red-400 border border-red-500/30 animate-pulse" 
                    : "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30" 
                  : "bg-slate-800 text-slate-400 border border-slate-700"
              }`}>
                {esp32Status.online ? (esp32Status.is_active ? "⚡ DETERRENT ACTIVE" : "● ESP32 ONLINE") : "○ ESP32 OFFLINE"}
              </span>
            </div>
            <div className="flex items-center gap-2 text-slate-500">
              <span className="text-[10px] font-mono hidden sm:inline">
                {showActuatorsDrawer ? "Hide Actuators" : "Show Actuators Status"}
              </span>
              {showActuatorsDrawer ? <ChevronUpIcon className="h-4 w-4" /> : <ChevronDownIcon className="h-4 w-4" />}
            </div>
          </button>

          {showActuatorsDrawer && (
            <div className="p-4 border-t border-slate-900/80 bg-slate-950/40 space-y-4">
              
              {/* Target Hardware Signal IP & Trigger Controller */}
              <TargetTriggerController 
                apiBaseUrl={apiBaseUrl}
                onTargetChange={(t) => {
                  setEsp32Status(prev => ({
                    ...prev,
                    ip: t.ip,
                    port: t.port
                  }));
                }}
              />

              {/* 4 Status Indicator Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {/* Siren */}
                <div className={`p-3 rounded-xl border flex flex-col justify-between h-20 transition-all ${
                  isSirenTriggered 
                    ? 'bg-red-500/15 border-red-500/40 text-red-400 ring-1 ring-red-500/30' 
                    : 'bg-slate-950/60 border-slate-900 text-slate-400'
                }`}>
                  <div className="flex items-center justify-between">
                    <span className="text-[9px] font-bold uppercase tracking-wider">Acoustic Siren</span>
                    <Volume2 className={`h-4 w-4 ${isSirenTriggered ? 'animate-bounce text-red-400' : ''}`} />
                  </div>
                  <span className="text-[8px] font-mono font-bold">{isSirenTriggered ? '⚡ ACTIVE (SPEAKER ON)' : 'STANDBY'}</span>
                </div>

                {/* Floodlight */}
                <div className={`p-3 rounded-xl border flex flex-col justify-between h-20 transition-all ${
                  isLightTriggered 
                    ? 'bg-amber-500/15 border-amber-500/40 text-amber-400 ring-1 ring-amber-500/30' 
                    : 'bg-slate-950/60 border-slate-900 text-slate-400'
                }`}>
                  <div className="flex items-center justify-between">
                    <span className="text-[9px] font-bold uppercase tracking-wider">Strobe Floodlight</span>
                    <Lightbulb className={`h-4 w-4 ${isLightTriggered ? 'text-amber-300 animate-pulse' : ''}`} />
                  </div>
                  <span className="text-[8px] font-mono font-bold">{isLightTriggered ? '⚡ ACTIVE (STROBE ON)' : 'STANDBY'}</span>
                </div>

                {/* Farmer Mobile Alert */}
                <div className="p-3 rounded-xl border border-slate-900 bg-slate-950/60 text-slate-400 flex flex-col justify-between h-20">
                  <div className="flex items-center justify-between">
                    <span className="text-[9px] font-bold uppercase">Mobile Push</span>
                    <Smartphone className="h-4 w-4 text-blue-400" />
                  </div>
                  <span className="text-[8px] font-mono">STANDBY (GSM)</span>
                </div>

                {/* Event Logger */}
                <div className="p-3 rounded-xl border border-slate-900 bg-slate-950/60 text-slate-400 flex flex-col justify-between h-20">
                  <div className="flex items-center justify-between">
                    <span className="text-[9px] font-bold uppercase">Cloud Event Sync</span>
                    <FileText className="h-4 w-4 text-purple-400" />
                  </div>
                  <span className="text-[8px] font-mono">CONNECTED</span>
                </div>

              </div>
            </div>
          )}
        </div>


      </div>

      {/* ======================================================== */}
      {/* 4. MODALS & SETUP GUIDES                                 */}
      {/* ======================================================== */}
      {/* Architecture Modal */}
      {showArchitectureModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0b0f19] border border-slate-800 rounded-2xl max-w-xl w-full p-5 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-bold text-slate-100 flex items-center gap-2 text-sm font-mono uppercase">
                <RadioTower className="h-4 w-4 text-emerald-400" />
                V380 Pro &rarr; OBS Virtual Camera Architecture
              </h3>
              <button 
                onClick={() => setShowArchitectureModal(false)}
                className="text-slate-400 hover:text-white font-mono text-sm"
              >
                ✕
              </button>
            </div>
            <div className="space-y-2 text-xs font-mono text-slate-300">
              <p>1. V380 Pro Wi-Fi camera streams encrypted video to V380 Pro Desktop Client.</p>
              <p>2. OBS Studio captures the authenticated window and outputs through <strong>OBS Virtual Camera [Index 2]</strong>.</p>
              <p>3. Python OpenCV (DirectShow, Buffer=1) ingests the stream with zero stale-frame latency.</p>
              <p>4. FastAPI broadcasts multipart MJPEG stream to React dashboard with YOLOv11 tensor overlays.</p>
            </div>
            <div className="pt-2 text-right">
              <button
                onClick={() => setShowArchitectureModal(false)}
                className="px-4 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold font-mono text-xs"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DroidCam Guide Modal */}
      {showCameraGuide && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0b0f19] border border-slate-800 rounded-2xl max-w-xl w-full p-5 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-bold text-slate-100 flex items-center gap-2 text-sm font-mono uppercase">
                <Smartphone className="h-4 w-4 text-blue-400" />
                Android DroidCam Setup
              </h3>
              <button 
                onClick={() => setShowCameraGuide(false)}
                className="text-slate-400 hover:text-white font-mono text-sm"
              >
                ✕
              </button>
            </div>
            <div className="space-y-2 text-xs font-mono text-slate-300">
              <p>1. Open DroidCam on your Android smartphone connected to the same Wi-Fi network.</p>
              <p>2. Note the Wi-Fi IP and Port shown in the DroidCam app (e.g. <code>{droidCamIp}:{droidCamPort}</code>).</p>
              <p>3. DroidCam Virtual Camera is available in DirectShow devices.</p>
            </div>
            <div className="pt-2 text-right">
              <button
                onClick={() => setShowCameraGuide(false)}
                className="px-4 py-1.5 rounded-lg bg-blue-500 hover:bg-blue-400 text-slate-950 font-bold font-mono text-xs"
              >
                Got It
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
