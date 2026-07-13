import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Volume2, Lightbulb, ShieldAlert, Sparkles, Cpu, 
  Play, Film, Scan, Smartphone, FileText, ArrowRight
} from 'lucide-react';
import { getTranslation } from '../utils/translations';

export default function AIDetectionTab({ simulationState, currentScenario, language }) {
  const t = (key) => getTranslation(language, key);

  const activeScenario = currentScenario || {
    species: "Elephant",
    emoji: "🐘",
    threat: "HIGH",
    nodeId: 1,
    nodeName: "FN-1",
    confidenceBase: 96.2,
    confidenceMax: 98.4,
    actuators: { siren: true, floodlight: true, speaker: true, sprinkler: true }
  };

  const [confidence, setConfidence] = useState(0);

  useEffect(() => {
    if (simulationState === 2) {
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

  // Scientific names mapping
  const scientificNames = {
    "Elephant": "Elephas maximus",
    "Wild Boar": "Sus scrofa",
    "Monkey": "Macaca mulatta",
    "Deer": "Cervus elaphus",
    "Nilgai": "Boselaphus tragocamelus"
  };

  // Thermal/Silhouette animal shapes
  const thermalAvatars = {
    "Elephant": "https://images.unsplash.com/photo-1557050543-4b5f4e07ea49?q=80&w=350&auto=format&fit=crop",
    "Wild Boar": "https://images.unsplash.com/photo-1590422941838-89c565d6c291?q=80&w=350&auto=format&fit=crop",
    "Monkey": "https://images.unsplash.com/photo-1540573133985-87b6da6d54a9?q=80&w=350&auto=format&fit=crop",
    "Deer": "https://images.unsplash.com/photo-1484406566174-9da000fda645?q=80&w=350&auto=format&fit=crop",
    "Nilgai": "https://images.unsplash.com/photo-1589656966895-2f33e7653819?q=80&w=350&auto=format&fit=crop"
  };

  const getThreatBlocksCount = () => {
    if (activeScenario.threat === 'HIGH') return 5;
    if (activeScenario.threat === 'MEDIUM') return 3;
    return 1;
  };

  const isStepActive = (stepNum) => {
    if (simulationState === 0) return false;
    if (simulationState === 1) return stepNum <= 2;
    if (simulationState === 2) return stepNum <= 4;
    if (simulationState === 3) return stepNum <= 6;
    if (simulationState === 4) return stepNum <= 7;
    if (simulationState === 5) return stepNum <= 7;
    return false;
  };

  const isSirenTriggered = simulationState === 4 && activeScenario.actuators.siren;
  const isLightTriggered = simulationState === 4 && activeScenario.actuators.floodlight;
  const isAlertTriggered = simulationState >= 3 && simulationState <= 4;
  const isLogTriggered = simulationState >= 3 && simulationState <= 4;
  const isCameraActive = simulationState >= 2 && simulationState <= 4;

  return (
    <div className="space-y-6 select-none text-left">
      
      {/* 1. TOP HEADER STATISTICS PANEL */}
      <div className="bg-[#0b0f19] border border-slate-900 rounded-xl p-4 flex flex-col md:flex-row items-center justify-between gap-4 shadow-md">
        <div className="flex items-center gap-3">
          <div className="h-8.5 w-8.5 rounded-lg bg-green-500/10 border border-green-500/20 text-green-500 flex items-center justify-center">
            <Cpu className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-sm font-extrabold text-slate-100 font-sans tracking-wide uppercase leading-none">
              {t('aiDetection')}
            </h2>
            <p className="text-[10px] text-slate-500 font-mono mt-1">Real-time Wildlife Detection, Edge Inference & Analysis</p>
          </div>
        </div>

        {/* Live status chips */}
        <div className="flex items-center gap-6 text-[10px] font-mono">
          <div className="flex items-center gap-1.5">
            <span className="text-slate-500">{t('model').toUpperCase()}:</span>
            <span className="text-green-500 font-bold">YOLOv11m</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-slate-500">{t('inferenceFps').toUpperCase()}:</span>
            <span className="text-slate-100 font-bold">24.7</span>
          </div>
          <div className="flex items-center gap-2 px-2.5 py-1 bg-green-500/10 text-green-500 rounded border border-green-500/20 font-bold">
            <span className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />
            <span>{t('status').toUpperCase()}: {t('active').toUpperCase()}</span>
          </div>
        </div>
      </div>

      {/* 2. THREE COLUMN LAYOUT */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        
        {/* Column 1: Live Camera Feed */}
        <div className="lg:col-span-2 bg-[#0b0f19] border border-slate-900 rounded-xl p-5 flex flex-col justify-between shadow-lg">
          <div className="flex items-center justify-between text-xs border-b border-slate-900 pb-2 mb-3">
            <span className="font-bold text-slate-100 font-sans uppercase tracking-wider flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
              {t('liveCameraFeed')}
            </span>
            <span className="text-[10px] text-slate-500 font-mono">
              🎥 {activeScenario.nodeName} (North Field)
            </span>
          </div>

          {/* CRT Camera feed viewport */}
          <div className="relative aspect-video w-full bg-black rounded-lg border border-slate-900 overflow-hidden crt-overlay flex items-center justify-center">
            
            <div className="absolute top-3 left-3 z-10 flex items-center gap-2 font-mono text-[9px] text-white bg-black/50 px-2 py-1 rounded">
              <span className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
              <span>{t('live').toUpperCase()}</span>
            </div>

            <div className="absolute top-0 left-0 w-full h-[2.5px] bg-green-500/10 shadow-[0_0_10px_rgba(34,197,94,0.5)] animate-scanline pointer-events-none z-10" />

            {simulationState > 0 ? (
              <>
                <img
                  src={thermalAvatars[activeScenario.species]}
                  alt={activeScenario.species}
                  className="w-full h-full object-cover filter brightness-[0.75] contrast-[1.15] grayscale"
                />
                
                {/* Bounding box */}
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
                      {getSpeciesTranslated(activeScenario.species)} {confidence}%
                    </span>
                    
                    <div className="text-5xl opacity-85 filter drop-shadow-[0_0_10px_rgba(34,197,94,0.2)]">
                      {activeScenario.emoji}
                    </div>
                  </motion.div>
                )}
              </>
            ) : (
              <div className="text-center space-y-2 text-slate-500">
                <Scan className="h-8 w-8 text-slate-600 mx-auto animate-pulse" />
                <p className="text-[10px] font-mono tracking-widest uppercase">Grid Idle • Scan Mode</p>
              </div>
            )}

            <div className="absolute bottom-3 left-3 font-mono text-[9px] text-white/60 bg-black/50 px-2 py-0.5 rounded">
              10:23:15 PM • 20 May 2025
            </div>

            <div className="absolute bottom-3 right-3 flex items-center gap-1.5 bg-black/50 p-1 rounded">
              <button className="p-0.5 hover:text-white text-slate-400"><Volume2 className="h-3 w-3" /></button>
              <button className="p-0.5 hover:text-white text-slate-400"><Film className="h-3 w-3" /></button>
              <button className="p-0.5 hover:text-white text-slate-400"><Play className="h-3 w-3" /></button>
            </div>
          </div>
        </div>

        {/* Column 2: Detection Result & Behavior Analysis */}
        <div className="space-y-6">
          {/* Detection Result Card */}
          <div className="bg-[#0b0f19] border border-slate-900 rounded-xl p-5 shadow-lg space-y-4">
            <div className="text-[10px] font-bold font-sans text-slate-400 uppercase tracking-wider border-b border-slate-900 pb-2">
              {t('detectionResult')}
            </div>

            {simulationState >= 2 && simulationState <= 4 ? (
              <div className="space-y-3">
                <div className="flex items-start justify-between">
                  <div className="text-left space-y-1">
                    <span className="text-[8px] font-mono text-slate-500 block uppercase">SPECIES</span>
                    <span className="text-lg font-bold text-slate-100 font-sans block">{getSpeciesTranslated(activeScenario.species)}</span>
                    <span className="text-[9px] text-slate-400 italic block">*{scientificNames[activeScenario.species]}*</span>
                  </div>
                  <div className="h-10 w-10 rounded-lg bg-green-500/10 border border-green-500/20 flex items-center justify-center text-green-500 text-2xl">
                    {activeScenario.emoji}
                  </div>
                </div>

                {/* Confidence Bar */}
                <div className="space-y-1 text-left">
                  <span className="text-[8px] font-mono text-slate-500 block uppercase">{t('confidence')}</span>
                  <span className="text-lg font-bold text-green-500 font-mono block">{confidence}%</span>
                  <div className="h-1.5 w-full bg-slate-950 rounded-full overflow-hidden">
                    <div className="h-full bg-green-500 rounded-full" style={{ width: `${confidence}%` }} />
                  </div>
                </div>

                {/* Threat level block counts */}
                <div className="space-y-1 text-left">
                  <span className="text-[8px] font-mono text-slate-500 block uppercase">{t('threatLevel')}</span>
                  <div className="flex items-center gap-1.5">
                    <span className={`text-xs font-bold font-mono uppercase ${
                      activeScenario.threat === 'HIGH' ? 'text-red-500' : 'text-amber-500'
                    }`}>
                      {getThreatTranslated(activeScenario.threat)}
                    </span>
                    <div className="flex gap-0.5">
                      {[1, 2, 3, 4, 5].map((i) => (
                        <div
                          key={i}
                          className={`h-2.5 w-3.5 rounded-sm border ${
                            i <= getThreatBlocksCount()
                              ? activeScenario.threat === 'HIGH'
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
                Scanning perimeter...
              </div>
            )}
          </div>

          {/* Behavior Analysis Card */}
          <div className="bg-[#0b0f19] border border-slate-900 rounded-xl p-5 shadow-lg space-y-3">
            <div className="text-[10px] font-bold font-sans text-slate-400 uppercase tracking-wider border-b border-slate-900 pb-2">
              {t('behaviorAnalysis')}
            </div>
            {simulationState >= 2 && simulationState <= 4 ? (
              <div className="space-y-3 text-[10px] font-mono text-slate-400">
                <div className="h-8 flex items-end">
                  <svg className="w-full h-full" viewBox="0 0 150 30">
                    <path
                      d="M0,20 Q15,5 30,22 T60,8 T90,25 T120,5 T150,15"
                      fill="none"
                      stroke="#22c55e"
                      strokeWidth="1.5"
                    />
                  </svg>
                </div>
                <table className="w-full">
                  <tbody>
                    <tr className="border-b border-slate-850 h-6">
                      <td>Behavior</td>
                      <td className="text-right text-slate-100 font-semibold">
                        {activeScenario.species === 'Elephant' ? 'Walking' : 'Foraging'}
                      </td>
                    </tr>
                    <tr className="border-b border-slate-850 h-6">
                      <td>Movement</td>
                      <td className="text-right text-slate-100 font-semibold">Normal</td>
                    </tr>
                    <tr className="border-b border-slate-850 h-6">
                      <td>Group Size</td>
                      <td className="text-right text-slate-100 font-semibold">1</td>
                    </tr>
                    <tr className="h-6">
                      <td>Activity</td>
                      <td className="text-right text-slate-200 font-bold">Active</td>
                    </tr>
                  </tbody>
                </table>
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
          <div className="bg-[#0b0f19] border border-slate-900 rounded-xl p-5 shadow-lg space-y-3.5">
            <div className="text-[10px] font-bold font-sans text-slate-400 uppercase tracking-wider border-b border-slate-900 pb-2">
              {t('classificationScore')}
            </div>
            <div className="space-y-2 text-[10px] font-mono">
              {[
                { name: t('elephant'), key: "Elephant", pct: "98.4%", active: activeScenario.species === "Elephant" && isCameraActive },
                { name: t('wildBoar'), key: "Wild Boar", pct: "95.8%", active: activeScenario.species === "Wild Boar" && isCameraActive },
                { name: t('monkey'), key: "Monkey", pct: "93.6%", active: activeScenario.species === "Monkey" && isCameraActive },
                { name: t('deer'), key: "Deer", pct: "96.8%", active: activeScenario.species === "Deer" && isCameraActive },
                { name: t('nilgai'), key: "Nilgai", pct: "82.1%", active: false }
              ].map((cls) => (
                <div key={cls.name} className="space-y-1">
                  <div className="flex justify-between font-sans">
                    <span className={cls.active ? 'text-green-400 font-bold' : 'text-slate-400'}>{cls.name}</span>
                    <span className={cls.active ? 'text-green-500 font-bold' : 'text-slate-500'}>
                      {cls.active ? cls.pct : cls.name === t('nilgai') ? "0.2%" : "0.1%"}
                    </span>
                  </div>
                  <div className="h-1 w-full bg-slate-950 rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full transition-all duration-300 ${cls.active ? 'bg-green-500' : 'bg-slate-800'}`} 
                      style={{ width: cls.active ? cls.pct : '2%' }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Detection Info Card */}
          <div className="bg-[#0b0f19] border border-slate-900 rounded-xl p-5 shadow-lg space-y-3">
            <div className="text-[10px] font-bold font-sans text-slate-400 uppercase tracking-wider border-b border-slate-900 pb-2">
              {t('detectionInfo')}
            </div>
            {simulationState >= 2 && simulationState <= 4 ? (
              <div className="space-y-1.5 text-[9px] font-mono text-slate-400">
                <div className="flex justify-between">
                  <span>Distance</span>
                  <span className="text-slate-100 font-semibold">42.6 m</span>
                </div>
                <div className="flex justify-between">
                  <span>Direction</span>
                  <span className="text-slate-100 font-semibold">North-East</span>
                </div>
                <div className="flex justify-between">
                  <span>Speed</span>
                  <span className="text-slate-100 font-semibold">2.4 m/s</span>
                </div>
                <div className="flex justify-between">
                  <span>Bounding Box</span>
                  <span className="text-slate-100 font-semibold">(320, 126) - (768, 845)</span>
                </div>
                <div className="flex justify-between">
                  <span>{t('detectedAt')}</span>
                  <span className="text-slate-100 font-semibold">10:23:15 PM</span>
                </div>
                <div className="flex justify-between">
                  <span>{t('model')}</span>
                  <span className="text-green-500 font-semibold">YOLOv11m</span>
                </div>
                <div className="flex justify-between">
                  <span>Tracking ID</span>
                  <span className="text-slate-100 font-semibold">TRK-2548</span>
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

      {/* 3. DETECTION PIPELINE STEPPER */}
      <div className="bg-[#0b0f19] border border-slate-900 rounded-xl p-5 shadow-lg space-y-4">
        <div className="text-[10px] font-bold font-sans text-slate-400 uppercase tracking-wider border-b border-slate-900 pb-2">
          {t('pipeline')}
        </div>
        
        <div className="flex flex-col md:flex-row justify-between items-center gap-4 py-2 px-2 overflow-x-auto">
          {[
            { id: 1, label: t('step1'), time: "10:23:13 PM" },
            { id: 2, label: t('step2'), time: "10:23:13 PM" },
            { id: 3, label: t('step3'), time: "10:23:14 PM" },
            { id: 4, label: t('step4'), time: "10:23:15 PM" },
            { id: 5, label: t('step5'), time: "10:23:15 PM" },
            { id: 6, label: t('step6'), time: "10:23:15 PM" },
            { id: 7, label: t('step7'), time: "10:23:15 PM" }
          ].map((step, index, arr) => {
            const active = isStepActive(step.id);
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
                    <p className="text-[8px] font-mono text-slate-500">{active ? step.time : '--:--:--'}</p>
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

      {/* 4. RESPONSE ACTIONS & RECENT DETECTIONS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Response Actions Card */}
        <div className="bg-[#0b0f19] border border-slate-900 rounded-xl p-5 shadow-lg space-y-4">
          <div className="text-[10px] font-bold font-sans text-slate-400 uppercase tracking-wider border-b border-slate-900 pb-2">
            {t('responseActions')}
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
                <p className="text-[8px] font-mono uppercase">Status: {isSirenTriggered ? 'ON' : 'OFF'}</p>
                <p className="text-[8px] font-mono mt-0.5 text-slate-500">{isSirenTriggered ? '10:23:16 PM' : '--:--:--'}</p>
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
                <p className="text-[8px] font-mono uppercase">Status: {isLightTriggered ? 'ON' : 'OFF'}</p>
                <p className="text-[8px] font-mono mt-0.5 text-slate-500">{isLightTriggered ? '10:23:16 PM' : '--:--:--'}</p>
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
                <p className="text-[8px] font-mono uppercase">To: Farmer Node</p>
                <p className="text-[8px] font-mono mt-0.5 text-slate-500">{isAlertTriggered ? '10:23:16 PM' : '--:--:--'}</p>
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
                <p className="text-[8px] font-mono uppercase">Event ID: WS-EVT-481</p>
                <p className="text-[8px] font-mono mt-0.5 text-slate-500">{isLogTriggered ? '10:23:16 PM' : '--:--:--'}</p>
              </div>
            </div>

          </div>
        </div>

        {/* Recent Detections List */}
        <div className="bg-[#0b0f19] border border-slate-900 rounded-xl p-5 shadow-lg space-y-4">
          <div className="flex items-center justify-between text-xs border-b border-slate-900 pb-2">
            <span className="font-bold text-slate-100 font-sans uppercase tracking-wider">{t('recentDetections')}</span>
            <span className="text-[10px] text-slate-400 cursor-pointer hover:text-slate-200">{t('viewAll')}</span>
          </div>

          <div className="overflow-x-auto text-[10px] font-mono">
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
                {[
                  { sp: t('elephant'), loc: "North Field", time: "10:23:15 PM", conf: "98.4%", threat: t('high').toUpperCase(), threatColor: "text-red-400 border-red-500/20 bg-red-500/10 font-bold" },
                  { sp: t('wildBoar'), loc: "West Field", time: "09:58:42 PM", conf: "87.6%", threat: t('medium').toUpperCase(), threatColor: "text-amber-400 border-amber-500/20 bg-amber-500/10" },
                  { sp: t('deer'), loc: "South Field", time: "09:42:11 PM", conf: "76.3%", threat: t('low').toUpperCase(), threatColor: "text-green-400 border-green-500/20 bg-green-500/10" },
                  { sp: t('nilgai'), loc: "East Field", time: "09:18:33 PM", conf: "82.1%", threat: t('low').toUpperCase(), threatColor: "text-green-400 border-green-500/20 bg-green-500/10" }
                ].map((row, idx) => (
                  <tr key={idx} className="border-b border-slate-900 h-9 text-slate-300">
                    <td className="font-sans font-semibold text-slate-100">{row.sp}</td>
                    <td>{row.loc}</td>
                    <td>{row.time}</td>
                    <td className="text-green-500 font-bold">{row.conf}</td>
                    <td className="text-right">
                      <span className={`px-1.5 py-0.2.5 rounded text-[8px] font-extrabold uppercase border ${row.threatColor}`}>
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
