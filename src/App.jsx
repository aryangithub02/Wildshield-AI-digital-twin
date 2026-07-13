import React, { useState, useEffect, useRef } from 'react';
import Sidebar from './components/Sidebar';
import TopNavbar from './components/TopNavbar';
import RightPanel from './components/RightPanel';
import KPICards from './components/KPICards';
import DigitalTwin from './components/DigitalTwin';
import Timeline from './components/Timeline';
import Analytics from './components/Analytics';
import DeviceStatus from './components/DeviceStatus';
import AIDetectionTab from './components/AIDetectionTab';
import DevicesTab from './components/DevicesTab';
import FarmMapTab from './components/FarmMapTab';
import NodeModal from './components/NodeModal';
import InteractiveTour from './components/InteractiveTour';

const STATE_IDLE = 0;
const STATE_APPROACHING = 1;
const STATE_DETECTED = 2;
const STATE_ESCALATED = 3;
const STATE_DETERRENT_ACTIVE = 4;
const STATE_RESOLVED = 5;

const STATE_LABELS = {
  [STATE_IDLE]: "System Idle • Monitoring",
  [STATE_APPROACHING]: "PIR Motion Warning",
  [STATE_DETECTED]: "Edge AI Analysis • LoRa TX",
  [STATE_ESCALATED]: "Threat Confirmed • Actuators Active",
  [STATE_DETERRENT_ACTIVE]: "Deterrents Active • Repelling",
  [STATE_RESOLVED]: "Intrusion Resolved • Safe",
};

const ANIMAL_SCENARIOS = [
  {
    species: "Elephant",
    emoji: "🐘",
    threat: "HIGH",
    nodeId: 1,
    nodeName: "FN-1",
    confidenceBase: 96.2,
    confidenceMax: 98.4,
    actuators: { siren: true, floodlight: true, speaker: true, sprinkler: true },
    logThreat: "HIGH",
    path: [
      { x: 54, y: -10, rotate: 0 },
      { x: 54, y: 2, rotate: 0 },
      { x: 54, y: 9, rotate: 0 },
      { x: 54, y: 12, rotate: 0 },
      { x: 54, y: 12, rotate: 180 },
      { x: 54, y: -5, rotate: 180 }
    ]
  },
  {
    species: "Wild Boar",
    emoji: "🐗",
    threat: "MEDIUM",
    nodeId: 5,
    nodeName: "FN-5",
    confidenceBase: 91.5,
    confidenceMax: 95.8,
    actuators: { siren: false, floodlight: false, speaker: true, sprinkler: true },
    logThreat: "MEDIUM",
    path: [
      { x: -10, y: -10, rotate: 0 },
      { x: 10, y: 10, rotate: 0 },
      { x: 22, y: 22, rotate: 0 },
      { x: 25, y: 25, rotate: 0 },
      { x: 25, y: 25, rotate: 180 },
      { x: -5, y: -5, rotate: 180 }
    ]
  },
  {
    species: "Monkey",
    emoji: "🐒",
    threat: "LOW",
    nodeId: 2,
    nodeName: "FN-2",
    confidenceBase: 88.4,
    confidenceMax: 93.6,
    actuators: { siren: false, floodlight: false, speaker: false, sprinkler: true },
    logThreat: "LOW",
    path: [
      { x: 95, y: -10, rotate: 0 },
      { x: 85, y: 10, rotate: 0 },
      { x: 78, y: 22, rotate: 0 },
      { x: 75, y: 26, rotate: 0 },
      { x: 75, y: 26, rotate: 180 },
      { x: 92, y: -5, rotate: 180 }
    ]
  },
  {
    species: "Deer",
    emoji: "🦌",
    threat: "LOW",
    nodeId: 4,
    nodeName: "FN-4",
    confidenceBase: 92.1,
    confidenceMax: 96.8,
    actuators: { siren: false, floodlight: true, speaker: false, sprinkler: false },
    logThreat: "LOW",
    path: [
      { x: 15, y: 110, rotate: 0 },
      { x: 26, y: 92, rotate: 0 },
      { x: 34, y: 78, rotate: 0 },
      { x: 38, y: 74, rotate: 0 },
      { x: 38, y: 74, rotate: 180 },
      { x: 18, y: 100, rotate: 180 }
    ]
  },
  {
    species: "Nilgai",
    emoji: "🐂",
    threat: "LOW",
    nodeId: 3,
    nodeName: "FN-3",
    confidenceBase: 90.4,
    confidenceMax: 94.6,
    actuators: { siren: false, floodlight: false, speaker: true, sprinkler: false },
    logThreat: "LOW",
    path: [
      { x: 90, y: 110, rotate: 0 },
      { x: 82, y: 92, rotate: 0 },
      { x: 74, y: 78, rotate: 0 },
      { x: 70, y: 74, rotate: 0 },
      { x: 70, y: 74, rotate: 180 },
      { x: 88, y: 100, rotate: 180 }
    ]
  }
];

export default function App() {
  const [activeTab, setActiveTab] = useState('overview');
  const [language, setLanguage] = useState('en'); // Translation language state
  const [simulationState, setSimulationState] = useState(STATE_IDLE);
  
  const tourRef = useRef(null);

  const startTour = () => {
    setActiveTab('overview');
    // Allow brief tab transition tick before calling tour restart
    setTimeout(() => {
      if (tourRef.current) {
        tourRef.current.restartTour();
      }
    }, 150);
  };
  const [scenarioIndex, setScenarioIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [speed, setSpeed] = useState(1);
  const [selectedNode, setSelectedNode] = useState(null);
  
  const [logs, setLogs] = useState([
    { id: 1, time: getFormattedTime(new Date(Date.now() - 3600000)), key: "coreOnline", type: "info" },
    { id: 2, time: getFormattedTime(new Date(Date.now() - 3000000)), key: "hubConnected", type: "info" },
    { id: 3, time: getFormattedTime(new Date(Date.now() - 2400000)), key: "meshCalibrated", type: "success" },
  ]);

  const [kpi, setKpi] = useState({
    intrusions: 8,
    wildAnimals: 4,
    activeCameras: 4,
    health: 98,
  });

  const timerRef = useRef(null);
  const currentScenario = ANIMAL_SCENARIOS[scenarioIndex];

  // Helper to format time as HH:MM:SS
  function getFormattedTime(date = new Date()) {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
  }

  // Add log helper with support for translation keys and parameters
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

  // State Transition Actions
  const handleStateTransition = (nextState, activeScenario = currentScenario) => {
    setSimulationState(nextState);

    switch (nextState) {
      case STATE_IDLE:
        addLog("systemIdle", "info");
        setScenarioIndex(prev => (prev + 1) % ANIMAL_SCENARIOS.length);
        break;
      
      case STATE_APPROACHING:
        addLog("motionDetectedLog", "warning", { nodeName: activeScenario.nodeName });
        break;
      
      case STATE_DETECTED:
        addLog("cameraActivatedLog", "detection", { nodeName: activeScenario.nodeName });
        break;
      
      case STATE_ESCALATED:
        addLog("targetConfirmedLog", "danger", { species: activeScenario.species, threat: activeScenario.threat });
        
        const activeActuators = [];
        if (activeScenario.actuators.speaker) activeActuators.push("Predator Sound");
        if (activeScenario.actuators.sprinkler) activeActuators.push("Sprinkler Pump");
        
        if (activeActuators.length > 0) {
          addLog("stage1DeployLog", "deterrent", { nodeName: activeScenario.nodeName, actuators: activeActuators });
        } else {
          addLog("stage1DeployLog", "info", { nodeName: activeScenario.nodeName, actuators: [] });
        }
        break;
      
      case STATE_DETERRENT_ACTIVE:
        const stage2Actuators = [];
        if (activeScenario.actuators.siren) stage2Actuators.push("Ultrasonic Siren");
        if (activeScenario.actuators.floodlight) stage2Actuators.push("Floodlight 01");

        if (stage2Actuators.length > 0) {
          addLog("stage2DeployLog", "danger", { nodeName: activeScenario.nodeName, actuators: stage2Actuators });
        } else {
          addLog("stage2DeployLog", "success", { nodeName: activeScenario.nodeName, actuators: [] });
        }
        break;
      
      case STATE_RESOLVED:
        addLog("targetRepelledLog", "success", { species: activeScenario.species, nodeName: activeScenario.nodeName });
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

  // Simulation Logic Timer Loop
  useEffect(() => {
    if (isPlaying) {
      const intervalDuration = 2500 / speed;
      timerRef.current = setInterval(() => {
        setSimulationState(current => {
          const next = (current + 1) % 6;
          handleStateTransition(next, ANIMAL_SCENARIOS[scenarioIndex]);
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
  }, [isPlaying, speed, scenarioIndex]);

  // Reset Simulation
  const handleReset = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    setSimulationState(STATE_IDLE);
    setScenarioIndex(0);
    setIsPlaying(false);
    setLogs([
      { id: 1, time: getFormattedTime(), key: "manualReset", type: "info" }
    ]);
    addLog("systemInitialized", "success");
  };

  // Manual Step Forward
  const handleStepForward = () => {
    if (!isPlaying) {
      const next = (simulationState + 1) % 6;
      handleStateTransition(next);
    }
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
      <div className="ml-64 pr-80 pt-16 min-h-screen flex flex-col p-6 space-y-6">
        
        {activeTab === 'overview' ? (
          <>
            {/* KPI Cards Grid */}
            <KPICards kpi={kpi} language={language} />

            {/* Map Panel (Digital Twin) */}
            <div className="w-full">
              <DigitalTwin 
                simulationState={simulationState} 
                onSelectNode={setSelectedNode}
                currentScenario={currentScenario}
                language={language}
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
          />
        ) : activeTab === 'devices' ? (
          <DevicesTab 
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

      {/* Interactive Enclosure & Circuit Schematic Modal */}
      {selectedNode && (
        <NodeModal
          node={selectedNode}
          onClose={() => setSelectedNode(null)}
          simulationState={simulationState}
          currentScenario={currentScenario}
        />
      )}

      {/* Onboarding guided interactive walkthrough tour */}
      <InteractiveTour 
        ref={tourRef} 
        language={language} 
        onStart={() => {
          setActiveTab('overview');
          setIsPlaying(false); // Pause auto-simulation loop
          // Set initial starting logs
          setLogs([
            { id: 1, time: "10:20:00 AM", key: "systemInitialized", type: "success" }
          ]);
        }} 
        onStepChange={(stepIndex) => {
          const elephantScenario = ANIMAL_SCENARIOS[0]; // Elephant breach
          
          if (stepIndex === 0 || stepIndex === 1 || stepIndex === 2) {
            // Steps 1, 2, 3 (Sidebar, Navbar, KPIs): Keep system idle
            setSimulationState(STATE_IDLE);
            setScenarioIndex(0);
            setLogs([
              { id: 1, time: "10:20:00 AM", key: "systemInitialized", type: "success" }
            ]);
          } else if (stepIndex === 3) {
            // Step 4 (Map Breach): Triggers motion detection and camera active logs
            setSimulationState(STATE_DETECTED);
            setScenarioIndex(0);
            setLogs([
              { 
                id: 3, 
                time: "10:21:05 AM", 
                key: "cameraActivatedLog", 
                type: "detection", 
                params: { nodeName: elephantScenario.nodeName } 
              },
              { 
                id: 2, 
                time: "10:21:00 AM", 
                key: "motionDetectedLog", 
                type: "warning", 
                params: { nodeName: elephantScenario.nodeName } 
              },
              { 
                id: 1, 
                time: "10:20:00 AM", 
                key: "systemInitialized", 
                type: "success" 
              }
            ]);
          } else if (stepIndex === 4 || stepIndex === 5) {
            // Steps 5, 6 (AI Camera Feed, Analytics): Triggers species alert confirmation and deterrent active logs
            setSimulationState(STATE_DETERRENT_ACTIVE);
            setScenarioIndex(0);
            setLogs([
              { 
                id: 5, 
                time: "10:21:30 AM", 
                key: "stage2DeployLog", 
                type: "danger", 
                params: { nodeName: elephantScenario.nodeName, actuators: ["Ultrasonic Siren", "Floodlight 01"] } 
              },
              { 
                id: 4, 
                time: "10:21:15 AM", 
                key: "targetConfirmedLog", 
                type: "danger", 
                params: { species: "Elephant", threat: "HIGH" } 
              },
              { 
                id: 3, 
                time: "10:21:05 AM", 
                key: "cameraActivatedLog", 
                type: "detection", 
                params: { nodeName: elephantScenario.nodeName } 
              },
              { 
                id: 2, 
                time: "10:21:00 AM", 
                key: "motionDetectedLog", 
                type: "warning", 
                params: { nodeName: elephantScenario.nodeName } 
              },
              { 
                id: 1, 
                time: "10:20:00 AM", 
                key: "systemInitialized", 
                type: "success" 
              }
            ]);
          } else if (stepIndex === 6 || stepIndex === 7) {
            // Steps 7, 8 (Timeline, Device Status): Triggers final target repelled log
            setSimulationState(STATE_RESOLVED);
            setScenarioIndex(0);
            setLogs([
              { 
                id: 6, 
                time: "10:22:00 AM", 
                key: "targetRepelledLog", 
                type: "success", 
                params: { species: "Elephant", nodeName: elephantScenario.nodeName } 
              },
              { 
                id: 5, 
                time: "10:21:30 AM", 
                key: "stage2DeployLog", 
                type: "danger", 
                params: { nodeName: elephantScenario.nodeName, actuators: ["Ultrasonic Siren", "Floodlight 01"] } 
              },
              { 
                id: 4, 
                time: "10:21:15 AM", 
                key: "targetConfirmedLog", 
                type: "danger", 
                params: { species: "Elephant", threat: "HIGH" } 
              },
              { 
                id: 3, 
                time: "10:21:05 AM", 
                key: "cameraActivatedLog", 
                type: "detection", 
                params: { nodeName: elephantScenario.nodeName } 
              },
              { 
                id: 2, 
                time: "10:21:00 AM", 
                key: "motionDetectedLog", 
                type: "warning", 
                params: { nodeName: elephantScenario.nodeName } 
              },
              { 
                id: 1, 
                time: "10:20:00 AM", 
                key: "systemInitialized", 
                type: "success" 
              }
            ]);
          }
        }}
        onComplete={() => {
          setIsPlaying(true); // Resume auto-simulation loop
        }}
      />
    </div>
  );
}
