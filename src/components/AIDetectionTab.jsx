import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Volume2, Lightbulb, ShieldAlert, Sparkles, Cpu, 
  Play, Film, Scan, Smartphone, FileText, ArrowRight,
  Camera, Upload, RefreshCw, CheckCircle2, AlertTriangle,
  FolderOpen, Zap, VideoOff
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

  // Input source: 'dataset' | 'webcam' | 'upload' | 'simulation'
  const [sourceMode, setSourceMode] = useState('dataset');
  const [backendStatus, setBackendStatus] = useState({ online: false, checking: true, info: null });
  const [apiBaseUrl, setApiBaseUrl] = useState(import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000");
  const [testImages, setTestImages] = useState([]);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [isInferring, setIsInferring] = useState(false);
  const [confidenceThreshold, setConfidenceThreshold] = useState(0.25);
  const [selectedNodeId, setSelectedNodeId] = useState(1);

  // Single Source of Truth for Live Model Inference Result
  const [liveDetectionResult, setLiveDetectionResult] = useState(null);
  const [recentEvents, setRecentEvents] = useState([]);
  const [webcamActive, setWebcamActive] = useState(false);
  const [uploadedImagePreview, setUploadedImagePreview] = useState(null);

  const videoRef = useRef(null);
  const fileInputRef = useRef(null);

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

  // Auto-discover backend on mount & load test images
  useEffect(() => {
    checkBackendAndFetchImages();
    fetchRecentEvents();
  }, []);

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
    const candidateBases = [
      apiBaseUrl,
      "http://127.0.0.1:8000",
      "http://localhost:8000",
      "http://127.0.0.1:8001",
      "http://localhost:8001",
      "http://127.0.0.1:8080"
    ];

    let foundBase = null;
    let foundData = null;

    for (const base of candidateBases) {
      try {
        const res = await fetch(`${base}/api/status`, { signal: AbortSignal.timeout(1200) });
        if (res.ok) {
          foundData = await res.json();
          foundBase = base;
          break;
        }
      } catch (e) {
        // try next port
      }
    }

    if (foundBase && foundData) {
      setApiBaseUrl(foundBase);
      setBackendStatus({ online: true, checking: false, info: foundData });

      try {
        const imgsRes = await fetch(`${foundBase}/api/test-images`);
        if (imgsRes.ok) {
          const imgsData = await imgsRes.json();
          const imgsList = imgsData.images || [];
          setTestImages(imgsList);
          if (imgsList.length > 0) {
            runTestImageInference(imgsList[0].filename, selectedNodeId, foundBase);
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
    
    // Complete state reset before loading new inference
    setLiveDetectionResult(null);
    setIsInferring(true);

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

    // Reset previous detection state
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

  // Start / Stop Webcam
  const toggleWebcam = async () => {
    if (webcamActive) {
      if (videoRef.current && videoRef.current.srcObject) {
        const tracks = videoRef.current.srcObject.getTracks();
        tracks.forEach(track => track.stop());
        videoRef.current.srcObject = null;
      }
      setWebcamActive(false);
    } else {
      setLiveDetectionResult(null);
      setSourceMode('webcam');
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ 
          video: { width: { ideal: 640 }, height: { ideal: 480 } } 
        });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play();
          setWebcamActive(true);
        }
      } catch (err) {
        alert("Unable to access camera: " + err.message);
      }
    }
  };

  // Capture webcam frame and send to YOLO model
  const captureWebcamFrame = async () => {
    if (!videoRef.current || !webcamActive) return;
    
    const canvas = document.createElement("canvas");
    canvas.width = videoRef.current.videoWidth || 640;
    canvas.height = videoRef.current.videoHeight || 480;
    const ctx = canvas.getContext("2d");
    ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
    const base64Data = canvas.toDataURL("image/jpeg", 0.85);

    setIsInferring(true);
    setLiveDetectionResult(null);

    try {
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
      console.error("Webcam frame inference failed:", err);
    } finally {
      setIsInferring(false);
    }
  };

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
  const isRealModelMode = sourceMode !== 'simulation';
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
            </div>
            <p className="text-[10px] text-slate-500 font-mono mt-1">
              WildShield YOLOv11 Surveillance Engine • Persistent Edge Model
            </p>
          </div>
        </div>

        {/* Live status chips */}
        <div className="flex items-center flex-wrap gap-4 text-[10px] font-mono">
          <div className="flex items-center gap-1.5 bg-slate-950/60 px-2.5 py-1 rounded border border-slate-900">
            <span className="text-slate-500">{t('model').toUpperCase()}:</span>
            <span className="text-green-500 font-bold">YOLOv11 Surveillance v1.2</span>
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
            onClick={checkBackendAndFetchImages}
            title="Refresh Backend Connection"
            className="p-1.5 rounded bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors border border-slate-800"
          >
            <RefreshCw className={`h-3 w-3 ${backendStatus.checking ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* 2. MODE SELECTOR TOOLBAR */}
      <div className="bg-[#0b0f19] border border-slate-900 rounded-xl p-3 flex flex-wrap items-center justify-between gap-3 shadow-md">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-mono text-slate-400 font-bold uppercase tracking-wider mr-1">
            INPUT SOURCE:
          </span>

          {/* Test Dataset Mode */}
          <button
            onClick={() => {
              setSourceMode('dataset');
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

          {/* Webcam Mode */}
          <button
            onClick={toggleWebcam}
            className={`px-3 py-1.5 rounded-lg text-[10px] font-mono font-bold transition-all flex items-center gap-1.5 border ${
              sourceMode === 'webcam'
                ? 'bg-blue-500 text-slate-950 border-blue-400 shadow-[0_0_10px_rgba(59,130,246,0.3)]'
                : 'bg-slate-950 text-slate-400 border-slate-900 hover:border-slate-800'
            }`}
          >
            <Camera className="h-3 w-3" />
            {webcamActive ? 'WEBCAM ACTIVE' : 'LIVE WEBCAM'}
          </button>

          {/* Upload Mode */}
          <button
            onClick={() => fileInputRef.current?.click()}
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

        {/* Dataset Controls (Pure filenames without guessed labels) */}
        {sourceMode === 'dataset' && testImages.length > 0 && (
          <div className="flex items-center gap-2">
            <select
              value={testImages[selectedImageIndex]?.filename || ""}
              onChange={(e) => {
                const idx = testImages.findIndex(img => img.filename === e.target.value);
                if (idx !== -1) {
                  setSelectedImageIndex(idx);
                  runTestImageInference(testImages[idx].filename);
                }
              }}
              className="bg-slate-950 border border-slate-800 text-slate-200 text-[10px] font-mono rounded px-2.5 py-1 outline-none focus:border-green-500 max-w-[240px]"
            >
              {testImages.map((img) => (
                <option key={img.filename} value={img.filename}>
                  {img.label || img.filename}
                </option>
              ))}
            </select>

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

        {/* Webcam Capture Control */}
        {sourceMode === 'webcam' && webcamActive && (
          <button
            onClick={captureWebcamFrame}
            disabled={isInferring}
            className="px-3 py-1 bg-blue-500 text-slate-950 font-bold rounded text-[10px] font-mono flex items-center gap-1.5 shadow hover:bg-blue-400"
          >
            <Camera className="h-3 w-3" />
            {isInferring ? 'Inferring...' : 'Capture & Detect'}
          </button>
        )}
      </div>

      {/* 3. THREE COLUMN LAYOUT */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        
        {/* Column 1: Live Camera Feed */}
        <div className="lg:col-span-2 bg-[#0b0f19] border border-slate-900 rounded-xl p-5 flex flex-col justify-between shadow-lg">
          <div className="flex items-center justify-between text-xs border-b border-slate-900 pb-2 mb-3">
            <span className="font-bold text-slate-100 font-sans uppercase tracking-wider flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
              {t('liveCameraFeed')}
            </span>
            <span className="text-[10px] text-slate-400 font-mono">
              🎥 {displayCameraId} ({displayNode})
            </span>
          </div>

          {/* CRT Camera feed viewport */}
          <div className="relative aspect-video w-full bg-black rounded-lg border border-slate-900 overflow-hidden crt-overlay flex items-center justify-center">
            
            {/* Live Indicator Chip */}
            <div className="absolute top-3 left-3 z-10 flex items-center gap-2 font-mono text-[9px] text-white bg-black/70 backdrop-blur-sm px-2 py-1 rounded border border-white/10">
              <span className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
              <span>{sourceMode === 'simulation' ? 'SIMULATION' : sourceMode.toUpperCase()}</span>
            </div>

            {/* Intrusion Alert Banner */}
            {hasConfidentTarget && (
              <div className={`absolute top-3 right-3 z-10 font-mono text-[9px] font-bold px-2.5 py-1 rounded flex items-center gap-1.5 shadow-lg ${
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

            {/* Real Model Detection View (Test Image or Upload) */}
            {isRealModelMode && liveDetectionResult ? (
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
            ) : isInferring ? (
              <div className="text-center space-y-2 text-slate-400 p-8">
                <RefreshCw className="h-8 w-8 text-green-500 mx-auto animate-spin" />
                <p className="text-xs font-mono">Running YOLOv11 Edge Inference...</p>
              </div>
            ) : sourceMode === 'webcam' && webcamActive ? (
              <div className="relative w-full h-full">
                <video ref={videoRef} className="w-full h-full object-cover" autoPlay muted playsInline />
                <div className="absolute bottom-2 left-2 z-10 bg-black/60 px-2 py-0.5 rounded text-[8px] font-mono text-slate-300">
                  Click 'Capture & Detect' to run YOLO
                </div>
              </div>
            ) : sourceMode === 'simulation' && simulationState > 0 ? (
              // Simulation Fallback
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
              // Empty / Waiting State
              <div className="text-center space-y-2 text-slate-500 p-8">
                <VideoOff className="h-10 w-10 text-slate-600 mx-auto animate-pulse" />
                <p className="text-xs font-bold text-slate-400 font-sans tracking-wide uppercase">
                  No Detection / Waiting for Camera
                </p>
                <p className="text-[10px] font-mono text-slate-600">
                  Select a test image from the dataset, upload a photo, or activate webcam to run YOLO inference.
                </p>
              </div>
            )}

            {/* Bottom info strip */}
            <div className="absolute bottom-3 left-3 font-mono text-[9px] text-white/70 bg-black/60 backdrop-blur-sm px-2 py-0.5 rounded">
              {displayTime} • {displayCameraId}
            </div>

            <div className="absolute bottom-3 right-3 flex items-center gap-1.5 bg-black/60 p-1 rounded">
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

        {/* Column 2: Detection Result & Behavior Analysis */}
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
                  {/* What It Is Doing */}
                  <div className="flex justify-between items-center pt-1">
                    <span className="text-slate-400">What It Is Doing:</span>
                    <span className="text-slate-100 font-bold font-sans">
                      {displaySpecies === 'Wild Boar' ? 'Eating Crops' : 
                       displaySpecies === 'Nilgai' ? 'Eating Crops' : 
                       displaySpecies === 'Spotted Deer' ? 'Grazing' : 
                       displaySpecies === 'Rhesus Macaque' ? 'Fruit Damage' :
                       displaySpecies === 'Langur' ? 'Moving in Group' :
                       displaySpecies === 'Gaur' ? 'Eating Crops' : 
                       displaySpecies === 'Elephant' ? 'Moving in Group' :
                       displaySpecies === 'Cattle' || displaySpecies === 'Goat' ? 'Grazing' : 'Moving'}
                    </span>
                  </div>

                  {/* Usually Active */}
                  <div className="flex justify-between items-center pt-1">
                    <span className="text-slate-400">Usually Active:</span>
                    <span className="text-slate-200 font-semibold font-sans">
                      {displaySpecies === 'Wild Boar' ? 'Night' :
                       displaySpecies === 'Nilgai' ? 'Morning & Evening' :
                       displaySpecies === 'Spotted Deer' ? 'Morning & Evening' :
                       displaySpecies === 'Rhesus Macaque' || displaySpecies === 'Langur' ? 'Day' :
                       displaySpecies === 'Cattle' || displaySpecies === 'Goat' ? 'Day' :
                       displaySpecies === 'Elephant' || displaySpecies === 'Gaur' ? 'Night & Evening' : 'Day'}
                    </span>
                  </div>

                  {/* Possible Crop Damage */}
                  <div className="flex justify-between items-center pt-1">
                    <span className="text-slate-400">Possible Crop Damage:</span>
                    <span className="text-amber-400 font-bold font-sans">
                      {displaySpecies === 'Wild Boar' ? 'Eating Crops' :
                       displaySpecies === 'Nilgai' ? 'Eating Crops' :
                       displaySpecies === 'Spotted Deer' ? 'Eating Crops' :
                       displaySpecies === 'Rhesus Macaque' || displaySpecies === 'Langur' ? 'Fruit Damage' :
                       displaySpecies === 'Gaur' || displaySpecies === 'Elephant' ? 'Trampling Crops' :
                       displaySpecies === 'Cattle' || displaySpecies === 'Goat' ? 'Eating Crops' : 'No Major Damage'}
                    </span>
                  </div>

                  {/* Where It Is */}
                  <div className="flex justify-between items-center pt-1">
                    <span className="text-slate-400">Where It Is:</span>
                    <span className="text-slate-200 font-semibold font-sans">
                      {displayIntrusion ? "Inside Farm" : "Farm Boundary"}
                    </span>
                  </div>

                  {/* Risk Level */}
                  <div className="flex justify-between items-center pt-1">
                    <span className="text-slate-400">Risk Level:</span>
                    <span className={`font-bold font-sans ${
                      displayThreat === 'CRITICAL' ? 'text-red-500' :
                      displayThreat === 'HIGH' ? 'text-red-400' :
                      displayThreat === 'MEDIUM' || displayThreat === 'WARNING' ? 'text-amber-400' : 'text-green-400'
                    }`}>
                      {displayThreat === 'CRITICAL' ? 'Very High' :
                       displayThreat === 'HIGH' ? 'High' :
                       displayThreat === 'MEDIUM' || displayThreat === 'WARNING' ? 'Medium' : 'Low'}
                    </span>
                  </div>

                  {/* Action */}
                  <div className="flex justify-between items-center pt-1">
                    <span className="text-slate-400">Action:</span>
                    <span className={`font-bold font-sans px-1.5 py-0.5 rounded text-[8px] uppercase ${
                      (displayThreat === 'CRITICAL' || displaySpecies === 'Elephant' || displaySpecies === 'Gaur')
                        ? 'text-red-400 bg-red-500/10 border border-red-500/30 animate-pulse'
                        : displayIntrusion && displayThreat === 'HIGH'
                        ? 'text-red-400 bg-red-500/10 border border-red-500/30'
                        : displayIntrusion
                        ? 'text-amber-400 bg-amber-500/10 border border-amber-500/30'
                        : 'text-green-400 bg-green-500/10 border border-green-500/30'
                    }`}>
                      {(displaySpecies === 'Elephant' || displaySpecies === 'Gaur') ? 'Farmer Alert' :
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

        {/* Column 3: Classification Score & Info */}
        <div className="space-y-6">
          {/* Classification Score Card */}
          <div className="bg-[#0b0f19] border border-slate-900 rounded-xl p-4 shadow-lg space-y-3">
            <div className="text-[10px] font-bold font-sans text-slate-400 uppercase tracking-wider border-b border-slate-900 pb-1.5 flex justify-between items-center">
              <span>{t('classificationScore')}</span>
              <span className="text-[8px] font-mono text-slate-500">YOLOv11 Tensor</span>
            </div>
            <div className="space-y-2 text-[10px] font-mono">
              {[
                SPECIES_TAXONOMY[0], // Wild Boar
                SPECIES_TAXONOMY[2], // Spotted Deer
                SPECIES_TAXONOMY[1], // Nilgai
                SPECIES_TAXONOMY[6], // Cattle
                SPECIES_TAXONOMY[7], // Goat
              ].map((tax) => {
                const isSelected = displaySpecies.toLowerCase() === tax.class.toLowerCase() && hasConfidentTarget;
                const scorePct = isSelected ? `${displayConfidence}%` : "0.5%";
                return (
                  <div key={tax.class} className="space-y-1">
                    <div className="flex justify-between font-sans">
                      <span className={isSelected ? 'text-green-400 font-bold flex items-center gap-1' : 'text-slate-400'}>
                        {tax.class} <span className="font-mono text-[8px] text-slate-500">[{tax.code}]</span>
                      </span>
                      <span className={isSelected ? 'text-green-500 font-bold font-mono' : 'text-slate-500 font-mono'}>
                        {scorePct}
                      </span>
                    </div>
                    <div className="h-1 w-full bg-slate-950 rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full transition-all duration-300 ${isSelected ? 'bg-green-500' : 'bg-slate-800'}`} 
                        style={{ width: isSelected ? `${Math.min(displayConfidence, 100)}%` : '2%' }}
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
            Digital Twin Chain: Farm → Camera Node → Detection Zone → Animal → Intrusion → Response
          </span>
        </div>
        
        <div className="flex flex-col md:flex-row justify-between items-center gap-4 py-2 px-2 overflow-x-auto">
          {[
            { id: 1, label: t('step1') || "Frame Capture", sub: "Footage Ingestion" },
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
