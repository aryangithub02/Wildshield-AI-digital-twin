import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  GitFork, Cpu, Zap, Check, AlertTriangle, ShieldAlert, 
  HelpCircle, Settings, Play, Pause, Database, Sparkles, AlertCircle, Volume2
} from 'lucide-react';
import { getTranslation } from '../utils/translations';
import { getMappingByAnimalName, DETERRENT_SOUNDS } from '../data/deterrentSoundsData';
import { dispatchAnimalDetectionUrl } from '../utils/animalUrlDispatcher';
import ErrorBoundary from './ErrorBoundary';

export default function DecisionMatrixTab({ simulationState, currentScenario, language }) {
  return (
    <ErrorBoundary title="Decision Matrix Tab">
      <DecisionMatrixInner simulationState={simulationState} currentScenario={currentScenario} language={language} />
    </ErrorBoundary>
  );
}

function DecisionMatrixInner({ simulationState, currentScenario, language }) {
  const t = (key) => getTranslation(language, key);

  // User interactive testing state
  const [selectedSpecies, setSelectedSpecies] = useState('Elephant');
  const [selectedCrop, setSelectedCrop] = useState('Cotton');
  const [playingSoundId, setPlayingSoundId] = useState(null);
  const audioPlayerRef = useRef(null);

  const playDeterrentSound = (soundId) => {
    try {
      if (!audioPlayerRef.current) {
        audioPlayerRef.current = new Audio();
      }
      const audio = audioPlayerRef.current;

      if (playingSoundId === soundId) {
        audio.pause();
        setPlayingSoundId(null);
        return;
      }

      const sound = DETERRENT_SOUNDS[soundId] || DETERRENT_SOUNDS['0004'];
      if (sound) {
        audio.pause();
        audio.src = sound.path;
        audio.currentTime = 0;
        audio.play().then(() => {
          setPlayingSoundId(soundId);
          dispatchAnimalDetectionUrl(selectedSpecies, {
            threat: sound.threatLevel,
            confidence: 96.0,
            nodeName: "Decision Matrix"
          }, true);
        }).catch(e => console.warn("Audio play prevented:", e));
        audio.onended = () => setPlayingSoundId(null);
      }
    } catch (err) {
      console.warn("Audio play error:", err);
      setPlayingSoundId(null);
    }
  };

  // ALL 10 ANIMALS + HUMAN (11 TOTAL)
  const speciesOptions = [
    { name: 'Elephant', emoji: '🐘' },
    { name: 'Wild Boar', emoji: '🐗' },
    { name: 'Deer', emoji: '🦌' },
    { name: 'Nilgai', emoji: '🐂' },
    { name: 'Monkey', emoji: '🐒' },
    { name: 'Leopard', emoji: '🐆' },
    { name: 'Bear', emoji: '🐻' },
    { name: 'Cattle', emoji: '🐄' },
    { name: 'Goat', emoji: '🐐' },
    { name: 'Wild Dogs', emoji: '🐕' },
    { name: 'Human', emoji: '🚶' }
  ];

  // Full Matrix Data for all 10 Animals + Human
  const matrixData = [
    { 
      species: "Elephant", 
      emoji: "🐘", 
      threat: "CRITICAL (98/100)", 
      primary: "Directional Floodlights", 
      secondary: "Track 0004 Acoustic Blast", 
      reason: "Bypasses village-wide sirens to avoid human panic near borders while repelling megafauna.",
      actions: ["LED Floodlights", "Track 0004 Speaker Blast", "Notify Forest Office & Farmer", "Sprinkler Override"]
    },
    { 
      species: "Wild Boar", 
      emoji: "🐗", 
      threat: "HIGH (92/100)", 
      primary: "Track 0003 Bio-Acoustic", 
      secondary: "LED Flashing Strobes", 
      reason: "Rapid multi-frequency pitch shift prevents habituation in crop-destroying sounders.",
      actions: ["Track 0003 Acoustic Burst", "100Hz LED Strobes", "Sprinkler Water Jets", "Farmer Push Alert"]
    },
    { 
      species: "Deer", 
      emoji: "🦌", 
      threat: "MEDIUM (58/100)", 
      primary: "Track 0002 Soft Resonance", 
      secondary: "Soft Flashing Lights", 
      reason: "Soft visuals and gentle resonance deter safely; loud sirens cause erratic panic charges.",
      actions: ["Track 0002 Resonance", "Low-Intensity LED Strobes", "Camera Recording", "Notify Farmer"]
    },
    { 
      species: "Nilgai", 
      emoji: "🐂", 
      threat: "HIGH (84/100)", 
      primary: "Track 0003 Staccato Burst", 
      secondary: "Directional Floodlight", 
      reason: "Disperses large herbivore herds from pulse and cereal standing crops.",
      actions: ["Track 0003 Audio Burst", "Directional Floodlight", "Notify Farmer", "Boundary Guard"]
    },
    { 
      species: "Monkey", 
      emoji: "🐒", 
      threat: "HIGH (80/100)", 
      primary: "Track 0003 Distress Burst", 
      secondary: "Overhead Mist Sprinkler", 
      reason: "Triggers social troop flight reflex without damaging orchard tree canopies.",
      actions: ["Track 0003 Distress Audio", "High-frequency Visual Flash", "Sprinkler Mist", "Farmer App Alert"]
    },
    { 
      species: "Leopard", 
      emoji: "🐆", 
      threat: "CRITICAL (96/100)", 
      primary: "Track 0004 High-Impact Wave", 
      secondary: "360° Perimeter Strobe", 
      reason: "Apex carnivore detected near homestead/shed. Triggers immediate village audio alert.",
      actions: ["Track 0004 Acoustic Wave", "360° Floodlights", "SMS Alert to Village", "Forest Dept Broadcast"]
    },
    { 
      species: "Bear", 
      emoji: "🐻", 
      threat: "CRITICAL (95/100)", 
      primary: "Track 0001 Ultrasonic Repellent", 
      secondary: "Directional Strobe", 
      reason: "Ultrasonic sweep tuned specifically for large predators and sloth bears.",
      actions: ["Track 0001 Ultrasonic Sweep", "Directional Strobe", "Emergency Push Alert", "Bypass Village Siren"]
    },
    { 
      species: "Cattle", 
      emoji: "🐄", 
      threat: "LOW THREAT (28/100)", 
      primary: "Track 0004 Mild Tone", 
      secondary: "Sprinkler Mist", 
      reason: "Domestic livestock breach requires gentle herding push; sirens bypassed.",
      actions: ["Track 0004 Low Volume", "Sprinkler Mist", "Notify Farmer for manual herding"]
    },
    { 
      species: "Goat", 
      emoji: "🐐", 
      threat: "LOW THREAT (22/100)", 
      primary: "Track 0004 Local Buzzer", 
      secondary: "Farmer Notification", 
      reason: "Gentle acoustic redirection from seedling beds without distress.",
      actions: ["Track 0004 Buzzer", "Low Pressure Sprinkler", "Farmer Notification"]
    },
    { 
      species: "Wild Dogs", 
      emoji: "🐕", 
      threat: "HIGH (82/100)", 
      primary: "Track 0003 Canine Disruptor", 
      secondary: "LED Strobe Flash", 
      reason: "Multi-frequency pulses disrupt canine pack coordination around livestock pens.",
      actions: ["Track 0003 Canine Disruptor", "LED Strobes", "Livestock Pen Guard", "Notify Farmer"]
    },
    { 
      species: "Human", 
      emoji: "🚶", 
      threat: "SECURITY ALERT (88/100)", 
      primary: "Security Floodlight", 
      secondary: "Track 0002 Calm Voice Protocol", 
      reason: "Farm security alert. Loud sirens bypassed to prevent panic; soft voice announcement active.",
      actions: ["Floodlight Illumination", "Voice Warning (Track 0002)", "Farmer Push Alert", "Record Security Video"]
    }
  ];

  // Dynamic decision flow based on selections
  const getDecisionPath = () => {
    const isCotton = selectedCrop === 'Cotton';
    const sprinklerState = isCotton ? "DISABLED (Cotton Guard)" : "ENABLED";
    const mapping = getMappingByAnimalName(selectedSpecies) || {};
    const trackId = mapping.suggestedSoundId || "0004";
    const audioFile = mapping.audioFile || "0004.mp3";
    
    switch (selectedSpecies) {
      case "Elephant":
        return [
          { label: "Wildlife Detected", val: "🐘 Elephant", status: "ok" },
          { label: "Threat Assessment", val: "Critical (98%)", status: "warn" },
          { label: "Target Crop", val: `${selectedCrop} (${isCotton ? 'Sensitive' : 'Standard'})`, status: "info" },
          { label: "Sprinkler Circuit", val: sprinklerState, status: isCotton ? "error" : "ok" },
          { label: "Suggested Audio", val: `Track ${trackId} (${audioFile})`, status: "ok" },
          { label: "Village Proximity", val: "Within 200m (Bypass Loud Siren)", status: "warn" },
          { label: "Primary Deterrent", val: "Directional LED Flood Lights", status: "ok" },
          { label: "System Notification", val: "Alert Farmer & Forest Department", status: "info" }
        ];
      case "Wild Boar":
        return [
          { label: "Wildlife Detected", val: "🐗 Wild Boar", status: "ok" },
          { label: "Threat Assessment", val: "High (92%)", status: "warn" },
          { label: "Sprinkler Circuit", val: sprinklerState, status: isCotton ? "error" : "ok" },
          { label: "Suggested Audio", val: `Track ${trackId} (${audioFile}) Bio-Acoustic`, status: "ok" },
          { label: "Secondary Deterrent", val: "LED Flash Strobes (100Hz)", status: "ok" },
          { label: "System Notification", val: "Push Alert to Farmer App", status: "info" }
        ];
      case "Deer":
        return [
          { label: "Wildlife Detected", val: "🦌 Deer", status: "ok" },
          { label: "Threat Assessment", val: "Medium (58%)", status: "info" },
          { label: "Panic Guard", val: "Avoid Sudden Siren (Fence Protection)", status: "warn" },
          { label: "Suggested Audio", val: `Track ${trackId} (${audioFile}) Resonance`, status: "ok" },
          { label: "Primary Deterrent", val: "Soft Flashing Lights", status: "ok" },
          { label: "System Notification", val: "Log Detection & Notify Farmer", status: "info" }
        ];
      case "Nilgai":
        return [
          { label: "Wildlife Detected", val: "🐂 Nilgai (Blue Bull)", status: "ok" },
          { label: "Threat Assessment", val: "High (84%)", status: "warn" },
          { label: "Crop Impact", val: "Pulse / Cereal Grazing Risk", status: "warn" },
          { label: "Suggested Audio", val: `Track ${trackId} (${audioFile}) Multi-Tonal`, status: "ok" },
          { label: "Secondary Deterrent", val: "Directional Floodlight", status: "ok" },
          { label: "System Notification", val: "Farmer Boundary Alert", status: "info" }
        ];
      case "Monkey":
        return [
          { label: "Wildlife Detected", val: "🐒 Monkey", status: "ok" },
          { label: "Threat Assessment", val: "High (80%)", status: "warn" },
          { label: "Canopy Raiding", val: "Fruit Tree & Orchard Threat", status: "warn" },
          { label: "Suggested Audio", val: `Track ${trackId} (${audioFile}) Distress Tone`, status: "ok" },
          { label: "Sprinkler Mist", val: isCotton ? "Disabled" : "Active Mist Spray", status: "ok" },
          { label: "System Notification", val: "Alert Orchard Workers", status: "info" }
        ];
      case "Leopard":
        return [
          { label: "Wildlife Detected", val: "🐆 Leopard (Apex Predator)", status: "ok" },
          { label: "Threat Assessment", val: "Critical (96%)", status: "error" },
          { label: "Safety Protocol", val: "Immediate Homestead Lockdown", status: "error" },
          { label: "Suggested Audio", val: `Track ${trackId} (${audioFile}) High Impact`, status: "ok" },
          { label: "Primary Deterrent", val: "360° Strobe Flash + Directional Blast", status: "ok" },
          { label: "System Notification", val: "Emergency SMS to Village & Forest Office", status: "info" }
        ];
      case "Bear":
        return [
          { label: "Wildlife Detected", val: "🐻 Bear (Sloth Bear)", status: "ok" },
          { label: "Threat Assessment", val: "Critical (95%)", status: "warn" },
          { label: "Suggested Audio", val: `Track ${trackId} (${audioFile}) Ultrasonic Sweep`, status: "ok" },
          { label: "Deterrent Safety", val: "Directional Strobe (Non-Contact)", status: "ok" },
          { label: "System Notification", val: "Alert Farmer & Forest Rangers", status: "info" }
        ];
      case "Cattle":
        return [
          { label: "Wildlife Detected", val: "🐄 Cattle (Domestic)", status: "ok" },
          { label: "Threat Assessment", val: "Low (28%)", status: "info" },
          { label: "Suggested Audio", val: `Track ${trackId} (${audioFile}) Mild Push`, status: "ok" },
          { label: "Primary Deterrent", val: "Gentle Sprinkler Mist", status: "ok" },
          { label: "System Notification", val: "Alert Farmer for Manual Herding", status: "info" }
        ];
      case "Goat":
        return [
          { label: "Wildlife Detected", val: "🐐 Goat (Domestic)", status: "ok" },
          { label: "Threat Assessment", val: "Low (22%)", status: "info" },
          { label: "Suggested Audio", val: `Track ${trackId} (${audioFile}) Local Tone`, status: "ok" },
          { label: "Alert Config", val: "Bypass Forest Dept", status: "info" },
          { label: "System Notification", val: "Local Notification to Farmer", status: "info" }
        ];
      case "Wild Dogs":
        return [
          { label: "Wildlife Detected", val: "🐕 Wild Dogs (Pack)", status: "ok" },
          { label: "Threat Assessment", val: "High (82%)", status: "warn" },
          { label: "Suggested Audio", val: `Track ${trackId} (${audioFile}) Canine Disruptor`, status: "ok" },
          { label: "Secondary Deterrent", val: "High Frequency Strobe", status: "ok" },
          { label: "System Notification", val: "Alert Livestock Enclosure", status: "info" }
        ];
      case "Human":
        return [
          { label: "Target Detected", val: "🚶 Human Presence", status: "ok" },
          { label: "Threat Assessment", val: "Security Monitoring (88%)", status: "warn" },
          { label: "Suggested Audio", val: `Track ${trackId} (${audioFile}) Voice Warning`, status: "ok" },
          { label: "Safety Rule", val: "Loud Siren Bypassed (Safety)", status: "warn" },
          { label: "Primary Deterrent", val: "Perimeter Security Floodlight", status: "ok" },
          { label: "System Notification", val: "Push Alert with Snapshot to Farmer", status: "info" }
        ];
      default:
        return [
          { label: "Wildlife Detected", val: selectedSpecies, status: "ok" },
          { label: "Suggested Audio", val: `Track ${trackId} (${audioFile})`, status: "ok" }
        ];
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
              Species-Specific AI Decision Engine (11 Classes)
            </h2>
            <p className="text-[10px] text-slate-500 font-mono mt-1">
              Autonomous Rule Engine for all 10 Wildlife Classes + Human with Audio Deterrent Triggers
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4 text-[10px] font-mono">
          <div className="flex items-center gap-1.5">
            <span className="text-slate-500">CLASSES:</span>
            <span className="text-green-500 font-bold">11 Monitored</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-slate-500">SOUNDS:</span>
            <span className="text-cyan-400 font-bold">5 Calibrated</span>
          </div>
        </div>
      </div>

      {/* INTERACTIVE RULE SIMULATOR */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Simulator controls */}
        <div className="lg:col-span-1 bg-[#0b0f19] border border-slate-900 rounded-xl p-5 space-y-4 shadow-lg flex flex-col justify-between">
          <div>
            <div className="text-[10px] font-bold font-sans text-slate-400 uppercase tracking-wider border-b border-slate-900 pb-2 mb-3">
              Select Intruder Class (11 Available)
            </div>

            <div className="space-y-4">
              {/* Species selector grid */}
              <div className="grid grid-cols-3 gap-1.5">
                {speciesOptions.map((opt) => (
                  <button
                    key={opt.name}
                    onClick={() => setSelectedSpecies(opt.name)}
                    className={`py-2 px-1 rounded-lg border text-[10px] font-semibold flex flex-col items-center justify-center transition-all ${
                      selectedSpecies === opt.name
                        ? 'bg-green-500/15 border-green-500 text-green-400 font-bold shadow-sm'
                        : 'bg-slate-950 border-slate-900 text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                    }`}
                  >
                    <span className="text-base mb-0.5">{opt.emoji}</span>
                    <span className="truncate max-w-full">{opt.name}</span>
                  </button>
                ))}
              </div>

              {/* Crop selector */}
              <div className="space-y-1.5 pt-2 border-t border-slate-900">
                <label className="text-[9px] font-mono text-slate-500 uppercase font-bold">Active Crop Zone</label>
                <div className="grid grid-cols-2 gap-2">
                  {['Cotton', 'Rice', 'Sugarcane', 'Vegetables'].map((c) => (
                    <button
                      key={c}
                      onClick={() => setSelectedCrop(c)}
                      className={`py-2 rounded-lg border text-[10px] font-semibold transition-all ${
                        selectedCrop === c
                          ? 'bg-blue-500/15 border-blue-500 text-blue-400 font-bold'
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
            <span className="text-[9px] font-mono text-green-400 font-bold">Species: {selectedSpecies}</span>
          </div>

          <div className="flex flex-col gap-2 min-h-[280px] justify-center">
            {decisionPath.map((step, idx) => (
              <div
                key={`${selectedSpecies}-${step.label}-${idx}`}
                className="flex items-center gap-3 text-[10px] font-mono text-left pl-2"
              >
                <span className="text-slate-500 shrink-0 w-32 text-right font-sans font-bold uppercase tracking-wider text-[8px]">
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
              </div>
            ))}
          </div>

          {/* Suggested Deterrent Audio Action Bar */}
          {(() => {
            const mapping = getMappingByAnimalName(selectedSpecies) || {};
            const soundId = mapping.suggestedSoundId || "0004";
            const sound = DETERRENT_SOUNDS[soundId] || DETERRENT_SOUNDS['0004'];
            const isPlayingThis = playingSoundId === soundId;

            return (
              <div className="pt-3 border-t border-slate-900 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-slate-950/70 p-3 rounded-xl border border-slate-900/80">
                <div className="flex items-center gap-2.5">
                  <div className="h-8 w-8 rounded-lg bg-green-500/15 border border-green-500/30 flex items-center justify-center text-green-400 shrink-0">
                    <Volume2 className="h-4 w-4" />
                  </div>
                  <div>
                    <span className="text-[9px] font-mono text-slate-400 uppercase tracking-wider block font-bold">
                      SUGGESTED HARDWARE AUDIO TRACK:
                    </span>
                    <span className="text-xs font-bold text-slate-100 font-sans">
                      Track {soundId} ({mapping.audioFile || '0004.mp3'}) • {sound?.decibels}
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => playDeterrentSound(soundId)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all shadow-md ${
                    isPlayingThis 
                      ? 'bg-amber-400 text-slate-950 font-black ring-2 ring-amber-300' 
                      : 'bg-green-500 hover:bg-green-400 text-slate-950 active:scale-95'
                  }`}
                >
                  {isPlayingThis ? <Pause className="h-3.5 w-3.5 fill-current" /> : <Play className="h-3.5 w-3.5 fill-current ml-0.5" />}
                  <span>{isPlayingThis ? 'Stop Track' : 'Test Track Audio'}</span>
                </button>
              </div>
            );
          })()}
        </div>

      </div>

      {/* FULL DECISION MATRIX TABLE (ALL 11 CLASSES) */}
      <div className="bg-[#0b0f19] border border-slate-900 rounded-xl p-5 shadow-lg">
        <div className="flex items-center justify-between border-b border-slate-900 pb-2 mb-4">
          <div className="text-[10px] font-bold font-sans text-slate-400 uppercase tracking-wider">
            All 11 Species Decision Matrix & Deterrent Sound Mapping
          </div>
          <span className="text-[9px] font-mono text-green-400 font-bold">
            10 Animals + Human Synced
          </span>
        </div>
        <div className="overflow-x-auto text-[10px] font-mono">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="text-slate-500 border-b border-slate-900 h-8">
                <th className="pb-2">Species</th>
                <th className="pb-2">Threat Class</th>
                <th className="pb-2">Suggested Audio</th>
                <th className="pb-2">Primary Response</th>
                <th className="pb-2">Secondary Response</th>
                <th className="pb-2">Key Actuators</th>
                <th className="pb-2 text-right">Quick Play</th>
              </tr>
            </thead>
            <tbody>
              {matrixData.map((row) => {
                const isActive = selectedSpecies === row.species;
                const mapping = getMappingByAnimalName(row.species) || {};
                const soundId = mapping.suggestedSoundId || "0004";
                const isPlayingThis = playingSoundId === soundId;

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
                        row.species === 'Elephant' || row.species === 'Leopard' || row.species === 'Bear' ? 'bg-red-500/10 border-red-500/20 text-red-500' :
                        row.species === 'Wild Boar' || row.species === 'Nilgai' || row.species === 'Monkey' || row.species === 'Wild Dogs' ? 'bg-amber-500/10 border-amber-500/20 text-amber-500' :
                        row.species === 'Human' ? 'bg-blue-500/10 border-blue-500/20 text-blue-400' :
                        'bg-green-500/10 border-green-500/20 text-green-500'
                      }`}>
                        {row.threat}
                      </span>
                    </td>
                    <td>
                      <span className="px-2 py-0.5 rounded bg-slate-950 border border-slate-800 text-slate-200 font-bold">
                        Track {soundId} ({mapping.audioFile || '0004.mp3'})
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
                    <td className="text-right">
                      <button
                        onClick={() => playDeterrentSound(soundId)}
                        className={`px-2.5 py-1 rounded-md text-[10px] font-bold transition-all ${
                          isPlayingThis
                            ? 'bg-amber-400 text-slate-950 font-black'
                            : 'bg-green-500/20 text-green-300 border border-green-500/40 hover:bg-green-500 hover:text-slate-950'
                        }`}
                      >
                        {isPlayingThis ? 'Stop' : 'Play Sound'}
                      </button>
                    </td>
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
