import React from 'react';
import { Shield, Play, Pause, RotateCcw, SkipForward, Radio } from 'lucide-react';

export default function Header({
  simulationState,
  isPlaying,
  setIsPlaying,
  speed,
  setSpeed,
  onReset,
  onStepForward,
  stateLabels
}) {
  return (
    <header className="w-full max-w-7xl mx-auto px-4 py-4 mb-6">
      <div className="glass-panel rounded-card p-4 flex flex-col md:flex-row items-center justify-between gap-4 border-slate-800">
        {/* Brand/Logo */}
        <div className="flex items-center gap-3">
          <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-green-500/10 text-green-500 border border-green-500/20 shadow-[0_0_15px_rgba(34,197,94,0.15)]">
            <Shield className="h-6 w-6 animate-pulse-slow" />
            <span className="absolute top-0 right-0 flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
            </span>
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-50 tracking-tight flex items-center gap-2 m-0 p-0 font-sans">
              WildShield <span className="text-green-500">AI</span>
            </h1>
            <p className="text-xs text-slate-400 font-mono mt-0.5">DIGITAL TWIN V1.0</p>
          </div>
        </div>

        {/* Live Simulation Info */}
        <div className="flex items-center gap-3 px-4 py-2 bg-slate-950/60 rounded-xl border border-slate-800/80">
          <div className="flex items-center gap-2">
            <Radio className="h-4 w-4 text-red-500 animate-pulse-fast" />
            <span className="text-xs font-mono font-medium text-slate-300">SIMULATION MONITOR:</span>
          </div>
          <span className="text-sm font-semibold px-2 py-0.5 bg-slate-800 text-slate-100 rounded border border-slate-700 font-mono">
            {stateLabels[simulationState]}
          </span>
        </div>

        {/* Simulation Controls */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Play/Pause */}
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
              isPlaying
                ? 'bg-amber-500/10 hover:bg-amber-500/20 text-amber-500 border border-amber-500/30'
                : 'bg-green-500 hover:bg-green-600 text-slate-950 shadow-[0_0_20px_rgba(34,197,94,0.25)]'
            }`}
            title={isPlaying ? 'Pause Simulation' : 'Start Simulation'}
          >
            {isPlaying ? (
              <>
                <Pause className="h-4 w-4 fill-amber-500" />
                <span>Pause</span>
              </>
            ) : (
              <>
                <Play className="h-4 w-4 fill-slate-950 text-slate-950" />
                <span>Play Demo</span>
              </>
            )}
          </button>

          {/* Step Forward */}
          <button
            onClick={onStepForward}
            disabled={isPlaying}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:hover:bg-slate-800 text-slate-200 border border-slate-700 transition-all"
            title="Advance 1 State (when paused)"
          >
            <SkipForward className="h-4 w-4" />
            <span className="hidden sm:inline">Step</span>
          </button>

          {/* Reset */}
          <button
            onClick={onReset}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-all"
            title="Reset Simulation Loop"
          >
            <RotateCcw className="h-4 w-4" />
            <span className="hidden sm:inline">Reset</span>
          </button>

          {/* Speed Multiplier */}
          <div className="flex items-center gap-1 bg-slate-950/60 rounded-xl p-1 border border-slate-800/80">
            {[0.5, 1, 2].map((s) => (
              <button
                key={s}
                onClick={() => setSpeed(s)}
                className={`px-2.5 py-1 text-xs font-mono font-bold rounded-lg transition-all ${
                  speed === s
                    ? 'bg-green-500 text-slate-950 font-bold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {s}x
              </button>
            ))}
          </div>
        </div>
      </div>
    </header>
  );
}
