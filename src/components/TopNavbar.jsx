import React, { useState, useEffect } from 'react';
import { Menu, Bell, CloudSun } from 'lucide-react';

export default function TopNavbar() {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const formatClock = (date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true });
  };

  const formatDate = (date) => {
    return date.toLocaleDateString([], { month: 'short', day: '2-digit', year: 'numeric' });
  };

  return (
    <header className="h-16 w-[calc(100%-16rem)] bg-[#090d16] border-b border-slate-900 flex items-center justify-between px-6 fixed top-0 right-0 z-35 select-none">
      
      {/* Left side: Navigation toggle & Breadcrumbs */}
      <div className="flex items-center gap-4">
        <button className="p-1 rounded bg-slate-950/40 border border-slate-900 text-slate-400 hover:text-slate-200">
          <Menu className="h-4.5 w-4.5" />
        </button>
        
        {/* Dropdown title */}
        <div className="flex items-center gap-2 cursor-pointer group">
          <span className="text-sm font-semibold text-slate-100 font-sans tracking-tight">
            Digital Twin – Demo Farm
          </span>
          <span className="text-slate-500 text-[8px] group-hover:text-slate-300">▼</span>
        </div>
      </div>

      {/* Right side: Weather, Date-Time, notifications, profile */}
      <div className="flex items-center gap-6">
        
        {/* Weather widget */}
        <div className="flex items-center gap-2 border-r border-slate-900 pr-5">
          <CloudSun className="h-5 w-5 text-amber-400/85" />
          <div className="text-left font-sans">
            <p className="text-[10px] font-bold text-slate-200">24°C</p>
            <p className="text-[8px] font-mono text-slate-500">Partly Cloudy</p>
          </div>
        </div>

        {/* Live Clock & Calendar */}
        <div className="flex flex-col text-right font-mono border-r border-slate-900 pr-5">
          <span className="text-xs font-bold text-slate-100">{formatClock(time)}</span>
          <span className="text-[9px] text-slate-500 font-medium mt-0.5">{formatDate(time)}</span>
        </div>

        {/* Alert Notifications icon */}
        <button className="relative p-1.5 rounded-lg bg-slate-950/40 border border-slate-900 text-slate-400 hover:text-slate-200 transition-colors">
          <Bell className="h-4.5 w-4.5" />
          <span className="absolute top-1 right-1 flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
          </span>
        </button>

        {/* User profile avatar (Rohan Verma) */}
        <div className="h-6 w-6 rounded-full border border-slate-800 overflow-hidden cursor-pointer select-none">
          <img
            src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=150&auto=format&fit=crop"
            alt="Rohan Verma"
            className="h-full w-full object-cover"
          />
        </div>

      </div>
    </header>
  );
}
