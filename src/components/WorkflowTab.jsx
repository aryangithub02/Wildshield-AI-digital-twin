import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Activity, Play, Pause, RotateCcw, ArrowRight, CheckCircle2, 
  Cpu, Database, Eye, Info, Smartphone, Volume2, Shield, 
  Layers, ChevronRight, Zap, Image as ImageIcon, Maximize2, X
} from 'lucide-react';
import { getTranslation } from '../utils/translations';

// 10 core stages of the system workflow
const WORKFLOW_STAGES = [
  {
    id: 1,
    title: "Motion Detection",
    subtitle: "PIR Sensors Wakeup",
    icon: Activity,
    color: "from-blue-500 to-indigo-600",
    badge: "Ultralow Power Mode",
    details: "Deep sleep mode is active. Passive Infrared (PIR) sensors continuously monitor the geofence perimeter. Detecting movement triggers an interrupt signal that wakes up the ESP32 and edge processors in under 50ms.",
    technical: "Hardware: PIR AM312 sensor • Power Draw: 15µA (sleep) • Wakeup Latency: <50ms"
  },
  {
    id: 2,
    title: "Camera Capture",
    subtitle: "IR Snapshot Triggered",
    icon: Eye,
    color: "from-cyan-500 to-blue-600",
    badge: "1080p IR Night Vision",
    details: "High-resolution camera system activates immediately upon sensor wakeup. Built-in IR cut filters and infrared LED arrays engage to capture high-contrast images, even in pitch-black conditions.",
    technical: "Lens: OV5647 5MP Camera • IR LEDs: 850nm dual array • Trigger delay: 120ms"
  },
  {
    id: 3,
    title: "YOLO Detection",
    subtitle: "Edge AI Scanning",
    icon: ScanIcon,
    color: "from-teal-500 to-emerald-600",
    badge: "YOLOv8-nano Engine",
    details: "Edge intelligence processing. The captured frame is fed into an optimized YOLOv8 neural network model running locally. Bounding boxes are generated in real-time around moving objects.",
    technical: "Hardware: Jetson Nano / ESP32-S3 • Frame Rate: 18-24 FPS • Detection Limit: 35 meters"
  },
  {
    id: 4,
    title: "Species Identification",
    subtitle: "Classification Confirmed",
    icon: Cpu,
    color: "from-emerald-500 to-green-600",
    badge: "96.4% AI Accuracy",
    details: "Object classes are compared against wildlife signatures. System identifies target species (Elephant, Boar, Monkey, Deer, Nilgai, Cattle, Human) and filters out false positives (swaying branches, domestic birds).",
    technical: "Weights: Custom Int8 Quantized • Classes: 8 custom wildlife targets • Confidence threshold: 85%"
  },
  {
    id: 5,
    title: "Threat Analysis",
    subtitle: "Vulnerability Evaluated",
    icon: Shield,
    color: "from-yellow-500 to-amber-600",
    badge: "Real-time Severity Matrix",
    details: "Evaluates threat level (LOW, MEDIUM, HIGH) by combining species classification, estimated speed, trajectory direction, and herd count based on spatial cluster mapping.",
    technical: "Assessment logic: Multi-criteria vector calculations • Risk update rate: 100ms"
  },
  {
    id: 6,
    title: "Decision Engine",
    subtitle: "Rule Selection & Safety Guards",
    icon: Zap,
    color: "from-amber-500 to-orange-600",
    badge: "Crop-Aware Constraints",
    details: "Consults crop-aware rules (e.g. Cotton guard sprinkler override) and village proximity maps. Selects the safest, most effective localized deterrent while ensuring human-safe operations near border lines.",
    technical: "Decision Latency: <15ms • Rule Memory: Dynamic Flash Lookup • Overrides: Active"
  },
  {
    id: 7,
    title: "Species-Specific Deterrent",
    subtitle: "Repelling Actuators Active",
    icon: Volume2,
    color: "from-red-500 to-rose-600",
    badge: "Dynamic Auditory & Visual Drive",
    details: "Deploys non-lethal deterrents tailored to the species. Elephants trigger high-intensity directional floodlights (avoiding sirens); Boars trigger predator calls; Monkeys trigger conspecific distress sirens.",
    technical: "Sound Pressure: 120dB directional speaker • Flash Intensity: 2000LM LED strobe"
  },
  {
    id: 8,
    title: "Event Logging",
    subtitle: "Edge Memory Write",
    icon: Database,
    color: "from-purple-500 to-indigo-600",
    badge: "Persistent Storage Sync",
    details: "Saves detection metrics (species, confidence, timestamp, deterrent action) locally on edge device storage. Logs are queued for transmission to ensure data integrity during offline operations.",
    technical: "Format: SQLite database write • Storage: SanDisk Industrial 32GB MicroSD • Encryption: AES-128"
  },
  {
    id: 9,
    title: "Farmer Notification",
    subtitle: "LoRa / GSM Push Alert",
    icon: Smartphone,
    color: "from-indigo-500 to-pink-600",
    badge: "SMS & WhatsApp Dispatch",
    details: "Triggers immediate wireless alert transmission. Sends encrypted LoRa message to smart home hub or directly dispatches SMS/WhatsApp alerts with species classification data and target node coordinates.",
    technical: "Module: LoRa SX1278 Mesh / SIM800L • Frequency: 868/915 MHz • Mesh Hops: Max 3"
  },
  {
    id: 10,
    title: "Digital Twin Update",
    subtitle: "Real-time Telemetry Sync",
    icon: Layers,
    color: "from-pink-500 to-rose-500",
    badge: "WebSocket Dashboard Sync",
    details: "Synchronizes the cloud monitoring center and farmer dashboard. Updates the farm map simulation, overlays active threat beacons, adjusts analytical charts, and refreshes the event timeline.",
    technical: "Protocol: Secure WebSocket (WSS) • Latency: <80ms • Payload size: 256 bytes JSON"
  }
];

// Helper ScanIcon for YOLO
function ScanIcon(props) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M3 7V5a2 2 0 0 1 2-2h2" />
      <path d="M17 3h2a2 2 0 0 1 2 2v2" />
      <path d="M21 17v2a2 2 0 0 1-2 2h-2" />
      <path d="M3 17v2a2 2 0 0 0 2 2h2" />
      <path d="M7 12h10" />
      <path d="M12 7v10" />
    </svg>
  );
}

// Schematics data mapping copied image assets
const SCHEMATIC_GALLERY = [
  {
    id: "edge-node",
    title: "Edge IoT Node Hardware Layout",
    src: "/workflow/CPv71.jpg",
    desc: "Schematic detail mapping the ESP32 and LoRa SX1278 transceiver, featuring solar charging control loop, lithium-ion battery integration, and analog PIR sensor circuit headers."
  },
  {
    id: "logic-flow",
    title: "AI Prevention System Logic Flowchart",
    src: "/workflow/DkgEx.jpg",
    desc: "Detailed program design logic detailing the YOLO edge classification process, crop-aware constraint handlers, and threat index lookup loops that trigger specific repellent stages."
  },
  {
    id: "deployment-grid",
    title: "Field Deployment & Sentinel Network",
    src: "/workflow/ChatGPT Image Jul 15, 2026, 11_12_25 AM.png",
    desc: "Visual mock detailing crop zone boundaries and placing Node Sentinel devices, solar panels, and directional deterrent hardware clusters along forest perimeter fences."
  },
  {
    id: "geofence-levels",
    title: "Multi-layered Prevention Geofence",
    src: "/workflow/ChatGPT Image Jul 15, 2026, 11_14_15 AM.png",
    desc: "Pentagonal geofence mapping details: Alarm perimeter boundaries, critical buffer thresholds, active acoustic fields, and real-time mesh node network overlaps."
  },
  {
    id: "comm-mesh",
    title: "LoRa Mesh Communications Flow",
    src: "/workflow/ChatGPT Image Jul 15, 2026, 11_17_51 AM.png",
    desc: "Communication diagram outlining telemetry relay from Farmer Sentinel nodes via LoRa SX1278 multi-hop mesh network directly to the Smart Hub, Local WebServer, and Cloud DB."
  }
];

export default function WorkflowTab({ simulationState, currentScenario, language }) {
  const t = (key) => getTranslation(language, key);

  // States
  const [selectedStage, setSelectedStage] = useState(1);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [speed, setSpeed] = useState(1.5); // 0.8, 1.5, 2.5
  const [lightboxImage, setLightboxImage] = useState(null);

  const timerRef = useRef(null);

  // Auto-progression logic for motion graphic simulation
  useEffect(() => {
    if (isPlaying) {
      const intervalDuration = (2200 / speed);
      timerRef.current = setInterval(() => {
        setCurrentStep(prev => {
          const next = prev === 10 ? 1 : prev + 1;
          setSelectedStage(next); // Sync descriptive stage card
          return next;
        });
      }, intervalDuration);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isPlaying, speed]);

  const handlePlayPause = () => {
    setIsPlaying(!isPlaying);
  };

  const handleStep = () => {
    setIsPlaying(false);
    setCurrentStep(prev => {
      const next = prev === 10 ? 1 : prev + 1;
      setSelectedStage(next);
      return next;
    });
  };

  const handleReset = () => {
    setIsPlaying(false);
    setCurrentStep(1);
    setSelectedStage(1);
  };

  // Get active step info
  const activeStepInfo = WORKFLOW_STAGES[currentStep - 1];

  // Helper log details for simulated output terminal
  const getTerminalLog = (step) => {
    switch (step) {
      case 1: return "[PIR-Interrupt] Motion event detected at Node FN-1 perimeter. Sleeping ESP32 woke up. Triggers system-wide wake.";
      case 2: return "[Cam-Sys] Gated IR Array active. Captured 1920x1080 frame. Output saved to frame buffer. Signal quality: 98%.";
      case 3: return "[AI-Model] Running YOLOv8-nano inference... Processing tensor maps. Found object bounding box at coordinates: [X:145, Y:89].";
      case 4: return "[AI-Classify] Object classified as 'Elephant' (confidence: 96.2%). Filtered out noise. Triggering high-priority threat alert.";
      case 5: return "[Risk-Assess] Evaluating Threat Index: CRITICAL (96/100). Target trajectory: direct farm entry. Speed: 1.2m/s.";
      case 6: return "[Engine-Decision] Decision path calculated. Constraints check: Cotton Crop active -> Sprinkler bypass ON. Siren bypass ON (Village safe). Directional speaker select.";
      case 7: return "[Actuator-Drive] Executing response: Directional LED Floodlight 01 pulse. Ultrasonic Speaker: active predator low-frequency rumble.";
      case 8: return "[Log-Storage] Saved event metric locally: Elephant | Critical | Node 1 | 96.2% Conf | Strobe & Rumble deploy. File system synced.";
      case 9: return "[Comm-LoRa] Dispatching SX1278 message. Multi-hop mesh relay active. SMS alert triggered to Farmer: 'Elephant threat at North Geofence!'";
      case 10: return "[Twin-WebSocket] Transmitting event payload to client dashboard. Telemetry cards synced. Digital Twin UI updated to STATE_RESOLVED.";
      default: return "[Idle] System waiting for interrupt triggers...";
    }
  };

  return (
    <div className="space-y-6 text-left select-none pb-12">
      
      {/* HEADER BAR */}
      <div className="bg-[#0b0f19] border border-slate-900 rounded-xl p-4 flex flex-col md:flex-row items-center justify-between gap-4 shadow-md animate-fade-in">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-lg bg-green-500/10 border border-green-500/20 text-green-500 flex items-center justify-center">
            <Activity className="h-5 w-5 animate-pulse" />
          </div>
          <div>
            <h2 className="text-sm font-extrabold text-slate-100 font-sans tracking-wide uppercase leading-none">
              System Detection & Prevention Workflow
            </h2>
            <p className="text-[10px] text-slate-500 font-mono mt-1">Autonomous edge-AI event propagation pipeline telemetry</p>
          </div>
        </div>
        <div className="flex items-center gap-4 text-[10px] font-mono">
          <div className="flex items-center gap-1.5">
            <span className="text-slate-500">PIPELINE:</span>
            <span className="text-green-500 font-bold">10 States Active</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-slate-500">MAPPED SCHEMATICS:</span>
            <span className="text-blue-500 font-bold">5 Available</span>
          </div>
        </div>
      </div>

      {/* SECTION 1: MOTION GRAPHIC WORKFLOW SIMULATOR */}
      <div className="bg-[#0b0f19] border border-slate-900 rounded-xl p-6 shadow-xl relative overflow-hidden">
        
        {/* Background glow overlay */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-green-500/5 blur-[120px] rounded-full pointer-events-none" />

        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-900 pb-4 mb-6 relative z-10">
          <div>
            <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider font-sans">
              Edge Pipeline Motion Graphic
            </h3>
            <p className="text-[10px] text-slate-500 font-mono mt-0.5">Watch real-time signal propagation through edge nodes</p>
          </div>

          {/* SIMULATION CONTROLS */}
          <div className="flex items-center gap-2">
            <button
              onClick={handlePlayPause}
              className={`p-2 rounded-lg border text-[10px] font-semibold flex items-center gap-1.5 transition-all duration-200 ${
                isPlaying 
                  ? 'bg-amber-500/10 border-amber-500/20 text-amber-400 hover:bg-amber-500/20' 
                  : 'bg-green-500/10 border-green-500/20 text-green-400 hover:bg-green-500/20'
              }`}
            >
              {isPlaying ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
              <span>{isPlaying ? "Pause Simulation" : "Play Simulation"}</span>
            </button>

            <button
              onClick={handleStep}
              className="p-2 rounded-lg border border-slate-800 bg-slate-950 text-slate-400 hover:text-slate-200 hover:bg-slate-900 transition-all duration-200"
              title="Step Forward"
            >
              <ArrowRight className="h-3.5 w-3.5" />
            </button>

            <button
              onClick={handleReset}
              className="p-2 rounded-lg border border-slate-800 bg-slate-950 text-slate-400 hover:text-slate-200 hover:bg-slate-900 transition-all duration-200"
              title="Reset"
            >
              <RotateCcw className="h-3.5 w-3.5" />
            </button>

            {/* SPEED CONTROLS */}
            <div className="flex items-center bg-slate-950 border border-slate-800 rounded-lg p-0.5 text-[9px] font-mono font-bold">
              {[0.8, 1.5, 2.5].map((s) => (
                <button
                  key={s}
                  onClick={() => setSpeed(s)}
                  className={`px-2 py-1 rounded transition-all duration-200 ${
                    speed === s 
                      ? 'bg-green-500/10 text-green-400 border border-green-500/20 font-bold' 
                      : 'text-slate-500 hover:text-slate-300'
                  }`}
                >
                  {s === 0.8 ? 'Slow' : s === 1.5 ? 'Normal' : 'Fast'}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* MOTION GRAPHIC VISUAL CONTAINER */}
        <div className="w-full bg-slate-950/40 border border-slate-900/60 rounded-2xl p-6 md:p-8 min-h-[300px] flex flex-col justify-between relative z-10">
          
          {/* Signal connection path lines */}
          <div className="relative w-full flex items-center justify-between gap-2 py-4">
            
            {/* Visual connecting line behind the nodes */}
            <div className="absolute left-[3%] right-[3%] top-1/2 -translate-y-1/2 h-[2px] bg-slate-900" />
            
            {/* Dynamic glowing active path progress line */}
            <motion.div 
              className="absolute left-[3%] top-1/2 -translate-y-1/2 h-[2px] bg-gradient-to-r from-blue-500 via-green-500 to-rose-500 shadow-[0_0_12px_rgba(34,197,94,0.4)]"
              animate={{ width: `${(currentStep - 1) * 11.1}%` }}
              transition={{ duration: 0.4 }}
            />

            {/* RENDER THE 10 PIPELINE NODES */}
            {WORKFLOW_STAGES.map((stage) => {
              const Icon = stage.icon;
              const isPassed = stage.id < currentStep;
              const isActive = stage.id === currentStep;
              
              return (
                <div 
                  key={stage.id} 
                  className="flex flex-col items-center relative z-20 cursor-pointer"
                  onClick={() => {
                    setCurrentStep(stage.id);
                    setSelectedStage(stage.id);
                    setIsPlaying(false);
                  }}
                >
                  {/* Glowing active animation indicator */}
                  {isActive && (
                    <span className="absolute -inset-2.5 rounded-full bg-green-500/10 border border-green-500/20 animate-ping opacity-60 pointer-events-none" />
                  )}

                  <div className={`h-10 w-10 md:h-12 md:w-12 rounded-xl flex items-center justify-center border transition-all duration-350 ${
                    isActive 
                      ? 'bg-green-500/10 border-green-500 text-green-400 shadow-[0_0_15px_rgba(34,197,94,0.35)] scale-110'
                      : isPassed
                      ? 'bg-slate-950 border-green-500/40 text-green-500/80 scale-100'
                      : 'bg-slate-950 border-slate-900 text-slate-600 hover:text-slate-400 hover:border-slate-800'
                  }`}>
                    <Icon className="h-4.5 w-4.5 md:h-5.5 md:w-5.5" />
                  </div>

                  <span className="text-[8px] font-mono font-bold mt-2 text-slate-500">
                    S-{stage.id}
                  </span>

                  <span className={`text-[9px] font-sans font-semibold mt-1.5 hidden md:block max-w-[64px] text-center leading-none transition-all duration-200 ${
                    isActive ? 'text-green-400 font-bold scale-105' : isPassed ? 'text-slate-300' : 'text-slate-600'
                  }`}>
                    {stage.title.split(' ')[0]}
                  </span>
                </div>
              );
            })}
          </div>

          {/* DYNAMIC MOTION GRAPHIC SUB-ANIMATION CANVAS */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 border-t border-slate-900/60 pt-6 mt-6">
            
            {/* Left: Active graphic/animation visual block */}
            <div className="lg:col-span-1 bg-[#040812] border border-slate-900/80 rounded-xl p-4 flex items-center justify-center min-h-[160px] relative overflow-hidden shadow-inner">
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentStep}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.3 }}
                  className="w-full h-full flex flex-col items-center justify-center text-center space-y-3"
                >
                  {/* Render step specific micro graphics */}
                  {currentStep === 1 && (
                    <div className="relative">
                      <div className="h-16 w-16 rounded-full border border-blue-500/20 flex items-center justify-center">
                        <Activity className="h-8 w-8 text-blue-500 animate-pulse" />
                      </div>
                      <div className="absolute -inset-1 rounded-full border border-dashed border-blue-500/35 animate-spin duration-[8s]" />
                    </div>
                  )}

                  {currentStep === 2 && (
                    <div className="relative">
                      <div className="h-16 w-16 rounded-full bg-cyan-950/40 border border-cyan-500/20 flex items-center justify-center overflow-hidden">
                        <Eye className="h-8 w-8 text-cyan-400" />
                        <motion.div 
                          className="absolute inset-0 bg-white"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: [0, 0.8, 0] }}
                          transition={{ duration: 0.4, repeat: Infinity, repeatDelay: 1.5 }}
                        />
                      </div>
                    </div>
                  )}

                  {currentStep === 3 && (
                    <div className="relative h-18 w-28 bg-slate-950 border border-slate-800 rounded-lg flex items-center justify-center overflow-hidden">
                      <ScanIcon className="h-10 w-10 text-teal-500/40" />
                      <div className="absolute inset-x-2 border border-green-500/30 text-[7px] text-green-400 font-mono px-1 py-0.5 rounded leading-none text-left">
                        bounding_box [96.2%]
                      </div>
                      {/* Laser scan line overlay */}
                      <motion.div 
                        className="absolute inset-x-0 h-0.5 bg-green-500 shadow-[0_0_8px_#22c55e]"
                        animate={{ top: ['0%', '100%', '0%'] }}
                        transition={{ duration: 2.2, repeat: Infinity, ease: "linear" }}
                      />
                    </div>
                  )}

                  {currentStep === 4 && (
                    <div className="space-y-2 w-full px-4">
                      <div className="flex justify-between text-[10px] font-mono">
                        <span className="text-slate-400">Species Class:</span>
                        <span className="text-green-400 font-bold">🐘 Elephant</span>
                      </div>
                      <div className="h-2 w-full bg-slate-900 border border-slate-800 rounded-full overflow-hidden">
                        <motion.div 
                          className="h-full bg-green-500"
                          initial={{ width: 0 }}
                          animate={{ width: "96.2%" }}
                          transition={{ duration: 0.8 }}
                        />
                      </div>
                      <div className="text-[8px] font-mono text-slate-500 text-right">Inference: 16ms</div>
                    </div>
                  )}

                  {currentStep === 5 && (
                    <div className="space-y-2">
                      <div className="h-14 w-14 rounded-full border border-red-500/20 flex items-center justify-center relative">
                        <Shield className="h-6 w-6 text-red-500" />
                        <span className="absolute text-[8px] font-mono text-red-500 font-bold bg-[#040812] px-1 rounded -bottom-2 border border-red-500/20">HIGH</span>
                      </div>
                      <div className="text-[8px] font-mono text-slate-400 mt-2">Vector Risk Class: 0.96</div>
                    </div>
                  )}

                  {currentStep === 6 && (
                    <div className="grid grid-cols-2 gap-1 text-[8.5px] font-mono text-left w-full px-4">
                      <div className="bg-[#0b0f19] border border-slate-900 p-1.5 rounded flex justify-between">
                        <span className="text-slate-500">CROP:</span>
                        <span className="text-blue-400 font-bold">Cotton</span>
                      </div>
                      <div className="bg-[#0b0f19] border border-slate-900 p-1.5 rounded flex justify-between">
                        <span className="text-slate-500">SPRINKLER:</span>
                        <span className="text-red-400 font-bold">Bypassed</span>
                      </div>
                      <div className="bg-[#0b0f19] border border-slate-900 p-1.5 rounded flex justify-between">
                        <span className="text-slate-500">SIREN:</span>
                        <span className="text-red-400 font-bold">Off (Muffled)</span>
                      </div>
                      <div className="bg-[#0b0f19] border border-slate-900 p-1.5 rounded flex justify-between">
                        <span className="text-slate-500">LIGHTS:</span>
                        <span className="text-green-400 font-bold">Active</span>
                      </div>
                    </div>
                  )}

                  {currentStep === 7 && (
                    <div className="flex items-center gap-4">
                      <div className="relative">
                        <Volume2 className="h-7 w-7 text-rose-500" />
                        <motion.div 
                          className="absolute -right-2 top-0 h-7 w-7 border-r-2 border-dashed border-rose-500/30 rounded-full"
                          animate={{ scale: [1, 1.4, 1], opacity: [1, 0, 1] }}
                          transition={{ duration: 1.2, repeat: Infinity }}
                        />
                      </div>
                      <div className="relative">
                        <Zap className="h-7 w-7 text-amber-500 animate-bounce" />
                      </div>
                    </div>
                  )}

                  {currentStep === 8 && (
                    <div className="space-y-1 w-full px-4 text-left">
                      <div className="text-[8px] font-mono text-slate-500 flex items-center justify-between border-b border-slate-900/60 pb-1">
                        <span>DB TRANSACTION:</span>
                        <span className="text-green-500 font-bold">SUCCESS</span>
                      </div>
                      <div className="text-[7.5px] font-mono text-slate-400 font-medium">
                        <div>HASH: a93b8e72c8ef601...</div>
                        <div>PATH: /mnt/sdcard/db.sqlite</div>
                      </div>
                    </div>
                  )}

                  {currentStep === 9 && (
                    <div className="relative h-20 w-12 bg-slate-950 border border-slate-800 rounded-lg flex items-center justify-center p-1 overflow-hidden">
                      <div className="absolute top-0.5 inset-x-1 h-1 bg-slate-900 rounded-full" />
                      {/* Simulated SMS banner popup */}
                      <motion.div 
                        className="bg-green-500 text-[6px] text-slate-950 font-bold p-1 rounded w-full border border-green-400/20 shadow-md"
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ duration: 0.5 }}
                      >
                        ⚠️ Threat Detected! Elephant Node FN-1.
                      </motion.div>
                    </div>
                  )}

                  {currentStep === 10 && (
                    <div className="relative">
                      <Layers className="h-8 w-8 text-pink-500 animate-pulse" />
                      <div className="absolute -inset-2 border border-pink-500/20 rounded-lg animate-ping duration-[3s]" />
                    </div>
                  )}

                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{activeStepInfo.subtitle}</span>
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Middle: Terminal Console Log */}
            <div className="lg:col-span-2 bg-[#040812] border border-slate-900/80 rounded-xl p-4 flex flex-col justify-between shadow-inner h-[160px]">
              <div>
                <div className="flex items-center justify-between border-b border-slate-900/60 pb-1.5 mb-2">
                  <span className="text-[8.5px] font-mono font-bold text-slate-500">EDGE SHELL DIAGNOSTICS LOGS</span>
                  <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                </div>
                <div className="font-mono text-[9px] leading-relaxed text-slate-400 overflow-y-auto max-h-[90px] text-left" style={{ scrollbarWidth: 'thin' }}>
                  <div className="text-slate-500"># systemctl status wildshield-detector.service</div>
                  <div className="text-slate-500">● wildshield-detector.service - WildShield Core Detector Daemon</div>
                  <div className="text-slate-100 flex items-start gap-1">
                    <span className="text-green-500 shrink-0 font-bold">➔</span>
                    <span className="font-medium">{getTerminalLog(currentStep)}</span>
                  </div>
                </div>
              </div>

              <div className="text-[8px] font-mono text-slate-500 flex justify-between border-t border-slate-900/40 pt-1.5 mt-2">
                <span>SYSTEM STATE: {simulationState} • Telemetry OK</span>
                <span>BAUD RATE: 115200 bps</span>
              </div>
            </div>

          </div>

        </div>

      </div>

      {/* SECTION 2: 10-STAGE DETAILED PIPELINE SPECIFICATIONS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
        
        {/* Left list: Tabbed stages navigation */}
        <div className="lg:col-span-1 bg-[#0b0f19] border border-slate-900 rounded-xl p-4 flex flex-col justify-between shadow-md">
          <div>
            <div className="text-[10px] font-bold font-sans text-slate-400 uppercase tracking-wider border-b border-slate-900 pb-2 mb-3">
              Workflow Stepper Pipeline
            </div>
            
            <div className="space-y-1 overflow-y-auto max-h-[360px] pr-1" style={{ scrollbarWidth: 'thin' }}>
              {WORKFLOW_STAGES.map((stage) => {
                const Icon = stage.icon;
                const isSelected = selectedStage === stage.id;
                
                return (
                  <button
                    key={stage.id}
                    onClick={() => {
                      setSelectedStage(stage.id);
                      setCurrentStep(stage.id);
                      setIsPlaying(false);
                    }}
                    className={`w-full flex items-center justify-between p-2 rounded-lg text-xs font-semibold transition-all border text-left ${
                      isSelected
                        ? 'bg-green-500/10 border-green-500/30 text-green-400 font-bold'
                        : 'bg-slate-950 border-slate-900/40 text-slate-400 hover:text-slate-200 hover:bg-slate-900/40'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className={`h-5 w-5 rounded flex items-center justify-center text-[9px] font-mono font-bold ${
                        isSelected ? 'bg-green-500/20 text-green-400' : 'bg-slate-900 text-slate-500'
                      }`}>
                        {stage.id}
                      </span>
                      <Icon className="h-4 w-4 shrink-0" />
                      <span className="truncate max-w-[120px]">{stage.title}</span>
                    </div>
                    <ChevronRight className="h-3.5 w-3.5 opacity-60" />
                  </button>
                );
              })}
            </div>
          </div>

          <div className="bg-slate-950/60 border border-slate-900 rounded-lg p-2.5 text-[8.5px] font-mono text-slate-500 leading-normal mt-3">
            <span className="text-green-500 font-bold block mb-0.5">✓ Edge Computing Architecture</span>
            Each stage executes locally inside weather-sealed Sentinel units, enabling 100% autonomous operation during power grid outages.
          </div>
        </div>

        {/* Right Detail Card: Technical Breakdown */}
        <div className="lg:col-span-2 bg-[#0b0f19] border border-slate-900 rounded-xl p-5 shadow-md flex flex-col justify-between">
          <AnimatePresence mode="wait">
            <motion.div
              key={selectedStage}
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.25 }}
              className="space-y-4 text-left flex-1 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between border-b border-slate-900 pb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">⚙️</span>
                    <div>
                      <h4 className="text-xs font-black text-slate-200 font-mono uppercase tracking-wider">
                        Stage {selectedStage}: {WORKFLOW_STAGES[selectedStage - 1].title}
                      </h4>
                      <p className="text-[9px] text-slate-500 font-mono mt-0.5">{WORKFLOW_STAGES[selectedStage - 1].subtitle}</p>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 rounded-full bg-slate-950 border border-slate-900 text-[8px] font-mono font-bold text-slate-400">
                    {WORKFLOW_STAGES[selectedStage - 1].badge}
                  </span>
                </div>

                <div className="py-4 space-y-3">
                  <p className="text-[10px] text-slate-400 font-sans leading-relaxed">
                    {WORKFLOW_STAGES[selectedStage - 1].details}
                  </p>
                </div>
              </div>

              {/* Technical Specifications Specs Grid */}
              <div className="bg-slate-950 border border-slate-900 rounded-xl p-4 space-y-2">
                <div className="text-[9px] font-mono font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Info className="h-3.5 w-3.5 text-blue-500" />
                  <span>Technical Specifications & Edge Drivers</span>
                </div>
                <p className="text-[9.5px] font-mono text-slate-300">
                  {WORKFLOW_STAGES[selectedStage - 1].technical}
                </p>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

      </div>

      {/* SECTION 3: SYSTEM SCHEMATIC GALLERY & REFERENCE DIAGRAMS */}
      <div className="bg-[#0b0f19] border border-slate-900 rounded-xl p-5 shadow-lg animate-fade-in">
        <div className="flex items-center gap-2.5 border-b border-slate-900 pb-3 mb-4">
          <div className="h-7.5 w-7.5 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-500 flex items-center justify-center">
            <ImageIcon className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider font-sans leading-none">
              System Schematic Gallery & Design Documentation
            </h3>
            <p className="text-[9px] text-slate-500 font-mono mt-0.5">Reference flowcharts, wiring circuit diagrams, and field mapping layouts</p>
          </div>
        </div>

        {/* Gallery Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {SCHEMATIC_GALLERY.map((diag) => (
            <div 
              key={diag.id}
              className="bg-slate-950 border border-slate-900 rounded-xl p-3 flex flex-col justify-between hover:border-slate-800 transition-all duration-300 shadow group cursor-pointer"
              onClick={() => setLightboxImage(diag)}
            >
              <div className="space-y-3">
                {/* Thumbnail Image */}
                <div className="h-28 w-full rounded-lg bg-slate-900 border border-slate-900 overflow-hidden relative flex items-center justify-center">
                  <img 
                    src={diag.src} 
                    alt={diag.title}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-slate-950/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <Maximize2 className="h-5 w-5 text-slate-200" />
                  </div>
                </div>

                <div className="text-left">
                  <h4 className="text-[10px] font-bold text-slate-200 leading-snug group-hover:text-green-400 transition-colors">
                    {diag.title}
                  </h4>
                  <p className="text-[8.5px] text-slate-500 font-sans leading-relaxed mt-1 line-clamp-3">
                    {diag.desc}
                  </p>
                </div>
              </div>

              <div className="border-t border-slate-900/60 pt-2 mt-3 flex items-center justify-between text-[8px] font-mono text-slate-500">
                <span>FORMAT: {diag.src.split('.').pop().toUpperCase()}</span>
                <span className="text-green-500 font-bold group-hover:underline">Inspect ↗</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* LIGHTBOX MODAL */}
      <AnimatePresence>
        {lightboxImage && (
          <div className="fixed inset-0 bg-slate-950/95 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-[#0b0f19] border border-slate-900 rounded-2xl w-full max-w-4xl overflow-hidden shadow-2xl relative"
            >
              {/* Close Button */}
              <button 
                onClick={() => setLightboxImage(null)}
                className="absolute top-4 right-4 p-2 rounded-full bg-slate-950 border border-slate-900 text-slate-400 hover:text-slate-200 hover:bg-slate-900 z-10 transition-all"
              >
                <X className="h-4 w-4" />
              </button>

              <div className="grid grid-cols-1 lg:grid-cols-3">
                {/* Image container */}
                <div className="lg:col-span-2 bg-slate-950 p-6 flex items-center justify-center border-r border-slate-900 max-h-[500px] overflow-hidden">
                  <img 
                    src={lightboxImage.src} 
                    alt={lightboxImage.title}
                    className="max-w-full max-h-[440px] object-contain rounded-lg border border-slate-900 shadow-xl"
                  />
                </div>

                {/* Technical Description panel */}
                <div className="lg:col-span-1 p-6 flex flex-col justify-between text-left">
                  <div className="space-y-4">
                    <span className="text-[8px] font-mono font-black text-green-500 bg-green-500/10 border border-green-500/20 px-2.5 py-1 rounded-full uppercase tracking-wider">
                      Reference Schematic
                    </span>
                    <h3 className="text-sm font-extrabold text-slate-100 font-sans tracking-wide">
                      {lightboxImage.title}
                    </h3>
                    <p className="text-[10px] text-slate-400 leading-relaxed font-sans">
                      {lightboxImage.desc}
                    </p>
                  </div>

                  <div className="border-t border-slate-900/80 pt-4 mt-6 space-y-2">
                    <div className="flex justify-between text-[9px] font-mono text-slate-500">
                      <span>FILE SYSTEM PATH:</span>
                      <span className="text-slate-300">/public{lightboxImage.src}</span>
                    </div>
                    <div className="flex justify-between text-[9px] font-mono text-slate-500">
                      <span>STATUS:</span>
                      <span className="text-green-500 font-bold">DOCUMENTATION VERIFIED</span>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
