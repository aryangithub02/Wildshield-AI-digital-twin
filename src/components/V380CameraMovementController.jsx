import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ChevronUp, ChevronDown, ChevronLeft, ChevronRight, Square, 
  Lightbulb, Sun, Moon, RotateCcw, Video, Radio, RefreshCw, 
  Settings, Check, Copy, ExternalLink, Activity, Sliders, 
  ShieldAlert, Sparkles, Crosshair, Zap, Eye, Globe
} from 'lucide-react';

export default function V380CameraMovementController({
  apiBaseUrl = "http://127.0.0.1:8000",
  onFeedbackMessage = null,
  compact = false,
  className = ""
}) {
  // 1. Camera Server Host/IP State (info.md: 192.168.1.7:8080 or localhost:8080)
  const [cameraHost, setCameraHost] = useState(() => {
    return localStorage.getItem('wildshield_v380_host') || '192.168.1.7:8080';
  });
  const [lightState, setLightState] = useState('auto'); // 'on' | 'off' | 'auto'
  const [imageMode, setImageMode] = useState('auto');   // 'color' | 'bw' | 'auto' | 'flip'
  const [isFlipped, setIsFlipped] = useState(false);
  const [isMoving, setIsMoving] = useState(null);       // 'up' | 'down' | 'left' | 'right' | null
  const [serverOnline, setServerOnline] = useState(null); // boolean | null
  const [checkingServer, setCheckingServer] = useState(false);
  const [showConfigDrawer, setShowConfigDrawer] = useState(false);
  const [hudMessage, setHudMessage] = useState(null);
  const hudTimeoutRef = useRef(null);

  // Clean formatted camera base URL
  const cleanHost = cameraHost.trim().replace(/^https?:\/\//i, '').replace(/\/$/, '') || '192.168.1.7:8080';
  const cameraBaseUrl = `http://${cleanHost}`;

  const showHud = (msg) => {
    if (hudTimeoutRef.current) clearTimeout(hudTimeoutRef.current);
    setHudMessage(msg);
    if (onFeedbackMessage) onFeedbackMessage(msg);
    hudTimeoutRef.current = setTimeout(() => {
      setHudMessage(null);
    }, 2400);
  };

  // Check camera server status (/api/status)
  const checkCameraStatus = useCallback(async () => {
    setCheckingServer(true);
    try {
      const res = await fetch(`${apiBaseUrl}/api/camera/v380/status?camera_url=${encodeURIComponent(cameraBaseUrl)}`);
      if (res.ok) {
        const data = await res.json();
        setServerOnline(Boolean(data.online));
      } else {
        setServerOnline(false);
      }
    } catch (e) {
      setServerOnline(false);
    } finally {
      setCheckingServer(false);
    }
  }, [apiBaseUrl, cameraBaseUrl]);

  useEffect(() => {
    checkCameraStatus();
    const interval = setInterval(checkCameraStatus, 12000);
    return () => clearInterval(interval);
  }, [checkCameraStatus]);

  // Save Camera Server IP/Host
  const handleSaveHost = (newHost) => {
    const trimmed = newHost.trim().replace(/^https?:\/\//i, '').replace(/\/$/, '');
    setCameraHost(trimmed);
    localStorage.setItem('wildshield_v380_host', trimmed);
    showHud(`Camera Server IP set to: ${trimmed}`);
  };

  // 2. PTZ Movement Dispatcher (info.md: POST /api/ptz/{direction})
  const handlePtzMove = async (direction) => {
    const dir = direction.toLowerCase();
    setIsMoving(dir === 'stop' ? null : dir);

    const labels = {
      up: "⬆️ TILT UP",
      down: "⬇️ TILT DOWN",
      left: "⬅️ PAN LEFT",
      right: "➡️ PAN RIGHT",
      stop: "⏹️ MOVEMENT STOPPED"
    };
    showHud(`PTZ: ${labels[dir] || dir.toUpperCase()}`);

    // Dual Dispatch: Backend Proxy + Direct Client Fetch
    try {
      // A. Backend Proxy (Handles CORS transparently)
      fetch(`${apiBaseUrl}/api/camera/ptz`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          direction: dir,
          camera_url: cameraBaseUrl
        })
      }).catch(() => {});

      // B. Direct fetch to camera server (fastest on same LAN)
      fetch(`${cameraBaseUrl}/api/ptz/${dir}`, {
        method: "POST",
        mode: "no-cors"
      }).catch(() => {});
    } catch (e) {
      console.warn("PTZ command dispatch failed:", e);
    }
  };

  // 3. Light Control Dispatcher (info.md: POST /api/light/{state})
  const handleLightChange = async (state) => {
    const st = state.toLowerCase();
    setLightState(st);

    const labels = {
      on: "💡 LIGHT: FORCED ON",
      off: "🌑 LIGHT: FORCED OFF",
      auto: "⚡ LIGHT: AUTO SENSOR"
    };
    showHud(labels[st] || `LIGHT: ${st.toUpperCase()}`);

    try {
      // Backend Proxy
      fetch(`${apiBaseUrl}/api/camera/light`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          state: st,
          camera_url: cameraBaseUrl
        })
      }).catch(() => {});

      // Direct local fetch
      fetch(`${cameraBaseUrl}/api/light/${st}`, {
        method: "POST",
        mode: "no-cors"
      }).catch(() => {});
    } catch (e) {
      console.warn("Light command dispatch failed:", e);
    }
  };

  // 4. Color & Image Mode Dispatcher (info.md: POST /api/image/{mode})
  const handleImageModeChange = async (mode) => {
    const md = mode.toLowerCase();
    if (md === 'flip') {
      setIsFlipped(prev => !prev);
      showHud("🔄 IMAGE FLIPPED 180°");
    } else {
      setImageMode(md);
      const labels = {
        color: "☀️ DAY COLOR MODE",
        bw: "🌙 NIGHT IR (B&W) MODE",
        auto: "⚡ AUTO DAY/NIGHT MODE"
      };
      showHud(labels[md] || `IMAGE: ${md.toUpperCase()}`);
    }

    try {
      // Backend Proxy
      fetch(`${apiBaseUrl}/api/camera/image`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: md,
          camera_url: cameraBaseUrl
        })
      }).catch(() => {});

      // Direct local fetch
      fetch(`${cameraBaseUrl}/api/image/${md}`, {
        method: "POST",
        mode: "no-cors"
      }).catch(() => {});
    } catch (e) {
      console.warn("Image mode dispatch failed:", e);
    }
  };

  return (
    <div className={`rounded-xl border border-slate-900 bg-[#0b0f19] p-3 shadow-xl ${className}`}>
      
      {/* On-Screen Feedback Banner */}
      <AnimatePresence>
        {hudMessage && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            className="mb-2 py-1 px-2.5 rounded-lg bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 font-mono text-[10px] font-bold flex items-center justify-between"
          >
            <span>{hudMessage}</span>
            <span className="text-[8px] text-emerald-400/70 font-mono">DISPATCHED</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header with Camera Host and Online Status */}
      <div className="flex items-center justify-between gap-2 mb-2.5 pb-2 border-b border-slate-900">
        <div className="flex items-center gap-2">
          <div className={`p-1.5 rounded-lg ${serverOnline ? 'bg-emerald-500/10 text-emerald-400' : 'bg-slate-800 text-slate-400'}`}>
            <Video className="h-3.5 w-3.5" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-mono font-bold uppercase text-slate-200">
                V380 Camera Movement & Light
              </span>
              <span className={`text-[8px] font-mono px-1.5 py-0.2 rounded-full font-bold ${
                serverOnline 
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' 
                  : 'bg-slate-800 text-slate-400 border border-slate-700'
              }`}>
                {checkingServer ? 'PING...' : serverOnline ? 'ONLINE' : 'STANDBY'}
              </span>
            </div>
            <p className="text-[9px] font-mono text-slate-400">
              Host: <span className="text-slate-300 font-bold">{cleanHost}</span>
            </p>
          </div>
        </div>

        <button
          onClick={() => setShowConfigDrawer(!showConfigDrawer)}
          title="Configure Camera Server IP"
          className="p-1 rounded bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-slate-200 transition-all text-[9px] font-mono flex items-center gap-1"
        >
          <Settings className="h-3 w-3" />
          <span>IP</span>
        </button>
      </div>

      {/* Collapsible Camera Server IP Configuration Drawer */}
      <AnimatePresence>
        {showConfigDrawer && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-3 p-2.5 rounded-lg bg-slate-950 border border-slate-800 space-y-2 overflow-hidden"
          >
            <div className="flex items-center justify-between text-[9px] font-mono text-slate-400">
              <span>V380 Camera Server IP / Host:</span>
              <span className="text-slate-500">From info.md</span>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={cameraHost}
                onChange={(e) => setCameraHost(e.target.value)}
                placeholder="192.168.1.7:8080"
                className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-xs font-mono text-emerald-400 focus:outline-none focus:border-cyan-500"
              />
              <button
                onClick={() => {
                  handleSaveHost(cameraHost);
                  checkCameraStatus();
                  setShowConfigDrawer(false);
                }}
                className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-mono font-bold text-[10px] transition-all"
              >
                Save
              </button>
            </div>
            {/* Quick Presets */}
            <div className="flex items-center gap-1.5 pt-1 text-[8px] font-mono">
              <span className="text-slate-500">Presets:</span>
              <button
                onClick={() => {
                  handleSaveHost('192.168.1.7:8080');
                  checkCameraStatus();
                }}
                className="px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-300 hover:text-emerald-400"
              >
                192.168.1.7:8080 (LAN)
              </button>
              <button
                onClick={() => {
                  handleSaveHost('localhost:8080');
                  checkCameraStatus();
                }}
                className="px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-300 hover:text-emerald-400"
              >
                localhost:8080
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Grid: Left Column = PTZ Movement, Right Column = Light & Image Modes */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
        
        {/* 1. PTZ Circular D-Pad & Controls (info.md Section 2) */}
        <div className="md:col-span-6 flex items-center justify-center gap-3 bg-slate-950/80 p-2.5 rounded-xl border border-slate-900 shadow-inner">
          
          {/* Circular D-Pad */}
          <div className="relative w-24 h-24 bg-slate-950 rounded-full border border-slate-800 p-1 flex items-center justify-center shadow-lg">
            
            {/* TILT UP (POST /api/ptz/up) */}
            <button
              onClick={() => handlePtzMove('up')}
              title="Tilt Up (POST /api/ptz/up)"
              className={`absolute top-1 p-1 text-slate-300 hover:text-emerald-400 active:scale-90 transition-all rounded ${
                isMoving === 'up' ? 'text-emerald-400 animate-bounce' : ''
              }`}
            >
              <ChevronUp className="h-5 w-5" />
            </button>

            {/* PAN LEFT (POST /api/ptz/left) */}
            <button
              onClick={() => handlePtzMove('left')}
              title="Pan Left (POST /api/ptz/left)"
              className={`absolute left-1 p-1 text-slate-300 hover:text-emerald-400 active:scale-90 transition-all rounded ${
                isMoving === 'left' ? 'text-emerald-400' : ''
              }`}
            >
              <ChevronLeft className="h-5 w-5" />
            </button>

            {/* STOP / CENTER (POST /api/ptz/stop) */}
            <button
              onClick={() => handlePtzMove('stop')}
              title="Stop Movement (POST /api/ptz/stop)"
              className="h-8 w-8 rounded-full bg-slate-900 hover:bg-red-950/60 border border-slate-700/80 hover:border-red-500/50 text-slate-300 hover:text-red-400 flex items-center justify-center active:scale-90 transition-all shadow"
            >
              <Square className="h-3.5 w-3.5 fill-current" />
            </button>

            {/* PAN RIGHT (POST /api/ptz/right) */}
            <button
              onClick={() => handlePtzMove('right')}
              title="Pan Right (POST /api/ptz/right)"
              className={`absolute right-1 p-1 text-slate-300 hover:text-emerald-400 active:scale-90 transition-all rounded ${
                isMoving === 'right' ? 'text-emerald-400' : ''
              }`}
            >
              <ChevronRight className="h-5 w-5" />
            </button>

            {/* TILT DOWN (POST /api/ptz/down) */}
            <button
              onClick={() => handlePtzMove('down')}
              title="Tilt Down (POST /api/ptz/down)"
              className={`absolute bottom-1 p-1 text-slate-300 hover:text-emerald-400 active:scale-90 transition-all rounded ${
                isMoving === 'down' ? 'text-emerald-400 animate-bounce' : ''
              }`}
            >
              <ChevronDown className="h-5 w-5" />
            </button>
          </div>

          {/* PTZ Action Legend & Stop Button */}
          <div className="flex flex-col gap-1.5 text-center">
            <span className="text-[9px] font-mono text-slate-400 font-bold uppercase">
              PTZ Movement
            </span>
            <button
              onClick={() => handlePtzMove('stop')}
              className="px-2.5 py-1.5 rounded-lg bg-red-950/60 hover:bg-red-900/80 border border-red-800/60 text-red-200 text-[10px] font-mono font-bold active:scale-95 transition-all shadow"
            >
              STOP ⏹
            </button>
            <span className="text-[8px] font-mono text-slate-500">
              {isMoving ? `MOVING ${isMoving.toUpperCase()}...` : 'STANDBY'}
            </span>
          </div>

        </div>

        {/* 2. Light Controls (info.md Section 3: /api/light/on, off, auto) */}
        <div className="md:col-span-6 space-y-2 bg-slate-950/80 p-2.5 rounded-xl border border-slate-900">
          
          <div className="flex items-center justify-between">
            <span className="text-[9px] font-mono font-bold uppercase text-slate-300 flex items-center gap-1.5">
              <Lightbulb className="h-3.5 w-3.5 text-amber-400" />
              Camera Light (LED / IR)
            </span>
            <span className="text-[8px] font-mono text-amber-400/90 font-bold uppercase">
              {lightState.toUpperCase()}
            </span>
          </div>

          {/* Light Toggle Pills */}
          <div className="grid grid-cols-3 gap-1.5">
            <button
              onClick={() => handleLightChange('on')}
              title="Force Light ON (POST /api/light/on)"
              className={`py-1.5 px-2 rounded-lg font-mono text-[10px] font-bold flex items-center justify-center gap-1 transition-all active:scale-95 border ${
                lightState === 'on'
                  ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-[0_0_12px_rgba(245,158,11,0.5)]'
                  : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border-slate-800'
              }`}
            >
              <Lightbulb className="h-3 w-3" />
              <span>ON</span>
            </button>

            <button
              onClick={() => handleLightChange('off')}
              title="Force Light OFF (POST /api/light/off)"
              className={`py-1.5 px-2 rounded-lg font-mono text-[10px] font-bold flex items-center justify-center gap-1 transition-all active:scale-95 border ${
                lightState === 'off'
                  ? 'bg-slate-800 text-white border-slate-600 shadow'
                  : 'bg-slate-900 hover:bg-slate-800 text-slate-400 border-slate-800'
              }`}
            >
              <Square className="h-2.5 w-2.5 text-slate-400" />
              <span>OFF</span>
            </button>

            <button
              onClick={() => handleLightChange('auto')}
              title="Auto Ambient Light (POST /api/light/auto)"
              className={`py-1.5 px-2 rounded-lg font-mono text-[10px] font-bold flex items-center justify-center gap-1 transition-all active:scale-95 border ${
                lightState === 'auto'
                  ? 'bg-cyan-600 text-white border-cyan-400 shadow-[0_0_10px_rgba(6,182,212,0.4)]'
                  : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border-slate-800'
              }`}
            >
              <Zap className="h-3 w-3" />
              <span>AUTO</span>
            </button>
          </div>

          {/* Color & Night Vision Mode (info.md Section 4: /api/image/color, bw, flip) */}
          <div className="pt-1.5 border-t border-slate-900 flex items-center justify-between gap-1.5">
            <span className="text-[8px] font-mono text-slate-400 uppercase">Vision Mode:</span>
            
            <div className="flex items-center gap-1">
              <button
                onClick={() => handleImageModeChange('color')}
                title="Full Color Day Mode (POST /api/image/color)"
                className={`px-2 py-0.5 rounded text-[9px] font-mono transition-all border ${
                  imageMode === 'color' 
                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/40' 
                    : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200'
                }`}
              >
                ☀️ Color
              </button>

              <button
                onClick={() => handleImageModeChange('bw')}
                title="Black & White IR Night Mode (POST /api/image/bw)"
                className={`px-2 py-0.5 rounded text-[9px] font-mono transition-all border ${
                  imageMode === 'bw' 
                    ? 'bg-blue-500/20 text-blue-300 border-blue-500/40' 
                    : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200'
                }`}
              >
                🌙 IR B&W
              </button>

              <button
                onClick={() => handleImageModeChange('flip')}
                title="Flip Image 180° (POST /api/image/flip)"
                className={`px-1.5 py-0.5 rounded text-[9px] font-mono transition-all border ${
                  isFlipped 
                    ? 'bg-purple-500/20 text-purple-300 border-purple-500/40' 
                    : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200'
                }`}
              >
                🔄 Flip
              </button>
            </div>
          </div>

        </div>

      </div>

      {/* Stream Links Footer */}
      <div className="mt-2.5 pt-2 border-t border-slate-900/80 flex flex-wrap items-center justify-between text-[9px] font-mono text-slate-500">
        <span>Endpoints: <strong className="text-slate-400 font-normal">/api/ptz/*</strong> • <strong className="text-slate-400 font-normal">/api/light/*</strong></span>
        <div className="flex items-center gap-2">
          <a
            href={`${cameraBaseUrl}/mjpeg`}
            target="_blank"
            rel="noreferrer"
            className="text-emerald-400 hover:underline flex items-center gap-0.5"
          >
            <span>Live MJPEG</span>
            <ExternalLink className="h-2.5 w-2.5" />
          </a>
          <span>•</span>
          <a
            href={`${cameraBaseUrl}/snapshot`}
            target="_blank"
            rel="noreferrer"
            className="text-cyan-400 hover:underline flex items-center gap-0.5"
          >
            <span>Snapshot</span>
            <ExternalLink className="h-2.5 w-2.5" />
          </a>
        </div>
      </div>

    </div>
  );
}
