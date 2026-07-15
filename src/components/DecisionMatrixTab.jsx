import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  GitFork, Cpu, Zap, Check, AlertTriangle, ShieldAlert, 
  HelpCircle, Settings, Play, Database, Sparkles, AlertCircle
} from 'lucide-react';
import { getTranslation } from '../utils/translations';

export default function DecisionMatrixTab({ simulationState, currentScenario, language }) {
  const t = (key) => getTranslation(language, key);

  // User interactive testing state
  const [selectedSpecies, setSelectedSpecies] = useState('Elephant');
  const [selectedCrop, setSelectedCrop] = useState('Cotton');

  const speciesOptions = [
    { name: 'Elephant', emoji: '🐘' },
    { name: 'Wild Boar', emoji: '🐗' },
    { name: 'Monkey', emoji: '🐒' },
    { name: 'Deer', emoji: '🦌' },
    { name: 'Stray Cattle', emoji: '🐄' }
  ];

  // Matrix data
  const matrixData = [
    { 
      species: "Elephant", 
      emoji: "🐘", 
      threat: "CRITICAL (96/100)", 
      primary: "Directional LED Flood Lights", 
      secondary: "Directional Speaker", 
      reason: "Bypasses village-wide sirens to avoid human panic near borders.",
      actions: ["LED Floodlights", "Directional Speaker (Predator/Rumble)", "Notify Farmer & Forest Office", "Sprinkler Guard Override"]
    },
    { 
      species: "Wild Boar", 
      emoji: "🐗", 
      threat: "WARNING (68/100)", 
      primary: "Predator Audio", 
      secondary: "LED Flashing Lights", 
      reason: "High sensitivity to feline/predator vocalizations.",
      actions: ["Tiger/Leopard Roars", "LED Strobes (Strobe Flash)", "Sprinkler Water Jets", "Notify Farmer"]
    },
    { 
      species: "Monkey", 
      emoji: "🐒", 
      threat: "MODERATE (42/100)", 
      primary: "Monkey Distress Call", 
      secondary: "Visual Flash", 
      reason: "Triggers social flight reflex using conspecific alarm recordings.",
      actions: ["Distress Calls", "High-frequency Visual Flash", "Overhead Sprinkler Mist", "Notify Farmer"]
    },
    { 
      species: "Deer", 
      emoji: "🦌", 
      threat: "LOW THREAT (35/100)", 
      primary: "Soft Flash Lights", 
      secondary: "Farmer Alert", 
      reason: "Soft visuals deter safely; loud acoustics may cause erratic panic charges.",
      actions: ["Low-Intensity LED Strobes", "Camera Recording", "Notify Farmer"]
    },
    { 
      species: "Stray Cattle", 
      emoji: "🐄", 
      threat: "LOW THREAT (28/100)", 
      primary: "Mobile Notification", 
      secondary: "Local Buzzer", 
      reason: "Requires gentle push; forest department and high sirens bypassed.",
      actions: ["Buzzer Tone", "Notify Farmer for manual herding"]
    }
  ];

  // Dynamic decision flow based on selections
  const getDecisionPath = () => {
    const isCotton = selectedCrop === 'Cotton';
    const sprinklerState = isCotton ? "DISABLED (Cotton Guard)" : "ENABLED";
    
    switch (selectedSpecies) {
      case "Elephant":
        return [
          { label: "Wildlife Detected", val: "🐘 Elephant", status: "ok" },
          { label: "Threat Assessment", val: "Critical (96%)", status: "warn" },
          { label: "Target Crop", val: `${selectedCrop} (${isCotton ? 'Sensitive' : 'Standard'})`, status: "info" },
          { label: "Sprinkler Circuit", val: sprinklerState, status: isCotton ? "error" : "ok" },
          { label: "Village Proximity", val: "Within 200m (North Border)", status: "warn" },
          { label: "Acoustic Guard", val: "Bypass Loud Siren (Village Safe)", status: "warn" },
          { label: "Primary Deterrent", val: "Directional LED Flood Lights", status: "ok" },
          { label: "Secondary Deterrent", val: "Directional Speaker (Low-Freq)", status: "ok" },
          { label: "System Notification", val: "Alert Farmer & Forest Department", status: "info" }
        ];
      case "Wild Boar":
        return [
          { label: "Wildlife Detected", val: "🐗 Wild Boar", status: "ok" },
          { label: "Threat Assessment", val: "Warning (68%)", status: "warn" },
          { label: "Target Crop", val: `${selectedCrop}`, status: "info" },
          { label: "Sprinkler Circuit", val: sprinklerState, status: isCotton ? "error" : "ok" },
          { label: "Deterrent Type", val: "Acoustic Predator Sounds", status: "ok" },
          { label: "Secondary Deterrent", val: "LED Flash Strobes", status: "ok" },
          { label: "System Notification", val: "Alert Farmer", status: "info" }
        ];
      case "Monkey":
        return [
          { label: "Wildlife Detected", val: "🐒 Monkey", status: "ok" },
          { label: "Threat Assessment", val: "Moderate (42%)", status: "warn" },
          { label: "Target Crop", val: `${selectedCrop}`, status: "info" },
          { label: "Sprinkler Circuit", val: sprinklerState, status: isCotton ? "error" : "ok" },
          { label: "Acoustic Profile", val: "Monkey Distress Calls", status: "ok" },
          { label: "Secondary Deterrent", val: "High-Freq LED Flash", status: "ok" },
          { label: "System Notification", val: "Alert Farmer", status: "info" }
        ];
      case "Deer":
        return [
          { label: "Wildlife Detected", val: "🦌 Deer", status: "ok" },
          { label: "Threat Assessment", val: "Low (35%)", status: "info" },
          { label: "Deterrent Safety", val: "Avoid Siren (Panic Prevention)", status: "warn" },
          { label: "Primary Deterrent", val: "Soft Flashing Lights", status: "ok" },
          { label: "System Notification", val: "Alert Farmer", status: "info" }
        ];
      case "Stray Cattle":
        return [
          { label: "Wildlife Detected", val: "🐄 Stray Cattle", status: "ok" },
          { label: "Threat Assessment", val: "Low (28%)", status: "info" },
          { label: "Primary Deterrent", val: "Local Buzzer (Acoustic)", status: "ok" },
          { label: "Alert Config", val: "Bypass Forest Dept", status: "info" },
          { label: "System Notification", val: "Alert Farmer (Manual Herding)", status: "info" }
        ];
      default:
        return [];
    }
  };

  const decisionPath = getDecisionPath();

  return (
    <div className="space-y-6 select-none text-left">
      
      {/* HEADER SECTION */}
      <div className="bg-[#0b0f19] border border-slate-900 rounded-xl p-4 flex flex-col md:flex-row items-center justify-between gap-4 shadow-md">
        <div className="flex items-center gap-3">
          <div className="h-8.5 w-8.5 rounded-lg bg-green-500/10 border border-green-500/20 text-green-500 flex items-center justify-center">
            <GitFork className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-sm font-extrabold text-slate-100 font-sans tracking-wide uppercase leading-none">
              Species-Specific AI Decision Engine Rules
            </h2>
            <p className="text-[10px] text-slate-500 font-mono mt-1">Rule Engine, Crop-Aware Inhibitors & Non-Lethal Response Selectors</p>
          </div>
        </div>

        <div className="flex items-center gap-4 text-[10px] font-mono">
          <div className="flex items-center gap-1.5">
            <span className="text-slate-500">POLICIES:</span>
            <span className="text-green-500 font-bold">6 Active</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-slate-500">OVERRIDE STATE:</span>
            <span className="text-slate-100 font-bold">Auto</span>
          </div>
        </div>
      </div>

      {/* INTERACTIVE RULE SIMULATOR */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Simulator controls */}
        <div className="lg:col-span-1 bg-[#0b0f19] border border-slate-900 rounded-xl p-5 space-y-4 shadow-lg flex flex-col justify-between">
          <div>
            <div className="text-[10px] font-bold font-sans text-slate-400 uppercase tracking-wider border-b border-slate-900 pb-2 mb-3">
              AI Rules Simulator
            </div>
            
            <p className="text-[10px] text-slate-500 leading-normal mb-4">
              Select a species and crop type to observe how the AI Decision Engine instantly alters its non-lethal response strategies and geofence rules.
            </p>

            <div className="space-y-4">
              {/* Species selector */}
              <div className="space-y-1.5">
                <label className="text-[9px] font-mono text-slate-500 uppercase font-bold">Select Intruder Species</label>
                <div className="grid grid-cols-3 gap-1.5">
                  {speciesOptions.map((opt) => (
                    <button
                      key={opt.name}
                      onClick={() => setSelectedSpecies(opt.name)}
                      className={`py-1.5 rounded-lg border text-[10px] font-semibold flex flex-col items-center justify-center transition-all ${
                        selectedSpecies === opt.name
                          ? 'bg-green-500/10 border-green-500 text-green-400'
                          : 'bg-slate-950 border-slate-900 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <span className="text-lg">{opt.emoji}</span>
                      <span className="mt-0.5">{opt.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Crop Selector */}
              <div className="space-y-1.5">
                <label className="text-[9px] font-mono text-slate-500 uppercase font-bold">Select Active Crop Zone</label>
                <div className="grid grid-cols-2 gap-2">
                  {['Cotton', 'Rice', 'Sugarcane', 'Vegetables'].map((c) => (
                    <button
                      key={c}
                      onClick={() => setSelectedCrop(c)}
                      className={`py-2 rounded-lg border text-[10px] font-semibold transition-all ${
                        selectedCrop === c
                          ? 'bg-blue-500/10 border-blue-500 text-blue-400'
                          : 'bg-slate-950 border-slate-900 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {c} {c === 'Cotton' && '⚠️'}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="bg-slate-950/60 border border-slate-900 rounded-lg p-3 text-[9px] font-mono text-slate-400 leading-normal mt-4">
            <span className="text-green-500 font-bold block mb-1">✓ Crop-Aware Constraint</span>
            {selectedCrop === 'Cotton' 
              ? "Cotton farms trigger a sprinkler inhibitor. High water pressure could shatter cotton fibers and ruin harvest." 
              : "Standard crop detected. Irrigation sprinkler lines are enabled as a water deterrent."}
          </div>
        </div>

        {/* Decision Reasoning Tree Flow */}
        <div className="lg:col-span-2 bg-[#0b0f19] border border-slate-900 rounded-xl p-5 shadow-lg space-y-4">
          <div className="text-[10px] font-bold font-sans text-slate-400 uppercase tracking-wider border-b border-slate-900 pb-2 flex justify-between items-center">
            <span>Inference Reasoning Tree Flow</span>
            <span className="text-[9px] font-mono text-slate-500">Delay Interval: 400ms</span>
          </div>

          <div className="flex flex-col gap-2 min-h-[280px] justify-center">
            <AnimatePresence mode="popLayout">
              {decisionPath.map((step, idx) => (
                <motion.div
                  key={`${selectedSpecies}-${step.label}-${idx}`}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ delay: idx * 0.15 }}
                  className="flex items-center gap-3 text-[10px] font-mono text-left pl-4"
                >
                  <span className="text-slate-600 shrink-0 w-28 text-right font-sans font-bold uppercase tracking-wider text-[8px]">
                    {step.label}
                  </span>
                  <span className="text-slate-600 font-bold shrink-0 font-mono">⟶</span>
                  <span className={`px-2.5 py-1 rounded-lg border font-bold flex items-center gap-1.5 shadow ${
                    step.status === 'ok' ? 'bg-green-500/10 border-green-500/20 text-green-400' :
                    step.status === 'warn' ? 'bg-amber-500/10 border-amber-500/20 text-amber-400' :
                    step.status === 'error' ? 'bg-red-500/10 border-red-500/20 text-red-400 font-black' :
                    'bg-blue-500/10 border-blue-500/20 text-blue-400'
                  }`}>
                    {step.status === 'error' && <AlertCircle className="h-3.5 w-3.5" />}
                    {step.val}
                  </span>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>

      </div>

      {/* FULL DECISION MATRIX TABLE */}
      <div className="bg-[#0b0f19] border border-slate-900 rounded-xl p-5 shadow-lg">
        <div className="text-[10px] font-bold font-sans text-slate-400 uppercase tracking-wider border-b border-slate-900 pb-2 mb-4">
          Species-Specific Decision Matrix Reference
        </div>
        <div className="overflow-x-auto text-[10px] font-mono">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="text-slate-500 border-b border-slate-900 h-8">
                <th className="pb-2">Species</th>
                <th className="pb-2">Threat Class</th>
                <th className="pb-2">Primary Response</th>
                <th className="pb-2">Secondary Response</th>
                <th className="pb-2">Key Actuators</th>
                <th className="pb-2">Reason / Rationale</th>
              </tr>
            </thead>
            <tbody>
              {matrixData.map((row) => {
                const isActive = selectedSpecies === row.species;
                return (
                  <tr 
                    key={row.species}
                    className={`border-b border-slate-900 h-14 transition-all duration-300 ${
                      isActive 
                        ? 'bg-green-500/10 border-green-500/40 text-green-400 font-bold' 
                        : 'text-slate-400 hover:bg-slate-950/20'
                    }`}
                  >
                    <td className="font-sans font-semibold text-slate-100 flex items-center gap-1.5 h-14">
                      <span className="text-lg">{row.emoji}</span>
                      <span>{row.species}</span>
                    </td>
                    <td>
                      <span className={`px-1.5 py-0.5 rounded text-[8px] font-extrabold border ${
                        row.species === 'Elephant' || row.species === 'Human' ? 'bg-red-500/10 border-red-500/20 text-red-500' :
                        row.species === 'Wild Boar' || row.species === 'Nilgai' ? 'bg-amber-500/10 border-amber-500/20 text-amber-500' :
                        'bg-green-500/10 border-green-500/20 text-green-500'
                      }`}>
                        {row.threat}
                      </span>
                    </td>
                    <td>{row.primary}</td>
                    <td>{row.secondary}</td>
                    <td>
                      <div className="flex flex-wrap gap-1 max-w-[180px]">
                        {row.actions.map((act) => (
                          <span key={act} className="text-[7.5px] px-1 py-0.2 rounded border bg-slate-950 border-slate-900 text-slate-300">
                            {act}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="text-slate-500 italic max-w-xs">{row.reason}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
