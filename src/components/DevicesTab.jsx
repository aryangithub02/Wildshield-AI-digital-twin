import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Cpu, Camera, Server, Wifi, Battery, Sun, 
  Terminal, ShieldCheck, Settings, Power 
} from 'lucide-react';

export default function DevicesTab({ simulationState, currentScenario }) {
  const [selectedDeviceId, setSelectedDeviceId] = useState(0); // 0 = Central Hub, 1-5 = Farmer Nodes
  const [inspectorTab, setInspectorTab] = useState('specs'); // 'specs', 'enclosure', 'schematic'

  const activeScenario = currentScenario || {
    nodeId: 5,
    nodeName: "FN-5",
    actuators: { siren: true, floodlight: true, speaker: true, sprinkler: true }
  };

  const isNodeActive = (id) => {
    return id === activeScenario.nodeId && simulationState >= 2 && simulationState <= 4;
  };

  // 6 Devices List matching AutoCAD layout
  const devices = [
    {
      id: 0,
      name: "Central AI Hub",
      model: "Jetson Orin Nano 8GB",
      type: "gateway",
      status: simulationState > 0 && simulationState < 5 ? "INFERENCE" : "RUNNING",
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
      status: isNodeActive(1) ? "CAPTURING" : "ONLINE",
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
      status: isNodeActive(2) ? "CAPTURING" : "ONLINE",
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
      status: isNodeActive(3) ? "CAPTURING" : "ONLINE",
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
      status: isNodeActive(4) ? "CAPTURING" : "ONLINE",
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
      model: "ESP32-WROOM-32",
      type: "node",
      status: isNodeActive(5) ? "CAPTURING" : "ONLINE",
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
  const deterrentActive = selectedDeviceId === activeScenario.nodeId && (simulationState === 3 || simulationState === 4);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-10 gap-6 select-none text-left">
      
      {/* LEFT SIDE: Device Card list (Span 6 columns) */}
      <div className="lg:col-span-6 space-y-4">
        <div className="bg-[#0b0f19] border border-slate-900 rounded-xl p-4 flex items-center justify-between shadow-md">
          <div>
            <h2 className="text-sm font-extrabold text-slate-100 font-sans tracking-wide uppercase leading-none">
              Hardware Device Manager
            </h2>
            <p className="text-[10px] text-slate-500 font-mono mt-1">Inspection & remote diagnostics for edge clusters</p>
          </div>
          <span className="text-[10px] font-mono text-green-500 bg-green-500/10 px-2 py-0.5 rounded border border-green-500/20">
            All nodes online
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

                {/* Telemetry quick values */}
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

      {/* RIGHT SIDE: Device Inspector Tab View (Span 4 columns) */}
      <div className="lg:col-span-4 bg-[#0b0f19] border border-slate-900 rounded-xl p-5 shadow-lg flex flex-col min-h-[500px]">
        <div className="border-b border-slate-900 pb-3 mb-4">
          <p className="text-xs font-bold text-slate-100 font-sans tracking-wide uppercase">Selected Device Inspector</p>
          <span className="text-[10px] font-mono text-slate-400 mt-1 block">{selectedDevice.name}</span>
        </div>

        {/* Tab Selector */}
        <div className="grid grid-cols-3 gap-1 bg-slate-950 p-1 rounded-lg text-[9px] font-bold font-sans uppercase mb-4 text-center border border-slate-900">
          {[
            { id: 'specs', label: 'Specs' },
            { id: 'enclosure', label: 'CAD Box' },
            { id: 'schematic', label: 'Schematic' }
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
          
          {/* TAB 1: Specs & Hardware Details */}
          {inspectorTab === 'specs' && (
            <div className="space-y-4 text-xs font-mono">
              {selectedDevice.id === 0 ? (
                // Central AI Hub Specs
                <div className="space-y-3">
                  <div className="p-3 bg-slate-950 rounded-lg border border-slate-900 space-y-1">
                    <span className="text-slate-500 text-[9px] block">CPU SYSTEM PROCESSOR</span>
                    <p className="text-slate-100 font-bold">NVIDIA Jetson Orin Nano (8GB)</p>
                    <p className="text-[9px] text-slate-500">6-core Arm Cortex-A78AE v8.2 64-bit CPU</p>
                  </div>
                  <div className="p-3 bg-slate-950 rounded-lg border border-slate-900 space-y-1">
                    <span className="text-slate-500 text-[9px] block">AI INFERENCE PROCESSING</span>
                    <p className="text-slate-100 font-bold">40 TOPS AI Engine (Ampere GPU)</p>
                    <p className="text-[9px] text-slate-500">YOLOv11m wildlife identification framework</p>
                  </div>
                  <div className="p-3 bg-slate-950 rounded-lg border border-slate-900 space-y-1">
                    <span className="text-slate-500 text-[9px] block">GATEWAY RF MODULE</span>
                    <p className="text-slate-100 font-bold">SX1278 LoRa SPI Gateway</p>
                    <p className="text-[9px] text-slate-500">Central collector mesh antenna</p>
                  </div>
                </div>
              ) : (
                // Farmer Node specs
                <div className="space-y-3">
                  <div className="p-3 bg-slate-950 rounded-lg border border-slate-900 space-y-1">
                    <span className="text-slate-500 text-[9px] block">MICROCONTROLLER CORE</span>
                    <p className="text-slate-100 font-bold">ESP32-WROOM-32 MCU</p>
                    <p className="text-[9px] text-slate-500">Dual Core Tensilica 32-bit CPU</p>
                  </div>
                  <div className="p-3 bg-slate-950 rounded-lg border border-slate-900 space-y-1">
                    <span className="text-slate-500 text-[9px] block">CAMERA & OPTICAL</span>
                    <p className="text-slate-100 font-bold">2MP OV2640 Image Sensor</p>
                    <p className="text-[9px] text-slate-500">1080p stream transmission capacity</p>
                  </div>
                  <div className="p-3 bg-slate-950 rounded-lg border border-slate-900 space-y-1">
                    <span className="text-slate-500 text-[9px] block">POWER INFRASTRUCTURE</span>
                    <p className="text-slate-100 font-bold">10W Solar Panel + 12V 7Ah Li-ion</p>
                    <p className="text-[9px] text-slate-500">IP65 integrated charge controller board</p>
                  </div>
                </div>
              )}

              {/* Status footer table */}
              <div className="border-t border-slate-900 pt-3 text-[10px] space-y-1 text-slate-400">
                <div className="flex justify-between">
                  <span>RF Mesh Protocol:</span>
                  <span className="text-slate-100">LoRa MAC (Private)</span>
                </div>
                <div className="flex justify-between">
                  <span>Hardware Version:</span>
                  <span className="text-slate-100">v2.4a (AutoCAD Rev)</span>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: AutoCAD Box Enclosure Drawing */}
          {inspectorTab === 'enclosure' && (
            <div className="space-y-4">
              <span className="text-[9px] font-mono text-slate-500 block uppercase">CAD Outer Dimensions Layout (IP65 Enclosure)</span>
              
              {selectedDevice.id === 0 ? (
                // Orin Nano Central Enclosure Profile
                <div className="relative h-44 w-full bg-slate-950 border border-slate-900 rounded-lg flex items-center justify-center">
                  {/* Heat sink and casing profiles */}
                  <div className="w-36 h-20 bg-slate-900 rounded border border-slate-800 flex flex-col justify-between p-2 shadow-inner relative">
                    <div className="flex justify-between">
                      <div className="h-4 w-4 bg-slate-950 border border-slate-800 rounded flex items-center justify-center text-[7px] font-mono text-blue-500">DC</div>
                      <div className="h-4 w-10 bg-slate-950 border border-slate-800 rounded flex items-center justify-center text-[7px] font-mono text-slate-500">ETH</div>
                    </div>
                    {/* CPU Heat sink */}
                    <div className="h-6 w-full bg-slate-950 rounded border border-slate-850 flex gap-0.5 p-0.5 overflow-hidden">
                      {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((i) => (
                        <div key={i} className="h-full w-1 bg-slate-800 rounded-sm" />
                      ))}
                    </div>
                    {/* Brand indicator */}
                    <div className="absolute top-[40%] left-1/2 transform -translate-x-1/2 text-[7px] font-mono text-slate-600 uppercase font-bold tracking-widest">
                      Orin Nano Gateway
                    </div>
                  </div>
                </div>
              ) : (
                // Farmer Node IP65 Box Enclosure Profile (AutoCAD specs)
                <div className="flex gap-4">
                  {/* Front Panel View */}
                  <div className="flex-1 text-center space-y-1">
                    <span className="text-[8px] font-mono text-slate-600 block">FRONT VIEW</span>
                    <div className="relative h-32 w-24 mx-auto bg-slate-900 border-2 border-slate-800 rounded p-1.5 flex flex-col justify-between shadow-2xl">
                      {/* Locking latches */}
                      <div className="absolute top-2 -left-1 w-1 h-3 bg-slate-700 rounded-l" />
                      <div className="absolute bottom-2 -left-1 w-1 h-3 bg-slate-700 rounded-l" />
                      <div className="absolute top-2 -right-1 w-1 h-3 bg-slate-700 rounded-r" />
                      <div className="absolute bottom-2 -right-1 w-1 h-3 bg-slate-700 rounded-r" />

                      {/* Antenna */}
                      <div className="absolute -top-12 right-2 w-1.5 h-12 bg-slate-700 rounded-t" />

                      {/* Camera Lens */}
                      <div className="h-7 w-7 rounded-full bg-slate-950 border border-slate-800 flex items-center justify-center mx-auto mt-2">
                        <div className="h-3.5 w-3.5 rounded-full bg-blue-900 border border-blue-500 flex items-center justify-center">
                          <div className="h-1 w-1 rounded-full bg-white/70" />
                        </div>
                      </div>

                      {/* PIR Sensor Dome */}
                      <div className="h-5 w-5 rounded-full bg-slate-300 border border-slate-400 mx-auto mt-1 flex items-center justify-center shadow-inner opacity-80" />

                      <div className="text-[7px] font-mono text-slate-600 uppercase mt-auto">IP65 Waterproof</div>
                    </div>
                  </div>

                  {/* Side Panel View */}
                  <div className="flex-1 text-center space-y-1">
                    <span className="text-[8px] font-mono text-slate-600 block">SIDE PROFILE</span>
                    <div className="relative h-32 w-14 mx-auto bg-slate-900 border-2 border-slate-800 rounded p-1 flex flex-col justify-between shadow-2xl">
                      {/* Solar panel bracket */}
                      <div className="absolute top-4 -right-5 w-5 h-1.5 bg-slate-700 transform rotate-12" />
                      <div className="absolute top-4 -right-1.5 w-1.5 h-6 bg-slate-600" />
                      
                      {/* Hinge */}
                      <div className="absolute top-2 -left-1 w-1 h-3 bg-slate-800 rounded-l" />
                      <div className="absolute bottom-2 -left-1 w-1 h-3 bg-slate-800 rounded-l" />

                      <div className="text-[7px] font-mono text-slate-600 uppercase mt-auto mx-auto pb-1">D: 120mm</div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: Electrical Circuit Wiring Schematic */}
          {inspectorTab === 'schematic' && (
            <div className="space-y-4">
              <span className="text-[9px] font-mono text-slate-500 block uppercase">Real-time Wiring Grid (AutoCAD Schematics)</span>
              
              {selectedDevice.id === 0 ? (
                // Central Gateway Hub Wiring
                <div className="relative h-44 w-full bg-slate-950 border border-slate-900 rounded-lg flex items-center justify-center p-2">
                  <svg className="w-full h-full text-[7px] font-mono text-slate-400" viewBox="0 0 200 120">
                    {/* Gateway box */}
                    <rect x="70" y="35" width="60" height="50" rx="3" fill="none" stroke="#2563eb" strokeWidth="1" />
                    <text x="80" y="45" fill="#3b82f6" fontWeight="bold">ORIN NANO</text>

                    {/* DC power wiring */}
                    <line x1="20" y1="20" x2="70" y2="45" stroke="#475569" strokeWidth="1" />
                    <text x="25" y="16" fill="#64748b">12V DC input</text>

                    {/* LoRa SPI connections */}
                    <line x1="130" y1="50" x2="175" y2="20" stroke="#3b82f6" strokeWidth="1" strokeDasharray="3 2" />
                    <text x="140" y="16" fill="#3b82f6">LoRa SPI Link</text>

                    {/* RJ45 Ethernet link */}
                    <line x1="130" y1="75" x2="175" y2="100" stroke="#475569" strokeWidth="1" />
                    <text x="142" y="106" fill="#64748b">RJ45 LAN</text>
                  </svg>
                </div>
              ) : (
                // Node Wiring (with active alarm trigger representations)
                <div className="relative h-44 w-full bg-slate-950 border border-slate-900 rounded-lg flex items-center justify-center p-2">
                  <svg className="w-full h-full text-[7px] font-mono text-slate-400" viewBox="0 0 200 120">
                    {/* Solar charge line */}
                    <line x1="20" y1="20" x2="60" y2="40" stroke="#eab308" strokeWidth="1" />
                    <text x="22" y="16" fill="#eab308">Solar (12V Charge)</text>

                    {/* ESP32 Controller Box */}
                    <rect x="60" y="40" width="80" height="50" rx="2" fill="none" stroke="#059669" strokeWidth="1" />
                    <text x="85" y="50" fill="#10b981" fontWeight="bold">ESP32 Core</text>

                    {/* Battery Line */}
                    <line x1="20" y1="85" x2="60" y2="85" stroke="#10b981" strokeWidth="1" />
                    <text x="15" y="96" fill="#10b981">Li-ion (12V 7Ah)</text>

                    {/* Actuator output alarm wiring */}
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
                    <text x="145" y="24" className={activeInBreach ? "fill-red-500 font-bold" : "fill-slate-500"}>
                      Relay {activeInBreach ? 'ACTIVE' : 'STANDBY'}
                    </text>

                    {/* Active GPIO visual connector */}
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
