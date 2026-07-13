import React from 'react';
import { Camera, Cpu, Activity } from 'lucide-react';

export default function DeviceStatus({ simulationState, currentScenario }) {
  const activeScenario = currentScenario || {
    nodeId: 5,
    nodeName: "FN-5",
    actuators: { siren: true, floodlight: true, speaker: true, sprinkler: true }
  };

  const isNodeActive = (id) => {
    return id === activeScenario.nodeId && simulationState >= 2 && simulationState <= 4;
  };

  const solarRates = {
    1: 6.8,
    2: 7.2,
    3: 8.1,
    4: 6.5,
    5: 8.4
  };

  const devices = [
    {
      id: 1,
      name: "Farmer Node 1 (FN-1)",
      type: "camera",
      status: isNodeActive(1) ? "CAPTURING" : "ONLINE",
      metric: isNodeActive(1) ? "TX Stream • Load 64%" : `Standby • Solar ${solarRates[1]}W`,
      icon: Camera,
      statusClass: isNodeActive(1)
        ? "text-red-500 bg-red-500/10 border-red-500/20 animate-pulse font-bold"
        : "text-green-500 bg-green-500/10 border-green-500/20"
    },
    {
      id: 2,
      name: "Farmer Node 2 (FN-2)",
      type: "camera",
      status: isNodeActive(2) ? "CAPTURING" : "ONLINE",
      metric: isNodeActive(2) ? "TX Stream • Load 64%" : `Standby • Solar ${solarRates[2]}W`,
      icon: Camera,
      statusClass: isNodeActive(2)
        ? "text-red-500 bg-red-500/10 border-red-500/20 animate-pulse font-bold"
        : "text-green-500 bg-green-500/10 border-green-500/20"
    },
    {
      id: 3,
      name: "Farmer Node 3 (FN-3)",
      type: "camera",
      status: isNodeActive(3) ? "CAPTURING" : "ONLINE",
      metric: isNodeActive(3) ? "TX Stream • Load 64%" : `Standby • Solar ${solarRates[3]}W`,
      icon: Camera,
      statusClass: isNodeActive(3)
        ? "text-red-500 bg-red-500/10 border-red-500/20 animate-pulse font-bold"
        : "text-green-500 bg-green-500/10 border-green-500/20"
    },
    {
      id: 4,
      name: "Farmer Node 4 (FN-4)",
      type: "camera",
      status: isNodeActive(4) ? "CAPTURING" : "ONLINE",
      metric: isNodeActive(4) ? "TX Stream • Load 64%" : `Standby • Solar ${solarRates[4]}W`,
      icon: Camera,
      statusClass: isNodeActive(4)
        ? "text-red-500 bg-red-500/10 border-red-500/20 animate-pulse font-bold"
        : "text-green-500 bg-green-500/10 border-green-500/20"
    },
    {
      id: 5,
      name: "Farmer Node 5 (FN-5)",
      type: "camera",
      status: isNodeActive(5) ? "CAPTURING" : "ONLINE",
      metric: isNodeActive(5) ? "TX Stream • Load 64%" : `Standby • Solar ${solarRates[5]}W`,
      icon: Camera,
      statusClass: isNodeActive(5)
        ? "text-red-500 bg-red-500/10 border-red-500/20 animate-pulse font-bold"
        : "text-green-500 bg-green-500/10 border-green-500/20"
    },
    {
      id: 6,
      name: "Central AI Hub (Orin Nano)",
      type: "ai",
      status: simulationState > 0 && simulationState < 5 ? "INFERENCE" : "RUNNING",
      metric: simulationState > 0 && simulationState < 5 ? `Model Load 82%` : "Load 10% • Database OK",
      icon: Cpu,
      statusClass: simulationState > 0 && simulationState < 5
        ? "text-amber-500 bg-amber-500/10 border-amber-500/20 animate-pulse"
        : "text-green-500 bg-green-500/10 border-green-500/20"
    }
  ];

  return (
    <div className="glass-panel rounded-card p-6 border-slate-800 shadow-[0_8px_32px_rgba(0,0,0,0.4)]">
      <div className="flex items-center justify-between mb-4 border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <Activity className="h-5 w-5 text-green-500" />
          <h2 className="text-lg font-bold text-slate-100">Edge Device Status</h2>
        </div>
        <div className="text-[10px] font-mono text-slate-400">Nodes: 6 Active</div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {devices.map((device) => {
          const Icon = device.icon;
          return (
            <div
              key={device.name}
              className="bg-slate-950/40 border border-slate-800/80 rounded-xl p-3.5 flex flex-col justify-between transition-all duration-300 hover:border-slate-700"
            >
              <div className="flex items-start justify-between mb-2">
                <span className="text-xs font-semibold text-slate-300 font-sans tracking-tight">
                  {device.name}
                </span>
                <Icon className="h-4.5 w-4.5 text-slate-500" />
              </div>
              <div className="space-y-1.5 mt-2">
                <span className={`inline-flex px-2 py-0.5 rounded text-[9px] font-bold font-mono border ${device.statusClass}`}>
                  {device.status}
                </span>
                <span className="text-[10px] font-mono text-slate-500 block">
                  {device.metric}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
