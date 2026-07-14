import React, { useState } from 'react';
import { X, Cpu, Info, Layers, Zap } from 'lucide-react';

export default function NodeModal({ node, onClose, simulationState, currentScenario }) {
  const [activeTab, setActiveTab] = useState('enclosure');
  const [cadView, setCadView] = useState('front');

  if (!node) return null;

  // Safe fallback for current scenario
  const activeScenario = currentScenario || {
    species: "Elephant",
    emoji: "🐘",
    threat: "HIGH",
    actuators: { siren: true, floodlight: true, speaker: true, sprinkler: true }
  };

  // Check if inspected node is FN-5 and active in sequence
  const isNodeActiveInBreach = node.id === 5 && simulationState >= 1 && simulationState <= 4;
  const isDeterrentState = node.id === 5 && simulationState >= 3 && simulationState <= 4;

  // Actuator active checks mapped directly to activeScenario
  const isSirenActive = isDeterrentState && activeScenario.actuators.siren;
  const isFloodlightActive = isDeterrentState && activeScenario.actuators.floodlight;
  const isSpeakerActive = isDeterrentState && activeScenario.actuators.speaker;
  const isSprinklerActive = isDeterrentState && activeScenario.actuators.sprinkler;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-4xl h-[650px] bg-slate-900 border border-slate-800 rounded-card shadow-[0_20px_50px_rgba(0,0,0,0.5)] overflow-hidden flex flex-col">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-950/80 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className={`h-8 w-8 rounded-lg flex items-center justify-center border ${
              isNodeActiveInBreach ? 'bg-red-500/10 border-red-500/30' : 'bg-green-500/10 border-green-500/30'
            }`}>
              <Cpu className={`h-4.5 w-4.5 ${isNodeActiveInBreach ? 'text-red-500 animate-pulse' : 'text-green-500'}`} />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-100 font-sans leading-none flex items-center gap-2">
                <span>Farmer Node Monitor: {node.name}</span>
                {isNodeActiveInBreach && (
                  <span className="px-2 py-0.5 text-[8px] font-bold font-mono bg-red-500 text-slate-950 rounded animate-pulse">
                    ACTIVE ALERT ({activeScenario.species})
                  </span>
                )}
              </h2>
              <p className="text-xs text-slate-400 font-mono mt-1">UUID: WS-FN-0{node.id}-ESP32</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Tab Selection */}
        <div className="flex bg-slate-950/40 border-b border-slate-800/80 px-6">
          {[
            { id: 'enclosure', label: '📦 Enclosure CAD', icon: Layers },
            { id: 'circuit', label: '⚡ Circuit Schematic', icon: Zap },
            { id: 'specs', label: '📋 Technical Specs', icon: Info }
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-5 py-3 text-xs font-semibold tracking-wide border-b-2 transition-all font-sans ${
                  activeTab === tab.id
                    ? 'border-green-500 text-green-500 bg-slate-900/40'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                <Icon className="h-4 w-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 bg-slate-900">
          
          {/* TAB 1: Enclosure CAD Viewer */}
          {activeTab === 'enclosure' && (
            <div className="flex flex-col h-full space-y-4">
              {/* CAD View Selector */}
              <div className="flex justify-center gap-2 bg-slate-950 p-1.5 rounded-lg text-xs font-bold font-sans uppercase max-w-md mx-auto border border-slate-800">
                {[
                  { id: 'front', label: 'Front View' },
                  { id: 'side', label: 'Side View' },
                  { id: 'top', label: 'Top View' },
                  { id: node.id === 0 ? 'rear' : 'bottom', label: node.id === 0 ? 'Rear View' : 'Bottom View' }
                ].map((view) => (
                  <button
                    key={view.id}
                    onClick={() => setCadView(view.id)}
                    className={`px-4 py-1.5 rounded transition-all ${
                      cadView === view.id
                        ? 'bg-green-500 text-slate-950 font-extrabold shadow'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {view.label}
                  </button>
                ))}
              </div>

              {/* Rendering selected view */}
              <div className="flex-1 min-h-[300px] flex items-center justify-center bg-slate-950/60 border border-slate-850/80 rounded-xl p-4 overflow-hidden relative shadow-inner">
                {/* Info Overlay */}
                <div className="absolute top-2.5 left-3 text-[9px] font-mono text-slate-500 uppercase tracking-widest">
                  {node.id === 0 ? 'CENTRAL AI HUB CAD' : `${node.name} CAD`} • REV v2.4a
                </div>

                {node.id === 0 ? (
                  /* CENTRAL AI HUB CAD VIEWS */
                  <>
                    {cadView === 'front' && (
                      <svg viewBox="0 0 500 240" className="w-full max-h-[240px] text-slate-400 font-mono text-[9px] select-none mx-auto">
                        <defs>
                          <pattern id="cadGrid" width="20" height="20" patternUnits="userSpaceOnUse">
                            <path d="M 20 0 L 0 0 0 20" fill="none" stroke="rgba(255,255,255,0.015)" strokeWidth="0.5"/>
                          </pattern>
                        </defs>
                        <rect width="100%" height="100%" fill="url(#cadGrid)" rx="6" />
                        
                        {/* Antennas */}
                        <rect x="110" y="25" width="8" height="8" fill="#1e293b" stroke="#475569" strokeWidth="1" />
                        <path d="M 114 25 L 114 5" stroke="#1e293b" strokeWidth="4" strokeLinecap="round" />
                        <rect x="382" y="25" width="8" height="8" fill="#1e293b" stroke="#475569" strokeWidth="1" />
                        <path d="M 386 25 L 386 5" stroke="#1e293b" strokeWidth="4" strokeLinecap="round" />

                        {/* Main Enclosure */}
                        <rect x="100" y="33" width="300" height="105" rx="6" fill="#0f172a" stroke="#475569" strokeWidth="2.5" />
                        
                        {/* Heatsink Fins (Vertical lines along the top edge) */}
                        {[...Array(30)].map((_, i) => (
                          <line key={i} x1={105 + i * 10} y1="27" x2={105 + i * 10} y2="33" stroke="#475569" strokeWidth="2" />
                        ))}
                        
                        {/* Front Panel components */}
                        {/* Power Button */}
                        <circle cx="130" cy="80" r="10" fill="#1e293b" stroke="#475569" strokeWidth="1.5" />
                        <circle cx="130" cy="80" r="6" fill="none" stroke="#22c55e" strokeWidth="1.5" />
                        <line x1="130" y1="74" x2="130" y2="80" stroke="#22c55e" strokeWidth="1.5" />
                        <text x="130" y="102" textAnchor="middle" fill="#64748b" fontSize="7">POWER</text>

                        {/* Status LED */}
                        <circle cx="165" cy="80" r="4" fill="#22c55e" className="animate-pulse" />
                        <circle cx="165" cy="80" r="6" fill="none" stroke="#22c55e" strokeWidth="1" opacity="0.4" />
                        <text x="165" y="102" textAnchor="middle" fill="#64748b" fontSize="7">STATUS</text>

                        {/* Stacked USB 3.0 Ports (1 & 2) */}
                        <rect x="200" y="60" width="22" height="32" rx="2" fill="#1e293b" stroke="#475569" strokeWidth="1.5" />
                        <rect x="203" y="64" width="16" height="8" rx="1" fill="#0284c7" />
                        <rect x="203" y="78" width="16" height="8" rx="1" fill="#0284c7" />
                        <text x="211" y="102" textAnchor="middle" fill="#64748b" fontSize="7">USB 3.0</text>

                        {/* Stacked USB 3.0 Ports (3 & 4) */}
                        <rect x="235" y="60" width="22" height="32" rx="2" fill="#1e293b" stroke="#475569" strokeWidth="1.5" />
                        <rect x="238" y="64" width="16" height="8" rx="1" fill="#0284c7" />
                        <rect x="238" y="78" width="16" height="8" rx="1" fill="#0284c7" />
                        <text x="246" y="102" textAnchor="middle" fill="#64748b" fontSize="7">USB 3.0</text>

                        {/* LAN 1 Port */}
                        <rect x="275" y="60" width="24" height="28" rx="2" fill="#1e293b" stroke="#475569" strokeWidth="1.5" />
                        <rect x="281" y="72" width="12" height="12" fill="#0f172a" />
                        <circle cx="279" cy="64" r="1.5" fill="#f59e0b" />
                        <circle cx="295" cy="64" r="1.5" fill="#22c55e" />
                        <text x="287" y="102" textAnchor="middle" fill="#64748b" fontSize="7">LAN 1</text>

                        {/* LAN 2 Port */}
                        <rect x="310" y="60" width="24" height="28" rx="2" fill="#1e293b" stroke="#475569" strokeWidth="1.5" />
                        <rect x="316" y="72" width="12" height="12" fill="#0f172a" />
                        <circle cx="314" cy="64" r="1.5" fill="#f59e0b" />
                        <circle cx="330" cy="64" r="1.5" fill="#22c55e" />
                        <text x="322" y="102" textAnchor="middle" fill="#64748b" fontSize="7">LAN 2</text>

                        {/* DC IN Port */}
                        <rect x="350" y="62" width="20" height="24" rx="2" fill="#1e293b" stroke="#475569" strokeWidth="1.5" />
                        <circle cx="360" cy="74" r="6" fill="#0f172a" stroke="#475569" strokeWidth="1" />
                        <circle cx="360" cy="74" r="2" fill="#64748b" />
                        <text x="360" y="102" textAnchor="middle" fill="#64748b" fontSize="7">DC IN</text>

                        {/* Dimension Overlay lines */}
                        <line x1="100" y1="165" x2="400" y2="165" stroke="#475569" strokeWidth="1" strokeDasharray="3 3" />
                        <line x1="100" y1="160" x2="100" y2="170" stroke="#475569" strokeWidth="1" />
                        <line x1="400" y1="160" x2="400" y2="170" stroke="#475569" strokeWidth="1" />
                        <text x="250" y="180" textAnchor="middle" fill="#94a3b8" fontSize="9" fontWeight="bold">200 mm (WIDTH)</text>

                        <line x1="75" y1="33" x2="75" y2="138" stroke="#475569" strokeWidth="1" strokeDasharray="3 3" />
                        <line x1="70" y1="33" x2="80" y2="33" stroke="#475569" strokeWidth="1" />
                        <line x1="70" y1="138" x2="80" y2="138" stroke="#475569" strokeWidth="1" />
                        <text x="60" y="85" textAnchor="middle" fill="#94a3b8" fontSize="9" fontWeight="bold" transform="rotate(-90 60 85)">70 mm (HEIGHT)</text>
                      </svg>
                    )}

                    {cadView === 'side' && (
                      <svg viewBox="0 0 500 240" className="w-full max-h-[240px] text-slate-400 font-mono text-[9px] select-none mx-auto">
                        <rect width="100%" height="100%" fill="url(#cadGrid)" rx="6" />
                        
                        {/* Antenna pivoted */}
                        <g transform="translate(325, 33) rotate(15)">
                          <rect x="-4" y="-4" width="8" height="8" fill="#1e293b" stroke="#475569" />
                          <path d="M 0 -4 L 0 -70" stroke="#1e293b" strokeWidth="4" strokeLinecap="round" />
                        </g>

                        {/* Side Profile Enclosure */}
                        <rect x="150" y="33" width="200" height="105" rx="4" fill="#0f172a" stroke="#475569" strokeWidth="2.5" />
                        
                        {/* Cooling Ribs */}
                        {[...Array(6)].map((_, i) => (
                          <rect key={i} x="160" y={45 + i * 14} width="180" height="6" rx="2" fill="#1e293b" stroke="#475569" strokeWidth="1" />
                        ))}

                        {/* Dimension Overlay lines */}
                        <line x1="150" y1="165" x2="350" y2="165" stroke="#475569" strokeWidth="1" strokeDasharray="3 3" />
                        <line x1="150" y1="160" x2="150" y2="170" stroke="#475569" strokeWidth="1" />
                        <line x1="350" y1="160" x2="350" y2="170" stroke="#475569" strokeWidth="1" />
                        <text x="250" y="180" textAnchor="middle" fill="#94a3b8" fontSize="9" fontWeight="bold">150 mm (DEPTH)</text>
                        
                        <line x1="125" y1="33" x2="125" y2="138" stroke="#475569" strokeWidth="1" strokeDasharray="3 3" />
                        <line x1="120" y1="33" x2="130" y2="33" stroke="#475569" strokeWidth="1" />
                        <line x1="120" y1="138" x2="130" y2="138" stroke="#475569" strokeWidth="1" />
                        <text x="110" y="85" textAnchor="middle" fill="#94a3b8" fontSize="9" fontWeight="bold" transform="rotate(-90 110 85)">70 mm (HEIGHT)</text>
                      </svg>
                    )}

                    {cadView === 'top' && (
                      <svg viewBox="0 0 500 240" className="w-full max-h-[240px] text-slate-400 font-mono text-[9px] select-none mx-auto">
                        <rect width="100%" height="100%" fill="url(#cadGrid)" rx="6" />
                        
                        {/* Top View Enclosure Outline */}
                        <rect x="125" y="15" width="250" height="187.5" rx="8" fill="#0f172a" stroke="#475569" strokeWidth="2.5" />
                        
                        {/* Heatsink Fins (Vertical Stripes) */}
                        {[...Array(23)].map((_, i) => (
                          <rect key={i} x={135 + i * 10} y="22" width="4" height="173.5" rx="1" fill="#1e293b" stroke="#334155" strokeWidth="0.5" />
                        ))}

                        {/* Corner Screws */}
                        <circle cx="133" cy="23" r="3.5" fill="#475569" stroke="#64748b" strokeWidth="0.5" />
                        <circle cx="367" cy="23" r="3.5" fill="#475569" stroke="#64748b" strokeWidth="0.5" />
                        <circle cx="133" cy="194.5" r="3.5" fill="#475569" stroke="#64748b" strokeWidth="0.5" />
                        <circle cx="367" cy="194.5" r="3.5" fill="#475569" stroke="#64748b" strokeWidth="0.5" />

                        {/* Dimension Overlay lines */}
                        <line x1="125" y1="218" x2="375" y2="218" stroke="#475569" strokeWidth="1" strokeDasharray="3 3" />
                        <line x1="125" y1="213" x2="125" y2="223" stroke="#475569" strokeWidth="1" />
                        <line x1="375" y1="213" x2="375" y2="223" stroke="#475569" strokeWidth="1" />
                        <text x="250" y="233" textAnchor="middle" fill="#94a3b8" fontSize="9" fontWeight="bold">200 mm (WIDTH)</text>

                        <line x1="100" y1="15" x2="100" y2="202.5" stroke="#475569" strokeWidth="1" strokeDasharray="3 3" />
                        <line x1="95" y1="15" x2="105" y2="15" stroke="#475569" strokeWidth="1" />
                        <line x1="95" y1="202.5" x2="105" y2="202.5" stroke="#475569" strokeWidth="1" />
                        <text x="85" y="108" textAnchor="middle" fill="#94a3b8" fontSize="9" fontWeight="bold" transform="rotate(-90 85 108)">150 mm (DEPTH)</text>
                      </svg>
                    )}

                    {cadView === 'rear' && (
                      <svg viewBox="0 0 500 240" className="w-full max-h-[240px] text-slate-400 font-mono text-[9px] select-none mx-auto">
                        <rect width="100%" height="100%" fill="url(#cadGrid)" rx="6" />
                        
                        {/* Antennas */}
                        <path d="M 114 33 L 114 13" stroke="#1e293b" strokeWidth="4" strokeLinecap="round" />
                        <path d="M 386 33 L 386 13" stroke="#1e293b" strokeWidth="4" strokeLinecap="round" />

                        {/* Main Enclosure */}
                        <rect x="100" y="33" width="300" height="105" rx="6" fill="#0f172a" stroke="#475569" strokeWidth="2.5" />
                        
                        {/* Heatsink Fins (Vertical lines along the top edge) */}
                        {[...Array(30)].map((_, i) => (
                          <line key={i} x1={105 + i * 10} y1="27" x2={105 + i * 10} y2="33" stroke="#475569" strokeWidth="2" />
                        ))}
                        
                        {/* Rear interface elements */}
                        {/* HDMI Port */}
                        <rect x="130" y="65" width="25" height="16" rx="2" fill="#1e293b" stroke="#475569" strokeWidth="1.5" />
                        <path d="M 134 69 L 151 69 L 149 77 L 136 77 Z" fill="#0f172a" stroke="#475569" strokeWidth="1" />
                        <text x="142" y="97" textAnchor="middle" fill="#64748b" fontSize="7">HDMI</text>

                        {/* Stacked USB 3.0 (Rear 2x) */}
                        <rect x="180" y="60" width="22" height="32" rx="2" fill="#1e293b" stroke="#475569" strokeWidth="1.5" />
                        <rect x="183" y="64" width="16" height="8" rx="1" fill="#0284c7" />
                        <rect x="183" y="78" width="16" height="8" rx="1" fill="#0284c7" />
                        <text x="191" y="102" textAnchor="middle" fill="#64748b" fontSize="7">USB (2x)</text>

                        {/* LAN 1 */}
                        <rect x="230" y="60" width="24" height="28" rx="2" fill="#1e293b" stroke="#475569" strokeWidth="1.5" />
                        <rect x="236" y="72" width="12" height="12" fill="#0f172a" />
                        <text x="242" y="102" textAnchor="middle" fill="#64748b" fontSize="7">LAN 1</text>

                        {/* LAN 2 */}
                        <rect x="270" y="60" width="24" height="28" rx="2" fill="#1e293b" stroke="#475569" strokeWidth="1.5" />
                        <rect x="276" y="72" width="12" height="12" fill="#0f172a" />
                        <text x="282" y="102" textAnchor="middle" fill="#64748b" fontSize="7">LAN 2</text>

                        {/* DC IN Port */}
                        <rect x="320" y="62" width="20" height="24" rx="2" fill="#1e293b" stroke="#475569" strokeWidth="1.5" />
                        <circle cx="330" cy="74" r="6" fill="#0f172a" stroke="#475569" strokeWidth="1" />
                        <text x="330" y="102" textAnchor="middle" fill="#64748b" fontSize="7">DC IN</text>

                        {/* Width line */}
                        <line x1="100" y1="165" x2="400" y2="165" stroke="#475569" strokeWidth="1" strokeDasharray="3 3" />
                        <line x1="100" y1="160" x2="100" y2="170" stroke="#475569" strokeWidth="1" />
                        <line x1="400" y1="160" x2="400" y2="170" stroke="#475569" strokeWidth="1" />
                        <text x="250" y="180" textAnchor="middle" fill="#94a3b8" fontSize="9" fontWeight="bold">200 mm (WIDTH)</text>
                      </svg>
                    )}
                  </>
                ) : (
                  /* FARMER PERIMETER NODE CAD VIEWS */
                  <>
                    {cadView === 'front' && (
                      <svg viewBox="0 0 500 280" className="w-full max-h-[280px] text-slate-400 font-mono text-[9px] select-none mx-auto">
                        <defs>
                          <pattern id="cadGrid2" width="20" height="20" patternUnits="userSpaceOnUse">
                            <path d="M 20 0 L 0 0 0 20" fill="none" stroke="rgba(255,255,255,0.015)" strokeWidth="0.5"/>
                          </pattern>
                        </defs>
                        <rect width="100%" height="100%" fill="url(#cadGrid2)" rx="6" />
                        
                        {/* Antenna */}
                        <path d="M 315 60 L 315 15" stroke="#1e293b" strokeWidth="4" strokeLinecap="round" />
                        <rect x="311" y="60" width="8" height="10" fill="#1e293b" stroke="#475569" />

                        {/* Main Enclosure Box */}
                        <rect x="180" y="40" width="140" height="210" rx="10" fill="#0f172a" stroke="#475569" strokeWidth="2.5" />
                        
                        {/* Latches */}
                        <rect x="176" y="80" width="4" height="20" rx="1" fill="#475569" />
                        <rect x="176" y="170" width="4" height="20" rx="1" fill="#475569" />
                        <rect x="320" y="80" width="4" height="20" rx="1" fill="#475569" />
                        <rect x="320" y="170" width="4" height="20" rx="1" fill="#475569" />

                        {/* Corner Screws */}
                        <circle cx="190" cy="50" r="3" fill="#475569" stroke="#64748b" strokeWidth="0.5" />
                        <circle cx="310" cy="50" r="3" fill="#475569" stroke="#64748b" strokeWidth="0.5" />
                        <circle cx="190" cy="240" r="3" fill="#475569" stroke="#64748b" strokeWidth="0.5" />
                        <circle cx="310" cy="240" r="3" fill="#475569" stroke="#64748b" strokeWidth="0.5" />

                        {/* IP Camera (2MP) */}
                        <g transform="translate(250, 85)">
                          <circle cx="0" cy="0" r="22" fill="#1e293b" stroke="#475569" strokeWidth="1.5" />
                          <circle cx="0" cy="0" r="14" fill="#0f172a" stroke="#334155" strokeWidth="1" />
                          <circle cx="-4" cy="-4" r="3" fill="#22d3ee" opacity="0.3" filter="blur(0.5px)" />
                          <circle cx="0" cy="0" r="4.5" fill="#0284c7" />
                          <circle cx="0" cy="0" r="2" fill="#000" />
                          <text x="0" y="30" textAnchor="middle" fill="#64748b" fontSize="6" fontWeight="bold">IP CAMERA 2MP</text>
                        </g>

                        {/* PIR Sensor */}
                        <g transform="translate(250, 155)">
                          <circle cx="0" cy="0" r="18" fill="#e2e8f0" stroke="#cbd5e1" strokeWidth="1.2" />
                          <circle cx="0" cy="0" r="15" fill="none" stroke="#94a3b8" strokeWidth="0.5" strokeDasharray="2 2" />
                          <path d="M -15 0 L 15 0 M 0 -15 L 0 15 M -10 -10 L 10 10 M -10 10 L 10 -10" stroke="#94a3b8" strokeWidth="0.5" opacity="0.6" />
                          <text x="0" y="26" textAnchor="middle" fill="#64748b" fontSize="6" fontWeight="bold">PIR SENSOR (10m)</text>
                        </g>

                        {/* Status LED */}
                        <circle cx="250" cy="210" r="3" fill="#22c55e" className={isNodeActiveInBreach ? 'animate-ping' : ''} />
                        <circle cx="250" cy="210" r="5" fill="none" stroke="#22c55e" strokeWidth="1" opacity="0.3" />
                        <text x="250" y="222" textAnchor="middle" fill="#64748b" fontSize="6" fontWeight="bold">STATUS</text>

                        {/* Cable Glands */}
                        {[...Array(4)].map((_, i) => (
                          <g key={i} transform={`translate(${205 + i * 30}, 250)`}>
                            <rect x="-5" y="0" width="10" height="12" fill="#1e293b" stroke="#475569" strokeWidth="1" />
                            <rect x="-7" y="8" width="14" height="4" fill="#0f172a" />
                          </g>
                        ))}

                        {/* Dimension Overlays */}
                        <line x1="180" y1="270" x2="320" y2="270" stroke="#475569" strokeWidth="1" strokeDasharray="3 3" />
                        <line x1="180" y1="265" x2="180" y2="275" stroke="#475569" strokeWidth="1" />
                        <line x1="320" y1="265" x2="320" y2="275" stroke="#475569" strokeWidth="1" />
                        <text x="250" y="280" textAnchor="middle" fill="#94a3b8" fontSize="9" fontWeight="bold">200 mm (WIDTH)</text>

                        <line x1="150" y1="40" x2="150" y2="250" stroke="#475569" strokeWidth="1" strokeDasharray="3 3" />
                        <line x1="145" y1="40" x2="155" y2="40" stroke="#475569" strokeWidth="1" />
                        <line x1="145" y1="250" x2="155" y2="250" stroke="#475569" strokeWidth="1" />
                        <text x="135" y="145" textAnchor="middle" fill="#94a3b8" fontSize="9" fontWeight="bold" transform="rotate(-90 135 145)">300 mm (HEIGHT)</text>
                      </svg>
                    )}

                    {cadView === 'side' && (
                      <svg viewBox="0 0 500 280" className="w-full max-h-[280px] text-slate-400 font-mono text-[9px] select-none mx-auto">
                        <rect width="100%" height="100%" fill="url(#cadGrid2)" rx="6" />
                        
                        {/* Antenna */}
                        <path d="M 235 50 L 235 5" stroke="#1e293b" strokeWidth="4" strokeLinecap="round" />
                        <rect x="231" y="50" width="8" height="10" fill="#1e293b" stroke="#475569" />

                        {/* Solar Panel (Angled 30 deg) */}
                        <g transform="translate(240, 95) rotate(30)">
                          <rect x="-3" y="10" width="6" height="40" fill="#475569" />
                          <rect x="-10" y="45" width="70" height="8" rx="1" fill="#1e293b" stroke="#475569" strokeWidth="1.5" />
                          <rect x="-5" y="37" width="60" height="8" rx="1" fill="#1e3a8a" stroke="#3b82f6" strokeWidth="1" />
                          <text x="25" y="43" textAnchor="middle" fill="#93c5fd" fontSize="5" fontWeight="bold">10W SOLAR</text>
                        </g>
                        
                        {/* Mounting Bracket */}
                        <path d="M 180 120 L 240 120 L 240 155 L 180 155" fill="none" stroke="#475569" strokeWidth="2.5" />
                        <rect x="235" y="110" width="10" height="45" fill="#334155" stroke="#475569" />

                        {/* Side Enclosure Profile */}
                        <rect x="145" y="40" width="90" height="210" rx="8" fill="#0f172a" stroke="#475569" strokeWidth="2.5" />
                        <rect x="141" y="80" width="4" height="20" rx="1" fill="#475569" />
                        <rect x="141" y="170" width="4" height="20" rx="1" fill="#475569" />

                        {/* Cable Gland */}
                        <rect x="185" y="250" width="10" height="12" fill="#1e293b" stroke="#475569" strokeWidth="1" />

                        {/* Dimension overlays */}
                        <line x1="145" y1="270" x2="235" y2="270" stroke="#475569" strokeWidth="1" strokeDasharray="3 3" />
                        <line x1="145" y1="265" x2="145" y2="275" stroke="#475569" strokeWidth="1" />
                        <line x1="235" y1="265" x2="235" y2="275" stroke="#475569" strokeWidth="1" />
                        <text x="190" y="280" textAnchor="middle" fill="#94a3b8" fontSize="9" fontWeight="bold">150 mm (DEPTH)</text>
                        
                        <line x1="120" y1="40" x2="120" y2="250" stroke="#475569" strokeWidth="1" strokeDasharray="3 3" />
                        <line x1="115" y1="40" x2="125" y2="40" stroke="#475569" strokeWidth="1" />
                        <line x1="115" y1="250" x2="125" y2="250" stroke="#475569" strokeWidth="1" />
                        <text x="110" y="145" textAnchor="middle" fill="#94a3b8" fontSize="9" fontWeight="bold" transform="rotate(-90 110 145)">300 mm (HEIGHT)</text>
                      </svg>
                    )}

                    {cadView === 'top' && (
                      <svg viewBox="0 0 500 280" className="w-full max-h-[280px] text-slate-400 font-mono text-[9px] select-none mx-auto">
                        <rect width="100%" height="100%" fill="url(#cadGrid2)" rx="6" />
                        
                        {/* Enclosure Outline from Top */}
                        <rect x="150" y="65" width="200" height="150" rx="8" fill="#0f172a" stroke="#475569" strokeWidth="2.5" />
                        
                        {/* Solar Panel grid overlay */}
                        <rect x="155" y="70" width="190" height="140" fill="#1e3a8a" stroke="#3b82f6" strokeWidth="1.5" />
                        {[...Array(6)].map((_, i) => (
                          <line key={i} x1={155 + i * 38} y1="70" x2={155 + i * 38} y2="210" stroke="#3b82f6" strokeWidth="1" />
                        ))}
                        {[...Array(5)].map((_, i) => (
                          <line key={i} x1="155" y1={70 + i * 35} x2="345" y2={70 + i * 35} stroke="#3b82f6" strokeWidth="1" />
                        ))}

                        {/* Antenna Base */}
                        <circle cx="330" cy="80" r="5" fill="#1e293b" stroke="#475569" />

                        {/* Dimensions Overlay */}
                        <line x1="150" y1="240" x2="350" y2="240" stroke="#475569" strokeWidth="1" strokeDasharray="3 3" />
                        <line x1="150" y1="235" x2="150" y2="245" stroke="#475569" strokeWidth="1" />
                        <line x1="350" y1="235" x2="350" y2="245" stroke="#475569" strokeWidth="1" />
                        <text x="250" y="255" textAnchor="middle" fill="#94a3b8" fontSize="9" fontWeight="bold">200 mm (WIDTH)</text>

                        <line x1="120" y1="65" x2="120" y2="215" stroke="#475569" strokeWidth="1" strokeDasharray="3 3" />
                        <line x1="115" y1="65" x2="125" y2="65" stroke="#475569" strokeWidth="1" />
                        <line x1="115" y1="215" x2="125" y2="215" stroke="#475569" strokeWidth="1" />
                        <text x="105" y="140" textAnchor="middle" fill="#94a3b8" fontSize="9" fontWeight="bold" transform="rotate(-90 105 140)">150 mm (DEPTH)</text>
                      </svg>
                    )}

                    {cadView === 'bottom' && (
                      <svg viewBox="0 0 500 280" className="w-full max-h-[280px] text-slate-400 font-mono text-[9px] select-none mx-auto">
                        <rect width="100%" height="100%" fill="url(#cadGrid2)" rx="6" />
                        
                        {/* Enclosure Outline from Bottom */}
                        <rect x="150" y="65" width="200" height="150" rx="8" fill="#0f172a" stroke="#475569" strokeWidth="2.5" />
                        
                        {/* 4 Cable Glands shown from bottom */}
                        {[...Array(4)].map((_, i) => (
                          <g key={i} transform={`translate(${190 + i * 40}, 140)`}>
                            <circle cx="0" cy="0" r="10" fill="#1e293b" stroke="#475569" strokeWidth="1.5" />
                            <circle cx="0" cy="0" r="5" fill="#0f172a" stroke="#334155" />
                            <circle cx="0" cy="0" r="2.5" fill="#000" />
                          </g>
                        ))}
                        
                        {/* Mounting Bracket Base */}
                        <rect x="220" y="66" width="60" height="8" fill="#334155" stroke="#475569" />

                        {/* Dimensions Overlay */}
                        <line x1="150" y1="240" x2="350" y2="240" stroke="#475569" strokeWidth="1" strokeDasharray="3 3" />
                        <line x1="150" y1="235" x2="150" y2="245" stroke="#475569" strokeWidth="1" />
                        <line x1="350" y1="235" x2="350" y2="245" stroke="#475569" strokeWidth="1" />
                        <text x="250" y="255" textAnchor="middle" fill="#94a3b8" fontSize="9" fontWeight="bold">200 mm (WIDTH)</text>

                        <line x1="120" y1="65" x2="120" y2="215" stroke="#475569" strokeWidth="1" strokeDasharray="3 3" />
                        <line x1="115" y1="65" x2="125" y2="65" stroke="#475569" strokeWidth="1" />
                        <line x1="115" y1="215" x2="125" y2="215" stroke="#475569" strokeWidth="1" />
                        <text x="105" y="140" textAnchor="middle" fill="#94a3b8" fontSize="9" fontWeight="bold" transform="rotate(-90 105 140)">150 mm (DEPTH)</text>
                      </svg>
                    )}
                  </>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: Circuit Schematic */}
          {activeTab === 'circuit' && (
            <div className="flex flex-col h-full">
              <div className="mb-4 text-xs text-slate-400 font-mono flex items-center justify-between bg-slate-950/40 p-2.5 rounded border border-slate-800">
                <span className="flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-full bg-green-500 animate-pulse" />
                  <span>{node.id === 0 ? "Orin Nano Hub: Operational" : "Solar Input: 10W Panel Charging"}</span>
                </span>
                <span>{node.id === 0 ? "Bus: 12V 10A DC Power Supply Input" : "Power Bus: 12V DC Battery + 5V Regulated ESP32 Bus"}</span>
              </div>

              {/* Schematic SVG */}
              <div className="flex-1 min-h-[360px] bg-slate-950 border border-slate-900 rounded-xl p-4 flex items-center justify-center overflow-hidden">
                {node.id === 0 ? (
                  /* ORIN NANO GATEWAY HARDWARE ARCHITECTURE / CONNECTION DIAGRAM */
                  <svg viewBox="0 0 800 420" className="w-full h-full text-slate-400 font-mono text-[9px] select-none">
                    <defs>
                      <pattern id="schematicGridHub" width="20" height="20" patternUnits="userSpaceOnUse">
                        <path d="M 20 0 L 0 0 0 20" fill="none" stroke="rgba(255,255,255,0.02)" strokeWidth="0.5"/>
                      </pattern>
                    </defs>
                    <rect width="100%" height="100%" fill="url(#schematicGridHub)" />

                    {/* Central Processing Node */}
                    <g transform="translate(310, 120)">
                      <rect width="180" height="180" rx="8" fill="#0f172a" stroke="#3b82f6" strokeWidth="2.5" />
                      <text x="90" y="30" textAnchor="middle" fill="#fff" fontWeight="bold" fontSize="12">JETSON ORIN NANO</text>
                      <text x="90" y="45" textAnchor="middle" fill="#3b82f6" fontSize="7" fontWeight="bold">8GB EDGE AI PLATFORM</text>
                      
                      <rect x="15" y="60" width="150" height="105" rx="4" fill="#0b0f19" stroke="#1e293b" strokeWidth="1" />
                      <text x="25" y="75" fill="#94a3b8" fontSize="7">LoRa (UART) - SX1276</text>
                      <text x="25" y="90" fill="#94a3b8" fontSize="7">Wi-Fi (PCIe) - AC8265</text>
                      <text x="25" y="105" fill="#94a3b8" fontSize="7">GPS (UART) - NEO-6M</text>
                      <text x="25" y="120" fill="#94a3b8" fontSize="7">Storage - NVMe SSD</text>
                      <text x="25" y="135" fill="#94a3b8" fontSize="7">Ethernet (2x GbE)</text>
                      <text x="25" y="150" fill="#94a3b8" fontSize="7">4x USB 3.0 | HDMI</text>
                    </g>

                    {/* POWER MODULE */}
                    <g transform="translate(60, 180)">
                      <rect width="130" height="60" rx="4" fill="#1e293b" stroke="#334155" strokeWidth="1.5" />
                      <text x="65" y="25" textAnchor="middle" fill="#fff" fontWeight="bold">POWER MODULE</text>
                      <text x="65" y="40" textAnchor="middle" fill="#22c55e" fontSize="7">12V DC / 10A Input</text>
                    </g>
                    <path d="M 190,210 L 310,210" fill="none" stroke="#22c55e" strokeWidth="2" />
                    <polygon points="300,206 308,210 300,214" fill="#22c55e" />

                    {/* LoRa GATEWAY */}
                    <g transform="translate(60, 40)">
                      <rect width="130" height="60" rx="4" fill="#1e293b" stroke="#3b82f6" strokeWidth="1.5" />
                      <text x="65" y="25" textAnchor="middle" fill="#fff" fontWeight="bold">LoRa GATEWAY</text>
                      <text x="65" y="40" textAnchor="middle" fill="#3b82f6" fontSize="7">SX1276 (UART)</text>
                    </g>
                    <path d="M 190,70 L 250,70 L 250,140 L 310,140" fill="none" stroke="#3b82f6" strokeWidth="1.5" />
                    <text x="255" y="90" fill="#3b82f6" fontSize="7">UART BUS</text>

                    {/* GPS MODULE */}
                    <g transform="translate(60, 310)">
                      <rect width="130" height="60" rx="4" fill="#1e293b" stroke="#334155" strokeWidth="1.5" />
                      <text x="65" y="25" textAnchor="middle" fill="#fff" fontWeight="bold">GPS MODULE</text>
                      <text x="65" y="40" textAnchor="middle" fill="#64748b" fontSize="7">NEO-6M (UART)</text>
                    </g>
                    <path d="M 190,340 L 250,340 L 250,280 L 310,280" fill="none" stroke="#64748b" strokeWidth="1.5" />

                    {/* STORAGE (NVMe SSD) */}
                    <g transform="translate(335, 20)">
                      <rect width="130" height="50" rx="4" fill="#1e293b" stroke="#334155" strokeWidth="1.5" />
                      <text x="65" y="22" textAnchor="middle" fill="#fff" fontWeight="bold">NVMe SSD / SD</text>
                      <text x="65" y="36" textAnchor="middle" fill="#64748b" fontSize="7">Local Data & OS</text>
                    </g>
                    <path d="M 400,70 L 400,120" fill="none" stroke="#64748b" strokeWidth="1.5" />

                    {/* ROUTER / SWITCH */}
                    <g transform="translate(610, 180)">
                      <rect width="130" height="60" rx="4" fill="#1e293b" stroke="#3b82f6" strokeWidth="1.5" />
                      <text x="65" y="25" textAnchor="middle" fill="#fff" fontWeight="bold">ROUTER / SWITCH</text>
                      <text x="65" y="40" textAnchor="middle" fill="#3b82f6" fontSize="7">Local Network</text>
                    </g>
                    <path d="M 490,210 L 610,210" fill="none" stroke="#3b82f6" strokeWidth="2" strokeDasharray="3 3" />
                    <text x="520" y="200" fill="#3b82f6" fontSize="7">GbE LAN LINK</text>

                    {/* Database / Local Storage Server */}
                    <g transform="translate(610, 300)">
                      <rect width="130" height="40" rx="4" fill="#111827" stroke="#334155" strokeWidth="1.5" />
                      <text x="65" y="24" textAnchor="middle" fill="#94a3b8">DATABASE SERVER</text>
                    </g>
                    <path d="M 675,240 L 675,300" fill="none" stroke="#334155" strokeWidth="1.5" />

                    {/* Monitor */}
                    <g transform="translate(610, 80)">
                      <rect width="130" height="40" rx="4" fill="#111827" stroke="#334155" strokeWidth="1.5" />
                      <text x="65" y="24" textAnchor="middle" fill="#94a3b8">HDMI DISPLAY</text>
                    </g>
                    <path d="M 490,160 L 560,160 L 560,100 L 610,100" fill="none" stroke="#64748b" strokeWidth="1.5" />
                    <text x="525" y="150" fill="#64748b" fontSize="7">HDMI 4K OUT</text>
                  </svg>
                ) : (
                  /* FARMER PERIMETER NODE CIRCUIT SCHEMATIC */
                  <svg viewBox="0 0 800 420" className="w-full h-full text-slate-400 font-mono text-[9px] select-none">
                    
                    {/* Grid background */}
                    <defs>
                      <pattern id="schematicGrid2" width="20" height="20" patternUnits="userSpaceOnUse">
                        <path d="M 20 0 L 0 0 0 20" fill="none" stroke="rgba(255,255,255,0.02)" strokeWidth="0.5"/>
                      </pattern>
                    </defs>
                    <rect width="100%" height="100%" fill="url(#schematicGrid2)" />

                    {/* 1. SOLAR PANEL */}
                    <g transform="translate(30, 60)">
                      <rect width="90" height="60" fill="#1e293b" stroke="#334155" strokeWidth="2" rx="4" />
                      <line x1="0" y1="20" x2="90" y2="20" stroke="rgba(255,255,255,0.1)" />
                      <line x1="0" y1="40" x2="90" y2="40" stroke="rgba(255,255,255,0.1)" />
                      <line x1="30" y1="0" x2="30" y2="60" stroke="rgba(255,255,255,0.1)" />
                      <line x1="60" y1="0" x2="60" y2="60" stroke="rgba(255,255,255,0.1)" />
                      <text x="45" y="33" textAnchor="middle" fill="#fff" fontWeight="bold">SOLAR PANEL</text>
                      <text x="45" y="48" textAnchor="middle" fill="#f59e0b" fontSize="8">10W, 12V</text>
                    </g>

                    {/* 2. CHARGE CONTROLLER */}
                    <g transform="translate(170, 60)">
                      <rect width="90" height="60" fill="#1e293b" stroke="#334155" strokeWidth="2" rx="4" />
                      <text x="45" y="25" textAnchor="middle" fill="#fff" fontWeight="bold">CHARGE</text>
                      <text x="45" y="40" textAnchor="middle" fill="#fff" fontWeight="bold">CONTROLLER</text>
                    </g>

                    {/* 3. BATTERY */}
                    <g transform="translate(170, 180)">
                      <rect width="90" height="60" fill="#1e293b" stroke="#334155" strokeWidth="2" rx="4" />
                      <text x="45" y="28" textAnchor="middle" fill="#fff" fontWeight="bold">12V BATTERY</text>
                      <text x="45" y="43" textAnchor="middle" fill="#3b82f6" fontSize="8" fontWeight="bold">7Ah (Li-ion)</text>
                    </g>

                    {/* 4. ESP32 CONTROLLER */}
                    <g transform="translate(360, 110)">
                      <rect width="130" height="150" fill="#0f172a" stroke="#22c55e" strokeWidth="2" rx="6" className="glow-accent" />
                      <text x="10" y="25" fill="#22c55e" fontSize="8">3V3</text>
                      <text x="10" y="55" fill="#ef4444" fontSize="8">VIN (5V)</text>
                      <text x="10" y="85" fill="#64748b" fontSize="8">GND</text>
                      
                      <text x="120" y="25" fill="#a855f7" fontSize="8" textAnchor="end">GPIO12</text>
                      <text x="120" y="55" fill="#a855f7" fontSize="8" textAnchor="end">GPIO13</text>
                      <text x="120" y="85" fill="#a855f7" fontSize="8" textAnchor="end">GPIO14</text>
                      <text x="120" y="115" fill="#a855f7" fontSize="8" textAnchor="end">GPIO15</text>
                      
                      <text x="65" y="75" textAnchor="middle" fill="#fff" fontWeight="bold" fontSize="12">ESP32</text>
                      <text x="65" y="95" textAnchor="middle" fill="#22c55e" fontSize="7">CONTROLLER</text>
                    </g>

                    {/* 5. IP CAMERA */}
                    <g transform="translate(380, 20)">
                      <rect width="90" height="40" fill="#1e293b" stroke="#334155" strokeWidth="1.5" rx="3" />
                      <text x="45" y="24" textAnchor="middle" fill="#fff">IP CAMERA</text>
                      <text x="45" y="34" textAnchor="middle" fill="#3b82f6" fontSize="7">5V INPUT</text>
                    </g>

                    {/* 6. PIR SENSOR */}
                    <g transform="translate(540, 20)">
                      <rect width="90" height="40" fill="#1e293b" stroke="#334155" strokeWidth="1.5" rx="3" />
                      <text x="45" y="24" textAnchor="middle" fill="#fff">PIR SENSOR</text>
                      <text x="45" y="34" textAnchor="middle" fill="#3b82f6" fontSize="7">5V INPUT</text>
                    </g>

                    {/* 7. LoRa MODULE */}
                    <g transform="translate(540, 110)">
                      <rect width="90" height="50" fill="#1e293b" stroke="#22c55e" strokeWidth="1.5" rx="3" />
                      <text x="45" y="25" textAnchor="middle" fill="#fff">LoRa MODULE</text>
                      <text x="45" y="38" textAnchor="middle" fill="#22c55e" fontSize="7">SX1278 (SPI)</text>
                    </g>

                    {/* 8. DETERRENCE RELAYS & ACTUATORS */}
                    <g transform="translate(650, 200)">
                      <rect width="130" height="190" fill="#0f172a" stroke="#334155" strokeWidth="1.5" rx="5" />
                      <text x="65" y="20" textAnchor="middle" fill="#fff" fontWeight="bold">DETERRENCE ACTUATORS</text>

                      {/* Actuators */}
                      {/* Siren */}
                      <g transform="translate(10, 35)">
                        <rect width="110" height="30" fill={isSirenActive ? 'rgba(239,68,68,0.1)' : '#1e293b'} stroke={isSirenActive ? '#ef4444' : '#334155'} strokeWidth="1" rx="3" />
                        <text x="10" y="18" fill="#fff" fontSize="8">🚨 SIREN</text>
                        <text x="100" y="18" fill={isSirenActive ? '#ef4444' : '#64748b'} fontSize="7" textAnchor="end">{isSirenActive ? 'ACTIVE' : 'OFF'}</text>
                      </g>
                      {/* Flood Light */}
                      <g transform="translate(10, 72)">
                        <rect width="110" height="30" fill={isFloodlightActive ? 'rgba(245,158,11,0.1)' : '#1e293b'} stroke={isFloodlightActive ? '#f59e0b' : '#334155'} strokeWidth="1" rx="3" />
                        <text x="10" y="18" fill="#fff" fontSize="8">💡 FLOOD LIGHT</text>
                        <text x="100" y="18" fill={isFloodlightActive ? '#f59e0b' : '#64748b'} fontSize="7" textAnchor="end">{isFloodlightActive ? 'ACTIVE' : 'OFF'}</text>
                      </g>
                      {/* Speaker */}
                      <g transform="translate(10, 109)">
                        <rect width="110" height="30" fill={isSpeakerActive ? 'rgba(59,130,246,0.1)' : '#1e293b'} stroke={isSpeakerActive ? '#3b82f6' : '#334155'} strokeWidth="1" rx="3" />
                        <text x="10" y="18" fill="#fff" fontSize="8">🔊 PREDATOR SOUND</text>
                        <text x="100" y="18" fill={isSpeakerActive ? '#3b82f6' : '#64748b'} fontSize="7" textAnchor="end">{isSpeakerActive ? 'PLAYING' : 'OFF'}</text>
                      </g>
                      {/* Sprinkler */}
                      <g transform="translate(10, 146)">
                        <rect width="110" height="30" fill={isSprinklerActive ? 'rgba(34,197,94,0.1)' : '#1e293b'} stroke={isSprinklerActive ? '#22c55e' : '#334155'} strokeWidth="1" rx="3" />
                        <text x="10" y="18" fill="#fff" fontSize="8">🚿 SPRINKLER PUMP</text>
                        <text x="100" y="18" fill={isSprinklerActive ? '#22c55e' : '#64748b'} fontSize="7" textAnchor="end">{isSprinklerActive ? 'SPRAYING' : 'OFF'}</text>
                      </g>
                    </g>

                    {/* Paths */}
                    <path d="M 120,90 L 170,90" fill="none" stroke="#f59e0b" strokeWidth="2" />
                    <polygon points="160,87 167,90 160,93" fill="#f59e0b" />
                    
                    <path d="M 215,150 L 215,120" fill="none" stroke="#3b82f6" strokeWidth="2" />
                    
                    <path d="M 260,90 L 310,90 L 310,165 L 360,165" fill="none" stroke="#ef4444" strokeWidth="2" />
                    
                    <path d="M 370,110 L 370,40 L 380,40" fill="none" stroke="#3b82f6" strokeWidth="1.5" />
                    
                    <path d="M 370,110 L 370,8 L 585,8 L 585,20" fill="none" stroke="#3b82f6" strokeWidth="1.5" />

                    {/* PIR Warning connection line */}
                    <path
                      d="M 585,60 L 585,90 L 490,140"
                      fill="none"
                      stroke={isNodeActiveInBreach ? '#ef4444' : '#64748b'}
                      strokeWidth={isNodeActiveInBreach ? '2.5' : '1.5'}
                      className={isNodeActiveInBreach ? 'animate-pulse' : ''}
                    />

                    <path d="M 490,200 L 540,200" fill="none" stroke="#22c55e" strokeWidth="1.5" />
                    <path d="M 490,220 L 540,220" fill="none" stroke="#22c55e" strokeWidth="1.5" />

                    {/* Transistor control relays lines to deterrence box */}
                    <path
                      d="M 490,125 L 515,125 L 515,225 L 650,225"
                      fill="none"
                      stroke={isSirenActive ? '#ef4444' : '#334155'}
                      strokeWidth={isSirenActive ? '2' : '1'}
                    />
                    <path
                      d="M 490,155 L 510,155 L 510,260 L 650,260"
                      fill="none"
                      stroke={isFloodlightActive ? '#f59e0b' : '#334155'}
                      strokeWidth={isFloodlightActive ? '2' : '1'}
                    />
                    <path
                      d="M 490,185 L 505,185 L 505,295 L 650,295"
                      fill="none"
                      stroke={isSpeakerActive ? '#3b82f6' : '#334155'}
                      strokeWidth={isSpeakerActive ? '2' : '1'}
                    />
                    <path
                      d="M 490,215 L 500,215 L 500,330 L 650,330"
                      fill="none"
                      stroke={isSprinklerActive ? '#22c55e' : '#334155'}
                      strokeWidth={isSprinklerActive ? '2' : '1'}
                    />

                  </svg>
                )}
              </div>
            </div>
          )}

          {/* TAB 3: Tech Specs */}
          {activeTab === 'specs' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Hardware Spec */}
                <div className="glass-panel border-slate-800/80 p-5 rounded-xl space-y-4">
                  <h3 className="text-sm font-bold text-slate-200 border-b border-slate-800 pb-2">HARDWARE SPECIFICATIONS</h3>
                  <table className="w-full text-xs font-mono">
                    {node.id === 0 ? (
                      <tbody>
                        <tr className="border-b border-slate-850 h-8">
                          <td className="text-slate-400">Processor</td>
                          <td className="text-slate-100 font-semibold text-right">NVIDIA Jetson Orin Nano 8GB</td>
                        </tr>
                        <tr className="border-b border-slate-850 h-8">
                          <td className="text-slate-400">AI Performance</td>
                          <td className="text-slate-100 font-semibold text-right">Up to 40 TOPS (INT8)</td>
                        </tr>
                        <tr className="border-b border-slate-850 h-8">
                          <td className="text-slate-400">CPU / GPU</td>
                          <td className="text-slate-100 font-semibold text-right">6-core A78AE | 1024-core Ampere</td>
                        </tr>
                        <tr className="border-b border-slate-850 h-8">
                          <td className="text-slate-400">Memory</td>
                          <td className="text-slate-100 font-semibold text-right">8GB 128-bit LPDDR5</td>
                        </tr>
                        <tr className="border-b border-slate-850 h-8">
                          <td className="text-slate-400">Storage</td>
                          <td className="text-slate-100 font-semibold text-right">NVMe SSD (256/512GB) | SD Card</td>
                        </tr>
                        <tr className="border-b border-slate-850 h-8">
                          <td className="text-slate-400">Communication</td>
                          <td className="text-slate-100 font-semibold text-right">LoRa (SX1276) | Wi-Fi | 2x GbE</td>
                        </tr>
                        <tr className="h-8">
                          <td className="text-slate-400">Power Input / Weight</td>
                          <td className="text-slate-100 font-semibold text-right">12V DC, 10A | ~1.25 kg</td>
                        </tr>
                      </tbody>
                    ) : (
                      <tbody>
                        <tr className="border-b border-slate-850 h-8">
                          <td className="text-slate-400">Microcontroller</td>
                          <td className="text-slate-100 font-semibold text-right">ESP32 (Dual Core, 240MHz)</td>
                        </tr>
                        <tr className="border-b border-slate-850 h-8">
                          <td className="text-slate-400">IP Camera</td>
                          <td className="text-slate-100 font-semibold text-right">2MP IP Camera (1080p), H.264</td>
                        </tr>
                        <tr className="border-b border-slate-850 h-8">
                          <td className="text-slate-400">PIR Sensor Range</td>
                          <td className="text-slate-100 font-semibold text-right">10 Meters (110° FOV)</td>
                        </tr>
                        <tr className="border-b border-slate-850 h-8">
                          <td className="text-slate-400">RF Communication</td>
                          <td className="text-slate-100 font-semibold text-right">LoRa (SX1278) | Wi-Fi (2.4 GHz)</td>
                        </tr>
                        <tr className="border-b border-slate-850 h-8">
                          <td className="text-slate-400">Power Supply</td>
                          <td className="text-slate-100 font-semibold text-right">Solar Panel 10W / 12V</td>
                        </tr>
                        <tr className="border-b border-slate-850 h-8">
                          <td className="text-slate-400">Enclosure Rating</td>
                          <td className="text-slate-100 font-semibold text-right">IP65 Waterproof, UV Resistant</td>
                        </tr>
                        <tr className="h-8">
                          <td className="text-slate-400">Dimensions / Weight</td>
                          <td className="text-slate-100 font-semibold text-right">200x150x300 mm | ~2.0 kg</td>
                        </tr>
                      </tbody>
                    )}
                  </table>
                </div>

                {/* Telemetry Live Data */}
                <div className="glass-panel border-slate-800/80 p-5 rounded-xl space-y-4">
                  <h3 className="text-sm font-bold text-slate-200 border-b border-slate-800 pb-2">LIVE TELEMETRY DATA</h3>
                  <table className="w-full text-xs font-mono">
                    {node.id === 0 ? (
                      <tbody>
                        <tr className="border-b border-slate-850 h-8">
                          <td className="text-slate-400">System Power</td>
                          <td className="text-right">
                            <span className="text-green-400 font-bold">12.0V</span>
                            <span className="text-slate-500 text-[10px] ml-1.5">(10A Input Line)</span>
                          </td>
                        </tr>
                        <tr className="border-b border-slate-850 h-8">
                          <td className="text-slate-400">Power Status</td>
                          <td className="text-right">
                            <span className="inline-flex px-1.5 py-0.5 rounded text-[10px] font-bold bg-green-500/10 text-green-500 border border-green-500/20">
                              OPERATIONAL
                            </span>
                          </td>
                        </tr>
                        <tr className="border-b border-slate-850 h-8">
                          <td className="text-slate-400">AI Core Load</td>
                          <td className="text-slate-100 font-semibold text-right">
                            {simulationState > 0 && simulationState < 5 ? "82% CPU / 76% GPU" : "12% CPU / 2% GPU"}
                          </td>
                        </tr>
                        <tr className="border-b border-slate-850 h-8">
                          <td className="text-slate-400">Memory Utilization</td>
                          <td className="text-slate-100 font-semibold text-right">3.8 GB / 8.0 GB (LPDDR5)</td>
                        </tr>
                        <tr className="border-b border-slate-850 h-8">
                          <td className="text-slate-400">LoRa Gateway RSSI</td>
                          <td className="text-slate-100 font-semibold text-right">LoRa Gateway OK (Mesh Active)</td>
                        </tr>
                        <tr className="border-b border-slate-850 h-8">
                          <td className="text-slate-400">Ambient Temperature</td>
                          <td className="text-slate-100 font-semibold text-right">
                            {simulationState > 0 && simulationState < 5 ? "48.2 °C" : "36.4 °C"}
                          </td>
                        </tr>
                        <tr className="h-8">
                          <td className="text-slate-400">OS JetPack Version</td>
                          <td className="text-right">
                            <span className="inline-flex px-1.5 py-0.5 rounded text-[10px] font-bold bg-slate-850 text-slate-400 border border-slate-800">
                              JetPack 6.0 (Ubuntu 22.04)
                            </span>
                          </td>
                        </tr>
                      </tbody>
                    ) : (
                      <tbody>
                        <tr className="border-b border-slate-850 h-8">
                          <td className="text-slate-400">Battery Charge</td>
                          <td className="text-right">
                            <span className="text-green-400 font-bold">12.8V</span>
                            <span className="text-slate-500 text-[10px] ml-1.5">(94% Capacity)</span>
                          </td>
                        </tr>
                        <tr className="border-b border-slate-850 h-8">
                          <td className="text-slate-400">Battery Status</td>
                          <td className="text-right">
                            <span className="inline-flex px-1.5 py-0.5 rounded text-[10px] font-bold bg-green-500/10 text-green-500 border border-green-500/20">
                              CHARGING
                            </span>
                          </td>
                        </tr>
                        <tr className="border-b border-slate-850 h-8">
                          <td className="text-slate-400">Solar Output Rate</td>
                          <td className="text-slate-100 font-semibold text-right">8.4W (Peak Sun)</td>
                        </tr>
                        <tr className="border-b border-slate-850 h-8">
                          <td className="text-slate-400">LoRa Signal strength</td>
                          <td className="text-slate-100 font-semibold text-right">-88 dBm (RSSI)</td>
                        </tr>
                        <tr className="border-b border-slate-850 h-8">
                          <td className="text-slate-400">Ambient Temperature</td>
                          <td className="text-slate-100 font-semibold text-right">28.4 °C</td>
                        </tr>
                        <tr className="border-b border-slate-850 h-8">
                          <td className="text-slate-400">ESP32 Core Load</td>
                          <td className="text-slate-100 font-semibold text-right">
                            {isNodeActiveInBreach ? '64.2%' : '8.1%'}
                          </td>
                        </tr>
                        <tr className="h-8">
                          <td className="text-slate-400">IP camera state</td>
                          <td className="text-right">
                            <span className={`inline-flex px-1.5 py-0.5 rounded text-[10px] font-bold border ${
                              isNodeActiveInBreach
                                ? 'bg-red-500/10 text-red-500 border-red-500/20 animate-pulse'
                                : 'bg-slate-850 text-slate-400 border-slate-800'
                            }`}>
                              {isNodeActiveInBreach ? 'TX STREAM' : 'SLEEP/STANDBY'}
                            </span>
                          </td>
                        </tr>
                      </tbody>
                    )}
                  </table>
                </div>

              </div>

              {/* Specs footnote */}
              <div className="bg-slate-950/60 p-3 rounded-lg border border-slate-850 flex items-center justify-between text-[10px] font-mono text-slate-400">
                <span>Agrinova Technologies • Project WildShield AI</span>
                <span>Drawing Ref: {node.id === 0 ? "WS-CAD-01-HUB" : "WS-CAD-01-SH1"}</span>
              </div>
            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 bg-slate-950/80 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400 font-mono">
          <span>Target area size: 500m × 400m Protected Geofence</span>
          <span>Drawn by: Team WildShield AI</span>
        </div>

      </div>
    </div>
  );
}
