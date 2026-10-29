import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Globe, Save, RotateCcw, Send, Play, Check, AlertTriangle,
  Search, Sliders, ExternalLink, Zap, CheckCircle2, Copy, Download, Upload, Volume2
} from 'lucide-react';
import {
  ANIMAL_DETERRENT_MAPPINGS,
  DETERRENT_SOUNDS,
  getInitialAnimalUrls
} from '../data/deterrentSoundsData';
import {
  getAnimalUrls,
  saveAnimalUrls,
  getAnimalUrlMethods,
  saveAnimalUrlMethods,
  dispatchAnimalDetectionUrl
} from '../utils/animalUrlDispatcher';

export default function SpeciesUrlManager({
  compact = false,
  title = "Per-Species Trigger URLs (10 Animals + Human)",
  subtitle = "Configure dedicated target URLs (ESP32, Webhook, API) triggered automatically when each species is detected."
}) {
  const [urls, setUrls] = useState(() => getAnimalUrls());
  const [methods, setMethods] = useState(() => getAnimalUrlMethods());
  const [testStatuses, setTestStatuses] = useState({});
  const [lastDispatchedSpecies, setLastDispatchedSpecies] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [commonIp, setCommonIp] = useState('192.168.137.211');
  const [showBulkIpModal, setShowBulkIpModal] = useState(false);
  const [testingAll, setTestingAll] = useState(false);
  const [playingTrackId, setPlayingTrackId] = useState(null);

  // Audio preview reference
  const [audioPlayer, setAudioPlayer] = useState(null);

  useEffect(() => {
    const audio = new Audio();
    setAudioPlayer(audio);
    return () => {
      audio.pause();
      audio.src = '';
    };
  }, []);

  // Listen for real-time dispatch events from anywhere in the app
  useEffect(() => {
    const handleDispatched = (e) => {
      if (e.detail?.species) {
        setLastDispatchedSpecies(e.detail.species);
        setTestStatuses(prev => ({
          ...prev,
          [e.detail.species]: `⚡ Auto-Hit (${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })})`
        }));
      }
    };
    window.addEventListener('wildshield:animal-url-dispatched', handleDispatched);
    return () => {
      window.removeEventListener('wildshield:animal-url-dispatched', handleDispatched);
    };
  }, []);

  // Play audio preview safely
  const playSoundPreview = (soundId) => {
    if (!audioPlayer) return;
    const sound = DETERRENT_SOUNDS[soundId] || DETERRENT_SOUNDS['0004'];
    if (playingTrackId === soundId) {
      audioPlayer.pause();
      setPlayingTrackId(null);
      return;
    }
    audioPlayer.pause();
    audioPlayer.src = sound.path;
    audioPlayer.currentTime = 0;
    audioPlayer.play().then(() => {
      setPlayingTrackId(soundId);
    }).catch(err => {
      console.warn("Audio preview notice:", err);
    });

    audioPlayer.onended = () => {
      setPlayingTrackId(null);
    };
  };

  // Update specific animal URL
  const handleUrlChange = (animalName, newUrl) => {
    setUrls(prev => ({
      ...prev,
      [animalName]: newUrl
    }));
  };

  // Update specific animal HTTP method
  const handleMethodChange = (animalName, newMethod) => {
    setMethods(prev => ({
      ...prev,
      [animalName]: newMethod
    }));
  };

  // Save all URLs to storage and backend
  const handleSaveAll = () => {
    saveAnimalUrls(urls);
    saveAnimalUrlMethods(methods);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  // Reset to default endpoints
  const handleResetDefaults = () => {
    const defUrls = getInitialAnimalUrls();
    const defMethods = {};
    ANIMAL_DETERRENT_MAPPINGS.forEach(item => {
      defMethods[item.animal] = "POST";
    });
    setUrls(defUrls);
    setMethods(defMethods);
    saveAnimalUrls(defUrls);
    saveAnimalUrlMethods(defMethods);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  // Quick batch apply IP prefix (e.g. 192.168.1.50)
  const applyCommonIp = (ipToApply) => {
    const clean = ipToApply.trim().replace(/^https?:\/\//i, '').split('/')[0];
    if (!clean) return;

    const newUrls = {};
    ANIMAL_DETERRENT_MAPPINGS.forEach(item => {
      if (item.animal === "Human") {
        newUrls[item.animal] = `http://${clean}/human`;
      } else {
        newUrls[item.animal] = `http://${clean}/deter?track=${parseInt(item.suggestedSoundId, 10)}`;
      }
    });

    setUrls(newUrls);
    saveAnimalUrls(newUrls);
    setShowBulkIpModal(false);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  // Test hit single animal URL
  const testHitUrl = async (animalItem) => {
    const animalName = animalItem.animal;
    setTestStatuses(prev => ({ ...prev, [animalName]: 'sending...' }));
    const startTime = performance.now();
    try {
      await dispatchAnimalDetectionUrl(animalName, {
        threat: animalItem.threat,
        confidence: 96.8,
        nodeName: "Manual Test Probe"
      }, true);
      const elapsed = Math.round(performance.now() - startTime);
      setTestStatuses(prev => ({ ...prev, [animalName]: `Hit Sent (${elapsed}ms)` }));
    } catch (err) {
      setTestStatuses(prev => ({ ...prev, [animalName]: 'Error' }));
    }
  };

  // Test hit all URLs in sequence
  const testHitAll = async () => {
    setTestingAll(true);
    for (const item of ANIMAL_DETERRENT_MAPPINGS) {
      await testHitUrl(item);
      await new Promise(r => setTimeout(r, 200));
    }
    setTestingAll(false);
  };

  // Filter animals based on search
  const filtered = ANIMAL_DETERRENT_MAPPINGS.filter(m => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      m.animal.toLowerCase().includes(q) ||
      m.scientific.toLowerCase().includes(q) ||
      String(m.classId).includes(q) ||
      m.suggestedSoundId.includes(q)
    );
  });

  return (
    <div className="bg-[#0b0f19] border border-slate-900 rounded-2xl p-4 md:p-6 shadow-xl space-y-4">

      {/* 1. Header Toolbar */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-slate-850 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-green-500/10 border border-green-500/20 flex items-center justify-center text-green-400">
              <Globe className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-100 font-sans uppercase tracking-wider flex items-center gap-2">
                {title}
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-green-500/10 text-green-400 border border-green-500/30">
                  11 TARGETS (10 ANIMALS + HUMAN)
                </span>
              </h2>
              <p className="text-xs text-slate-400 font-mono mt-0.5">
                {subtitle}
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Quick Batch IP Preset */}
          <button
            onClick={() => setShowBulkIpModal(!showBulkIpModal)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-medium text-slate-300 bg-slate-900 hover:bg-slate-800 border border-slate-800 transition-all"
            title="Batch configure IP for all 11 endpoints"
          >
            <Sliders className="h-3.5 w-3.5 text-cyan-400" />
            <span>Set Common IP Prefix</span>
          </button>

          {/* Test All */}
          <button
            onClick={testHitAll}
            disabled={testingAll}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-bold text-cyan-400 bg-cyan-950/40 hover:bg-cyan-900/50 border border-cyan-800/50 transition-all disabled:opacity-50"
          >
            <Zap className={`h-3.5 w-3.5 ${testingAll ? 'animate-bounce' : ''}`} />
            <span>{testingAll ? 'Pinging All...' : 'Test All 11'}</span>
          </button>

          {/* Reset Defaults */}
          <button
            onClick={handleResetDefaults}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono text-slate-400 bg-slate-900 hover:text-slate-200 border border-slate-800 transition-all"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            <span>Reset</span>
          </button>

          {/* Save All */}
          <button
            onClick={handleSaveAll}
            className={`flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-bold transition-all shadow-md ${saveSuccess
                ? 'bg-emerald-500 text-slate-950 font-black'
                : 'bg-green-500 hover:bg-green-400 text-slate-950'
              }`}
          >
            {saveSuccess ? <Check className="h-4 w-4" /> : <Save className="h-4 w-4" />}
            <span>{saveSuccess ? 'Saved All!' : 'Save URLs'}</span>
          </button>
        </div>
      </div>

      {/* 2. Quick Common IP Modal / Drawer */}
      <AnimatePresence>
        {showBulkIpModal && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-[#0e1626] border border-cyan-500/30 rounded-xl p-4 overflow-hidden"
          >
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div>
                <span className="text-xs font-bold text-cyan-300 font-sans block">
                  Batch Set Target Device IP Address
                </span>
                <span className="text-[11px] text-slate-400 font-mono">
                  Enter your ESP32 or gateway IP (e.g. 192.168.137.211) to automatically set all 11 species URLs.
                </span>
              </div>
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <input
                  type="text"
                  value={commonIp}
                  onChange={(e) => setCommonIp(e.target.value)}
                  placeholder="192.168.137.211"
                  className="bg-slate-950 border border-cyan-500/40 rounded-lg px-3 py-1.5 text-xs font-mono text-cyan-200 w-44 focus:outline-none"
                />
                <button
                  onClick={() => applyCommonIp(commonIp)}
                  className="px-3 py-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-bold font-mono shrink-0"
                >
                  Apply to All 11
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 3. Search & Filter Bar */}
      <div className="relative">
        <Search className="h-4 w-4 text-slate-500 absolute left-3 top-2.5" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Filter species (e.g. Elephant, Leopard, Human, Wild Boar)..."
          className="w-full bg-[#070b13] border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-xs font-mono text-slate-200 placeholder-slate-600 focus:outline-none focus:border-green-500"
        />
      </div>

      {/* 4. Species URL Input Rows (10 Animals + Human) */}
      <div className="divide-y divide-slate-850 border border-slate-850 rounded-xl overflow-hidden bg-[#070b13]">
        {filtered.map((item) => {
          const currentUrl = urls[item.animal] ?? "";
          const currentMethod = methods[item.animal] || "POST";
          const status = testStatuses[item.animal];
          const isJustDispatched = lastDispatchedSpecies === item.animal;
          const isHuman = item.animal === "Human";

          return (
            <div
              key={item.classId}
              className={`p-3 md:p-4 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-3 transition-colors ${isJustDispatched
                  ? 'bg-green-500/10 border-l-4 border-l-green-400'
                  : 'hover:bg-slate-900/50'
                }`}
            >
              {/* Species Identification Info */}
              <div className="flex items-center gap-3 min-w-[210px] shrink-0">
                <div className="relative shrink-0">
                  <img
                    src={item.avatar}
                    alt={item.animal}
                    className="h-10 w-10 rounded-xl object-cover border border-slate-800"
                    onError={(e) => {
                      e.target.src = "https://images.unsplash.com/photo-1546182990-dffeafbe841d?q=80&w=150&auto=format&fit=crop";
                    }}
                  />
                  <span className="absolute -bottom-1 -right-1 text-sm">{item.emoji}</span>
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold text-slate-100 font-sans">{item.animal}</span>
                    <span className="text-[10px] font-mono text-slate-500">#{item.classId}</span>
                    {isHuman ? (
                      <span className="px-1.5 py-0.2 rounded text-[9px] font-mono font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30">
                        SECURITY
                      </span>
                    ) : (
                      <span className="px-1.5 py-0.2 rounded text-[9px] font-mono font-bold bg-slate-850 text-slate-400">
                        {item.threat}
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] font-mono text-green-400 block mt-0.5">
                    Suggested Audio: Track {item.suggestedSoundId} ({item.audioFile})
                  </span>
                </div>
              </div>

              {/* URL Input Box & Method Selector */}
              <div className="flex-1 w-full flex items-center gap-2">
                {/* Method selector */}
                <select
                  value={currentMethod}
                  onChange={(e) => handleMethodChange(item.animal, e.target.value)}
                  className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-2 text-[11px] font-mono font-bold text-slate-300 focus:outline-none focus:border-green-500 shrink-0"
                >
                  <option value="POST">POST</option>
                  <option value="GET">GET</option>
                </select>

                {/* Input Box */}
                <div className="relative flex-1">
                  <input
                    type="url"
                    value={currentUrl}
                    onChange={(e) => handleUrlChange(item.animal, e.target.value)}
                    placeholder={`Enter URL for ${item.animal} (e.g. http://192.168.137.211/deter?track=${item.suggestedSoundId})`}
                    className="w-full bg-[#0b0f19] border border-slate-800 rounded-lg px-3 py-2 text-xs font-mono text-slate-100 placeholder-slate-600 focus:outline-none focus:border-green-500"
                  />
                </div>
              </div>

              {/* Action Controls */}
              <div className="flex items-center gap-2 shrink-0 w-full lg:w-auto justify-end">
                {status && (
                  <span className={`text-[10px] font-mono px-2 py-0.5 rounded border ${status.includes('Hit') || status.includes('Auto-Hit')
                      ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                      : status.includes('sending')
                        ? 'bg-amber-500/15 text-amber-300 border-amber-500/30 animate-pulse'
                        : 'bg-slate-800 text-slate-400 border-slate-700'
                    }`}>
                    {status}
                  </span>
                )}

                {/* Test Fire Button */}
                <button
                  onClick={() => testHitUrl(item)}
                  className="flex items-center gap-1 px-3 py-2 rounded-lg text-xs font-mono font-bold bg-green-500/15 text-green-300 border border-green-500/30 hover:bg-green-500 hover:text-slate-950 transition-all shadow-sm"
                  title={`Test hit URL for ${item.animal}`}
                >
                  <Send className="h-3 w-3" />
                  <span>Test URL</span>
                </button>

                {/* Listen to Deterrent Sound */}
                <button
                  onClick={() => playSoundPreview(item.suggestedSoundId)}
                  className={`p-2 rounded-lg border text-xs transition-colors ${playingTrackId === item.suggestedSoundId
                      ? 'bg-green-500 text-slate-950 border-green-400 font-bold'
                      : 'bg-slate-900 border-slate-800 text-slate-300 hover:text-green-400 hover:border-green-500/40'
                    }`}
                  title={`Play Audio Track ${item.suggestedSoundId}`}
                >
                  <Play className={`h-3.5 w-3.5 ${playingTrackId === item.suggestedSoundId ? 'fill-slate-950' : 'fill-current'}`} />
                </button>
              </div>

            </div>
          );
        })}
      </div>

      {/* 5. Footer Stats & Information */}
      <div className="flex flex-col sm:flex-row items-center justify-between text-xs font-mono text-slate-500 pt-2 gap-2">
        <span>Endpoints automatically hit upon AI YOLOv11 & Live Camera detection.</span>
        <div className="flex items-center gap-2">
          <span className="text-slate-400">Classes Configured:</span>
          <span className="text-green-400 font-bold">{ANIMAL_DETERRENT_MAPPINGS.length}/11</span>
        </div>
      </div>

    </div>
  );
}
