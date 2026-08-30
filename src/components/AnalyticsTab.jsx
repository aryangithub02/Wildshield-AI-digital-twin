import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  BarChart3, TrendingUp, ShieldAlert, Sparkles, Cpu, 
  Clock, MapPin, CheckCircle2, Zap, AlertTriangle, 
  Calendar, Filter, Compass, Layers, ArrowUpRight, PieChart, Activity
} from 'lucide-react';
import { getTranslation } from '../utils/translations';
import { SPECIES_TAXONOMY, getSpeciesMetadataByName } from '../utils/speciesMapping';

export default function AnalyticsTab({ 
  simulationState, 
  currentScenario, 
  language 
}) {
  const t = (key) => getTranslation(language, key);
  const [timeFilter, setTimeFilter] = useState('7D');
  const [hoveredSpecies, setHoveredSpecies] = useState(null);
  const [activeChartTab, setActiveChartTab] = useState('distribution');

  // Base species baseline counts + live simulation increment
  const [speciesCounts, setSpeciesCounts] = useState({
    "Wild Boar": 26,
    "Nilgai": 18,
    "Spotted Deer": 20,
    "Rhesus Macaque": 14,
    "Langur": 9,
    "Gaur": 5,
    "Cattle": 24,
    "Goat": 15
  });

  const [zoneCounts, setZoneCounts] = useState({
    "North Field (FN-1)": 32,
    "East Orchard (FN-2)": 20,
    "South-East Pulses (FN-3)": 18,
    "South-West Grass (FN-4)": 16,
    "West Vegetables (FN-5)": 14
  });

  // Increment counts when currentScenario changes
  useEffect(() => {
    if (currentScenario?.species && speciesCounts[currentScenario.species] !== undefined) {
      setSpeciesCounts(prev => ({
        ...prev,
        [currentScenario.species]: prev[currentScenario.species] + 1
      }));
    }
    const zoneName = currentScenario?.nodeId === 1 ? "North Field (FN-1)" :
                     currentScenario?.nodeId === 2 ? "East Orchard (FN-2)" :
                     currentScenario?.nodeId === 3 ? "South-East Pulses (FN-3)" :
                     currentScenario?.nodeId === 4 ? "South-West Grass (FN-4)" : "West Vegetables (FN-5)";
    setZoneCounts(prev => ({
      ...prev,
      [zoneName]: (prev[zoneName] || 10) + 1
    }));
  }, [currentScenario?.species, currentScenario?.sourceFile]);

  // Derived Overview Metrics
  const totalDetections = Object.values(speciesCounts).reduce((a, b) => a + b, 0);
  const highRiskCount = speciesCounts["Wild Boar"] + speciesCounts["Nilgai"] + speciesCounts["Gaur"] + speciesCounts["Rhesus Macaque"];
  const topSpeciesEntry = Object.entries(speciesCounts).sort((a, b) => b[1] - a[1])[0] || ["Wild Boar", 26];
  const deterrentActivations = Math.round(totalDetections * 0.88);
  const avgConfidence = 94.8;

  // Species Array for Charts
  const speciesList = [
    { name: "Wild Boar", code: "WS-WL-WB", emoji: "🐗", count: speciesCounts["Wild Boar"], risk: "High", impact: "Rooting & Grains", peak: "Night", zone: "North Field", color: "#ef4444", barGrad: "from-red-500 to-red-700" },
    { name: "Nilgai", code: "WS-WL-NG", emoji: "🐂", count: speciesCounts["Nilgai"], risk: "High", impact: "Cereals & Pulses", peak: "Morning & Eve", zone: "South-East Field", color: "#f97316", barGrad: "from-orange-500 to-orange-700" },
    { name: "Spotted Deer", code: "WS-WL-SD", emoji: "🦌", count: speciesCounts["Spotted Deer"], risk: "Medium", impact: "Shoot Grazing", peak: "Crepuscular", zone: "South-West Field", color: "#eab308", barGrad: "from-amber-400 to-amber-600" },
    { name: "Rhesus Macaque", code: "WS-WL-RM", emoji: "🐒", count: speciesCounts["Rhesus Macaque"], risk: "High", impact: "Fruit Plucking", peak: "Daylight", zone: "East Orchard", color: "#ec4899", barGrad: "from-pink-500 to-pink-700" },
    { name: "Langur", code: "WS-WL-LG", emoji: "🐒", count: speciesCounts["Langur"], risk: "Medium", impact: "Leaves & Blossoms", peak: "Daylight", zone: "West Field", color: "#a855f7", barGrad: "from-purple-500 to-purple-700" },
    { name: "Gaur", code: "WS-WL-GR", emoji: "🦬", count: speciesCounts["Gaur"], risk: "Very High", impact: "Heavy Biomass Loss", peak: "Night & Eve", zone: "North Forest", color: "#dc2626", barGrad: "from-red-600 to-red-900" },
    { name: "Cattle", code: "WS-DM-CT", emoji: "🐄", count: speciesCounts["Cattle"], risk: "Low", impact: "Foliage Grazing", peak: "Daytime", zone: "East Boundary", color: "#22c55e", barGrad: "from-green-500 to-green-700" },
    { name: "Goat", code: "WS-DM-GT", emoji: "🐐", count: speciesCounts["Goat"], risk: "Low", impact: "Seedling Browsing", peak: "Daytime", zone: "West Trail", color: "#10b981", barGrad: "from-emerald-400 to-emerald-600" }
  ];

  const maxCount = Math.max(...speciesList.map(s => s.count), 1);

  // 7-Day Trend data
  const trendDays = [
    { day: "Mon", intrusions: 12, repelled: 11 },
    { day: "Tue", intrusions: 18, repelled: 16 },
    { day: "Wed", intrusions: 14, repelled: 13 },
    { day: "Thu", intrusions: 24, repelled: 21 },
    { day: "Fri", intrusions: 20, repelled: 18 },
    { day: "Sat", intrusions: 28, repelled: 25 },
    { day: "Sun", intrusions: 22, repelled: 19 }
  ];

  return (
    <div className="space-y-6 select-none text-left">
      
      {/* 1. Header Banner & Filters */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[#0b0f19] border border-slate-900 rounded-xl p-5 shadow-lg">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-green-500/10 text-green-500 border border-green-500/20 flex items-center justify-center shadow-[0_0_20px_rgba(34,197,94,0.2)]">
            <BarChart3 className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-base font-bold text-slate-100 font-sans uppercase tracking-wider flex items-center gap-2">
              Wildlife Intrusion Analytics & Charts
              <span className="text-[9px] font-mono font-bold text-green-400 bg-green-500/10 px-2 py-0.5 rounded border border-green-500/30">
                LIVE TELEMETRY
              </span>
            </h1>
            <p className="text-xs text-slate-400 font-mono mt-0.5">
              Interactive Graphs, Species Distributions, 24h Activity Curves & AI Efficacy Metrics
            </p>
          </div>
        </div>

        {/* Time Window Filter Pills */}
        <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-lg border border-slate-800">
          {[
            { id: 'TODAY', label: 'Today' },
            { id: '7D', label: 'Last 7 Days' },
            { id: '30D', label: 'Last 30 Days' },
            { id: 'ALL', label: 'All Events' }
          ].map((f) => (
            <button
              key={f.id}
              onClick={() => setTimeFilter(f.id)}
              className={`px-3 py-1.5 rounded-md text-[10px] font-mono font-bold transition-all ${
                timeFilter === f.id
                  ? 'bg-green-500 text-slate-950 shadow'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* 2. Top 6 Overview KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {[
          { label: "Total Detections", value: totalDetections, change: "+14% vs prev", color: "text-slate-100", border: "border-slate-900" },
          { label: "High-Risk Intrusions", value: highRiskCount, change: "Active Guard", color: "text-red-400", border: "border-red-500/20" },
          { label: "Most Detected Animal", value: topSpeciesEntry[0], sub: `${topSpeciesEntry[1]} entries`, color: "text-amber-400", border: "border-amber-500/20" },
          { label: "Average Confidence", value: `${avgConfidence}%`, change: "YOLOv11 FP32", color: "text-green-400", border: "border-green-500/20" },
          { label: "Deterrent Activations", value: deterrentActivations, change: "87% Success", color: "text-blue-400", border: "border-blue-500/20" },
          { label: "Farms Protected", value: "5 Nodes", change: "100% Armed", color: "text-slate-200", border: "border-slate-900" }
        ].map((kpi, idx) => (
          <div key={idx} className={`bg-[#0b0f19] border ${kpi.border} rounded-xl p-3.5 flex flex-col justify-between h-24 shadow`}>
            <span className="text-[9px] font-bold font-sans uppercase tracking-wider text-slate-500">{kpi.label}</span>
            <div>
              <div className={`text-lg font-black font-sans truncate ${kpi.color}`}>{kpi.value}</div>
              <div className="text-[8px] font-mono text-slate-400 mt-0.5">{kpi.change || kpi.sub}</div>
            </div>
          </div>
        ))}
      </div>

      {/* 3. PRIMARY GRAPH SECTION: Species Frequency Histogram & 7-Day Trend Spline Curve */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* GRAPH 1: Vertical Column / Bar Histogram of Species Detections */}
        <div className="lg:col-span-2 bg-[#0b0f19] border border-slate-900 rounded-xl p-5 shadow-lg space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-900 pb-3">
            <div>
              <span className="text-xs font-bold text-slate-100 font-sans uppercase tracking-wider block">
                Species Detection Frequency Chart
              </span>
              <p className="text-[10px] text-slate-500 font-mono">Comparative volumetric histogram from YOLOv11 inferences</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[9px] font-mono text-green-400 font-bold bg-green-500/10 px-2 py-0.5 rounded border border-green-500/20">
                8 SPECIES MONITORED
              </span>
            </div>
          </div>

          {/* Interactive SVG Bar Chart */}
          <div className="relative h-64 w-full pt-4">
            <div className="absolute inset-0 flex items-end justify-between gap-2 sm:gap-4 px-2 pb-8 border-b border-slate-900/80">
              {/* Horizontal Grid lines */}
              <div className="absolute inset-x-0 top-0 border-b border-slate-900/40 pointer-events-none" />
              <div className="absolute inset-x-0 top-1/4 border-b border-slate-900/40 pointer-events-none" />
              <div className="absolute inset-x-0 top-2/4 border-b border-slate-900/40 pointer-events-none" />
              <div className="absolute inset-x-0 top-3/4 border-b border-slate-900/40 pointer-events-none" />

              {speciesList.map((sp) => {
                const heightPct = Math.max(12, Math.round((sp.count / maxCount) * 100));
                const isHovered = hoveredSpecies === sp.name;
                return (
                  <div 
                    key={sp.name}
                    onMouseEnter={() => setHoveredSpecies(sp.name)}
                    onMouseLeave={() => setHoveredSpecies(null)}
                    className="relative flex-1 flex flex-col items-center justify-end h-full group cursor-pointer"
                  >
                    {/* Tooltip on Hover */}
                    {isHovered && (
                      <motion.div
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="absolute -top-12 z-30 bg-slate-950/95 border border-slate-800 rounded-lg px-2.5 py-1 text-center shadow-xl whitespace-nowrap pointer-events-none"
                      >
                        <span className="text-xs font-bold text-slate-100 block">{sp.name}</span>
                        <span className="text-[9px] font-mono text-green-400 font-bold">{sp.count} intrusions ({sp.risk} Risk)</span>
                      </motion.div>
                    )}

                    {/* Value Badge on Top of Bar */}
                    <span className="text-[10px] font-mono font-bold text-slate-300 mb-1 opacity-80 group-hover:opacity-100 group-hover:text-green-400 transition-colors">
                      {sp.count}
                    </span>

                    {/* Animated Gradient Bar Column */}
                    <motion.div
                      initial={{ height: 0 }}
                      animate={{ height: `${heightPct}%` }}
                      transition={{ duration: 0.8, ease: "easeOut" }}
                      className={`w-full max-w-[42px] rounded-t-lg bg-gradient-to-t ${sp.barGrad} shadow-lg transition-all duration-300 ${
                        isHovered ? 'brightness-125 scale-105 shadow-[0_0_15px_rgba(34,197,94,0.4)]' : 'brightness-95'
                      }`}
                    />

                    {/* Emoji + Code Label below Axis */}
                    <div className="absolute -bottom-7 flex flex-col items-center text-center">
                      <span className="text-xs select-none">{sp.emoji}</span>
                      <span className="text-[7px] font-mono text-slate-500 font-bold truncate max-w-[44px]">
                        {sp.name.split(' ')[0]}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="pt-4 flex flex-wrap items-center justify-between text-[9px] font-mono text-slate-500">
            <span>Y-Axis: Total Verified Intrusions</span>
            <span>X-Axis: Wildlife Taxonomy (WII Literature IDs)</span>
          </div>
        </div>

        {/* GRAPH 2: 7-Day Intrusion & Deterrence Trend Wave Chart */}
        <div className="bg-[#0b0f19] border border-slate-900 rounded-xl p-5 shadow-lg space-y-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-slate-900 pb-2">
              <span className="text-xs font-bold text-slate-100 font-sans uppercase tracking-wider">
                7-Day Intrusion Trend
              </span>
              <Activity className="h-4 w-4 text-green-400" />
            </div>

            <p className="text-[10px] text-slate-500 font-mono mt-1">
              Daily Intrusions vs Autonomous Repelled Events
            </p>

            {/* SVG Dual Spline Graph */}
            <div className="h-44 w-full pt-4">
              <svg className="w-full h-full" viewBox="0 0 280 120">
                <defs>
                  <linearGradient id="areaIntrusions" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#ef4444" stopOpacity="0.3" />
                    <stop offset="100%" stopColor="#ef4444" stopOpacity="0.0" />
                  </linearGradient>
                  <linearGradient id="areaRepelled" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#22c55e" stopOpacity="0.3" />
                    <stop offset="100%" stopColor="#22c55e" stopOpacity="0.0" />
                  </linearGradient>
                </defs>

                {/* Grid horizontal lines */}
                <line x1="0" y1="30" x2="280" y2="30" stroke="#1e293b" strokeDasharray="2 2" strokeWidth="0.5" />
                <line x1="0" y1="65" x2="280" y2="65" stroke="#1e293b" strokeDasharray="2 2" strokeWidth="0.5" />
                <line x1="0" y1="100" x2="280" y2="100" stroke="#1e293b" strokeWidth="0.8" />

                {/* Area Gradient Fills */}
                <path
                  d="M 10,80 Q 50,45 90,65 T 170,25 T 250,35 L 270,45 L 270,100 L 10,100 Z"
                  fill="url(#areaIntrusions)"
                />
                <path
                  d="M 10,85 Q 50,55 90,70 T 170,35 T 250,45 L 270,55 L 270,100 L 10,100 Z"
                  fill="url(#areaRepelled)"
                />

                {/* Intrusion Line (Red) */}
                <path
                  d="M 10,80 Q 50,45 90,65 T 170,25 T 250,35 L 270,45"
                  fill="none"
                  stroke="#ef4444"
                  strokeWidth="2"
                  strokeLinecap="round"
                />

                {/* Repelled Line (Green) */}
                <path
                  d="M 10,85 Q 50,55 90,70 T 170,35 T 250,45 L 270,55"
                  fill="none"
                  stroke="#22c55e"
                  strokeWidth="2"
                  strokeLinecap="round"
                />

                {/* Data Points */}
                {[
                  { x: 10, y: 80 }, { x: 55, y: 50 }, { x: 95, y: 65 }, 
                  { x: 140, y: 30 }, { x: 185, y: 40 }, { x: 230, y: 22 }, { x: 270, y: 45 }
                ].map((pt, i) => (
                  <circle key={i} cx={pt.x} cy={pt.y} r="3" fill="#ef4444" stroke="#0f172a" strokeWidth="1" />
                ))}

                {[
                  { x: 10, y: 85 }, { x: 55, y: 60 }, { x: 95, y: 72 }, 
                  { x: 140, y: 38 }, { x: 185, y: 48 }, { x: 230, y: 30 }, { x: 270, y: 55 }
                ].map((pt, i) => (
                  <circle key={i} cx={pt.x} cy={pt.y} r="3" fill="#22c55e" stroke="#0f172a" strokeWidth="1" />
                ))}
              </svg>

              {/* Day Labels */}
              <div className="flex justify-between text-[8px] font-mono text-slate-500 px-2 -mt-2">
                {trendDays.map((d) => (
                  <span key={d.day}>{d.day}</span>
                ))}
              </div>
            </div>
          </div>

          {/* Graph Legend */}
          <div className="flex items-center justify-center gap-4 text-[9px] font-mono pt-2 border-t border-slate-900">
            <span className="flex items-center gap-1.5 text-red-400 font-bold">
              <span className="h-2 w-2 rounded-full bg-red-500" />
              Intrusions Detected
            </span>
            <span className="flex items-center gap-1.5 text-green-400 font-bold">
              <span className="h-2 w-2 rounded-full bg-green-500" />
              Successfully Repelled
            </span>
          </div>
        </div>

      </div>

      {/* 4. SECONDARY GRAPH SECTION: 24-Hour Activity Curve & Farm Zone Vulnerability Donut */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* GRAPH 3: 24-Hour Diurnal/Nocturnal Activity Spline Area Curve */}
        <div className="bg-[#0b0f19] border border-slate-900 rounded-xl p-5 shadow-lg space-y-4">
          <div className="flex items-center justify-between border-b border-slate-900 pb-2">
            <div>
              <span className="text-xs font-bold text-slate-100 font-sans uppercase tracking-wider block">
                24-Hour Intrusion Activity Curve
              </span>
              <p className="text-[10px] text-slate-500 font-mono">Diurnal vs Nocturnal movement density (Hourly distribution)</p>
            </div>
            <Clock className="h-4 w-4 text-amber-400" />
          </div>

          {/* Peak Insight Banner */}
          <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-2.5 flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-bold text-amber-400 font-sans">
              <Sparkles className="h-3.5 w-3.5 shrink-0" />
              <span>Peak Activity Window: 21:00 – 00:00 (Night Foraging)</span>
            </div>
            <span className="text-[9px] font-mono font-bold text-amber-300">45% OF RAIDS</span>
          </div>

          {/* 24-Hour Spline Curve SVG */}
          <div className="h-44 w-full relative pt-2">
            <svg className="w-full h-full" viewBox="0 0 320 110">
              <defs>
                <linearGradient id="curveGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.35" />
                  <stop offset="60%" stopColor="#ef4444" stopOpacity="0.15" />
                  <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.0" />
                </linearGradient>
              </defs>

              {/* Day / Night Zones Background */}
              <rect x="0" y="0" width="80" height="90" fill="#0f172a" fillOpacity="0.4" />
              <rect x="80" y="0" width="160" height="90" fill="#1e293b" fillOpacity="0.1" />
              <rect x="240" y="0" width="80" height="90" fill="#0f172a" fillOpacity="0.4" />

              {/* Spline Area Fill */}
              <path
                d="M 0,40 Q 40,75 80,70 T 160,65 T 240,20 T 320,35 L 320,90 L 0,90 Z"
                fill="url(#curveGrad)"
              />

              {/* Spline Stroke Line */}
              <path
                d="M 0,40 Q 40,75 80,70 T 160,65 T 240,20 T 320,35"
                fill="none"
                stroke="#f59e0b"
                strokeWidth="2.5"
                strokeLinecap="round"
              />

              {/* Peak Indicator Node */}
              <circle cx="240" cy="20" r="5" fill="#ef4444" stroke="#ffffff" strokeWidth="1.5" className="animate-pulse" />
              <text x="230" y="12" fill="#f87171" fontSize="7" fontFamily="monospace" fontWeight="bold">PEAK (21:00-00:00)</text>

              {/* Axis Line */}
              <line x1="0" y1="90" x2="320" y2="90" stroke="#334155" strokeWidth="1" />
            </svg>

            {/* Time Ticks */}
            <div className="flex justify-between text-[8px] font-mono text-slate-500 px-1 -mt-1">
              <span>00:00 (Night)</span>
              <span>06:00 (Morning)</span>
              <span>12:00 (Noon)</span>
              <span>18:00 (Dusk)</span>
              <span>24:00 (Midnight)</span>
            </div>
          </div>
        </div>

        {/* GRAPH 4: Farm Zone Vulnerability Radar / Donut Breakdown */}
        <div className="bg-[#0b0f19] border border-slate-900 rounded-xl p-5 shadow-lg space-y-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-slate-900 pb-2">
              <div>
                <span className="text-xs font-bold text-slate-100 font-sans uppercase tracking-wider block">
                  Farm Zone Vulnerability Breakdown
                </span>
                <p className="text-[10px] text-slate-500 font-mono">Perimeter camera node breach distribution</p>
              </div>
              <PieChart className="h-4 w-4 text-blue-400" />
            </div>

            {/* Donut Chart + Zone List split */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center pt-2">
              
              {/* Circular SVG Donut Chart */}
              <div className="relative flex items-center justify-center h-40">
                <svg className="w-36 h-36 transform -rotate-90" viewBox="0 0 100 100">
                  {/* Background Circle */}
                  <circle cx="50" cy="50" r="38" fill="transparent" stroke="#1e293b" strokeWidth="12" />
                  
                  {/* Segments: FN-1 (32%), FN-2 (20%), FN-3 (18%), FN-4 (16%), FN-5 (14%) */}
                  <circle cx="50" cy="50" r="38" fill="transparent" stroke="#ef4444" strokeWidth="12" strokeDasharray="76 238" strokeDashoffset="0" />
                  <circle cx="50" cy="50" r="38" fill="transparent" stroke="#f97316" strokeWidth="12" strokeDasharray="48 238" strokeDashoffset="-76" />
                  <circle cx="50" cy="50" r="38" fill="transparent" stroke="#eab308" strokeWidth="12" strokeDasharray="43 238" strokeDashoffset="-124" />
                  <circle cx="50" cy="50" r="38" fill="transparent" stroke="#3b82f6" strokeWidth="12" strokeDasharray="38 238" strokeDashoffset="-167" />
                  <circle cx="50" cy="50" r="38" fill="transparent" stroke="#22c55e" strokeWidth="12" strokeDasharray="33 238" strokeDashoffset="-205" />
                </svg>

                {/* Center Label */}
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center select-none pointer-events-none">
                  <span className="text-lg font-black font-sans text-slate-100">{totalDetections}</span>
                  <span className="text-[8px] font-mono text-slate-400 uppercase">Intrusions</span>
                </div>
              </div>

              {/* Zone Legend */}
              <div className="space-y-1.5 text-[9px] font-mono">
                {[
                  { name: "North Field (FN-1)", pct: "32%", count: zoneCounts["North Field (FN-1)"], color: "bg-red-500", threat: "Wild Boar / Gaur" },
                  { name: "East Orchard (FN-2)", pct: "20%", count: zoneCounts["East Orchard (FN-2)"], color: "bg-orange-500", threat: "Primates" },
                  { name: "South-East Pulses (FN-3)", pct: "18%", count: zoneCounts["South-East Pulses (FN-3)"], color: "bg-amber-500", threat: "Nilgai" },
                  { name: "South-West Grass (FN-4)", pct: "16%", count: zoneCounts["South-West Grass (FN-4)"], color: "bg-blue-500", threat: "Spotted Deer" },
                  { name: "West Vegetables (FN-5)", pct: "14%", count: zoneCounts["West Vegetables (FN-5)"], color: "bg-green-500", threat: "Livestock" }
                ].map((z, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5 text-slate-300">
                      <span className={`h-2 w-2 rounded-full ${z.color}`} />
                      <span className="truncate max-w-[110px]">{z.name}</span>
                    </span>
                    <span className="font-bold text-slate-100">{z.count} ({z.pct})</span>
                  </div>
                ))}
              </div>

            </div>
          </div>

          <div className="text-[9px] font-mono text-slate-500 pt-1 border-t border-slate-900 text-center">
            Corridor Analysis: Northern stream buffer accounts for 32% of breaches
          </div>
        </div>

      </div>

      {/* 5. Section: AI Performance Benchmark Metrics + Confidence Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* AI Performance Evaluation (Model Evaluation Benchmark) */}
        <div className="bg-[#0b0f19] border border-slate-900 rounded-xl p-5 shadow-lg space-y-4">
          <div className="flex items-center justify-between border-b border-slate-900 pb-2">
            <div>
              <span className="text-xs font-bold text-slate-100 font-sans uppercase tracking-wider block">
                AI Performance Metrics
              </span>
              <p className="text-[10px] text-green-400 font-mono font-bold">
                Model Evaluation — Unseen Test Set (54 Images)
              </p>
            </div>
            <Cpu className="h-4 w-4 text-green-500" />
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: "mAP@50", value: "92.6%", sub: "High Precision Detection", color: "text-green-400" },
              { label: "mAP@50–95", value: "85.8%", sub: "IoU Bounding Overlap", color: "text-green-400" },
              { label: "Precision", value: "89.8%", sub: "Zero False Positives", color: "text-blue-400" },
              { label: "Recall", value: "82.0%", sub: "High Sensitivity Capture", color: "text-amber-400" }
            ].map((metric, idx) => (
              <div key={idx} className="bg-slate-950/80 border border-slate-900 rounded-xl p-3 text-center space-y-0.5">
                <span className="text-[9px] font-mono text-slate-500 block uppercase">{metric.label}</span>
                <span className={`text-xl font-black font-sans ${metric.color}`}>{metric.value}</span>
                <span className="text-[8px] font-mono text-slate-400 block">{metric.sub}</span>
              </div>
            ))}
          </div>

          {/* Confidence Reliability Distribution */}
          <div className="bg-slate-950/60 border border-slate-900 rounded-xl p-3.5 space-y-2 text-[10px] font-mono">
            <span className="text-slate-400 font-bold uppercase text-[9px] block">Confidence Reliability Distribution</span>
            <div className="space-y-1.5">
              <div className="flex justify-between text-slate-300">
                <span className="flex items-center gap-1.5"><span className="h-1.5 w-1.5 rounded-full bg-green-500" /> High Confidence (≥90%):</span>
                <span className="font-bold text-green-400">84.2% of events</span>
              </div>
              <div className="flex justify-between text-slate-300">
                <span className="flex items-center gap-1.5"><span className="h-1.5 w-1.5 rounded-full bg-amber-500" /> Medium Confidence (70–89%):</span>
                <span className="font-bold text-amber-400">12.5% of events</span>
              </div>
              <div className="flex justify-between text-slate-300">
                <span className="flex items-center gap-1.5"><span className="h-1.5 w-1.5 rounded-full bg-red-500" /> Low Confidence (&lt;70%):</span>
                <span className="font-bold text-red-400">3.3% (Noise filtered)</span>
              </div>
            </div>
          </div>
        </div>

        {/* Closed-Loop Deterrent Response Effectiveness */}
        <div className="bg-[#0b0f19] border border-slate-900 rounded-xl p-5 shadow-lg space-y-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-slate-900 pb-2">
              <div>
                <span className="text-xs font-bold text-slate-100 font-sans uppercase tracking-wider block">
                  Deterrent Efficacy Telemetry
                </span>
                <p className="text-[10px] text-slate-500 font-mono">Detection → Response → Repel telemetry</p>
              </div>
              <span className="text-xs font-black font-sans text-green-400 bg-green-500/10 px-2 py-0.5 rounded border border-green-500/20">
                87% SUCCESS RATE
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-[10px] font-mono pt-1">
              {[
                { act: "Ultrasonic Sirens", count: "34 Activations", rate: "91% Repelled" },
                { act: "LED Floodlights", count: "48 Activations", rate: "86% Repelled" },
                { act: "Water Sprinklers", count: "16 Activations", rate: "82% Repelled" },
                { act: "Distress Speaker", count: "22 Activations", rate: "88% Repelled" },
                { act: "Forest Alerts", count: "6 Dispatches", rate: "100% Notified" },
                { act: "Re-Intrusions", count: "4 Repeat Visits", rate: "13% Return Rate" }
              ].map((item, idx) => (
                <div key={idx} className="bg-slate-950/60 border border-slate-900 rounded-lg p-2.5 space-y-0.5">
                  <span className="text-slate-400 font-bold block">{item.act}</span>
                  <span className="text-slate-200 block">{item.count}</span>
                  <span className="text-green-400 font-bold block">{item.rate}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Predictive Insight Box */}
          <div className="bg-slate-950/80 border border-slate-900 rounded-lg p-3 text-left space-y-1">
            <div className="flex items-center gap-1.5 text-xs font-bold text-amber-400 font-sans">
              <span>🔮</span>
              <span>Predictive Activity Forecast</span>
            </div>
            <p className="text-[10px] text-slate-300 font-mono">
              Higher Wild Boar activity predicted tonight for North Field (FN-1). Perimeter floodlights pre-armed.
            </p>
          </div>
        </div>

      </div>

      {/* 6. Section: Comprehensive Species Impact & Response Matrix */}
      <div className="bg-[#0b0f19] border border-slate-900 rounded-xl p-5 shadow-lg space-y-4">
        <div className="border-b border-slate-900 pb-2">
          <span className="text-xs font-bold text-slate-100 font-sans uppercase tracking-wider block">
            Species Impact, Behavior & Autonomous Response Matrix
          </span>
          <p className="text-[10px] text-slate-500 font-mono">Farmer-friendly summary of behavior, crop threats, and automated response actions</p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-[10px] font-mono">
            <thead>
              <tr className="text-slate-500 border-b border-slate-900 h-8">
                <th>Species</th>
                <th>Detections</th>
                <th>Avg Conf</th>
                <th>Risk Level</th>
                <th>Crop Impact</th>
                <th>Active Window</th>
                <th>Common Zone</th>
                <th>Deterrent Used</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-900/60">
              {speciesList.map((sp) => (
                <tr key={sp.name} className="h-10 hover:bg-slate-900/30 transition-colors">
                  <td className="font-sans font-bold text-slate-100 whitespace-nowrap">
                    <span className="mr-1.5">{sp.emoji}</span>
                    {sp.name}
                  </td>
                  <td className="font-bold text-slate-100">{sp.count}</td>
                  <td className="text-green-500 font-bold">{avgConfidence}%</td>
                  <td>
                    <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold uppercase ${
                      sp.risk === 'Very High' || sp.risk === 'High' ? 'bg-red-500/10 text-red-400 border border-red-500/30' :
                      sp.risk === 'Medium' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30' :
                      'bg-green-500/10 text-green-400 border border-green-500/30'
                    }`}>
                      {sp.risk}
                    </span>
                  </td>
                  <td className="text-amber-400 font-semibold">{sp.impact}</td>
                  <td className="text-slate-300">{sp.peak}</td>
                  <td className="text-slate-300">{sp.zone}</td>
                  <td className="text-slate-400">
                    {sp.name === 'Wild Boar' ? 'Siren + LED Floodlight' :
                     sp.name === 'Nilgai' ? 'Directional Floodlight + Alarm' :
                     sp.name === 'Spotted Deer' ? 'Soft Floodlight + Low Alarm' :
                     sp.name === 'Rhesus Macaque' ? 'Sprinkler Pulse + Distress Call' :
                     sp.name === 'Langur' ? 'Overhead Sprinkler + Strobe' :
                     sp.name === 'Gaur' ? 'Non-Contact Strobe + Forest Alert' :
                     sp.name === 'Cattle' ? 'Water Sprinkler Pulse' : 'Warning Buzzer'}
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
