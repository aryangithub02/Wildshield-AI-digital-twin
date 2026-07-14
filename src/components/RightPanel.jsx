import React from 'react';
import { ShieldAlert, AlertTriangle, Radio, Wifi, CheckCircle2 } from 'lucide-react';
import { getTranslation } from '../utils/translations';

export default function RightPanel({ simulationState, currentScenario, language }) {
  const t = (key) => getTranslation(language, key);

  const activeScenario = currentScenario || {
    species: "Elephant",
    emoji: "🐘",
    threat: "HIGH",
    nodeId: 1,
    nodeName: "FN-1",
    confidenceMax: 98.4,
  };

  const getSpeciesTranslated = (speciesName) => {
    if (speciesName === "Elephant") return t('elephant');
    if (speciesName === "Wild Boar") return t('wildBoar');
    if (speciesName === "Monkey") return t('monkey');
    if (speciesName === "Deer") return t('deer');
    if (speciesName === "Nilgai") return t('nilgai');
    return speciesName;
  };

  const getThreatTranslated = (threatLevel) => {
    if (threatLevel === "HIGH") return t('high').toUpperCase();
    if (threatLevel === "MEDIUM") return t('medium').toUpperCase();
    return t('low').toUpperCase();
  };

  // Helper to resolve dynamic localized alert titles
  const getDynamicAlertTitle = () => {
    if (activeScenario.species === "Elephant") return t('elephantDetected');
    if (activeScenario.species === "Wild Boar") return t('boarDetected');
    if (activeScenario.species === "Monkey") return t('monkeyDetected');
    if (activeScenario.species === "Deer") return t('deerDetected');
    if (activeScenario.species === "Nilgai") return t('nilgaiDetected');
    return `${getSpeciesTranslated(activeScenario.species)} ${t('live')}`;
  };

  // Mock Active Alerts List
  const alertsList = [
    {
      id: 1,
      title: getDynamicAlertTitle(),
      location: `Zone FN-0${activeScenario.nodeId}`,
      time: "10:23 AM",
      threat: activeScenario.threat,
      active: simulationState >= 2 && simulationState <= 4
    },
    {
      id: 2,
      title: t('movementDetected'),
      location: "FN-5 Forest Edge",
      time: "10:18 AM",
      threat: "MEDIUM",
      active: false
    },
    {
      id: 3,
      title: t('fenceVibration'),
      location: "FN-3 South Boundary",
      time: "09:52 AM",
      threat: "LOW",
      active: false
    }
  ];

  const devices = [
    { name: "CAM-01 (North)", status: t('online') },
    { name: "CAM-02 (East)", status: t('online') },
    { name: "CAM-03 (South)", status: t('online') },
    { name: "CAM-04 (West)", status: t('online') },
    { name: "Sensor-01 (Temp)", status: t('online') },
    { name: "Sensor-02 (Motion)", status: t('online') },
    { name: "Speaker-01", status: t('online') }
  ];

  const isTargetDetected = simulationState >= 2 && simulationState <= 4;

  const thermalAvatars = {
    "Elephant": "https://images.unsplash.com/photo-1549488344-1f9b8d2bd1f3?q=80&w=200&auto=format&fit=crop",
    "Wild Boar": "https://images.unsplash.com/photo-1607613009820-a29f7bb81c04?q=80&w=200&auto=format&fit=crop",
    "Monkey": "https://images.unsplash.com/photo-1540573133985-87b6da6d54a9?q=80&w=200&auto=format&fit=crop",
    "Deer": "https://images.unsplash.com/photo-1484406566174-9da000fda645?q=80&w=200&auto=format&fit=crop",
    "Nilgai": "https://images.unsplash.com/photo-1589656966895-2f33e7653819?q=80&w=200&auto=format&fit=crop"
  };

  return (
    <aside className="w-80 bg-[#090d16] border-l border-slate-900 flex flex-col fixed top-16 right-0 bottom-0 z-30 p-4 space-y-6 overflow-y-auto select-none">
      
      {/* 1. ACTIVE ALERTS PANEL */}
      <div className="space-y-3">
        <div className="flex items-center justify-between text-xs border-b border-slate-900 pb-2">
          <span className="font-bold text-slate-100 font-sans uppercase tracking-wider">{t('activeAlerts')}</span>
          <span className="text-[10px] text-slate-400 cursor-pointer hover:text-slate-200">{t('viewAll')}</span>
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
                  {getThreatTranslated(alert.threat)}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 2. CURRENT DETECTION PANEL */}
      <div className="space-y-3">
        <div className="flex items-center justify-between text-xs border-b border-slate-900 pb-2">
          <span className="font-bold text-slate-100 font-sans uppercase tracking-wider">{t('currentDetection')}</span>
        </div>

        <div id="tour-camera" className="bg-[#111827]/40 border border-slate-900/60 rounded-xl p-3 space-y-3">
          
          <div className="flex gap-3 items-center">
            {/* Left: Thermal Viewport Image (Compact) */}
            <div className="relative w-28 h-20 bg-slate-950 rounded-lg border border-slate-900 overflow-hidden flex items-center justify-center shrink-0 crt-overlay">
              {isTargetDetected ? (
                <>
                  <img
                    src={thermalAvatars[activeScenario.species]}
                    alt={activeScenario.species}
                    className="w-full h-full object-cover filter brightness-[0.75] contrast-[1.15] hue-rotate-[15deg]"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-red-500/10 via-transparent to-blue-500/5 mix-blend-color-burn" />
                  <div className="absolute top-1 right-1 flex items-center gap-0.5 bg-red-600 text-white font-mono text-[6px] px-1 py-0.2 rounded shadow animate-pulse">
                    <Radio className="h-1.5 w-1.5 animate-ping" />
                    <span>{t('live').toUpperCase()}</span>
                  </div>
                </>
              ) : (
                <div className="text-center text-slate-600 select-none p-2">
                  <div className="text-base animate-pulse">📡</div>
                  <p className="text-[6px] font-mono uppercase tracking-widest mt-0.5">Scan</p>
                </div>
              )}
              
              {/* Corner highlights */}
              <div className="absolute top-1 left-1 w-1 h-1 border-t border-l border-white/20" />
              <div className="absolute top-1 right-1 w-1 h-1 border-t border-r border-white/20" />
              <div className="absolute bottom-1 left-1 w-1 h-1 border-b border-l border-white/20" />
              <div className="absolute bottom-1 right-1 w-1 h-1 border-b border-r border-white/20" />
            </div>

            {/* Right: Details Table */}
            <div className="flex-1 min-w-0">
              {isTargetDetected ? (
                <div className="space-y-1 text-[9px] font-mono leading-normal">
                  <div className="flex justify-between gap-1">
                    <span className="text-slate-500 shrink-0">{t('target')}:</span>
                    <span className="text-slate-100 font-bold font-sans truncate">{getSpeciesTranslated(activeScenario.species)}</span>
                  </div>
                  <div className="flex justify-between gap-1">
                    <span className="text-slate-500 shrink-0">{t('confidence')}:</span>
                    <span className="text-green-500 font-bold">{activeScenario.confidenceMax}%</span>
                  </div>
                  <div className="flex justify-between gap-1">
                    <span className="text-slate-500 shrink-0">{t('threatLevel')}:</span>
                    <span className={`font-bold ${activeScenario.threat === 'HIGH' ? 'text-red-500' : 'text-amber-500'}`}>
                      {getThreatTranslated(activeScenario.threat)}
                    </span>
                  </div>
                  <div className="flex justify-between gap-1">
                    <span className="text-slate-500 shrink-0">{t('location')}:</span>
                    <span className="text-slate-300 truncate">Zone FN-0{activeScenario.nodeId}</span>
                  </div>
                </div>
              ) : (
                <div className="text-slate-500 italic text-[9px] font-mono leading-normal">
                  Scanning grid... No active target.
                </div>
              )}
            </div>
          </div>
          
          {isTargetDetected && (
            <div className="flex justify-between border-t border-slate-900/60 pt-1.5 text-[8px] text-slate-500 font-mono">
              <span>{t('detectedAt')}:</span>
              <span>10:23:15 AM</span>
            </div>
          )}
        </div>
      </div>

      {/* 3. DEVICE STATUS PANEL */}
      <div className="space-y-3">
        <div className="flex items-center justify-between text-xs border-b border-slate-900 pb-2">
          <span className="font-bold text-slate-100 font-sans uppercase tracking-wider">{t('deviceStatus')}</span>
          <span className="text-[10px] text-slate-400 cursor-pointer hover:text-slate-200">{t('viewAll')}</span>
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
