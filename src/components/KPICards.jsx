import React from 'react';
import { Camera, Target, AlertCircle, Wifi, Compass } from 'lucide-react';
import { getTranslation } from '../utils/translations';

export default function KPICards({ kpi, language }) {
  const t = (key) => getTranslation(language, key);

  const cards = [
    {
      title: t('totalCameras'),
      value: "12",
      change: t('online'),
      icon: Camera,
      color: "text-green-500",
      bgColor: "bg-green-500/10",
      borderColor: "border-green-500/20",
    },
    {
      title: t('aiDetectionsToday'),
      value: kpi.wildAnimals + 14,
      change: "↑ 12%",
      icon: Target,
      color: "text-green-500",
      bgColor: "bg-green-500/10",
      borderColor: "border-green-500/20",
    },
    {
      title: t('activeAlerts'),
      value: kpi.intrusions - 5,
      change: t('highPriority'),
      icon: AlertCircle,
      color: "text-red-500",
      bgColor: "bg-red-500/10",
      borderColor: "border-red-500/20",
    },
    {
      title: t('sensors'),
      value: "8",
      change: t('online'),
      icon: Wifi,
      color: "text-green-500",
      bgColor: "bg-green-500/10",
      borderColor: "border-green-500/20",
    },
    {
      title: t('coverageArea'),
      value: "128",
      change: t('hectares'),
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
                {card.title === t('activeAlerts') && (
                  <span className="h-1.5 w-1.5 rounded-full bg-red-500 animate-pulse" />
                )}
                {card.title === t('totalCameras') && (
                  <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
                )}
                {card.title === t('sensors') && (
                  <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
                )}
                <span className={`text-[9px] font-mono font-semibold ${
                  card.title === t('activeAlerts') ? 'text-red-400' : 'text-slate-400'
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
