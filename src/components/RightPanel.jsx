import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ShieldAlert, AlertTriangle, Radio, Wifi, CheckCircle2, 
  Cpu, Zap, Compass, Flame, Check, HelpCircle, 
  RefreshCw, TrendingUp, Info, Play, Clock, ArrowRight, Eye
} from 'lucide-react';
import { getTranslation } from '../utils/translations';

export default function RightPanel({ simulationState, currentScenario, language }) {
  const t = (key) => getTranslation(language, key);
  
  // Crop state - Cotton, Rice, Sugarcane, Vegetables
  const [currentCrop, setCurrentCrop] = useState('Cotton');

  const activeScenario = currentScenario || {
    species: "Elephant",
    emoji: "🐘",
    threat: "HIGH",
    nodeId: 1,
    nodeName: "FN-1",
    confidenceBase: 96.2,
    confidenceMax: 98.4,
    actuators: { siren: true, floodlight: true, speaker: true, sprinkler: true },
    logThreat: "HIGH",
    path: []
  };

  const getSpeciesTranslated = (speciesName) => {
    if (speciesName === "Elephant") return t('elephant');
    if (speciesName === "Wild Boar") return t('wildBoar');
    if (speciesName === "Monkey") return t('monkey');
    if (speciesName === "Deer") return t('deer');
    if (speciesName === "Nilgai") return t('nilgai');
    if (speciesName === "Stray Cattle") return t('strayCattle');
    return speciesName;
  };

  const getThreatTranslated = (threatLevel) => {
    if (threatLevel === "HIGH") return t('high').toUpperCase();
    if (threatLevel === "MEDIUM") return t('medium').toUpperCase();
    return t('low').toUpperCase();
  };

  // 1. Species Specific Configs
  const getSpeciesConfig = () => {
    switch (activeScenario.species) {
      case "Elephant":
        return {
          threatScore: 96,
          threatStatus: "CRITICAL",
          threatColor: "text-red-500 bg-red-500/10 border-red-500/20",
          threatBg: "bg-red-600",
          count: 3,
          speed: "Walking",
          direction: "Forest",
          gpsZone: "North-East",
          matrixRowIndex: 0,
          learning: { visits: 12, successful: "Directional Flood Lights", successRate: 86, exitTime: 48 },
          reasons: [
            "Species identified as Elephant.",
            `Crop configured as ${currentCrop}.`,
            currentCrop === "Cotton" ? "Sprinkler disabled to avoid cotton damage." : "Sprinkler active for irrigation deterrent.",
            "Village located within 200 meters of North Boundary.",
            "High-volume siren avoided to prevent village panic.",
            "Directional speaker selected to target herd path.",
            "Visual strobe and LED floodlights activated.",
            "Forest department notification triggered automatically."
          ],
          tree: [
            "Wildlife Detected",
            "Elephant",
            "Threat Level: Critical",
            `Crop: ${currentCrop}`,
            currentCrop === "Cotton" ? "Sprinkler Disabled" : "Sprinkler Enabled",
            "Village Nearby",
            "Avoid High Volume Siren",
            "Activate Directional Speaker",
            "Activate Flood Lights",
            "Notify Farmer",
            "Notify Forest Officer"
          ]
        };
      case "Wild Boar":
        return {
          threatScore: 68,
          threatStatus: "WARNING",
          threatColor: "text-amber-500 bg-amber-500/10 border-amber-500/20",
          threatBg: "bg-amber-500",
          count: 5,
          speed: "Foraging",
          direction: "North Boundary",
          gpsZone: "North-West",
          matrixRowIndex: 1,
          learning: { visits: 24, successful: "Predator Audio", successRate: 91, exitTime: 28 },
          reasons: [
            "Species identified as Wild Boar.",
            `Crop configured as ${currentCrop}.`,
            "Acoustic sensors indicate foraging behavior.",
            "Predator sounds (tiger/leopard roar) selected.",
            "LED strobe lights activated in flash mode.",
            currentCrop === "Cotton" ? "Sprinkler disabled (Cotton Crop)." : "Sprinkler active (Water jet deterrent).",
            "Local buzzer activated to clear border.",
            "Notification pushed to Farmer App."
          ],
          tree: [
            "Wildlife Detected",
            "Wild Boar",
            "Threat Level: Warning",
            `Crop: ${currentCrop}`,
            currentCrop === "Cotton" ? "Sprinkler Disabled" : "Sprinkler Enabled",
            "Play Predator Audio",
            "Enable Flash Lights",
            "Notify Farmer"
          ]
        };
      case "Monkey":
        return {
          threatScore: 42,
          threatStatus: "MODERATE",
          threatColor: "text-yellow-500 bg-yellow-500/10 border-yellow-500/20",
          threatBg: "bg-yellow-500",
          count: 12,
          speed: "Agile Climbing",
          direction: "Village Edge",
          gpsZone: "East Field",
          matrixRowIndex: 2,
          learning: { visits: 45, successful: "Monkey Distress Call", successRate: 79, exitTime: 15 },
          reasons: [
            "Species identified as Monkey herd.",
            `Crop configured as ${currentCrop}.`,
            "High spatial agility detected in tree line.",
            "Monkey distress calls broadcasted over speaker.",
            "Visual high-frequency flash lights active.",
            currentCrop === "Cotton" ? "Sprinkler disabled (Cotton Crop)." : "Sprinkler active (overhead spray).",
            "Farmer alerted of active intrusion."
          ],
          tree: [
            "Wildlife Detected",
            "Monkey",
            "Threat Level: Moderate",
            `Crop: ${currentCrop}`,
            currentCrop === "Cotton" ? "Sprinkler Disabled" : "Sprinkler Enabled",
            "Play Monkey Distress Call",
            "Flash Lights",
            "Notify Farmer"
          ]
        };
      case "Deer":
        return {
          threatScore: 35,
          threatStatus: "LOW THREAT",
          threatColor: "text-green-500 bg-green-500/10 border-green-500/20",
          threatBg: "bg-green-500",
          count: 2,
          speed: "Grazing",
          direction: "River Edge",
          gpsZone: "South Field",
          matrixRowIndex: 3,
          learning: { visits: 18, successful: "Soft Flash Lights", successRate: 83, exitTime: 35 },
          reasons: [
            "Species identified as Deer.",
            `Crop configured as ${currentCrop}.`,
            "Soft flash lights triggered to gently deter.",
            "Acoustic siren bypassed to prevent panic run.",
            "Farmer alerted via app.",
            "Camera recording saved for log."
          ],
          tree: [
            "Wildlife Detected",
            "Deer",
            "Threat Level: Low",
            `Crop: ${currentCrop}`,
            "Soft Flash Lights",
            "Farmer Alert"
          ]
        };
      case "Nilgai":
        return {
          threatScore: 52,
          threatStatus: "MODERATE",
          threatColor: "text-amber-500 bg-amber-500/10 border-amber-500/20",
          threatBg: "bg-amber-500",
          count: 1,
          speed: "Walking",
          direction: "Crop Center",
          gpsZone: "South-East",
          matrixRowIndex: 9, // Doesn't match direct matrix index but highlighted
          learning: { visits: 9, successful: "Directional Speaker", successRate: 72, exitTime: 55 },
          reasons: [
            "Species identified as Nilgai.",
            `Crop configured as ${currentCrop}.`,
            "Directional speaker playing human shouting audio.",
            "Visual strobe flash active.",
            currentCrop === "Cotton" ? "Sprinkler disabled (Cotton Crop)." : "Sprinkler active (Water jets).",
            "Farmer app notification dispatched."
          ],
          tree: [
            "Wildlife Detected",
            "Nilgai",
            "Threat Level: Moderate",
            `Crop: ${currentCrop}`,
            currentCrop === "Cotton" ? "Sprinkler Disabled" : "Sprinkler Enabled",
            "Activate Directional Speaker",
            "Strobe Lights Active",
            "Notify Farmer"
          ]
        };
      case "Stray Cattle":
        return {
          threatScore: 28,
          threatStatus: "LOW THREAT",
          threatColor: "text-green-500 bg-green-500/10 border-green-500/20",
          threatBg: "bg-green-500",
          count: 2,
          speed: "Grazing",
          direction: "Farm Path",
          gpsZone: "South-West",
          matrixRowIndex: 4,
          learning: { visits: 31, successful: "Local Buzzer", successRate: 68, exitTime: 110 },
          reasons: [
            "Species identified as Stray Cattle.",
            `Crop configured as ${currentCrop}.`,
            "High risk of crop ingestion.",
            "Local buzzer activated to urge movement.",
            "Farmer notified for manual removal.",
            "Forest department alert bypassed (domestic species)."
          ],
          tree: [
            "Wildlife Detected",
            "Stray Cattle",
            "Threat Level: Low",
            `Crop: ${currentCrop}`,
            "Local Buzzer ON",
            "Farmer Notification",
            "No Forest Alert"
          ]
        };
      default:
        return {
          threatScore: 10,
          threatStatus: "STABLE",
          threatColor: "text-slate-500 bg-slate-500/10 border-slate-500/20",
          threatBg: "bg-slate-500",
          count: 0,
          speed: "N/A",
          direction: "N/A",
          gpsZone: "N/A",
          matrixRowIndex: -1,
          learning: { visits: 0, successful: "None", successRate: 0, exitTime: 0 },
          reasons: ["No active threat detected."],
          tree: ["Perimeter Scan", "All Clear"]
        };
    }
  };

  const specConfig = getSpeciesConfig();

  // 2. Animated confidence counter
  const [animatedConfidence, setAnimatedConfidence] = useState(0);
  useEffect(() => {
    if (simulationState >= 2 && simulationState <= 4) {
      let start = 0;
      const end = activeScenario.confidenceMax || 98.6;
      const duration = 1200; // ms
      const stepTime = Math.abs(Math.floor(duration / end));
      
      const timer = setInterval(() => {
        start += 1;
        if (start > end) {
          setAnimatedConfidence(end);
          clearInterval(timer);
        } else {
          setAnimatedConfidence(parseFloat(start.toFixed(1)));
        }
      }, stepTime);
      return () => clearInterval(timer);
    } else {
      setAnimatedConfidence(0);
    }
  }, [simulationState, activeScenario.species]);

  // 3. Actuators states mapping based on Species + Crop
  const getActuatorState = (actuator) => {
    if (simulationState < 3) return { state: "OFF", color: "bg-slate-800 text-slate-400" };
    
    // Crop-Aware Sprinkler override
    if (actuator === "Sprinkler") {
      if (currentCrop === "Cotton") {
        return { state: "DISABLED", color: "bg-red-500/10 border border-red-500/30 text-red-500 font-bold" };
      }
      // If other crops, check if scenario uses sprinkler
      const usesSprinkler = activeScenario.actuators.sprinkler || activeScenario.species === "Elephant" || activeScenario.species === "Wild Boar" || activeScenario.species === "Monkey";
      return usesSprinkler 
        ? { state: "ON", color: "bg-green-500 text-slate-950 font-bold" }
        : { state: "OFF", color: "bg-slate-800 text-slate-400" };
    }

    if (actuator === "Floodlights") {
      const usesFlood = activeScenario.actuators.floodlight || activeScenario.species === "Elephant" || activeScenario.species === "Wild Boar" || activeScenario.species === "Monkey" || activeScenario.species === "Deer";
      return usesFlood
        ? { state: "ON", color: "bg-green-500 text-slate-950 font-bold" }
        : { state: "OFF", color: "bg-slate-800 text-slate-400" };
    }

    if (actuator === "Speaker") {
      const usesSpeaker = activeScenario.actuators.speaker || activeScenario.species === "Elephant" || activeScenario.species === "Wild Boar" || activeScenario.species === "Monkey" || activeScenario.species === "Nilgai" || activeScenario.species === "Stray Cattle";
      return usesSpeaker
        ? { state: "ON", color: "bg-green-500 text-slate-950 font-bold" }
        : { state: "OFF", color: "bg-slate-800 text-slate-400" };
    }

    if (actuator === "ForestAlert") {
      return activeScenario.species === "Elephant"
        ? { state: "SENT", color: "bg-blue-500 text-white font-bold" }
        : { state: "OFF", color: "bg-slate-800 text-slate-400" };
    }

    if (actuator === "FarmerAlert") {
      return { state: "SENT", color: "bg-blue-500 text-white font-bold" };
    }

    if (actuator === "CameraTracking") {
      return simulationState >= 2 && simulationState <= 4
        ? { state: "ACTIVE", color: "bg-blue-500 text-white font-bold" }
        : { state: "OFF", color: "bg-slate-800 text-slate-400" };
    }

    return { state: "OFF", color: "bg-slate-800 text-slate-400" };
  };

  // Matrix data for Section 5
  const matrixData = [
    { species: "Elephant", emoji: "🐘", primary: "Directional LED Flood Lights", secondary: "Directional Speaker", reason: "Avoid village-wide noise" },
    { species: "Wild Boar", emoji: "🐗", primary: "Predator Audio", secondary: "LED Flashing Lights", reason: "Sensitive to predator sounds" },
    { species: "Monkey", emoji: "🐒", primary: "Monkey Distress Call", secondary: "Visual Flash", reason: "Avoid crop damage" },
    { species: "Deer", emoji: "🦌", primary: "Soft Flash Lights", secondary: "Farmer Alert", reason: "Avoid panic response" },
    { species: "Stray Cattle", emoji: "🐄", primary: "Mobile Notification", secondary: "Local Buzzer", reason: "Manual removal required" }
  ];

  return (
    <aside className="w-[400px] bg-[#090d16]/95 border-l border-slate-900 flex flex-col fixed top-16 right-0 bottom-0 z-30 p-4 space-y-4 overflow-y-auto select-none backdrop-blur-md">
      
      {/* BRAND HEADER */}
      <div className="flex items-center justify-between border-b border-slate-900 pb-3">
        <div className="flex items-center gap-2">
          <Cpu className="h-4.5 w-4.5 text-green-500" />
          <h2 className="text-sm font-black text-slate-100 tracking-wider font-sans uppercase">
            AI DECISION ENGINE
          </h2>
        </div>
        <span className="text-[8px] font-mono font-bold text-green-500 bg-green-500/10 px-1.5 py-0.5 rounded border border-green-500/20">
          V11.2 INF
        </span>
      </div>

      {/* CROP CONFIGURATION SELECTOR DROPDOWN */}
      <div className="bg-[#111827]/40 border border-slate-900/60 rounded-xl p-3 space-y-2">
        <div className="flex justify-between items-center text-[10px] font-mono">
          <span className="text-slate-400 uppercase font-bold">Crop Configuration</span>
          <span className="text-[8px] text-green-500">Live Feedback</span>
        </div>
        <div className="relative">
          <select
            value={currentCrop}
            onChange={(e) => setCurrentCrop(e.target.value)}
            className="w-full bg-[#030712] border border-slate-800 rounded-lg py-1.5 px-3 text-xs font-semibold text-slate-100 font-sans focus:outline-none focus:border-green-500 cursor-pointer"
          >
            <option value="Cotton">Cotton (High Sensitivity - Sprinkler Guard)</option>
            <option value="Rice">Rice (Low Sensitivity - Water OK)</option>
            <option value="Sugarcane">Sugarcane (Medium Sensitivity - Water OK)</option>
            <option value="Vegetables">Vegetables (High Sensitivity - Water OK)</option>
          </select>
        </div>
      </div>

      {/* SECTION 1: CURRENT DETECTION */}
      <div className="bg-[#111827]/40 border border-slate-900/60 rounded-xl p-3 space-y-3">
        <div className="text-[10px] font-bold font-sans text-slate-400 uppercase tracking-wider border-b border-slate-900 pb-1.5 flex justify-between items-center">
          <span>Current Detection</span>
          {simulationState >= 2 && simulationState <= 4 && (
            <span className="flex items-center gap-1 text-[8px] font-mono text-red-500 animate-pulse">
              <span className="h-1.5 w-1.5 rounded-full bg-red-500" />
              BREACH DETECTED
            </span>
          )}
        </div>

        {simulationState > 0 ? (
          <div className="flex gap-3">
            {/* Image / Bounding Box viewport */}
            <div className="relative w-24 h-24 bg-slate-950 rounded-lg border border-slate-900 overflow-hidden flex items-center justify-center shrink-0 crt-overlay">
              {simulationState >= 2 && simulationState <= 4 && (
                <motion.div
                  initial={{ scale: 1.1, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="absolute inset-1.5 border-2 border-red-500 rounded-md pointer-events-none z-10"
                />
              )}
              {/* Fallback image */}
              <img
                src={
                  activeScenario.species === "Elephant" ? "/christoffer-brus-7hGF4emWkXs-unsplash.jpg" :
                  activeScenario.species === "Wild Boar" ? "/ed-van-duijn-414NZVxzc20-unsplash.jpg" :
                  activeScenario.species === "Monkey" ? "https://images.unsplash.com/photo-1540573133985-87b6da6d54a9?q=80&w=200&auto=format&fit=crop" :
                  activeScenario.species === "Deer" ? "https://images.unsplash.com/photo-1484406566174-9da000fda645?q=80&w=200&auto=format&fit=crop" :
                  activeScenario.species === "Nilgai" ? "https://images.unsplash.com/photo-1589656966895-2f33e7653819?q=80&w=200&auto=format&fit=crop" :
                  activeScenario.species === "Stray Cattle" ? "https://images.unsplash.com/photo-1570042225831-d98fa7577f1e?q=80&w=200&auto=format&fit=crop" :
                  "https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=200&auto=format&fit=crop"
                }
                alt={activeScenario.species}
                className="w-full h-full object-cover filter brightness-[0.75] contrast-[1.15]"
              />
              <span className="absolute bottom-1 right-1 text-xs select-none z-10 filter drop-shadow">
                {activeScenario.emoji}
              </span>
            </div>

            {/* Info Grid */}
            <div className="flex-1 min-w-0 text-[10px] font-mono space-y-1 text-left">
              <div className="flex justify-between">
                <span className="text-slate-500">Species:</span>
                <span className="text-slate-200 font-sans font-bold">{getSpeciesTranslated(activeScenario.species)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Confidence:</span>
                <span className="text-green-500 font-bold">
                  {simulationState >= 2 ? `${animatedConfidence}%` : "0%"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Camera:</span>
                <span className="text-slate-300">CAM-0{activeScenario.nodeId}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Distance:</span>
                <span className="text-slate-300">
                  {simulationState >= 2 ? `${specConfig.threatScore - 55} meters` : "N/A"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Direction:</span>
                <span className="text-slate-300">{specConfig.direction}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Timestamp:</span>
                <span className="text-slate-400">10:23:15 PM</span>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-6 text-slate-500 font-mono text-[10px] italic">
            Scanning perimeter... No breach active.
          </div>
        )}
      </div>

      {/* SECTION 2: THREAT ANALYSIS */}
      <div className="bg-[#111827]/40 border border-slate-900/60 rounded-xl p-3 space-y-3">
        <div className="text-[10px] font-bold font-sans text-slate-400 uppercase tracking-wider border-b border-slate-900 pb-1.5">
          Threat Analysis
        </div>
        {simulationState >= 2 && simulationState <= 4 ? (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono text-slate-400">Threat Index:</span>
              <span className={`text-[10px] font-bold font-mono px-2 py-0.5 rounded border ${specConfig.threatColor}`}>
                {specConfig.threatStatus} ({specConfig.threatScore}/100)
              </span>
            </div>
            {/* Animated gauge bar filling up */}
            <div className="h-2 w-full bg-slate-950 rounded-full overflow-hidden">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${specConfig.threatScore}%` }}
                transition={{ duration: 1, ease: "easeOut" }}
                className={`h-full rounded-full ${specConfig.threatBg}`}
              />
            </div>
          </div>
        ) : (
          <div className="text-center py-2 text-slate-500 font-mono text-[10px] italic">
            Monitoring threat parameters...
          </div>
        )}
      </div>

      {/* SECTION 3: CONTEXT ANALYSIS */}
      <div className="bg-[#111827]/40 border border-slate-900/60 rounded-xl p-3 space-y-3">
        <div className="text-[10px] font-bold font-sans text-slate-400 uppercase tracking-wider border-b border-slate-900 pb-1.5">
          Context Analysis
        </div>
        {simulationState >= 2 && simulationState <= 4 ? (
          <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-[9px] font-mono text-left">
            <div><span className="text-slate-500">Current Crop:</span> <span className="text-slate-200">{currentCrop}</span></div>
            <div><span className="text-slate-500">Crop Sensitivity:</span> <span className="text-slate-200">High</span></div>
            <div><span className="text-slate-500">Weather:</span> <span className="text-slate-200">Cloudy</span></div>
            <div><span className="text-slate-500">Visibility:</span> <span className="text-slate-200">Low</span></div>
            <div><span className="text-slate-500 font-sans">Village Dist:</span> <span className="text-slate-200">120m</span></div>
            <div><span className="text-slate-500">Farmer House:</span> <span className="text-slate-200">310m</span></div>
            <div><span className="text-slate-500">Count:</span> <span className="text-slate-200 font-sans">{specConfig.count}</span></div>
            <div><span className="text-slate-500">Speed:</span> <span className="text-slate-200">{specConfig.speed}</span></div>
            <div><span className="text-slate-500">Zone:</span> <span className="text-slate-300 font-bold">{specConfig.gpsZone}</span></div>
            <div><span className="text-slate-500">Intrusion History:</span> <span className="text-amber-500">Yes</span></div>
          </div>
        ) : (
          <div className="text-center py-2 text-slate-500 font-mono text-[10px] italic">
            Awaiting environmental context...
          </div>
        )}
      </div>

      {/* SECTION 4: DECISION REASONING TREE */}
      <div className="bg-[#111827]/40 border border-slate-900/60 rounded-xl p-3 space-y-3 text-left">
        <div className="text-[10px] font-bold font-sans text-slate-400 uppercase tracking-wider border-b border-slate-900 pb-1.5">
          Decision Reasoning Tree
        </div>
        {simulationState >= 2 && simulationState <= 4 ? (
          <div className="space-y-1">
            {specConfig.tree.map((step, index) => (
              <motion.div
                key={step}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.3 }}
                className="flex items-center gap-1.5 text-[9px] font-mono text-slate-400"
              >
                {index > 0 && <span className="text-slate-600 pl-2">↳</span>}
                <span className={`px-1.5 py-0.5 rounded border leading-none ${
                  index === 0 ? "bg-slate-950 border-slate-900 text-slate-300 font-bold" :
                  step.includes("Threat") ? "bg-red-500/10 border-red-500/20 text-red-400 font-bold" :
                  step.includes("Crop") ? "bg-blue-500/10 border-blue-500/20 text-blue-400 font-bold" :
                  step.includes("Disabled") || step.includes("Avoid") ? "bg-amber-500/10 border border-amber-500/20 text-amber-400 font-extrabold" :
                  step.includes("Notify") || step.includes("Activate") ? "bg-green-500/10 border-green-500/20 text-green-400" :
                  "bg-slate-900/60 border-slate-800 text-slate-300"
                }`}>
                  {step}
                </span>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="text-center py-2 text-slate-500 font-mono text-[10px] italic">
            Tree idle.
          </div>
        )}
      </div>

      {/* SECTION 5: SPECIES SPECIFIC DECISION MATRIX */}
      <div className="bg-[#111827]/40 border border-slate-900/60 rounded-xl p-3 space-y-3">
        <div className="text-[10px] font-bold font-sans text-slate-400 uppercase tracking-wider border-b border-slate-900 pb-1.5">
          Species Specific Decision Matrix
        </div>
        <div className="overflow-x-auto text-[8px] font-mono">
          <table className="w-full text-left">
            <thead>
              <tr className="text-slate-500 border-b border-slate-900 h-6">
                <th>Species</th>
                <th>Primary</th>
                <th>Secondary</th>
                <th>Reason</th>
              </tr>
            </thead>
            <tbody>
              {matrixData.map((row, index) => {
                const isHighlighted = activeScenario.species === row.species && simulationState >= 2 && simulationState <= 4;
                return (
                  <tr 
                    key={index} 
                    className={`border-b border-slate-900 h-7 transition-all duration-300 ${
                      isHighlighted 
                        ? 'bg-green-500/10 border-green-500/30 text-green-400 font-bold' 
                        : 'text-slate-500'
                    }`}
                  >
                    <td>{row.emoji} {row.species}</td>
                    <td>{row.primary}</td>
                    <td>{row.secondary}</td>
                    <td>{row.reason}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* SECTION 6: DETERRENT EXECUTION */}
      <div className="bg-[#111827]/40 border border-slate-900/60 rounded-xl p-3 space-y-3">
        <div className="text-[10px] font-bold font-sans text-slate-400 uppercase tracking-wider border-b border-slate-900 pb-1.5">
          Deterrent Execution
        </div>
        <div className="grid grid-cols-2 gap-3">
          {[
            { label: "Flood Lights", key: "Floodlights" },
            { label: "Speaker", key: "Speaker" },
            { label: "Sprinkler", key: "Sprinkler" },
            { label: "Forest Alert", key: "ForestAlert" },
            { label: "Farmer Alert", key: "FarmerAlert" },
            { label: "Camera Tracking", key: "CameraTracking" }
          ].map((item) => {
            const status = getActuatorState(item.key);
            return (
              <div 
                key={item.key}
                className="bg-slate-950/60 border border-slate-900 rounded-lg p-2 flex flex-col justify-between h-14 text-left"
              >
                <span className="text-[9px] font-mono text-slate-500">{item.label}</span>
                <div className="flex justify-between items-center">
                  <span className={`px-1.5 py-0.5 rounded text-[8px] font-extrabold uppercase ${status.color}`}>
                    {status.state}
                  </span>
                  {/* Small animated indicator */}
                  {status.state === "ON" || status.state === "ACTIVE" ? (
                    <span className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />
                  ) : status.state === "SENT" ? (
                    <Check className="h-3 w-3 text-blue-500" />
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* SECTION 7: WHY DID AI CHOOSE THIS RESPONSE? */}
      <div className="bg-[#111827]/40 border border-slate-900/60 rounded-xl p-3 space-y-3 text-left">
        <div className="text-[10px] font-bold font-sans text-slate-400 uppercase tracking-wider border-b border-slate-900 pb-1.5">
          Why Did AI Choose This Response?
        </div>
        {simulationState >= 2 && simulationState <= 4 ? (
          <div className="space-y-1.5">
            {specConfig.reasons.map((reason, index) => (
              <motion.div 
                key={index}
                initial={{ opacity: 0, x: -5 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.15 }}
                className="flex items-start gap-1.5 text-[9px] font-mono text-slate-300"
              >
                <span className="text-green-500 font-bold shrink-0">✓</span>
                <span>{reason}</span>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="text-center py-2 text-slate-500 font-mono text-[10px] italic">
            Awaiting decision execution...
          </div>
        )}
      </div>

      {/* SECTION 8: AI CONFIDENCE */}
      <div className="bg-[#111827]/40 border border-slate-900/60 rounded-xl p-3 space-y-3">
        <div className="text-[10px] font-bold font-sans text-slate-400 uppercase tracking-wider border-b border-slate-900 pb-1.5">
          AI Confidence & System Stats
        </div>
        <div className="grid grid-cols-3 gap-2 text-center text-[9px] font-mono">
          <div className="bg-slate-950/60 border border-slate-900 rounded p-1.5">
            <span className="text-slate-500 block">Detect Conf</span>
            <span className="text-green-500 font-bold">{simulationState >= 2 ? `${activeScenario.confidenceMax}%` : "0%"}</span>
          </div>
          <div className="bg-slate-950/60 border border-slate-900 rounded p-1.5">
            <span className="text-slate-500 block">Decide Conf</span>
            <span className="text-green-500 font-bold">{simulationState >= 2 ? "95%" : "0%"}</span>
          </div>
          <div className="bg-slate-950/60 border border-slate-900 rounded p-1.5">
            <span className="text-slate-500 block">Risk Predict</span>
            <span className="text-amber-500 font-bold">{simulationState >= 2 ? "91%" : "0%"}</span>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-[9px] font-mono text-left pt-1">
          <div><span className="text-slate-500">Model:</span> <span className="text-slate-300">YOLOv11m</span></div>
          <div><span className="text-slate-500">Inference Time:</span> <span className="text-slate-300">182 ms</span></div>
          <div><span className="text-slate-500">GPU Usage:</span> <span className="text-slate-300">42%</span></div>
          <div><span className="text-slate-500">VRAM Allocation:</span> <span className="text-slate-300">2.4 GB</span></div>
          <div><span className="text-slate-500">Frames Per Second:</span> <span className="text-slate-300">28 FPS</span></div>
        </div>
      </div>

      {/* SECTION 9: LEARNING LOG */}
      <div className="bg-[#111827]/40 border border-slate-900/60 rounded-xl p-3 space-y-3 text-left">
        <div className="text-[10px] font-bold font-sans text-slate-400 uppercase tracking-wider border-b border-slate-900 pb-1.5">
          Learning Log (Adaptive AI)
        </div>
        {simulationState >= 2 && simulationState <= 4 ? (
          <div className="space-y-1 text-[9px] font-mono text-slate-400">
            <div><span className="text-slate-500">Previous Visits:</span> <span className="text-slate-200">{specConfig.learning.visits}</span></div>
            <div><span className="text-slate-500 font-sans">Most Successful:</span> <span className="text-green-400 font-sans font-bold">{specConfig.learning.successful}</span></div>
            <div><span className="text-slate-500">Historical Success Rate:</span> <span className="text-green-500 font-bold">{specConfig.learning.successRate}%</span></div>
            <div><span className="text-slate-500 font-sans">Avg Exit Time:</span> <span className="text-slate-300">{specConfig.learning.exitTime} seconds</span></div>
            <div className="border-t border-slate-900 pt-1.5 mt-1.5">
              <span className="text-slate-500">Recommendation:</span> <span className="text-blue-400 block font-sans font-bold mt-0.5">Continue Current Strategy</span>
            </div>
          </div>
        ) : (
          <div className="text-center py-2 text-slate-500 font-mono text-[10px] italic">
            Scanning historical databases...
          </div>
        )}
      </div>

      {/* SECTION 10: ANIMATED TIMELINE */}
      <div className="bg-[#111827]/40 border border-slate-900/60 rounded-xl p-3 space-y-3 text-left">
        <div className="text-[10px] font-bold font-sans text-slate-400 uppercase tracking-wider border-b border-slate-900 pb-1.5">
          Animated Decision Timeline
        </div>
        <div className="flex flex-col gap-1.5 text-[9px] font-mono pl-2">
          {[
            { label: "Motion Detection", stateMin: 1 },
            { label: "Camera Frame Capture", stateMin: 2 },
            { label: "Species Classification", stateMin: 2 },
            { label: "Threat Assessment", stateMin: 2 },
            { label: "Decision Engine Logic", stateMin: 3 },
            { label: "Deterrent Activation", stateMin: 3 },
            { label: "Perimeter Monitoring", stateMin: 3 },
            { label: "Animal Repelled / Exit", stateMin: 5 }
          ].map((item, index) => {
            const isCompleted = simulationState >= item.stateMin;
            return (
              <div key={index} className="flex items-center gap-2">
                <span className={`h-2 w-2 rounded-full border transition-all duration-300 ${
                  isCompleted 
                    ? "bg-green-500 border-green-400 shadow-[0_0_6px_rgba(34,197,94,0.6)]" 
                    : "bg-slate-950 border-slate-800"
                }`} />
                <span className={isCompleted ? "text-green-400 font-semibold" : "text-slate-500"}>
                  {item.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>

    </aside>
  );
}
