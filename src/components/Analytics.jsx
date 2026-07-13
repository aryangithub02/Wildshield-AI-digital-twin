import React from 'react';

export default function Analytics() {
  const sparklines = [
    {
      title: "Detections (7D)",
      value: "126",
      change: "↑ 15%",
      changeType: "up",
      points: "0,15 15,22 30,10 45,28 60,14 75,32 90,12 105,25 120,8 135,18 150,5 165,15 180,8",
      color: "#22c55e"
    },
    {
      title: "Alerts (7D)",
      value: "32",
      change: "↓ 8%",
      changeType: "down",
      points: "0,25 15,10 30,18 45,5 60,22 75,12 90,28 105,15 120,20 135,10 150,15 165,8 180,14",
      color: "#ef4444"
    },
    {
      title: "Responses (7D)",
      value: "28",
      change: "↑ 20%",
      changeType: "up",
      points: "0,20 15,28 30,8 45,15 60,5 75,18 90,10 105,22 120,12 135,28 150,15 165,25 180,12",
      color: "#3b82f6"
    }
  ];

  return (
    <div className="bg-[#0b0f19] border border-slate-900 rounded-xl p-5 shadow-lg flex flex-col h-[270px] select-none">
      
      {/* Header */}
      <div className="flex items-center justify-between mb-4 border-b border-slate-900 pb-2">
        <span className="text-xs font-bold text-slate-100 font-sans uppercase tracking-wider">Analytics Overview</span>
        <span className="text-[10px] text-slate-400 cursor-pointer hover:text-slate-200">View All</span>
      </div>

      {/* Grid of sparkline cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 flex-1">
        {sparklines.map((chart, index) => (
          <div
            key={index}
            className="bg-[#111827]/40 border border-slate-900/60 rounded-xl p-4 flex flex-col justify-between"
          >
            <div className="text-left space-y-1">
              <span className="text-[9px] font-bold text-slate-400 font-sans uppercase tracking-wider block">
                {chart.title}
              </span>
              <div className="flex items-baseline gap-2">
                <span className="text-xl font-bold text-slate-50 font-sans">{chart.value}</span>
                <span className={`text-[9px] font-mono font-bold ${
                  chart.changeType === 'up' ? 'text-green-500' : 'text-red-500'
                }`}>
                  {chart.change}
                </span>
              </div>
            </div>

            {/* Sparkline wave path */}
            <div className="h-16 w-full flex items-end pt-4">
              <svg className="w-full h-full" viewBox="0 0 180 35">
                {/* Gradient area under line */}
                <defs>
                  <linearGradient id={`grad-${index}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={chart.color} stopOpacity="0.25" />
                    <stop offset="100%" stopColor={chart.color} stopOpacity="0" />
                  </linearGradient>
                </defs>
                <path
                  d={`M ${chart.points.split(' ')[0]} L ${chart.points.split(' ').join(' L ')} L 180,35 L 0,35 Z`}
                  fill={`url(#grad-${index})`}
                />
                {/* Sparkline stroke path */}
                <path
                  d={`M ${chart.points.split(' ')[0]} L ${chart.points.split(' ').join(' L ')}`}
                  fill="none"
                  stroke={chart.color}
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
          </div>
        ))}
      </div>

    </div>
  );
}
