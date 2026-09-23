import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Cpu, Zap, Activity, AlertTriangle, CheckCircle2, RotateCcw,
  Volume2, VolumeX, Eye, Terminal, Layers, Radio, ShieldAlert,
  Thermometer, Flame, Bell, Sparkles, Download, Play, Square,
  Info, ArrowRight, CornerDownRight, Power, ExternalLink, HelpCircle
} from 'lucide-react';
import { getTranslation } from '../utils/translations';

// Web Audio API Synthesizer for hardware buzzer & relay sound simulation
class HardwareAudioSynth {
  constructor() {
    this.ctx = null;
    this.sirenOsc = null;
    this.sirenGain = null;
    this.sirenInterval = null;
  }

  init() {
    if (!this.ctx) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (AudioContext) {
        this.ctx = new AudioContext();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  playRelayClick() {
    try {
      this.init();
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(140, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(40, this.ctx.currentTime + 0.04);
      gain.gain.setValueAtTime(0.3, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.04);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.04);
    } catch (e) {
      console.warn("Audio synth:", e);
    }
  }

  playBeep(freq = 800, duration = 0.08) {
    try {
      this.init();
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
      gain.gain.setValueAtTime(0.15, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + duration);
    } catch (e) {
      console.warn("Audio synth:", e);
    }
  }

  startSiren() {
    try {
      this.init();
      if (!this.ctx || this.sirenOsc) return;
      this.sirenOsc = this.ctx.createOscillator();
      this.sirenGain = this.ctx.createGain();
      this.sirenOsc.type = 'sawtooth';
      
      this.sirenGain.gain.setValueAtTime(0.08, this.ctx.currentTime);
      this.sirenOsc.connect(this.sirenGain);
      this.sirenGain.connect(this.ctx.destination);
      
      let up = true;
      this.sirenOsc.frequency.setValueAtTime(700, this.ctx.currentTime);
      this.sirenOsc.start();

      this.sirenInterval = setInterval(() => {
        if (!this.sirenOsc || !this.ctx) return;
        const now = this.ctx.currentTime;
        if (up) {
          this.sirenOsc.frequency.linearRampToValueAtTime(1400, now + 0.35);
        } else {
          this.sirenOsc.frequency.linearRampToValueAtTime(700, now + 0.35);
        }
        up = !up;
      }, 360);
    } catch (e) {
      console.warn("Siren synth:", e);
    }
  }

  stopSiren() {
    try {
      if (this.sirenInterval) {
        clearInterval(this.sirenInterval);
        this.sirenInterval = null;
      }
      if (this.sirenGain && this.ctx) {
        this.sirenGain.gain.setValueAtTime(0.001, this.ctx.currentTime);
      }
      if (this.sirenOsc) {
        this.sirenOsc.stop();
        this.sirenOsc.disconnect();
        this.sirenOsc = null;
      }
    } catch (e) {
      console.warn("Stop siren synth:", e);
    }
  }
}

const audioSynth = new HardwareAudioSynth();

// Pre-configured simulation species presets
const SPECIES_PRESETS = [
  {
    id: 'wild_boar',
    name: 'Wild Boar',
    scientific: 'Sus scrofa',
    emoji: '🐗',
    temp: 31.2,
    confidence: 96.4,
    threat: 'HIGH',
    description: 'High-risk crop destroyer detected entering zone perimeter',
    actuators: { siren: true, floodlight: true, sprinkler: true, redLed: true, blueLed: true }
  },
  {
    id: 'elephant',
    name: 'Asian Elephant',
    scientific: 'Elephas maximus',
    emoji: '🐘',
    temp: 34.8,
    confidence: 98.7,
    threat: 'CRITICAL',
    description: 'Critical safety risk - deep seismic & infrasonic deterrent triggered',
    actuators: { siren: true, floodlight: true, sprinkler: false, redLed: true, blueLed: true }
  },
  {
    id: 'leopard',
    name: 'Indian Leopard',
    scientific: 'Panthera pardus fusca',
    emoji: '🐆',
    temp: 32.5,
    confidence: 94.8,
    threat: 'HIGH',
    description: 'Apex predator near perimeter - high-intensity strobes active',
    actuators: { siren: true, floodlight: true, sprinkler: false, redLed: true, blueLed: true }
  },
  {
    id: 'nilgai',
    name: 'Nilgai (Blue Bull)',
    scientific: 'Boselaphus tragocamelus',
    emoji: '🐂',
    temp: 30.8,
    confidence: 95.1,
    threat: 'HIGH',
    description: 'Large herbivore herd approach - acoustic horn and mist active',
    actuators: { siren: true, floodlight: true, sprinkler: true, redLed: true, blueLed: true }
  },
  {
    id: 'cattle',
    name: 'Stray Cattle',
    scientific: 'Bos taurus',
    emoji: '🐄',
    temp: 28.5,
    confidence: 97.2,
    threat: 'LOW',
    description: 'Domestic livestock breach - non-aggressive water spray deterrent',
    actuators: { siren: false, floodlight: false, sprinkler: true, redLed: false, blueLed: true }
  }
];

export default function HardwareSimulationTab({ language = 'en' }) {
  const t = (key) => getTranslation(language, key);

  // Simulation mode: 'NORMAL' | 'MOTION' | 'HIGH_RISK'
  const [simulationMode, setSimulationMode] = useState('NORMAL');
  
  // Step in the 6-stage high-risk sequence (0 = Idle, 1 = PIR, 2 = Wire Signal, 3 = Arduino Processing, 4 = Wildlife Ingest, 5 = Threat Escalate, 6 = Hardware Output Actuated)
  const [stepStage, setStepStage] = useState(0);

  // Active Species Preset
  const [selectedSpecies, setSelectedSpecies] = useState(SPECIES_PRESETS[0]);

  // Electrical & Sensor State
  const [pirStatus, setPirStatus] = useState('READY'); // 'READY' | 'MOTION DETECTED'
  const [temperature, setTemperature] = useState(24.6);
  const [arduinoStatus, setArduinoStatus] = useState('ONLINE'); // 'ONLINE' | 'PROCESSING' | 'COMMAND OUT'
  const [threatLevel, setThreatLevel] = useState('NORMAL'); // 'NORMAL' | 'WARNING' | 'HIGH' | 'CRITICAL'
  const [detectionConfidence, setDetectionConfidence] = useState(0);

  // Actuator states
  const [sirenActive, setSirenActive] = useState(false);
  const [floodlightActive, setFloodlightActive] = useState(false);
  const [sprinklerActive, setSprinklerActive] = useState(false);

  // LEDs state
  const [greenLed, setGreenLed] = useState(true); // Power & System OK
  const [yellowLed, setYellowLed] = useState(false); // Warning / AI Processing
  const [redLed, setRedLed] = useState(false); // High Risk Deterrent
  const [blueLed, setBlueLed] = useState(false); // Diagnostic Telemetry

  // Driver MOSFET & Relay States
  const [mosfet1Gate, setMosfet1Gate] = useState(false); // Top - Siren
  const [mosfet2Gate, setMosfet2Gate] = useState(false); // Mid - Floodlight
  const [mosfet3Gate, setMosfet3Gate] = useState(false); // Bot - Auxiliary / Sprinkler
  const [relayEnergized, setRelayEnergized] = useState(false); // 2-Channel Relay Module

  // Settings & Display Toggles
  const [soundEnabled, setSoundEnabled] = useState(false);
  const [showWireTraces, setShowWireTraces] = useState(true);
  const [showPinLabels, setShowPinLabels] = useState(true);
  const [autoSequenceRunning, setAutoSequenceRunning] = useState(false);
  const [activeComponentModal, setActiveComponentModal] = useState(null);

  // Event Log State
  const [logs, setLogs] = useState([
    { id: 1, time: '15:32:01.104', type: 'SYS', message: 'Hardware Digital Twin initialized. Arduino UNO online on COM4.' },
    { id: 2, time: '15:32:01.120', type: 'PIR', message: 'HC-SR501 PIR sensor calibrated. Status: READY (Pin D2: LOW).' },
    { id: 3, time: '15:32:01.145', type: 'ADC', message: 'LM35 precision thermal probe active on A0. Baseline: 24.6°C (246mV).' },
    { id: 4, time: '15:32:01.160', type: 'LED', message: 'Green Status LED energized. Circuit operating in NORMAL state.' }
  ]);

  const timeoutsRef = useRef([]);
  const logContainerRef = useRef(null);

  // Auto-scroll logs to bottom
  useEffect(() => {
    if (logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [logs]);

  // Clean timeouts helper
  const clearAllTimeouts = () => {
    timeoutsRef.current.forEach(t => clearTimeout(t));
    timeoutsRef.current = [];
  };

  useEffect(() => {
    return () => {
      clearAllTimeouts();
      audioSynth.stopSiren();
    };
  }, []);

  // Format current timestamp with milliseconds
  const getTimestamp = () => {
    const d = new Date();
    const h = String(d.getHours()).padStart(2, '0');
    const m = String(d.getMinutes()).padStart(2, '0');
    const s = String(d.getSeconds()).padStart(2, '0');
    const ms = String(d.getMilliseconds()).padStart(3, '0');
    return `${h}:${m}:${s}.${ms}`;
  };

  const appendLog = (type, message) => {
    setLogs(prev => [
      ...prev.slice(-40),
      { id: Date.now() + Math.random(), time: getTimestamp(), type, message }
    ]);
  };

  // Temperature natural slight jitter in normal mode
  useEffect(() => {
    if (simulationMode === 'NORMAL') {
      const interval = setInterval(() => {
        const jitter = (Math.random() * 0.4 - 0.2);
        setTemperature(prev => +(24.6 + jitter).toFixed(1));
      }, 3000);
      return () => clearInterval(interval);
    }
  }, [simulationMode]);

  // ----------------------------------------------------
  // SIMULATION MODE SWITCHERS
  // ----------------------------------------------------

  // 1. Reset to NORMAL state
  const handleResetToNormal = () => {
    clearAllTimeouts();
    setAutoSequenceRunning(false);
    audioSynth.stopSiren();

    setSimulationMode('NORMAL');
    setStepStage(0);
    setPirStatus('READY');
    setTemperature(24.6);
    setArduinoStatus('ONLINE');
    setThreatLevel('NORMAL');
    setDetectionConfidence(0);

    // Actuators OFF
    setSirenActive(false);
    setFloodlightActive(false);
    setSprinklerActive(false);

    // Drivers OFF
    setMosfet1Gate(false);
    setMosfet2Gate(false);
    setMosfet3Gate(false);
    setRelayEnergized(false);

    // LEDs Baseline
    setGreenLed(true);
    setYellowLed(false);
    setRedLed(false);
    setBlueLed(false);

    appendLog('SYS', 'System reset to NORMAL baseline. All deterrents & outputs deactivated.');
    if (soundEnabled) audioSynth.playBeep(440, 0.05);
  };

  // 2. Switch to MOTION DETECTED mode
  const handleMotionDetectedMode = () => {
    clearAllTimeouts();
    setAutoSequenceRunning(false);
    audioSynth.stopSiren();

    setSimulationMode('MOTION');
    setStepStage(2);
    setPirStatus('MOTION DETECTED');
    setTemperature(27.4);
    setArduinoStatus('PROCESSING');
    setThreatLevel('WARNING');
    setDetectionConfidence(72.0);

    // Actuators OFF in motion only
    setSirenActive(false);
    setFloodlightActive(false);
    setSprinklerActive(false);

    // Drivers OFF
    setMosfet1Gate(false);
    setMosfet2Gate(false);
    setMosfet3Gate(false);
    setRelayEnergized(false);

    // LEDs: Green ON, Yellow Blinking/ON, Red OFF, Blue OFF
    setGreenLed(true);
    setYellowLed(true);
    setRedLed(false);
    setBlueLed(false);

    appendLog('PIR', 'PIR motion trigger: HIGH signal on Pin D2. Heat disturbance verified.');
    appendLog('SYS', 'Arduino interrupt vector triggered on INT0 (Pin 2). AI Decision Engine analyzing.');
    appendLog('SYS', 'Threat level: WARNING. Deterrents remain OFF (awaiting AI confirmation).');

    if (soundEnabled) audioSynth.playBeep(650, 0.1);
  };

  // 3. Complete 6-Step Wildlife Detection Simulation
  const handleSimulateWildlifeDetection = (species = selectedSpecies) => {
    clearAllTimeouts();
    setAutoSequenceRunning(true);
    audioSynth.stopSiren();

    setSimulationMode('HIGH_RISK');
    setStepStage(1);
    setSelectedSpecies(species);

    // Reset base hardware
    setGreenLed(true);
    setYellowLed(false);
    setRedLed(false);
    setBlueLed(false);
    setSirenActive(false);
    setFloodlightActive(false);
    setSprinklerActive(false);
    setMosfet1Gate(false);
    setMosfet2Gate(false);
    setMosfet3Gate(false);
    setRelayEnergized(false);
    setThreatLevel('NORMAL');
    setDetectionConfidence(0);

    // STEP 1: PIR Sensor triggered (0ms -> 400ms)
    appendLog('SYS', '-------------------------------------------------------');
    appendLog('SYS', `*** INTRUSION SIMULATION INITIATED: ${species.name.toUpperCase()} (SIMULATED EVENT) ***`);
    appendLog('PIR', 'STEP 1: PIR Pyroelectric dome detects thermal movement. Output -> HIGH (3.3V).');
    setPirStatus('MOTION DETECTED');
    setTemperature(28.2);
    if (soundEnabled) audioSynth.playBeep(520, 0.08);

    // STEP 2: Signal travels along wire to Arduino D2 (500ms)
    const t1 = setTimeout(() => {
      setStepStage(2);
      appendLog('PIR', 'STEP 2: Digital high signal propagating along teal path to Arduino Pin D2.');
      if (soundEnabled) audioSynth.playBeep(700, 0.06);
    }, 600);

    // STEP 3: Arduino enters AI Decision Engine Processing (1200ms)
    const t2 = setTimeout(() => {
      setStepStage(3);
      setArduinoStatus('PROCESSING');
      setYellowLed(true); // Yellow LED ON during warning/processing
      appendLog('AI-CORE', 'STEP 3: Arduino UNO received edge trigger. Dispatching telemetry to AI Engine.');
      appendLog('AI-CORE', 'WILDLIFE EVENT RECEIVED');
      appendLog('AI-CORE', 'AI DECISION ENGINE PROCESSING: Extracting YOLOv11 bounding boxes & species vector...');
      if (soundEnabled) audioSynth.playBeep(880, 0.08);
    }, 1300);

    // STEP 4: Wildlife Event Ingested & Classification (2000ms)
    const t3 = setTimeout(() => {
      setStepStage(4);
      setTemperature(species.temp);
      setDetectionConfidence(species.confidence);
      appendLog('AI-CORE', `STEP 4: Ingestion verified: ${species.name} (${species.emoji}) with ${species.confidence}% confidence. [SIMULATED EVENT]`);
      appendLog('ADC', `LM35 Analog Reading: ${(species.temp * 10).toFixed(0)}mV -> ${species.temp}°C ambient signature.`);
      if (soundEnabled) audioSynth.playBeep(1040, 0.08);
    }, 2100);

    // STEP 5: Threat Level Escalation (2700ms)
    const t4 = setTimeout(() => {
      setStepStage(5);
      setThreatLevel(species.threat);
      appendLog('AI-CORE', `STEP 5: Threat Level Assessment: ${species.threat} RISK.`);
      appendLog('SYS', `Decision Matrix output: Triggering multi-tier deterrent protocol.`);
      if (soundEnabled) audioSynth.playBeep(1200, 0.1);
    }, 2800);

    // STEP 6: Hardware Outputs Actuation (3500ms)
    const t5 = setTimeout(() => {
      setStepStage(6);
      setArduinoStatus('COMMAND OUT');

      // Yellow LED off, Red LED ON, Blue LED ON, Green remains ON
      setYellowLed(false);
      setRedLed(species.actuators.redLed);
      setBlueLed(species.actuators.blueLed);

      // Actuators & Drivers
      if (species.actuators.siren) {
        setMosfet1Gate(true);
        setSirenActive(true);
        appendLog('MOSFET', 'IRLZ44N MOSFET #1 Gate HIGH (5V) -> Drain-Source closed -> SIREN ACTIVATED (118 dB bio-acoustic).');
        if (soundEnabled) audioSynth.startSiren();
      }

      if (species.actuators.floodlight) {
        setMosfet2Gate(true);
        setFloodlightActive(true);
        appendLog('MOSFET', 'IRLZ44N MOSFET #2 Gate HIGH (5V) -> Drain-Source closed -> HIGH-LUX FLOODLIGHT STROBE ACTIVE.');
      }

      if (species.actuators.sprinkler) {
        setRelayEnergized(true);
        setSprinklerActive(true);
        appendLog('RELAY', '2-Channel Relay Module CH1 energized (Pin D7 LOW) -> Contact COM-NO closed -> SPRINKLER VALVE OPEN (4.5 Bar).');
        if (soundEnabled) audioSynth.playRelayClick();
      }

      appendLog('SYS', 'STEP 6: ALL HARDWARE DETERRENTS DEPLOYED. Wildlife intrusion repelled.');
      setAutoSequenceRunning(false);
    }, 3600);

    timeoutsRef.current = [t1, t2, t3, t4, t5];
  };

  // Toggle audio on/off
  const toggleSound = () => {
    if (!soundEnabled) {
      audioSynth.init();
      setSoundEnabled(true);
      if (sirenActive) audioSynth.startSiren();
      else audioSynth.playBeep(880, 0.1);
    } else {
      audioSynth.stopSiren();
      setSoundEnabled(false);
    }
  };

  // ----------------------------------------------------
  // HARDWARE COMPONENT DETAILS FOR INTERACTIVE MODALS
  // ----------------------------------------------------
  const COMPONENT_DETAILS = {
    arduino: {
      name: "Arduino UNO R3 Microcontroller",
      category: "Main System Controller",
      pins: "Digital D0-D13, Analog A0-A5, 5V, GND, 3.3V",
      voltage: "5.0V DC (USB / 12V DC via Barrel Jack)",
      description: "Acts as the central edge processor. Reads the PIR digital interrupt on Pin D2 and the LM35 thermal voltage on Analog Pin A0. Evaluates sensor triggers, executes deterrent decision algorithms, and commands the MOSFET gates (D9, D10) and relay coil (D7).",
      currentStatus: arduinoStatus === 'ONLINE' ? 'ONLINE (Idle Loop, 16MHz ATmega328P)' : arduinoStatus === 'PROCESSING' ? 'PROCESSING (AI Decision Engine)' : 'COMMAND ACTIVE (Driving Actuators)',
      statusColor: arduinoStatus === 'ONLINE' ? 'text-emerald-400' : arduinoStatus === 'PROCESSING' ? 'text-amber-400' : 'text-red-400'
    },
    pir: {
      name: "HC-SR501 PIR Motion Sensor",
      category: "Digital Perimeter Detector",
      pins: "VCC (5V), OUT (Digital Pin D2), GND",
      voltage: "3.3V Logic Output High / 0V Low",
      description: "Passive Infrared sensor detecting changes in thermal radiation caused by moving animals. Equipped with a Fresnel dome lens for 120° detection cone up to 7 meters. Connected directly to Arduino Digital Pin 2 for hardware interrupt capability.",
      currentStatus: pirStatus === 'READY' ? 'READY (Listening, Output LOW 0V)' : 'MOTION DETECTED (Triggered, Output HIGH 3.3V)',
      statusColor: pirStatus === 'READY' ? 'text-emerald-400' : 'text-red-400'
    },
    lm35: {
      name: "LM35DZ Precision Centigrade Sensor",
      category: "Analog Thermal Signature Probe",
      pins: "+Vs (5V), Vout (Analog Pin A0), GND",
      voltage: "Linear +10.0 mV/°C scale factor (246mV = 24.6°C, 312mV = 31.2°C)",
      description: "Precision temperature sensor whose output voltage is linearly proportional to the Celsius temperature. Calibrated directly in degrees Celsius without requiring external calibration. Monitored on Arduino Analog Pin A0 with 10-bit ADC resolution.",
      currentStatus: `${temperature.toFixed(1)}°C (Raw ADC: ${(temperature * 10.23).toFixed(0)}, Vout: ${(temperature * 10).toFixed(0)} mV)`,
      statusColor: temperature > 30 ? 'text-red-400' : 'text-emerald-400'
    },
    buzzer: {
      name: "High-Decibel Bio-Acoustic Siren / Buzzer",
      category: "Primary Acoustic Deterrent",
      pins: "VCC (+12V DC), GND (via IRLZ44N MOSFET #1 Drain)",
      voltage: "12V DC High-Output (Driven via Pin D9 PWM)",
      description: "High-output bio-acoustic siren capable of 118 dB sound pressure. Tuned to frequencies and pulsed rhythms tailored to scare large wild mammals without permanent harm. Switched safely by a logic-level MOSFET driver.",
      currentStatus: sirenActive ? 'ACTIVE (118 dB Sound Output, Pin D9 HIGH 5V)' : 'OFF (MOSFET Drain open, 0 mA)',
      statusColor: sirenActive ? 'text-red-400' : 'text-slate-400'
    },
    mosfet1: {
      name: "IRLZ44N Logic-Level N-Channel MOSFET #1",
      category: "Siren High-Current Low-Side Driver",
      pins: "Gate (Pin D9 with 10k pull-down), Drain (Siren -), Source (GND)",
      voltage: "Vds = 55V max, Id = 47A max, Vgs(th) = 1-2V",
      description: "Logic-level N-Channel MOSFET designed to be fully saturated by the 5V logic signal from Arduino Pin D9. Sinks high load current for the 12V acoustic siren while keeping the microcontroller isolated and protected.",
      currentStatus: mosfet1Gate ? 'SATURATED / ON (Vgs = 5.0V, Rds(on) = 0.022Ω, Drain Active)' : 'CUT-OFF / OFF (Vgs = 0.0V, Gate pulled low)',
      statusColor: mosfet1Gate ? 'text-red-400' : 'text-slate-400'
    },
    mosfet2: {
      name: "IRLZ44N Logic-Level N-Channel MOSFET #2",
      category: "Floodlight Strobe Driver",
      pins: "Gate (Pin D10 with 10k pull-down), Drain (Floodlight -), Source (GND)",
      voltage: "Vds = 55V max, Id = 47A max, Vgs(th) = 1-2V",
      description: "Powers the 12V high-lux LED strobe floodlight array. Capable of rapid PWM switching for disorienting strobe patterns that repel nocturnal wildlife such as leopards and wild boars.",
      currentStatus: mosfet2Gate ? 'SATURATED / ON (Vgs = 5.0V, Strobe Current Active)' : 'CUT-OFF / OFF (Vgs = 0.0V, Gate pulled low)',
      statusColor: mosfet2Gate ? 'text-red-400' : 'text-slate-400'
    },
    mosfet3: {
      name: "IRLZ44N Logic-Level N-Channel MOSFET #3",
      category: "Auxiliary High-Current Stage",
      pins: "Gate (Pin D8 / D11), Drain (Aux load), Source (GND)",
      voltage: "Vds = 55V max, Id = 47A max",
      description: "Third discrete MOSFET driver stage for auxiliary deterrent expansion, ultrasonic transducer modules, or secondary flash beacons.",
      currentStatus: mosfet3Gate ? 'SATURATED / ON (5V Gate)' : 'CUT-OFF / OFF (0V Gate)',
      statusColor: mosfet3Gate ? 'text-red-400' : 'text-slate-400'
    },
    relay: {
      name: "Songle 2-Channel Relay Module (SRD-05VDC-SL-C)",
      category: "Galvanic High-Voltage Actuator Switch",
      pins: "VCC (5V), GND, IN1 (Pin D7), IN2, COM, NO, NC",
      voltage: "Coil: 5V DC, Contacts: 10A 250VAC / 30VDC",
      description: "Dual-channel optocoupler-isolated relay module controlling the 12V/24V high-pressure sprinkler solenoid valve. Provides complete electrical isolation between the water solenoid coil and the Arduino logic rail.",
      currentStatus: relayEnergized ? 'COIL ENERGIZED (IN1 LOW, COM-NO Closed, Sprinkler Open)' : 'DE-ENERGIZED (IN1 HIGH, COM-NO Open, Sprinkler Closed)',
      statusColor: relayEnergized ? 'text-red-400' : 'text-slate-400'
    },
    greenLed: {
      name: "Green Status LED (Normal / System OK)",
      category: "Visual Telemetry Indicator",
      pins: "Anode (Pin D6 via 200Ω resistor), Cathode (GND)",
      voltage: "Vf = 2.1V, If = 14.5mA",
      description: "Indicates that 5V logic power is continuous, the ATmega328P firmware loop is active, and the perimeter is under nominal monitoring without threats.",
      currentStatus: greenLed ? 'ON (System Operational, 5V Logic Nominal)' : 'OFF',
      statusColor: greenLed ? 'text-emerald-400' : 'text-slate-400'
    },
    yellowLed: {
      name: "Yellow Warning LED (AI Processing / Evaluation)",
      category: "Visual Telemetry Indicator",
      pins: "Anode (Pin D4 via 200Ω resistor), Cathode (GND)",
      voltage: "Vf = 2.0V, If = 15.0mA",
      description: "Illuminates during motion interrupt detection and AI decision-making. Signifies that the system is evaluating threat severity before triggering heavy actuators.",
      currentStatus: yellowLed ? 'ON (AI Decision Processing Active)' : 'OFF (Idle)',
      statusColor: yellowLed ? 'text-amber-400' : 'text-slate-400'
    },
    redLed: {
      name: "Red High-Risk LED (Actuator Deployment)",
      category: "Visual Telemetry Indicator",
      pins: "Anode (Pin D5 via 200Ω resistor), Cathode (GND)",
      voltage: "Vf = 1.9V, If = 15.5mA",
      description: "Illuminates when a high-risk animal is confirmed and high-voltage actuators (siren, floodlight, sprinkler) are energized.",
      currentStatus: redLed ? 'ON (High Threat Actuation Engaged)' : 'OFF',
      statusColor: redLed ? 'text-red-400' : 'text-slate-400'
    },
    blueLed: {
      name: "Blue Diagnostic LED (Telemetry Link)",
      category: "Visual Telemetry Indicator",
      pins: "Anode (Pin D3 via 200Ω resistor), Cathode (GND)",
      voltage: "Vf = 3.2V, If = 12.0mA",
      description: "Flashes to indicate packet transmission to the central LoRa gateway and logging of wildlife event telemetry.",
      currentStatus: blueLed ? 'ON (Data Ingested & Transmitted)' : 'OFF',
      statusColor: blueLed ? 'text-blue-400' : 'text-slate-400'
    }
  };

  return (
    <div className="w-full space-y-6 select-none font-sans text-slate-100 pb-16">
      
      {/* 1. TOP HEADER & PROMINENT SIMULATION BANNER */}
      <div className="bg-gradient-to-r from-[#0b1329] via-[#0d1730] to-[#070b16] border border-slate-800/80 rounded-2xl p-5 shadow-2xl relative overflow-hidden">
        {/* Background glow lines */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-10 -left-10 w-72 h-72 bg-blue-500/5 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-mono text-[10px] font-bold tracking-wider flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                VIRTUAL HARDWARE SIMULATION
              </span>
              <span className="px-2 py-0.5 rounded bg-slate-800/80 border border-slate-700/60 text-slate-300 font-mono text-[10px]">
                CIRKIT DESIGNER TWIN v2.4
              </span>
              <span className="px-2 py-0.5 rounded bg-blue-500/10 border border-blue-500/20 text-blue-400 font-mono text-[10px]">
                ARDUINO UNO R3 + ATMEGA328P
              </span>
            </div>

            <h1 className="text-xl md:text-2xl font-black text-slate-100 tracking-tight flex items-center gap-2">
              <Cpu className="h-6 w-6 text-emerald-400" />
              Hardware Simulation & Digital Twin
            </h1>
            <p className="text-xs text-slate-400 max-w-2xl font-normal">
              High-fidelity physical digital twin demonstrating embedded sensing, AI decision engine routing, and multi-stage MOSFET/Relay deterrent actuation in real-time.
            </p>
          </div>

          {/* Quick status badges on header */}
          <div className="flex items-center gap-2.5">
            {/* Sound toggle */}
            <button
              onClick={toggleSound}
              className={`p-2.5 rounded-xl border font-mono text-xs font-semibold flex items-center gap-2 transition-all ${
                soundEnabled 
                  ? 'bg-amber-500/15 border-amber-500/40 text-amber-300 shadow-lg shadow-amber-500/10' 
                  : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-slate-200'
              }`}
              title={soundEnabled ? "Mute hardware audio synth" : "Enable hardware buzzer sound simulation"}
            >
              {soundEnabled ? <Volume2 className="h-4 w-4 animate-bounce" /> : <VolumeX className="h-4 w-4" />}
              <span className="text-[11px]">{soundEnabled ? "AUDIO ON" : "AUDIO MUTED"}</span>
            </button>

            {/* Reset Simulation Button */}
            <button
              onClick={handleResetToNormal}
              className="px-3.5 py-2.5 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-slate-700/80 text-slate-200 hover:text-white font-mono text-xs font-bold flex items-center gap-2 transition-all shadow-md active:scale-95"
            >
              <RotateCcw className="h-3.5 w-3.5 text-slate-400" />
              RESET SIMULATION
            </button>
          </div>
        </div>

        {/* Status color legend */}
        <div className="mt-4 pt-3 border-t border-slate-800/60 flex flex-wrap items-center justify-between gap-3 text-[11px] font-mono">
          <div className="flex flex-wrap items-center gap-4">
            <span className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">Status Legend:</span>
            <span className="flex items-center gap-1.5 text-emerald-400 font-semibold">
              <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-sm shadow-emerald-400" />
              Green = Normal / Active
            </span>
            <span className="flex items-center gap-1.5 text-amber-400 font-semibold">
              <span className="h-2 w-2 rounded-full bg-amber-400 shadow-sm shadow-amber-400" />
              Yellow = Warning / Processing
            </span>
            <span className="flex items-center gap-1.5 text-red-400 font-semibold">
              <span className="h-2 w-2 rounded-full bg-red-500 shadow-sm shadow-red-500 animate-pulse" />
              Red = Activated / High Risk
            </span>
            <span className="flex items-center gap-1.5 text-slate-500 font-semibold">
              <span className="h-2 w-2 rounded-full bg-slate-600" />
              Gray = Inactive / Standby
            </span>
          </div>

          <div className="flex items-center gap-2 text-slate-400 text-[11px]">
            <span>System State:</span>
            <span className={`font-bold px-2 py-0.5 rounded text-[10px] ${
              threatLevel === 'NORMAL' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
              threatLevel === 'WARNING' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
              'bg-red-500/20 text-red-400 border border-red-500/40 animate-pulse'
            }`}>
              {threatLevel === 'NORMAL' ? 'SYSTEM STATUS: NORMAL' : threatLevel === 'WARNING' ? 'SYSTEM STATUS: WARNING' : 'SYSTEM STATUS: HIGH RISK'}
            </span>
          </div>
        </div>
      </div>

      {/* 2. PROMINENT SIMULATION CONTROL TOOLBAR */}
      <div className="bg-[#090e1c] border border-slate-850 rounded-2xl p-4 shadow-xl space-y-3">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
          
          {/* Mode Switcher Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-mono text-slate-400 uppercase tracking-wider mr-1">Modes:</span>
            
            {/* NORMAL */}
            <button
              onClick={handleResetToNormal}
              className={`px-3 py-2 rounded-xl text-xs font-mono font-bold transition-all flex items-center gap-1.5 ${
                simulationMode === 'NORMAL'
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/50 shadow-md shadow-emerald-500/10'
                  : 'bg-slate-900/60 text-slate-400 hover:text-slate-200 border border-slate-800'
              }`}
            >
              <CheckCircle2 className="h-3.5 w-3.5" />
              NORMAL
            </button>

            {/* MOTION DETECTED */}
            <button
              onClick={handleMotionDetectedMode}
              className={`px-3 py-2 rounded-xl text-xs font-mono font-bold transition-all flex items-center gap-1.5 ${
                simulationMode === 'MOTION'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/50 shadow-md shadow-amber-500/10'
                  : 'bg-slate-900/60 text-slate-400 hover:text-slate-200 border border-slate-800'
              }`}
            >
              <Activity className="h-3.5 w-3.5" />
              MOTION DETECTED
            </button>

            {/* HIGH-RISK WILDLIFE / SIMULATE WILDLIFE DETECTION */}
            <button
              onClick={() => handleSimulateWildlifeDetection(selectedSpecies)}
              className={`px-4 py-2 rounded-xl text-xs font-mono font-extrabold transition-all flex items-center gap-2 ${
                simulationMode === 'HIGH_RISK'
                  ? 'bg-gradient-to-r from-red-600 to-rose-600 text-white border border-red-400 shadow-lg shadow-red-500/25 animate-pulse'
                  : 'bg-gradient-to-r from-red-600/80 to-rose-600/80 hover:from-red-600 hover:to-rose-600 text-white border border-red-500/40 shadow-md'
              }`}
            >
              <Flame className="h-4 w-4 text-amber-300" />
              SIMULATE WILDLIFE DETECTION
            </button>
          </div>

          {/* Species selector dropdown & display toggles */}
          <div className="flex flex-wrap items-center gap-2.5">
            <div className="flex items-center gap-1.5 bg-slate-950/60 border border-slate-800 rounded-xl px-2.5 py-1.5">
              <span className="text-[10px] font-mono text-slate-400">Target:</span>
              <select
                value={selectedSpecies.id}
                onChange={(e) => {
                  const sp = SPECIES_PRESETS.find(p => p.id === e.target.value) || SPECIES_PRESETS[0];
                  setSelectedSpecies(sp);
                  if (simulationMode === 'HIGH_RISK') {
                    handleSimulateWildlifeDetection(sp);
                  }
                }}
                className="bg-transparent text-xs font-semibold text-slate-200 outline-none cursor-pointer"
              >
                {SPECIES_PRESETS.map(sp => (
                  <option key={sp.id} value={sp.id} className="bg-slate-900 text-slate-100">
                    {sp.emoji} {sp.name} ({sp.threat})
                  </option>
                ))}
              </select>
            </div>

            {/* Toggle wire current traces */}
            <button
              onClick={() => setShowWireTraces(!showWireTraces)}
              className={`p-2 rounded-xl border text-[11px] font-mono flex items-center gap-1.5 transition-colors ${
                showWireTraces ? 'bg-blue-500/15 border-blue-500/30 text-blue-300' : 'bg-slate-950 border-slate-800 text-slate-500'
              }`}
              title="Toggle animated current flow signal traces"
            >
              <Zap className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Wire Traces</span>
            </button>

            {/* Toggle Pin Labels */}
            <button
              onClick={() => setShowPinLabels(!showPinLabels)}
              className={`p-2 rounded-xl border text-[11px] font-mono flex items-center gap-1.5 transition-colors ${
                showPinLabels ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300' : 'bg-slate-950 border-slate-800 text-slate-500'
              }`}
              title="Toggle Pin labels over the circuit"
            >
              <Layers className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Pin Callouts</span>
            </button>
          </div>
        </div>

        {/* 6-Stage Timeline Progress Bar when High Risk is triggered */}
        {simulationMode === 'HIGH_RISK' && (
          <div className="bg-[#050812] border border-red-900/40 rounded-xl p-3 space-y-2">
            <div className="flex items-center justify-between text-[11px] font-mono">
              <span className="text-red-400 font-bold flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-red-500 animate-ping" />
                AUTOMATED 6-STAGE HARDWARE RESPONSE SEQUENCE
              </span>
              <span className="text-slate-400">Step {stepStage} of 6</span>
            </div>

            <div className="grid grid-cols-6 gap-1.5">
              {[
                { stage: 1, label: "1. PIR Trigger", desc: "Motion Detected" },
                { stage: 2, label: "2. Signal Wire", desc: "PIR -> Pin D2" },
                { stage: 3, label: "3. MCU Process", desc: "Decision Engine" },
                { stage: 4, label: "4. Wildlife Event", desc: `${selectedSpecies.name}` },
                { stage: 5, label: "5. Escalation", desc: `${selectedSpecies.threat} Risk` },
                { stage: 6, label: "6. Actuation", desc: "Siren/Light/Mist" }
              ].map((step) => {
                const isPassed = stepStage >= step.stage;
                const isCurrent = stepStage === step.stage;
                return (
                  <div
                    key={step.stage}
                    className={`p-1.5 rounded-lg border text-left transition-all ${
                      isCurrent
                        ? 'bg-red-500/20 border-red-500 text-red-300 shadow-md shadow-red-500/20 scale-[1.02]'
                        : isPassed
                        ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                        : 'bg-slate-950/60 border-slate-900 text-slate-600'
                    }`}
                  >
                    <p className="text-[10px] font-bold font-mono truncate">{step.label}</p>
                    <p className="text-[9px] font-mono opacity-80 truncate">{step.desc}</p>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* 3. MAIN HARDWARE DIGITAL TWIN CANVAS & CIRCUIT VISUALIZATION */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        
        {/* Left / Center 8 cols: Interactive Circuit Schematic Board */}
        <div className="xl:col-span-8 bg-[#080d1a] border border-slate-800 rounded-2xl p-4 shadow-2xl relative flex flex-col">
          
          {/* Circuit Canvas Header Bar */}
          <div className="flex items-center justify-between pb-3 mb-2 border-b border-slate-800/80 text-xs font-mono">
            <div className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="font-bold text-slate-200">PHYSICAL HARDWARE LAYOUT OVERLAY</span>
              <span className="text-slate-500 text-[10px] hidden sm:inline">(Click components for live diagnostics)</span>
            </div>

            <div className="flex items-center gap-3 text-[11px]">
              <span className="text-slate-400">PIR Pin: <strong className="text-cyan-400">D2</strong></span>
              <span className="text-slate-400">LM35 Pin: <strong className="text-yellow-400">A0</strong></span>
              <span className="text-slate-400">Siren: <strong className="text-red-400">D9</strong></span>
              <span className="text-slate-400">Relay: <strong className="text-blue-400">D7</strong></span>
            </div>
          </div>

          {/* Interactive Circuit Image Container with exact Overlays */}
          <div className="relative w-full aspect-[3000/2421] bg-slate-950 rounded-xl overflow-hidden border border-slate-900 shadow-inner group">
            
            {/* The authoritative Cirkit Designer Base Image */}
            <img
              src="/circuit_image.png"
              alt="WildShield Cirkit Designer Physical Hardware Layout"
              className="w-full h-full object-contain pointer-events-none select-none"
            />

            {/* ---------------------------------------------------------------- */}
            {/* SVG OVERLAY: ANIMATED CURRENT & SIGNAL FLOW TRACES              */}
            {/* ---------------------------------------------------------------- */}
            {showWireTraces && (
              <svg 
                className="absolute inset-0 w-full h-full pointer-events-none z-10"
                viewBox="0 0 3000 2421"
                preserveAspectRatio="xMidYMid meet"
              >
                <defs>
                  {/* Glowing Filter effects */}
                  <filter id="glow-teal" x="-20%" y="-20%" width="140%" height="140%">
                    <feGaussianBlur stdDeviation="8" result="blur" />
                    <feComposite in="SourceGraphic" in2="blur" operator="over" />
                  </filter>
                  <filter id="glow-red" x="-20%" y="-20%" width="140%" height="140%">
                    <feGaussianBlur stdDeviation="10" result="blur" />
                    <feComposite in="SourceGraphic" in2="blur" operator="over" />
                  </filter>
                  <filter id="glow-yellow" x="-20%" y="-20%" width="140%" height="140%">
                    <feGaussianBlur stdDeviation="8" result="blur" />
                    <feComposite in="SourceGraphic" in2="blur" operator="over" />
                  </filter>
                  <filter id="glow-blue" x="-20%" y="-20%" width="140%" height="140%">
                    <feGaussianBlur stdDeviation="8" result="blur" />
                    <feComposite in="SourceGraphic" in2="blur" operator="over" />
                  </filter>
                </defs>

                {/* 1. PIR Signal Path -> Arduino D2 */}
                {(stepStage >= 2 || pirStatus === 'MOTION DETECTED') && (
                  <path
                    d="M 390,250 L 580,250 L 580,774 L 1020,774"
                    fill="none"
                    stroke="#06b6d4"
                    strokeWidth="8"
                    strokeDasharray="20 12"
                    strokeLinecap="round"
                    filter="url(#glow-teal)"
                    className="animate-[dash_1s_linear_infinite]"
                  />
                )}

                {/* 2. LM35 Thermal Signal Path -> Arduino A0 */}
                {(temperature > 26) && (
                  <path
                    d="M 315,750 L 540,750 L 540,1230 L 1050,1230"
                    fill="none"
                    stroke="#eab308"
                    strokeWidth="6"
                    strokeDasharray="16 10"
                    strokeLinecap="round"
                    filter="url(#glow-yellow)"
                    className="animate-[dash_1.5s_linear_infinite]"
                  />
                )}

                {/* 3. Arduino Pin D9 -> MOSFET 1 Gate -> Siren Output */}
                {sirenActive && (
                  <g>
                    {/* Gate trace */}
                    <path
                      d="M 1080,774 L 1080,250 L 2070,250"
                      fill="none"
                      stroke="#ef4444"
                      strokeWidth="8"
                      strokeDasharray="18 10"
                      strokeLinecap="round"
                      filter="url(#glow-red)"
                      className="animate-[dash_0.8s_linear_infinite]"
                    />
                    {/* Drain trace to buzzer */}
                    <path
                      d="M 2140,220 L 2140,120 L 1650,120 L 1650,170"
                      fill="none"
                      stroke="#f97316"
                      strokeWidth="10"
                      strokeDasharray="24 12"
                      strokeLinecap="round"
                      filter="url(#glow-red)"
                      className="animate-[dash_0.6s_linear_infinite]"
                    />
                  </g>
                )}

                {/* 4. Arduino Pin D10 -> MOSFET 2 Gate -> Floodlight */}
                {floodlightActive && (
                  <path
                    d="M 1120,774 L 1120,740 L 2070,740"
                    fill="none"
                    stroke="#f59e0b"
                    strokeWidth="8"
                    strokeDasharray="18 10"
                    strokeLinecap="round"
                    filter="url(#glow-yellow)"
                    className="animate-[dash_0.8s_linear_infinite]"
                  />
                )}

                {/* 5. Arduino Pin D7 -> Relay Module CH1 -> Sprinkler */}
                {sprinklerActive && (
                  <path
                    d="M 1000,774 L 1000,1200 L 2355,1200"
                    fill="none"
                    stroke="#3b82f6"
                    strokeWidth="8"
                    strokeDasharray="18 10"
                    strokeLinecap="round"
                    filter="url(#glow-blue)"
                    className="animate-[dash_0.8s_linear_infinite]"
                  />
                )}

                {/* 6. Status LEDs Traces */}
                {greenLed && (
                  <path
                    d="M 960,774 L 960,700 L 1605,700"
                    fill="none"
                    stroke="#10b981"
                    strokeWidth="4"
                    strokeDasharray="12 8"
                    className="animate-[dash_2s_linear_infinite] opacity-60"
                  />
                )}
                {yellowLed && (
                  <path
                    d="M 940,774 L 940,1650 L 1605,1650"
                    fill="none"
                    stroke="#fbbf24"
                    strokeWidth="6"
                    strokeDasharray="16 10"
                    filter="url(#glow-yellow)"
                    className="animate-[dash_1s_linear_infinite]"
                  />
                )}
                {redLed && (
                  <path
                    d="M 920,774 L 920,1180 L 1605,1180"
                    fill="none"
                    stroke="#ef4444"
                    strokeWidth="7"
                    strokeDasharray="18 10"
                    filter="url(#glow-red)"
                    className="animate-[dash_0.8s_linear_infinite]"
                  />
                )}
                {blueLed && (
                  <path
                    d="M 900,774 L 900,2100 L 1605,2100"
                    fill="none"
                    stroke="#38bdf8"
                    strokeWidth="6"
                    strokeDasharray="16 10"
                    filter="url(#glow-blue)"
                    className="animate-[dash_1s_linear_infinite]"
                  />
                )}
              </svg>
            )}

            {/* ---------------------------------------------------------------- */}
            {/* INTERACTIVE COMPONENT OVERLAYS (PERCENTAGE POSITIONED)           */}
            {/* ---------------------------------------------------------------- */}

            {/* 1. PIR MOTION SENSOR (Top Left: x 5%-13%, y 6%-15%) */}
            <div 
              onClick={() => setActiveComponentModal('pir')}
              style={{ left: '5.0%', top: '6.0%', width: '8.0%', height: '9.0%' }}
              className={`absolute cursor-pointer rounded-lg border-2 transition-all z-20 flex flex-col items-center justify-center p-1 ${
                pirStatus === 'MOTION DETECTED'
                  ? 'border-red-500 bg-red-500/20 shadow-[0_0_25px_rgba(239,68,68,0.7)] animate-pulse ring-2 ring-red-400'
                  : 'border-emerald-500/60 bg-emerald-500/10 hover:bg-emerald-500/20'
              }`}
              title="Click to inspect HC-SR501 PIR Sensor"
            >
              {pirStatus === 'MOTION DETECTED' && (
                <span className="absolute -top-6 px-1.5 py-0.5 rounded bg-red-600 text-white font-mono text-[9px] font-bold tracking-wider animate-bounce shadow-md whitespace-nowrap">
                  🚨 MOTION DETECTED
                </span>
              )}
              {pirStatus === 'READY' && (
                <span className="absolute -top-5 px-1 py-0.2 rounded bg-emerald-600/90 text-white font-mono text-[8px] font-bold whitespace-nowrap">
                  PIR: READY
                </span>
              )}
              {showPinLabels && (
                <span className="absolute -bottom-4 text-[8px] font-mono text-cyan-400 font-bold bg-black/80 px-1 rounded">
                  PIN D2
                </span>
              )}
            </div>

            {/* 2. LM35 TEMPERATURE SENSOR (Mid Left: x 7.5%-10.5%, y 28.5%-33.5%) */}
            <div
              onClick={() => setActiveComponentModal('lm35')}
              style={{ left: '7.5%', top: '28.5%', width: '3.0%', height: '5.0%' }}
              className={`absolute cursor-pointer rounded border-2 transition-all z-20 flex items-center justify-center ${
                temperature > 30
                  ? 'border-red-500 bg-red-500/20 shadow-[0_0_15px_rgba(239,68,68,0.6)] animate-pulse'
                  : 'border-emerald-500/60 bg-emerald-500/10 hover:bg-emerald-500/20'
              }`}
              title="Click to inspect LM35 Sensor"
            >
              <span className="absolute -top-5 px-1 py-0.2 rounded bg-slate-900/90 border border-slate-700 text-amber-300 font-mono text-[8px] font-bold whitespace-nowrap">
                {temperature.toFixed(1)}°C
              </span>
              {showPinLabels && (
                <span className="absolute -bottom-4 text-[8px] font-mono text-yellow-400 font-bold bg-black/80 px-1 rounded">
                  PIN A0
                </span>
              )}
            </div>

            {/* 3. ARDUINO UNO MICROCONTROLLER (Mid-Left: x 18%-41%, y 32%-52.5%) */}
            <div
              onClick={() => setActiveComponentModal('arduino')}
              style={{ left: '18.0%', top: '32.0%', width: '23.0%', height: '20.5%' }}
              className={`absolute cursor-pointer rounded-xl border-2 transition-all z-20 p-2 flex flex-col justify-between ${
                arduinoStatus === 'COMMAND OUT'
                  ? 'border-red-500 bg-red-500/10 shadow-[0_0_35px_rgba(239,68,68,0.5)] ring-2 ring-red-500/50'
                  : arduinoStatus === 'PROCESSING'
                  ? 'border-amber-400 bg-amber-500/10 shadow-[0_0_30px_rgba(245,158,11,0.5)] ring-2 ring-amber-400/50 animate-pulse'
                  : 'border-emerald-500/70 bg-emerald-500/5 hover:bg-emerald-500/15 shadow-[0_0_20px_rgba(16,185,129,0.3)]'
              }`}
              title="Click to inspect Arduino UNO Microcontroller"
            >
              <div className="flex items-center justify-between">
                <span className={`px-2 py-0.5 rounded font-mono text-[9px] font-black tracking-wider ${
                  arduinoStatus === 'COMMAND OUT' ? 'bg-red-600 text-white animate-pulse' :
                  arduinoStatus === 'PROCESSING' ? 'bg-amber-500 text-black font-extrabold animate-pulse' :
                  'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                }`}>
                  ARDUINO UNO: {arduinoStatus}
                </span>

                <span className="text-[8px] font-mono text-slate-300 bg-black/70 px-1.5 py-0.5 rounded">
                  16 MHz • 5.0V
                </span>
              </div>

              {/* Real-time processing banner when active */}
              {arduinoStatus === 'PROCESSING' && (
                <div className="bg-black/90 border border-amber-500/60 rounded px-2 py-1 text-center font-mono text-[9px] text-amber-300 font-bold animate-pulse">
                  ⚡ AI DECISION ENGINE PROCESSING...
                </div>
              )}
              {arduinoStatus === 'COMMAND OUT' && (
                <div className="bg-red-950/90 border border-red-500 rounded px-2 py-1 text-center font-mono text-[9px] text-red-200 font-bold">
                  🔥 ACTUATOR COMMANDS DISPATCHED
                </div>
              )}

              <div className="flex items-center justify-between text-[8px] font-mono text-slate-400">
                <span>INT0 (D2) Active</span>
                <span>ATmega328P</span>
              </div>
            </div>

            {/* 4. SIREN / BUZZER (Top Center: x 50%-60%, y 7%-17%) */}
            <div
              onClick={() => setActiveComponentModal('buzzer')}
              style={{ left: '50.0%', top: '7.0%', width: '10.0%', height: '10.0%' }}
              className={`absolute cursor-pointer rounded-full border-2 transition-all z-20 flex flex-col items-center justify-center ${
                sirenActive
                  ? 'border-red-500 bg-red-600/30 shadow-[0_0_40px_rgba(239,68,68,0.9)] animate-pulse ring-4 ring-red-500/40'
                  : 'border-slate-700 bg-slate-900/40 hover:border-slate-500'
              }`}
              title="Click to inspect Buzzer / Siren"
            >
              {sirenActive ? (
                <>
                  <span className="absolute -top-6 px-1.5 py-0.5 rounded bg-red-600 text-white font-mono text-[9px] font-black tracking-wider animate-bounce whitespace-nowrap">
                    📢 SIREN: 118 dB (ACTIVE)
                  </span>
                  {/* Concentric sound wave circles */}
                  <div className="absolute inset-0 rounded-full border-2 border-red-400 animate-ping pointer-events-none" />
                  <div className="absolute -inset-4 rounded-full border border-red-500/50 animate-pulse pointer-events-none" />
                </>
              ) : (
                <span className="absolute -top-5 px-1 py-0.2 rounded bg-slate-900/80 text-slate-400 font-mono text-[8px]">
                  SIREN: OFF
                </span>
              )}
            </div>

            {/* 5. MOSFET 1 - Top Right (Siren Driver: x 69%-73.5%, y 9%-14.5%) */}
            <div
              onClick={() => setActiveComponentModal('mosfet1')}
              style={{ left: '69.0%', top: '9.0%', width: '4.5%', height: '5.5%' }}
              className={`absolute cursor-pointer rounded border-2 transition-all z-20 flex flex-col items-center justify-center ${
                mosfet1Gate
                  ? 'border-red-500 bg-red-500/30 shadow-[0_0_20px_rgba(239,68,68,0.8)]'
                  : 'border-slate-700 bg-slate-900/40 hover:border-slate-500'
              }`}
              title="Click to inspect IRLZ44N MOSFET #1 (Siren Stage)"
            >
              <span className={`absolute -top-5 px-1 rounded font-mono text-[8px] font-bold whitespace-nowrap ${
                mosfet1Gate ? 'bg-red-600 text-white' : 'bg-slate-900 text-slate-400'
              }`}>
                {mosfet1Gate ? 'MOSFET 1: ON' : 'MOSFET 1'}
              </span>
            </div>

            {/* 6. MOSFET 2 - Mid Right (Floodlight Driver: x 69%-73.5%, y 29%-34.5%) */}
            <div
              onClick={() => setActiveComponentModal('mosfet2')}
              style={{ left: '69.0%', top: '29.0%', width: '4.5%', height: '5.5%' }}
              className={`absolute cursor-pointer rounded border-2 transition-all z-20 flex flex-col items-center justify-center ${
                mosfet2Gate
                  ? 'border-amber-400 bg-amber-500/30 shadow-[0_0_20px_rgba(245,158,11,0.8)]'
                  : 'border-slate-700 bg-slate-900/40 hover:border-slate-500'
              }`}
              title="Click to inspect IRLZ44N MOSFET #2 (Floodlight Stage)"
            >
              <span className={`absolute -top-5 px-1 rounded font-mono text-[8px] font-bold whitespace-nowrap ${
                mosfet2Gate ? 'bg-amber-500 text-black' : 'bg-slate-900 text-slate-400'
              }`}>
                {mosfet2Gate ? 'MOSFET 2: ON' : 'MOSFET 2'}
              </span>
            </div>

            {/* 7. MOSFET 3 - Lower Right (Aux Driver: x 69%-73.5%, y 48%-53.5%) */}
            <div
              onClick={() => setActiveComponentModal('mosfet3')}
              style={{ left: '69.0%', top: '48.0%', width: '4.5%', height: '5.5%' }}
              className={`absolute cursor-pointer rounded border-2 transition-all z-20 flex flex-col items-center justify-center ${
                mosfet3Gate
                  ? 'border-blue-400 bg-blue-500/30 shadow-[0_0_20px_rgba(59,130,246,0.8)]'
                  : 'border-slate-700 bg-slate-900/40 hover:border-slate-500'
              }`}
              title="Click to inspect IRLZ44N MOSFET #3 (Auxiliary Stage)"
            >
              <span className={`absolute -top-5 px-1 rounded font-mono text-[8px] font-bold whitespace-nowrap ${
                mosfet3Gate ? 'bg-blue-600 text-white' : 'bg-slate-900 text-slate-400'
              }`}>
                {mosfet3Gate ? 'MOSFET 3: ON' : 'MOSFET 3'}
              </span>
            </div>

            {/* 8. 2-CHANNEL RELAY MODULE (Far Right: x 78.5%-95%, y 45%-56%) */}
            <div
              onClick={() => setActiveComponentModal('relay')}
              style={{ left: '78.5%', top: '45.0%', width: '16.5%', height: '11.0%' }}
              className={`absolute cursor-pointer rounded-xl border-2 transition-all z-20 p-1.5 flex flex-col justify-between ${
                relayEnergized
                  ? 'border-blue-500 bg-blue-600/20 shadow-[0_0_30px_rgba(59,130,246,0.8)] ring-2 ring-blue-400'
                  : 'border-slate-700 bg-slate-900/40 hover:border-slate-500'
              }`}
              title="Click to inspect 2-Channel Relay Module (Sprinkler Control)"
            >
              <div className="flex items-center justify-between">
                <span className={`px-1.5 py-0.5 rounded font-mono text-[8px] font-bold ${
                  relayEnergized ? 'bg-blue-600 text-white animate-pulse' : 'bg-slate-900 text-slate-400'
                }`}>
                  RELAY: {relayEnergized ? 'COIL ENERGIZED' : 'STANDBY'}
                </span>
                <span className="text-[7px] font-mono text-slate-400">10A 250VAC</span>
              </div>

              {relayEnergized && (
                <div className="bg-blue-950/80 border border-blue-400/50 rounded px-1 text-center font-mono text-[8px] text-blue-200 font-bold">
                  💧 SPRINKLER SOLENOID OPEN (4.5 Bar)
                </div>
              )}

              <div className="flex items-center justify-between text-[7px] font-mono text-slate-400">
                <span>IN1: {relayEnergized ? 'LOW (0V)' : 'HIGH (5V)'}</span>
                <span>COM-NO: {relayEnergized ? 'CLOSED' : 'OPEN'}</span>
              </div>
            </div>

            {/* 9. GREEN LED (Status: x 53.5%-57.5%, y 27.5%-33.5%) */}
            <div
              onClick={() => setActiveComponentModal('greenLed')}
              style={{ left: '53.5%', top: '27.5%', width: '4.0%', height: '6.0%' }}
              className={`absolute cursor-pointer rounded-full border-2 transition-all z-20 flex items-center justify-center ${
                greenLed
                  ? 'border-emerald-400 bg-emerald-400 shadow-[0_0_30px_rgba(52,211,153,1)] ring-4 ring-emerald-500/50'
                  : 'border-slate-700 bg-emerald-950/30'
              }`}
              title="Click to inspect Green Status LED"
            >
              <span className="absolute -top-4 font-mono text-[8px] font-bold text-emerald-400 bg-black/80 px-1 rounded whitespace-nowrap">
                GREEN: {greenLed ? 'ON' : 'OFF'}
              </span>
            </div>

            {/* 10. RED LED (High Risk: x 53.5%-57.5%, y 46.5%-53%) */}
            <div
              onClick={() => setActiveComponentModal('redLed')}
              style={{ left: '53.5%', top: '46.5%', width: '4.0%', height: '6.5%' }}
              className={`absolute cursor-pointer rounded-full border-2 transition-all z-20 flex items-center justify-center ${
                redLed
                  ? 'border-red-500 bg-red-500 shadow-[0_0_35px_rgba(239,68,68,1)] ring-4 ring-red-500/60 animate-pulse'
                  : 'border-slate-700 bg-red-950/30'
              }`}
              title="Click to inspect Red High-Risk LED"
            >
              <span className="absolute -top-4 font-mono text-[8px] font-bold text-red-400 bg-black/80 px-1 rounded whitespace-nowrap">
                RED: {redLed ? 'ON' : 'OFF'}
              </span>
            </div>

            {/* 11. YELLOW LED (Warning: x 53.5%-57.5%, y 66.5%-73.5%) */}
            <div
              onClick={() => setActiveComponentModal('yellowLed')}
              style={{ left: '53.5%', top: '66.5%', width: '4.0%', height: '7.0%' }}
              className={`absolute cursor-pointer rounded-full border-2 transition-all z-20 flex items-center justify-center ${
                yellowLed
                  ? 'border-amber-400 bg-amber-400 shadow-[0_0_30px_rgba(251,191,36,1)] ring-4 ring-amber-500/50 animate-pulse'
                  : 'border-slate-700 bg-amber-950/30'
              }`}
              title="Click to inspect Yellow Warning LED"
            >
              <span className="absolute -top-4 font-mono text-[8px] font-bold text-amber-400 bg-black/80 px-1 rounded whitespace-nowrap">
                YELLOW: {yellowLed ? 'ON' : 'OFF'}
              </span>
            </div>

            {/* 12. BLUE LED (Diagnostic: x 53.5%-57.5%, y 84.5%-91.5%) */}
            <div
              onClick={() => setActiveComponentModal('blueLed')}
              style={{ left: '53.5%', top: '84.5%', width: '4.0%', height: '7.0%' }}
              className={`absolute cursor-pointer rounded-full border-2 transition-all z-20 flex items-center justify-center ${
                blueLed
                  ? 'border-cyan-400 bg-cyan-400 shadow-[0_0_30px_rgba(56,189,248,1)] ring-4 ring-cyan-500/50 animate-pulse'
                  : 'border-slate-700 bg-cyan-950/30'
              }`}
              title="Click to inspect Blue Diagnostic LED"
            >
              <span className="absolute -top-4 font-mono text-[8px] font-bold text-cyan-400 bg-black/80 px-1 rounded whitespace-nowrap">
                BLUE: {blueLed ? 'ON' : 'OFF'}
              </span>
            </div>

            {/* ---------------------------------------------------------------- */}
            {/* FLOODLIGHT & SPRINKLER ACTUATOR VISUAL OVERLAY EFFECTS          */}
            {/* ---------------------------------------------------------------- */}

            {/* High-Lux Floodlight Beam Overlay (Right Side) */}
            {floodlightActive && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="absolute right-2 top-28 w-44 bg-gradient-to-l from-amber-300/30 via-amber-400/15 to-transparent border-r-4 border-amber-300 p-2.5 rounded-lg pointer-events-none z-30 backdrop-blur-[1px]"
              >
                <div className="flex items-center gap-1.5 text-amber-300 font-mono text-[10px] font-bold">
                  <Sparkles className="h-3.5 w-3.5 animate-spin" />
                  FLOODLIGHT: ON
                </div>
                <p className="text-[8px] font-mono text-amber-200/90 mt-0.5">
                  1500 Lumens Strobe Array • High-Frequency Flash Repellent Active
                </p>
              </motion.div>
            )}

            {/* High-Pressure Sprinkler Mist Overlay (Far Right / Bottom) */}
            {sprinklerActive && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="absolute right-2 bottom-12 w-48 bg-gradient-to-l from-blue-400/30 via-cyan-500/15 to-transparent border-r-4 border-blue-400 p-2.5 rounded-lg pointer-events-none z-30 backdrop-blur-[1px]"
              >
                <div className="flex items-center gap-1.5 text-cyan-300 font-mono text-[10px] font-bold">
                  <Activity className="h-3.5 w-3.5 animate-pulse" />
                  SPRINKLER: ON
                </div>
                <p className="text-[8px] font-mono text-cyan-200/90 mt-0.5">
                  4.5 Bar High-Pressure Mist • Dual Solenoid Valves Opened
                </p>
              </motion.div>
            )}

            {/* ---------------------------------------------------------------- */}
            {/* DYNAMIC WILDLIFE EVENT CARD OVERLAY (SIMULATED EVENT)           */}
            {/* ---------------------------------------------------------------- */}
            {simulationMode === 'HIGH_RISK' && stepStage >= 4 && (
              <motion.div
                initial={{ opacity: 0, y: -20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                className="absolute left-4 top-24 z-30 max-w-xs bg-[#0b1329]/95 border-2 border-red-500/90 rounded-xl p-3 shadow-2xl shadow-red-950 backdrop-blur-md"
              >
                <div className="flex items-center justify-between pb-1.5 mb-1.5 border-b border-red-900/60">
                  <span className="px-1.5 py-0.5 rounded bg-red-600 text-white font-mono text-[9px] font-black tracking-wider">
                    SIMULATED EVENT
                  </span>
                  <span className="text-[9px] font-mono text-red-400 font-bold">
                    WILDLIFE DETECTED
                  </span>
                </div>

                <div className="flex items-start gap-3">
                  <div className="h-12 w-12 rounded-lg bg-red-950/80 border border-red-500/40 flex items-center justify-center text-3xl shadow-inner shrink-0">
                    {selectedSpecies.emoji}
                  </div>
                  <div className="space-y-0.5 font-mono text-left">
                    <p className="text-xs font-bold text-slate-100">{selectedSpecies.name}</p>
                    <p className="text-[9px] text-slate-400 italic font-sans">{selectedSpecies.scientific}</p>
                    <p className="text-[9px] text-red-400 font-semibold">
                      Confidence: <strong className="text-white">{selectedSpecies.confidence}%</strong>
                    </p>
                  </div>
                </div>

                <div className="mt-2 pt-2 border-t border-slate-800 grid grid-cols-2 gap-1.5 text-[9px] font-mono">
                  <div className="bg-slate-950/60 p-1 rounded border border-slate-900">
                    <span className="text-slate-400">Source: </span>
                    <span className="text-cyan-400 font-bold">PIR + CAMERA</span>
                  </div>
                  <div className="bg-slate-950/60 p-1 rounded border border-slate-900">
                    <span className="text-slate-400">Temp: </span>
                    <span className="text-amber-400 font-bold">{selectedSpecies.temp}°C</span>
                  </div>
                </div>

                <div className="mt-1.5 bg-red-500/10 border border-red-500/30 rounded p-1 text-center font-mono text-[9px] text-red-300 font-bold">
                  THREAT LEVEL: {selectedSpecies.threat} RISK
                </div>
              </motion.div>
            )}

          </div>

          {/* Quick interactive hint below canvas */}
          <div className="mt-2.5 flex flex-wrap items-center justify-between text-[10px] font-mono text-slate-400">
            <span>Authoritative Circuit: WildShield Custom Perimeter Protection Board</span>
            <span className="text-emerald-400 font-semibold">● Live Hardware Digital Twin Active</span>
          </div>
        </div>

        {/* Right 4 cols: Real-Time Hardware Status Panel & Event Log */}
        <div className="xl:col-span-4 space-y-4 flex flex-col justify-between">
          
          {/* 1. REAL-TIME HARDWARE STATUS PANEL */}
          <div className="bg-[#090e1c] border border-slate-800 rounded-2xl p-4 shadow-xl space-y-3.5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <h2 className="text-xs font-mono font-bold text-slate-200 flex items-center gap-2">
                <Activity className="h-4 w-4 text-emerald-400" />
                REAL-TIME HARDWARE STATUS
              </h2>
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            </div>

            {/* CONTROLLER SECTION */}
            <div className="bg-[#040711] border border-slate-850 rounded-xl p-2.5 space-y-1">
              <div className="flex items-center justify-between text-[10px] font-mono text-slate-400">
                <span>CONTROLLER</span>
                <span className="text-slate-500">ATmega328P</span>
              </div>
              <div className="flex items-center justify-between font-mono">
                <span className="text-xs font-bold text-slate-200">Arduino UNO</span>
                <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded ${
                  arduinoStatus === 'ONLINE' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40' :
                  arduinoStatus === 'PROCESSING' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 animate-pulse' :
                  'bg-red-500/20 text-red-400 border border-red-500/40 animate-pulse'
                }`}>
                  {arduinoStatus}
                </span>
              </div>
            </div>

            {/* SENSORS SECTION */}
            <div className="bg-[#040711] border border-slate-850 rounded-xl p-2.5 space-y-2">
              <span className="text-[10px] font-mono text-slate-400 block border-b border-slate-900 pb-1">
                SENSORS
              </span>

              {/* PIR Sensor */}
              <div className="flex items-center justify-between font-mono text-xs">
                <span className="text-slate-300 flex items-center gap-1.5">
                  <span className="text-cyan-400 text-[10px]">●</span> PIR Motion (D2)
                </span>
                <span className={`font-bold px-1.5 py-0.5 rounded text-[10px] ${
                  pirStatus === 'MOTION DETECTED'
                    ? 'bg-red-500/20 text-red-400 border border-red-500/40 animate-pulse'
                    : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                }`}>
                  {pirStatus}
                </span>
              </div>

              {/* LM35 Temp */}
              <div className="flex items-center justify-between font-mono text-xs">
                <span className="text-slate-300 flex items-center gap-1.5">
                  <span className="text-yellow-400 text-[10px]">●</span> LM35 Temp (A0)
                </span>
                <span className="font-bold text-amber-300">
                  {temperature.toFixed(1)}°C
                </span>
              </div>
            </div>

            {/* ACTUATORS SECTION */}
            <div className="bg-[#040711] border border-slate-850 rounded-xl p-2.5 space-y-2">
              <span className="text-[10px] font-mono text-slate-400 block border-b border-slate-900 pb-1">
                ACTUATORS
              </span>

              {/* Siren */}
              <div className="flex items-center justify-between font-mono text-xs">
                <span className="text-slate-300">Siren (D9 / MOSFET 1)</span>
                <span className={`font-bold px-2 py-0.5 rounded text-[10px] ${
                  sirenActive ? 'bg-red-500/20 text-red-400 border border-red-500/40 animate-pulse' : 'text-slate-500'
                }`}>
                  {sirenActive ? 'ON (118 dB)' : 'OFF'}
                </span>
              </div>

              {/* Floodlight */}
              <div className="flex items-center justify-between font-mono text-xs">
                <span className="text-slate-300">Floodlight (D10 / MOSFET 2)</span>
                <span className={`font-bold px-2 py-0.5 rounded text-[10px] ${
                  floodlightActive ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 animate-pulse' : 'text-slate-500'
                }`}>
                  {floodlightActive ? 'ON (1500 lm)' : 'OFF'}
                </span>
              </div>

              {/* Sprinkler */}
              <div className="flex items-center justify-between font-mono text-xs">
                <span className="text-slate-300">Sprinkler (D7 / Relay CH1)</span>
                <span className={`font-bold px-2 py-0.5 rounded text-[10px] ${
                  sprinklerActive ? 'bg-blue-500/20 text-blue-400 border border-blue-500/40 animate-pulse' : 'text-slate-500'
                }`}>
                  {sprinklerActive ? 'ON (4.5 Bar)' : 'OFF'}
                </span>
              </div>
            </div>

            {/* STATUS LEDs MATRIX */}
            <div className="bg-[#040711] border border-slate-850 rounded-xl p-2.5 space-y-2">
              <span className="text-[10px] font-mono text-slate-400 block border-b border-slate-900 pb-1">
                STATUS LEDs (200Ω Current-Limited)
              </span>

              <div className="grid grid-cols-2 gap-2 font-mono text-xs">
                <div className="flex items-center justify-between bg-slate-950/70 px-2 py-1 rounded">
                  <span className="flex items-center gap-1.5 text-slate-300 text-[11px]">
                    <span className={`h-2 w-2 rounded-full ${greenLed ? 'bg-emerald-400 shadow-sm shadow-emerald-400' : 'bg-slate-700'}`} />
                    Green
                  </span>
                  <span className={greenLed ? 'text-emerald-400 font-bold' : 'text-slate-600'}>
                    {greenLed ? 'ON' : 'OFF'}
                  </span>
                </div>

                <div className="flex items-center justify-between bg-slate-950/70 px-2 py-1 rounded">
                  <span className="flex items-center gap-1.5 text-slate-300 text-[11px]">
                    <span className={`h-2 w-2 rounded-full ${yellowLed ? 'bg-amber-400 shadow-sm shadow-amber-400 animate-pulse' : 'bg-slate-700'}`} />
                    Yellow
                  </span>
                  <span className={yellowLed ? 'text-amber-400 font-bold' : 'text-slate-600'}>
                    {yellowLed ? 'ON' : 'OFF'}
                  </span>
                </div>

                <div className="flex items-center justify-between bg-slate-950/70 px-2 py-1 rounded">
                  <span className="flex items-center gap-1.5 text-slate-300 text-[11px]">
                    <span className={`h-2 w-2 rounded-full ${redLed ? 'bg-red-500 shadow-sm shadow-red-500 animate-pulse' : 'bg-slate-700'}`} />
                    Red
                  </span>
                  <span className={redLed ? 'text-red-400 font-bold' : 'text-slate-600'}>
                    {redLed ? 'ON' : 'OFF'}
                  </span>
                </div>

                <div className="flex items-center justify-between bg-slate-950/70 px-2 py-1 rounded">
                  <span className="flex items-center gap-1.5 text-slate-300 text-[11px]">
                    <span className={`h-2 w-2 rounded-full ${blueLed ? 'bg-cyan-400 shadow-sm shadow-cyan-400 animate-pulse' : 'bg-slate-700'}`} />
                    Blue
                  </span>
                  <span className={blueLed ? 'text-cyan-400 font-bold' : 'text-slate-600'}>
                    {blueLed ? 'ON' : 'OFF'}
                  </span>
                </div>
              </div>
            </div>

          </div>

          {/* 2. REAL-TIME EVENT LOG */}
          <div className="bg-[#090e1c] border border-slate-800 rounded-2xl p-4 shadow-xl flex-1 flex flex-col min-h-[220px]">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-2">
              <h2 className="text-xs font-mono font-bold text-slate-200 flex items-center gap-2">
                <Terminal className="h-4 w-4 text-cyan-400" />
                HARDWARE EVENT LOG
              </h2>
              
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setLogs([])}
                  className="text-[9px] font-mono text-slate-500 hover:text-slate-300 px-1.5 py-0.5 rounded hover:bg-slate-800"
                >
                  Clear
                </button>
                <span className="text-[10px] font-mono text-slate-500">{logs.length} entries</span>
              </div>
            </div>

            {/* Scrollable Log Output */}
            <div
              ref={logContainerRef}
              className="flex-1 overflow-y-auto space-y-1 pr-1 font-mono text-[10px] max-h-52"
              style={{ scrollbarWidth: 'thin' }}
            >
              {logs.length === 0 ? (
                <div className="text-slate-600 text-center py-6 italic">No event logs recorded.</div>
              ) : (
                logs.map((log) => (
                  <div key={log.id} className="leading-relaxed hover:bg-slate-900/50 px-1 rounded transition-colors flex items-start gap-1.5">
                    <span className="text-slate-500 shrink-0">[{log.time}]</span>
                    <span className={`font-bold shrink-0 ${
                      log.type === 'PIR' ? 'text-cyan-400' :
                      log.type === 'ADC' ? 'text-yellow-400' :
                      log.type === 'AI-CORE' ? 'text-rose-400' :
                      log.type === 'MOSFET' ? 'text-red-400' :
                      log.type === 'RELAY' ? 'text-blue-400' :
                      log.type === 'LED' ? 'text-emerald-400' :
                      'text-slate-400'
                    }`}>
                      [{log.type}]
                    </span>
                    <span className="text-slate-300 break-words">{log.message}</span>
                  </div>
                ))
              )}
            </div>
          </div>

        </div>

      </div>

      {/* 4. PINOUT LOGIC MATRIX & LIVE ELECTRICAL TELEMETRY */}
      <div className="bg-[#090e1c] border border-slate-800 rounded-2xl p-4 shadow-xl space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-2.5">
          <div className="flex items-center gap-2">
            <Layers className="h-4.5 w-4.5 text-emerald-400" />
            <h3 className="text-xs font-mono font-bold text-slate-200">
              ARDUINO UNO PINOUT LOGIC & ELECTRICAL TELEMETRY MATRIX
            </h3>
          </div>
          <span className="text-[10px] font-mono text-slate-400">
            ATmega328P Hardware Port Mappings
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left font-mono text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-800 text-[10px] text-slate-400 uppercase tracking-wider bg-[#040711]">
                <th className="p-2">Pin</th>
                <th className="p-2">Direction</th>
                <th className="p-2">Connected Component</th>
                <th className="p-2">Circuit Role</th>
                <th className="p-2">Logic Level</th>
                <th className="p-2">Voltage</th>
                <th className="p-2">Live State</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-855/80 text-[11px]">
              
              {/* Pin D2 - PIR */}
              <tr className="hover:bg-slate-900/40 transition-colors">
                <td className="p-2 font-bold text-cyan-400">D2 (INT0)</td>
                <td className="p-2 text-slate-400">INPUT</td>
                <td className="p-2 text-slate-200 font-semibold">HC-SR501 PIR Sensor</td>
                <td className="p-2 text-slate-400">Motion Edge Interrupt</td>
                <td className="p-2">
                  <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                    pirStatus === 'MOTION DETECTED' ? 'bg-red-500/20 text-red-400' : 'bg-slate-900 text-slate-400'
                  }`}>
                    {pirStatus === 'MOTION DETECTED' ? 'HIGH' : 'LOW'}
                  </span>
                </td>
                <td className="p-2 text-slate-300">{pirStatus === 'MOTION DETECTED' ? '3.30V' : '0.00V'}</td>
                <td className="p-2">
                  <span className={pirStatus === 'MOTION DETECTED' ? 'text-red-400 font-bold' : 'text-emerald-400'}>
                    {pirStatus === 'MOTION DETECTED' ? 'MOTION DETECTED' : 'READY'}
                  </span>
                </td>
              </tr>

              {/* Pin A0 - LM35 */}
              <tr className="hover:bg-slate-900/40 transition-colors">
                <td className="p-2 font-bold text-yellow-400">A0 (ADC0)</td>
                <td className="p-2 text-slate-400">ANALOG IN</td>
                <td className="p-2 text-slate-200 font-semibold">LM35DZ Precision Sensor</td>
                <td className="p-2 text-slate-400">Thermal Signature (10mV/°C)</td>
                <td className="p-2 text-amber-300 font-bold">ADC: {(temperature * 10.23).toFixed(0)}</td>
                <td className="p-2 text-slate-300">{(temperature * 10).toFixed(0)} mV</td>
                <td className="p-2 text-amber-400 font-semibold">{temperature.toFixed(1)}°C</td>
              </tr>

              {/* Pin D9 - MOSFET 1 Siren */}
              <tr className="hover:bg-slate-900/40 transition-colors">
                <td className="p-2 font-bold text-red-400">D9 (PWM)</td>
                <td className="p-2 text-slate-400">OUTPUT</td>
                <td className="p-2 text-slate-200 font-semibold">IRLZ44N MOSFET #1 (Gate)</td>
                <td className="p-2 text-slate-400">Acoustic Siren Driver</td>
                <td className="p-2">
                  <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                    sirenActive ? 'bg-red-500/20 text-red-400' : 'bg-slate-900 text-slate-400'
                  }`}>
                    {sirenActive ? 'HIGH (PWM 255)' : 'LOW (0)'}
                  </span>
                </td>
                <td className="p-2 text-slate-300">{sirenActive ? '5.00V' : '0.00V'}</td>
                <td className="p-2">
                  <span className={sirenActive ? 'text-red-400 font-bold animate-pulse' : 'text-slate-500'}>
                    {sirenActive ? 'ACTIVE (118 dB)' : 'INACTIVE'}
                  </span>
                </td>
              </tr>

              {/* Pin D10 - MOSFET 2 Floodlight */}
              <tr className="hover:bg-slate-900/40 transition-colors">
                <td className="p-2 font-bold text-amber-400">D10 (PWM)</td>
                <td className="p-2 text-slate-400">OUTPUT</td>
                <td className="p-2 text-slate-200 font-semibold">IRLZ44N MOSFET #2 (Gate)</td>
                <td className="p-2 text-slate-400">High-Lux Strobe Light</td>
                <td className="p-2">
                  <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                    floodlightActive ? 'bg-amber-500/20 text-amber-300' : 'bg-slate-900 text-slate-400'
                  }`}>
                    {floodlightActive ? 'HIGH' : 'LOW'}
                  </span>
                </td>
                <td className="p-2 text-slate-300">{floodlightActive ? '5.00V' : '0.00V'}</td>
                <td className="p-2">
                  <span className={floodlightActive ? 'text-amber-400 font-bold' : 'text-slate-500'}>
                    {floodlightActive ? 'ACTIVE (1500 lm)' : 'INACTIVE'}
                  </span>
                </td>
              </tr>

              {/* Pin D7 - Relay Module Sprinkler */}
              <tr className="hover:bg-slate-900/40 transition-colors">
                <td className="p-2 font-bold text-blue-400">D7</td>
                <td className="p-2 text-slate-400">OUTPUT</td>
                <td className="p-2 text-slate-200 font-semibold">2-Channel Relay Module (IN1)</td>
                <td className="p-2 text-slate-400">Sprinkler Solenoid Valve</td>
                <td className="p-2">
                  <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                    relayEnergized ? 'bg-blue-500/20 text-blue-300' : 'bg-slate-900 text-slate-400'
                  }`}>
                    {relayEnergized ? 'LOW (Active Low)' : 'HIGH (Standby)'}
                  </span>
                </td>
                <td className="p-2 text-slate-300">{relayEnergized ? '0.00V' : '5.00V'}</td>
                <td className="p-2">
                  <span className={relayEnergized ? 'text-blue-400 font-bold' : 'text-slate-500'}>
                    {relayEnergized ? 'COIL ENERGIZED' : 'STANDBY'}
                  </span>
                </td>
              </tr>

              {/* Pin D6 - Green LED */}
              <tr className="hover:bg-slate-900/40 transition-colors">
                <td className="p-2 font-bold text-emerald-400">D6</td>
                <td className="p-2 text-slate-400">OUTPUT</td>
                <td className="p-2 text-slate-200 font-semibold">Green Status LED</td>
                <td className="p-2 text-slate-400">System Nominal Telemetry</td>
                <td className="p-2 text-emerald-400 font-bold">HIGH</td>
                <td className="p-2 text-slate-300">2.10V (after 200Ω)</td>
                <td className="p-2 text-emerald-400 font-semibold">ON</td>
              </tr>

              {/* Pin D5 - Red LED */}
              <tr className="hover:bg-slate-900/40 transition-colors">
                <td className="p-2 font-bold text-red-400">D5</td>
                <td className="p-2 text-slate-400">OUTPUT</td>
                <td className="p-2 text-slate-200 font-semibold">Red High-Risk LED</td>
                <td className="p-2 text-slate-400">Intrusion Actuation Indicator</td>
                <td className="p-2 text-slate-300">{redLed ? 'HIGH' : 'LOW'}</td>
                <td className="p-2 text-slate-300">{redLed ? '1.95V' : '0.00V'}</td>
                <td className="p-2 text-slate-300">{redLed ? <span className="text-red-400 font-bold">ON</span> : 'OFF'}</td>
              </tr>

              {/* Pin D4 - Yellow LED */}
              <tr className="hover:bg-slate-900/40 transition-colors">
                <td className="p-2 font-bold text-amber-400">D4</td>
                <td className="p-2 text-slate-400">OUTPUT</td>
                <td className="p-2 text-slate-200 font-semibold">Yellow Warning LED</td>
                <td className="p-2 text-slate-400">AI Decision Processing Indicator</td>
                <td className="p-2 text-slate-300">{yellowLed ? 'HIGH' : 'LOW'}</td>
                <td className="p-2 text-slate-300">{yellowLed ? '2.00V' : '0.00V'}</td>
                <td className="p-2 text-slate-300">{yellowLed ? <span className="text-amber-400 font-bold">ON</span> : 'OFF'}</td>
              </tr>

              {/* Pin D3 - Blue LED */}
              <tr className="hover:bg-slate-900/40 transition-colors">
                <td className="p-2 font-bold text-cyan-400">D3</td>
                <td className="p-2 text-slate-400">OUTPUT</td>
                <td className="p-2 text-slate-200 font-semibold">Blue Diagnostic LED</td>
                <td className="p-2 text-slate-400">Event Transmit & Gateway Link</td>
                <td className="p-2 text-slate-300">{blueLed ? 'HIGH' : 'LOW'}</td>
                <td className="p-2 text-slate-300">{blueLed ? '3.20V' : '0.00V'}</td>
                <td className="p-2 text-slate-300">{blueLed ? <span className="text-cyan-400 font-bold">ON</span> : 'OFF'}</td>
              </tr>

            </tbody>
          </table>
        </div>
      </div>

      {/* 5. ARCHITECTURAL AI INTEGRATION PIPELINE */}
      <div className="bg-[#090e1c] border border-slate-800 rounded-2xl p-5 shadow-xl space-y-3">
        <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
          <div className="flex items-center gap-2">
            <Radio className="h-4.5 w-4.5 text-cyan-400" />
            <h3 className="text-xs font-mono font-bold text-slate-200">
              CAMERA / AI BACKEND INTEGRATION ARCHITECTURE
            </h3>
          </div>
          <span className="text-[10px] font-mono text-emerald-400 font-semibold">
            ✓ WEBSOCKET / SERIAL / REST COMPATIBLE
          </span>
        </div>

        <p className="text-xs text-slate-400">
          The digital twin architecture is fully decouplable: in production, simulated button triggers can be replaced by real-time JSON packets streamed from the WildShield YOLOv11 inference service.
        </p>

        {/* Dataflow steps */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-2 pt-1 font-mono text-[10px] text-center">
          {[
            { step: "1. Camera Feed", icon: "📷", desc: "Edge RTSP Stream" },
            { step: "2. AI YOLOv11", icon: "🧠", desc: "Object Detection" },
            { step: "3. Species ID", icon: "🐗", desc: "Confidence Score" },
            { step: "4. Geofence", icon: "📐", desc: "Perimeter Distance" },
            { step: "5. Threat Assess", icon: "⚠️", desc: "Risk Calibration" },
            { step: "6. Decision Core", icon: "⚡", desc: "Deterrent Matrix" },
            { step: "7. MCU Command", icon: "🔌", desc: "Serial / MQTT" },
            { step: "8. Digital Twin", icon: "🖥️", desc: "Live Synced Visual" }
          ].map((item, idx) => (
            <div key={idx} className="bg-[#040711] border border-slate-800/80 rounded-xl p-2 flex flex-col items-center justify-center space-y-1">
              <span className="text-base">{item.icon}</span>
              <span className="font-bold text-slate-200 leading-tight">{item.step}</span>
              <span className="text-[8px] text-slate-500 leading-none">{item.desc}</span>
            </div>
          ))}
        </div>
      </div>

      {/* 6. MODAL FOR INSPECTING CLICKED COMPONENT DETAILS */}
      <AnimatePresence>
        {activeComponentModal && COMPONENT_DETAILS[activeComponentModal] && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-[#0b1329] border border-slate-700 rounded-2xl max-w-lg w-full p-5 shadow-2xl space-y-4 text-left font-sans"
            >
              <div className="flex items-start justify-between border-b border-slate-800 pb-3">
                <div>
                  <span className="text-[10px] font-mono text-emerald-400 font-bold uppercase tracking-wider">
                    {COMPONENT_DETAILS[activeComponentModal].category}
                  </span>
                  <h3 className="text-base font-bold text-slate-100 mt-0.5">
                    {COMPONENT_DETAILS[activeComponentModal].name}
                  </h3>
                </div>
                <button
                  onClick={() => setActiveComponentModal(null)}
                  className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 text-sm font-mono font-bold"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-2.5 font-mono text-xs">
                <div className="bg-[#040711] border border-slate-850 p-2.5 rounded-xl space-y-1">
                  <span className="text-[10px] text-slate-500 block">LIVE STATUS</span>
                  <span className={`font-bold ${COMPONENT_DETAILS[activeComponentModal].statusColor}`}>
                    {COMPONENT_DETAILS[activeComponentModal].currentStatus}
                  </span>
                </div>

                <div className="bg-[#040711] border border-slate-850 p-2.5 rounded-xl space-y-1">
                  <span className="text-[10px] text-slate-500 block">PIN CONNECTION & VOLTAGE</span>
                  <p className="text-slate-300 font-semibold">{COMPONENT_DETAILS[activeComponentModal].pins}</p>
                  <p className="text-slate-400 text-[11px]">{COMPONENT_DETAILS[activeComponentModal].voltage}</p>
                </div>

                <div className="bg-[#040711] border border-slate-850 p-2.5 rounded-xl space-y-1 font-sans text-xs">
                  <span className="text-[10px] font-mono text-slate-500 block">FUNCTIONAL DESCRIPTION</span>
                  <p className="text-slate-300 leading-relaxed">{COMPONENT_DETAILS[activeComponentModal].description}</p>
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  onClick={() => setActiveComponentModal(null)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-mono text-xs font-bold"
                >
                  Close Diagnostic
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
