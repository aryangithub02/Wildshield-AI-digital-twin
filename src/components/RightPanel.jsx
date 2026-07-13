import React from 'react';
import { ShieldAlert, AlertTriangle, Radio, Wifi, CheckCircle2 } from 'lucide-react';

export default function RightPanel({ simulationState, currentScenario }) {
  const activeScenario = currentScenario || {
    species: "Elephant",
    emoji: "🐘",
    threat: "HIGH",
    nodeId: 1,
    nodeName: "FN-1",
    confidenceMax: 98.4,
  };

  // 1. Mock Active Alerts List (Dynamic)
  const alertsList = [
    {
      id: 1,
      title: `${activeScenario.species} Detected`,
      location: `Zone FN-0${activeScenario.nodeId}`,
      time: "10:23 AM",
      threat: activeScenario.threat,
      active: simulationState >= 2 && simulationState <= 4
    },
    {
      id: 2,
      title: "Movement Detected",
      location: "FN-5 Forest Edge",
      time: "10:18 AM",
      threat: "MEDIUM",
      active: false
    },
    {
      id: 3,
      title: "Fence Vibration",
      location: "FN-3 South Boundary",
      time: "09:52 AM",
      threat: "LOW",
      active: false
    }
  ];

  // 2. Mock Device Status List
  const devices = [
    { name: "CAM-01 (North)", status: "Online" },
    { name: "CAM-02 (East)", status: "Online" },
    { name: "CAM-03 (South)", status: "Online" },
    { name: "CAM-04 (West)", status: "Online" },
    { name: "Sensor-01 (Temp)", status: "Online" },
    { name: "Sensor-02 (Motion)", status: "Online" },
    { name: "Speaker-01", status: "Online" }
  ];

  // Determine Current Detection Visual / Metadata
  const isTargetDetected = simulationState >= 2 && simulationState <= 4;

  // Visual representation of animals (thermal styled boxes)
  const thermalAvatars = {
    "Elephant": "https://images.unsplash.com/photo-1557050543-4b5f4e07ea49?q=80&w=200&auto=format&fit=crop",
    "Wild Boar": "https://images.unsplash.com/photo-1590422941838-89c565d6c291?q=80&w=200&auto=format&fit=crop",
    "Monkey": "https://images.unsplash.com/photo-1540573133985-87b6da6d54a9?q=80&w=200&auto=format&fit=crop",
    "Deer": "https://images.unsplash.com/photo-1484406566174-9da000fda645?q=80&w=200&auto=format&fit=crop"
  };

  return (
    <aside className="w-80 bg-[#090d16] border-l border-slate-900 flex flex-col h-[calc(100vh-4rem)] fixed top-16 right-0 z-30 p-4 space-y-6 overflow-y-auto select-none">
      
      {/* 1. ACTIVE ALERTS PANEL */}
      <div className="space-y-3">
        <div className="flex items-center justify-between text-xs border-b border-slate-900 pb-2">
          <span className="font-bold text-slate-100 font-sans uppercase tracking-wider">Active Alerts</span>
          <span className="text-[10px] text-slate-400 cursor-pointer hover:text-slate-200">View All</span>
        </div>
        
        <div className="space-y-2">
          {alertsList.map((alert) => (
            <div
              key={alert.id}
              className={`p-3 rounded-lg border flex items-center justify-between gap-3 transition-all ${
                alert.active
                  ? alert.threat === 'HIGH'
                    ? 'bg-red-500/10 border-red-500/30'
                    : 'bg-amber-500/10 border-amber-500/30'
                  : 'bg-[#111827]/40 border-slate-900/60'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <div className={`h-8 w-8 rounded-lg flex items-center justify-center border ${
                  alert.active
                    ? alert.threat === 'HIGH'
                      ? 'bg-red-500/20 border-red-500/30 text-red-500'
                      : 'bg-amber-500/20 border-amber-500/30 text-amber-500'
                    : 'bg-slate-950/40 border-slate-900 text-slate-500'
                }`}>
                  {alert.threat === 'HIGH' ? <ShieldAlert className="h-4.5 w-4.5" /> : <AlertTriangle className="h-4.5 w-4.5" />}
                </div>
                <div className="text-left leading-tight">
                  <p className={`text-[10px] font-bold ${alert.active ? 'text-slate-100 font-extrabold' : 'text-slate-300'}`}>{alert.title}</p>
                  <p className="text-[8px] font-mono text-slate-500">{alert.location}</p>
                </div>
              </div>

              <div className="text-right space-y-1">
                <p className="text-[8px] font-mono text-slate-500">{alert.time}</p>
                <span className={`inline-flex px-1 py-0.2 rounded text-[7px] font-extrabold uppercase border ${
                  alert.active
                    ? alert.threat === 'HIGH'
                      ? 'bg-red-500/25 border-red-500/40 text-red-400'
                      : 'bg-amber-500/25 border-amber-500/40 text-amber-400'
                    : alert.threat === 'HIGH'
                      ? 'bg-slate-950 border-slate-900 text-slate-500'
                      : 'bg-slate-950 border-slate-900 text-slate-500'
                }`}>
                  {alert.threat}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 2. CURRENT DETECTION PANEL */}
      <div className="space-y-3">
        <div className="flex items-center justify-between text-xs border-b border-slate-900 pb-2">
          <span className="font-bold text-slate-100 font-sans uppercase tracking-wider">Current Detection</span>
        </div>

        <div className="bg-[#111827]/40 border border-slate-900/60 rounded-xl p-3.5 space-y-3">
          {/* Thermal Viewport Image */}
          <div className="relative aspect-[4/3] w-full bg-slate-950 rounded-lg border border-slate-900 overflow-hidden flex items-center justify-center crt-overlay">
            {isTargetDetected ? (
              <>
                <img
                  src={thermalAvatars[activeScenario.species]}
                  alt={activeScenario.species}
                  className="w-full h-full object-cover filter brightness-[0.75] contrast-[1.1] hue-rotate-[15deg]"
                />
                {/* Thermal filter mask */}
                <div className="absolute inset-0 bg-gradient-to-t from-red-500/10 via-transparent to-blue-500/5 mix-blend-color-burn" />
                <div className="absolute top-2 right-2 flex items-center gap-1 bg-red-600 text-white font-mono text-[7px] px-1 py-0.5 rounded shadow animate-pulse">
                  <Radio className="h-2 w-2 animate-ping" />
                  <span>LIVE</span>
                </div>
              </>
            ) : (
              <div className="text-center space-y-1 text-slate-600 p-4 select-none">
                <div className="text-2xl animate-pulse">📡</div>
                <p className="text-[8px] font-mono uppercase tracking-widest">Scanning Grid...</p>
              </div>
            )}
            
            {/* Visual corner indicators */}
            <div className="absolute top-1.5 left-1.5 w-2 h-2 border-t border-l border-white/20" />
            <div className="absolute top-1.5 right-1.5 w-2 h-2 border-t border-r border-white/20" />
            <div className="absolute bottom-1.5 left-1.5 w-2 h-2 border-b border-l border-white/20" />
            <div className="absolute bottom-1.5 right-1.5 w-2 h-2 border-b border-r border-white/20" />
          </div>

          {/* Details Table */}
          {isTargetDetected ? (
            <div className="space-y-1.5 text-[10px] font-mono border-t border-slate-900 pt-2">
              <div className="flex justify-between">
                <span className="text-slate-400">Target:</span>
                <span className="text-slate-100 font-bold font-sans">{activeScenario.species}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Confidence:</span>
                <span className="text-green-500 font-bold">{activeScenario.confidenceMax}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Threat Level:</span>
                <span className={`font-bold ${
                  activeScenario.threat === 'HIGH' ? 'text-red-500' : 'text-amber-500'
                }`}>{activeScenario.threat}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Location:</span>
                <span className="text-slate-200">Zone FN-0{activeScenario.nodeId}</span>
              </div>
              <div className="flex justify-between border-t border-slate-900/60 pt-1 text-[8px] text-slate-500">
                <span>Detected:</span>
                <span>10:23:15 AM</span>
              </div>
            </div>
          ) : (
            <div className="text-center py-2 text-[10px] font-mono text-slate-500 italic border-t border-slate-900 pt-2">
              No active target detected.
            </div>
          )}
        </div>
      </div>

      {/* 3. DEVICE STATUS PANEL */}
      <div className="space-y-3">
        <div className="flex items-center justify-between text-xs border-b border-slate-900 pb-2">
          <span className="font-bold text-slate-100 font-sans uppercase tracking-wider">Device Status</span>
          <span className="text-[10px] text-slate-400 cursor-pointer hover:text-slate-200">View All</span>
        </div>
        
        <div className="space-y-1.5">
          {devices.map((device, index) => (
            <div
              key={index}
              className="bg-[#111827]/30 border border-slate-900/40 rounded-lg px-3 py-2 flex items-center justify-between gap-3"
            >
              <div className="flex items-center gap-2">
                <Wifi className="h-3.5 w-3.5 text-slate-500" />
                <span className="text-[10px] font-sans font-semibold text-slate-300">{device.name}</span>
              </div>
              
              <div className="flex items-center gap-1">
                <CheckCircle2 className="h-3 w-3 text-green-500" />
                <span className="text-[9px] font-mono font-bold text-green-500 uppercase">{device.status}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

    </aside>
  );
}
