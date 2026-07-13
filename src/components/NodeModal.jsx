import React, { useState } from 'react';
import { X, Cpu, Info, Layers, Zap } from 'lucide-react';

export default function NodeModal({ node, onClose, simulationState, currentScenario }) {
  const [activeTab, setActiveTab] = useState('enclosure');

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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 h-full items-center justify-center">
              
              {/* Front View */}
              <div className="flex flex-col items-center">
                <span className="text-xs font-bold font-mono text-slate-400 mb-4 tracking-wider">FRONT VIEW (300mm x 200mm)</span>
                <div className="relative w-[180px] h-[270px] bg-slate-800 border-4 border-slate-700 rounded-2xl shadow-2xl flex flex-col items-center justify-between p-4">
                  {/* Corner screws */}
                  <div className="absolute top-2 left-2 w-2 h-2 rounded-full bg-slate-600 border border-slate-500" />
                  <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-slate-600 border border-slate-500" />
                  <div className="absolute bottom-2 left-2 w-2 h-2 rounded-full bg-slate-600 border border-slate-500" />
                  <div className="absolute bottom-2 right-2 w-2 h-2 rounded-full bg-slate-600 border border-slate-500" />

                  {/* Latches */}
                  <div className="absolute top-1/4 -left-1.5 w-1.5 h-6 bg-slate-600 border border-slate-500 rounded" />
                  <div className="absolute top-2/3 -left-1.5 w-1.5 h-6 bg-slate-600 border border-slate-500 rounded" />
                  <div className="absolute top-1/4 -right-1.5 w-1.5 h-6 bg-slate-600 border border-slate-500 rounded" />
                  <div className="absolute top-2/3 -right-1.5 w-1.5 h-6 bg-slate-600 border border-slate-500 rounded" />

                  {/* IP Camera (2MP) */}
                  <div className="flex flex-col items-center mt-4">
                    <div className="h-14 w-14 rounded-full bg-slate-950 border-2 border-slate-600 flex items-center justify-center shadow-inner">
                      <div className="h-8 w-8 rounded-full bg-slate-900 border border-slate-750 flex items-center justify-center relative">
                        {/* Lens reflection */}
                        <div className="absolute top-1 left-1 w-2.5 h-2.5 rounded-full bg-cyan-400/40 blur-[0.5px]" />
                        <div className="h-4 w-4 rounded-full bg-slate-950 border border-slate-800 flex items-center justify-center">
                          <div className="h-1.5 w-1.5 rounded-full bg-blue-500" />
                        </div>
                      </div>
                    </div>
                    <span className="text-[8px] font-mono text-slate-400 mt-1">IP CAMERA (2MP)</span>
                  </div>

                  {/* PIR Sensor */}
                  <div className="flex flex-col items-center">
                    <div className="h-12 w-12 rounded-full bg-slate-200 border-2 border-slate-400 flex items-center justify-center shadow-lg relative overflow-hidden">
                      <div className="absolute inset-0 bg-radial-grid opacity-30" />
                      <div className="h-8 w-8 rounded-full bg-slate-100/60 border border-slate-300" />
                    </div>
                    <span className="text-[8px] font-mono text-slate-400 mt-1">PIR SENSOR</span>
                  </div>

                  {/* Status LED */}
                  <div className="flex flex-col items-center mb-4">
                    <div className={`h-3 w-3 rounded-full border shadow-[0_0_10px] ${
                      isNodeActiveInBreach
                        ? 'bg-red-500 border-red-400 shadow-red-500 animate-ping'
                        : 'bg-green-500 border-green-400 shadow-green-500'
                    }`} />
                    <span className="text-[8px] font-mono text-slate-400 mt-1">STATUS LED</span>
                  </div>

                  {/* Cable Glands */}
                  <div className="absolute -bottom-4 left-1/4 transform -translate-x-1/2 w-4 h-4 bg-slate-950 border border-slate-700 rounded-b" />
                  <div className="absolute -bottom-4 left-1/2 transform -translate-x-1/2 w-4 h-4 bg-slate-950 border border-slate-700 rounded-b" />
                  <div className="absolute -bottom-4 right-1/4 transform -translate-x-1/2 w-4 h-4 bg-slate-950 border border-slate-700 rounded-b" />
                </div>
              </div>

              {/* Side View */}
              <div className="flex flex-col items-center">
                <span className="text-xs font-bold font-mono text-slate-400 mb-4 tracking-wider">SIDE VIEW (300mm x 150mm)</span>
                <div className="relative w-[150px] h-[270px]">
                  
                  {/* Solar Panel */}
                  <div 
                    className="absolute -right-16 top-10 w-[70px] h-[110px] bg-blue-900 border-2 border-slate-400 rounded-md shadow-lg transform rotate-[30deg] flex flex-col justify-between p-1 overflow-hidden"
                    style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 50%, transparent 50%), linear-gradient(90deg, rgba(255,255,255,0.1) 50%, transparent 50%)', backgroundSize: '10px 10px' }}
                  >
                    <div className="text-[6px] font-bold text-white/50 tracking-wider">10W SOLAR</div>
                  </div>

                  {/* Mounting bracket arm */}
                  <div className="absolute right-4 top-[90px] w-8 h-2 bg-slate-500 border border-slate-600 transform rotate-[15deg]" />

                  {/* Antenna */}
                  <div className="absolute left-[30px] -top-8 w-2 h-8 bg-slate-950 border border-slate-800 rounded-t" />

                  {/* Enclosure Box */}
                  <div className="absolute left-[15px] top-0 w-[90px] h-[270px] bg-slate-800 border-4 border-slate-700 rounded-l-2xl shadow-xl">
                    <div className="absolute -left-3 top-4 w-3 h-8 bg-slate-600 border border-slate-500 rounded-l" />
                    <div className="absolute -left-3 bottom-4 w-3 h-8 bg-slate-600 border border-slate-500 rounded-l" />
                    <div className="absolute right-2 top-10 w-2 h-14 bg-slate-950/40 rounded-full" />
                    <div className="absolute right-2 top-32 w-2 h-12 bg-slate-950/40 rounded-full" />
                  </div>

                  {/* Gland */}
                  <div className="absolute left-[50px] -bottom-4 w-4 h-4 bg-slate-950 border border-slate-700 rounded-b" />
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: Circuit Schematic */}
          {activeTab === 'circuit' && (
            <div className="flex flex-col h-full">
              <div className="mb-4 text-xs text-slate-400 font-mono flex items-center justify-between bg-slate-950/40 p-2.5 rounded border border-slate-800">
                <span className="flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-full bg-green-500 animate-pulse" />
                  <span>Solar Input: 10W Panel Charging</span>
                </span>
                <span>Power Bus: 12V DC Battery + 5V Regulated ESP32 Bus</span>
              </div>

              {/* Schematic SVG */}
              <div className="flex-1 min-h-[360px] bg-slate-950 border border-slate-900 rounded-xl p-4 flex items-center justify-center overflow-hidden">
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
                    <tbody>
                      <tr className="border-b border-slate-850 h-8">
                        <td className="text-slate-400">Microcontroller</td>
                        <td className="text-slate-100 font-semibold text-right">ESP32 Dual-Core 240MHz</td>
                      </tr>
                      <tr className="border-b border-slate-850 h-8">
                        <td className="text-slate-400">IP Camera</td>
                        <td className="text-slate-100 font-semibold text-right">2MP OV2640 (1080p Stream)</td>
                      </tr>
                      <tr className="border-b border-slate-850 h-8">
                        <td className="text-slate-400">PIR Sensor Range</td>
                        <td className="text-slate-100 font-semibold text-right">10 Meters (110° FOV)</td>
                      </tr>
                      <tr className="border-b border-slate-850 h-8">
                        <td className="text-slate-400">RF Communication</td>
                        <td className="text-slate-100 font-semibold text-right">LoRa SX1278 (433MHz) / Wi-Fi</td>
                      </tr>
                      <tr className="border-b border-slate-850 h-8">
                        <td className="text-slate-400">Solar Power Input</td>
                        <td className="text-slate-100 font-semibold text-right">10W Monocrystalline, 12V</td>
                      </tr>
                      <tr className="border-b border-slate-850 h-8">
                        <td className="text-slate-400">Enclosure Rating</td>
                        <td className="text-slate-100 font-semibold text-right">IP65 Dust & Waterproof</td>
                      </tr>
                      <tr className="h-8">
                        <td className="text-slate-400">Operating Temperature</td>
                        <td className="text-slate-100 font-semibold text-right">-10°C to 60°C</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* Telemetry Live Data */}
                <div className="glass-panel border-slate-800/80 p-5 rounded-xl space-y-4">
                  <h3 className="text-sm font-bold text-slate-200 border-b border-slate-800 pb-2">LIVE TELEMETRY DATA</h3>
                  <table className="w-full text-xs font-mono">
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
                  </table>
                </div>

              </div>

              {/* Specs footnote */}
              <div className="bg-slate-950/60 p-3 rounded-lg border border-slate-850 flex items-center justify-between text-[10px] font-mono text-slate-400">
                <span>Agrinova Technologies • Project WildShield AI</span>
                <span>Drawing Ref: WS-CAD-01-SH1</span>
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
