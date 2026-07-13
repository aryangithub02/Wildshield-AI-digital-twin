import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Terminal, Shield, AlertTriangle, Volume2, Lightbulb, CheckCircle2 } from 'lucide-react';

export default function Timeline({ logs }) {
  // Map log types to styles, icons, and threat labels
  const getLogIcon = (type) => {
    switch (type) {
      case 'info':
        return <Terminal className="h-3.5 w-3.5 text-blue-400" />;
      case 'detection':
        return <Shield className="h-3.5 w-3.5 text-amber-400" />;
      case 'warning':
        return <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />;
      case 'danger':
        return <Volume2 className="h-3.5 w-3.5 text-red-400" />;
      case 'deterrent':
        return <Lightbulb className="h-3.5 w-3.5 text-amber-300" />;
      case 'success':
        return <CheckCircle2 className="h-3.5 w-3.5 text-green-400" />;
      default:
        return <Terminal className="h-3.5 w-3.5 text-slate-400" />;
    }
  };

  const getLogDotColors = (type) => {
    switch (type) {
      case 'info':
        return 'bg-blue-500/10 border-blue-500/30';
      case 'detection':
        return 'bg-amber-500/10 border-amber-500/30';
      case 'warning':
        return 'bg-amber-600/15 border-amber-600/30';
      case 'danger':
        return 'bg-red-500/20 border-red-500/30';
      case 'deterrent':
        return 'bg-amber-400/15 border-amber-400/30';
      case 'success':
        return 'bg-green-500/20 border-green-500/30';
      default:
        return 'bg-slate-900 border-slate-800';
    }
  };

  const getThreatLabel = (type) => {
    switch (type) {
      case 'info':
        return { label: 'Info', className: 'bg-blue-500/10 border-blue-500/20 text-blue-400' };
      case 'detection':
        return { label: 'Active', className: 'bg-amber-500/10 border-amber-500/20 text-amber-400' };
      case 'warning':
        return { label: 'Medium', className: 'bg-amber-500/10 border-amber-500/20 text-amber-400' };
      case 'danger':
        return { label: '♦ High', className: 'bg-red-500/10 border-red-500/20 text-red-400 font-bold' };
      case 'deterrent':
        return { label: 'Deterrent', className: 'bg-amber-400/10 border-amber-400/20 text-amber-300' };
      case 'success':
        return { label: 'Success', className: 'bg-green-500/10 border-green-500/20 text-green-400' };
      default:
        return { label: 'Log', className: 'bg-slate-950 border-slate-900 text-slate-400' };
    }
  };

  return (
    <div className="bg-[#0b0f19] border border-slate-900 rounded-xl p-5 shadow-lg flex flex-col h-[270px] select-none">
      
      {/* Header */}
      <div className="flex items-center justify-between mb-4 border-b border-slate-900 pb-2">
        <span className="text-xs font-bold text-slate-100 font-sans uppercase tracking-wider">Event Timeline</span>
        <span className="text-[10px] text-slate-400 cursor-pointer hover:text-slate-200">View All</span>
      </div>

      {/* Events Container */}
      <div className="flex-1 overflow-y-auto pr-1 space-y-3 scrollbar-thin">
        <AnimatePresence initial={false}>
          {logs.length === 0 ? (
            <div className="h-full flex items-center justify-center text-slate-500 italic text-[10px] font-mono">
              No active events logged.
            </div>
          ) : (
            logs.map((log) => {
              const threatInfo = getThreatLabel(log.type);
              return (
                <motion.div
                  key={log.id}
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.98 }}
                  transition={{ duration: 0.2 }}
                  className="flex items-start gap-4 text-xs group"
                >
                  {/* Time column */}
                  <span className="w-16 text-[10px] font-mono text-slate-500 pt-0.5 whitespace-nowrap text-left">
                    {log.time}
                  </span>

                  {/* Vertical connector line & Dot */}
                  <div className="relative flex flex-col items-center flex-shrink-0 pt-0.5">
                    <div className={`h-7 w-7 rounded-full border flex items-center justify-center ${getLogDotColors(log.type)}`}>
                      {getLogIcon(log.type)}
                    </div>
                  </div>

                  {/* Detail column */}
                  <div className="flex-1 text-left">
                    <p className="font-semibold text-slate-200 font-sans tracking-tight">{log.text}</p>
                    <p className="text-[9px] font-mono text-slate-500 mt-0.5">
                      {log.type === 'danger' ? 'AI Model: Target Intrusion Alert v2.4' : 'AI Model: Motion Detection v1.3'}
                    </p>
                  </div>

                  {/* Threat status pill */}
                  <div className="flex-shrink-0">
                    <span className={`inline-flex px-2 py-0.5 rounded text-[8px] font-mono border ${threatInfo.className}`}>
                      {threatInfo.label}
                    </span>
                  </div>
                </motion.div>
              );
            })
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
