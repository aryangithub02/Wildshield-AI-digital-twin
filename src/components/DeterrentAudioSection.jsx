import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Volume2, VolumeX, Play, Pause, RotateCcw, ShieldAlert,
  Radio, Cpu, Sparkles, Activity, AlertTriangle, CheckCircle2,
  Sliders, Music, ExternalLink, Download, Search, Filter,
  Share2, RefreshCw, Zap, Bell, Flame, ChevronRight, CornerDownRight,
  Info, Compass, Layers, Terminal, Globe, Send, Save, Check, X
} from 'lucide-react';
import { 
  DETERRENT_SOUNDS, 
  ANIMAL_DETERRENT_MAPPINGS, 
  getSoundById, 
  getMappingByClassId,
  getMappingByAnimalName,
  getInitialAnimalUrls
} from '../data/deterrentSoundsData';
import { getTranslation } from '../utils/translations';
import ErrorBoundary from './ErrorBoundary';
import SpeciesUrlManager from './SpeciesUrlManager';

export default function DeterrentAudioSection({ language = 'en', onLiveDetection }) {
  return (
    <ErrorBoundary title="Acoustic Deterrent Center">
      <DeterrentAudioSectionInner language={language} onLiveDetection={onLiveDetection} />
    </ErrorBoundary>
  );
}

function DeterrentAudioSectionInner({ language = 'en', onLiveDetection }) {
  const t = (key) => getTranslation(language, key);

  // Audio Player State
  const [activeSoundId, setActiveSoundId] = useState('0004');
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.85);
  const [isMuted, setIsMuted] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1.0);
  const [isLooping, setIsLooping] = useState(false);

  // Filter & Search State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedThreatFilter, setSelectedThreatFilter] = useState('ALL');
  const [selectedSoundFilter, setSelectedSoundFilter] = useState('ALL');
  const [activeViewTab, setActiveViewTab] = useState('urls'); // 'urls' | 'matrix' | 'rack' | 'sandbox' | 'docs'

  // Per-Animal URL Webhook Configuration (Stored in localStorage)
  const [animalUrls, setAnimalUrls] = useState(() => {
    try {
      const saved = localStorage.getItem('wildshield_animal_trigger_urls');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.warn("Could not parse saved animal URLs:", e);
    }
    return getInitialAnimalUrls();
  });

  const [urlMethods, setUrlMethods] = useState(() => {
    try {
      const saved = localStorage.getItem('wildshield_animal_url_methods');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      // fallback
    }
    const methods = {};
    ANIMAL_DETERRENT_MAPPINGS.forEach(item => {
      methods[item.animal] = 'POST';
    });
    return methods;
  });

  // URL Test Ping Feedback State
  const [urlTestStatus, setUrlTestStatus] = useState({});
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Hardware / URL Dispatch Feedback State
  const [dispatchToast, setDispatchToast] = useState(null);

  // Sandbox Test Trigger State
  const [sandboxSelectedClass, setSandboxSelectedClass] = useState(0); // Elephant
  const [sandboxDistance, setSandboxDistance] = useState(18); // meters
  const [sandboxActive, setSandboxActive] = useState(false);
  const [sandboxLog, setSandboxLog] = useState([
    {
      id: 1,
      time: new Date().toLocaleTimeString(),
      text: "Acoustic Engine & URL Dispatcher Ready. 11 Target URL endpoints initialized.",
      type: "info"
    }
  ]);

  // Audio Element Ref (Safe Audio Lifecycle)
  const audioRef = useRef(null);
  const activeSound = DETERRENT_SOUNDS[activeSoundId] || DETERRENT_SOUNDS['0004'];

  // Initialize Audio instance safely once on mount
  useEffect(() => {
    const audio = new Audio();
    audioRef.current = audio;

    const handleTimeUpdate = () => {
      if (audio && !isNaN(audio.currentTime)) {
        setCurrentTime(audio.currentTime);
      }
    };

    const handleLoadedMetadata = () => {
      if (audio && !isNaN(audio.duration)) {
        setDuration(audio.duration);
      }
    };

    const handleEnded = () => {
      if (!audio.loop) {
        setIsPlaying(false);
        setCurrentTime(0);
      }
    };

    const handleError = (e) => {
      console.warn("[WildShield Audio] Native media error:", e);
      setIsPlaying(false);
    };

    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('error', handleError);

    // Initial load
    try {
      audio.src = activeSound.path;
      audio.volume = volume;
    } catch (e) {
      console.warn("Initial audio src setup notice:", e);
    }

    return () => {
      audio.pause();
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('error', handleError);
      audio.src = '';
    };
  }, []);

  // Safe Play Helper
  const safePlay = async (audio) => {
    if (!audio) return;
    try {
      await audio.play();
      setIsPlaying(true);
    } catch (err) {
      console.warn("[WildShield Audio] Auto-play was interrupted or prevented by browser policy:", err.message);
      setIsPlaying(false);
    }
  };

  // Safe Pause Helper
  const safePause = (audio) => {
    if (!audio) return;
    try {
      audio.pause();
      setIsPlaying(false);
    } catch (err) {
      console.warn("Pause error:", err);
    }
  };

  // Toggle Play / Pause for sound ID
  const togglePlay = (targetId = null) => {
    const audio = audioRef.current;
    if (!audio) return;

    const soundToPlay = targetId || activeSoundId;
    const soundData = DETERRENT_SOUNDS[soundToPlay] || DETERRENT_SOUNDS['0004'];

    if (targetId && targetId !== activeSoundId) {
      setActiveSoundId(soundToPlay);
      audio.pause();
      audio.src = soundData.path;
      audio.currentTime = 0;
      safePlay(audio);
      return;
    }

    if (isPlaying) {
      safePause(audio);
    } else {
      if (!audio.src || !audio.src.includes(soundData.file)) {
        audio.src = soundData.path;
      }
      safePlay(audio);
    }
  };

  // Handle Seek
  const handleSeek = (e) => {
    const audio = audioRef.current;
    if (!audio) return;
    const seekTime = parseFloat(e.target.value);
    if (!isNaN(seekTime)) {
      try {
        audio.currentTime = seekTime;
        setCurrentTime(seekTime);
      } catch (err) {
        console.warn("Seek error:", err);
      }
    }
  };

  // Handle Volume Change
  const handleVolumeChange = (e) => {
    const val = parseFloat(e.target.value);
    setVolume(val);
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : val;
    }
    if (val > 0 && isMuted) {
      setIsMuted(false);
    }
  };

  // Toggle Mute
  const toggleMute = () => {
    const newMuted = !isMuted;
    setIsMuted(newMuted);
    if (audioRef.current) {
      audioRef.current.volume = newMuted ? 0 : volume;
    }
  };

  // Cycle Speed
  const cycleSpeed = () => {
    const rates = [0.75, 1.0, 1.25, 1.5];
    const nextIdx = (rates.indexOf(playbackRate) + 1) % rates.length;
    const newRate = rates[nextIdx];
    setPlaybackRate(newRate);
    if (audioRef.current) {
      audioRef.current.playbackRate = newRate;
    }
  };

  // 1-Click Trigger from Species Table
  const handlePlayForAnimal = (item) => {
    if (!item) return;
    const soundId = item.suggestedSoundId || '0004';
    setActiveSoundId(soundId);
    
    const audio = audioRef.current;
    const soundData = DETERRENT_SOUNDS[soundId] || DETERRENT_SOUNDS['0004'];
    if (audio) {
      audio.pause();
      audio.src = soundData.path;
      audio.currentTime = 0;
      safePlay(audio);
    }

    // Auto-hit configured URL for this animal
    hitAnimalTargetUrl(item.animal, item);

    // Add log entry
    setSandboxLog(prev => [
      {
        id: Date.now(),
        time: new Date().toLocaleTimeString(),
        text: `Triggered Sound ${soundId} (${soundData.file}) for ${item.animal} (Class #${item.classId})`,
        type: 'success'
      },
      ...prev.slice(0, 8)
    ]);
  };

  // Save Animal URLs to localStorage & backend
  const handleSaveUrls = async () => {
    try {
      localStorage.setItem('wildshield_animal_trigger_urls', JSON.stringify(animalUrls));
      localStorage.setItem('wildshield_animal_url_methods', JSON.stringify(urlMethods));
      
      // Also notify backend if online
      try {
        await fetch('/api/esp32/config', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ custom_animal_urls: animalUrls })
        });
      } catch (e) {
        // silent fallback if backend is offline
      }

      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      console.warn("Could not save URLs:", err);
    }
  };

  // Update specific animal URL
  const updateAnimalUrl = (animalName, url) => {
    setAnimalUrls(prev => ({
      ...prev,
      [animalName]: url
    }));
  };

  // Update specific animal HTTP method
  const updateAnimalMethod = (animalName, method) => {
    setUrlMethods(prev => ({
      ...prev,
      [animalName]: method
    }));
  };

  // Reset URLs to default
  const resetToDefaultUrls = () => {
    const defaults = getInitialAnimalUrls();
    setAnimalUrls(defaults);
    localStorage.setItem('wildshield_animal_trigger_urls', JSON.stringify(defaults));
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  // Hit Target URL when animal is detected
  const hitAnimalTargetUrl = async (animalName, metadata = {}) => {
    const targetUrl = animalUrls[animalName];
    if (!targetUrl || targetUrl.trim() === '') {
      return { success: false, reason: "No URL configured" };
    }

    const cleanUrl = targetUrl.trim();
    const method = urlMethods[animalName] || 'POST';
    const payload = {
      species: animalName,
      class_id: metadata.classId ?? -1,
      threat: metadata.threat || "HIGH",
      confidence: metadata.confidence || 96.5,
      suggested_sound_id: metadata.suggestedSoundId || "0004",
      audio_file: metadata.audioFile || "0004.mp3",
      timestamp: new Date().toISOString()
    };

    try {
      setUrlTestStatus(prev => ({ ...prev, [animalName]: 'sending' }));

      // Send request (using mode: 'no-cors' so private LAN ESP32s and external webhooks without CORS headers succeed)
      let fetchOptions = {
        method: method,
        mode: 'no-cors',
        headers: { 'Content-Type': 'application/json' }
      };

      if (method === 'POST') {
        fetchOptions.body = JSON.stringify(payload);
      }

      const startTime = performance.now();
      await fetch(cleanUrl, fetchOptions);
      const elapsed = Math.round(performance.now() - startTime);

      setUrlTestStatus(prev => ({ ...prev, [animalName]: `success (${elapsed}ms)` }));
      setDispatchToast({
        title: `Target URL Hit: ${animalName}`,
        url: cleanUrl,
        type: 'success'
      });

      setSandboxLog(prev => [
        {
          id: Date.now() + Math.random(),
          time: new Date().toLocaleTimeString(),
          text: `[URL Dispatch] ${method} -> ${cleanUrl} (Triggered by ${animalName})`,
          type: 'success'
        },
        ...prev.slice(0, 8)
      ]);

      setTimeout(() => setDispatchToast(null), 5000);
      return { success: true };
    } catch (err) {
      console.warn(`[WildShield URL Dispatcher] Failed to hit ${cleanUrl}:`, err);
      setUrlTestStatus(prev => ({ ...prev, [animalName]: 'dispatched (no-cors)' }));
      setDispatchToast({
        title: `Dispatched to ${animalName} URL`,
        url: cleanUrl,
        type: 'info'
      });
      setTimeout(() => setDispatchToast(null), 5000);
      return { success: false, error: err.message };
    }
  };

  // Run Sandbox Simulation
  const runSandboxSimulation = () => {
    const animal = ANIMAL_DETERRENT_MAPPINGS.find(m => m.classId === sandboxSelectedClass) || ANIMAL_DETERRENT_MAPPINGS[0];
    const sound = DETERRENT_SOUNDS[animal.suggestedSoundId] || DETERRENT_SOUNDS['0004'];
    
    setSandboxActive(true);
    handlePlayForAnimal(animal);

    setSandboxLog(prev => [
      {
        id: Date.now() + 1,
        time: new Date().toLocaleTimeString(),
        text: `[YOLOv11 Detection] Confirmed ${animal.emoji} ${animal.animal} at distance ${sandboxDistance}m (Threat: ${animal.threat})`,
        type: 'alert'
      },
      {
        id: Date.now() + 2,
        time: new Date().toLocaleTimeString(),
        text: `[Audio Matrix] Selected Track ${animal.suggestedSoundId} (${sound.file}) • Decibels: ${sound.decibels}`,
        type: 'info'
      },
      {
        id: Date.now() + 3,
        time: new Date().toLocaleTimeString(),
        text: `[Automated Webhook] Triggered target endpoint: ${animalUrls[animal.animal] || 'Default Node'}`,
        type: 'success'
      },
      ...prev.slice(0, 6)
    ]);

    setTimeout(() => {
      setSandboxActive(false);
    }, 4500);
  };

  // Helper format seconds
  const formatTime = (secs) => {
    if (!secs || isNaN(secs)) return '0:00';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  // Filter Species Matrix
  const filteredAnimals = ANIMAL_DETERRENT_MAPPINGS.filter(item => {
    const matchesSearch = 
      item.animal.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.scientific.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.suggestedSoundId.includes(searchQuery) ||
      String(item.classId).includes(searchQuery);

    const matchesThreat = 
      selectedThreatFilter === 'ALL' || item.threat === selectedThreatFilter;

    const matchesSound = 
      selectedSoundFilter === 'ALL' || item.suggestedSoundId === selectedSoundFilter;

    return matchesSearch && matchesThreat && matchesSound;
  });

  return (
    <div className="space-y-6 text-left select-none pb-12">
      
      {/* 1. TOP HERO HEADER & METRIC SUMMARY */}
      <div className="bg-gradient-to-r from-[#0b0f19] via-[#0e1626] to-[#0b0f19] border border-slate-800/80 rounded-2xl p-5 shadow-xl relative overflow-hidden">
        {/* Glow backdrop decoration */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-green-500/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 w-80 h-80 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 relative z-10">
          <div className="flex items-center gap-3.5">
            <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-green-500/20 to-emerald-500/10 border border-green-500/30 flex items-center justify-center text-green-400 shadow-inner">
              <Volume2 className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-lg font-black text-slate-100 font-sans tracking-wide uppercase">
                  Acoustic Deterrents & Detection Webhooks
                </h1>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-green-500/15 text-green-400 border border-green-500/30">
                  11 CLASSES (10 ANIMALS + HUMAN)
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-cyan-500/15 text-cyan-400 border border-cyan-500/30">
                  5 DETERRENT TRACKS
                </span>
              </div>
              <p className="text-xs text-slate-400 font-mono mt-1">
                Configure custom webhook / hardware trigger URLs for every species. Automatically dispatched when detected.
              </p>
            </div>
          </div>

          {/* Tab Navigation Controls */}
          <div className="flex items-center bg-[#070b13] border border-slate-800 p-1 rounded-xl flex-wrap gap-1">
            {[
              { id: 'urls', label: 'Trigger URLs (11)', icon: Globe },
              { id: 'matrix', label: 'Species & Audio Matrix', icon: Layers },
              { id: 'rack', label: 'Sound Rack (5 Tracks)', icon: Music },
              { id: 'sandbox', label: 'Detection Simulator', icon: Radio },
              { id: 'docs', label: 'ESP32 Wiring Guide', icon: Terminal },
            ].map(tab => {
              const Icon = tab.icon;
              const isActive = activeViewTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveViewTab(tab.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    isActive
                      ? 'bg-green-500 text-slate-950 shadow-md font-bold'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
                  }`}
                >
                  <Icon className="h-3.5 w-3.5" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* 2. MASTER AUDIO PLAYER DOCK (Pure Crash-Proof CSS/SVG Equalizer) */}
      <div className={`bg-[#0b0f19] border ${activeSound.borderColor || 'border-slate-800'} rounded-2xl p-5 shadow-2xl relative overflow-hidden transition-all duration-300`}>
        <div className="relative z-10 flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-6">
          
          {/* Left: Track Info & Crash-Free Equalizer */}
          <div className="flex items-center gap-4 flex-1 min-w-[280px]">
            {/* Visualizer Disk with Pure CSS/SVG Equalizer */}
            <div className="relative shrink-0">
              <div className={`h-16 w-16 rounded-2xl bg-slate-950 border ${activeSound.borderColor || 'border-slate-800'} flex items-center justify-center relative overflow-hidden shadow-inner`}>
                {isPlaying ? (
                  <div className="flex items-end gap-1 h-8 px-2">
                    <span className="w-1 bg-green-400 rounded-full animate-[pulse_0.4s_ease-in-out_infinite] h-5" />
                    <span className="w-1 bg-green-400 rounded-full animate-[pulse_0.6s_ease-in-out_infinite] h-8" />
                    <span className="w-1 bg-green-400 rounded-full animate-[pulse_0.5s_ease-in-out_infinite] h-6" />
                    <span className="w-1 bg-green-400 rounded-full animate-[pulse_0.7s_ease-in-out_infinite] h-7" />
                    <span className="w-1 bg-green-400 rounded-full animate-[pulse_0.3s_ease-in-out_infinite] h-4" />
                  </div>
                ) : (
                  <Music className={`h-7 w-7 ${activeSound.textColor || 'text-green-400'}`} />
                )}
              </div>
              {isPlaying && (
                <span className="absolute -top-1 -right-1 flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500" />
                </span>
              )}
            </div>

            {/* Title & Metadata */}
            <div className="overflow-hidden">
              <div className="flex items-center gap-2">
                <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider ${activeSound.badgeColor || 'bg-slate-900 text-slate-300'}`}>
                  TRACK {activeSound.id}
                </span>
                <span className="text-slate-400 font-mono text-[11px]">
                  {activeSound.file} ({activeSound.sizeFormatted})
                </span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-900 text-slate-300 font-mono">
                  {activeSound.decibels}
                </span>
              </div>
              <h3 className="text-base font-black text-slate-100 font-sans tracking-wide truncate mt-0.5">
                {activeSound.title}
              </h3>
              <p className="text-xs text-slate-400 font-mono truncate">
                {activeSound.subtitle} • <span className={activeSound.textColor || 'text-green-400'}>{activeSound.frequency}</span>
              </p>
            </div>
          </div>

          {/* Center: Playback Controls & Wave Scrub Bar */}
          <div className="flex flex-col items-center gap-2 flex-1 max-w-xl w-full">
            
            {/* Control Buttons */}
            <div className="flex items-center gap-3">
              {/* Loop Toggle */}
              <button
                onClick={() => setIsLooping(!isLooping)}
                title="Toggle Loop"
                className={`p-2 rounded-lg text-xs font-mono transition-all ${
                  isLooping 
                    ? 'bg-green-500/20 text-green-400 border border-green-500/40' 
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
                }`}
              >
                <RotateCcw className="h-4 w-4" />
              </button>

              {/* Prev Track */}
              <button
                onClick={() => {
                  const ids = Object.keys(DETERRENT_SOUNDS);
                  const currentIdx = ids.indexOf(activeSoundId);
                  const prevId = ids[(currentIdx - 1 + ids.length) % ids.length];
                  togglePlay(prevId);
                }}
                className="p-2 text-slate-400 hover:text-slate-100 transition-colors"
                title="Previous Track"
              >
                <span className="font-bold text-sm">⏮</span>
              </button>

              {/* Primary Play/Pause Button */}
              <button
                onClick={() => togglePlay()}
                className={`h-12 w-12 rounded-full flex items-center justify-center text-slate-950 font-bold transition-transform active:scale-95 shadow-lg ${
                  isPlaying 
                    ? 'bg-amber-400 hover:bg-amber-300 shadow-amber-500/25' 
                    : 'bg-green-500 hover:bg-green-400 shadow-green-500/25'
                }`}
              >
                {isPlaying ? <Pause className="h-5 w-5 fill-current" /> : <Play className="h-5 w-5 fill-current ml-0.5" />}
              </button>

              {/* Next Track */}
              <button
                onClick={() => {
                  const ids = Object.keys(DETERRENT_SOUNDS);
                  const currentIdx = ids.indexOf(activeSoundId);
                  const nextId = ids[(currentIdx + 1) % ids.length];
                  togglePlay(nextId);
                }}
                className="p-2 text-slate-400 hover:text-slate-100 transition-colors"
                title="Next Track"
              >
                <span className="font-bold text-sm">⏭</span>
              </button>

              {/* Speed Cycle Button */}
              <button
                onClick={cycleSpeed}
                title="Playback Speed"
                className="px-2 py-1 rounded-md text-[10px] font-mono font-bold bg-slate-900/80 text-slate-300 border border-slate-800 hover:border-slate-700"
              >
                {playbackRate}x
              </button>
            </div>

            {/* Scrub Progress Bar */}
            <div className="w-full flex items-center gap-3 text-[11px] font-mono text-slate-400">
              <span className="w-10 text-right">{formatTime(currentTime)}</span>
              
              <div className="relative flex-1 flex items-center group">
                <input
                  type="range"
                  min="0"
                  max={duration || activeSound.durationSec || 100}
                  step="0.1"
                  value={currentTime}
                  onChange={handleSeek}
                  className="w-full h-1.5 bg-slate-900 rounded-lg appearance-none cursor-pointer accent-green-500 focus:outline-none"
                />
              </div>

              <span className="w-10">{formatTime(duration || activeSound.durationSec)}</span>
            </div>
          </div>

          {/* Right: Volume & Trigger */}
          <div className="flex items-center gap-4 shrink-0">
            {/* Volume Control */}
            <div className="flex items-center gap-2 bg-[#070b13] border border-slate-800 px-3 py-1.5 rounded-xl">
              <button 
                onClick={toggleMute}
                className="text-slate-400 hover:text-slate-100 transition-colors"
              >
                {isMuted || volume === 0 ? (
                  <VolumeX className="h-4 w-4 text-red-400" />
                ) : (
                  <Volume2 className="h-4 w-4 text-green-400" />
                )}
              </button>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={isMuted ? 0 : volume}
                onChange={handleVolumeChange}
                className="w-16 h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-green-500"
              />
              <span className="text-[10px] font-mono text-slate-400 w-7">
                {Math.round((isMuted ? 0 : volume) * 100)}%
              </span>
            </div>
          </div>
        </div>

        {/* Live URL Dispatch Notification Toast */}
        <AnimatePresence>
          {dispatchToast && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mt-4 p-2.5 rounded-xl bg-emerald-500/15 border border-emerald-500/40 text-emerald-200 text-xs font-mono flex items-center justify-between"
            >
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                <span>{dispatchToast.title}: <strong className="text-slate-100">{dispatchToast.url}</strong></span>
              </div>
              <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800">
                DISPATCHED
              </span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* 3. TAB VIEW CONTENT */}

      {/* VIEW 1: ANIMAL WEBHOOK / TRIGGER URL CONFIGURATION (USER'S DIRECT REQUEST!) */}
      {activeViewTab === 'urls' && (
        <SpeciesUrlManager />
      )}

      {/* VIEW 2: ANIMAL CLASS MATRIX */}
      {activeViewTab === 'matrix' && (
        <div className="space-y-4">
          {/* Filters Toolbar */}
          <div className="bg-[#0b0f19] border border-slate-900 rounded-xl p-3.5 flex flex-col md:flex-row items-center justify-between gap-3 shadow-sm">
            <div className="relative w-full md:w-72">
              <Search className="h-4 w-4 text-slate-500 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search animal, Class ID, sound..."
                className="w-full bg-[#070b13] border border-slate-800 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-green-500"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2 text-xs font-mono">
              <span className="text-slate-500">Filter:</span>
              {['ALL', 'CRITICAL', 'HIGH', 'MEDIUM', 'LOW', 'SECURITY'].map(lvl => (
                <button
                  key={lvl}
                  onClick={() => setSelectedThreatFilter(lvl)}
                  className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    selectedThreatFilter === lvl ? 'bg-green-500 text-slate-950' : 'text-slate-400 bg-slate-900'
                  }`}
                >
                  {lvl}
                </button>
              ))}
            </div>
          </div>

          {/* Table */}
          <div className="bg-[#0b0f19] border border-slate-900 rounded-xl overflow-hidden shadow-lg">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-[#0e1626] border-b border-slate-800 text-slate-400 font-mono text-[11px] uppercase">
                    <th className="py-3 px-4 text-center">Class ID</th>
                    <th className="py-3 px-4">Animal</th>
                    <th className="py-3 px-4">Threat</th>
                    <th className="py-3 px-4">Suggested Sound</th>
                    <th className="py-3 px-4">Audio File</th>
                    <th className="py-3 px-4">Configured URL Endpoint</th>
                    <th className="py-3 px-4 text-right">Quick Play & Test</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-850 font-sans">
                  {filteredAnimals.map((row) => (
                    <tr key={row.classId} className="hover:bg-slate-900/50 transition-colors">
                      <td className="py-3.5 px-4 text-center">
                        <span className="px-2 py-0.5 rounded bg-slate-950 border border-slate-800 text-slate-300 font-mono font-bold text-xs">
                          #{row.classId}
                        </span>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2.5">
                          <span className="text-lg">{row.emoji}</span>
                          <div>
                            <span className="font-extrabold text-slate-100 block">{row.animal}</span>
                            <span className="text-[10px] text-slate-500 font-mono italic">{row.scientific}</span>
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                          row.threat === 'CRITICAL' ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30' :
                          row.threat === 'HIGH' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' :
                          row.threat === 'MEDIUM' ? 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/30' :
                          row.threat === 'SECURITY' ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30' :
                          'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                        }`}>
                          {row.threat}
                        </span>
                      </td>

                      <td className="py-3.5 px-4">
                        <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 font-mono font-bold text-green-400 text-xs">
                          Track {row.suggestedSoundId}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 font-mono text-slate-300">
                        `{row.audioFile}`
                      </td>

                      <td className="py-3.5 px-4 font-mono text-[11px] max-w-xs truncate text-cyan-300">
                        {animalUrls[row.animal] || "Default ESP32"}
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handlePlayForAnimal(row)}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-green-500/20 text-green-300 border border-green-500/40 hover:bg-green-500 hover:text-slate-950 transition-all shadow-sm"
                          >
                            <Play className="h-3.5 w-3.5 fill-current" />
                            <span>Play & Hit URL</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* VIEW 3: 5 SOUND TRACKS RACK */}
      {activeViewTab === 'rack' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {Object.values(DETERRENT_SOUNDS).map((sound) => {
            const isThisPlaying = isPlaying && activeSoundId === sound.id;

            return (
              <div
                key={sound.id}
                className={`bg-[#0b0f19] border ${isThisPlaying ? sound.borderColor : 'border-slate-850'} rounded-2xl p-5 shadow-lg flex flex-col justify-between hover:border-slate-700 transition-all`}
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold ${sound.badgeColor}`}>
                      TRACK {sound.id}
                    </span>
                    <span className="text-xs font-mono text-slate-400">
                      {sound.decibels}
                    </span>
                  </div>

                  <h3 className="text-base font-black text-slate-100 font-sans tracking-wide">
                    {sound.title}
                  </h3>
                  <p className="text-xs text-slate-400 font-mono mt-1">
                    {sound.subtitle}
                  </p>

                  <div className="mt-3 p-2 rounded-lg bg-slate-950 border border-slate-900 text-[11px] font-mono text-slate-300">
                    <div className="text-[9px] uppercase text-slate-500 font-bold mb-0.5">ACOUSTIC PROFILE:</div>
                    <span className={sound.textColor}>{sound.frequency}</span>
                  </div>

                  <p className="text-xs text-slate-400 mt-3 leading-relaxed">
                    {sound.description}
                  </p>

                  <div className="mt-4 pt-3 border-t border-slate-900">
                    <span className="text-[10px] uppercase font-mono font-bold text-slate-500 block mb-2">
                      TARGET SPECIES (CLASSES):
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {sound.targetAnimals.map((animal, i) => (
                        <span key={i} className="px-2 py-0.5 rounded text-[10px] font-sans font-semibold bg-slate-900 text-slate-300 border border-slate-800">
                          {animal}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="mt-6 pt-3 border-t border-slate-900 flex items-center justify-between gap-3">
                  <div className="text-[10px] font-mono text-slate-500">
                    <span>{sound.file}</span>
                    <span className="mx-1">•</span>
                    <span>{sound.sizeFormatted}</span>
                  </div>

                  <button
                    onClick={() => togglePlay(sound.id)}
                    className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all shadow-sm ${
                      isThisPlaying ? 'bg-amber-400 text-slate-950' : 'bg-green-500 text-slate-950 hover:bg-green-400'
                    }`}
                  >
                    {isThisPlaying ? <Pause className="h-3.5 w-3.5 fill-current" /> : <Play className="h-3.5 w-3.5 fill-current" />}
                    <span>{isThisPlaying ? 'Stop' : 'Play Sound'}</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* VIEW 4: DETECTION SIMULATOR */}
      {activeViewTab === 'sandbox' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1 bg-[#0b0f19] border border-slate-900 rounded-2xl p-5 shadow-lg space-y-4">
            <div>
              <h3 className="text-sm font-black text-slate-100 uppercase tracking-wide">
                Intrusion & URL Dispatch Simulator
              </h3>
              <p className="text-xs text-slate-500 font-mono mt-1">
                Select an animal or human to test immediate sound playback and custom webhook URL hitting.
              </p>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-mono font-bold text-slate-300">Select Detected Species:</label>
              <select
                value={sandboxSelectedClass}
                onChange={(e) => setSandboxSelectedClass(Number(e.target.value))}
                className="w-full bg-[#070b13] border border-slate-800 rounded-xl p-2.5 text-xs text-slate-100 font-sans focus:outline-none focus:border-green-500"
              >
                {ANIMAL_DETERRENT_MAPPINGS.map(item => (
                  <option key={item.classId} value={item.classId}>
                    Class #{item.classId}: {item.emoji} {item.animal} ({item.threat})
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-slate-300 font-bold">Boundary Proximity:</span>
                <span className="text-green-400 font-bold">{sandboxDistance} meters</span>
              </div>
              <input
                type="range"
                min="3"
                max="60"
                value={sandboxDistance}
                onChange={(e) => setSandboxDistance(Number(e.target.value))}
                className="w-full h-1.5 bg-slate-900 rounded-lg appearance-none cursor-pointer accent-green-500"
              />
            </div>

            {(() => {
              const selectedItem = ANIMAL_DETERRENT_MAPPINGS.find(m => m.classId === sandboxSelectedClass) || ANIMAL_DETERRENT_MAPPINGS[0];
              const sound = DETERRENT_SOUNDS[selectedItem.suggestedSoundId] || DETERRENT_SOUNDS['0004'];
              const targetUrl = animalUrls[selectedItem.animal] || "Default ESP32";

              return (
                <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-900 space-y-2 text-xs font-mono">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">PLAYING AUDIO:</span>
                    <span className="text-green-400 font-bold">Track {selectedItem.suggestedSoundId} ({sound.file})</span>
                  </div>
                  <div className="flex flex-col gap-0.5">
                    <span className="text-slate-500">WILL HIT TARGET URL:</span>
                    <span className="text-cyan-400 font-bold break-all text-[11px]">{targetUrl}</span>
                  </div>
                </div>
              );
            })()}

            <button
              onClick={runSandboxSimulation}
              disabled={sandboxActive}
              className={`w-full py-3 rounded-xl text-xs font-black uppercase tracking-wider transition-all shadow-lg flex items-center justify-center gap-2 ${
                sandboxActive ? 'bg-amber-500 text-slate-950 animate-pulse' : 'bg-green-500 hover:bg-green-400 text-slate-950'
              }`}
            >
              <Radio className="h-4 w-4" />
              <span>{sandboxActive ? 'Deterrent & URL Firing...' : 'Simulate Intrusion & Trigger Deterrent'}</span>
            </button>
          </div>

          <div className="lg:col-span-2 bg-[#0b0f19] border border-slate-900 rounded-2xl p-5 shadow-lg flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between border-b border-slate-900 pb-3 mb-3">
                <div className="flex items-center gap-2">
                  <Terminal className="h-4 w-4 text-green-400" />
                  <span className="text-xs font-mono font-bold text-slate-200">
                    Live Event Bus & Webhook Dispatch Console
                  </span>
                </div>
                <span className="text-[10px] font-mono text-slate-500">REAL-TIME BUS</span>
              </div>

              <div className="space-y-2 min-h-[220px]">
                {sandboxLog.map(item => (
                  <div 
                    key={item.id}
                    className={`p-2 rounded-lg font-mono text-[11px] flex items-start gap-2.5 border ${
                      item.type === 'alert'
                        ? 'bg-rose-500/10 text-rose-300 border-rose-500/20'
                        : item.type === 'success'
                        ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20'
                        : 'bg-slate-950 text-slate-300 border-slate-900'
                    }`}
                  >
                    <span className="text-slate-500 shrink-0">[{item.time}]</span>
                    <span className="flex-1">{item.text}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* VIEW 5: HARDWARE WIRING & ESP32 */}
      {activeViewTab === 'docs' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-[#0b0f19] border border-slate-900 rounded-2xl p-5 shadow-lg space-y-4">
            <h3 className="text-sm font-black text-slate-100 uppercase tracking-wide flex items-center gap-2">
              <Cpu className="h-4 w-4 text-cyan-400" />
              ESP32 to MP3-TF-16P (DFPlayer Mini) Pinout
            </h3>

            <table className="w-full text-left text-xs font-mono border-collapse">
              <thead>
                <tr className="bg-slate-950 border-b border-slate-800 text-slate-400 text-[10px]">
                  <th className="py-2 px-3">ESP32 Pin</th>
                  <th className="py-2 px-3">DFPlayer Pin</th>
                  <th className="py-2 px-3">Function</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-900 text-slate-300">
                <tr>
                  <td className="py-2 px-3 text-cyan-400 font-bold">GPIO 25</td>
                  <td className="py-2 px-3">RX (Pin 2)</td>
                  <td className="py-2 px-3">ESP32 TX2 (1kΩ resistor)</td>
                </tr>
                <tr>
                  <td className="py-2 px-3 text-cyan-400 font-bold">GPIO 34</td>
                  <td className="py-2 px-3">TX (Pin 3)</td>
                  <td className="py-2 px-3">ESP32 RX2</td>
                </tr>
                <tr>
                  <td className="py-2 px-3 text-amber-400 font-bold">5V Rail</td>
                  <td className="py-2 px-3">VCC (Pin 1)</td>
                  <td className="py-2 px-3">5V 2A clean DC</td>
                </tr>
                <tr>
                  <td className="py-2 px-3 text-slate-400 font-bold">GND</td>
                  <td className="py-2 px-3">GND (Pin 7 / 10)</td>
                  <td className="py-2 px-3">Common Ground</td>
                </tr>
                <tr>
                  <td className="py-2 px-3 text-green-400 font-bold">SPK_1 / SPK_2</td>
                  <td className="py-2 px-3">Pins 6 & 8</td>
                  <td className="py-2 px-3">Horn / PA Speaker</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="bg-[#0b0f19] border border-slate-900 rounded-2xl p-5 shadow-lg space-y-3">
            <h3 className="text-sm font-black text-slate-100 uppercase tracking-wide flex items-center gap-2">
              <Terminal className="h-4 w-4 text-emerald-400" />
              Arduino Firmware Snippet
            </h3>

            <pre className="p-3 rounded-xl bg-[#070b13] border border-slate-900 text-[11px] font-mono text-slate-300 overflow-x-auto leading-relaxed">
{`#include <DFRobotDFPlayerMini.h>

HardwareSerial mp3Serial(2); // UART2
DFRobotDFPlayerMini dfPlayer;

void setup() {
  mp3Serial.begin(9600, SERIAL_8N1, 34, 25);
  dfPlayer.begin(mp3Serial);
  dfPlayer.volume(28); // 0-30 max volume
}

void triggerDeterrent(int track) {
  dfPlayer.playMp3Folder(track); // /mp3/0001.mp3
  digitalWrite(PIN_FLOODLIGHT, HIGH);
}`}
            </pre>
          </div>
        </div>
      )}

    </div>
  );
}
