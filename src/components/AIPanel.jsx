import React, { useState, useEffect } from 'react';
import { Video, ShieldAlert, Cpu, CheckCircle } from 'lucide-react';

export default function AIPanel({ simulationState, currentScenario }) {
  // Safe fallback for current scenario
  const activeScenario = currentScenario || {
    species: "Elephant",
    emoji: "🐘",
    threat: "HIGH",
    confidenceBase: 96.2,
    confidenceMax: 98.4,
    actuators: { siren: true, floodlight: true, speaker: true, sprinkler: true }
  };

  // Mock confidence rating fluctuation
  const [confidence, setConfidence] = useState(0);

  useEffect(() => {
    if (simulationState === 2) {
      // Start detection: rapid increase in confidence
      setConfidence(activeScenario.confidenceBase);
      const interval = setInterval(() => {
        setConfidence(prev => {
          if (prev < activeScenario.confidenceMax) return parseFloat((prev + 0.2).toFixed(1));
          return prev;
        });
      }, 80);
      return () => clearInterval(interval);
    } else if (simulationState >= 3 && simulationState <= 4) {
      setConfidence(activeScenario.confidenceMax);
    } else {
      setConfidence(0);
    }
  }, [simulationState, activeScenario]);

  // Determine panel status details based on state
  const getPanelData = () => {
    switch (simulationState) {
      case 0: // Idle
        return {
          camera: "FN-01",
          status: "MONITORING",
          species: "None",
          threat: "NORMAL",
          color: "text-slate-400 border-slate-800",
          iconColor: "text-green-500",
          feedContent: "NO_INTRUSION"
        };
      case 1: // Enters Forest
        return {
          camera: activeScenario.nodeName,
          status: "MOTION_ALERT",
          species: "Calculating...",
          threat: activeScenario.threat === 'HIGH' ? 'MEDIUM' : 'LOW',
          color: "text-amber-500 border-amber-500/20",
          iconColor: "text-amber-500 animate-pulse",
          feedContent: "APPROACHING"
        };
      case 2: // Detected
        return {
          camera: activeScenario.nodeName,
          status: "IDENTIFYING",
          species: activeScenario.species,
          threat: activeScenario.threat === 'HIGH' ? 'MEDIUM' : 'LOW',
          color: "text-amber-500 border-amber-500/30",
          iconColor: "text-amber-500 animate-pulse-fast",
          feedContent: "DETECTED"
        };
      case 3: // Escalated
      case 4: // Deterrent Active
        return {
          camera: activeScenario.nodeName,
          status: "TARGET_CONFIRMED",
          species: activeScenario.species,
          threat: activeScenario.threat,
          color: activeScenario.threat === 'HIGH' 
            ? "text-red-500 border-red-500/30 bg-red-950/10" 
            : "text-amber-500 border-amber-500/30 bg-amber-950/10",
          iconColor: activeScenario.threat === 'HIGH' ? "text-red-500 animate-ping" : "text-amber-500 animate-pulse",
          feedContent: "BREACH_ACTIVE"
        };
      case 5: // Resolved
        return {
          camera: activeScenario.nodeName,
          status: "RESOLVED",
          species: "None",
          threat: "NORMAL",
          color: "text-green-500 border-green-500/20",
          iconColor: "text-green-500",
          feedContent: "RETREATING"
        };
      default:
        return {
          camera: "FN-01",
          status: "MONITORING",
          species: "None",
          threat: "NORMAL",
          color: "text-slate-400 border-slate-800",
          iconColor: "text-green-500",
          feedContent: "NO_INTRUSION"
        };
    }
  };

  const data = getPanelData();

  return (
    <div className="glass-panel rounded-card p-6 border-slate-800 flex flex-col h-full shadow-[0_8px_32px_rgba(0,0,0,0.4)]">
      {/* Panel Header */}
      <div className="flex items-center justify-between mb-4 border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <Cpu className="h-5 w-5 text-green-500" />
          <h2 className="text-lg font-bold text-slate-100">AI Edge Analytics</h2>
        </div>
        <div className={`px-2 py-0.5 rounded text-[10px] font-mono border font-bold ${
          simulationState >= 3 && simulationState <= 4 && activeScenario.threat === 'HIGH'
            ? 'bg-red-500/10 text-red-500 border-red-500/20' 
            : 'bg-green-500/10 text-green-500 border-green-500/20'
        }`}>
          JETSON ORIN NANO
        </div>
      </div>

      {/* Camera Live Feed Box */}
      <div className="relative aspect-video bg-black rounded-xl border border-slate-900 overflow-hidden crt-overlay flex flex-col items-center justify-center">
        
        {/* Blinking Recording dot / CAM metadata */}
        <div className="absolute top-3 left-3 flex items-center gap-2 z-10 font-mono text-[10px] text-white/70 bg-black/40 px-2 py-0.8 rounded select-none">
          <span className="relative flex h-2 w-2">
            <span className={`animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75`}></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
          </span>
          <span>REC</span>
          <span className="text-white/40">|</span>
          <span className="font-bold text-green-400">{data.camera}</span>
        </div>

        <div className="absolute top-3 right-3 font-mono text-[9px] text-white/50 bg-black/40 px-2 py-0.8 rounded select-none">
          1080P @ 30FPS
        </div>

        {/* Scanline element */}
        <div className="absolute top-0 left-0 w-full h-[3px] bg-green-500/10 shadow-[0_0_10px_rgba(34,197,94,0.5)] animate-scanline pointer-events-none z-10" />

        {/* Dynamic Video Feed Content */}
        {data.feedContent === "NO_INTRUSION" && (
          <div className="text-center space-y-2 pointer-events-none p-4">
            <div className="text-2xl opacity-45">🌾</div>
            <p className="text-[10px] font-mono text-slate-500 tracking-widest uppercase">Live Field Scan • Quiet</p>
          </div>
        )}

        {data.feedContent === "APPROACHING" && (
          <div className="text-center space-y-2 animate-pulse text-amber-500/90 pointer-events-none">
            <div className="text-3xl">🌳</div>
            <p className="text-[10px] font-mono tracking-widest uppercase font-bold">Zone B: PIR Motion Alert</p>
          </div>
        )}

        {data.feedContent === "DETECTED" && (
          <div className="relative w-full h-full flex items-center justify-center p-4">
            {/* Visual crop background */}
            <div className="absolute inset-0 bg-emerald-950/10 pointer-events-none" />
            
            {/* Detected Bounding Box */}
            <div className="border-2 border-amber-500 bg-amber-500/5 rounded p-3 flex flex-col items-center justify-center relative animate-pulse-fast">
              <span className="absolute -top-5 left-0 bg-amber-500 text-black font-mono text-[9px] font-bold px-1 rounded shadow">
                {activeScenario.species.toUpperCase()}: {confidence}%
              </span>
              <div className="text-4xl filter drop-shadow-md">{activeScenario.emoji}</div>
            </div>
          </div>
        )}

        {data.feedContent === "BREACH_ACTIVE" && (
          <div className="relative w-full h-full flex items-center justify-center p-4">
            {/* Visual alert background */}
            <div className="absolute inset-0 bg-red-950/20 pointer-events-none" />
            
            {/* Pulsing Danger Bounding Box */}
            <div className={`border-2 bg-black/45 rounded p-4 flex flex-col items-center justify-center relative shadow-[0_0_20px_rgba(239,68,68,0.2)] ${
              activeScenario.threat === 'HIGH' ? 'border-red-500' : 'border-amber-500'
            }`}>
              <span className={`absolute -top-5 left-0 text-slate-950 font-mono text-[9px] font-extrabold px-1 rounded shadow ${
                activeScenario.threat === 'HIGH' ? 'bg-red-500' : 'bg-amber-500'
              }`}>
                {activeScenario.species.toUpperCase()}: {confidence}%
              </span>
              <div className="text-4xl filter drop-shadow-lg animate-bounce">{activeScenario.emoji}</div>
            </div>
            
            {/* Warnings overlay on feed */}
            <div className={`absolute bottom-3 left-1/2 transform -translate-x-1/2 text-slate-950 font-mono text-[8px] font-bold tracking-widest px-2 py-0.5 rounded shadow flex items-center gap-1 ${
              activeScenario.threat === 'HIGH' ? 'bg-red-500 text-slate-950' : 'bg-amber-500 text-slate-950'
            }`}>
              <ShieldAlert className="h-3 w-3 animate-ping" />
              <span>DETERRENT PROTOCOL ACTIVE</span>
            </div>
          </div>
        )}

        {data.feedContent === "RETREATING" && (
          <div className="text-center space-y-2 text-green-500/90 pointer-events-none p-4">
            <CheckCircle className="h-8 w-8 text-green-500 mx-auto animate-bounce" />
            <p className="text-[10px] font-mono tracking-widest uppercase font-bold">Threat Repelled • Safe</p>
          </div>
        )}

        {/* Visual corner markings */}
        <div className="absolute top-2 left-2 w-2.5 h-2.5 border-t border-l border-white/20" />
        <div className="absolute top-2 right-2 w-2.5 h-2.5 border-t border-r border-white/20" />
        <div className="absolute bottom-2 left-2 w-2.5 h-2.5 border-b border-l border-white/20" />
        <div className="absolute bottom-2 right-2 w-2.5 h-2.5 border-b border-r border-white/20" />
      </div>

      {/* AI Metadata Stats Card */}
      <div className="mt-4 flex-1 flex flex-col justify-between">
        <div className="space-y-2">
          {/* Metadata Table */}
          <div className="grid grid-cols-2 gap-2 text-xs border border-slate-800/80 rounded-lg p-3 bg-slate-950/40">
            <div className="text-slate-400 font-mono">Species:</div>
            <div className="text-slate-100 font-semibold text-right">{data.species}</div>
            
            <div className="text-slate-400 font-mono">Confidence:</div>
            <div className="text-slate-100 font-mono font-semibold text-right">
              {confidence > 0 ? `${confidence}%` : 'N/A'}
            </div>

            <div className="text-slate-400 font-mono">Threat Level:</div>
            <div className={`font-bold font-mono text-right flex items-center justify-end gap-1 ${
              data.threat === 'HIGH' ? 'text-red-500 glow-danger-text' : 
              data.threat === 'MEDIUM' ? 'text-amber-500' : 
              data.threat === 'LOW' ? 'text-blue-500' : 'text-slate-400'
            }`}>
              {data.threat}
            </div>

            <div className="text-slate-400 font-mono">Status:</div>
            <div className="text-slate-100 text-right font-semibold font-mono text-[10px]">
              {data.status}
            </div>
          </div>
        </div>

        {/* Edge CPU Metric */}
        <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-[10px] font-mono text-slate-400">
          <div className="flex items-center gap-1.5">
            <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
            <span>AI Model: YOLOv8-Nano</span>
          </div>
          <span>Inference: 14.2ms</span>
        </div>
      </div>
    </div>
  );
}
