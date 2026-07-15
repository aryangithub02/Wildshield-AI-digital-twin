import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Camera, Volume2, Lightbulb, ShieldAlert, Sparkles, Radio, HelpCircle, Navigation, Plus, Minus, Layers, Settings } from 'lucide-react';
import { getTranslation } from '../utils/translations';

export default function DigitalTwin({ simulationState, onSelectNode, currentScenario, language }) {
  const t = (key) => getTranslation(language, key);

  const getSpeciesTranslated = (speciesName) => {
    if (speciesName === "Elephant") return t('elephant');
    if (speciesName === "Wild Boar") return t('wildBoar');
    if (speciesName === "Monkey") return t('monkey');
    if (speciesName === "Deer") return t('deer');
    return speciesName;
  };

  const nodes = [
    { id: 1, name: 'Farmer Node 01 (FN-1)', x: 54, y: 9, type: 'node' },
    { id: 2, name: 'Farmer Node 02 (FN-2)', x: 78, y: 22, type: 'node' },
    { id: 3, name: 'Farmer Node 03 (FN-3)', x: 74, y: 78, type: 'node' },
    { id: 4, name: 'Farmer Node 04 (FN-4)', x: 34, y: 78, type: 'node' },
    { id: 5, name: 'Farmer Node 05 (FN-5)', x: 22, y: 22, type: 'node' },
  ];

  const centralHub = { name: 'Central AI Hub (Jetson Orin Nano)', x: 52, y: 44 };

  const activeScenario = currentScenario || {
    species: "Elephant",
    emoji: "🐘",
    threat: "HIGH",
    nodeId: 1,
    nodeName: "FN-1",
    confidenceBase: 96.2,
    confidenceMax: 98.4,
    actuators: { siren: true, floodlight: true, speaker: true, sprinkler: true },
    path: [
      { x: 54, y: -10, rotate: 0 },
      { x: 54, y: 2, rotate: 0 },
      { x: 54, y: 11, rotate: 0 },
      { x: 54, y: 20, rotate: 0 },
      { x: 54, y: 20, rotate: 180 },
      { x: 54, y: -5, rotate: 180 }
    ]
  };

  const currentCoords = activeScenario.path[simulationState] || activeScenario.path[0];

  const isCameraActive = simulationState >= 2 && simulationState <= 4;
  const isSprinklerActive = (simulationState === 3 || simulationState === 4) && activeScenario.actuators.sprinkler;
  const isSpeakerActive = (simulationState === 3 || simulationState === 4) && activeScenario.actuators.speaker;
  const isSirenActive = simulationState === 4 && activeScenario.actuators.siren;
  const isFloodlightActive = simulationState === 4 && activeScenario.actuators.floodlight;
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

  const activeScenarioNode = nodes.find(n => n.id === activeScenario.nodeId) || nodes[4];

  return (
    <div className="bg-[#0b0f19] border border-slate-900 rounded-xl p-5 shadow-lg flex flex-col h-full select-none">
      
      {/* Header Info */}
      <div className="flex items-center justify-between mb-4 border-b border-slate-900 pb-2">
        <div className="text-left">
          <span className="text-xs font-bold text-slate-100 font-sans uppercase tracking-wider block">{t('demoFarmMap')}</span>
          <p className="text-[10px] text-slate-500 font-mono mt-0.5">{t('pentagonPerimeter')}</p>
        </div>
        
        <div className="flex items-center gap-1.5 text-[9px] font-semibold text-green-500 bg-green-500/10 px-2 py-1 rounded border border-green-500/20">
          <HelpCircle className="h-3 w-3" />
          <span>{t('clickNodesTip')}</span>
        </div>
      </div>

      {/* Map Board container - realistic background image */}
      <div 
        id="tour-map"
        className="relative flex-1 min-h-[440px] bg-slate-950 rounded-xl border border-slate-900 overflow-hidden"
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

        {/* Top-Left Dropdown Map Selector */}
        <div className="absolute top-3 left-3 z-30 flex items-center gap-1.5 px-2.5 py-1.5 bg-[#090d16]/90 border border-slate-900 rounded-lg text-[10px] font-bold font-sans text-slate-100 cursor-pointer select-none">
          <span>{t('demoFarmMap')}</span>
          <span className="text-slate-500 text-[6px]">▼</span>
        </div>

        {/* Left Toolbar overlay buttons */}
        <div className="absolute top-14 left-3 z-30 flex flex-col gap-1.5 bg-[#090d16]/90 border border-slate-900 rounded-lg p-1 select-none">
          <button className="h-6 w-6 rounded bg-green-500 text-slate-950 flex items-center justify-center shadow-md">
            <Navigation className="h-3.5 w-3.5 transform rotate-45" />
          </button>
          <button className="h-6 w-6 rounded bg-slate-950/40 text-slate-400 hover:text-slate-200 flex items-center justify-center">
            <Plus className="h-3.5 w-3.5" />
          </button>
          <button className="h-6 w-6 rounded bg-slate-950/40 text-slate-400 hover:text-slate-200 flex items-center justify-center">
            <Minus className="h-3.5 w-3.5" />
          </button>
          <button className="h-6 w-6 rounded bg-slate-950/40 text-slate-400 hover:text-slate-200 flex items-center justify-center">
            <Layers className="h-3.5 w-3.5" />
          </button>
        </div>

        {/* Bottom-Right map options 2D/Settings buttons */}
        <div className="absolute bottom-3 right-3 z-30 flex items-center gap-2 select-none">
          <button className="px-2.5 py-1.5 bg-[#090d16]/90 border border-slate-900 rounded-lg text-[9px] font-bold text-slate-200 font-mono tracking-wider shadow">
            2D
          </button>
          <button className="p-1.5 bg-[#090d16]/90 border border-slate-900 rounded-lg text-slate-400 hover:text-slate-200 shadow">
            <Settings className="h-3.5 w-3.5" />
          </button>
        </div>

        {/* Geofence Breach Banner overlay */}
        {isAnyDeterrentActive && (
          <div className="absolute top-3 left-1/2 transform -translate-x-1/2 bg-red-600 text-slate-950 font-sans text-[8px] font-extrabold px-2.5 py-1 rounded shadow flex items-center gap-1">
            <ShieldAlert className="h-3 w-3 animate-ping" fill="currentColor" />
            <span>{t('geofenceBreach')}</span>
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
                      <>
                        <motion.div
                          animate={{ scale: [1, 2.5], opacity: [0.6, 0] }}
                          transition={{ repeat: Infinity, duration: 1 }}
                          className="absolute -inset-8 border border-red-500 rounded-full pointer-events-none"
                        />
                      </>
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

                {/* Node node circle */}
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

        {/* 6. Animal pathing */}
        <AnimatePresence>
          {simulationState > 0 && (
            <motion.div
              key={activeScenario.species}
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
                stiffness: 40,
                damping: 14,
                mass: 1.2
              }}
              className="absolute z-30 pointer-events-auto"
              style={{ originX: 0.5, originY: 0.5 }}
            >
              {/* YOLO bounding box on detection */}
              {simulationState >= 2 && simulationState <= 4 && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="absolute -inset-3.5 border-2 border-red-500 rounded-lg"
                >
                  <div className="absolute top-0 left-0 w-2 h-2 border-t-2 border-l-2 border-red-500 -mt-1 -ml-1" />
                  <div className="absolute top-0 right-0 w-2 h-2 border-t-2 border-r-2 border-red-500 -mt-1 -mr-1" />
                  <div className="absolute bottom-0 left-0 w-2 h-2 border-b-2 border-l-2 border-red-500 -mb-1 -ml-1" />
                  <div className="absolute bottom-0 right-0 w-2 h-2 border-b-2 border-r-2 border-red-500 -mb-1 -mr-1" />
                  <div className="absolute -top-6 left-0 bg-red-500 text-slate-950 font-mono text-[8px] font-extrabold px-1 rounded shadow whitespace-nowrap">
                    {getSpeciesTranslated(activeScenario.species).toUpperCase()}: {simulationState === 2 ? `${activeScenario.confidenceBase}%` : `${activeScenario.confidenceMax}%`}
                  </div>
                </motion.div>
              )}

              {/* Startle tag */}
              {simulationState === 4 && (
                <motion.div
                  animate={{ scale: [1, 1.4, 1], opacity: [1, 0.4, 1] }}
                  transition={{ repeat: Infinity, duration: 0.8 }}
                  className="absolute -top-9 left-1/2 transform -translate-x-1/2 text-amber-400 font-bold font-sans text-xs flex items-center gap-0.5 bg-slate-900/90 px-1 py-0.5 rounded border border-amber-500 shadow-xl whitespace-nowrap"
                >
                  <Sparkles className="h-3 w-3 text-amber-400 animate-spin" />
                  <span>DETERRED</span>
                </motion.div>
              )}

              <motion.div 
                animate={{ rotateY: currentCoords.rotate }}
                transition={{ type: 'spring', stiffness: 40, damping: 14 }}
                className="relative text-4xl select-none filter drop-shadow-[0_4px_8px_rgba(0,0,0,0.5)] flex items-center justify-center"
              >
                {activeScenario.emoji}
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

      </div>

      {/* Grid footer controls info */}
      <div className="mt-3 flex flex-wrap items-center justify-between text-xs text-slate-400 font-mono bg-slate-950/40 p-2.5 rounded-lg border border-slate-900">
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-blue-500 animate-pulse" />
          <span>{t('rfNetworkActive')}</span>
        </span>
        <span className="hidden sm:inline">{t('protectedGeofence')}</span>
      </div>
    </div>
  );
}
