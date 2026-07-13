import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Camera, Volume2, Lightbulb, ShieldCheck, Compass, 
  HelpCircle, Info, MapPin, AlertCircle, Droplet, Wifi
} from 'lucide-react';

export default function FarmMapTab({ simulationState, currentScenario }) {
  const activeScenario = currentScenario || {
    species: "Elephant",
    emoji: "🐘",
    threat: "HIGH",
    nodeId: 1,
    nodeName: "FN-1",
    confidenceMax: 98.4,
    actuators: { siren: true, floodlight: true, speaker: true, sprinkler: true }
  };

  const isBreachState = simulationState >= 2 && simulationState <= 4;

  // Link scenario nodeId to active CAM & Actuators on the map
  const activeCamId = () => {
    if (activeScenario.nodeId === 1 || activeScenario.nodeId === 5) return 1; // CAM-01
    if (activeScenario.nodeId === 2) return 2; // CAM-02
    if (activeScenario.nodeId === 4) return 3; // CAM-03
    return 4; // CAM-04
  };

  // Actuator checks
  const isSirenActive = isBreachState && activeScenario.actuators.siren;
  const isFloodlightsActive = isBreachState && activeScenario.actuators.floodlight;

  // Sensor node coordinates (green wifi dots along fence matching realistic landmarks)
  const sensorNodes = [
    { id: 1, x: '22%', y: '50%' },
    { id: 2, x: '76%', y: '40%' },
    { id: 3, x: '82%', y: '55%' },
    { id: 4, x: '50%', y: '84%' },
    { id: 5, x: '22%', y: '35%' }
  ];

  // Map animal coordinate translations from pentagon coordinates to top-down grid coordinates
  const getAnimalGridPosition = () => {
    switch (activeScenario.species) {
      case "Elephant": // FN-1 top
        return [
          { x: '54%', y: '-10%' },
          { x: '54%', y: '2%' },
          { x: '54%', y: '11%' },
          { x: '54%', y: '20%' },
          { x: '54%', y: '20%' },
          { x: '54%', y: '-5%' }
        ][simulationState];

      case "Wild Boar": // FN-5 top-left
        return [
          { x: '-5%', y: '12%' },
          { x: '10%', y: '17%' },
          { x: '20%', y: '22%' },
          { x: '32%', y: '28%' },
          { x: '32%', y: '28%' },
          { x: '10%', y: '17%' }
        ][simulationState];

      case "Monkey": // FN-2 top-right
        return [
          { x: '105%', y: '12%' },
          { x: '90%', y: '17%' },
          { x: '80%', y: '22%' },
          { x: '68%', y: '28%' },
          { x: '68%', y: '28%' },
          { x: '92%', y: '17%' }
        ][simulationState];

      case "Deer": // FN-4 bottom-left
        return [
          { x: '18%', y: '105%' },
          { x: '26%', y: '92%' },
          { x: '32%', y: '80%' },
          { x: '42%', y: '68%' },
          { x: '42%', y: '68%' },
          { x: '22%', y: '92%' }
        ][simulationState];

      default:
        return { x: '50%', y: '50%' };
    }
  };

  const animalPos = getAnimalGridPosition() || { x: '50%', y: '50%' };

  return (
    <div className="space-y-6 select-none text-left">
      
      {/* 1. TOP HEADER STATISTICS PANEL */}
      <div className="bg-[#0b0f19] border border-slate-900 rounded-xl p-4 flex flex-col md:flex-row items-center justify-between gap-4 shadow-md">
        <div className="flex items-center gap-3">
          <div className="h-8.5 w-8.5 rounded-lg bg-green-500/10 border border-green-500/20 text-green-500 flex items-center justify-center">
            <Compass className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-sm font-extrabold text-slate-100 font-sans tracking-wide uppercase leading-none">
              Digital Farm Map
            </h2>
            <p className="text-[10px] text-slate-500 font-mono mt-1">Topographical spatial grid representing sensor coverages</p>
          </div>
        </div>

        {/* Live stats */}
        <div className="flex items-center gap-6 text-[10px] font-mono">
          <div className="flex items-center gap-1.5">
            <Camera className="h-3.5 w-3.5 text-slate-500" />
            <span className="text-slate-400">Cameras:</span>
            <span className="text-green-500 font-bold">4 Online</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Wifi className="h-3.5 w-3.5 text-slate-500" />
            <span className="text-slate-400">Sensors:</span>
            <span className="text-green-500 font-bold">12 Active</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Volume2 className="h-3.5 w-3.5 text-slate-500" />
            <span className="text-slate-400">Siren:</span>
            <span className={isSirenActive ? "text-red-500 font-bold animate-pulse" : "text-slate-500"}>
              {isSirenActive ? "1 Active" : "Standby"}
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <Lightbulb className="h-3.5 w-3.5 text-slate-500" />
            <span className="text-slate-400">Flood Lights:</span>
            <span className={isFloodlightsActive ? "text-amber-500 font-bold animate-pulse" : "text-slate-500"}>
              {isFloodlightsActive ? "2 Active" : "Standby"}
            </span>
          </div>
          <div className="flex items-center gap-2 px-2.5 py-1 bg-green-500/10 text-green-500 rounded border border-green-500/20 font-bold">
            <span className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />
            <span>Health: 98%</span>
          </div>
        </div>
      </div>

      {/* 2. THE MAP VIEWPORT BOARD */}
      <div 
        className="relative aspect-[16/10] w-full bg-[#0a130f]/60 rounded-2xl border border-slate-900 overflow-hidden shadow-2xl"
        style={{
          backgroundImage: "url('/farm_map_bg.png')",
          backgroundSize: "cover",
          backgroundPosition: "center"
        }}
      >
        
        {/* Soft overlay */}
        <div className="absolute inset-0 bg-slate-950/20 pointer-events-none" />

        {/* Fences and pathways structure */}
        <svg 
          className="absolute inset-0 w-full h-full pointer-events-none"
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
        >
          {/* Pentagon Fence line */}
          <polygon
            points="54,9 78,22 74,78 34,78 22,22"
            fill="none"
            stroke={isBreachState ? "#ef4444" : "#22c55e"}
            strokeWidth="0.4"
            strokeDasharray="1.5 1"
          />
        </svg>

        {/* CAMERA OVERLAYS & SCAN CONES */}
        {/* CAM-01 (Top-Left, coordinates 22, 22) */}
        <div className="absolute top-[22%] left-[22%] transform -translate-x-1/2 -translate-y-1/2 z-20">
          <div className={`h-7 w-7 rounded-lg border flex items-center justify-center transition-all ${
            isBreachState && activeCamId() === 1
              ? 'bg-red-950 border-red-500 text-red-400 shadow-[0_0_12px_rgba(239,68,68,0.4)] animate-pulse'
              : 'bg-[#090d16]/90 border-slate-900 text-slate-400'
          }`}>
            <Camera className="h-4 w-4" />
          </div>
          <span className="absolute -bottom-4 left-1/2 transform -translate-x-1/2 text-[6px] font-mono text-slate-200">CAM-01</span>
          
          {/* Scan Cone */}
          {activeCamId() === 1 && isBreachState && (
            <div className="absolute w-36 h-36 top-[10px] left-[10px] bg-gradient-to-br from-red-500/15 to-transparent pointer-events-none rounded-br-full"
                 style={{ clipPath: 'polygon(0 0, 100% 40%, 40% 100%)' }} />
          )}
        </div>

        {/* CAM-02 (Top-Right, coordinates 78, 22) */}
        <div className="absolute top-[22%] left-[78%] transform -translate-x-1/2 -translate-y-1/2 z-20">
          <div className={`h-7 w-7 rounded-lg border flex items-center justify-center transition-all ${
            isBreachState && activeCamId() === 2
              ? 'bg-red-950 border-red-500 text-red-400 shadow-[0_0_12px_rgba(239,68,68,0.4)] animate-pulse'
              : 'bg-[#090d16]/90 border-slate-900 text-slate-400'
          }`}>
            <Camera className="h-4 w-4" />
          </div>
          <span className="absolute -bottom-4 left-1/2 transform -translate-x-1/2 text-[6px] font-mono text-slate-200">CAM-02</span>
          
          {/* Scan Cone */}
          {activeCamId() === 2 && isBreachState && (
            <div className="absolute w-36 h-36 top-[10px] right-[10px] bg-gradient-to-bl from-red-500/15 to-transparent pointer-events-none rounded-bl-full"
                 style={{ clipPath: 'polygon(100% 0, 0 40%, 60% 100%)' }} />
          )}
        </div>

        {/* CAM-03 (Bottom-Left, coordinates 34, 78) */}
        <div className="absolute bottom-[22%] left-[34%] transform -translate-x-1/2 translate-y-1/2 z-20">
          <div className={`h-7 w-7 rounded-lg border flex items-center justify-center transition-all ${
            isBreachState && activeCamId() === 3
              ? 'bg-red-950 border-red-500 text-red-400 shadow-[0_0_12px_rgba(239,68,68,0.4)] animate-pulse'
              : 'bg-[#090d16]/90 border-slate-900 text-slate-400'
          }`}>
            <Camera className="h-4 w-4" />
          </div>
          <span className="absolute -bottom-4 left-1/2 transform -translate-x-1/2 text-[6px] font-mono text-slate-200">CAM-03</span>
          
          {/* Scan Cone */}
          {activeCamId() === 3 && isBreachState && (
            <div className="absolute w-36 h-36 bottom-[10px] left-[10px] bg-gradient-to-tr from-red-500/15 to-transparent pointer-events-none rounded-tr-full"
                 style={{ clipPath: 'polygon(0 100%, 100% 60%, 40% 0)' }} />
          )}
        </div>

        {/* CAM-04 (Bottom-Right, coordinates 74, 78) */}
        <div className="absolute bottom-[22%] left-[74%] transform -translate-x-1/2 translate-y-1/2 z-20">
          <div className={`h-7 w-7 rounded-lg border flex items-center justify-center transition-all ${
            isBreachState && activeCamId() === 4
              ? 'bg-red-950 border-red-500 text-red-400 shadow-[0_0_12px_rgba(239,68,68,0.4)] animate-pulse'
              : 'bg-[#090d16]/90 border-slate-900 text-slate-400'
          }`}>
            <Camera className="h-4 w-4" />
          </div>
          <span className="absolute -bottom-4 left-1/2 transform -translate-x-1/2 text-[6px] font-mono text-slate-200">CAM-04</span>
          
          {/* Scan Cone */}
          {activeCamId() === 4 && isBreachState && (
            <div className="absolute w-36 h-36 bottom-[10px] right-[10px] bg-gradient-to-tl from-red-500/15 to-transparent pointer-events-none rounded-tl-full"
                 style={{ clipPath: 'polygon(100% 100%, 0 60%, 60% 0)' }} />
          )}
        </div>

        {/* FLOOD LIGHTS & SIRENS OVERLAYS */}
        {/* FL-01 (Top-Center, coordinates 54, 9) */}
        <div className="absolute top-[9%] left-[54%] transform -translate-x-1/2 -translate-y-1/2 z-20">
          <div className={`h-5 w-5 rounded-full border flex items-center justify-center ${
            isFloodlightsActive ? 'bg-amber-500/25 border-amber-500 text-amber-400' : 'bg-slate-950 border-slate-900 text-slate-600'
          }`}>
            <Lightbulb className="h-3 w-3" />
          </div>
          {isFloodlightsActive && (
            <div className="absolute top-[18px] left-[50%] transform -translate-x-1/2 w-16 h-28 bg-gradient-to-b from-amber-400/20 to-transparent pointer-events-none"
                 style={{ clipPath: 'polygon(50% 0, 0 100%, 100% 100%)' }} />
          )}
        </div>

        {/* SIREN-01 (Center-Right, next to Orin Nano 52, 44) */}
        <div className="absolute top-[44%] left-[60%] transform -translate-y-1/2 z-20">
          <div className={`h-6 w-6 rounded-lg border flex items-center justify-center ${
            isSirenActive ? 'bg-red-500/20 border-red-500 text-red-400 animate-bounce' : 'bg-slate-950 border-slate-900 text-slate-600'
          }`}>
            <Volume2 className="h-3.5 w-3.5" />
          </div>
          {isSirenActive && (
            <motion.div
              animate={{ scale: [1, 2], opacity: [0.6, 0] }}
              transition={{ repeat: Infinity, duration: 1 }}
              className="absolute -inset-4 border border-red-500 rounded-full pointer-events-none"
            />
          )}
        </div>

        {/* Sensor Node dots */}
        {sensorNodes.map((node) => (
          <div
            key={node.id}
            style={{ left: node.x, top: node.y }}
            className="absolute transform -translate-x-1/2 -translate-y-1/2 z-15"
          >
            <div className="h-4.5 w-4.5 rounded-full bg-green-500/10 border border-green-500/40 flex items-center justify-center text-green-500 shadow">
              <span className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />
            </div>
          </div>
        ))}

        {/* ANIMAL PATH OVERLAY */}
        <AnimatePresence>
          {simulationState > 0 && (
            <motion.div
              key={activeScenario.species}
              initial={{ x: activeScenario.path[0].x, y: activeScenario.path[0].y, opacity: 0 }}
              animate={{
                x: animalPos.x,
                y: animalPos.y,
                opacity: 1
              }}
              exit={{ opacity: 0 }}
              transition={{ type: 'spring', stiffness: 35, damping: 12 }}
              className="absolute z-35 -translate-x-1/2 -translate-y-1/2"
            >
              {isBreachState && (
                <div className="absolute -inset-3.5 border border-red-500 rounded-md">
                  <div className="absolute -top-4 left-0 bg-red-500 text-slate-950 font-mono text-[6px] font-bold px-0.5 rounded whitespace-nowrap">
                    {activeScenario.species.toUpperCase()}
                  </div>
                </div>
              )}
              <div className="text-3xl filter drop-shadow-[0_4px_6px_rgba(0,0,0,0.5)]">
                {activeScenario.emoji}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* 3. LEGEND OVERLAY PANEL (Bottom-Left) */}
        <div className="absolute bottom-3 left-3 bg-[#090d16]/90 border border-slate-900 rounded-xl p-3 w-40 space-y-1.5 text-[8px] font-mono text-slate-400 shadow-lg">
          <span className="text-[9px] font-bold text-slate-100 uppercase tracking-wider block border-b border-slate-900 pb-1 mb-1">LEGEND</span>
          <div className="flex items-center gap-1.5">
            <span className="h-4 w-4 bg-slate-950 border border-slate-900 rounded flex items-center justify-center text-slate-300"><Camera className="h-2.5 w-2.5" /></span>
            <span>Camera</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-4 w-4 bg-green-500/10 border border-green-500/20 rounded-full flex items-center justify-center text-green-500"><span className="h-1 w-1 bg-green-500 rounded-full" /></span>
            <span>Sensor Node</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-4 w-4 bg-red-500/10 border border-red-500/20 rounded flex items-center justify-center text-red-400"><Volume2 className="h-2.5 w-2.5" /></span>
            <span>Siren Alarm</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-4 w-4 bg-amber-500/10 border border-amber-500/20 rounded flex items-center justify-center text-amber-400"><Lightbulb className="h-2.5 w-2.5" /></span>
            <span>Flood Light</span>
          </div>
        </div>

        {/* 4. FARM INFORMATION OVERLAY PANEL (Bottom-Right) */}
        <div className="absolute bottom-3 right-3 bg-[#090d16]/90 border border-slate-900 rounded-xl p-3.5 w-48 space-y-2 text-[8px] font-mono text-slate-400 shadow-lg">
          <span className="text-[9px] font-bold text-slate-100 uppercase tracking-wider block border-b border-slate-900 pb-1 mb-1">FARM INFORMATION</span>
          <div className="space-y-1">
            <div className="flex justify-between"><span className="text-slate-500">Farm ID:</span><span className="text-slate-200">WF-001</span></div>
            <div className="flex justify-between"><span className="text-slate-500">Location:</span><span className="text-slate-200">Demo Village</span></div>
            <div className="flex justify-between"><span className="text-slate-500">Area:</span><span className="text-slate-200">25 Acres</span></div>
            <div className="flex justify-between"><span className="text-slate-500">Crops:</span><span className="text-slate-200 font-sans">Maize, Wheat</span></div>
            <div className="flex justify-between"><span className="text-slate-500">Soil Type:</span><span className="text-slate-200">Loamy</span></div>
            <div className="flex justify-between border-t border-slate-900 pt-1 mt-1 font-bold">
              <span className="text-slate-500">Status:</span>
              <span className="text-green-500">ACTIVE</span>
            </div>
          </div>
          
          <div className="flex justify-center border-t border-slate-900 pt-2 mt-1">
            <div className="flex items-center gap-1.5 bg-slate-950 px-2 py-0.5 rounded border border-slate-900 text-slate-500">
              <Compass className="h-3 w-3 text-slate-400" />
              <span>N</span>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
}
