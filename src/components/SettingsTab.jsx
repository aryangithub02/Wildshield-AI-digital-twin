import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Settings, Save, RotateCcw, ShieldAlert, Cpu, 
  Wifi, Sliders, Bell, Radio, CheckCircle2, AlertTriangle, 
  Layers, Lock, Smartphone, Volume2, Lightbulb, Zap, Send
} from 'lucide-react';
import { getTranslation } from '../utils/translations';
import { SPECIES_TAXONOMY } from '../utils/speciesMapping';

export default function SettingsTab({ 
  simulationState, 
  currentScenario, 
  language 
}) {
  const t = (key) => getTranslation(language, key);

  // 1. Farm Settings State
  const [farmName, setFarmName] = useState('WildShield Agro Demo Farm');
  const [farmId, setFarmId] = useState('WS-FARM-001');
  const [farmLocation, setFarmLocation] = useState('Wardha, Maharashtra (Forest Buffer Zone)');
  const [farmSize, setFarmSize] = useState('12.5');
  const [cropType, setCropType] = useState('Cotton');
  const [nodeCount, setNodeCount] = useState(5);
  const [geofenceArmed, setGeofenceArmed] = useState(true);

  // 2. AI Detection Settings State
  const [aiModel, setAiModel] = useState('WildShield-YOLO-v1.2 (best.pt)');
  const [confThreshold, setConfThreshold] = useState(50);
  const [detectionMode, setDetectionMode] = useState('CONTINUOUS');
  const [nightVisionMode, setNightVisionMode] = useState(true);
  const [autoDeterrent, setAutoDeterrent] = useState(true);

  // 3. Species Response Matrix Settings State
  const [speciesResponses, setSpeciesResponses] = useState({
    "WS-WL-WB": "Siren + LED Floodlight + Predator Audio",
    "WS-WL-NG": "Directional Floodlight + Acoustic Alarm",
    "WS-WL-SD": "Soft Flash Light + Low Frequency Alarm",
    "WS-WL-RM": "Smart Sprinkler Pulse + Distress Call",
    "WS-WL-LG": "Overhead Sprinkler + Visual Strobe",
    "WS-WL-GR": "Non-Contact Strobe + Forest Dept Alert",
    "WS-DM-CT": "Water Sprinkler Pulse + Warning Buzzer",
    "WS-DM-GT": "Local Warning Beep",
    "WS-HM-HU": "Deterrents INHIBITED (Safety Protocol)"
  });

  // 4. Alert Settings State
  const [farmerPush, setFarmerPush] = useState(true);
  const [smsAlerts, setSmsAlerts] = useState(true);
  const [highRiskOnly, setHighRiskOnly] = useState(false);
  const [notificationSound, setNotificationSound] = useState('URGENT_SIREN');
  const [alertFrequency, setAlertFrequency] = useState('INSTANT');

  // 5. Device & Offline Settings State
  const [offlineEdgeAI, setOfflineEdgeAI] = useState(true);
  const [loraFrequency, setLoraFrequency] = useState('868 MHz (India ISM)');
  const [autoSyncOnReconnect, setAutoSyncOnReconnect] = useState(true);

  // Status feedback toast
  const [toastMessage, setToastMessage] = useState(null);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleSave = () => {
    showToast("✅ Configuration saved successfully and synced with Central AI Hub.");
  };

  const handleResetDefaults = () => {
    setConfThreshold(50);
    setCropType('Cotton');
    setGeofenceArmed(true);
    setAutoDeterrent(true);
    setFarmerPush(true);
    setSmsAlerts(true);
    showToast("🔄 Settings restored to default profile.");
  };

  const handleTestAlert = () => {
    showToast("📢 Test Alert Dispatched: Simulation Push sent to connected devices.");
  };

  return (
    <div className="space-y-6 select-none text-left">
      
      {/* Toast Notification */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-20 right-8 z-50 bg-slate-900 border border-green-500/50 text-green-400 text-xs font-mono font-bold px-4 py-2.5 rounded-xl shadow-2xl flex items-center gap-2 backdrop-blur-md"
          >
            <CheckCircle2 className="h-4 w-4 text-green-400" />
            <span>{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 1. Header Banner & Save / Reset Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[#0b0f19] border border-slate-900 rounded-xl p-5 shadow-lg">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-green-500/10 text-green-500 border border-green-500/20 flex items-center justify-center shadow-[0_0_20px_rgba(34,197,94,0.2)]">
            <Settings className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-base font-bold text-slate-100 font-sans uppercase tracking-wider flex items-center gap-2">
              System Configuration & Controls
              <span className="text-[9px] font-mono font-bold text-green-400 bg-green-500/10 px-2 py-0.5 rounded border border-green-500/30">
                ADMIN CONSOLE
              </span>
            </h1>
            <p className="text-xs text-slate-400 font-mono mt-0.5">
              Configure Farm Boundaries, Edge AI Thresholds, Deterrent Policies & Mesh Telemetry
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleResetDefaults}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-950 hover:bg-slate-900 border border-slate-800 rounded-lg text-xs font-semibold text-slate-400 hover:text-slate-200 transition-all font-sans"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            <span>Reset Defaults</span>
          </button>
          <button
            onClick={handleSave}
            className="flex items-center gap-1.5 px-4 py-1.5 bg-green-500 hover:bg-green-600 rounded-lg text-xs font-bold text-slate-950 transition-all shadow font-sans"
          >
            <Save className="h-3.5 w-3.5 fill-current" />
            <span>Save Changes</span>
          </button>
        </div>
      </div>

      {/* 2. Top Split: Farm Profile & AI Detection Configuration */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Section 1: Farm & Crop Settings */}
        <div className="bg-[#0b0f19] border border-slate-900 rounded-xl p-5 shadow-lg space-y-4">
          <div className="flex items-center justify-between border-b border-slate-900 pb-2">
            <div>
              <span className="text-xs font-bold text-slate-100 font-sans uppercase tracking-wider block">
                1. Farm & Geofence Settings
              </span>
              <p className="text-[10px] text-slate-500 font-mono">Perimeter parameters connected with Digital Twin</p>
            </div>
            <Layers className="h-4 w-4 text-green-500" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-[10px] font-mono">
            <div>
              <label className="text-slate-400 block mb-1">Farm Name</label>
              <input
                type="text"
                value={farmName}
                onChange={(e) => setFarmName(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-slate-100 font-sans focus:outline-none focus:border-green-500"
              />
            </div>
            <div>
              <label className="text-slate-400 block mb-1">Farm ID</label>
              <input
                type="text"
                value={farmId}
                disabled
                className="w-full bg-slate-950/50 border border-slate-900 rounded-lg px-3 py-1.5 text-slate-500 font-mono cursor-not-allowed"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="text-slate-400 block mb-1">Farm Location & Buffer</label>
              <input
                type="text"
                value={farmLocation}
                onChange={(e) => setFarmLocation(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-slate-100 font-sans focus:outline-none focus:border-green-500"
              />
            </div>
            <div>
              <label className="text-slate-400 block mb-1">Total Acreage (Acres)</label>
              <input
                type="text"
                value={farmSize}
                onChange={(e) => setFarmSize(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-slate-100 font-mono focus:outline-none focus:border-green-500"
              />
            </div>
            <div>
              <label className="text-slate-400 block mb-1">Active Crop Guard</label>
              <select
                value={cropType}
                onChange={(e) => setCropType(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-slate-100 font-sans focus:outline-none focus:border-green-500 cursor-pointer"
              >
                <option value="Cotton">Cotton (High Sensitivity - Sprinkler Guard)</option>
                <option value="Rice">Rice (Low Sensitivity - Water OK)</option>
                <option value="Sugarcane">Sugarcane (Medium Sensitivity)</option>
                <option value="Vegetables">Vegetables (High Sensitivity)</option>
              </select>
            </div>
          </div>

          {/* Boundary Arm Toggle */}
          <div className="bg-slate-950/60 border border-slate-900 rounded-xl p-3 flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-slate-100 font-sans block">Pentagon Geofence Arming</span>
              <p className="text-[10px] text-slate-500 font-mono mt-0.5">5 perimeter nodes active in continuous mesh boundary</p>
            </div>
            <button
              onClick={() => setGeofenceArmed(!geofenceArmed)}
              className={`px-3 py-1.5 rounded-lg text-[10px] font-mono font-bold transition-all ${
                geofenceArmed
                  ? 'bg-green-500 text-slate-950 font-extrabold'
                  : 'bg-red-500/10 border border-red-500/30 text-red-400'
              }`}
            >
              {geofenceArmed ? 'ARMED & ACTIVE' : 'DISARMED'}
            </button>
          </div>
        </div>

        {/* Section 2: AI Detection Model Settings */}
        <div className="bg-[#0b0f19] border border-slate-900 rounded-xl p-5 shadow-lg space-y-4">
          <div className="flex items-center justify-between border-b border-slate-900 pb-2">
            <div>
              <span className="text-xs font-bold text-slate-100 font-sans uppercase tracking-wider block">
                2. AI Model & Inference Thresholds
              </span>
              <p className="text-[10px] text-slate-500 font-mono">Edge Neural Engine & Confidence Bounds</p>
            </div>
            <Cpu className="h-4 w-4 text-blue-400" />
          </div>

          {/* Model Status Card */}
          <div className="bg-slate-950/80 border border-slate-900 rounded-xl p-3 flex items-center justify-between text-[10px] font-mono">
            <div>
              <span className="text-slate-400 block">Loaded Model Weights:</span>
              <span className="text-green-400 font-bold text-xs">{aiModel}</span>
            </div>
            <span className="px-2 py-0.5 rounded bg-green-500/10 border border-green-500/20 text-green-400 font-bold">
              FP32 TORCH
            </span>
          </div>

          {/* Confidence Slider */}
          <div className="space-y-2 text-[10px] font-mono">
            <div className="flex justify-between items-center">
              <span className="text-slate-300">Confidence Threshold:</span>
              <span className="text-green-400 font-bold text-xs bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                {confThreshold}% (Recommended: 50%)
              </span>
            </div>
            <input
              type="range"
              min="20"
              max="90"
              step="5"
              value={confThreshold}
              onChange={(e) => setConfThreshold(Number(e.target.value))}
              className="w-full accent-green-500 cursor-pointer"
            />
            <div className="flex justify-between text-[8px] text-slate-500">
              <span>20% (High Sensitivity)</span>
              <span>50% (Recommended)</span>
              <span>90% (Strict Confidence)</span>
            </div>
          </div>

          {/* Toggles: Detection Mode & Thermal Night IR */}
          <div className="grid grid-cols-2 gap-3 text-[10px] font-mono">
            <div className="bg-slate-950/60 border border-slate-900 rounded-lg p-2.5 space-y-1">
              <span className="text-slate-400 block font-bold">Detection Mode:</span>
              <select
                value={detectionMode}
                onChange={(e) => setDetectionMode(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded px-2 py-1 text-slate-200 text-xs font-sans"
              >
                <option value="CONTINUOUS">Continuous Video (28 FPS)</option>
                <option value="PIR_TRIGGER">PIR Motion Wake-Up</option>
                <option value="ECO_SAVER">Solar Battery Eco Saver</option>
              </select>
            </div>

            <div className="bg-slate-950/60 border border-slate-900 rounded-lg p-2.5 flex items-center justify-between">
              <div>
                <span className="text-slate-300 font-bold block text-xs font-sans">Night Vision IR</span>
                <span className="text-[8px] text-slate-500">Thermal auto-switch</span>
              </div>
              <button
                onClick={() => setNightVisionMode(!nightVisionMode)}
                className={`px-2 py-1 rounded text-[9px] font-bold ${
                  nightVisionMode ? 'bg-green-500 text-slate-950' : 'bg-slate-800 text-slate-400'
                }`}
              >
                {nightVisionMode ? 'ON' : 'OFF'}
              </button>
            </div>
          </div>
        </div>

      </div>

      {/* 3. Section: Animal Classification & Response Configuration Matrix */}
      <div className="bg-[#0b0f19] border border-slate-900 rounded-xl p-5 shadow-lg space-y-4">
        <div className="flex items-center justify-between border-b border-slate-900 pb-2">
          <div>
            <span className="text-xs font-bold text-slate-100 font-sans uppercase tracking-wider block">
              3. Species Classification & Deterrent Policy Configuration
            </span>
            <p className="text-[10px] text-slate-500 font-mono">Map preferred autonomous responses to verified animal species</p>
          </div>
          <Sliders className="h-4 w-4 text-green-500" />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-[10px] font-mono">
            <thead>
              <tr className="text-slate-500 border-b border-slate-900 h-8">
                <th>Taxonomy ID</th>
                <th>Species Name</th>
                <th>Default Threat</th>
                <th>Assigned Autonomous Deterrent Action</th>
                <th className="text-right">Policy Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-900/60">
              {[
                { id: "WS-WL-WB", animal: "Wild Boar", emoji: "🐗", threat: "High", threatClass: "text-red-400 bg-red-500/10 border-red-500/30" },
                { id: "WS-WL-NG", animal: "Nilgai", emoji: "🐂", threat: "High", threatClass: "text-red-400 bg-red-500/10 border-red-500/30" },
                { id: "WS-WL-SD", animal: "Spotted Deer", emoji: "🦌", threat: "Medium", threatClass: "text-amber-400 bg-amber-500/10 border-amber-500/30" },
                { id: "WS-WL-RM", animal: "Rhesus Macaque", emoji: "🐒", threat: "High", threatClass: "text-red-400 bg-red-500/10 border-red-500/30" },
                { id: "WS-WL-LG", animal: "Langur", emoji: "🐒", threat: "Med–High", threatClass: "text-amber-400 bg-amber-500/10 border-amber-500/30" },
                { id: "WS-WL-GR", animal: "Gaur", emoji: "🦬", threat: "Very High", threatClass: "text-red-500 bg-red-500/10 border-red-500/30" },
                { id: "WS-DM-CT", animal: "Cattle", emoji: "🐄", threat: "Medium", threatClass: "text-green-400 bg-green-500/10 border-green-500/30" },
                { id: "WS-DM-GT", animal: "Goat", emoji: "🐐", threat: "Low", threatClass: "text-green-400 bg-green-500/10 border-green-500/30" },
                { id: "WS-HM-HU", animal: "Human", emoji: "🚶", threat: "Safety Context", threatClass: "text-blue-400 bg-blue-500/10 border-blue-500/30" }
              ].map((sp) => (
                <tr key={sp.id} className="h-11 hover:bg-slate-900/30 transition-colors">
                  <td className="font-bold text-green-400">{sp.id}</td>
                  <td className="font-sans font-bold text-slate-100">
                    <span className="mr-1.5">{sp.emoji}</span>
                    {sp.animal}
                  </td>
                  <td>
                    <span className={`px-2 py-0.5 rounded text-[8px] font-bold border uppercase ${sp.threatClass}`}>
                      {sp.threat}
                    </span>
                  </td>
                  <td className="w-1/2 pr-4">
                    <input
                      type="text"
                      value={speciesResponses[sp.id] || ""}
                      onChange={(e) => setSpeciesResponses({ ...speciesResponses, [sp.id]: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1 text-slate-200 text-xs font-sans focus:outline-none focus:border-green-500"
                    />
                  </td>
                  <td className="text-right">
                    <span className="text-green-400 font-bold flex items-center justify-end gap-1 text-[9px]">
                      <CheckCircle2 className="h-3 w-3" />
                      Active
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 4. Section: Alert Notifications & Device Mesh Settings */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Alert & Dispatch Settings */}
        <div className="bg-[#0b0f19] border border-slate-900 rounded-xl p-5 shadow-lg space-y-4">
          <div className="flex items-center justify-between border-b border-slate-900 pb-2">
            <div>
              <span className="text-xs font-bold text-slate-100 font-sans uppercase tracking-wider block">
                4. Farmer Alert & Notification Channels
              </span>
              <p className="text-[10px] text-slate-500 font-mono">SMS, Push Notifications & Dispatch Frequency</p>
            </div>
            <Bell className="h-4 w-4 text-amber-400" />
          </div>

          <div className="space-y-2.5 text-[10px] font-mono">
            {[
              { label: "Farmer Mobile App Push Notifications", desc: "Real-time alerts with species photo & node location", state: farmerPush, setter: setFarmerPush },
              { label: "GSM / SMS Cellular Alert Dispatch", desc: "SMS text messages sent to farmer phone numbers", state: smsAlerts, setter: setSmsAlerts },
              { label: "High-Risk Threats Only", desc: "Inhibit notifications for domestic livestock", state: highRiskOnly, setter: setHighRiskOnly }
            ].map((tgl, i) => (
              <div key={i} className="bg-slate-950/60 border border-slate-900 rounded-lg p-2.5 flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-slate-200 font-sans block">{tgl.label}</span>
                  <span className="text-[8px] text-slate-500">{tgl.desc}</span>
                </div>
                <button
                  onClick={() => tgl.setter(!tgl.state)}
                  className={`px-2.5 py-1 rounded text-[9px] font-bold ${
                    tgl.state ? 'bg-green-500 text-slate-950 font-bold' : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  {tgl.state ? 'ENABLED' : 'DISABLED'}
                </button>
              </div>
            ))}
          </div>

          {/* Test Alert Dispatcher Button */}
          <div className="pt-2">
            <button
              onClick={handleTestAlert}
              className="w-full flex items-center justify-center gap-2 py-2 bg-slate-950 hover:bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-lg text-xs font-bold text-amber-400 font-sans transition-all shadow"
            >
              <Send className="h-3.5 w-3.5" />
              <span>Send Test Notification to Farmer Device</span>
            </button>
          </div>
        </div>

        {/* Device Mesh & Offline Edge Settings */}
        <div className="bg-[#0b0f19] border border-slate-900 rounded-xl p-5 shadow-lg space-y-4">
          <div className="flex items-center justify-between border-b border-slate-900 pb-2">
            <div>
              <span className="text-xs font-bold text-slate-100 font-sans uppercase tracking-wider block">
                5. Device Mesh & Offline Edge AI Settings
              </span>
              <p className="text-[10px] text-slate-500 font-mono">LoRa SX1278 RF parameters & offline survivability</p>
            </div>
            <Radio className="h-4 w-4 text-green-500" />
          </div>

          {/* Node Health Grid */}
          <div className="space-y-1 text-[9px] font-mono">
            <span className="text-slate-400 font-bold uppercase block text-[8px]">Connected Node Mesh:</span>
            <div className="grid grid-cols-5 gap-1.5 text-center">
              {[
                { name: "FN-01", status: "Online", bat: "94%" },
                { name: "FN-02", status: "Online", bat: "89%" },
                { name: "FN-03", status: "Online", bat: "92%" },
                { name: "FN-04", status: "Online", bat: "85%" },
                { name: "FN-05", status: "Online", bat: "96%" }
              ].map((n) => (
                <div key={n.name} className="bg-slate-950 border border-slate-900 rounded p-1.5">
                  <span className="text-slate-200 font-bold block">{n.name}</span>
                  <span className="text-green-400 text-[8px] block font-bold">{n.status}</span>
                  <span className="text-slate-500 text-[7px] block">{n.bat}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Offline Resilience Toggles */}
          <div className="space-y-2 text-[10px] font-mono pt-1">
            <div className="bg-slate-950/60 border border-slate-900 rounded-lg p-2.5 flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-slate-200 font-sans block">Edge Local Inference (Zero Internet)</span>
                <span className="text-[8px] text-slate-500">Nodes execute autonomous deterrence if RF link is lost</span>
              </div>
              <button
                onClick={() => setOfflineEdgeAI(!offlineEdgeAI)}
                className={`px-2.5 py-1 rounded text-[9px] font-bold ${
                  offlineEdgeAI ? 'bg-green-500 text-slate-950 font-bold' : 'bg-slate-800 text-slate-400'
                }`}
              >
                {offlineEdgeAI ? 'ACTIVE' : 'OFF'}
              </button>
            </div>

            <div className="bg-slate-950/60 border border-slate-900 rounded-lg p-2.5 flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-slate-200 font-sans block">LoRa RF Operating Band</span>
                <span className="text-[8px] text-slate-500">{loraFrequency} • SX1278 Mesh Gateway</span>
              </div>
              <span className="px-2 py-0.5 rounded bg-blue-500/10 border border-blue-500/20 text-blue-400 font-bold text-[8px]">
                LORA MESH
              </span>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
}
