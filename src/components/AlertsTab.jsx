import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Bell, ShieldAlert, AlertTriangle, Radio, CheckCircle2, 
  Volume2, Lightbulb, Zap, Camera, Clock, Compass, 
  ArrowRight, RefreshCw, Send, Smartphone, Sparkles, Filter
} from 'lucide-react';
import { getTranslation } from '../utils/translations';
import { getSpeciesMetadataByName } from '../utils/speciesMapping';

export default function AlertsTab({ 
  simulationState, 
  currentScenario, 
  language,
  onTriggerNewEvent 
}) {
  const t = (key) => getTranslation(language, key);
  const [filter, setFilter] = useState('ALL');
  const [recentAlerts, setRecentAlerts] = useState([]);

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
    image: "/ed-van-duijn-414NZVxzc20-unsplash.jpg",
    sourceFile: "WS-WL-WB-00006.jpg",
    timestamp: "10:23:15 PM",
    actuators: { siren: true, floodlight: true, speaker: true, sprinkler: false },
    logThreat: "HIGH"
  };

  const meta = getSpeciesMetadataByName(activeScenario.species);
  const isHighRisk = activeScenario.threat === "HIGH" || activeScenario.threat === "CRITICAL";
  const isMedRisk = activeScenario.threat === "MEDIUM" || activeScenario.threat === "WARNING";
  const riskLabel = isHighRisk ? (activeScenario.species === "Gaur" || activeScenario.species === "Elephant" ? "Very High" : "High") : isMedRisk ? "Medium" : "Low";

  // Farmer friendly behaviour mapping
  const whatItIsDoing = 
    activeScenario.species === "Wild Boar" ? "Eating Crops & Rooting Soil" :
    activeScenario.species === "Nilgai" ? "Eating Crops" :
    activeScenario.species === "Spotted Deer" ? "Grazing Tender Shoots" :
    activeScenario.species === "Rhesus Macaque" ? "Plucking Orchard Fruits" :
    activeScenario.species === "Langur" ? "Moving in Group & Stripping Leaves" :
    activeScenario.species === "Gaur" ? "Eating Crops & Approaching Boundary" :
    activeScenario.species === "Elephant" ? "Moving in Group Toward Crops" :
    activeScenario.species === "Cattle" || activeScenario.species === "Goat" ? "Grazing Boundary Grass" : "Moving Along Fence";

  const usuallyActive = 
    activeScenario.species === "Wild Boar" ? "Night (After Sunset)" :
    activeScenario.species === "Nilgai" ? "Early Morning & Late Evening" :
    activeScenario.species === "Spotted Deer" ? "Morning & Evening" :
    activeScenario.species === "Rhesus Macaque" || activeScenario.species === "Langur" ? "Day (Daylight)" :
    activeScenario.species === "Cattle" || activeScenario.species === "Goat" ? "Day (Daytime Grazing)" :
    activeScenario.species === "Elephant" || activeScenario.species === "Gaur" ? "Night & Evening" : "Day / Night";

  const possibleDamage = 
    activeScenario.species === "Wild Boar" ? "Heavy Crop & Soil Rooting Damage" :
    activeScenario.species === "Nilgai" ? "Cereal & Pulse Crop Damage" :
    activeScenario.species === "Spotted Deer" ? "Young Shoot Damage" :
    activeScenario.species === "Rhesus Macaque" || activeScenario.species === "Langur" ? "Fruit & Branch Damage" :
    activeScenario.species === "Gaur" || activeScenario.species === "Elephant" ? "Trampling & Severe Crop Damage" :
    activeScenario.species === "Cattle" || activeScenario.species === "Goat" ? "Minor Foliage Grazing" : "No Major Damage";

  const whereItIs = simulationState >= 2 ? "Inside Farm (Crop Field)" : "Farm Boundary (Near Entrance)";

  const deterrentAction = 
    activeScenario.species === "Wild Boar" ? "Siren + LED Floodlight + Predator Audio" :
    activeScenario.species === "Nilgai" ? "Directional Floodlight + Acoustic Alarm" :
    activeScenario.species === "Spotted Deer" ? "Soft Floodlight + Low-Frequency Alarm" :
    activeScenario.species === "Rhesus Macaque" ? "Smart Sprinkler Pulse + Distress Call" :
    activeScenario.species === "Langur" ? "Overhead Sprinkler + Visual Strobe" :
    activeScenario.species === "Gaur" ? "Non-Contact Strobe + Forest Dept Alert" :
    activeScenario.species === "Elephant" ? "Directional Strobe + Forest Dept Alert" :
    activeScenario.species === "Cattle" ? "Water Sprinkler Pulse + Warning Buzzer" :
    activeScenario.species === "Goat" ? "Local Warning Beep" : "Perimeter Monitoring";

  // Fetch recent alert log events from backend
  useEffect(() => {
    const fetchAlerts = async () => {
      try {
        const res = await fetch("http://127.0.0.1:8000/api/events");
        if (res.ok) {
          const data = await res.json();
          if (data.events && data.events.length > 0) {
            setRecentAlerts(data.events);
          }
        }
      } catch (e) {
        // Fallback sample alerts
      }
    };
    fetchAlerts();
  }, [currentScenario?.species, currentScenario?.sourceFile]);

  // Combined alerts list
  const displayAlerts = [
    {
      id: `ALT-LIVE-${Date.now()}`,
      time: activeScenario.timestamp || "Just Now",
      species: activeScenario.species,
      code: activeScenario.code || "WS-WL",
      emoji: activeScenario.emoji || "🐗",
      confidence: activeScenario.confidenceBase || 95.5,
      node: activeScenario.nodeName || `FN-${activeScenario.nodeId}`,
      zone: activeScenario.zone || "North Field",
      risk: riskLabel,
      action: deterrentAction,
      status: simulationState >= 4 ? "DETERRED" : simulationState >= 2 ? "ACTIVE" : "DETECTED"
    },
    ...recentAlerts.map((ev, i) => ({
      id: ev.event_id || `ALT-HIST-${i}`,
      time: ev.time || "10:15 PM",
      species: ev.species || "Wild Boar",
      code: ev.code || "WS-WL",
      emoji: ev.species === "Elephant" ? "🐘" : ev.species === "Nilgai" ? "🐂" : ev.species === "Spotted Deer" ? "🦌" : ev.species === "Cattle" ? "🐄" : ev.species === "Goat" ? "🐐" : "🐗",
      confidence: ev.confidence || 94.0,
      node: ev.camera || "FN-1",
      zone: ev.camera === "FN-2" ? "East Orchard" : ev.camera === "FN-3" ? "South-East Field" : ev.camera === "FN-4" ? "South-West Field" : "North Field",
      risk: ev.threat === "HIGH" || ev.threat === "CRITICAL" ? "High" : ev.threat === "MEDIUM" ? "Medium" : "Low",
      action: ev.action || "Siren + Floodlight",
      status: "RESOLVED"
    }))
  ];

  const filteredAlerts = displayAlerts.filter(a => {
    if (filter === 'ALL') return true;
    if (filter === 'HIGH') return a.risk === 'High' || a.risk === 'Very High';
    if (filter === 'MEDIUM') return a.risk === 'Medium';
    if (filter === 'LOW') return a.risk === 'Low';
    return true;
  });

  return (
    <div className="space-y-6 select-none text-left">
      
      {/* 1. Header Banner & Live Status */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[#0b0f19] border border-slate-900 rounded-xl p-5 shadow-lg">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-red-500/10 text-red-500 border border-red-500/20 flex items-center justify-center shadow-[0_0_20px_rgba(239,68,68,0.2)]">
            <Bell className="h-5 w-5 animate-pulse" />
          </div>
          <div>
            <h1 className="text-base font-bold text-slate-100 font-sans uppercase tracking-wider flex items-center gap-2">
              Wildlife Intrusion Alerts
              <span className="text-[9px] font-mono font-bold text-red-400 bg-red-500/10 px-2 py-0.5 rounded border border-red-500/30">
                LIVE DISPATCH
              </span>
            </h1>
            <p className="text-xs text-slate-400 font-mono mt-0.5">
              Real-Time YOLOv11 Surveillance & Automated Non-Lethal Deterrent Response
            </p>
          </div>
        </div>

        {/* Quick Filter & Simulation Dispatch */}
        <div className="flex items-center gap-2">
          {onTriggerNewEvent && (
            <button
              onClick={onTriggerNewEvent}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-green-500 hover:bg-green-600 text-slate-950 font-sans shadow transition-all"
            >
              <Zap className="h-3.5 w-3.5 fill-current" />
              <span>Simulate Next Intrusion</span>
            </button>
          )}
        </div>
      </div>

      {/* 2. Highlighted Farmer Alert Notification Banner */}
      <motion.div 
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className={`border rounded-xl p-4 shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-3 ${
          isHighRisk 
            ? 'bg-red-950/30 border-red-500/40 text-red-200' 
            : isMedRisk 
            ? 'bg-amber-950/30 border-amber-500/40 text-amber-200'
            : 'bg-green-950/30 border-green-500/40 text-green-200'
        }`}
      >
        <div className="flex items-start gap-3">
          <div className={`p-2 rounded-lg shrink-0 mt-0.5 ${
            isHighRisk ? 'bg-red-500/20 text-red-400' : isMedRisk ? 'bg-amber-500/20 text-amber-400' : 'bg-green-500/20 text-green-400'
          }`}>
            <ShieldAlert className="h-5 w-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold font-sans uppercase tracking-wide">
                📢 Farm Safety Dispatch
              </span>
              <span className="text-[9px] font-mono opacity-75">
                {activeScenario.timestamp || "10:23:15 PM"}
              </span>
            </div>
            <p className="text-sm font-sans font-semibold mt-1">
              Wildlife Alert: <strong className="text-white">{activeScenario.species}</strong> detected near <strong className="text-white">{activeScenario.zone || "North Field"}</strong> ({activeScenario.nodeName || "FN-1"}). {riskLabel} crop-damage risk. Deterrent response activated.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <span className="text-[9px] font-mono font-bold px-2 py-1 rounded bg-slate-950/80 border border-slate-800 text-slate-300 flex items-center gap-1">
            <Smartphone className="h-3 w-3 text-green-400" />
            SMS & Push Sent
          </span>
        </div>
      </motion.div>

      {/* 3. Primary Grid: Live Alert Overview + Threat & Behavior Analysis */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Column 1: Live Alert Card with Real YOLO Image & Telemetry */}
        <div className="bg-[#0b0f19] border border-slate-900 rounded-xl p-5 shadow-lg space-y-4">
          <div className="flex items-center justify-between border-b border-slate-900 pb-2">
            <span className="text-[10px] font-bold font-sans text-slate-400 uppercase tracking-wider">
              Live Intrusion Event
            </span>
            <span className="flex items-center gap-1 text-[8px] font-mono text-red-400 font-bold bg-red-500/10 px-1.5 py-0.5 rounded border border-red-500/20 animate-pulse">
              <span className="h-1.5 w-1.5 rounded-full bg-red-500" />
              {simulationState >= 2 ? "INTRUSION DETECTED" : "APPROACHING BOUNDARY"}
            </span>
          </div>

          {/* Real Animal Photo with YOLO Overlay */}
          <div className="relative w-full h-48 bg-slate-950 rounded-xl border border-slate-900 overflow-hidden flex items-center justify-center crt-overlay">
            {/* Real Model Annotated Image or Sample */}
            <img
              src={
                activeScenario.image || (
                  activeScenario.species === "Elephant" ? "/christoffer-brus-7hGF4emWkXs-unsplash.jpg" :
                  activeScenario.species === "Wild Boar" ? "/ed-van-duijn-414NZVxzc20-unsplash.jpg" :
                  activeScenario.species === "Cattle" ? "https://images.unsplash.com/photo-1570042225831-d98fa7577f1e?q=80&w=600&auto=format&fit=crop" :
                  activeScenario.species === "Spotted Deer" ? "https://images.unsplash.com/photo-1484406566174-9da000fda645?q=80&w=600&auto=format&fit=crop" :
                  activeScenario.species === "Nilgai" ? "https://images.unsplash.com/photo-1589656966895-2f33e7653819?q=80&w=600&auto=format&fit=crop" :
                  activeScenario.species === "Goat" ? "https://images.unsplash.com/photo-1524024973431-2ad916746881?q=80&w=600&auto=format&fit=crop" :
                  "/ed-van-duijn-414NZVxzc20-unsplash.jpg"
                )
              }
              alt={activeScenario.species}
              className="w-full h-full object-cover filter brightness-[0.9] contrast-[1.05]"
            />

            {/* Bounding Box HUD Overlay */}
            <div className="absolute inset-3 border-2 border-red-500 rounded-lg pointer-events-none shadow-[0_0_20px_rgba(239,68,68,0.4)]">
              <div className="absolute -top-3.5 left-2 bg-red-600 text-slate-950 font-mono text-[9px] font-black px-2 py-0.5 rounded shadow">
                {activeScenario.species} ({activeScenario.confidenceBase || 95.5}%)
              </div>
            </div>

            <div className="absolute bottom-2 right-2 text-2xl select-none filter drop-shadow">
              {activeScenario.emoji}
            </div>
          </div>

          {/* Telemetry Key-Value Details */}
          <div className="space-y-2 text-[10px] font-mono text-slate-400 divide-y divide-slate-900/80">
            <div className="flex justify-between items-center pt-1">
              <span className="text-slate-500">Species:</span>
              <span className="text-slate-100 font-sans font-bold text-xs">{activeScenario.species}</span>
            </div>
            <div className="flex justify-between items-center pt-1">
              <span className="text-slate-500">Animal ID:</span>
              <span className="text-green-400 font-bold">{activeScenario.code || "WS-WL-WB"}</span>
            </div>
            <div className="flex justify-between items-center pt-1">
              <span className="text-slate-500">Confidence:</span>
              <span className="text-green-500 font-bold">{activeScenario.confidenceBase || 95.5}% Confidence</span>
            </div>
            <div className="flex justify-between items-center pt-1">
              <span className="text-slate-500">Camera Node:</span>
              <span className="text-slate-200 font-semibold">{activeScenario.nodeName || `FN-${activeScenario.nodeId}`}</span>
            </div>
            <div className="flex justify-between items-center pt-1">
              <span className="text-slate-500">Farm Zone:</span>
              <span className="text-slate-200 font-semibold">{activeScenario.zone || "North Field"}</span>
            </div>
            <div className="flex justify-between items-center pt-1">
              <span className="text-slate-500">Direction:</span>
              <span className="text-amber-400 font-semibold">Moving Toward Crop</span>
            </div>
            <div className="flex justify-between items-center pt-1">
              <span className="text-slate-500">Distance:</span>
              <span className="text-slate-300 font-semibold">{Math.max(12, (meta?.threatScore || 80) - 40)} meters</span>
            </div>
            <div className="flex justify-between items-center pt-1">
              <span className="text-slate-500">Status:</span>
              <span className="text-red-400 font-bold font-sans">INTRUSION DETECTED</span>
            </div>
          </div>
        </div>

        {/* Column 2: Threat & Impact Analysis + Context & Animal Behaviour */}
        <div className="space-y-6">
          
          {/* Threat & Impact Analysis Card */}
          <div className="bg-[#0b0f19] border border-slate-900 rounded-xl p-5 shadow-lg space-y-3.5">
            <div className="flex items-center justify-between border-b border-slate-900 pb-2">
              <span className="text-[10px] font-bold font-sans text-slate-400 uppercase tracking-wider">
                Threat & Risk Analysis
              </span>
              <span className={`text-[9px] font-mono font-black px-2 py-0.5 rounded border uppercase ${
                isHighRisk ? 'bg-red-500/10 border-red-500/30 text-red-400' :
                isMedRisk ? 'bg-amber-500/10 border-amber-500/30 text-amber-400' :
                'bg-green-500/10 border-green-500/30 text-green-400'
              }`}>
                {riskLabel} Risk
              </span>
            </div>

            {/* Dynamic Farmer Explanation Alert */}
            <div className="bg-slate-950/70 border border-slate-900 rounded-lg p-3 text-left space-y-1">
              <div className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-red-500 animate-ping" />
                <span className="text-xs font-bold text-slate-100 font-sans">
                  {riskLabel} Risk Assessment
                </span>
              </div>
              <p className="text-xs text-slate-300 font-sans leading-relaxed">
                <strong className="text-white">{activeScenario.species}</strong> is moving toward the crop area and may cause <strong className="text-amber-400">{possibleDamage.toLowerCase()}</strong>.
              </p>
            </div>

            {/* Threat Level Bar Gauge */}
            <div className="space-y-1.5 text-[9px] font-mono">
              <div className="flex justify-between text-slate-400">
                <span>Calculated Threat Score</span>
                <span className="text-slate-100 font-bold">{meta?.threatScore || (isHighRisk ? 92 : isMedRisk ? 60 : 25)} / 100</span>
              </div>
              <div className="h-2 w-full bg-slate-950 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${meta?.threatScore || (isHighRisk ? 92 : isMedRisk ? 60 : 25)}%` }}
                  transition={{ duration: 0.8 }}
                  className={`h-full rounded-full ${
                    isHighRisk ? 'bg-red-500' : isMedRisk ? 'bg-amber-500' : 'bg-green-500'
                  }`}
                />
              </div>
            </div>
          </div>

          {/* Context & Animal Behaviour Card (Farmer-Friendly) */}
          <div className="bg-[#0b0f19] border border-slate-900 rounded-xl p-5 shadow-lg space-y-3">
            <div className="text-[10px] font-bold font-sans text-slate-400 uppercase tracking-wider border-b border-slate-900 pb-2">
              Animal Behaviour Profile
            </div>

            <div className="space-y-2 text-[10px] font-mono text-slate-400 divide-y divide-slate-900/80">
              <div className="flex justify-between items-center pt-1">
                <span className="text-slate-500">What It Is Doing:</span>
                <span className="text-slate-100 font-semibold font-sans">{whatItIsDoing}</span>
              </div>
              <div className="flex justify-between items-center pt-1">
                <span className="text-slate-500">Usually Active:</span>
                <span className="text-slate-200 font-semibold font-sans">{usuallyActive}</span>
              </div>
              <div className="flex justify-between items-center pt-1">
                <span className="text-slate-500">Possible Damage:</span>
                <span className="text-amber-400 font-bold font-sans">{possibleDamage}</span>
              </div>
              <div className="flex justify-between items-center pt-1">
                <span className="text-slate-500">Where It Is:</span>
                <span className="text-slate-200 font-semibold font-sans">{whereItIs}</span>
              </div>
              <div className="flex justify-between items-center pt-1">
                <span className="text-slate-500">Risk Level:</span>
                <span className={`font-bold font-sans ${
                  isHighRisk ? 'text-red-400' : isMedRisk ? 'text-amber-400' : 'text-green-400'
                }`}>
                  {riskLabel}
                </span>
              </div>
            </div>
          </div>

        </div>

        {/* Column 3: AI Decision & Response Execution */}
        <div className="bg-[#0b0f19] border border-slate-900 rounded-xl p-5 shadow-lg space-y-4">
          <div className="flex items-center justify-between border-b border-slate-900 pb-2">
            <span className="text-[10px] font-bold font-sans text-slate-400 uppercase tracking-wider">
              AI Decision & Response
            </span>
            <span className="text-[8px] font-mono font-bold text-green-400 bg-green-500/10 px-1.5 py-0.5 rounded border border-green-500/20">
              AUTONOMOUS
            </span>
          </div>

          {/* 4-Step Decision Pipeline */}
          <div className="space-y-2">
            {[
              { label: "1. Detected", desc: `${activeScenario.species} identified by YOLOv11`, status: "DONE" },
              { label: "2. Checked Boundary", desc: `${activeScenario.nodeName || "FN-1"} perimeter geofence breached`, status: "DONE" },
              { label: "3. Risk Assessed", desc: `${riskLabel} risk of crop damage confirmed`, status: "DONE" },
              { label: "4. Action Selected", desc: deterrentAction, status: "ACTIVE" }
            ].map((step, idx) => (
              <div key={idx} className="bg-slate-950/60 border border-slate-900 rounded-lg p-2.5 flex items-start justify-between gap-2">
                <div>
                  <span className="text-[10px] font-bold text-slate-200 font-sans block">{step.label}</span>
                  <p className="text-[9px] text-slate-400 font-mono mt-0.5">{step.desc}</p>
                </div>
                <span className="text-[8px] font-mono font-bold text-green-400 bg-green-500/10 px-1.5 py-0.5 rounded border border-green-500/20 shrink-0">
                  {step.status}
                </span>
              </div>
            ))}
          </div>

          {/* Response Activated Indicator */}
          <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-3.5 text-center space-y-1">
            <div className="flex items-center justify-center gap-1.5 text-green-400 font-black font-sans text-xs uppercase tracking-wider">
              <Zap className="h-4 w-4 animate-bounce fill-current" />
              <span>RESPONSE ACTIVATED</span>
            </div>
            <p className="text-[10px] text-slate-300 font-mono">
              {deterrentAction}
            </p>
          </div>
        </div>

      </div>

      {/* 4. Recent Alerts & Intrusion History Table */}
      <div className="bg-[#0b0f19] border border-slate-900 rounded-xl p-5 shadow-lg space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-900 pb-3">
          <div>
            <h2 className="text-xs font-bold text-slate-100 font-sans uppercase tracking-wider">
              Alerts History & Intrusion Log
            </h2>
            <p className="text-[10px] text-slate-500 font-mono mt-0.5">
              Verified dataset intrusions and automated deterrent telemetry
            </p>
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-1.5">
            <Filter className="h-3.5 w-3.5 text-slate-500" />
            {['ALL', 'HIGH', 'MEDIUM', 'LOW'].map((lvl) => (
              <button
                key={lvl}
                onClick={() => setFilter(lvl)}
                className={`px-2.5 py-1 rounded-lg text-[9px] font-mono font-bold transition-all ${
                  filter === lvl
                    ? 'bg-green-500 text-slate-950'
                    : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'
                }`}
              >
                {lvl}
              </button>
            ))}
          </div>
        </div>

        {/* Table View */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-[10px] font-mono">
            <thead>
              <tr className="text-slate-500 border-b border-slate-900 h-8">
                <th>Time</th>
                <th>Animal & Code</th>
                <th>Confidence</th>
                <th>Node / Zone</th>
                <th>Risk Rating</th>
                <th>Action Taken</th>
                <th className="text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-900/60">
              {filteredAlerts.map((alert, idx) => (
                <tr key={alert.id || idx} className="h-10 hover:bg-slate-900/30 transition-colors">
                  <td className="text-slate-400 whitespace-nowrap">{alert.time}</td>
                  <td className="font-sans font-bold text-slate-100 whitespace-nowrap">
                    <span className="mr-1.5">{alert.emoji}</span>
                    {alert.species} <span className="text-[9px] font-mono text-slate-500">[{alert.code}]</span>
                  </td>
                  <td className="text-green-500 font-bold">{alert.confidence}%</td>
                  <td className="text-slate-300">{alert.node} • {alert.zone}</td>
                  <td>
                    <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold uppercase ${
                      alert.risk === 'High' || alert.risk === 'Very High' 
                        ? 'bg-red-500/10 text-red-400 border border-red-500/30' 
                        : alert.risk === 'Medium'
                        ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                        : 'bg-green-500/10 text-green-400 border border-green-500/30'
                    }`}>
                      {alert.risk}
                    </span>
                  </td>
                  <td className="text-slate-300 max-w-[200px] truncate" title={alert.action}>{alert.action}</td>
                  <td className="text-right">
                    <span className={`px-2 py-0.5 rounded text-[8px] font-bold ${
                      alert.status === 'ACTIVE'
                        ? 'bg-red-500 text-slate-950 animate-pulse'
                        : alert.status === 'DETERRED'
                        ? 'bg-amber-500 text-slate-950'
                        : 'bg-slate-800 text-slate-300'
                    }`}>
                      {alert.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
