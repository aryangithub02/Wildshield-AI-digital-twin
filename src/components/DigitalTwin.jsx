import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Camera, Volume2, Lightbulb, ShieldAlert, Sparkles, Radio, 
  HelpCircle, Navigation, Plus, Minus, Layers, Settings,
  Play, Pause, SkipForward, RotateCcw, Zap, Eye
} from 'lucide-react';
import { getTranslation } from '../utils/translations';

export default function DigitalTwin({ 
  simulationState, 
  onSelectNode, 
  currentScenario, 
  language,
  isPlaying,
  setIsPlaying,
  onNextEvent,
  speed,
  setSpeed,
  autoSimulation,
  setAutoSimulation,
  onReset,
  testImagesCount = 54
}) {
  const t = (key) => getTranslation(language, key);

  const getSpeciesTranslated = (speciesName) => {
    if (speciesName === "Elephant") return t('elephant');
    if (speciesName === "Wild Boar") return t('wildBoar');
    if (speciesName === "Monkey" || speciesName === "Rhesus Macaque" || speciesName === "Langur") return t('monkey');
    if (speciesName === "Deer" || speciesName === "Spotted Deer") return t('deer');
    if (speciesName === "Nilgai") return t('nilgai');
    if (speciesName === "Cattle" || speciesName === "Stray Cattle") return t('strayCattle') || "Cattle";
    if (speciesName === "Goat") return "Goat";
    if (speciesName === "Gaur") return "Gaur";
    return speciesName;
  };

  const nodes = [
    { id: 1, name: 'Farmer Node 01 (FN-1)', zone: 'North Field', x: 54, y: 9, type: 'node' },
    { id: 2, name: 'Farmer Node 02 (FN-2)', zone: 'East Orchard', x: 78, y: 22, type: 'node' },
    { id: 3, name: 'Farmer Node 03 (FN-3)', zone: 'South-East Pulses', x: 74, y: 78, type: 'node' },
    { id: 4, name: 'Farmer Node 04 (FN-4)', zone: 'South-West Grass', x: 34, y: 78, type: 'node' },
    { id: 5, name: 'Farmer Node 05 (FN-5)', zone: 'West Vegetables', x: 22, y: 22, type: 'node' },
  ];

  const centralHub = { name: 'Central AI Hub (Jetson Orin Nano)', x: 52, y: 44 };

  const activeScenario = currentScenario || {
    species: "Wild Boar",
    code: "WS-WL-WB",
    emoji: "🐗",
    threat: "HIGH",
    nodeId: 1,
    nodeName: "FN-1",
    zone: "North Crop Field",
    confidenceBase: 95.5,
    confidenceMax: 95.5,
    actuators: { siren: true, floodlight: true, speaker: true, sprinkler: false },
    path: [
      { x: 54, y: -10, rotate: 0 },
      { x: 54, y: 2, rotate: 0 },
      { x: 54, y: 9, rotate: 0 },
      { x: 54, y: 18, rotate: 0 },
      { x: 54, y: 18, rotate: 180 },
      { x: 54, y: -10, rotate: 180 }
    ]
  };

  const currentCoords = (activeScenario.path && activeScenario.path[simulationState]) || 
                        (activeScenario.path && activeScenario.path[0]) || 
                        { x: 54, y: 9, rotate: 0 };

  const isCameraActive = simulationState >= 2 && simulationState <= 4;
  const isSprinklerActive = (simulationState === 3 || simulationState === 4) && activeScenario.actuators?.sprinkler;
  const isSpeakerActive = (simulationState === 3 || simulationState === 4) && activeScenario.actuators?.speaker;
  const isSirenActive = simulationState === 4 && activeScenario.actuators?.siren;
  const isFloodlightActive = simulationState === 4 && activeScenario.actuators?.floodlight;
  const isAnyDeterrentActive = simulationState >= 3 && simulationState <= 4 && (isSprinklerActive || isSpeakerActive || isSirenActive || isFloodlightActive);

  // Mapped camera rotations
  const coneRotations = {
    1: 180,
    2: 225,
    3: 315,
    4: 45,
    5: 135
  };

  // Mapped floodlight rotations
  const floodlightRotations = {
    1: 90,
    2: 170,
    3: 250,
    4: 350,
    5: -25
  };

  const activeScenarioNode = nodes.find(n => n.id === activeScenario.nodeId) || nodes[0];

  return (
    <div className="bg-[#0b0f19] border border-slate-900 rounded-xl p-4 sm:p-5 shadow-lg flex flex-col h-full select-none space-y-3">
      
      {/* Header Info & Live Simulation Controls Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-900 pb-3">
        <div className="text-left">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-100 font-sans uppercase tracking-wider block">
              {t('demoFarmMap')}
            </span>
            <span className="flex items-center gap-1 text-[8px] font-mono font-bold text-green-400 bg-green-500/10 px-1.5 py-0.5 rounded border border-green-500/20">
              <span className="h-1.5 w-1.5 rounded-full bg-green-400 animate-pulse" />
              YOLOv11 LIVE SIMULATOR
            </span>
          </div>
          <p className="text-[10px] text-slate-500 font-mono mt-0.5">
            Real Dataset Stream • {testImagesCount} Benchmark Images • 5 Perimeter Nodes
          </p>
        </div>
        
        {/* Simulation Controls: Play/Pause, Next Event, Auto Mode, Speed */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Play / Pause Button */}
          {setIsPlaying && (
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                isPlaying
                  ? 'bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30'
                  : 'bg-green-500 hover:bg-green-600 text-slate-950 shadow-[0_0_15px_rgba(34,197,94,0.25)]'
              }`}
              title={isPlaying ? 'Pause Simulation' : 'Start Simulation'}
            >
              {isPlaying ? <Pause className="h-3.5 w-3.5 fill-current" /> : <Play className="h-3.5 w-3.5 fill-current" />}
              <span>{isPlaying ? 'Pause' : 'Start Simulation'}</span>
            </button>
          )}

          {/* Next Event Button */}
          {onNextEvent && (
            <button
              onClick={onNextEvent}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-800 transition-all"
              title="Generate Random Dataset Wildlife Intrusion Event"
            >
              <SkipForward className="h-3.5 w-3.5 text-green-400" />
              <span>Next Event</span>
            </button>
          )}

          {/* Auto Simulation Toggle */}
          {setAutoSimulation && (
            <button
              onClick={() => setAutoSimulation(!autoSimulation)}
              className={`px-2 py-1.5 rounded-lg text-[10px] font-mono font-bold border transition-all ${
                autoSimulation
                  ? 'bg-blue-500/10 border-blue-500/30 text-blue-400'
                  : 'bg-slate-900 border-slate-800 text-slate-500'
              }`}
              title="Continuous Autonomous Cycle"
            >
              AUTO: {autoSimulation ? 'ON' : 'OFF'}
            </button>
          )}

          {/* Speed Multiplier */}
          {setSpeed && (
            <div className="flex items-center bg-slate-950 rounded-lg p-0.5 border border-slate-800">
              {[1, 2, 5].map((s) => (
                <button
                  key={s}
                  onClick={() => setSpeed(s)}
                  className={`px-2 py-1 text-[9px] font-mono font-bold rounded transition-all ${
                    speed === s
                      ? 'bg-green-500 text-slate-950'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {s}x
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Map Board container - realistic background image */}
      <div 
        id="tour-map"
        className="relative flex-1 min-h-[460px] bg-slate-950 rounded-xl border border-slate-900 overflow-hidden"
        style={{
          backgroundImage: "url('/farm_map_bg.png')",
          backgroundSize: "cover",
          backgroundPosition: "center"
        }}
      >
        
        {/* Soft dark vignette */}
        <div className="absolute inset-0 bg-slate-950/20 pointer-events-none" />

        {/* Responsive Vector Overlay SVG */}
        <svg 
          className="absolute inset-0 w-full h-full pointer-events-none"
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
        >
          {/* Base Geofence */}
          <motion.polygon
            points="54,9 78,22 74,78 34,78 22,22"
            className="stroke-2 fill-none"
            stroke={isAnyDeterrentActive ? "#ef4444" : "#22c55e"}
            strokeWidth="0.5"
            strokeDasharray="1.5 1"
            animate={isAnyDeterrentActive ? { strokeDashoffset: [0, -10] } : { strokeDashoffset: 0 }}
            transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
          />

          {/* Alarm alert highlighted geofence path */}
          {simulationState >= 2 && simulationState <= 4 && (
            <motion.line
              x1={activeScenarioNode.x}
              y1={activeScenarioNode.y}
              x2={
                activeScenario.nodeId === 1 ? 22 : 
                activeScenario.nodeId === 5 ? 34 : 
                activeScenario.nodeId === 4 ? 74 : 
                activeScenario.nodeId === 3 ? 78 : 54
              }
              y2={
                activeScenario.nodeId === 1 ? 22 : 
                activeScenario.nodeId === 5 ? 78 : 
                activeScenario.nodeId === 4 ? 78 : 
                activeScenario.nodeId === 3 ? 22 : 9
              }
              stroke="#ef4444"
              strokeWidth="0.8"
              fill="none"
              animate={{ opacity: [0.3, 0.9, 0.3] }}
              transition={{ repeat: Infinity, duration: 1.2 }}
            />
          )}

          {/* Active LoRa transmission path rays */}
          {simulationState >= 2 && simulationState <= 4 && (
            <motion.line
              x1={activeScenarioNode.x}
              y1={activeScenarioNode.y}
              x2={centralHub.x}
              y2={centralHub.y}
              stroke="#3b82f6"
              strokeWidth="0.4"
              strokeDasharray="1.5 1"
              animate={{ strokeDashoffset: [0, 5] }}
              transition={{ repeat: Infinity, duration: 0.8, ease: "linear" }}
            />
          )}
        </svg>

        {/* Top-Left Live Animal Telemetry Banner */}
        <div className="absolute top-3 left-3 z-30 flex items-center gap-2 px-3 py-1.5 bg-[#090d16]/95 border border-slate-900 rounded-lg shadow-xl backdrop-blur-md">
          <div className="text-xl select-none">{activeScenario.emoji}</div>
          <div className="text-left font-sans">
            <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-100">
              <span>{activeScenario.code ? `[${activeScenario.code}] ` : ''}{getSpeciesTranslated(activeScenario.species)}</span>
              <span className="text-green-400 font-mono text-[9px]">
                {activeScenario.confidenceBase ? `${activeScenario.confidenceBase}%` : '95%'}
              </span>
            </div>
            <div className="text-[8px] font-mono text-slate-400 flex items-center gap-1">
              <span>{activeScenario.nodeName || `FN-${activeScenario.nodeId}`}</span>
              <span>•</span>
              <span className="text-slate-300">{activeScenario.zone || "North Field"}</span>
            </div>
          </div>
        </div>

        {/* Geofence Breach Banner overlay */}
        {isAnyDeterrentActive && (
          <div className="absolute top-3 left-1/2 transform -translate-x-1/2 bg-red-600 text-slate-950 font-sans text-[8px] font-extrabold px-3 py-1 rounded shadow flex items-center gap-1.5 animate-pulse z-30">
            <ShieldAlert className="h-3 w-3" fill="currentColor" />
            <span>GEOFENCE BREACH DETECTED</span>
          </div>
        )}

        {/* Central AI Hub Node */}
        <div
          style={{ left: `${centralHub.x}%`, top: `${centralHub.y}%` }}
          className="absolute transform -translate-x-1/2 -translate-y-1/2 cursor-pointer z-20 group"
          onClick={() => onSelectNode({ id: 0, name: centralHub.name })}
        >
          <div className="absolute -inset-4 bg-blue-500/10 rounded-full border border-blue-500/20 animate-pulse-slow pointer-events-none" />
          {simulationState >= 2 && simulationState <= 4 && (
            <motion.div
              animate={{ scale: [1, 2.5], opacity: [0.6, 0] }}
              transition={{ repeat: Infinity, duration: 2 }}
              className="absolute -inset-6 border border-blue-500 rounded-full pointer-events-none"
            />
          )}

          <div className="h-9 w-9 rounded-xl bg-[#090d16] border border-blue-500 flex items-center justify-center text-blue-400 shadow-[0_0_15px_rgba(59,130,246,0.25)] transition-all group-hover:scale-105">
            <Radio className="h-5 w-5" />
          </div>
          <div className="absolute -bottom-6 left-1/2 transform -translate-x-1/2 text-[8px] font-mono text-blue-300 font-bold whitespace-nowrap bg-slate-900/90 px-1.5 py-0.5 rounded border border-blue-900 select-none">
            CENTRAL HUB
          </div>
        </div>

        {/* Draw 5 Pentagon Farmer Nodes */}
        {nodes.map((node) => {
          const isTargetNode = node.id === activeScenario.nodeId;
          const isNodeBreached = isTargetNode && simulationState >= 2 && simulationState <= 4;
          const isNodePIRDetected = isTargetNode && simulationState === 1;

          return (
            <div
              key={node.id}
              style={{ left: `${node.x}%`, top: `${node.y}%` }}
              className="absolute transform -translate-x-1/2 -translate-y-1/2 z-25"
            >
              <div 
                onClick={() => onSelectNode(node)}
                className="relative cursor-pointer group flex items-center justify-center"
              >
                {/* Node scanning cones */}
                {isTargetNode && isCameraActive && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: [0.1, 0.25, 0.1], scale: [0.95, 1.05, 0.95] }}
                    transition={{ repeat: Infinity, duration: 2 }}
                    className="absolute w-44 h-44 -left-[76px] -top-[76px] bg-gradient-to-tr from-green-500/20 to-transparent rounded-full pointer-events-none"
                    style={{
                      transformOrigin: 'center center',
                      transform: `rotate(${coneRotations[node.id] || 0}deg)`,
                      clipPath: 'polygon(50% 50%, 0 0, 100% 0)'
                    }}
                  />
                )}

                {/* PIR Field of view */}
                {isTargetNode && isNodePIRDetected && (
                  <motion.div
                    animate={{ opacity: [0.1, 0.4, 0.1] }}
                    transition={{ repeat: Infinity, duration: 1 }}
                    className="absolute w-36 h-36 -left-[56px] -top-[56px] bg-gradient-to-tr from-amber-500/25 to-transparent rounded-full pointer-events-none"
                    style={{
                      transformOrigin: 'center center',
                      transform: `rotate(${coneRotations[node.id] || 0}deg)`,
                      clipPath: 'polygon(50% 50%, 15% 0, 85% 0)'
                    }}
                  />
                )}

                {/* Deterrents active overlays */}
                {isTargetNode && (
                  <>
                    {/* Sprinkler droplets */}
                    {isSprinklerActive && (
                      <div className="absolute -inset-10 pointer-events-none flex items-center justify-center">
                        {[0, 45, 90, 135, 180, 225, 270, 315].map((angle, i) => (
                          <motion.div
                            key={i}
                            initial={{ scale: 0.2, opacity: 1, x: 0, y: 0 }}
                            animate={{ 
                              scale: 0.8, 
                              opacity: 0, 
                              x: Math.cos(angle * Math.PI / 180) * 40, 
                              y: Math.sin(angle * Math.PI / 180) * 40 
                            }}
                            transition={{ repeat: Infinity, duration: 0.8, delay: i * 0.1 }}
                            className="absolute text-blue-400 text-[10px]"
                          >
                            💧
                          </motion.div>
                        ))}
                      </div>
                    )}

                    {/* Predator Sound warning */}
                    {isSpeakerActive && (
                      <div className="absolute -top-7 -right-7 text-xs select-none pointer-events-none animate-bounce bg-slate-900/90 px-1 py-0.5 border border-slate-800 rounded">
                        {t('speakerOn')}
                      </div>
                    )}

                    {/* Siren flash */}
                    {isSirenActive && (
                      <motion.div
                        animate={{ scale: [1, 2.5], opacity: [0.6, 0] }}
                        transition={{ repeat: Infinity, duration: 1 }}
                        className="absolute -inset-8 border border-red-500 rounded-full pointer-events-none"
                      />
                    )}

                    {/* Floodlight Beam */}
                    {isFloodlightActive && (
                      <motion.div
                        initial={{ opacity: 0, scaleX: 0.6 }}
                        animate={{ opacity: [0.3, 0.6, 0.3], scaleX: [0.95, 1.05, 0.95] }}
                        transition={{ repeat: Infinity, duration: 1.2 }}
                        className="absolute w-52 h-44 -left-[200px] top-[10px] bg-gradient-to-l from-amber-400/30 to-transparent rounded-full shadow-[0_0_35px_rgba(245,158,11,0.15)] pointer-events-none"
                        style={{ 
                          transformOrigin: 'right center', 
                          transform: `rotate(${floodlightRotations[node.id] || 0}deg)` 
                        }}
                      />
                    )}
                  </>
                )}

                {/* Node circle */}
                <div className={`absolute -inset-1.5 rounded-full border transition-all duration-300 ${
                  isNodeBreached 
                    ? 'bg-red-500/10 border-red-500/40 animate-ping'
                    : isNodePIRDetected
                      ? 'bg-amber-500/10 border-amber-500/40 animate-ping'
                      : 'bg-slate-950 border-slate-900'
                }`} />

                <div className={`h-7 w-7 rounded-full border flex items-center justify-center transition-all z-10 ${
                  isNodeBreached
                    ? 'bg-red-950 border-red-500 text-red-400 shadow-[0_0_12px_rgba(239,68,68,0.4)]'
                    : isNodePIRDetected
                      ? 'bg-amber-950 border-amber-500 text-amber-400 shadow-[0_0_12px_rgba(245,158,11,0.4)]'
                      : 'bg-[#111827] border-slate-900 text-slate-400 group-hover:border-slate-800'
                }`}>
                  <Camera className={`h-3.5 w-3.5 ${isNodeBreached ? 'animate-pulse' : ''}`} />
                </div>

                <span className="absolute -bottom-5 text-[8px] font-mono text-slate-200 whitespace-nowrap bg-slate-950/90 px-1 py-0.5 rounded border border-slate-900 select-none">
                  FN-0{node.id}
                </span>
              </div>
            </div>
          );
        })}

        {/* Live Animal Animated Marker with Dynamic Vector Trajectory */}
        <AnimatePresence>
          {simulationState > 0 && (
            <motion.div
              key={`${activeScenario.species}-${activeScenario.sourceFile || ''}`}
              initial={{ left: `${activeScenario.path[0].x}%`, top: `${activeScenario.path[0].y}%`, opacity: 0, scale: 0.6 }}
              animate={{
                left: `${currentCoords.x}%`,
                top: `${currentCoords.y}%`,
                opacity: 1,
                scale: 1
              }}
              exit={{ opacity: 0, scale: 0.6 }}
              transition={{
                type: 'spring',
                stiffness: 45,
                damping: 15,
                mass: 1.1
              }}
              className="absolute z-30 pointer-events-auto transform -translate-x-1/2 -translate-y-1/2"
            >
              {/* YOLO Real Bounding Box Tag */}
              {simulationState >= 2 && simulationState <= 4 && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="absolute -inset-4 border-2 border-red-500 rounded-lg pointer-events-none shadow-[0_0_15px_rgba(239,68,68,0.3)]"
                >
                  <div className="absolute top-0 left-0 w-2 h-2 border-t-2 border-l-2 border-red-500 -mt-1 -ml-1" />
                  <div className="absolute top-0 right-0 w-2 h-2 border-t-2 border-r-2 border-red-500 -mt-1 -mr-1" />
                  <div className="absolute bottom-0 left-0 w-2 h-2 border-b-2 border-l-2 border-red-500 -mb-1 -ml-1" />
                  <div className="absolute bottom-0 right-0 w-2 h-2 border-b-2 border-r-2 border-red-500 -mb-1 -mr-1" />
                  
                  {/* Floating Tag */}
                  <div className="absolute -top-7 left-1/2 transform -translate-x-1/2 bg-red-600 text-slate-950 font-mono text-[8px] font-black px-1.5 py-0.5 rounded shadow whitespace-nowrap flex items-center gap-1">
                    <span>{activeScenario.code || activeScenario.species}</span>
                    <span>•</span>
                    <span>{activeScenario.confidenceBase || 95.5}%</span>
                  </div>
                </motion.div>
              )}

              {/* Deterred Status Tag */}
              {simulationState === 4 && (
                <motion.div
                  animate={{ scale: [1, 1.3, 1], opacity: [1, 0.5, 1] }}
                  transition={{ repeat: Infinity, duration: 0.8 }}
                  className="absolute -top-10 left-1/2 transform -translate-x-1/2 text-amber-400 font-bold font-sans text-[9px] flex items-center gap-1 bg-slate-900/95 px-2 py-0.5 rounded border border-amber-500 shadow-xl whitespace-nowrap"
                >
                  <Sparkles className="h-3 w-3 text-amber-400 animate-spin" />
                  <span>DETERRED</span>
                </motion.div>
              )}

              {/* Animal Emoji Icon with rotation */}
              <motion.div 
                animate={{ rotateY: currentCoords.rotate }}
                transition={{ type: 'spring', stiffness: 45, damping: 15 }}
                className="text-4xl select-none filter drop-shadow-[0_6px_12px_rgba(0,0,0,0.6)] flex items-center justify-center cursor-pointer hover:scale-110 transition-transform"
                title={`${activeScenario.species} (${activeScenario.code || ''})`}
              >
                {activeScenario.emoji}
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

      </div>

      {/* Grid footer controls info */}
      <div className="mt-2 flex flex-wrap items-center justify-between text-[10px] text-slate-400 font-mono bg-slate-950/60 p-2.5 rounded-lg border border-slate-900">
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-blue-500 animate-pulse" />
          <span>Mesh RF LoRa Network Active</span>
        </span>
        <span className="text-slate-500">
          Current Stream: <strong className="text-slate-300">{activeScenario.sourceFile || "WS-WL-WB-00006.jpg"}</strong> ({activeScenario.zone || "North Field"})
        </span>
        <span className="text-green-500 font-semibold">Protected Perimeter: 100% Armed</span>
      </div>
    </div>
  );
}
