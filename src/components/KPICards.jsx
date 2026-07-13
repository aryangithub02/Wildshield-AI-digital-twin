import React from 'react';
import { Camera, Target, AlertCircle, Wifi, Compass } from 'lucide-react';

export default function KPICards({ kpi }) {
  const cards = [
    {
      title: "Total Cameras",
      value: "12",
      change: "Online",
      icon: Camera,
      color: "text-green-500",
      bgColor: "bg-green-500/10",
      borderColor: "border-green-500/20",
    },
    {
      title: "AI Detections (Today)",
      value: kpi.wildAnimals + 14, // Dynamic value based on KPI state
      change: "↑ 12%",
      icon: Target,
      color: "text-green-500",
      bgColor: "bg-green-500/10",
      borderColor: "border-green-500/20",
    },
    {
      title: "Active Alerts",
      value: kpi.intrusions - 5, // Dynamic value based on KPI state
      change: "High Priority",
      icon: AlertCircle,
      color: "text-red-500",
      bgColor: "bg-red-500/10",
      borderColor: "border-red-500/20",
    },
    {
      title: "Sensors",
      value: "8",
      change: "Online",
      icon: Wifi,
      color: "text-green-500",
      bgColor: "bg-green-500/10",
      borderColor: "border-green-500/20",
    },
    {
      title: "Coverage Area",
      value: "128",
      change: "Hectares",
      icon: Compass,
      color: "text-green-500",
      bgColor: "bg-green-500/10",
      borderColor: "border-green-500/20",
    }
  ];

  return (
    <div className="w-full grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-4 select-none">
      {cards.map((card, index) => {
        const Icon = card.icon;
        return (
          <div
            key={index}
            className="bg-[#111827]/40 border border-slate-900 rounded-xl p-4 flex items-center justify-between transition-all duration-300 hover:border-slate-800 hover:-translate-y-0.5 shadow-md"
          >
            <div className="space-y-1 text-left">
              <span className="text-[10px] font-bold text-slate-400 font-sans uppercase tracking-wider block">
                {card.title}
              </span>
              <span className="text-2xl font-bold text-slate-50 font-sans tracking-tight block">
                {card.value}
              </span>
              
              <div className="flex items-center gap-1">
                {card.title === "Active Alerts" && (
                  <span className="h-1.5 w-1.5 rounded-full bg-red-500 animate-pulse" />
                )}
                {card.title === "Total Cameras" && (
                  <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
                )}
                {card.title === "Sensors" && (
                  <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
                )}
                <span className={`text-[9px] font-mono font-semibold ${
                  card.title === "Active Alerts" ? 'text-red-400' : 'text-slate-400'
                }`}>
                  {card.change}
                </span>
              </div>
            </div>
            
            <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${card.bgColor} ${card.borderColor} border`}>
              <Icon className={`h-5 w-5 ${card.color}`} />
            </div>
          </div>
        );
      })}
    </div>
  );
}
