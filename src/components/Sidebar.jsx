import React from 'react';
import { 
  LayoutDashboard, Map, Cpu, Bell, BarChart3, 
  Clock, FileText, Settings 
} from 'lucide-react';
import { getTranslation } from '../utils/translations';

export default function Sidebar({ activeTab = 'overview', setActiveTab, language }) {
  const t = (key) => getTranslation(language, key);

  const menuItems = [
    { id: 'overview', label: t('overview'), icon: LayoutDashboard },
    { id: 'map', label: t('farmMap'), icon: Map },
    { id: 'detection', label: t('aiDetection'), icon: Cpu },
    { id: 'devices', label: t('devices'), icon: Settings },
    { id: 'alerts', label: t('alerts'), icon: Bell },
    { id: 'analytics', label: t('analytics'), icon: BarChart3 },
    { id: 'timeline', label: t('timeline'), icon: Clock },
    { id: 'reports', label: t('reports'), icon: FileText },
    { id: 'settings', label: t('settings'), icon: Settings }
  ];

  return (
    <aside className="w-64 bg-[#090d16] border-r border-slate-900 flex flex-col justify-between h-screen fixed top-0 left-0 p-4 z-40 select-none">
      
      {/* Top Section */}
      <div className="space-y-6">
        {/* Brand Logo */}
        <div className="flex items-center gap-3 px-2 py-2 border-b border-slate-900 pb-4">
          <div className="h-8 w-8 rounded-lg bg-green-500 flex items-center justify-center text-slate-950 font-sans font-bold text-lg">
            W
          </div>
          <span className="text-lg font-bold text-slate-100 tracking-tight font-sans">
            WildShield <span className="text-green-500 font-medium">AI</span>
          </span>
        </div>

        {/* Navigation List */}
        <nav className="space-y-1">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab && setActiveTab(item.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-semibold tracking-wide transition-all ${
                  isActive
                    ? 'bg-green-500/10 text-green-500 border border-green-500/20 font-bold'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-950/40 border border-transparent'
                }`}
              >
                <Icon className="h-4.5 w-4.5" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Bottom Widgets */}
      <div className="space-y-4 pt-4 border-t border-slate-900">
        
        {/* System Status Widget */}
        <div className="bg-[#111827]/40 border border-slate-900/60 rounded-xl p-3.5 space-y-2">
          <div className="flex items-center justify-between text-[10px] font-mono">
            <span className="text-slate-400">{t('systemStatus')}</span>
            <span className="flex items-center gap-1 text-green-500 font-bold">
              <span className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />
              {t('operational')}
            </span>
          </div>
          <p className="text-[10px] font-sans font-semibold text-slate-300">{t('allSystemsOK')}</p>
          
          {/* Mini line-wave monitor graph */}
          <div className="h-6 flex items-end">
            <svg className="w-full h-full" viewBox="0 0 180 30">
              <path
                d="M0,15 Q15,5 30,20 T60,10 T90,25 T120,5 T150,18 T180,12"
                fill="none"
                stroke="#22c55e"
                strokeWidth="1.5"
                className="opacity-75"
              />
            </svg>
          </div>
        </div>

        {/* Connected Devices progress bar */}
        <div className="bg-[#111827]/40 border border-slate-900/60 rounded-xl p-3.5 space-y-2">
          <div className="flex items-center justify-between text-[10px] font-mono">
            <span className="text-slate-400">{t('connectedDevices')}</span>
            <span className="text-slate-200 font-bold">24 / 24</span>
          </div>
          {/* Progress bar */}
          <div className="h-1.5 w-full bg-slate-900 rounded-full overflow-hidden">
            <div className="h-full w-full bg-green-500 rounded-full" />
          </div>
        </div>

        {/* User profile card */}
        <div className="flex items-center justify-between p-1 bg-slate-950/40 rounded-xl border border-slate-900/40">
          <div className="flex items-center gap-2">
            <div className="relative">
              <img
                src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=150&auto=format&fit=crop"
                alt="Rohan Verma"
                className="h-6 w-6 rounded-full border border-slate-800 object-cover"
              />
              <span className="absolute bottom-0 right-0 block h-1.5 w-1.5 rounded-full bg-green-500 ring-1 ring-slate-950" />
            </div>
            <div className="text-left leading-tight">
              <p className="text-[9px] font-bold text-slate-100 font-sans">Rohan Verma</p>
              <p className="text-[7px] font-mono text-slate-500">{t('farmManager')}</p>
            </div>
          </div>
          
          <span className="text-slate-500 text-[10px] pr-2 cursor-pointer hover:text-slate-300">▼</span>
        </div>

      </div>
    </aside>
  );
}
