import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Wifi, Zap, Square, Radio, CheckCircle2, AlertTriangle,
  RefreshCw, Copy, Check, ChevronDown, ChevronUp, ExternalLink,
  ShieldAlert, Activity, Server, Globe, Sliders, Smartphone, Laptop
} from 'lucide-react';
import SpeciesUrlManager from './SpeciesUrlManager';

export default function TargetTriggerController({
  apiBaseUrl = "http://127.0.0.1:8000",
  compact = false,
  onTargetChange = null,
  showTitle = true,
  className = ""
}) {
  // ================= 1. DUAL ACTUATOR STATE =================
  // Actuator 1 (Primary)
  const [targetIp1, setTargetIp1] = useState(() => {
    const saved = localStorage.getItem('wildshield_target_ip');
    if (!saved || saved === '192.168.137.211' || saved === '192.168.43.88') return '192.168.137.211';
    return saved;
  });
  const [targetPort1, setTargetPort1] = useState(() => {
    return localStorage.getItem('wildshield_target_port') || '80';
  });
  const [triggerEndpoint1, setTriggerEndpoint1] = useState(() => {
    const saved = localStorage.getItem('wildshield_trigger_endpoint');
    if (!saved || saved === '/deter') return '/siren';
    return saved;
  });
  const [cancelEndpoint1, setCancelEndpoint1] = useState(() => {
    return localStorage.getItem('wildshield_cancel_endpoint') || '/stop';
  });

  // Actuator 2 (Secondary)
  const [targetIp2, setTargetIp2] = useState(() => {
    const saved = localStorage.getItem('wildshield_target_ip_2');
    if (!saved || saved === '192.168.137.38' || saved === '192.168.137.212') return '192.168.137.64';
    return saved;
  });
  const [targetPort2, setTargetPort2] = useState(() => {
    return localStorage.getItem('wildshield_target_port_2') || '80';
  });
  const [triggerEndpoint2, setTriggerEndpoint2] = useState(() => {
    const saved = localStorage.getItem('wildshield_trigger_endpoint_2');
    if (!saved || saved === '/deter' || saved === '/siren') return '/siren2';
    return saved;
  });
  const [cancelEndpoint2, setCancelEndpoint2] = useState(() => {
    return localStorage.getItem('wildshield_cancel_endpoint_2') || '/stop';
  });

  const [dualDispatch, setDualDispatch] = useState(true);

  // Connectivity & Trigger Status
  const [isTriggerActive1, setIsTriggerActive1] = useState(false);
  const [isTriggerActive2, setIsTriggerActive2] = useState(false);

  const [pingStatus1, setPingStatus1] = useState({
    online: false,
    latency_ms: null,
    checking: false,
    message: ''
  });
  const [pingStatus2, setPingStatus2] = useState({
    online: false,
    latency_ms: null,
    checking: false,
    message: ''
  });

  const [isSaving, setIsSaving] = useState(false);
  const [isTriggering1, setIsTriggering1] = useState(false);
  const [isTriggering2, setIsTriggering2] = useState(false);
  const [isTriggeringBoth, setIsTriggeringBoth] = useState(false);
  const [isCancelling1, setIsCancelling1] = useState(false);
  const [isCancelling2, setIsCancelling2] = useState(false);

  const [copiedTrigger1, setCopiedTrigger1] = useState(false);
  const [copiedTrigger2, setCopiedTrigger2] = useState(false);
  const [copiedCancel1, setCopiedCancel1] = useState(false);
  const [copiedCancel2, setCopiedCancel2] = useState(false);

  const [showAdvanced, setShowAdvanced] = useState(false);
  const [showSpeciesUrls, setShowSpeciesUrls] = useState(false);
  const [actionFeedback, setActionFeedback] = useState(null);
  const feedbackTimeoutRef = useRef(null);

  // Helper: Computed Live URLs
  const cleanIp = (ip, fallback) => {
    if (!ip) return fallback;
    return ip.trim().replace(/^https?:\/\//i, '').split('/')[0].split(':')[0] || fallback;
  };
  const cleanPort = (port) => port.trim() || '80';
  const cleanEp = (ep, fallback) => {
    const val = (ep || fallback).trim();
    return val.startsWith('/') ? val : `/${val}`;
  };

  const cleanIp1 = cleanIp(targetIp1, '192.168.137.211');
  const cleanPort1 = cleanPort(targetPort1);
  const cleanTriggerEp1 = cleanEp(triggerEndpoint1, '/siren');
  const cleanCancelEp1 = cleanEp(cancelEndpoint1, '/stop');

  const cleanIp2 = cleanIp(targetIp2, '192.168.137.64');
  const cleanPort2 = cleanPort(targetPort2);
  const cleanTriggerEp2 = cleanEp(triggerEndpoint2, '/siren2');
  const cleanCancelEp2 = cleanEp(cancelEndpoint2, '/stop');

  const triggerUrl1 = `http://${cleanIp1}:${cleanPort1}${cleanTriggerEp1}`;
  const cancelUrl1 = `http://${cleanIp1}:${cleanPort1}${cleanCancelEp1}`;

  const triggerUrl2 = `http://${cleanIp2}:${cleanPort2}${cleanTriggerEp2}`;
  const cancelUrl2 = `http://${cleanIp2}:${cleanPort2}${cleanCancelEp2}`;

  const isTriggerActive = isTriggerActive1 || isTriggerActive2;

  // Helper: Show Action Toast
  const triggerFeedback = (message, type = 'success') => {
    if (feedbackTimeoutRef.current) clearTimeout(feedbackTimeoutRef.current);
    setActionFeedback({ message, type });
    feedbackTimeoutRef.current = setTimeout(() => {
      setActionFeedback(null);
    }, 4500);
  };

  const handleIpChange1 = (val) => {
    let raw = val.trim();
    if (raw.includes('://')) raw = raw.split('://')[1];
    if (raw.includes('/')) raw = raw.split('/')[0];
    if (raw.includes(':')) {
      const [ipPart, portPart] = raw.split(':');
      setTargetIp1(ipPart);
      if (portPart && !isNaN(parseInt(portPart))) setTargetPort1(portPart);
    } else {
      setTargetIp1(raw);
    }
  };

  const handleIpChange2 = (val) => {
    let raw = val.trim();
    if (raw.includes('://')) raw = raw.split('://')[1];
    if (raw.includes('/')) raw = raw.split('/')[0];
    if (raw.includes(':')) {
      const [ipPart, portPart] = raw.split(':');
      setTargetIp2(ipPart);
      if (portPart && !isNaN(parseInt(portPart))) setTargetPort2(portPart);
    } else {
      setTargetIp2(raw);
    }
  };

  // ================= 2. PING PROBES =================
  const handleTestPing = useCallback(async () => {
    setPingStatus1(prev => ({ ...prev, checking: true, message: 'Pinging...' }));
    setPingStatus2(prev => ({ ...prev, checking: true, message: 'Pinging...' }));

    try {
      const res = await fetch(`${apiBaseUrl}/api/trigger/ping`);
      if (res.ok) {
        const data = await res.json();
        const a1 = data.actuator_1 || {};
        const a2 = data.actuator_2 || {};

        setPingStatus1({
          online: Boolean(a1.online),
          latency_ms: a1.latency_ms,
          checking: false,
          message: a1.online ? `Online (${a1.latency_ms}ms)` : 'Offline'
        });

        setPingStatus2({
          online: Boolean(a2.online),
          latency_ms: a2.latency_ms,
          checking: false,
          message: a2.online ? `Online (${a2.latency_ms}ms)` : 'Offline'
        });
      }
    } catch (err) {
      setPingStatus1({ online: false, latency_ms: null, checking: false, message: 'Probe failed' });
      setPingStatus2({ online: false, latency_ms: null, checking: false, message: 'Probe failed' });
    }
  }, [apiBaseUrl]);

  // Initial Sync from Backend on Mount
  const fetchBackendConfig = useCallback(async () => {
    try {
      const res = await fetch(`${apiBaseUrl}/api/trigger/target`);
      if (res.ok) {
        const data = await res.json();
        if (data.ip) {
          const localSaved1 = localStorage.getItem('wildshield_target_ip');
          if (!localSaved1) {
            setTargetIp1(data.ip);
            setTargetPort1(String(data.port || 80));
          }
        }
        if (data.ip_2) {
          const localSaved2 = localStorage.getItem('wildshield_target_ip_2');
          if (!localSaved2) {
            setTargetIp2(data.ip_2);
            setTargetPort2(String(data.port_2 || 80));
          }
        }
        if (data.trigger_endpoint) setTriggerEndpoint1(data.trigger_endpoint);
        if (data.cancel_endpoint) setCancelEndpoint1(data.cancel_endpoint);
        if (data.trigger_endpoint_2) setTriggerEndpoint2(data.trigger_endpoint_2);
        if (data.cancel_endpoint_2) setCancelEndpoint2(data.cancel_endpoint_2);

        if (data.state_1) setIsTriggerActive1(data.state_1 === 'ACTIVE');
        if (data.state_2) setIsTriggerActive2(data.state_2 === 'ACTIVE');
      }
    } catch (e) {
      // Offline fallback
    }
  }, [apiBaseUrl]);

  useEffect(() => {
    fetchBackendConfig();
    const interval = setInterval(() => {
      handleTestPing();
    }, 6000);
    return () => clearInterval(interval);
  }, [fetchBackendConfig, handleTestPing]);

  // ================= 3. SAVE & SYNC DUAL TARGETS =================
  const handleSaveAndSync = async () => {
    setIsSaving(true);
    try {
      // Save Actuator 1
      localStorage.setItem('wildshield_target_ip', cleanIp1);
      localStorage.setItem('wildshield_target_port', cleanPort1);
      localStorage.setItem('wildshield_trigger_endpoint', cleanTriggerEp1);
      localStorage.setItem('wildshield_cancel_endpoint', cleanCancelEp1);

      // Save Actuator 2
      localStorage.setItem('wildshield_target_ip_2', cleanIp2);
      localStorage.setItem('wildshield_target_port_2', cleanPort2);
      localStorage.setItem('wildshield_trigger_endpoint_2', cleanTriggerEp2);
      localStorage.setItem('wildshield_cancel_endpoint_2', cleanCancelEp2);

      // Sync to Backend
      const res = await fetch(`${apiBaseUrl}/api/trigger/target`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ip: cleanIp1,
          port: parseInt(cleanPort1) || 80,
          trigger_endpoint: cleanTriggerEp1,
          cancel_endpoint: cleanCancelEp1,
          enabled: true,

          ip_2: cleanIp2,
          port_2: parseInt(cleanPort2) || 80,
          trigger_endpoint_2: cleanTriggerEp2,
          cancel_endpoint_2: cleanCancelEp2,
          enabled_2: true
        })
      });

      if (res.ok) {
        triggerFeedback(`✅ Both Actuator inputs synced! Actuator 1: ${cleanIp1} | Actuator 2: ${cleanIp2}`);
        if (onTargetChange) {
          onTargetChange({
            actuator1: { ip: cleanIp1, port: cleanPort1, triggerUrl: triggerUrl1, cancelUrl: cancelUrl1 },
            actuator2: { ip: cleanIp2, port: cleanPort2, triggerUrl: triggerUrl2, cancelUrl: cancelUrl2 }
          });
        }
        handleTestPing();
      } else {
        triggerFeedback(`⚠️ Backend rejected Dual Actuator config`, 'warning');
      }
    } catch (err) {
      triggerFeedback(`Saved both locally. Backend offline (${err.message})`, 'info');
    } finally {
      setIsSaving(false);
    }
  };

  // High-Speed Direct URL Dispatcher (fires in 0ms without waiting for anything)
  const fireUrlInstant = (url) => {
    if (!url) return;
    try {
      fetch(url, { method: "GET", mode: "no-cors", cache: "no-store", keepalive: true }).catch(() => { });
    } catch (e) { }

    try {
      // Rapid Image ping fallback (executes immediately in browser thread without preflight delay)
      const sep = url.includes('?') ? '&' : '?';
      const img = new Image();
      img.src = `${url}${sep}_t=${Date.now()}`;
    } catch (e) { }
  };

  // ================= 4. EXECUTE TRIGGERS (INSTANT ZERO-LATENCY) =================
  const handleExecuteTrigger = (target = 'all') => {
    // 1. Fire Direct Hardware HTTP Requests INSTANTLY (0ms latency)
    if (target === '1' || target === 'all') {
      fireUrlInstant(triggerUrl1);
      setIsTriggerActive1(true);
    }
    if (target === '2' || target === 'all') {
      fireUrlInstant(triggerUrl2);
      setIsTriggerActive2(true);
    }

    // 2. Instant Toast Feedback
    if (target === '1') {
      triggerFeedback(`⚡ Actuator 1 FIRED INSTANTLY -> ${cleanIp1}:${cleanPort1}${cleanTriggerEp1}`);
    } else if (target === '2') {
      triggerFeedback(`⚡ Actuator 2 FIRED INSTANTLY -> ${cleanIp2}:${cleanPort2}${cleanTriggerEp2}`);
    } else {
      triggerFeedback(`⚡ BOTH ACTUATORS FIRED INSTANTLY! (1: ${cleanIp1} + 2: ${cleanIp2})`);
    }

    // 3. Parallel asynchronous backend sync (non-blocking, fire-and-forget)
    fetch(`${apiBaseUrl}/api/trigger/activate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        reason: `Fast UI Trigger for Actuator ${target}`,
        actuator: target
      })
    }).catch(e => console.warn("Backend trigger sync notice:", e));
  };

  // ================= 5. EXECUTE CANCEL (INSTANT ZERO-LATENCY) =================
  const handleExecuteCancel = (target = 'all') => {
    // 1. Fire Direct Hardware Stop Requests INSTANTLY (0ms latency)
    if (target === '1' || target === 'all') {
      fireUrlInstant(cancelUrl1);
      setIsTriggerActive1(false);
    }
    if (target === '2' || target === 'all') {
      fireUrlInstant(cancelUrl2);
      setIsTriggerActive2(false);
    }

    // 2. Instant Toast Feedback
    if (target === '1') {
      triggerFeedback(`⏹ Actuator 1 STOPPED -> ${cleanIp1}`);
    } else if (target === '2') {
      triggerFeedback(`⏹ Actuator 2 STOPPED -> ${cleanIp2}`);
    } else {
      triggerFeedback(`⏹ ALL ACTUATORS STOPPED! (1: ${cleanIp1} & 2: ${cleanIp2})`);
    }

    // 3. Parallel asynchronous backend sync (non-blocking, fire-and-forget)
    fetch(`${apiBaseUrl}/api/trigger/cancel?actuator=${target}`, {
      method: "POST"
    }).catch(e => console.warn("Backend cancel sync notice:", e));
  };

  const copyToClipboard = (text, setter) => {
    navigator.clipboard.writeText(text);
    setter(true);
    setTimeout(() => setter(false), 2000);
  };

  return (
    <div className={`rounded-2xl border border-slate-800 bg-[#090d16]/95 backdrop-blur-md p-4 transition-all ${className} ${isTriggerActive ? 'ring-1 ring-red-500/50 shadow-lg shadow-red-950/20' : ''
      }`}>

      {/* Toast Feedback Banner */}
      <AnimatePresence>
        {actionFeedback && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className={`mb-3 p-2.5 rounded-xl border text-xs font-mono font-bold flex items-center justify-between gap-2 shadow-xl ${actionFeedback.type === 'success'
                ? 'bg-emerald-950/90 border-emerald-500/50 text-emerald-300'
                : actionFeedback.type === 'warning'
                  ? 'bg-amber-950/90 border-amber-500/50 text-amber-300'
                  : 'bg-blue-950/90 border-blue-500/50 text-blue-300'
              }`}
          >
            <div className="flex items-center gap-2">
              <Activity className="h-4 w-4 shrink-0 animate-spin" />
              <span>{actionFeedback.message}</span>
            </div>
            <button
              onClick={() => setActionFeedback(null)}
              className="text-[10px] opacity-70 hover:opacity-100"
            >
              ✕
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      {showTitle && (
        <div className="flex flex-wrap items-center justify-between gap-2 pb-3 mb-3 border-b border-slate-800/80">
          <div className="flex items-center gap-2.5">
            <div className={`p-2 rounded-xl transition-colors ${isTriggerActive
                ? 'bg-red-500/20 text-red-400 animate-pulse border border-red-500/40'
                : (pingStatus1.online || pingStatus2.online)
                  ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                  : 'bg-slate-800 text-slate-400'
              }`}>
              <Radio className="h-4 w-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="text-xs font-bold font-mono tracking-wider text-slate-200 uppercase">
                  Dual Actuator Controller (2 Inputs To Hit)
                </h4>
                <span className="text-[9px] font-mono px-2 py-0.5 rounded-full font-bold uppercase tracking-wider bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                  2 ACTUATORS CONFIGURED
                </span>
              </div>
              <p className="text-[10px] text-slate-400 font-sans">
                Enter target IP / URL for each physical actuator. Hit them individually or simultaneously.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => handleTestPing()}
              disabled={pingStatus1.checking || pingStatus2.checking}
              title="Ping both actuators"
              className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700/60 font-mono text-[10px] flex items-center gap-1.5 transition-all"
            >
              <RefreshCw className={`h-3 w-3 ${pingStatus1.checking ? 'animate-spin text-emerald-400' : 'text-slate-400'}`} />
              Test Ping Both
            </button>
            <button
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-800 font-mono text-[10px] flex items-center gap-1 transition-all"
            >
              <Sliders className="h-3 w-3" />
              <span>Endpoints</span>
              {showAdvanced ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
            </button>
          </div>
        </div>
      )}

      {/* ================= 2 INPUTS SECTION ================= */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

        {/* INPUT 1: ACTUATOR 1 */}
        <div className={`p-3.5 rounded-xl border transition-all ${isTriggerActive1
            ? 'bg-red-950/20 border-red-500/50 shadow-md shadow-red-950/30'
            : 'bg-slate-950/60 border-slate-800/80'
          }`}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-mono font-bold text-cyan-400 uppercase tracking-wider flex items-center gap-1.5">
              <Zap className="h-3.5 w-3.5 text-cyan-400" />
              Actuator 1 (Input 1)
            </span>
            <span className={`text-[8px] font-mono px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${pingStatus1.online
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                : 'bg-red-500/20 text-red-400 border border-red-500/30'
              }`}>
              {pingStatus1.checking ? 'PROBING...' : pingStatus1.online ? `ONLINE • ${pingStatus1.latency_ms || 12}ms` : 'OFFLINE'}
            </span>
          </div>

          <div className="grid grid-cols-12 gap-2 mb-2.5">
            <div className="col-span-9">
              <label className="block text-[9px] font-mono text-slate-400 uppercase mb-0.5">Target IP / Host</label>
              <input
                type="text"
                value={targetIp1}
                onChange={(e) => handleIpChange1(e.target.value)}
                placeholder="192.168.137.211"
                className="w-full bg-slate-900 border border-slate-700/80 rounded-lg px-2.5 py-1.5 text-xs font-mono text-emerald-400 placeholder-slate-600 focus:outline-none focus:border-cyan-500 font-semibold"
              />
            </div>
            <div className="col-span-3">
              <label className="block text-[9px] font-mono text-slate-400 uppercase mb-0.5">Port</label>
              <input
                type="text"
                value={targetPort1}
                onChange={(e) => setTargetPort1(e.target.value.trim())}
                placeholder="80"
                className="w-full bg-slate-900 border border-slate-700/80 rounded-lg px-2 py-1.5 text-xs font-mono text-slate-200 text-center font-semibold"
              />
            </div>
          </div>

          {/* Trigger URL 1 */}
          <div className="p-2 rounded-lg bg-slate-900/90 border border-slate-800 text-[10px] font-mono flex items-center justify-between gap-1 mb-3">
            <span className="text-slate-400 truncate select-all">{triggerUrl1}</span>
            <button
              onClick={() => copyToClipboard(triggerUrl1, setCopiedTrigger1)}
              className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white shrink-0"
              title="Copy Trigger URL 1"
            >
              {copiedTrigger1 ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
            </button>
          </div>

          {/* Buttons for Actuator 1 */}
          <div className="flex gap-2">
            <button
              onClick={() => handleExecuteTrigger('1')}
              disabled={isTriggering1}
              className={`flex-1 py-1.5 px-3 rounded-lg font-mono font-bold text-xs flex items-center justify-center gap-1.5 shadow transition-all ${isTriggerActive1
                  ? 'bg-red-600 hover:bg-red-500 text-white animate-pulse'
                  : 'bg-cyan-600 hover:bg-cyan-500 text-white'
                }`}
            >
              <Zap className="h-3.5 w-3.5" />
              <span>{isTriggering1 ? 'Hitting...' : '⚡ Hit Actuator 1'}</span>
            </button>
            <button
              onClick={() => handleExecuteCancel('1')}
              disabled={isCancelling1}
              className="py-1.5 px-3 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-mono text-xs flex items-center gap-1"
            >
              <Square className="h-3 w-3 text-red-400" />
              <span>Stop</span>
            </button>
          </div>
        </div>

        {/* INPUT 2: ACTUATOR 2 */}
        <div className={`p-3.5 rounded-xl border transition-all ${isTriggerActive2
            ? 'bg-red-950/20 border-red-500/50 shadow-md shadow-red-950/30'
            : 'bg-slate-950/60 border-slate-800/80'
          }`}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-mono font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
              <Zap className="h-3.5 w-3.5 text-amber-400" />
              Actuator 2 (Input 2)
            </span>
            <span className={`text-[8px] font-mono px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${pingStatus2.online
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                : 'bg-red-500/20 text-red-400 border border-red-500/30'
              }`}>
              {pingStatus2.checking ? 'PROBING...' : pingStatus2.online ? `ONLINE • ${pingStatus2.latency_ms || 14}ms` : 'OFFLINE'}
            </span>
          </div>

          <div className="grid grid-cols-12 gap-2 mb-2.5">
            <div className="col-span-9">
              <label className="block text-[9px] font-mono text-slate-400 uppercase mb-0.5">Target IP / Host</label>
              <input
                type="text"
                value={targetIp2}
                onChange={(e) => handleIpChange2(e.target.value)}
                placeholder="192.168.137.64"
                className="w-full bg-slate-900 border border-slate-700/80 rounded-lg px-2.5 py-1.5 text-xs font-mono text-amber-300 placeholder-slate-600 focus:outline-none focus:border-amber-500 font-semibold"
              />
            </div>
            <div className="col-span-3">
              <label className="block text-[9px] font-mono text-slate-400 uppercase mb-0.5">Port</label>
              <input
                type="text"
                value={targetPort2}
                onChange={(e) => setTargetPort2(e.target.value.trim())}
                placeholder="80"
                className="w-full bg-slate-900 border border-slate-700/80 rounded-lg px-2 py-1.5 text-xs font-mono text-slate-200 text-center font-semibold"
              />
            </div>
          </div>

          {/* Trigger URL 2 */}
          <div className="p-2 rounded-lg bg-slate-900/90 border border-slate-800 text-[10px] font-mono flex items-center justify-between gap-1 mb-3">
            <span className="text-slate-400 truncate select-all">{triggerUrl2}</span>
            <button
              onClick={() => copyToClipboard(triggerUrl2, setCopiedTrigger2)}
              className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white shrink-0"
              title="Copy Trigger URL 2"
            >
              {copiedTrigger2 ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
            </button>
          </div>

          {/* Buttons for Actuator 2 */}
          <div className="flex gap-2">
            <button
              onClick={() => handleExecuteTrigger('2')}
              disabled={isTriggering2}
              className={`flex-1 py-1.5 px-3 rounded-lg font-mono font-bold text-xs flex items-center justify-center gap-1.5 shadow transition-all ${isTriggerActive2
                  ? 'bg-red-600 hover:bg-red-500 text-white animate-pulse'
                  : 'bg-amber-600 hover:bg-amber-500 text-white'
                }`}
            >
              <Zap className="h-3.5 w-3.5" />
              <span>{isTriggering2 ? 'Hitting...' : '⚡ Hit Actuator 2'}</span>
            </button>
            <button
              onClick={() => handleExecuteCancel('2')}
              disabled={isCancelling2}
              className="py-1.5 px-3 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-mono text-xs flex items-center gap-1"
            >
              <Square className="h-3 w-3 text-red-400" />
              <span>Stop</span>
            </button>
          </div>
        </div>

      </div>

      {/* ================= MASTER ACTIONS ROW ================= */}
      <div className="mt-4 pt-3 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <button
            onClick={handleSaveAndSync}
            disabled={isSaving}
            className="px-3 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-mono font-bold text-xs flex items-center gap-1.5 shadow border border-emerald-500/30"
          >
            {isSaving ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle2 className="h-3.5 w-3.5" />}
            <span>Save & Sync Both Actuator Inputs</span>
          </button>

          <span className="text-[10px] font-mono text-slate-400">
            Status: <strong className={isTriggerActive ? 'text-red-400 font-bold' : 'text-slate-300'}>
              {isTriggerActive ? '⚡ ACTIVE / FIRING' : 'STANDBY'}
            </strong>
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* SIMULTANEOUS HIT BOTH BUTTON */}
          <button
            onClick={() => handleExecuteTrigger('all')}
            disabled={isTriggeringBoth}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white font-mono font-bold text-xs flex items-center gap-2 shadow-lg shadow-red-950/40 active:scale-95 border border-red-500/40"
          >
            <Zap className="h-4 w-4" />
            <span>{isTriggeringBoth ? 'HITTING BOTH...' : '⚡ HIT BOTH ACTUATORS (1 + 2)'}</span>
          </button>

          {/* STOP BOTH */}
          <button
            onClick={() => handleExecuteCancel('all')}
            className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-mono font-bold text-xs flex items-center gap-1.5 border border-slate-700 active:scale-95"
          >
            <Square className="h-3.5 w-3.5 text-red-400" />
            <span>Stop Both</span>
          </button>

          {/* Toggle Species URLs */}
          <button
            onClick={() => setShowSpeciesUrls(!showSpeciesUrls)}
            className={`px-3 py-2 rounded-xl font-mono font-bold text-xs flex items-center gap-1.5 border transition-all ${showSpeciesUrls
                ? 'bg-green-500 text-slate-950 border-green-400 font-black'
                : 'bg-green-500/15 hover:bg-green-500/25 text-green-300 border-green-500/30'
              }`}
          >
            <Globe className="h-3.5 w-3.5" />
            <span>{showSpeciesUrls ? 'Hide Species' : 'Species URLs (11 Targets)'}</span>
          </button>
        </div>
      </div>

      {/* Advanced Endpoints Drawer */}
      <AnimatePresence>
        {showAdvanced && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-3 pt-3 border-t border-slate-800/80 text-xs font-mono grid grid-cols-1 sm:grid-cols-2 gap-3"
          >
            <div className="space-y-1">
              <label className="text-[10px] text-slate-400 font-bold uppercase">Actuator 1 Trigger / Cancel Endpoints</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={triggerEndpoint1}
                  onChange={(e) => setTriggerEndpoint1(e.target.value)}
                  placeholder="/deter"
                  className="w-1/2 bg-slate-950 border border-slate-800 rounded px-2 py-1 text-slate-300"
                />
                <input
                  type="text"
                  value={cancelEndpoint1}
                  onChange={(e) => setCancelEndpoint1(e.target.value)}
                  placeholder="/stop"
                  className="w-1/2 bg-slate-950 border border-slate-800 rounded px-2 py-1 text-slate-300"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] text-slate-400 font-bold uppercase">Actuator 2 Trigger / Cancel Endpoints</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={triggerEndpoint2}
                  onChange={(e) => setTriggerEndpoint2(e.target.value)}
                  placeholder="/deter"
                  className="w-1/2 bg-slate-950 border border-slate-800 rounded px-2 py-1 text-slate-300"
                />
                <input
                  type="text"
                  value={cancelEndpoint2}
                  onChange={(e) => setCancelEndpoint2(e.target.value)}
                  placeholder="/stop"
                  className="w-1/2 bg-slate-950 border border-slate-800 rounded px-2 py-1 text-slate-300"
                />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Per-Species URLs (10 Animals + Human) Embedded Drawer */}
      <AnimatePresence>
        {showSpeciesUrls && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-4 pt-3 border-t border-slate-800"
          >
            <SpeciesUrlManager
              title="Per-Species Trigger URLs (10 Wildlife + Human Targets)"
              subtitle="Custom webhook endpoints hit when species are detected by AI"
            />
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
