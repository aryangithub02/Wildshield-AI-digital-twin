import React, { useState, useEffect, useRef } from 'react';
import Sidebar from './components/Sidebar';
import TopNavbar from './components/TopNavbar';
import KPICards from './components/KPICards';
import DigitalTwin from './components/DigitalTwin';
import Analytics from './components/Analytics';
import Timeline from './components/Timeline';
import DeviceStatus from './components/DeviceStatus';
import RightPanel from './components/RightPanel';
import InteractiveTour from './components/InteractiveTour';
import FarmMapTab from './components/FarmMapTab';
import AIDetectionTab from './components/AIDetectionTab';
import DevicesTab from './components/DevicesTab';
import DecisionMatrixTab from './components/DecisionMatrixTab';
import WorkflowTab from './components/WorkflowTab';
import AlertsTab from './components/AlertsTab';
import AnalyticsTab from './components/AnalyticsTab';
import TimelineTab from './components/TimelineTab';
import SettingsTab from './components/SettingsTab';
import { getTranslation } from './utils/translations';
import { SPECIES_TAXONOMY, getSpeciesMetadataByName } from './utils/speciesMapping';

// Simulation state constants
const STATE_IDLE = 0;
const STATE_APPROACHING = 1;
const STATE_DETECTED = 2;
const STATE_ESCALATED = 3;
const STATE_DETERRENT_ACTIVE = 4;
const STATE_RESOLVED = 5;

// Dynamic Node Trajectories across farm perimeter
const NODE_PATHS = {
  1: [
    { x: 54, y: -12, rotate: 0, zone: "North Forest Fringe" },
    { x: 54, y: 0, rotate: 0, zone: "North Buffer Zone" },
    { x: 54, y: 9, rotate: 0, zone: "North Geofence" },
    { x: 54, y: 18, rotate: 0, zone: "North Crop Field" },
    { x: 54, y: 18, rotate: 180, zone: "Deterred & Turning" },
    { x: 54, y: -10, rotate: 180, zone: "Retreating to Forest" }
  ],
  2: [
    { x: 94, y: 10, rotate: 0, zone: "East Forest Edge" },
    { x: 86, y: 16, rotate: 0, zone: "East Buffer" },
    { x: 78, y: 22, rotate: 0, zone: "East Geofence" },
    { x: 70, y: 28, rotate: 0, zone: "East Orchard Field" },
    { x: 70, y: 28, rotate: 180, zone: "Deterred & Turning" },
    { x: 96, y: 18, rotate: 180, zone: "Retreating East" }
  ],
  3: [
    { x: 92, y: 92, rotate: 0, zone: "South-East Riverbed" },
    { x: 82, y: 84, rotate: 0, zone: "South-East Buffer" },
    { x: 74, y: 78, rotate: 0, zone: "South-East Geofence" },
    { x: 66, y: 70, rotate: 0, zone: "South-East Pulse Field" },
    { x: 66, y: 70, rotate: 180, zone: "Deterred & Turning" },
    { x: 94, y: 90, rotate: 180, zone: "Retreating South-East" }
  ],
  4: [
    { x: 18, y: 92, rotate: 0, zone: "South-West Hill Slope" },
    { x: 26, y: 84, rotate: 0, zone: "South-West Buffer" },
    { x: 34, y: 78, rotate: 0, zone: "South-West Geofence" },
    { x: 42, y: 70, rotate: 0, zone: "South-West Grassland" },
    { x: 42, y: 70, rotate: 180, zone: "Deterred & Turning" },
    { x: 16, y: 90, rotate: 180, zone: "Retreating South-West" }
  ],
  5: [
    { x: 6, y: 10, rotate: 0, zone: "West Boundary Trail" },
    { x: 14, y: 16, rotate: 0, zone: "West Buffer" },
    { x: 22, y: 22, rotate: 0, zone: "West Geofence" },
    { x: 30, y: 28, rotate: 0, zone: "West Vegetable Field" },
    { x: 30, y: 28, rotate: 180, zone: "Deterred & Turning" },
    { x: 4, y: 18, rotate: 180, zone: "Retreating West" }
  ]
};

// Initial benchmark scenarios
const DEFAULT_SCENARIOS = [
  {
    species: "Wild Boar",
    code: "WS-WL-WB",
    emoji: "🐗",
    sourceFile: "WS-WL-WB-00006.jpg",
    threat: "HIGH",
    nodeId: 1,
    nodeName: "FN-1",
    zone: "North Crop Field",
    confidenceBase: 95.5,
    confidenceMax: 95.5,
    actuators: { siren: true, floodlight: true, speaker: true, sprinkler: false },
    logThreat: "HIGH",
    path: NODE_PATHS[1]
  },
  {
    species: "Nilgai",
    code: "WS-WL-NG",
    emoji: "🐂",
    sourceFile: "WS-WL-NG-00016.jpg",
    threat: "HIGH",
    nodeId: 3,
    nodeName: "FN-3",
    zone: "South-East Pulse Field",
    confidenceBase: 97.9,
    confidenceMax: 97.9,
    actuators: { siren: false, floodlight: true, speaker: true, sprinkler: false },
    logThreat: "HIGH",
    path: NODE_PATHS[3]
  },
  {
    species: "Spotted Deer",
    code: "WS-WL-SD",
    emoji: "🦌",
    sourceFile: "WS-WL-SD-00106.jpg",
    threat: "MEDIUM",
    nodeId: 4,
    nodeName: "FN-4",
    zone: "South-West Grassland",
    confidenceBase: 97.9,
    confidenceMax: 97.9,
    actuators: { siren: false, floodlight: true, speaker: false, sprinkler: false },
    logThreat: "MEDIUM",
    path: NODE_PATHS[4]
  },
  {
    species: "Cattle",
    code: "WS-DM-CT",
    emoji: "🐄",
    sourceFile: "WS-DM-CT-00023.jpg",
    threat: "LOW",
    nodeId: 2,
    nodeName: "FN-2",
    zone: "East Orchard Field",
    confidenceBase: 97.0,
    confidenceMax: 97.0,
    actuators: { siren: false, floodlight: false, speaker: true, sprinkler: true },
    logThreat: "LOW",
    path: NODE_PATHS[2]
  },
  {
    species: "Goat",
    code: "WS-DM-GT",
    emoji: "🐐",
    sourceFile: "WS-DM-GT-00053.jpg",
    threat: "LOW",
    nodeId: 5,
    nodeName: "FN-5",
    zone: "West Vegetable Field",
    confidenceBase: 96.2,
    confidenceMax: 96.2,
    actuators: { siren: false, floodlight: false, speaker: true, sprinkler: false },
    logThreat: "LOW",
    path: NODE_PATHS[5]
  }
];

export default function App() {
  const [activeTab, setActiveTab] = useState('overview');
  const [language, setLanguage] = useState('en');
  const [simulationState, setSimulationState] = useState(STATE_IDLE);
  
  const tourRef = useRef(null);
  const startTour = () => {
    setActiveTab('overview');
    setTimeout(() => {
      if (tourRef.current) {
        tourRef.current.restartTour();
      }
    }, 150);
  };

  // Simulation Controls State
  const [isPlaying, setIsPlaying] = useState(true);
  const [autoSimulation, setAutoSimulation] = useState(true);
  const [speed, setSpeed] = useState(1);
  const [selectedNode, setSelectedNode] = useState(null);
  const [testImages, setTestImages] = useState([]);
  const [lastImageIndex, setLastImageIndex] = useState(-1);
  const [liveModelScenario, setLiveModelScenario] = useState(DEFAULT_SCENARIOS[0]);

  const [logs, setLogs] = useState([
    { id: 1, time: getFormattedTime(new Date(Date.now() - 3600000)), key: "coreOnline", type: "info" },
    { id: 2, time: getFormattedTime(new Date(Date.now() - 3000000)), key: "hubConnected", type: "info" },
    { id: 3, time: getFormattedTime(new Date(Date.now() - 2400000)), key: "meshCalibrated", type: "success" },
  ]);

  const [kpi, setKpi] = useState({
    intrusions: 8,
    wildAnimals: 4,
    activeCameras: 5,
    health: 98,
  });

  const timerRef = useRef(null);
  const currentScenario = liveModelScenario || DEFAULT_SCENARIOS[0];

  function getFormattedTime(date = new Date()) {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
  }

  const addLog = (keyOrText, type = 'info', params = {}) => {
    const isKey = typeof keyOrText === 'string' && keyOrText.indexOf(' ') === -1;
    setLogs(prev => [
      {
        id: Date.now() + Math.random(),
        time: getFormattedTime(),
        key: isKey ? keyOrText : undefined,
        text: isKey ? undefined : keyOrText,
        params,
        type
      },
      ...prev
    ]);
  };

  const isLocalHost = typeof window !== 'undefined' && (
    window.location.hostname === 'localhost' ||
    window.location.hostname === '127.0.0.1' ||
    window.location.hostname.startsWith('192.168.') ||
    window.location.hostname.startsWith('10.')
  );

  const renderBackendUrl = "https://wildshield-ai-digital-twin-1.onrender.com";
  const renderWsUrl = "wss://wildshield-ai-digital-twin-1.onrender.com/ws";

  const API_BASE_URL = isLocalHost
    ? `http://${window.location.hostname}:8000`
    : (import.meta.env.VITE_API_BASE_URL || renderBackendUrl);

  const WS_URL = isLocalHost
    ? `ws://${window.location.hostname}:8000/ws`
    : (import.meta.env.VITE_WS_URL || renderWsUrl);

  // 1. Fetch available dataset images on mount & connect live WebSocket
  useEffect(() => {
    const fetchImages = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/test-images`);
        if (res.ok) {
          const data = await res.json();
          setTestImages(data.images || []);
        }
      } catch (err) {
        console.warn("Dataset images fetch offline fallback:", err);
      }
    };
    fetchImages();

    // Global WebSocket connection & Vercel Serverless REST polling fallback
    let ws = null;
    let reconnectTimeout = null;
    let pollInterval = null;
    let reconnectAttempts = 0;
    const MAX_RECONNECT_ATTEMPTS = 3;

    // Vercel serverless functions handle REST API (/api/*) natively but do not support persistent WebSockets
    const isVercelServerless = !import.meta.env.VITE_WS_URL && window.location.hostname.endsWith('.vercel.app');

    const startRestPolling = () => {
      let lastSeenEventId = null;
      pollInterval = setInterval(async () => {
        try {
          const res = await fetch(`${API_BASE_URL}/api/events?limit=1`);
          if (res.ok) {
            const data = await res.json();
            if (data.events && data.events.length > 0) {
              const latest = data.events[0];
              if (lastSeenEventId && latest.event_id !== lastSeenEventId) {
                handleLiveModelDetection({
                  camera_id: latest.camera_id || "FN-1",
                  time_formatted: latest.time,
                  source_file: latest.source,
                  annotated_image: latest.annotated_image,
                  primary_detection: {
                    class: latest.species,
                    code: latest.code || "ANML",
                    emoji: "🐾",
                    threat: latest.threat,
                    confidence_pct: Math.round((latest.confidence || 0.9) * (latest.confidence <= 1 ? 100 : 1)),
                    intrusion: latest.intrusion,
                    responses: latest.response || ["ULTRASONIC_ALERT"],
                    actuators: { siren: true, floodlight: true, speaker: true, sprinkler: false }
                  }
                });
              }
              lastSeenEventId = latest.event_id;
            }
          }
        } catch (e) {
          // Silent catch for background poll
        }
      }, 4000);
    };

    if (isVercelServerless) {
      console.info("[WildShield Web WS] Running on Vercel Serverless backend. Enabled live REST polling fallback.");
      startRestPolling();
      return () => {
        if (pollInterval) clearInterval(pollInterval);
      };
    }

    const connectWS = () => {
      if (reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) {
        console.warn(`[WildShield Web WS] Max reconnection attempts (${MAX_RECONNECT_ATTEMPTS}) reached. Switching to REST API polling fallback.`);
        startRestPolling();
        return;
      }

      try {
        const sep = WS_URL.includes('?') ? '&' : '?';
        const fullWsUrl = WS_URL.includes('client_type=') 
          ? WS_URL 
          : `${WS_URL}${sep}client_type=web&client_id=WEB_DASHBOARD`;

        ws = new WebSocket(fullWsUrl);
        ws.onopen = () => {
          reconnectAttempts = 0;
          console.log("[WildShield Web WS] Connected to Central Edge AI Hub");
        };
        ws.onmessage = (event) => {
          try {
            const msg = JSON.parse(event.data);
            if (msg.type === "DETECTION_EVENT" && msg.data) {
              handleLiveModelDetection(msg.data);
            }
          } catch (e) {
            console.warn("[WildShield Web WS] Parse error:", e);
          }
        };
        ws.onclose = () => {
          if (reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
            reconnectAttempts++;
            const delay = Math.min(3000 * Math.pow(1.5, reconnectAttempts - 1), 10000);
            console.log(`[WildShield Web WS] Connection closed. Retrying (${reconnectAttempts}/${MAX_RECONNECT_ATTEMPTS}) in ${Math.round(delay / 1000)}s...`);
            reconnectTimeout = setTimeout(connectWS, delay);
          } else {
            startRestPolling();
          }
        };
        ws.onerror = () => {
          console.warn("[WildShield Web WS] Connection error.");
        };
      } catch (err) {
        console.warn("[WildShield Web WS] Init error:", err);
        if (reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
          reconnectAttempts++;
          reconnectTimeout = setTimeout(connectWS, 5000);
        } else {
          startRestPolling();
        }
      }
    };

    connectWS();

    return () => {
      if (reconnectTimeout) clearTimeout(reconnectTimeout);
      if (pollInterval) clearInterval(pollInterval);
      if (ws) {
        ws.onclose = null;
        ws.onerror = null;
        if (ws.readyState === WebSocket.CONNECTING) {
          const socket = ws;
          socket.onopen = () => {
            try { socket.close(); } catch (e) {}
          };
        } else if (ws.readyState === WebSocket.OPEN) {
          try { ws.close(); } catch (e) {}
        }
      }
    };
  }, []);

  // 2. Trigger Next Event with Real YOLO Inference & Farm Location
  const triggerNextEvent = async (explicitImage = null, explicitNodeId = null) => {
    let chosenFilename = explicitImage;
    let chosenIndex = -1;

    if (!chosenFilename && testImages.length > 0) {
      // Pick random dataset image distinct from last
      let newIdx = Math.floor(Math.random() * testImages.length);
      if (newIdx === lastImageIndex && testImages.length > 1) {
        newIdx = (newIdx + 1) % testImages.length;
      }
      chosenIndex = newIdx;
      setLastImageIndex(newIdx);
      chosenFilename = testImages[newIdx].filename;
    }

    const assignedNodeId = explicitNodeId || Math.floor(Math.random() * 5) + 1;
    const pathCoords = NODE_PATHS[assignedNodeId] || NODE_PATHS[1];

    if (chosenFilename) {
      try {
        const res = await fetch(`${API_BASE_URL}/api/test-detect`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            filename: chosenFilename,
            conf: 0.25,
            node_id: assignedNodeId
          })
        });

        if (res.ok) {
          const data = await res.json();
          const primary = data.primary_detection;
          if (primary) {
            const isHigh = primary.threat === "HIGH" || primary.threat === "CRITICAL";
            const isMed = primary.threat === "MEDIUM" || primary.threat === "WARNING";

            const scenarioObj = {
              species: primary.class,
              code: primary.code,
              emoji: primary.emoji,
              image: (data.annotated_image && data.annotated_image.startsWith("data:"))
                ? data.annotated_image
                : (data.annotated_image ? `data:image/jpeg;base64,${data.annotated_image}` : `${API_BASE_URL}/static-test-images/${chosenFilename}`),
              sourceFile: chosenFilename,
              timestamp: data.time_formatted || getFormattedTime(),
              threat: isHigh ? "HIGH" : isMed ? "MEDIUM" : "LOW",
              nodeId: assignedNodeId,
              nodeName: `FN-${assignedNodeId}`,
              zone: pathCoords[3]?.zone || "Crop Field",
              confidenceBase: primary.confidence_pct,
              confidenceMax: primary.confidence_pct,
              actuators: primary.actuators || { siren: isHigh, floodlight: isHigh || isMed, speaker: true, sprinkler: false },
              logThreat: primary.threat,
              path: pathCoords
            };

            setLiveModelScenario(scenarioObj);
            setSimulationState(STATE_APPROACHING);
            return;
          }
        }
      } catch (e) {
        console.warn("Live YOLO inference fallback:", e);
      }
    }

    // Fallback rotation from DEFAULT_SCENARIOS
    const nextScenario = DEFAULT_SCENARIOS[(lastImageIndex + 1) % DEFAULT_SCENARIOS.length];
    setLastImageIndex((lastImageIndex + 1) % DEFAULT_SCENARIOS.length);
    setLiveModelScenario({
      ...nextScenario,
      nodeId: assignedNodeId,
      nodeName: `FN-${assignedNodeId}`,
      path: pathCoords
    });
    setSimulationState(STATE_APPROACHING);
  };

  // 3. Handler for Live Model Detection from AIDetectionTab & WebSocket Broadcast
  const handleLiveModelDetection = (payload) => {
    if (!payload) return;
    const primary = payload.primary_detection;
    if (primary) {
      const isHigh = primary.threat === "HIGH" || primary.threat === "CRITICAL";
      const isMed = primary.threat === "MEDIUM" || primary.threat === "WARNING";
      const assignedNodeId = payload.camera_id === "FN-1" ? 1 : 
                             payload.camera_id === "FN-2" ? 2 : 
                             payload.camera_id === "FN-3" ? 3 : 
                             payload.camera_id === "FN-4" ? 4 : 5;
      
      const pathCoords = NODE_PATHS[assignedNodeId] || NODE_PATHS[1];

      const scenarioObj = {
        species: primary.class,
        code: primary.code,
        emoji: primary.emoji,
        image: (payload.annotated_image && payload.annotated_image.startsWith("data:"))
          ? payload.annotated_image
          : (payload.annotated_image
              ? `data:image/jpeg;base64,${payload.annotated_image}`
              : (payload.source_file ? `/sample-test-images/${payload.source_file}` : null)),
        sourceFile: payload.source_file || "",
        timestamp: payload.time_formatted || getFormattedTime(),
        threat: isHigh ? "HIGH" : isMed ? "MEDIUM" : "LOW",
        nodeId: assignedNodeId,
        nodeName: payload.camera_id || `FN-${assignedNodeId}`,
        zone: pathCoords[3]?.zone || "Perimeter Field",
        confidenceBase: primary.confidence_pct,
        confidenceMax: primary.confidence_pct,
        actuators: primary.actuators || { siren: false, floodlight: false, speaker: false, sprinkler: false },
        logThreat: primary.threat,
        path: pathCoords
      };
      
      setLiveModelScenario(scenarioObj);
      setSimulationState(primary.intrusion ? STATE_DETERRENT_ACTIVE : STATE_DETECTED);

      setKpi(prev => ({
        ...prev,
        wildAnimals: prev.wildAnimals + 1,
        intrusions: primary.intrusion ? prev.intrusions + 1 : prev.intrusions
      }));

      addLog(
        `[${primary.code}] ${primary.class} identified at ${payload.camera_id} (${primary.confidence_pct}% Conf) • ${primary.responses.join(' + ')}`,
        primary.intrusion ? 'danger' : 'detection',
        { species: primary.class, threat: primary.threat }
      );
    }
  };

  // 4. State Transitions
  const handleStateTransition = (nextState, active = currentScenario) => {
    setSimulationState(nextState);

    switch (nextState) {
      case STATE_IDLE:
        addLog("systemIdle", "info");
        if (autoSimulation) {
          triggerNextEvent();
        }
        break;
      
      case STATE_APPROACHING:
        addLog("motionDetectedLog", "warning", { nodeName: active.nodeName });
        break;
      
      case STATE_DETECTED:
        addLog("cameraActivatedLog", "detection", { nodeName: active.nodeName });
        break;
      
      case STATE_ESCALATED:
        addLog("targetConfirmedLog", "danger", { species: active.species, threat: active.threat });
        const activeActuators = [];
        if (active.actuators?.speaker) activeActuators.push("Predator Sound");
        if (active.actuators?.sprinkler) activeActuators.push("Sprinkler Pump");
        if (activeActuators.length > 0) {
          addLog("stage1DeployLog", "deterrent", { nodeName: active.nodeName, actuators: activeActuators });
        }
        break;
      
      case STATE_DETERRENT_ACTIVE:
        const stage2Actuators = [];
        if (active.actuators?.siren) stage2Actuators.push("Ultrasonic Siren");
        if (active.actuators?.floodlight) stage2Actuators.push("Floodlight 01");
        if (stage2Actuators.length > 0) {
          addLog("stage2DeployLog", "danger", { nodeName: active.nodeName, actuators: stage2Actuators });
        }
        break;
      
      case STATE_RESOLVED:
        addLog("targetRepelledLog", "success", { species: active.species, nodeName: active.nodeName });
        setKpi(prev => ({
          ...prev,
          intrusions: prev.intrusions + 1,
          wildAnimals: prev.wildAnimals + 1
        }));
        break;

      default:
        break;
    }
  };

  // 5. Autonomous Simulation Timer Loop
  useEffect(() => {
    if (isPlaying) {
      const intervalDuration = 2400 / speed;
      timerRef.current = setInterval(() => {
        setSimulationState(current => {
          const next = (current + 1) % 6;
          handleStateTransition(next, currentScenario);
          return next;
        });
      }, intervalDuration);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [isPlaying, speed, autoSimulation, currentScenario?.sourceFile]);

  // Reset Simulation
  const handleReset = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    setSimulationState(STATE_IDLE);
    setIsPlaying(false);
    setLogs([
      { id: 1, time: getFormattedTime(), key: "manualReset", type: "info" }
    ]);
    addLog("systemInitialized", "success");
  };

  return (
    <div className="w-full min-h-screen bg-[#020617] text-slate-100 font-sans">
      
      {/* 1. Left Sidebar */}
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} language={language} startTour={startTour} />

      {/* 2. Top Navigation Bar */}
      <TopNavbar language={language} setLanguage={setLanguage} />

      {/* 3. Right Sidebar Panel */}
      <RightPanel 
        simulationState={simulationState} 
        currentScenario={currentScenario} 
        language={language}
      />

      {/* 4. Center Main Panel Viewport */}
      <div className="ml-64 pr-[400px] pt-16 min-h-screen flex flex-col p-6 space-y-6">
        
        {activeTab === 'overview' ? (
          <>
            {/* KPI Cards Grid */}
            <KPICards kpi={kpi} language={language} />

            {/* Map Panel (Digital Twin with Live Dataset Simulation Controls) */}
            <div className="w-full">
              <DigitalTwin 
                simulationState={simulationState} 
                onSelectNode={setSelectedNode}
                currentScenario={currentScenario}
                language={language}
                isPlaying={isPlaying}
                setIsPlaying={setIsPlaying}
                onNextEvent={() => triggerNextEvent()}
                speed={speed}
                setSpeed={setSpeed}
                autoSimulation={autoSimulation}
                setAutoSimulation={setAutoSimulation}
                onReset={handleReset}
                testImagesCount={testImages.length}
              />
            </div>

            {/* Bottom Split Grid: Analytics Overview & Event Timeline */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Analytics language={language} />
              <Timeline logs={logs} language={language} />
            </div>

            {/* IoT Nodes Hardware list */}
            <div className="w-full">
              <DeviceStatus simulationState={simulationState} currentScenario={currentScenario} language={language} />
            </div>
          </>
        ) : activeTab === 'map' ? (
          <FarmMapTab 
            simulationState={simulationState} 
            currentScenario={currentScenario} 
            language={language}
          />
        ) : activeTab === 'detection' ? (
          <AIDetectionTab 
            simulationState={simulationState} 
            currentScenario={currentScenario} 
            language={language}
            onLiveDetection={handleLiveModelDetection}
          />
        ) : activeTab === 'devices' ? (
          <DevicesTab 
            simulationState={simulationState} 
            currentScenario={currentScenario} 
            language={language}
          />
        ) : activeTab === 'decision' ? (
          <DecisionMatrixTab 
            simulationState={simulationState} 
            currentScenario={currentScenario} 
            language={language}
          />
        ) : activeTab === 'workflow' ? (
          <WorkflowTab 
            simulationState={simulationState} 
            currentScenario={currentScenario} 
            language={language}
          />
        ) : activeTab === 'alerts' ? (
          <AlertsTab 
            simulationState={simulationState} 
            currentScenario={currentScenario} 
            language={language}
            onTriggerNewEvent={() => triggerNextEvent()}
          />
        ) : activeTab === 'analytics' ? (
          <AnalyticsTab 
            simulationState={simulationState} 
            currentScenario={currentScenario} 
            language={language}
          />
        ) : activeTab === 'timeline' ? (
          <TimelineTab 
            simulationState={simulationState} 
            currentScenario={currentScenario} 
            language={language}
            logs={logs}
          />
        ) : activeTab === 'settings' ? (
          <SettingsTab 
            simulationState={simulationState} 
            currentScenario={currentScenario} 
            language={language}
          />
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-500 font-mono text-xs py-20 bg-[#0b0f19]/30 rounded-xl border border-slate-900/60">
            <span className="text-2xl mb-2">⚙️</span>
            <span>Workspace section "{activeTab.toUpperCase()}" is under active configuration.</span>
          </div>
        )}
      </div>

      {/* Interactive Onboarding Product Tour */}
      <InteractiveTour
        ref={tourRef}
        language={language}
        onStepChange={(stepIndex) => {
          if (stepIndex === 0) {
            setSimulationState(STATE_IDLE);
          } else if (stepIndex === 1 || stepIndex === 2) {
            setSimulationState(STATE_APPROACHING);
          } else if (stepIndex === 3) {
            setSimulationState(STATE_DETECTED);
          } else if (stepIndex === 4 || stepIndex === 5) {
            setSimulationState(STATE_DETERRENT_ACTIVE);
          } else if (stepIndex === 6 || stepIndex === 7) {
            setSimulationState(STATE_RESOLVED);
          }
        }}
        onTourStart={() => {
          setIsPlaying(false);
        }}
        onTourEnd={() => {
          setIsPlaying(true);
        }}
      />
    </div>
  );
}
