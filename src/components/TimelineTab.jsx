import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Clock, ShieldAlert, AlertTriangle, Radio, CheckCircle2, 
  Cpu, Volume2, Lightbulb, Zap, Smartphone, Wifi, WifiOff,
  RefreshCw, Filter, Search, ArrowRight, Layers, Download, Check
} from 'lucide-react';
import { getTranslation } from '../utils/translations';
import { getSpeciesMetadataByName } from '../utils/speciesMapping';

export default function TimelineTab({ 
  simulationState, 
  currentScenario, 
  language,
  logs = []
}) {
  const t = (key) => getTranslation(language, key);
  const [filterType, setFilterType] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedEventId, setExpandedEventId] = useState(null);

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
    timestamp: "10:23:15 PM",
    actuators: { siren: true, floodlight: true, speaker: true, sprinkler: false },
    logThreat: "HIGH"
  };

  const meta = getSpeciesMetadataByName(activeScenario.species);
  const isHighRisk = activeScenario.threat === "HIGH" || activeScenario.threat === "CRITICAL";
  const isMedRisk = activeScenario.threat === "MEDIUM" || activeScenario.threat === "WARNING";
  const riskLabel = isHighRisk ? (activeScenario.species === "Gaur" || activeScenario.species === "Elephant" ? "Very High" : "High") : isMedRisk ? "Medium" : "Low";

  // Comprehensive chronologically ordered historical timeline events
  const defaultEvents = [
    {
      id: "EVT-1092",
      type: "DETECTION",
      category: "Detections",
      title: `${activeScenario.species} Detected at ${activeScenario.nodeName || 'FN-1'}`,
      code: activeScenario.code || "WS-WL-WB",
      species: activeScenario.species,
      emoji: activeScenario.emoji || "🐗",
      time: activeScenario.timestamp || "10:23:15 PM",
      date: "Today, Aug 29",
      camera: activeScenario.nodeName || "FN-1",
      zone: activeScenario.zone || "North Field",
      confidence: activeScenario.confidenceBase || 95.5,
      risk: riskLabel,
      action: isHighRisk ? "Siren + LED Floodlight Activated" : isMedRisk ? "Directional Floodlight + Low Alarm" : "Water Sprinkler Pulse",
      status: simulationState >= 4 ? "DETERRED" : simulationState >= 2 ? "ACTIVE" : "DETECTED",
      flow: [
        { step: "Animal Detected", detail: `PIR motion trigger on ${activeScenario.nodeName || 'FN-1'}`, time: "10:23:12 PM", done: true },
        { step: "Species Identified", detail: `${activeScenario.species} (${activeScenario.confidenceBase || 95.5}% confidence)`, time: "10:23:13 PM", done: true },
        { step: "Farm Boundary Checked", detail: `${activeScenario.zone || 'North Field'} geofence boundary breached`, time: "10:23:14 PM", done: true },
        { step: "Risk Assessed", detail: `${riskLabel} risk of crop damage confirmed`, time: "10:23:14 PM", done: true },
        { step: "Response Selected", detail: isHighRisk ? "Siren + Floodlight + Roar" : "Sprinkler + Warning", time: "10:23:15 PM", done: true },
        { step: "Deterrent Activated", detail: "Actuators deployed on target vector", time: "10:23:15 PM", done: simulationState >= 3 },
        { step: "Farmer Alert Sent", detail: "Push notification & SMS dispatched", time: "10:23:16 PM", done: simulationState >= 3 },
        { step: "Event Logged", detail: "Telemetry stored in Central AI Hub", time: "10:23:17 PM", done: true }
      ]
    },
    {
      id: "EVT-1091",
      type: "ALERT",
      category: "Farmer Alerts",
      title: "Farmer Push Notification & SMS Dispatched",
      code: "WS-SYS-NTF",
      time: "10:21:40 PM",
      date: "Today, Aug 29",
      camera: "Central AI Hub",
      zone: "Farmer Mobile App",
      confidence: 100,
      risk: "High",
      action: "SMS + Audio Alarm Pushed",
      status: "DELIVERED",
      flow: [
        { step: "Trigger Generated", detail: "Intrusion event verified by edge model", time: "10:21:38 PM", done: true },
        { step: "Notification Queued", detail: "Priority alert formatted with GPS coordinates", time: "10:21:39 PM", done: true },
        { step: "Delivery Confirmed", detail: "Delivered to +91 98765 43210 & Mobile App", time: "10:21:40 PM", done: true }
      ]
    },
    {
      id: "EVT-1090",
      type: "SYNC",
      category: "Sync & Mesh",
      title: "3 Offline Events Synchronized with Central AI Hub",
      code: "WS-NET-SYNC",
      time: "10:14:00 PM",
      date: "Today, Aug 29",
      camera: "FN-2 (East Orchard)",
      zone: "Mesh Gateway",
      confidence: 100,
      risk: "Low",
      action: "LoRa SX1278 Batch Sync",
      status: "SYNCED",
      flow: [
        { step: "Mesh Connection Restored", detail: "LoRa RSSI -68 dBm handshake established", time: "10:13:58 PM", done: true },
        { step: "Batch Transmitted", detail: "3 offline local edge inference payloads sent", time: "10:13:59 PM", done: true },
        { step: "Hub Acknowledged", detail: "Central Jetson Orin verified hash checksums", time: "10:14:00 PM", done: true }
      ]
    },
    {
      id: "EVT-1089",
      type: "OFFLINE",
      category: "Offline Events",
      title: "FN-2 Continued Local Autonomous Protection (Offline Mode)",
      code: "WS-EDG-LOC",
      time: "09:48:22 PM",
      date: "Today, Aug 29",
      camera: "FN-2",
      zone: "East Orchard",
      confidence: 96.0,
      risk: "Medium",
      action: "Local Primate Deterrent Engaged",
      status: "RESOLVED",
      flow: [
        { step: "RF Link Dropped", detail: "Temporary mesh signal obstruction", time: "09:45:00 PM", done: true },
        { step: "Edge AI Active", detail: "ESP32 + Edge Tensor chip continued surveillance", time: "09:48:20 PM", done: true },
        { step: "Local Action", detail: "Sprinkler pulse fired without requiring internet", time: "09:48:22 PM", done: true }
      ]
    },
    {
      id: "EVT-1088",
      type: "DETECTION",
      category: "Detections",
      title: "Nilgai Intrusion Identified at FN-3",
      code: "WS-WL-NG",
      species: "Nilgai",
      emoji: "🐂",
      time: "08:16:30 PM",
      date: "Today, Aug 29",
      camera: "FN-3",
      zone: "South-East Pulses",
      confidence: 97.9,
      risk: "High",
      action: "Directional Floodlight + Acoustic Alarm",
      status: "RESOLVED",
      flow: [
        { step: "Animal Detected", detail: "PIR motion trigger on FN-3", time: "08:16:25 PM", done: true },
        { step: "Species Identified", detail: "Nilgai / Blue Bull (97.9% confidence)", time: "08:16:26 PM", done: true },
        { step: "Farm Boundary Checked", detail: "South-East perimeter crossed", time: "08:16:28 PM", done: true },
        { step: "Risk Assessed", detail: "High risk to pulse crop shoots", time: "08:16:28 PM", done: true },
        { step: "Response Selected", detail: "Directional Floodlight + Acoustic Alarm", time: "08:16:29 PM", done: true },
        { step: "Deterrent Activated", detail: "Animal repelled back to forest buffer", time: "08:16:30 PM", done: true }
      ]
    },
    {
      id: "EVT-1087",
      type: "TWIN",
      category: "Digital Twin",
      title: "North Field Geofence Status Updated in Digital Twin",
      code: "WS-DTW-UPD",
      time: "07:30:15 PM",
      date: "Today, Aug 29",
      camera: "Central AI Hub",
      zone: "North Boundary",
      confidence: 100,
      risk: "Low",
      action: "Live 3D Telemetry Synchronized",
      status: "UPDATED",
      flow: [
        { step: "State Changed", detail: "Boundary armed to high nocturnal alert state", time: "07:30:14 PM", done: true },
        { step: "Twin Rendered", detail: "Visual representation refreshed on dashboard map", time: "07:30:15 PM", done: true }
      ]
    },
    {
      id: "EVT-1086",
      type: "DETECTION",
      category: "Detections",
      title: "Spotted Deer Grazing Detected at FN-4",
      code: "WS-WL-SD",
      species: "Spotted Deer",
      emoji: "🦌",
      time: "06:45:10 PM",
      date: "Today, Aug 29",
      camera: "FN-4",
      zone: "South-West Grassland",
      confidence: 97.9,
      risk: "Medium",
      action: "Soft Flash Light + Low Frequency Sound",
      status: "RESOLVED",
      flow: [
        { step: "Animal Detected", detail: "PIR motion trigger on FN-4", time: "06:45:05 PM", done: true },
        { step: "Species Identified", detail: "Spotted Deer (97.9% confidence)", time: "06:45:06 PM", done: true },
        { step: "Risk Assessed", detail: "Medium risk (avoid loud siren panic)", time: "06:45:08 PM", done: true },
        { step: "Deterrent Activated", detail: "Soft flash lights engaged safely", time: "06:45:10 PM", done: true }
      ]
    }
  ];

  const filteredEvents = defaultEvents.filter(ev => {
    if (filterType === 'DETECTIONS' && ev.type !== 'DETECTION') return false;
    if (filterType === 'ALERTS' && ev.type !== 'ALERT') return false;
    if (filterType === 'DETERRENTS' && !ev.action.includes('Activated') && !ev.action.includes('Engaged')) return false;
    if (filterType === 'OFFLINE' && ev.type !== 'OFFLINE' && ev.type !== 'SYNC') return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return ev.title.toLowerCase().includes(q) || 
             (ev.species && ev.species.toLowerCase().includes(q)) || 
             ev.code.toLowerCase().includes(q) || 
             ev.camera.toLowerCase().includes(q);
    }
    return true;
  });

  return (
    <div className="space-y-6 select-none text-left">
      
      {/* 1. Header Banner & Filter Pills */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[#0b0f19] border border-slate-900 rounded-xl p-5 shadow-lg">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20 flex items-center justify-center shadow-[0_0_20px_rgba(59,130,246,0.2)]">
            <Clock className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-base font-bold text-slate-100 font-sans uppercase tracking-wider flex items-center gap-2">
              Chronological Event Timeline
              <span className="text-[9px] font-mono font-bold text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded border border-blue-500/30">
                AUDIT TRAIL
              </span>
            </h1>
            <p className="text-xs text-slate-400 font-mono mt-0.5">
              Real-Time Incident Stream, Autonomous Response Flow & Edge Mesh Synchronization
            </p>
          </div>
        </div>

        {/* Search Bar & Export */}
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="h-3.5 w-3.5 text-slate-500 absolute left-2.5 top-1/2 transform -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Search event, animal, node..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 font-sans focus:outline-none focus:border-green-500 w-48 sm:w-56"
            />
          </div>
          <button 
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-950 hover:bg-slate-900 border border-slate-800 rounded-lg text-xs font-semibold text-slate-300 transition-all"
            title="Download CSV Audit Report"
          >
            <Download className="h-3.5 w-3.5 text-slate-400" />
            <span className="hidden sm:inline">Export</span>
          </button>
        </div>
      </div>

      {/* 2. Filter Category Pills */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-900 pb-3">
        <div className="flex flex-wrap items-center gap-1.5">
          {[
            { id: 'ALL', label: 'All Events' },
            { id: 'DETECTIONS', label: 'Wildlife Detections' },
            { id: 'DETERRENTS', label: 'Deterrent Actions' },
            { id: 'ALERTS', label: 'Farmer Alerts' },
            { id: 'OFFLINE', label: 'Offline & Sync' }
          ].map((f) => (
            <button
              key={f.id}
              onClick={() => setFilterType(f.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                filterType === f.id
                  ? 'bg-green-500 text-slate-950 font-bold shadow'
                  : 'bg-slate-950/60 hover:bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-900'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        <span className="text-[10px] font-mono text-slate-500">
          Showing {filteredEvents.length} chronological entries
        </span>
      </div>

      {/* 3. Chronological Events Stream */}
      <div className="space-y-4">
        {filteredEvents.map((evt, index) => {
          const isExpanded = expandedEventId === evt.id || (index === 0 && expandedEventId === null);
          const isDet = evt.type === 'DETECTION';
          const isSync = evt.type === 'SYNC';
          const isOff = evt.type === 'OFFLINE';
          const isAlt = evt.type === 'ALERT';
          const isTwin = evt.type === 'TWIN';

          return (
            <motion.div
              key={evt.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className={`bg-[#0b0f19] border rounded-xl p-5 shadow-lg transition-all ${
                isDet && (evt.risk === 'High' || evt.risk === 'Very High') 
                  ? 'border-red-500/30 hover:border-red-500/50' 
                  : isSync 
                  ? 'border-blue-500/30 hover:border-blue-500/50'
                  : isOff
                  ? 'border-amber-500/30 hover:border-amber-500/50'
                  : 'border-slate-900 hover:border-slate-800'
              }`}
            >
              {/* Event Header Row */}
              <div 
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 cursor-pointer"
                onClick={() => setExpandedEventId(isExpanded ? '__none__' : evt.id)}
              >
                <div className="flex items-start gap-3">
                  {/* Category Icon Badge */}
                  <div className={`h-10 w-10 rounded-xl flex items-center justify-center shrink-0 mt-0.5 text-lg ${
                    isDet ? 'bg-red-500/10 text-red-400 border border-red-500/20' :
                    isAlt ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                    isSync ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' :
                    isOff ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20' :
                    'bg-green-500/10 text-green-400 border border-green-500/20'
                  }`}>
                    {evt.emoji || (isAlt ? "📢" : isSync ? "🔄" : isOff ? "📡" : "🌐")}
                  </div>

                  {/* Title & Metadata */}
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm font-bold text-slate-100 font-sans">
                        {evt.title}
                      </span>
                      <span className="text-[9px] font-mono font-bold text-green-400 bg-green-500/10 px-1.5 py-0.5 rounded border border-green-500/20">
                        {evt.code}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] font-mono text-slate-400 mt-1">
                      <span>Camera: <strong className="text-slate-200">{evt.camera}</strong></span>
                      <span>•</span>
                      <span>Location: <strong className="text-slate-200">{evt.zone}</strong></span>
                      {evt.confidence && (
                        <>
                          <span>•</span>
                          <span>Confidence: <strong className="text-green-400">{evt.confidence}%</strong></span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right Badges: Time & Status */}
                <div className="flex sm:flex-col items-center sm:items-end justify-between gap-1 shrink-0">
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-0.5 rounded text-[8px] font-bold font-mono uppercase ${
                      evt.risk === 'Very High' || evt.risk === 'High' ? 'bg-red-500/10 text-red-400 border border-red-500/30' :
                      evt.risk === 'Medium' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30' :
                      'bg-green-500/10 text-green-400 border border-green-500/30'
                    }`}>
                      {evt.risk} Risk
                    </span>
                    <span className={`px-2 py-0.5 rounded text-[8px] font-bold font-mono ${
                      evt.status === 'ACTIVE' ? 'bg-red-500 text-slate-950 animate-pulse' :
                      evt.status === 'DETERRED' ? 'bg-amber-500 text-slate-950' :
                      evt.status === 'SYNCED' ? 'bg-blue-500 text-slate-950' :
                      'bg-slate-800 text-slate-300'
                    }`}>
                      {evt.status}
                    </span>
                  </div>

                  <div className="text-right font-mono text-[10px] text-slate-500">
                    <strong className="text-slate-300 font-bold">{evt.time}</strong> • {evt.date}
                  </div>
                </div>
              </div>

              {/* Action Banner summary */}
              <div className="mt-3 pt-3 border-t border-slate-900/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                <div className="flex items-center gap-2 font-sans">
                  <Zap className="h-3.5 w-3.5 text-green-400" />
                  <span className="text-slate-400">Autonomous Action:</span>
                  <span className="text-slate-200 font-semibold">{evt.action}</span>
                </div>
                <button 
                  onClick={() => setExpandedEventId(isExpanded ? '__none__' : evt.id)}
                  className="text-[10px] font-mono text-blue-400 hover:text-blue-300 flex items-center gap-1 self-start sm:self-auto"
                >
                  <span>{isExpanded ? 'Hide Decision Flow ▲' : 'View Decision Flow ▼'}</span>
                </button>
              </div>

              {/* Expanded 8-Step Timeline Sequence Flow */}
              <AnimatePresence>
                {isExpanded && evt.flow && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mt-4 pt-4 border-t border-slate-900 space-y-3 overflow-hidden"
                  >
                    <div className="text-[10px] font-bold font-sans text-slate-400 uppercase tracking-wider flex items-center justify-between">
                      <span>Sequential Cognitive Flow</span>
                      <span className="text-[8px] font-mono text-slate-500">Chronological Event Chain</span>
                    </div>

                    {/* Stepper Chain Nodes */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 pt-1">
                      {evt.flow.map((step, sIdx) => (
                        <div 
                          key={sIdx}
                          className={`bg-slate-950/80 border rounded-lg p-2.5 flex flex-col justify-between h-20 text-left ${
                            step.done 
                              ? 'border-green-500/20 text-slate-200' 
                              : 'border-slate-900 text-slate-500 opacity-60'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-[9px] font-mono font-bold text-slate-400">{step.time}</span>
                            {step.done ? (
                              <Check className="h-3 w-3 text-green-400" />
                            ) : (
                              <span className="h-2 w-2 rounded-full bg-slate-800" />
                            )}
                          </div>
                          <div>
                            <span className="text-[10px] font-bold font-sans text-slate-100 block truncate">
                              {step.step}
                            </span>
                            <p className="text-[8px] font-mono text-slate-400 truncate mt-0.5" title={step.detail}>
                              {step.detail}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

            </motion.div>
          );
        })}
      </div>

    </div>
  );
}
