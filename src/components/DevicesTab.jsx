import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Cpu, Camera, Server, Wifi, Battery, Sun, Power } from 'lucide-react';
import { getTranslation } from '../utils/translations';

export default function DevicesTab({ simulationState, currentScenario, language }) {
  const t = (key) => getTranslation(language, key);

  const [selectedDeviceId, setSelectedDeviceId] = useState(0);
  const [inspectorTab, setInspectorTab] = useState('specs');
  const [cadView, setCadView] = useState('front');

  const activeScenario = currentScenario || {
    nodeId: 5,
    nodeName: "FN-5",
    actuators: { siren: true, floodlight: true, speaker: true, sprinkler: true }
  };

  const isNodeActive = (id) => {
    return id === activeScenario.nodeId && simulationState >= 2 && simulationState <= 4;
  };

  const devices = [
    {
      id: 0,
      name: "Central AI Hub",
      model: "Jetson Orin Nano 8GB",
      type: "gateway",
      status: simulationState > 0 && simulationState < 5 ? "INFERENCE" : t('active').toUpperCase(),
      telemetry: {
        power: "12.0V DC",
        load: simulationState > 0 && simulationState < 5 ? "82% CPU" : "12% CPU",
        temp: simulationState > 0 && simulationState < 5 ? "48°C" : "36°C",
        signal: "LoRa Gateway OK"
      },
      icon: Server,
      color: "text-blue-400 border-blue-500/20 bg-blue-500/10"
    },
    {
      id: 1,
      name: "Farmer Node 1 (FN-1)",
      model: "ESP32-WROOM-32",
      type: "node",
      status: isNodeActive(1) ? "CAPTURING" : t('online').toUpperCase(),
      telemetry: {
        power: "12.6V (88%)",
        load: isNodeActive(1) ? "64% CPU" : "4% CPU",
        temp: "29°C",
        signal: "-72 dBm RSSI"
      },
      icon: Camera,
      color: isNodeActive(1) ? "text-red-500 border-red-500/30 bg-red-500/10 animate-pulse" : "text-green-500 border-green-500/20 bg-green-500/10"
    },
    {
      id: 2,
      name: "Farmer Node 2 (FN-2)",
      model: "ESP32-WROOM-32",
      type: "node",
      status: isNodeActive(2) ? "CAPTURING" : t('online').toUpperCase(),
      telemetry: {
        power: "12.7V (91%)",
        load: isNodeActive(2) ? "64% CPU" : "4% CPU",
        temp: "28°C",
        signal: "-75 dBm RSSI"
      },
      icon: Camera,
      color: isNodeActive(2) ? "text-red-500 border-red-500/30 bg-red-500/10 animate-pulse" : "text-green-500 border-green-500/20 bg-green-500/10"
    },
    {
      id: 3,
      name: "Farmer Node 3 (FN-3)",
      model: "ESP32-WROOM-32",
      type: "node",
      status: isNodeActive(3) ? "CAPTURING" : t('online').toUpperCase(),
      telemetry: {
        power: "12.8V (94%)",
        load: isNodeActive(3) ? "64% CPU" : "4% CPU",
        temp: "31°C",
        signal: "-70 dBm RSSI"
      },
      icon: Camera,
      color: isNodeActive(3) ? "text-red-500 border-red-500/30 bg-red-500/10 animate-pulse" : "text-green-500 border-green-500/20 bg-green-500/10"
    },
    {
      id: 4,
      name: "Farmer Node 4 (FN-4)",
      model: "ESP32-WROOM-32",
      type: "node",
      status: isNodeActive(4) ? "CAPTURING" : t('online').toUpperCase(),
      telemetry: {
        power: "12.5V (84%)",
        load: isNodeActive(4) ? "64% CPU" : "4% CPU",
        temp: "30°C",
        signal: "-78 dBm RSSI"
      },
      icon: Camera,
      color: isNodeActive(4) ? "text-red-500 border-red-500/30 bg-red-500/10 animate-pulse" : "text-green-500 border-green-500/20 bg-green-500/10"
    },
    {
      id: 5,
      name: "Farmer Node 5 (FN-5)",
      type: "node",
      model: "ESP32-WROOM-32",
      status: isNodeActive(5) ? "CAPTURING" : t('online').toUpperCase(),
      telemetry: {
        power: "12.8V (94%)",
        load: isNodeActive(5) ? "64% CPU" : "4% CPU",
        temp: "28°C",
        signal: "-68 dBm RSSI"
      },
      icon: Camera,
      color: isNodeActive(5) ? "text-red-500 border-red-500/30 bg-red-500/10 animate-pulse" : "text-green-500 border-green-500/20 bg-green-500/10"
    }
  ];

  const selectedDevice = devices.find(d => d.id === selectedDeviceId) || devices[0];
  const activeInBreach = selectedDeviceId === activeScenario.nodeId && simulationState >= 2 && simulationState <= 4;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-10 gap-6 select-none text-left">
      
      {/* LEFT SIDE: Device Card list */}
      <div className="lg:col-span-6 space-y-4">
        <div className="bg-[#0b0f19] border border-slate-900 rounded-xl p-4 flex items-center justify-between shadow-md">
          <div>
            <h2 className="text-sm font-extrabold text-slate-100 font-sans tracking-wide uppercase leading-none">
              {t('hardwareManager')}
            </h2>
            <p className="text-[10px] text-slate-500 font-mono mt-1">{t('remoteDiag')}</p>
          </div>
          <span className="text-[10px] font-mono text-green-500 bg-green-500/10 px-2 py-0.5 rounded border border-green-500/20">
            {t('allNodesOnline')}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {devices.map((device) => {
            const Icon = device.icon;
            const isSelected = device.id === selectedDeviceId;
            return (
              <div
                key={device.id}
                onClick={() => setSelectedDeviceId(device.id)}
                className={`p-4 rounded-xl border cursor-pointer transition-all duration-300 ${
                  isSelected 
                    ? 'bg-[#111827]/60 border-green-500/40 shadow-[0_0_15px_rgba(34,197,94,0.1)]'
                    : 'bg-[#0b0f19] border-slate-900/60 hover:border-slate-800'
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className={`h-8 w-8 rounded-lg flex items-center justify-center border ${device.color}`}>
                      <Icon className="h-4.5 w-4.5" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-100">{device.name}</p>
                      <p className="text-[8px] font-mono text-slate-500">{device.model}</p>
                    </div>
                  </div>
                  
                  <span className={`inline-flex px-1.5 py-0.5 rounded text-[8px] font-bold font-mono border ${
                    device.status === 'CAPTURING' 
                      ? 'text-red-500 border-red-500/20 bg-red-500/10'
                      : device.status === 'INFERENCE'
                        ? 'text-amber-500 border-amber-500/20 bg-amber-500/10'
                        : 'text-green-500 border-green-500/20 bg-green-500/10'
                  }`}>
                    {device.status}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-[9px] font-mono border-t border-slate-900 pt-3 text-slate-400">
                  <div className="flex items-center gap-1">
                    <Battery className="h-3 w-3 text-slate-500" />
                    <span>Power: {device.telemetry.power}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Cpu className="h-3 w-3 text-slate-500" />
                    <span>CPU: {device.telemetry.load}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Sun className="h-3 w-3 text-slate-500" />
                    <span>Temp: {device.telemetry.temp}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Wifi className="h-3 w-3 text-slate-500" />
                    <span>RF: {device.telemetry.signal}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* RIGHT SIDE: Device Inspector Tab View */}
      <div className="lg:col-span-4 bg-[#0b0f19] border border-slate-900 rounded-xl p-5 shadow-lg flex flex-col min-h-[500px]">
        <div className="border-b border-slate-900 pb-3 mb-4">
          <p className="text-xs font-bold text-slate-100 font-sans tracking-wide uppercase">Selected Device Inspector</p>
          <span className="text-[10px] font-mono text-slate-400 mt-1 block">{selectedDevice.name}</span>
        </div>

        {/* Tab Selector */}
        <div className="grid grid-cols-3 gap-1 bg-slate-950 p-1 rounded-lg text-[9px] font-bold font-sans uppercase mb-4 text-center border border-slate-900">
          {[
            { id: 'specs', label: t('specs') },
            { id: 'enclosure', label: t('cadBox') },
            { id: 'schematic', label: t('schematic') }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setInspectorTab(tab.id)}
              className={`py-1.5 rounded transition-all ${
                inspectorTab === tab.id 
                  ? 'bg-green-500 text-slate-950 shadow-md font-extrabold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Contents */}
        <div className="flex-1 flex flex-col justify-between">
          
          {inspectorTab === 'specs' && (
            <div className="space-y-4 text-xs font-mono">
              {selectedDevice.id === 0 ? (
                <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                  <div className="p-2.5 bg-slate-950 rounded-lg border border-slate-900 space-y-1">
                    <span className="text-slate-500 text-[8px] block">PROCESSOR & PERFORMANCE</span>
                    <p className="text-slate-100 font-bold text-xs">NVIDIA Jetson Orin Nano (8GB)</p>
                    <p className="text-[9px] text-slate-400">6-core ARM® Cortex®-A78AE • Up to 40 TOPS AI (INT8)</p>
                  </div>
                  <div className="p-2.5 bg-slate-950 rounded-lg border border-slate-900 space-y-1">
                    <span className="text-slate-500 text-[8px] block">GPU & GRAPHICS</span>
                    <p className="text-slate-100 font-bold text-xs">1024-core Ampere GPU</p>
                    <p className="text-[9px] text-slate-400">YOLOv11m wildlife identification framework</p>
                  </div>
                  <div className="p-2.5 bg-slate-950 rounded-lg border border-slate-900 space-y-1">
                    <span className="text-slate-500 text-[8px] block">CONNECTIVITY & STORAGE</span>
                    <p className="text-slate-100 font-bold text-xs">LoRa SX1276 | Wi-Fi AC8265 | 2x GbE</p>
                    <p className="text-[9px] text-slate-400">NVMe SSD (256/512GB) / SD Card Backup</p>
                  </div>
                  <div className="p-2.5 bg-slate-950 rounded-lg border border-slate-900 space-y-1">
                    <span className="text-slate-500 text-[8px] block">PHYSICAL & OPERATIONAL</span>
                    <p className="text-slate-100 font-bold text-xs">Passive Heatsink (Fanless)</p>
                    <p className="text-[9px] text-slate-400">200x150x70 mm • ~1.25 kg • 12V 10A DC Input</p>
                  </div>
                </div>
              ) : (
                <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                  <div className="p-2.5 bg-slate-950 rounded-lg border border-slate-900 space-y-1">
                    <span className="text-slate-500 text-[8px] block">CORE CONTROLLER</span>
                    <p className="text-slate-100 font-bold text-xs">ESP32 (Dual Core, 240MHz)</p>
                    <p className="text-[9px] text-slate-400">Tensilica 32-bit CPU • H.264 camera driver</p>
                  </div>
                  <div className="p-2.5 bg-slate-950 rounded-lg border border-slate-900 space-y-1">
                    <span className="text-slate-500 text-[8px] block">CAMERA & SENSOR RANGE</span>
                    <p className="text-slate-100 font-bold text-xs">2MP IP Camera (1080p) + PIR (10m)</p>
                    <p className="text-[9px] text-slate-400">110° FOV motion trigger activation</p>
                  </div>
                  <div className="p-2.5 bg-slate-950 rounded-lg border border-slate-900 space-y-1">
                    <span className="text-slate-500 text-[8px] block">WIRELESS TRANSMISSION</span>
                    <p className="text-slate-100 font-bold text-xs">LoRa SX1278 (2-5 km Range)</p>
                    <p className="text-[9px] text-slate-400">433MHz private RF mesh / 2.4 GHz Wi-Fi</p>
                  </div>
                  <div className="p-2.5 bg-slate-950 rounded-lg border border-slate-900 space-y-1">
                    <span className="text-slate-500 text-[8px] block">POWER INFRASTRUCTURE</span>
                    <p className="text-slate-100 font-bold text-xs">Solar 10W / 12V • Battery 12V 7Ah</p>
                    <p className="text-[9px] text-slate-400">12V/10A MPPT charge controller • 5V/12V dual bus</p>
                  </div>
                  <div className="p-2.5 bg-slate-950 rounded-lg border border-slate-900 space-y-1">
                    <span className="text-slate-500 text-[8px] block">ACTUATORS & ENCLOSURE</span>
                    <p className="text-slate-100 font-bold text-xs">Siren, Flood Light & Sprinkler Relay</p>
                    <p className="text-[9px] text-slate-400">IP65 Waterproof Enclosure • 200x150x300 mm • ~2.0 kg</p>
                  </div>
                </div>
              )}

              <div className="border-t border-slate-900 pt-3 text-[10px] space-y-1 text-slate-400">
                <div className="flex justify-between">
                  <span>RF Mesh Protocol:</span>
                  <span className="text-slate-100">LoRa MAC (Private Mesh)</span>
                </div>
                <div className="flex justify-between">
                  <span>Hardware Version:</span>
                  <span className="text-slate-100">v2.4a (AutoCAD Rev)</span>
                </div>
              </div>
            </div>
          )}

          {inspectorTab === 'enclosure' && (
            <div className="space-y-4">
              <span className="text-[9px] font-mono text-slate-500 block uppercase">CAD Outer Dimensions Layout (IP65 Enclosure)</span>
              
              {/* CAD View Selector */}
              <div className="flex justify-center gap-1 bg-slate-950 p-1 rounded text-[8px] font-bold font-sans uppercase border border-slate-900">
                {[
                  { id: 'front', label: 'Front' },
                  { id: 'side', label: 'Side' },
                  { id: 'top', label: 'Top' },
                  { id: selectedDevice.id === 0 ? 'rear' : 'bottom', label: selectedDevice.id === 0 ? 'Rear' : 'Bottom' }
                ].map((view) => (
                  <button
                    key={view.id}
                    onClick={() => setCadView(view.id)}
                    className={`px-2.5 py-1 rounded transition-all ${
                      cadView === view.id
                        ? 'bg-green-500 text-slate-950 font-extrabold shadow'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {view.label}
                  </button>
                ))}
              </div>

              {/* CAD Drawing Area */}
              <div className="relative h-48 w-full bg-slate-950 border border-slate-900 rounded-lg flex items-center justify-center p-2 overflow-hidden shadow-inner">
                {selectedDevice.id === 0 ? (
                  /* Orin Nano Gateway Views */
                  <>
                    {cadView === 'front' && (
                      <svg viewBox="0 0 500 240" className="w-full h-auto max-h-[160px] text-slate-400 font-mono text-[9px] select-none mx-auto">
                        <rect width="100%" height="100%" fill="none" />
                        <rect x="110" y="25" width="8" height="8" fill="#1e293b" stroke="#475569" strokeWidth="1" />
                        <path d="M 114 25 L 114 5" stroke="#1e293b" strokeWidth="4" strokeLinecap="round" />
                        <rect x="382" y="25" width="8" height="8" fill="#1e293b" stroke="#475569" strokeWidth="1" />
                        <path d="M 386 25 L 386 5" stroke="#1e293b" strokeWidth="4" strokeLinecap="round" />
                        <rect x="100" y="33" width="300" height="105" rx="6" fill="#0f172a" stroke="#475569" strokeWidth="2.5" />
                        {[...Array(30)].map((_, i) => (
                          <line key={i} x1={105 + i * 10} y1="27" x2={105 + i * 10} y2="33" stroke="#475569" strokeWidth="2" />
                        ))}
                        <circle cx="130" cy="80" r="10" fill="#1e293b" stroke="#475569" strokeWidth="1.5" />
                        <circle cx="130" cy="80" r="6" fill="none" stroke="#22c55e" strokeWidth="1.5" />
                        <line x1="130" y1="74" x2="130" y2="80" stroke="#22c55e" strokeWidth="1.5" />
                        <circle cx="165" cy="80" r="4" fill="#22c55e" className="animate-pulse" />
                        <rect x="200" y="60" width="22" height="32" rx="2" fill="#1e293b" stroke="#475569" strokeWidth="1.5" />
                        <rect x="203" y="64" width="16" height="8" rx="1" fill="#0284c7" />
                        <rect x="203" y="78" width="16" height="8" rx="1" fill="#0284c7" />
                        <rect x="235" y="60" width="22" height="32" rx="2" fill="#1e293b" stroke="#475569" strokeWidth="1.5" />
                        <rect x="238" y="64" width="16" height="8" rx="1" fill="#0284c7" />
                        <rect x="238" y="78" width="16" height="8" rx="1" fill="#0284c7" />
                        <rect x="275" y="60" width="24" height="28" rx="2" fill="#1e293b" stroke="#475569" strokeWidth="1.5" />
                        <rect x="281" y="72" width="12" height="12" fill="#0f172a" />
                        <rect x="310" y="60" width="24" height="28" rx="2" fill="#1e293b" stroke="#475569" strokeWidth="1.5" />
                        <rect x="316" y="72" width="12" height="12" fill="#0f172a" />
                        <rect x="350" y="62" width="20" height="24" rx="2" fill="#1e293b" stroke="#475569" strokeWidth="1.5" />
                        <circle cx="360" cy="74" r="6" fill="#0f172a" stroke="#475569" strokeWidth="1" />
                        <line x1="100" y1="165" x2="400" y2="165" stroke="#475569" strokeWidth="1" strokeDasharray="3 3" />
                        <text x="250" y="180" textAnchor="middle" fill="#94a3b8" fontSize="10" fontWeight="bold">200 mm (W) x 70 mm (H)</text>
                      </svg>
                    )}
                    {cadView === 'side' && (
                      <svg viewBox="0 0 500 240" className="w-full h-auto max-h-[160px] text-slate-400 font-mono text-[9px] select-none mx-auto">
                        <rect width="100%" height="100%" fill="none" />
                        <g transform="translate(325, 33) rotate(15)">
                          <rect x="-4" y="-4" width="8" height="8" fill="#1e293b" stroke="#475569" />
                          <path d="M 0 -4 L 0 -70" stroke="#1e293b" strokeWidth="4" strokeLinecap="round" />
                        </g>
                        <rect x="150" y="33" width="200" height="105" rx="4" fill="#0f172a" stroke="#475569" strokeWidth="2.5" />
                        {[...Array(6)].map((_, i) => (
                          <rect key={i} x="160" y={45 + i * 14} width="180" height="6" rx="2" fill="#1e293b" stroke="#475569" strokeWidth="1" />
                        ))}
                        <line x1="150" y1="165" x2="350" y2="165" stroke="#475569" strokeWidth="1" strokeDasharray="3 3" />
                        <text x="250" y="180" textAnchor="middle" fill="#94a3b8" fontSize="10" fontWeight="bold">150 mm (D) x 70 mm (H)</text>
                      </svg>
                    )}
                    {cadView === 'top' && (
                      <svg viewBox="0 0 500 240" className="w-full h-auto max-h-[160px] text-slate-400 font-mono text-[9px] select-none mx-auto">
                        <rect width="100%" height="100%" fill="none" />
                        <rect x="125" y="15" width="250" height="187.5" rx="8" fill="#0f172a" stroke="#475569" strokeWidth="2.5" />
                        {[...Array(23)].map((_, i) => (
                          <rect key={i} x={135 + i * 10} y="22" width="4" height="173.5" rx="1" fill="#1e293b" stroke="#334155" strokeWidth="0.5" />
                        ))}
                        <circle cx="133" cy="23" r="3.5" fill="#475569" stroke="#64748b" strokeWidth="0.5" />
                        <circle cx="367" cy="23" r="3.5" fill="#475569" stroke="#64748b" strokeWidth="0.5" />
                        <circle cx="133" cy="194.5" r="3.5" fill="#475569" stroke="#64748b" strokeWidth="0.5" />
                        <circle cx="367" cy="194.5" r="3.5" fill="#475569" stroke="#64748b" strokeWidth="0.5" />
                        <line x1="125" y1="218" x2="375" y2="218" stroke="#475569" strokeWidth="1" strokeDasharray="3 3" />
                        <text x="250" y="233" textAnchor="middle" fill="#94a3b8" fontSize="10" fontWeight="bold">200 mm (W) x 150 mm (D)</text>
                      </svg>
                    )}
                    {cadView === 'rear' && (
                      <svg viewBox="0 0 500 240" className="w-full h-auto max-h-[160px] text-slate-400 font-mono text-[9px] select-none mx-auto">
                        <rect width="100%" height="100%" fill="none" />
                        <path d="M 114 33 L 114 13" stroke="#1e293b" strokeWidth="4" strokeLinecap="round" />
                        <path d="M 386 33 L 386 13" stroke="#1e293b" strokeWidth="4" strokeLinecap="round" />
                        <rect x="100" y="33" width="300" height="105" rx="6" fill="#0f172a" stroke="#475569" strokeWidth="2.5" />
                        {[...Array(30)].map((_, i) => (
                          <line key={i} x1={105 + i * 10} y1="27" x2={105 + i * 10} y2="33" stroke="#475569" strokeWidth="2" />
                        ))}
                        <rect x="130" y="65" width="25" height="16" rx="2" fill="#1e293b" stroke="#475569" strokeWidth="1.5" />
                        <rect x="180" y="60" width="22" height="32" rx="2" fill="#1e293b" stroke="#475569" strokeWidth="1.5" />
                        <rect x="183" y="64" width="16" height="8" rx="1" fill="#0284c7" />
                        <rect x="183" y="78" width="16" height="8" rx="1" fill="#0284c7" />
                        <rect x="230" y="60" width="24" height="28" rx="2" fill="#1e293b" stroke="#475569" strokeWidth="1.5" />
                        <rect x="270" y="60" width="24" height="28" rx="2" fill="#1e293b" stroke="#475569" strokeWidth="1.5" />
                        <rect x="320" y="62" width="20" height="24" rx="2" fill="#1e293b" stroke="#475569" strokeWidth="1.5" />
                        <circle cx="330" cy="74" r="6" fill="#0f172a" stroke="#475569" />
                        <line x1="100" y1="165" x2="400" y2="165" stroke="#475569" strokeWidth="1" strokeDasharray="3 3" />
                        <text x="250" y="180" textAnchor="middle" fill="#94a3b8" fontSize="10" fontWeight="bold">REAR: HDMI | USB 3.0 | GbE LAN</text>
                      </svg>
                    )}
                  </>
                ) : (
                  /* Farmer Node Views */
                  <>
                    {cadView === 'front' && (
                      <svg viewBox="0 0 500 280" className="w-full h-auto max-h-[170px] text-slate-400 font-mono text-[9px] select-none mx-auto">
                        <rect width="100%" height="100%" fill="none" />
                        <path d="M 315 60 L 315 15" stroke="#1e293b" strokeWidth="4" strokeLinecap="round" />
                        <rect x="180" y="40" width="140" height="210" rx="10" fill="#0f172a" stroke="#475569" strokeWidth="2.5" />
                        <circle cx="190" cy="50" r="3" fill="#475569" stroke="#64748b" />
                        <circle cx="310" cy="50" r="3" fill="#475569" stroke="#64748b" />
                        <circle cx="190" cy="240" r="3" fill="#475569" stroke="#64748b" />
                        <circle cx="310" cy="240" r="3" fill="#475569" stroke="#64748b" />
                        <circle cx="250" cy="85" r="22" fill="#1e293b" stroke="#475569" strokeWidth="1.5" />
                        <circle cx="250" cy="85" r="4.5" fill="#0284c7" />
                        <circle cx="250" cy="155" r="18" fill="#e2e8f0" stroke="#cbd5e1" strokeWidth="1.2" />
                        <circle cx="250" cy="210" r="3" fill="#22c55e" className={isNodeActive(selectedDevice.id) ? 'animate-ping' : ''} />
                        {[...Array(4)].map((_, i) => (
                          <rect key={i} x={200 + i * 30} y="250" width="10" height="12" fill="#1e293b" stroke="#475569" />
                        ))}
                        <line x1="180" y1="270" x2="320" y2="270" stroke="#475569" strokeWidth="1" strokeDasharray="3 3" />
                        <text x="250" y="280" textAnchor="middle" fill="#94a3b8" fontSize="9" fontWeight="bold">200 mm (W) x 300 mm (H)</text>
                      </svg>
                    )}
                    {cadView === 'side' && (
                      <svg viewBox="0 0 500 280" className="w-full h-auto max-h-[170px] text-slate-400 font-mono text-[9px] select-none mx-auto">
                        <rect width="100%" height="100%" fill="none" />
                        <path d="M 235 50 L 235 5" stroke="#1e293b" strokeWidth="4" strokeLinecap="round" />
                        <g transform="translate(240, 95) rotate(30)">
                          <rect x="-3" y="10" width="6" height="40" fill="#475569" />
                          <rect x="-10" y="45" width="70" height="8" fill="#1e293b" stroke="#475569" strokeWidth="1.5" />
                        </g>
                        <path d="M 180 120 L 240 120 L 240 155 L 180 155" fill="none" stroke="#475569" strokeWidth="2.5" />
                        <rect x="145" y="40" width="90" height="210" rx="8" fill="#0f172a" stroke="#475569" strokeWidth="2.5" />
                        <rect x="185" y="250" width="10" height="12" fill="#1e293b" stroke="#475569" />
                        <line x1="145" y1="270" x2="235" y2="270" stroke="#475569" strokeWidth="1" strokeDasharray="3 3" />
                        <text x="190" y="280" textAnchor="middle" fill="#94a3b8" fontSize="9" fontWeight="bold">150 mm (D) x 300 mm (H)</text>
                      </svg>
                    )}
                    {cadView === 'top' && (
                      <svg viewBox="0 0 500 280" className="w-full h-auto max-h-[170px] text-slate-400 font-mono text-[9px] select-none mx-auto">
                        <rect width="100%" height="100%" fill="none" />
                        <rect x="150" y="65" width="200" height="150" rx="8" fill="#0f172a" stroke="#475569" strokeWidth="2.5" />
                        <rect x="155" y="70" width="190" height="140" fill="#1e3a8a" stroke="#3b82f6" strokeWidth="1.5" />
                        {[...Array(6)].map((_, i) => (
                          <line key={i} x1={155 + i * 38} y1="70" x2={155 + i * 38} y2="210" stroke="#3b82f6" strokeWidth="1" />
                        ))}
                        <line x1="150" y1="240" x2="350" y2="240" stroke="#475569" strokeWidth="1" strokeDasharray="3 3" />
                        <text x="250" y="255" textAnchor="middle" fill="#94a3b8" fontSize="9" fontWeight="bold">200 mm (W) x 150 mm (D) • 10W Solar</text>
                      </svg>
                    )}
                    {cadView === 'bottom' && (
                      <svg viewBox="0 0 500 280" className="w-full h-auto max-h-[170px] text-slate-400 font-mono text-[9px] select-none mx-auto">
                        <rect width="100%" height="100%" fill="none" />
                        <rect x="150" y="65" width="200" height="150" rx="8" fill="#0f172a" stroke="#475569" strokeWidth="2.5" />
                        {[...Array(4)].map((_, i) => (
                          <circle key={i} cx={190 + i * 40} cy="140" r="10" fill="#1e293b" stroke="#475569" strokeWidth="1.5" />
                        ))}
                        <line x1="150" y1="240" x2="350" y2="240" stroke="#475569" strokeWidth="1" strokeDasharray="3 3" />
                        <text x="250" y="255" textAnchor="middle" fill="#94a3b8" fontSize="9" fontWeight="bold">4x Bottom Cable Glands</text>
                      </svg>
                    )}
                  </>
                )}
              </div>
            </div>
          )}

          {inspectorTab === 'schematic' && (
            <div className="space-y-4">
              <span className="text-[9px] font-mono text-slate-500 block uppercase">Real-time Wiring Grid (AutoCAD Schematics)</span>
              
              {selectedDevice.id === 0 ? (
                /* Orin Nano Connection Diagram */
                <div className="relative h-48 w-full bg-slate-950 border border-slate-900 rounded-lg flex items-center justify-center p-2 overflow-hidden shadow-inner">
                  <svg className="w-full h-full text-slate-400 font-mono text-[7px] select-none" viewBox="0 0 200 120">
                    <rect width="100%" height="100%" fill="none" />
                    
                    {/* Jetson Orin Nano */}
                    <rect x="65" y="35" width="70" height="50" rx="3" fill="#0f172a" stroke="#3b82f6" strokeWidth="1" />
                    <text x="100" y="47" textAnchor="middle" fill="#fff" fontWeight="bold" fontSize="7">JETSON HUB</text>
                    <text x="100" y="55" textAnchor="middle" fill="#3b82f6" fontSize="5">ORIN NANO</text>

                    {/* Power Supply */}
                    <rect x="10" y="45" width="35" height="25" rx="2" fill="#1e293b" stroke="#334155" strokeWidth="0.8" />
                    <text x="27" y="55" textAnchor="middle" fill="#fff" fontSize="5">12V DC</text>
                    <line x1="45" y1="57" x2="65" y2="57" stroke="#22c55e" strokeWidth="1" />

                    {/* LoRa Module */}
                    <rect x="10" y="10" width="35" height="25" rx="2" fill="#1e293b" stroke="#3b82f6" strokeWidth="0.8" />
                    <text x="27" y="20" textAnchor="middle" fill="#fff" fontSize="5">LoRa</text>
                    <text x="27" y="28" textAnchor="middle" fill="#3b82f6" fontSize="4">SX1276</text>
                    <line x1="45" y1="22" x2="65" y2="45" stroke="#3b82f6" strokeWidth="0.8" />

                    {/* GPS Module */}
                    <rect x="10" y="80" width="35" height="25" rx="2" fill="#1e293b" stroke="#334155" strokeWidth="0.8" />
                    <text x="27" y="90" textAnchor="middle" fill="#fff" fontSize="5">GPS</text>
                    <line x1="45" y1="92" x2="65" y2="70" stroke="#64748b" strokeWidth="0.8" />

                    {/* Router / ETH */}
                    <rect x="155" y="45" width="35" height="25" rx="2" fill="#1e293b" stroke="#3b82f6" strokeWidth="0.8" />
                    <text x="172" y="55" textAnchor="middle" fill="#fff" fontSize="5">ROUTER</text>
                    <text x="172" y="63" textAnchor="middle" fill="#3b82f6" fontSize="4">LAN LINK</text>
                    <line x1="135" y1="57" x2="155" y2="57" stroke="#3b82f6" strokeWidth="1" strokeDasharray="2 1" />

                    {/* Monitor / HDMI */}
                    <rect x="155" y="10" width="35" height="25" rx="2" fill="#1e293b" stroke="#334155" strokeWidth="0.8" />
                    <text x="172" y="22" textAnchor="middle" fill="#fff" fontSize="5">DISPLAY</text>
                    <line x1="135" y1="45" x2="155" y2="22" stroke="#64748b" strokeWidth="0.8" />

                    {/* Storage */}
                    <rect x="80" y="5" width="40" height="20" rx="2" fill="#1e293b" stroke="#334155" strokeWidth="0.8" />
                    <text x="100" y="14" textAnchor="middle" fill="#fff" fontSize="5">NVMe SSD</text>
                    <line x1="100" y1="25" x2="100" y2="35" stroke="#64748b" strokeWidth="0.8" />
                  </svg>
                </div>
              ) : (
                /* ESP32 Perimeter Node Schematic */
                <div className="relative h-48 w-full bg-slate-950 border border-slate-900 rounded-lg flex items-center justify-center p-2 overflow-hidden shadow-inner">
                  <svg className="w-full h-full text-slate-400 font-mono text-[7px] select-none" viewBox="0 0 200 120">
                    <line x1="20" y1="20" x2="60" y2="40" stroke="#eab308" strokeWidth="1" />
                    <text x="22" y="16" fill="#eab308" fontSize="6">Solar (12V Charge)</text>

                    <rect x="60" y="40" width="80" height="50" rx="2" fill="none" stroke="#059669" strokeWidth="1" />
                    <text x="100" y="52" textAnchor="middle" fill="#10b981" fontWeight="bold" fontSize="8">ESP32 Core</text>
                    <text x="100" y="62" textAnchor="middle" fill="#64748b" fontSize="6">Perimeter Node</text>

                    <line x1="20" y1="85" x2="60" y2="85" stroke="#10b981" strokeWidth="1" />
                    <text x="15" y="96" fill="#10b981" fontSize="6">Li-ion (12V 7Ah)</text>

                    <line 
                      x1="140" 
                      y1="55" 
                      x2="175" 
                      y2="30" 
                      className="transition-all duration-300"
                      stroke={activeInBreach ? "#ef4444" : "#475569"} 
                      strokeWidth="1.2" 
                      strokeDasharray={activeInBreach ? "3 1" : "none"}
                    />
                    <text x="145" y="24" className={activeInBreach ? "fill-red-500 font-bold" : "fill-slate-500"} fontSize="5">
                      Relay {activeInBreach ? 'ACTIVE' : 'STANDBY'}
                    </text>

                    {activeInBreach && (
                      <circle cx="140" cy="55" r="2.5" fill="#ef4444" className="animate-ping" />
                    )}
                  </svg>
                </div>
              )}
            </div>
          )}

        </div>

      </div>

    </div>
  );
}
