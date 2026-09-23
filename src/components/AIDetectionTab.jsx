import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Volume2, Lightbulb, ShieldAlert, Sparkles, Cpu, 
  Play, Film, Scan, Smartphone, FileText, ArrowRight,
  Camera, Upload, RefreshCw, CheckCircle2, AlertTriangle,
  FolderOpen, Zap, VideoOff, Wifi, Eye, Radio, SwitchCamera,
  Info, ExternalLink, Settings, RadioTower, Video, Layers, Maximize2
} from 'lucide-react';
import { getTranslation } from '../utils/translations';
import { SPECIES_TAXONOMY, getSpeciesMetadataByName } from '../utils/speciesMapping';

export default function AIDetectionTab({ 
  simulationState, 
  currentScenario, 
  language,
  onLiveDetection 
}) {
  const t = (key) => getTranslation(language, key);

  // Input source: 'v380_stream' | 'dataset' | 'webcam' | 'upload' | 'simulation'
  const [sourceMode, setSourceMode] = useState('v380_stream');
  const [backendStatus, setBackendStatus] = useState({ online: false, checking: true, info: null });
  const [apiBaseUrl, setApiBaseUrl] = useState(import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000");
  const [testImages, setTestImages] = useState([]);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [isInferring, setIsInferring] = useState(false);
  const [confidenceThreshold, setConfidenceThreshold] = useState(0.25);
  const [selectedNodeId, setSelectedNodeId] = useState(1);

  // V380 Pro -> OBS Virtual Camera Stream State
  const [v380StreamMode, setV380StreamMode] = useState('annotated'); // 'annotated' | 'raw'
  const [v380StreamKey, setV380StreamKey] = useState(Date.now());
  const [v380CameraStatus, setV380CameraStatus] = useState(null);
  const [showArchitectureModal, setShowArchitectureModal] = useState(false);

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

  // Continuous Auto-Scan Live Inference
  const [autoScanActive, setAutoScanActive] = useState(false);
  const [showCameraGuide, setShowCameraGuide] = useState(false);

  const [uploadedImagePreview, setUploadedImagePreview] = useState(null);

  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const fileInputRef = useRef(null);
  const autoScanIntervalRef = useRef(null);

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
        const isDroid = /droidcam|droid|android|phone|wireless/i.test(label);
        const isIntegrated = /integrated|internal|facetime|built-in/i.test(label);
        return {
          deviceId: dev.deviceId,
          label,
          displayLabel: isDroid 
            ? `📱 ${label} (Android Mobile)`
            : isIntegrated 
            ? `💻 ${label} (Integrated)` 
            : `📷 ${label}`,
          isDroidCam: isDroid,
          isIntegrated
        };
      });

      setAvailableCameras(formatted);

      // Auto-select DroidCam if present and no explicit selection
      const savedId = localStorage.getItem('wildshield_selected_camera_id');
      const savedExists = formatted.some(c => c.deviceId === savedId);

      if (!savedExists) {
        const droidDevice = formatted.find(c => c.isDroidCam);
        if (droidDevice) {
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
          status: "offline",
          message: `Unable to connect to DroidCam at ${ip}:${port}`
        });
      }
    } catch (e) {
      setDroidCamStatus({
        online: false,
        checking: false,
        status: "unreachable",
        message: `Network error reaching ${ip}:${port}`
      });
    }
  }, [apiBaseUrl, droidCamIp, droidCamPort]);

  // Initial mount: Check backend, enumerate cameras, probe DroidCam IP
  useEffect(() => {
    checkBackendAndFetchImages();
    fetchRecentEvents();
    enumerateCameraDevices();
    checkDroidCamIpStatus();

    // Listen for device changes (e.g. DroidCam newly connected via USB/WiFi)
    if (navigator.mediaDevices && navigator.mediaDevices.addEventListener) {
      navigator.mediaDevices.addEventListener('devicechange', enumerateCameraDevices);
      return () => {
        navigator.mediaDevices.removeEventListener('devicechange', enumerateCameraDevices);
      };
    }
  }, [enumerateCameraDevices, checkDroidCamIpStatus]);

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
            if (data.latest_detection) {
              setLiveDetectionResult(data.latest_detection);
              if (onLiveDetection) {
                onLiveDetection(data.latest_detection);
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
    };
  }, []);

  // Start / Switch Webcam Stream with specific device ID
  const startWebcam = async (targetDeviceId = selectedCameraId) => {
    // 1. Stop existing stream if any
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
      // Build device constraints
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
        // Fallback without exact constraint if deviceId failed
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

      // Re-enumerate to capture populated device labels after permission
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

  // Handle switching camera device from dropdown
  const handleCameraChange = (newDeviceId) => {
    setSelectedCameraId(newDeviceId);
    localStorage.setItem('wildshield_selected_camera_id', newDeviceId);
    if (webcamActive) {
      startWebcam(newDeviceId);
    }
  };

  // Cycle to next available camera
  const handleFlipCamera = () => {
    if (availableCameras.length <= 1) return;
    const currentIdx = availableCameras.findIndex(c => c.deviceId === selectedCameraId);
    const nextIdx = (currentIdx + 1) % availableCameras.length;
    const nextDev = availableCameras[nextIdx];
    if (nextDev) {
      handleCameraChange(nextDev.deviceId);
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

  // Run YOLO model on selected test dataset image with state reset
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

  // Handle uploaded image file
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

  // Capture webcam / DroidCam frame and send to YOLO model
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

  // Continuous Auto-Scan Interval Loop
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

  // Next sample button
  const handleNextSample = () => {
    if (testImages.length === 0) return;
    const nextIdx = (selectedImageIndex + 1) % testImages.length;
    setSelectedImageIndex(nextIdx);
    setSourceMode('dataset');
    runTestImageInference(testImages[nextIdx].filename);
  };

  // Trigger modular response test simulation
  const handleTestResponseTrigger = async (actuators) => {
    if (!liveDetectionResult?.primary_detection) return;
    try {
      await fetch(`${apiBaseUrl}/api/trigger-response`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          detection_id: liveDetectionResult.event_id,
          species: liveDetectionResult.primary_detection.class,
          actuators: actuators || liveDetectionResult.primary_detection.actuators,
          mode: "simulation"
        })
      });
    } catch (e) {
      // Ignored in offline mode
    }
  };

  // Real detection states
  const isRealModelMode = sourceMode === 'v380_stream' || sourceMode === 'dataset' || sourceMode === 'upload' || sourceMode === 'webcam' || Boolean(liveDetectionResult?.primary_detection);
  const primaryDet = isRealModelMode ? liveDetectionResult?.primary_detection : null;
  const hasConfidentTarget = isRealModelMode 
    ? (primaryDet !== null && primaryDet !== undefined)
    : (simulationState >= 2 && simulationState <= 4);

  // Exact data from model inference
  const meta = primaryDet ? getSpeciesMetadataByName(primaryDet.class) : (sourceMode === 'simulation' ? getSpeciesMetadataByName(activeScenario.species) : null);
  
  const displaySpecies = primaryDet ? primaryDet.class : (sourceMode === 'simulation' ? activeScenario.species : "NO CONFIDENT DETECTION");
  const displayCode = primaryDet ? primaryDet.code : (meta ? meta.code : "N/A");
  const displayConfidence = primaryDet ? primaryDet.confidence_pct : (sourceMode === 'simulation' && simulationState >= 2 ? activeScenario.confidenceBase : 0);
  const displayThreat = primaryDet ? primaryDet.threat : (sourceMode === 'simulation' ? activeScenario.threat : "NONE");
  const displayIntrusion = primaryDet ? primaryDet.intrusion : (sourceMode === 'simulation' && simulationState >= 3);
  const displayEmoji = primaryDet ? primaryDet.emoji : (meta ? meta.emoji : "🐾");
  const displayScientific = primaryDet ? (primaryDet.scientific_name || meta?.scientific) : meta?.scientific;
  const displayTime = liveDetectionResult?.time_formatted || "10:23:15 PM";
  const displayNode = liveDetectionResult?.node_name || activeScenario.nodeName;
  const displayCameraId = liveDetectionResult?.camera_id || "FN-1";

  // Actuators activation based on real model response
  const isSirenTriggered = isRealModelMode 
    ? (primaryDet?.actuators?.siren && displayIntrusion)
    : (simulationState === 4 && activeScenario.actuators.siren);

  const isLightTriggered = isRealModelMode
    ? (primaryDet?.actuators?.floodlight && displayIntrusion)
    : (simulationState === 4 && activeScenario.actuators.floodlight);

  const isAlertTriggered = isRealModelMode
    ? (displayIntrusion)
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
    if (threat === 'HIGH' || threat === 'CRITICAL') return "text-red-400 border-red-500/20 bg-red-500/10 font-bold";
    if (threat === 'MEDIUM' || threat === 'WARNING') return "text-amber-400 border-amber-500/20 bg-amber-500/10";
    return "text-green-400 border-green-500/20 bg-green-500/10";
  };

  return (
    <div className="space-y-6 select-none text-left">
      
      {/* 1. TOP HEADER STATISTICS PANEL */}
      <div className="bg-[#0b0f19] border border-slate-900 rounded-xl p-4 flex flex-col md:flex-row items-center justify-between gap-4 shadow-md">
        <div className="flex items-center gap-3">
          <div className="h-8.5 w-8.5 rounded-lg bg-green-500/10 border border-green-500/20 text-green-500 flex items-center justify-center">
            <Cpu className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-extrabold text-slate-100 font-sans tracking-wide uppercase leading-none">
                {t('aiDetection')}
              </h2>
              {backendStatus.online ? (
                <span className="px-2 py-0.5 rounded bg-green-500/10 border border-green-500/30 text-green-400 font-mono text-[9px] font-bold flex items-center gap-1">
                  <CheckCircle2 className="h-2.5 w-2.5" />
                  YOLOv11 Live Engine (best.pt)
                </span>
              ) : (
                <span className="px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/30 text-amber-400 font-mono text-[9px] font-bold flex items-center gap-1">
                  <AlertTriangle className="h-2.5 w-2.5" />
                  Simulation Standby
                </span>
              )}
              {droidCamStatus.online && (
                <span className="px-2 py-0.5 rounded bg-blue-500/10 border border-blue-500/30 text-blue-400 font-mono text-[9px] font-bold flex items-center gap-1">
                  <Smartphone className="h-2.5 w-2.5" />
                  DroidCam ({droidCamIp}) Ready
                </span>
              )}
            </div>
            <p className="text-[10px] text-slate-500 font-mono mt-1">
              WildShield YOLOv11 Surveillance Engine • Android DroidCam & Edge Nodes
            </p>
          </div>
        </div>

        {/* Live status chips */}
        <div className="flex items-center flex-wrap gap-4 text-[10px] font-mono">
          <div className="flex items-center gap-1.5 bg-slate-950/60 px-2.5 py-1 rounded border border-slate-900">
            <span className="text-slate-500">ACTIVE CAM:</span>
            <span className="text-blue-400 font-bold truncate max-w-[140px]" title={activeCameraLabel}>
              {webcamActive ? (isDroidCamDevice ? "📱 DroidCam Mobile" : activeCameraLabel) : "Standby"}
            </span>
          </div>

          <div className="flex items-center gap-1.5 bg-slate-950/60 px-2.5 py-1 rounded border border-slate-900">
            <span className="text-slate-500">DEVICE:</span>
            <span className="text-slate-200 font-bold uppercase">{backendStatus.info?.device || "CPU"}</span>
          </div>

          <div className="flex items-center gap-2 px-2.5 py-1 bg-green-500/10 text-green-500 rounded border border-green-500/20 font-bold">
            <span className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />
            <span>{t('status').toUpperCase()}: {backendStatus.online ? "ONLINE" : t('active').toUpperCase()}</span>
          </div>

          <button
            onClick={() => {
              checkBackendAndFetchImages();
              enumerateCameraDevices();
              checkDroidCamIpStatus();
            }}
            title="Refresh Backend & Devices"
            className="p-1.5 rounded bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors border border-slate-800"
          >
            <RefreshCw className={`h-3 w-3 ${backendStatus.checking ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* 2. MODE SELECTOR & CAMERA SELECTION TOOLBAR */}
      <div className="bg-[#0b0f19] border border-slate-900 rounded-xl p-3 flex flex-col gap-3 shadow-md">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center flex-wrap gap-2">
            <span className="text-[10px] font-mono text-slate-400 font-bold uppercase tracking-wider mr-1">
              INPUT SOURCE:
            </span>

            {/* V380 IP Camera -> OBS Virtual Camera Stream */}
            <button
              onClick={() => {
                setSourceMode('v380_stream');
                stopWebcam();
                setLiveDetectionResult(null);
              }}
              className={`px-3 py-1.5 rounded-lg text-[10px] font-mono font-bold transition-all flex items-center gap-1.5 border ${
                sourceMode === 'v380_stream'
                  ? 'bg-emerald-500 text-slate-950 border-emerald-400 shadow-[0_0_14px_rgba(16,185,129,0.45)]'
                  : 'bg-slate-950 text-slate-400 border-slate-900 hover:border-slate-800'
              }`}
            >
              <Video className="h-3.5 w-3.5" />
              <span>V380 CAMERA (OBS BRIDGE)</span>
            </button>

            {/* Live Camera (Android / DroidCam / Webcam) */}
            <button
              onClick={toggleWebcam}
              className={`px-3 py-1.5 rounded-lg text-[10px] font-mono font-bold transition-all flex items-center gap-1.5 border ${
                sourceMode === 'webcam'
                  ? 'bg-blue-500 text-slate-950 border-blue-400 shadow-[0_0_12px_rgba(59,130,246,0.35)]'
                  : 'bg-slate-950 text-slate-400 border-slate-900 hover:border-slate-800'
              }`}
            >
              <Smartphone className="h-3.5 w-3.5" />
              {webcamActive ? 'LIVE CAMERA (ACTIVE)' : 'LIVE CAMERA (DROIDCAM)'}
            </button>

            {/* Test Dataset Mode */}
            <button
              onClick={() => {
                setSourceMode('dataset');
                stopWebcam();
                if (testImages.length > 0) {
                  runTestImageInference(testImages[selectedImageIndex].filename);
                }
              }}
              className={`px-3 py-1.5 rounded-lg text-[10px] font-mono font-bold transition-all flex items-center gap-1.5 border ${
                sourceMode === 'dataset'
                  ? 'bg-green-500 text-slate-950 border-green-400 shadow-[0_0_10px_rgba(34,197,94,0.3)]'
                  : 'bg-slate-950 text-slate-400 border-slate-900 hover:border-slate-800'
              }`}
            >
              <FolderOpen className="h-3 w-3" />
              TEST DATASET ({testImages.length})
            </button>

            {/* Upload Mode */}
            <button
              onClick={() => {
                stopWebcam();
                fileInputRef.current?.click();
              }}
              className={`px-3 py-1.5 rounded-lg text-[10px] font-mono font-bold transition-all flex items-center gap-1.5 border ${
                sourceMode === 'upload'
                  ? 'bg-purple-500 text-slate-950 border-purple-400 shadow-[0_0_10px_rgba(168,85,247,0.3)]'
                  : 'bg-slate-950 text-slate-400 border-slate-900 hover:border-slate-800'
              }`}
            >
              <Upload className="h-3 w-3" />
              UPLOAD PHOTO
            </button>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              accept="image/*"
              className="hidden"
            />

            {/* Simulation Loop Mode */}
            <button
              onClick={() => {
                setSourceMode('simulation');
                stopWebcam();
                setLiveDetectionResult(null);
              }}
              className={`px-3 py-1.5 rounded-lg text-[10px] font-mono font-bold transition-all flex items-center gap-1.5 border ${
                sourceMode === 'simulation'
                  ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-[0_0_10px_rgba(245,158,11,0.3)]'
                  : 'bg-slate-950 text-slate-400 border-slate-900 hover:border-slate-800'
              }`}
            >
              <Zap className="h-3 w-3" />
              DEMO SIMULATION
            </button>
          </div>

          {/* DroidCam Connection Guide Button */}
          <button
            onClick={() => setShowCameraGuide(!showCameraGuide)}
            className="flex items-center gap-1 px-2.5 py-1 rounded bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-slate-200 text-[10px] font-mono border border-slate-800 transition-colors"
          >
            <Info className="h-3 w-3 text-blue-400" />
            <span>DroidCam Setup ({droidCamIp})</span>
          </button>
        </div>

        {/* V380 Pro Stream Controls */}
        {sourceMode === 'v380_stream' && (
          <div className="pt-2 border-t border-slate-900 flex flex-wrap items-center justify-between gap-3 bg-slate-950/40 p-2.5 rounded-lg">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono text-emerald-400 font-bold flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                V380 BRIDGE: OBS VIRTUAL CAM [INDEX 1]
              </span>
              <span className="text-[9px] font-mono text-slate-400 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                {v380CameraStatus?.resolution || '640x480'} • {v380CameraStatus?.fps || 30} FPS
              </span>
            </div>

            <div className="flex items-center gap-2">
              {/* Overlay Toggle */}
              <div className="flex items-center p-0.5 bg-slate-900 rounded border border-slate-800 text-[10px] font-mono">
                <button
                  onClick={() => setV380StreamMode('annotated')}
                  className={`px-2 py-0.5 rounded font-bold transition-all ${
                    v380StreamMode === 'annotated'
                      ? 'bg-emerald-600 text-white'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  AI HUD
                </button>
                <button
                  onClick={() => setV380StreamMode('raw')}
                  className={`px-2 py-0.5 rounded font-bold transition-all ${
                    v380StreamMode === 'raw'
                      ? 'bg-slate-700 text-white'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Raw Feed
                </button>
              </div>

              {/* Refresh Stream */}
              <button
                onClick={() => setV380StreamKey(Date.now())}
                className="p-1 text-slate-400 hover:text-slate-200 rounded bg-slate-900 hover:bg-slate-800 border border-slate-800 transition-colors"
                title="Reload Video Stream"
              >
                <RefreshCw className="h-3 w-3" />
              </button>

              {/* Pipeline Architecture Modal Trigger */}
              <button
                onClick={() => setShowArchitectureModal(!showArchitectureModal)}
                className="px-2 py-0.5 bg-cyan-950/60 hover:bg-cyan-900/80 text-cyan-300 border border-cyan-800/60 rounded text-[10px] font-mono font-bold flex items-center gap-1 transition-colors"
              >
                <Info className="h-3 w-3 text-cyan-400" />
                Pipeline Info
              </button>
            </div>
          </div>
        )}

        {/* Dynamic Controls Bar for Live Camera */}
        {sourceMode === 'webcam' && (
          <div className="pt-2 border-t border-slate-900 flex flex-wrap items-center justify-between gap-3 bg-slate-950/40 p-2.5 rounded-lg">
            
            {/* Camera Device Switcher */}
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono text-slate-400 font-bold flex items-center gap-1">
                <Camera className="h-3 w-3 text-blue-400" />
                SELECT CAMERA:
              </span>

              <select
                value={selectedCameraId}
                onChange={(e) => handleCameraChange(e.target.value)}
                className="bg-slate-900 border border-slate-800 text-slate-200 text-[10px] font-mono rounded px-2.5 py-1 outline-none focus:border-blue-500 max-w-[280px]"
              >
                {availableCameras.length > 0 ? (
                  availableCameras.map((cam, idx) => (
                    <option key={cam.deviceId || idx} value={cam.deviceId}>
                      {cam.displayLabel}
                    </option>
                  ))
                ) : (
                  <option value="">📱 Android Cam / DroidCam Device</option>
                )}
              </select>

              {/* Flip/Switch Camera Icon */}
              {availableCameras.length > 1 && (
                <button
                  onClick={handleFlipCamera}
                  title="Switch to next camera"
                  className="p-1.5 rounded bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 transition-colors"
                >
                  <SwitchCamera className="h-3.5 w-3.5 text-blue-400" />
                </button>
              )}

              {/* Refresh Camera List */}
              <button
                onClick={enumerateCameraDevices}
                title="Re-scan connected cameras"
                className="p-1.5 rounded bg-slate-900 hover:bg-slate-800 text-slate-400 border border-slate-800 transition-colors"
              >
                <RefreshCw className="h-3.5 w-3.5" />
              </button>
            </div>

            {/* Live Camera Capture & Continuous Auto-Scan Controls */}
            {webcamActive && (
              <div className="flex items-center gap-2">
                
                {/* Continuous Auto-Scan Toggle */}
                <button
                  onClick={() => setAutoScanActive(!autoScanActive)}
                  className={`px-3 py-1 rounded text-[10px] font-mono font-bold flex items-center gap-1.5 border transition-all ${
                    autoScanActive
                      ? 'bg-emerald-500 text-slate-950 border-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.4)] animate-pulse'
                      : 'bg-slate-900 text-slate-400 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <RadioTower className="h-3 w-3" />
                  {autoScanActive ? 'AUTOSCAN LIVE (ACTIVE)' : 'ENABLE AUTOSCAN (LIVE AI)'}
                </button>

                {/* Manual Capture & Detect */}
                <button
                  onClick={captureWebcamFrame}
                  disabled={isInferring}
                  className="px-3 py-1 bg-blue-500 hover:bg-blue-400 text-slate-950 font-bold rounded text-[10px] font-mono flex items-center gap-1.5 shadow transition-all"
                >
                  <Camera className="h-3 w-3" />
                  {isInferring ? 'Detecting...' : 'Capture & Detect'}
                </button>
              </div>
            )}
          </div>
        )}

        {/* Dataset Controls */}
        {sourceMode === 'dataset' && testImages.length > 0 && (
          <div className="pt-2 border-t border-slate-900 flex items-center justify-between gap-2 bg-slate-950/40 p-2.5 rounded-lg">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono text-slate-400 font-bold">SELECT IMAGE:</span>
              <select
                value={testImages[selectedImageIndex]?.filename || ""}
                onChange={(e) => {
                  const idx = testImages.findIndex(img => img.filename === e.target.value);
                  if (idx !== -1) {
                    setSelectedImageIndex(idx);
                    runTestImageInference(testImages[idx].filename);
                  }
                }}
                className="bg-slate-900 border border-slate-800 text-slate-200 text-[10px] font-mono rounded px-2.5 py-1 outline-none focus:border-green-500 max-w-[280px]"
              >
                {testImages.map((img) => (
                  <option key={img.filename} value={img.filename}>
                    {img.label || img.filename}
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={handleNextSample}
              disabled={isInferring}
              className="px-2.5 py-1 bg-green-500/10 hover:bg-green-500/20 text-green-400 border border-green-500/30 rounded text-[10px] font-mono font-bold flex items-center gap-1 transition-colors"
            >
              <RefreshCw className={`h-2.5 w-2.5 ${isInferring ? 'animate-spin' : ''}`} />
              Next Sample
            </button>
          </div>
        )}
      </div>

      {/* DroidCam Connection Helper Banner (Collapsible) */}
      <AnimatePresence>
        {showCameraGuide && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-[#0f172a] border border-blue-500/30 rounded-xl p-4 text-[10px] font-mono space-y-2 text-slate-300 overflow-hidden"
          >
            <div className="flex items-center justify-between text-xs font-bold text-blue-400 font-sans border-b border-slate-800 pb-1.5">
              <span className="flex items-center gap-1.5">
                <Smartphone className="h-4 w-4" />
                DroidCam Android Integration (WiFi IP: {droidCamIp})
              </span>
              <button onClick={() => setShowCameraGuide(false)} className="text-slate-400 hover:text-slate-200">✕</button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
              <div className="space-y-1">
                <p className="font-bold text-slate-200 uppercase">Method 1: DroidCam PC Client (Recommended Virtual Webcam)</p>
                <p className="text-slate-400">1. Open DroidCam on your phone (showing IP <strong className="text-white">{droidCamIp}</strong> and Port <strong>4747</strong>).</p>
                <p className="text-slate-400">2. Open DroidCam Client on Windows, enter <strong className="text-white">{droidCamIp}</strong>, and click <strong>Start</strong>.</p>
                <p className="text-slate-400">3. In the dropdown above, select <strong className="text-green-400">"DroidCam Source 2 / Android Mobile"</strong> and click <strong>"Live Camera"</strong>.</p>
              </div>

              <div className="space-y-1">
                <p className="font-bold text-slate-200 uppercase">Method 2: Direct WiFi Stream Status</p>
                <div className="flex items-center gap-2 bg-slate-950 p-2 rounded border border-slate-800">
                  <div className={`h-2 w-2 rounded-full ${droidCamStatus.online ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
                  <span className="text-slate-300 font-bold">
                    {droidCamStatus.online ? `Connected (${droidCamStatus.message})` : `Unreachable (${droidCamIp})`}
                  </span>
                  <button
                    onClick={() => checkDroidCamIpStatus()}
                    className="ml-auto px-2 py-0.5 bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 border border-blue-500/30 rounded text-[9px]"
                  >
                    Test Ping
                  </button>
                </div>
                <p className="text-[9px] text-slate-500">
                  Web browser stream address: <a href={`http://${droidCamIp}:4747`} target="_blank" rel="noreferrer" className="text-blue-400 underline">http://{droidCamIp}:4747</a>
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* V380 -> OBS Architecture Pipeline Banner (Collapsible) */}
      <AnimatePresence>
        {showArchitectureModal && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-[#041a1a] border border-cyan-500/40 rounded-xl p-4 text-[10px] font-mono space-y-3 text-slate-300 overflow-hidden shadow-xl"
          >
            <div className="flex items-center justify-between text-xs font-bold text-cyan-400 font-sans border-b border-cyan-900/60 pb-1.5">
              <span className="flex items-center gap-1.5">
                <Video className="h-4 w-4 text-cyan-400" />
                WildShield AI — Verified Camera Integration Architecture
              </span>
              <button onClick={() => setShowArchitectureModal(false)} className="text-slate-400 hover:text-slate-200">✕</button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2 text-center text-[10px]">
              <div className="p-2.5 rounded-lg bg-slate-950/80 border border-emerald-500/40">
                <div className="text-emerald-400 font-bold">1. V380 IP Camera</div>
                <div className="text-[9px] text-slate-400">Wi-Fi LAN Stream</div>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-950/80 border border-blue-500/40">
                <div className="text-blue-400 font-bold">2. V380 Pro Desktop</div>
                <div className="text-[9px] text-slate-400">Authenticated Display</div>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-950/80 border border-cyan-500/40">
                <div className="text-cyan-400 font-bold">3. OBS Studio</div>
                <div className="text-[9px] text-slate-400">Window Capture Hook</div>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-950/80 border border-indigo-500/40">
                <div className="text-indigo-400 font-bold">4. OBS Virtual Cam</div>
                <div className="text-[9px] text-slate-400">Device Index 1 (640x480)</div>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-950/80 border border-purple-500/40">
                <div className="text-purple-400 font-bold">5. FastAPI + React</div>
                <div className="text-[9px] text-slate-400">YOLO + ESP32 Deterrents</div>
              </div>
            </div>

            <p className="text-[9px] text-slate-400 border-t border-cyan-900/50 pt-1.5">
              Verified Pipeline: Because RTSP/ONVIF direct access requires camera credentials that are not available, OBS Studio captures the authenticated V380 Pro client window and bridges it into Python OpenCV via DirectShow Index 1 at 640x480 resolution @ 30 FPS.
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 3. THREE COLUMN SURVEILLANCE LAYOUT */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        
        {/* Column 1 & 2: Live Camera Viewport */}
        <div className="lg:col-span-2 bg-[#0b0f19] border border-slate-900 rounded-xl p-5 flex flex-col justify-between shadow-lg">
          <div className="flex items-center justify-between text-xs border-b border-slate-900 pb-2 mb-3">
            <span className="font-bold text-slate-100 font-sans uppercase tracking-wider flex items-center gap-1.5">
              <span className={`h-2 w-2 rounded-full ${webcamActive ? 'bg-green-500 animate-pulse' : 'bg-slate-500'}`} />
              {t('liveCameraFeed')}
            </span>
            <span className="text-[10px] text-slate-400 font-mono">
              🎥 {displayCameraId} ({displayNode}) • {sourceMode === 'v380_stream' ? 'OBS Virtual Cam [Idx 1 • 640x480]' : webcamActive ? (isDroidCamDevice ? "Android DroidCam" : activeCameraLabel) : "Standby"}
            </span>
          </div>

          {/* CRT Camera feed viewport */}
          <div className="relative aspect-video w-full bg-black rounded-lg border border-slate-900 overflow-hidden crt-overlay flex items-center justify-center">
            
            {/* Live Indicator Chip */}
            <div className="absolute top-3 left-3 z-20 flex items-center gap-2 font-mono text-[9px] text-white bg-black/70 backdrop-blur-sm px-2 py-1 rounded border border-white/10">
              <span className={`h-2 w-2 rounded-full ${sourceMode === 'v380_stream' || webcamActive ? 'bg-red-500 animate-pulse' : 'bg-slate-500'}`} />
              <span>
                {sourceMode === 'v380_stream'
                  ? 'V380 LIVE CAM (OBS BRIDGE)'
                  : sourceMode === 'webcam' 
                  ? (isDroidCamDevice ? `DROIDCAM (${droidCamIp})` : 'LIVE CAMERA')
                  : sourceMode.toUpperCase()}
              </span>
            </div>

            {/* Auto-Scan Active Radar Badge */}
            {autoScanActive && (
              <div className="absolute top-3 left-36 z-20 flex items-center gap-1.5 font-mono text-[9px] font-bold text-emerald-300 bg-emerald-950/80 backdrop-blur-sm px-2 py-1 rounded border border-emerald-500/40 shadow">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-ping" />
                <span>AI AUTOSCAN ON</span>
              </div>
            )}

            {/* Intrusion Alert Banner */}
            {hasConfidentTarget && (
              <div className={`absolute top-3 right-3 z-20 font-mono text-[9px] font-bold px-2.5 py-1 rounded flex items-center gap-1.5 shadow-lg ${
                displayIntrusion
                  ? 'bg-red-600 text-white animate-pulse'
                  : 'bg-green-600/90 text-white'
              }`}>
                <ShieldAlert className="h-3 w-3" />
                <span>{displayIntrusion ? 'INTRUSION DETECTED' : 'LIVESTOCK / DOMESTIC'}</span>
              </div>
            )}

            {/* Scanline */}
            <div className="absolute top-0 left-0 w-full h-[2.5px] bg-green-500/10 shadow-[0_0_10px_rgba(34,197,94,0.5)] animate-scanline pointer-events-none z-10" />

            {/* 0. V380 Pro -> OBS Virtual Camera Live Stream Viewport */}
            {sourceMode === 'v380_stream' ? (
              <div className="relative w-full h-full flex items-center justify-center bg-black">
                <img
                  key={v380StreamKey}
                  src={`${apiBaseUrl || ''}/api/camera/stream?mode=${v380StreamMode}&t=${v380StreamKey}`}
                  alt="V380 Pro Live Stream"
                  className="w-full h-full object-contain"
                  onError={() => {
                    setTimeout(() => {
                      setV380StreamKey(Date.now());
                    }, 2000);
                  }}
                />

                {/* Telemetry Footer Badge */}
                <div className="absolute bottom-2 left-2 z-20 bg-black/80 backdrop-blur-md px-2.5 py-1 rounded text-[8px] font-mono text-slate-300 flex items-center gap-2 border border-slate-800 shadow-md">
                  <span className="text-emerald-400 font-bold flex items-center gap-1">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    V380 Pro &rarr; OBS Virtual Camera [Index 1]
                  </span>
                  <span>• {v380CameraStatus?.resolution || '640x480'}</span>
                  <span>• {v380CameraStatus?.fps || 30} FPS</span>
                  {v380CameraStatus?.capture_latency_ms !== undefined && (
                    <span className="text-green-400 font-semibold">• Latency: {v380CameraStatus.capture_latency_ms} ms</span>
                  )}
                  <span className="text-slate-400 hidden sm:inline">• Buffer: 1 (Zero-Lag)</span>
                </div>
              </div>
            ) : sourceMode === 'webcam' ? (
              <div className="relative w-full h-full flex items-center justify-center bg-black">
                {/* Persistent video element so videoRef.current is always accessible */}
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
                    <p className="text-xs font-bold text-slate-400 font-sans tracking-wide uppercase">
                      No Active Detection Stream
                    </p>
                    <p className="text-[10px] font-mono text-slate-600 max-w-sm mx-auto">
                      Click <strong className="text-blue-400 font-bold">"Start Android DroidCam Stream"</strong> below or select your camera device to begin real-time surveillance.
                    </p>
                    <div className="pt-2">
                      <button
                        onClick={() => startWebcam(selectedCameraId)}
                        className="px-4 py-1.5 rounded-lg bg-blue-500 hover:bg-blue-400 text-slate-950 text-xs font-mono font-bold shadow-lg transition-all"
                      >
                        📱 Start Android DroidCam Stream
                      </button>
                    </div>
                  </div>
                )}

                {/* Real-Time Bounding Box Overlay on Live Video */}
                {webcamActive && liveDetectionResult?.detections?.map((det, idx) => (
                  <div
                    key={idx}
                    className="absolute pointer-events-none transition-all duration-300 z-10"
                    style={{
                      left: `${det.normalized_bbox[0] * 100}%`,
                      top: `${det.normalized_bbox[1] * 100}%`,
                      width: `${(det.normalized_bbox[2] - det.normalized_bbox[0]) * 100}%`,
                      height: `${(det.normalized_bbox[3] - det.normalized_bbox[1]) * 100}%`,
                      border: '2px solid #22c55e',
                      boxShadow: '0 0 10px rgba(34,197,94,0.5)'
                    }}
                  >
                    <div className="absolute -top-6 left-0 bg-slate-950/95 border border-green-500/60 text-green-400 font-mono text-[8px] font-bold px-1.5 py-0.5 rounded shadow whitespace-nowrap flex items-center gap-1">
                      <span>{det.class}</span>
                      <span className="text-slate-400">[{det.code}]</span>
                      <span className="text-white bg-green-600 px-1 rounded">{det.confidence_pct}%</span>
                    </div>
                  </div>
                ))}

                {webcamActive && (
                  <div className="absolute bottom-2 left-2 z-20 bg-black/70 backdrop-blur-sm px-2 py-0.5 rounded text-[8px] font-mono text-slate-300 flex items-center gap-2">
                    <span>📱 {isDroidCamDevice ? `DroidCam Phone (${droidCamIp})` : activeCameraLabel}</span>
                    {autoScanActive ? (
                      <span className="text-emerald-400 font-bold">• Continuous AI Scan (Active)</span>
                    ) : (
                      <span>• Click 'Capture & Detect' to analyze</span>
                    )}
                  </div>
                )}
              </div>
            ) : sourceMode === 'dataset' && liveDetectionResult ? (
              /* 2. Test Dataset Image Inference View */
              <div className="relative w-full h-full flex items-center justify-center bg-black">
                {liveDetectionResult.annotated_image ? (
                  <img
                    src={
                      liveDetectionResult.annotated_image.startsWith("data:")
                        ? liveDetectionResult.annotated_image
                        : `data:image/jpeg;base64,${liveDetectionResult.annotated_image}`
                    }
                    onError={(e) => {
                      e.target.onerror = null;
                      if (liveDetectionResult.source_file) {
                        e.target.src = `/sample-test-images/${liveDetectionResult.source_file}`;
                      }
                    }}
                    alt="WildShield AI YOLO Inference"
                    className="w-full h-full object-contain filter contrast-[1.05]"
                  />
                ) : liveDetectionResult.source_file ? (
                  <img
                    src={`/sample-test-images/${liveDetectionResult.source_file}`}
                    alt="WildShield AI YOLO Source Frame"
                    className="w-full h-full object-contain filter contrast-[1.05]"
                  />
                ) : (
                  <div className="text-center text-slate-500 font-mono text-xs">
                    No detections found above confidence threshold
                  </div>
                )}

                {/* Overlaid bounding box details from real inference */}
                {liveDetectionResult.detections?.map((det, idx) => (
                  <div
                    key={idx}
                    className="absolute pointer-events-none"
                    style={{
                      left: `${det.normalized_bbox[0] * 100}%`,
                      top: `${det.normalized_bbox[1] * 100}%`,
                      width: `${(det.normalized_bbox[2] - det.normalized_bbox[0]) * 100}%`,
                      height: `${(det.normalized_bbox[3] - det.normalized_bbox[1]) * 100}%`
                    }}
                  >
                    <div className="absolute -top-7 left-0 bg-slate-950/90 border border-green-500/60 text-green-400 font-mono text-[9px] font-bold px-1.5 py-0.5 rounded shadow whitespace-nowrap flex items-center gap-1">
                      <span>{det.class}</span>
                      <span className="text-slate-400">[{det.code}]</span>
                      <span className="text-white bg-green-600 px-1 rounded">{det.confidence_pct}%</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : sourceMode === 'upload' && uploadedImagePreview ? (
              /* 3. Uploaded Image View */
              <div className="relative w-full h-full flex items-center justify-center bg-black">
                <img
                  src={uploadedImagePreview}
                  alt="WildShield AI Uploaded Frame"
                  className="w-full h-full object-contain"
                />
                {liveDetectionResult?.detections?.map((det, idx) => (
                  <div
                    key={idx}
                    className="absolute pointer-events-none"
                    style={{
                      left: `${det.normalized_bbox[0] * 100}%`,
                      top: `${det.normalized_bbox[1] * 100}%`,
                      width: `${(det.normalized_bbox[2] - det.normalized_bbox[0]) * 100}%`,
                      height: `${(det.normalized_bbox[3] - det.normalized_bbox[1]) * 100}%`,
                      border: '2px solid #22c55e'
                    }}
                  >
                    <div className="absolute -top-6 left-0 bg-slate-950/90 border border-green-500 text-green-400 font-mono text-[8px] font-bold px-1 rounded shadow">
                      {det.class} [{det.code}] {det.confidence_pct}%
                    </div>
                  </div>
                ))}
              </div>
            ) : sourceMode === 'simulation' && simulationState > 0 ? (
              /* 4. Simulation Fallback View */
              <div className="relative w-full h-full flex items-center justify-center">
                <img
                  src={meta?.fallbackImage || "/ed-van-duijn-414NZVxzc20-unsplash.jpg"}
                  alt={activeScenario.species}
                  className="w-full h-full object-cover filter brightness-[0.75] contrast-[1.15] grayscale"
                />
                
                {simulationState >= 2 && simulationState <= 4 && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="absolute border-2 border-green-500 bg-green-500/5 rounded-md p-4 flex flex-col items-center justify-center"
                    style={{ width: '45%', height: '65%' }}
                  >
                    <div className="absolute top-0 left-0 w-2 h-2 border-t-2 border-l-2 border-green-500 -mt-0.5 -ml-0.5" />
                    <div className="absolute top-0 right-0 w-2 h-2 border-t-2 border-r-2 border-green-500 -mt-0.5 -mr-0.5" />
                    <div className="absolute bottom-0 left-0 w-2 h-2 border-b-2 border-l-2 border-green-500 -mb-0.5 -ml-0.5" />
                    <div className="absolute bottom-0 right-0 w-2 h-2 border-b-2 border-r-2 border-green-500 -mb-0.5 -mr-0.5" />
                    
                    <span className="absolute -top-5 left-0 bg-green-500 text-slate-950 font-mono text-[8px] font-bold px-1 rounded">
                      {activeScenario.species} [{displayCode}] {displayConfidence}%
                    </span>
                    
                    <div className="text-5xl opacity-85 filter drop-shadow-[0_0_10px_rgba(34,197,94,0.2)]">
                      {activeScenario.emoji}
                    </div>
                  </motion.div>
                )}
              </div>
            ) : (
              /* 5. Waiting / Inactive State */
              <div className="text-center space-y-2 text-slate-500 p-8">
                <VideoOff className="h-10 w-10 text-slate-600 mx-auto animate-pulse" />
                <p className="text-xs font-bold text-slate-400 font-sans tracking-wide uppercase">
                  No Active Detection Stream
                </p>
                <p className="text-[10px] font-mono text-slate-600 max-w-sm mx-auto">
                  Click <strong className="text-blue-400 font-bold">"LIVE CAMERA"</strong> above to stream from your connected Android DroidCam ({droidCamIp}), or choose a test sample.
                </p>
                <div className="pt-2">
                  <button
                    onClick={toggleWebcam}
                    className="px-4 py-1.5 rounded-lg bg-blue-500 hover:bg-blue-400 text-slate-950 text-xs font-mono font-bold shadow-lg transition-all"
                  >
                    📱 Start Android DroidCam Stream
                  </button>
                </div>
              </div>
            )}

            {/* Bottom info strip */}
            <div className="absolute bottom-3 left-3 font-mono text-[9px] text-white/70 bg-black/60 backdrop-blur-sm px-2 py-0.5 rounded z-20">
              {displayTime} • {displayCameraId}
            </div>

            <div className="absolute bottom-3 right-3 flex items-center gap-1.5 bg-black/60 p-1 rounded z-20">
              <button 
                onClick={() => handleTestResponseTrigger()}
                title="Test Deterrent Actuators" 
                className="p-1 hover:text-green-400 text-slate-400 transition-colors"
              >
                <Volume2 className="h-3 w-3" />
              </button>
              <button className="p-1 hover:text-amber-400 text-slate-400"><Lightbulb className="h-3 w-3" /></button>
            </div>
          </div>

          {/* Under-feed stats bar */}
          {liveDetectionResult && (
            <div className="mt-3 pt-2 border-t border-slate-900/80 flex items-center justify-between text-[9px] font-mono text-slate-400">
              <span>Event: <strong className="text-slate-200">{liveDetectionResult.event_id}</strong></span>
              <span>Inference: <strong className="text-green-400">{liveDetectionResult.inference_time_ms} ms</strong></span>
              <span>Detections: <strong className="text-slate-200">{liveDetectionResult.detection_count} target(s)</strong></span>
            </div>
          )}
        </div>

        {/* Column 3: Detection Result & Behavior Analysis */}
        <div className="space-y-6">
          {/* Detection Result Card */}
          <div className="bg-[#0b0f19] border border-slate-900 rounded-xl p-5 shadow-lg space-y-4">
            <div className="text-[10px] font-bold font-sans text-slate-400 uppercase tracking-wider border-b border-slate-900 pb-2 flex items-center justify-between">
              <span>{t('detectionResult')}</span>
              {hasConfidentTarget && (
                <span className="font-mono text-[8px] text-green-500 bg-green-500/10 px-1.5 py-0.5 rounded border border-green-500/20">
                  {displayCode}
                </span>
              )}
            </div>

            {hasConfidentTarget ? (
              <div className="space-y-3">
                <div className="flex items-start justify-between">
                  <div className="text-left space-y-1">
                    <span className="text-[8px] font-mono text-slate-500 block uppercase">SPECIES</span>
                    <span className="text-lg font-bold text-slate-100 font-sans block">{displaySpecies}</span>
                    <span className="text-[9px] text-slate-400 italic block">
                      *{displayScientific || "Wildlife specimen"}*
                    </span>
                  </div>
                  <div className="h-10 w-10 rounded-lg bg-green-500/10 border border-green-500/20 flex items-center justify-center text-green-500 text-2xl">
                    {displayEmoji}
                  </div>
                </div>

                {/* Confidence Bar */}
                <div className="space-y-1 text-left">
                  <div className="flex justify-between items-center">
                    <span className="text-[8px] font-mono text-slate-500 block uppercase">{t('confidence')}</span>
                    <span className="text-sm font-bold text-green-500 font-mono">{displayConfidence}%</span>
                  </div>
                  <div className="h-1.5 w-full bg-slate-950 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-green-500 rounded-full transition-all duration-500" 
                      style={{ width: `${Math.min(displayConfidence, 100)}%` }} 
                    />
                  </div>
                </div>

                {/* Threat level block counts */}
                <div className="space-y-1 text-left">
                  <span className="text-[8px] font-mono text-slate-500 block uppercase">{t('threatLevel')}</span>
                  <div className="flex items-center gap-1.5">
                    <span className={`text-xs font-bold font-mono uppercase ${
                      displayThreat === 'HIGH' || displayThreat === 'CRITICAL' ? 'text-red-500' : 
                      displayThreat === 'MEDIUM' || displayThreat === 'WARNING' ? 'text-amber-500' : 'text-green-500'
                    }`}>
                      {displayThreat}
                    </span>
                    <div className="flex gap-0.5">
                      {[1, 2, 3, 4, 5].map((i) => (
                        <div
                          key={i}
                          className={`h-2.5 w-3.5 rounded-sm border ${
                            i <= getThreatBlocksCount()
                              ? (displayThreat === 'HIGH' || displayThreat === 'CRITICAL')
                                ? 'bg-red-500 border-red-400 shadow-[0_0_8px_rgba(239,68,68,0.4)]'
                                : 'bg-amber-500 border-amber-400'
                              : 'bg-slate-950 border-slate-900'
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                </div>

              </div>
            ) : (
              <div className="text-center py-6 text-slate-500 font-mono text-[10px] italic">
                {isInferring ? "Processing inference..." : "NO CONFIDENT DETECTION"}
              </div>
            )}
          </div>

          {/* Farmer-Friendly Behavior Analysis Card */}
          <div className="bg-[#0b0f19] border border-slate-900 rounded-xl p-4 shadow-lg space-y-2.5 text-left">
            <div className="text-[10px] font-bold font-sans text-slate-400 uppercase tracking-wider border-b border-slate-900 pb-1.5 flex justify-between items-center">
              <span>Behavior</span>
              {hasConfidentTarget && (
                <span className={`text-[8px] font-mono font-bold px-1.5 py-0.5 rounded border ${
                  (displayThreat === 'CRITICAL' || displayThreat === 'HIGH') ? 'bg-red-500/10 border-red-500/30 text-red-400' :
                  (displayThreat === 'MEDIUM' || displayThreat === 'WARNING') ? 'bg-amber-500/10 border-amber-500/30 text-amber-400' :
                  'bg-green-500/10 border-green-500/30 text-green-400'
                }`}>
                  Risk: {
                    displayThreat === 'CRITICAL' ? 'Very High' :
                    displayThreat === 'HIGH' ? 'High' :
                    displayThreat === 'MEDIUM' || displayThreat === 'WARNING' ? 'Medium' : 'Low'
                  }
                </span>
              )}
            </div>

            {hasConfidentTarget ? (
              <div className="space-y-2 text-[9px] font-mono text-slate-400">
                <div className="h-5 flex items-end opacity-75">
                  <svg className="w-full h-full" viewBox="0 0 150 20">
                    <path
                      d="M0,14 Q15,3 30,16 T60,5 T90,18 T120,3 T150,10"
                      fill="none"
                      stroke="#22c55e"
                      strokeWidth="1.5"
                    />
                  </svg>
                </div>

                <div className="space-y-1.5 divide-y divide-slate-900/80">
                  <div className="flex justify-between items-center pt-1">
                    <span className="text-slate-400">What It Is Doing:</span>
                    <span className="text-slate-100 font-bold font-sans">
                      {displaySpecies === 'Human' ? 'Active in Area (Security Monitored)' :
                       displaySpecies === 'Wild Boar' ? 'Eating Crops' : 
                       displaySpecies === 'Nilgai' ? 'Eating Crops' : 
                       displaySpecies === 'Spotted Deer' ? 'Grazing' : 
                       displaySpecies === 'Rhesus Macaque' ? 'Fruit Damage' :
                       displaySpecies === 'Langur' ? 'Moving in Group' :
                       displaySpecies === 'Gaur' ? 'Eating Crops' : 
                       displaySpecies === 'Elephant' ? 'Moving in Group' :
                       displaySpecies === 'Cattle' || displaySpecies === 'Goat' ? 'Grazing' : 'Moving'}
                    </span>
                  </div>

                  <div className="flex justify-between items-center pt-1">
                    <span className="text-slate-400">Usually Active:</span>
                    <span className="text-slate-200 font-semibold font-sans">
                      {displaySpecies === 'Human' ? 'Day & Night (Security Monitored)' :
                       displaySpecies === 'Wild Boar' ? 'Night' :
                       displaySpecies === 'Nilgai' ? 'Morning & Evening' :
                       displaySpecies === 'Spotted Deer' ? 'Morning & Evening' :
                       displaySpecies === 'Rhesus Macaque' || displaySpecies === 'Langur' ? 'Day' :
                       displaySpecies === 'Cattle' || displaySpecies === 'Goat' ? 'Day' :
                       displaySpecies === 'Elephant' || displaySpecies === 'Gaur' ? 'Night & Evening' : 'Day'}
                    </span>
                  </div>

                  <div className="flex justify-between items-center pt-1">
                    <span className="text-slate-400">Possible Crop Damage:</span>
                    <span className="text-amber-400 font-bold font-sans">
                      {displaySpecies === 'Human' ? 'Human Security Alert (No crop damage)' :
                       displaySpecies === 'Wild Boar' ? 'Eating Crops' :
                       displaySpecies === 'Nilgai' ? 'Eating Crops' :
                       displaySpecies === 'Spotted Deer' ? 'Eating Crops' :
                       displaySpecies === 'Rhesus Macaque' || displaySpecies === 'Langur' ? 'Fruit Damage' :
                       displaySpecies === 'Gaur' || displaySpecies === 'Elephant' ? 'Trampling Crops' :
                       displaySpecies === 'Cattle' || displaySpecies === 'Goat' ? 'Eating Crops' : 'No Major Damage'}
                    </span>
                  </div>

                  <div className="flex justify-between items-center pt-1">
                    <span className="text-slate-400">Where It Is:</span>
                    <span className="text-slate-200 font-semibold font-sans">
                      {displayIntrusion ? "Inside Farm" : "Farm Boundary"}
                    </span>
                  </div>

                  <div className="flex justify-between items-center pt-1">
                    <span className="text-slate-400">Risk Level:</span>
                    <span className={`font-bold font-sans ${
                      displayThreat === 'CRITICAL' ? 'text-red-500' :
                      displayThreat === 'HIGH' ? 'text-red-400' :
                      displayThreat === 'MEDIUM' || displayThreat === 'WARNING' ? 'text-amber-400' : 'text-green-400'
                    }`}>
                      {displayThreat === 'CRITICAL' ? 'Very High (Security)' :
                       displayThreat === 'HIGH' ? 'High' :
                       displayThreat === 'MEDIUM' || displayThreat === 'WARNING' ? 'Medium' : 'Low'}
                    </span>
                  </div>

                  <div className="flex justify-between items-center pt-1">
                    <span className="text-slate-400">Action:</span>
                    <span className={`font-bold font-sans px-1.5 py-0.5 rounded text-[8px] uppercase ${
                      (displayThreat === 'CRITICAL' || displaySpecies === 'Human' || displaySpecies === 'Elephant' || displaySpecies === 'Gaur')
                        ? 'text-red-400 bg-red-500/10 border border-red-500/30 animate-pulse'
                        : displayIntrusion && displayThreat === 'HIGH'
                        ? 'text-red-400 bg-red-500/10 border border-red-500/30'
                        : displayIntrusion
                        ? 'text-amber-400 bg-amber-500/10 border border-amber-500/30'
                        : 'text-green-400 bg-green-500/10 border border-green-500/30'
                    }`}>
                      {displaySpecies === 'Human' ? 'Emergency Farmer Alert' :
                       (displaySpecies === 'Elephant' || displaySpecies === 'Gaur') ? 'Farmer Alert' :
                       displayIntrusion && displayThreat === 'HIGH' ? 'Deterrent Activated' :
                       displayIntrusion ? 'Warning Activated' : 'Watching'}
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-6 text-slate-500 font-mono text-[10px] italic">
                Awaiting active target...
              </div>
            )}
          </div>
        </div>

        {/* Column 4: Classification Score & Info */}
        <div className="space-y-6">
          {/* Classification Score Card */}
          <div className="bg-[#0b0f19] border border-slate-900 rounded-xl p-4 shadow-lg space-y-3">
            <div className="text-[10px] font-bold font-sans text-slate-400 uppercase tracking-wider border-b border-slate-900 pb-1.5 flex justify-between items-center">
              <span>{t('classificationScore')}</span>
              <span className="text-[8px] font-mono text-slate-500">YOLOv11 Tensor</span>
            </div>
            <div className="space-y-2 text-[10px] font-mono">
              {[
                SPECIES_TAXONOMY[8], // Human [WS-SEC-HM]
                SPECIES_TAXONOMY[0], // Wild Boar
                SPECIES_TAXONOMY[2], // Spotted Deer
                SPECIES_TAXONOMY[1], // Nilgai
                SPECIES_TAXONOMY[6], // Cattle
                SPECIES_TAXONOMY[7], // Goat
              ].map((tax) => {
                const isSelected = hasConfidentTarget && displaySpecies.toLowerCase() === tax.class.toLowerCase();
                const scorePct = isSelected ? `${displayConfidence}%` : "0.0%";
                return (
                  <div key={tax.class} className="space-y-1">
                    <div className="flex justify-between font-sans">
                      <span className={isSelected ? (displayThreat === 'CRITICAL' ? 'text-red-400 font-bold flex items-center gap-1' : 'text-green-400 font-bold flex items-center gap-1') : 'text-slate-400'}>
                        {tax.class} <span className="font-mono text-[8px] text-slate-500">[{tax.code}]</span>
                      </span>
                      <span className={isSelected ? (displayThreat === 'CRITICAL' ? 'text-red-400 font-bold font-mono' : 'text-green-500 font-bold font-mono') : 'text-slate-500 font-mono'}>
                        {scorePct}
                      </span>
                    </div>
                    <div className="h-1 w-full bg-slate-950 rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full transition-all duration-300 ${isSelected ? (displayThreat === 'CRITICAL' ? 'bg-red-500' : 'bg-green-500') : 'bg-slate-800'}`} 
                        style={{ width: isSelected ? `${Math.min(displayConfidence, 100)}%` : '0%' }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Detection Info Card */}
          <div className="bg-[#0b0f19] border border-slate-900 rounded-xl p-4 shadow-lg space-y-2.5 text-left">
            <div className="text-[10px] font-bold font-sans text-slate-400 uppercase tracking-wider border-b border-slate-900 pb-1.5">
              {t('detectionInfo')}
            </div>
            {hasConfidentTarget ? (
              <div className="space-y-1.5 text-[9px] font-mono text-slate-400">
                <div className="flex justify-between">
                  <span className="text-slate-500">WildShield ID:</span>
                  <span className="text-green-400 font-bold">{displayCode}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Scientific:</span>
                  <span className="text-slate-200 italic truncate max-w-[130px]">{meta?.scientific || displayScientific}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Bounding Box:</span>
                  <span className="text-slate-100 font-semibold font-mono">
                    {primaryDet?.bbox ? `[${Math.round(primaryDet.bbox[0])}, ${Math.round(primaryDet.bbox[1])}, ${Math.round(primaryDet.bbox[2])}, ${Math.round(primaryDet.bbox[3])}]` : "[0, 0, 0, 0]"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Camera Node:</span>
                  <span className="text-slate-100 font-semibold">{displayCameraId}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Detected At:</span>
                  <span className="text-slate-100 font-semibold">{displayTime}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Tracking ID:</span>
                  <span className="text-slate-100 font-semibold">
                    {liveDetectionResult?.event_id ? `${liveDetectionResult.event_id}-01` : "TRK-001"}
                  </span>
                </div>
              </div>
            ) : (
              <div className="text-center py-6 text-slate-500 font-mono text-[10px] italic">
                Awaiting detection...
              </div>
            )}
          </div>
        </div>

      </div>

      {/* 4. DETECTION PIPELINE STEPPER */}
      <div className="bg-[#0b0f19] border border-slate-900 rounded-xl p-5 shadow-lg space-y-4">
        <div className="text-[10px] font-bold font-sans text-slate-400 uppercase tracking-wider border-b border-slate-900 pb-2 flex items-center justify-between">
          <span>{t('pipeline')}</span>
          <span className="font-mono text-[8px] text-slate-500">
            Digital Twin Chain: Farm → DroidCam Sensor → Detection Zone → Animal → Intrusion → Response
          </span>
        </div>
        
        <div className="flex flex-col md:flex-row justify-between items-center gap-4 py-2 px-2 overflow-x-auto">
          {[
            { id: 1, label: t('step1') || "Frame Capture", sub: isDroidCamDevice ? "Android DroidCam Feed" : "Footage Ingestion" },
            { id: 2, label: "Object Detection", sub: hasConfidentTarget ? `BBox: ${primaryDet ? primaryDet.bbox.map(x=>Math.round(x)).join(', ') : 'Localized'}` : 'Spatial Localization' },
            { id: 3, label: "YOLO Inference", sub: hasConfidentTarget ? `${liveDetectionResult?.inference_time_ms || 140}ms Pass` : 'Feature Extraction' },
            { id: 4, label: "Species Class", sub: hasConfidentTarget ? `${displaySpecies} [${displayCode}]` : 'Awaiting Class' },
            { id: 5, label: t('step5') || "Threat Assess", sub: hasConfidentTarget ? `Threat: ${displayThreat} (${displayConfidence}%)` : 'Awaiting Threat' },
            { id: 6, label: t('step6') || "Decision Engine", sub: hasConfidentTarget ? (displayIntrusion ? "Actuators Dispatched" : "Livestock Monitored") : 'Standby' },
            { id: 7, label: t('step7') || "Alert & Response", sub: hasConfidentTarget ? (primaryDet?.responses?.join(' + ') || 'Standby') : '--:--:--' }
          ].map((step, index, arr) => {
            const active = hasConfidentTarget;
            return (
              <React.Fragment key={step.id}>
                <div className="flex items-center gap-2.5">
                  <div className={`h-8 w-8 rounded-full border flex items-center justify-center font-mono text-xs font-bold transition-all duration-300 ${
                    active
                      ? 'bg-green-500 text-slate-950 border-green-500 shadow-[0_0_10px_rgba(34,197,94,0.4)]'
                      : 'bg-slate-950 text-slate-500 border-slate-900'
                  }`}>
                    {step.id}
                  </div>
                  <div className="text-left leading-tight">
                    <p className={`text-[10px] font-bold ${active ? 'text-slate-100' : 'text-slate-500'}`}>
                      {step.label}
                    </p>
                    <p className="text-[8px] font-mono text-slate-500">{active ? step.sub : '--:--:--'}</p>
                  </div>
                </div>

                {index < arr.length - 1 && (
                  <ArrowRight className={`hidden md:block h-4 w-4 ${active ? 'text-green-500 animate-pulse' : 'text-slate-800'}`} />
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {/* 5. RESPONSE ACTIONS & RECENT DETECTIONS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Response Actions Card */}
        <div className="bg-[#0b0f19] border border-slate-900 rounded-xl p-5 shadow-lg space-y-4">
          <div className="flex items-center justify-between text-xs border-b border-slate-900 pb-2">
            <span className="font-bold text-slate-400 font-sans uppercase tracking-wider text-[10px]">
              {t('responseActions')}
            </span>
            <button
              onClick={() => handleTestResponseTrigger()}
              className="text-[9px] font-mono text-green-400 hover:text-green-300 bg-green-500/10 px-2 py-0.5 rounded border border-green-500/20"
            >
              Test Actuators Simulation
            </button>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            {/* Siren */}
            <div className={`p-4 rounded-xl border flex flex-col justify-between h-24 transition-all duration-300 ${
              isSirenTriggered 
                ? 'bg-red-500/10 border-red-500/30 text-red-400 shadow-[0_0_15px_rgba(239,68,68,0.1)]'
                : 'bg-slate-950/40 border-slate-900 text-slate-500'
            }`}>
              <div className="flex items-center justify-between">
                <span className="text-[9px] font-bold font-sans uppercase">{t('sirenActivated')}</span>
                <Volume2 className={`h-4.5 w-4.5 ${isSirenTriggered ? 'text-red-500 animate-bounce' : 'text-slate-600'}`} />
              </div>
              <div className="text-left">
                <p className="text-[8px] font-mono uppercase">Status: {isSirenTriggered ? 'ACTIVE' : 'STANDBY'}</p>
                <p className="text-[8px] font-mono mt-0.5 text-slate-500">{isSirenTriggered ? displayTime : '--:--:--'}</p>
              </div>
            </div>

            {/* Floodlight */}
            <div className={`p-4 rounded-xl border flex flex-col justify-between h-24 transition-all duration-300 ${
              isLightTriggered 
                ? 'bg-amber-500/10 border-amber-500/30 text-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.1)]'
                : 'bg-slate-950/40 border-slate-900 text-slate-500'
            }`}>
              <div className="flex items-center justify-between">
                <span className="text-[9px] font-bold font-sans uppercase">{t('floodLight')}</span>
                <Lightbulb className={`h-4.5 w-4.5 ${isLightTriggered ? 'text-amber-400 animate-pulse' : 'text-slate-600'}`} />
              </div>
              <div className="text-left">
                <p className="text-[8px] font-mono uppercase">Status: {isLightTriggered ? 'ACTIVE' : 'STANDBY'}</p>
                <p className="text-[8px] font-mono mt-0.5 text-slate-500">{isLightTriggered ? displayTime : '--:--:--'}</p>
              </div>
            </div>

            {/* Alert Sent */}
            <div className={`p-4 rounded-xl border flex flex-col justify-between h-24 transition-all duration-300 ${
              isAlertTriggered 
                ? 'bg-blue-500/10 border-blue-500/30 text-blue-400'
                : 'bg-slate-950/40 border-slate-900 text-slate-500'
            }`}>
              <div className="flex items-center justify-between">
                <span className="text-[9px] font-bold font-sans uppercase">{t('alertSent')}</span>
                <Smartphone className={`h-4.5 w-4.5 ${isAlertTriggered ? 'text-blue-500 animate-pulse' : 'text-slate-600'}`} />
              </div>
              <div className="text-left">
                <p className="text-[8px] font-mono uppercase">To: {displayCameraId} Farmer Hub</p>
                <p className="text-[8px] font-mono mt-0.5 text-slate-500">{isAlertTriggered ? displayTime : '--:--:--'}</p>
              </div>
            </div>

            {/* Event Logged */}
            <div className={`p-4 rounded-xl border flex flex-col justify-between h-24 transition-all duration-300 ${
              isLogTriggered 
                ? 'bg-purple-500/10 border-purple-500/30 text-purple-400'
                : 'bg-slate-950/40 border-slate-900 text-slate-500'
            }`}>
              <div className="flex items-center justify-between">
                <span className="text-[9px] font-bold font-sans uppercase">{t('eventLogged')}</span>
                <FileText className={`h-4.5 w-4.5 ${isLogTriggered ? 'text-purple-500 animate-pulse' : 'text-slate-600'}`} />
              </div>
              <div className="text-left">
                <p className="text-[8px] font-mono uppercase">
                  ID: {liveDetectionResult?.event_id || "WS-EVT-001"}
                </p>
                <p className="text-[8px] font-mono mt-0.5 text-slate-500">{isLogTriggered ? displayTime : '--:--:--'}</p>
              </div>
            </div>

          </div>
        </div>

        {/* Recent Detections List */}
        <div className="bg-[#0b0f19] border border-slate-900 rounded-xl p-5 shadow-lg space-y-4">
          <div className="flex items-center justify-between text-xs border-b border-slate-900 pb-2">
            <span className="font-bold text-slate-100 font-sans uppercase tracking-wider">{t('recentDetections')}</span>
            <span 
              onClick={() => fetchRecentEvents()}
              className="text-[10px] text-slate-400 cursor-pointer hover:text-slate-200 flex items-center gap-1"
            >
              <RefreshCw className="h-2.5 w-2.5" />
              {t('viewAll')}
            </span>
          </div>

          <div className="overflow-x-auto text-[10px] font-mono max-h-[160px] overflow-y-auto pr-1">
            <table className="w-full text-left">
              <thead>
                <tr className="text-slate-500 border-b border-slate-900 h-8">
                  <th>Species</th>
                  <th>Location</th>
                  <th>Detected At</th>
                  <th>Confidence</th>
                  <th className="text-right">Threat</th>
                </tr>
              </thead>
              <tbody>
                {(recentEvents.length > 0 ? recentEvents : [
                  { species: "Wild Boar", code: "WS-WL-WB", location: "North Field", time: "10:23:15 PM", confidence: 94.2, threat: "HIGH" },
                  { species: "Spotted Deer", code: "WS-WL-SD", location: "West Field", time: "09:58:42 PM", confidence: 93.9, threat: "MEDIUM" },
                  { species: "Nilgai", code: "WS-WL-NG", location: "East Field", time: "09:42:11 PM", confidence: 96.2, threat: "MEDIUM" },
                  { species: "Cattle", code: "WS-DM-CT", location: "South Field", time: "09:18:33 PM", confidence: 55.8, threat: "LOW" }
                ]).map((row, idx) => (
                  <tr key={idx} className="border-b border-slate-900/60 h-9 text-slate-300 hover:bg-slate-900/40">
                    <td className="font-sans font-semibold text-slate-100 flex items-center gap-1 mt-1.5">
                      <span>{row.species}</span>
                      {row.code && <span className="text-[8px] text-slate-500 font-mono">[{row.code}]</span>}
                    </td>
                    <td>{row.location}</td>
                    <td>{row.time}</td>
                    <td className="text-green-500 font-bold">{row.confidence}%</td>
                    <td className="text-right">
                      <span className={`px-1.5 py-0.5 rounded text-[8px] font-extrabold uppercase border ${getThreatBadgeColor(row.threat)}`}>
                        {row.threat}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </div>

    </div>
  );
}
