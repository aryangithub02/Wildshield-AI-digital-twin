import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ShieldAlert, AlertTriangle, Radio, Wifi, CheckCircle2, 
  Cpu, Zap, Compass, Flame, Check, HelpCircle, 
  RefreshCw, TrendingUp, Info, Play, Clock, ArrowRight, Eye, AlertOctagon
} from 'lucide-react';
import { getTranslation } from '../utils/translations';
import { getSpeciesMetadataByName, SPECIES_TAXONOMY } from '../utils/speciesMapping';

export default function RightPanel({ simulationState, currentScenario, language }) {
  const t = (key) => getTranslation(language, key);
  
  // Crop state - Cotton, Rice, Sugarcane, Vegetables
  const [currentCrop, setCurrentCrop] = useState('Cotton');

  const activeScenario = currentScenario || {
    species: "Elephant",
    emoji: "🐘",
    threat: "HIGH",
    nodeId: 1,
    nodeName: "FN-1",
    confidenceBase: 96.2,
    confidenceMax: 98.4,
    actuators: { siren: true, floodlight: true, speaker: true, sprinkler: true },
    logThreat: "HIGH",
    path: []
  };

  const getSpeciesTranslated = (speciesName) => {
    if (!speciesName) return "N/A";
    if (speciesName === "Elephant") return t('elephant');
    if (speciesName === "Wild Boar") return t('wildBoar');
    if (speciesName === "Monkey" || speciesName === "Rhesus Macaque" || speciesName === "Langur") return t('monkey');
    if (speciesName === "Deer" || speciesName === "Spotted Deer") return t('deer');
    if (speciesName === "Nilgai") return t('nilgai');
    if (speciesName === "Cattle" || speciesName === "Stray Cattle") return t('strayCattle') || "Cattle";
    if (speciesName === "Goat") return "Goat";
    if (speciesName === "Gaur") return "Gaur";
    if (speciesName === "Human") return "Human";
    if (speciesName === "Vehicle") return "Vehicle";
    return speciesName;
  };

  const getThreatTranslated = (threatLevel) => {
    if (threatLevel === "HIGH" || threatLevel === "CRITICAL") return t('high').toUpperCase();
    if (threatLevel === "MEDIUM" || threatLevel === "WARNING") return t('medium').toUpperCase();
    return t('low').toUpperCase();
  };

  // 1. Knowledge Base-Driven Species Configuration
  const getSpeciesConfig = () => {
    const meta = getSpeciesMetadataByName(activeScenario.species);
    const sp = activeScenario.species;

    if (sp === "Elephant") {
      return {
        threatScore: 96,
        threatStatus: "CRITICAL",
        farmThreat: "🔴 High",
        threatColor: "text-red-500 bg-red-500/10 border-red-500/20",
        threatBg: "bg-red-600",
        damageCategory: "Massive crop consumption + fence destruction + village safety risk",
        activityPeriod: "Nocturnal & Crepuscular (Night fringe grazing)",
        socialBehavior: "Breeding matriarchal herds & solitary bulls",
        diet: "Sugarcane, banana, paddy, maize, cotton shoots",
        safetyRisk: "CRITICAL — Avoid loud sirens near villages to prevent herd panic stampede",
        count: 3,
        speed: "Walking",
        direction: "Forest Fringe",
        gpsZone: "North-East Boundary",
        matrixRowIndex: 0,
        learning: { visits: 12, successful: "Directional Flood Lights", successRate: 86, exitTime: 48 },
        reasons: [
          "Species identified as Elephant (WS-WL-EL).",
          `Crop configured as ${currentCrop}.`,
          currentCrop === "Cotton" ? "Sprinkler disabled to avoid cotton boll moisture damage." : "Sprinkler active for perimeter barrier.",
          "Village located within 200m of North Boundary.",
          "High-volume siren inhibited to avoid village-wide panic.",
          "Directional LED floodlights + targeted acoustic speaker engaged.",
          "Automatic Forest Department dispatch alert triggered."
        ],
        tree: [
          "What is it? → Elephant (WS-WL-EL)",
          "Where is it? → North-East Boundary (CAM-01)",
          "When is it active? → Nocturnal Fringe Window",
          "What is it doing? → Herd Transit towards Crops",
          "Is it inside Geofence? → BREACH DETECTED",
          `Crop Risk Assessment → High (${currentCrop})`,
          "Safe Response Selection → Directional Strobe + Forest Alert"
        ]
      };
    }

    if (sp === "Wild Boar") {
      return {
        threatScore: 92,
        threatStatus: "CRITICAL",
        farmThreat: "🔴 High",
        threatColor: "text-red-500 bg-red-500/10 border-red-500/20",
        threatBg: "bg-red-600",
        damageCategory: "Rooting tubers, soil excavation, grain consumption & repeat raids",
        activityPeriod: "Crepuscular / Nocturnal (Late evening & night peak)",
        socialBehavior: "Sounders (Females & young); Solitary mature males",
        diet: "Roots, tubers, standing grains, groundnuts, fallen fruit",
        safetyRisk: "Moderate — Aggressive if cornered with young",
        count: 5,
        speed: "Rooting / Foraging",
        direction: "North Boundary",
        gpsZone: "North-West Field",
        matrixRowIndex: 1,
        learning: { visits: 24, successful: "Predator Audio", successRate: 91, exitTime: 28 },
        reasons: [
          "Species identified as Wild Boar (WS-WL-WB).",
          `Crop configured as ${currentCrop}.`,
          "High threat: Major root/tuber destruction and soil excavation risk.",
          "Acoustic predator sound (tiger/leopard roar) selected.",
          "LED strobe lights activated in rapid flash mode.",
          currentCrop === "Cotton" ? "Sprinkler disabled (Cotton Crop Guard)." : "Sprinkler active (Water jet deterrent).",
          "Farmer alert pushed via mobile app."
        ],
        tree: [
          "What is it? → Wild Boar (WS-WL-WB)",
          "Where is it? → North-West Field (CAM-01)",
          "When is it active? → Nocturnal Foraging Window",
          "What is it doing? → Soil Rooting & Tuber Feeding",
          "Is it inside Geofence? → INTRUSION DETECTED",
          `Crop Risk Assessment → High Risk (${currentCrop})`,
          "Safe Response Selection → Siren + LED Floodlight"
        ]
      };
    }

    if (sp === "Nilgai") {
      return {
        threatScore: 84,
        threatStatus: "HIGH THREAT",
        farmThreat: "🔴 High",
        threatColor: "text-red-400 bg-red-500/10 border-red-500/20",
        threatBg: "bg-red-500",
        damageCategory: "Cereal & pulse crop loss + structural trampling + dung fouling",
        activityPeriod: "Early Morning (05:00-08:30) & Late Afternoon (16:30-19:30)",
        socialBehavior: "Herds (~10+ individuals); Acute vision & hearing",
        diet: "Herbivore (Grasses, cereals, pulses, vegetables, shoots)",
        safetyRisk: "Low–Medium — High flight distance; rapid escape",
        count: 1,
        speed: "Crop Grazing",
        direction: "Crop Center",
        gpsZone: "South-East Field",
        matrixRowIndex: 2,
        learning: { visits: 9, successful: "Floodlight + Alarm", successRate: 78, exitTime: 45 },
        reasons: [
          "Species identified as Nilgai / Blue Bull (WS-WL-NG).",
          `Crop configured as ${currentCrop}.`,
          "High threat: Major agricultural conflict species for cereals & pulses.",
          "Directional Floodlight + Acoustic Alarm engaged to deter large herbivore.",
          "Farmer app notification dispatched with GPS vector."
        ],
        tree: [
          "What is it? → Nilgai (WS-WL-NG)",
          "Where is it? → South-East Field (CAM-03)",
          "When is it active? → Peak Feeding Window",
          "What is it doing? → Cereal & Pulse Crop Grazing",
          "Is it inside Geofence? → INTRUSION DETECTED",
          `Crop Risk Assessment → High (${currentCrop})`,
          "Safe Response Selection → Floodlight + Alarm"
        ]
      };
    }

    if (sp === "Spotted Deer" || sp === "Deer") {
      return {
        threatScore: 58,
        threatStatus: "WARNING",
        farmThreat: "🟠 Medium",
        threatColor: "text-amber-500 bg-amber-500/10 border-amber-500/20",
        threatBg: "bg-amber-500",
        damageCategory: "Herbaceous grazing loss + young shoot consumption",
        activityPeriod: "Crepuscular / Variable daytime foraging",
        socialBehavior: "Herd-forming (Female-young groups & bachelor herds)",
        diet: "Grasses, tender crop shoots, flowers, fallen fruits",
        safetyRisk: "Low — Panic stampede risk if loud siren triggered",
        count: 2,
        speed: "Grazing",
        direction: "River Edge",
        gpsZone: "South Field",
        matrixRowIndex: 3,
        learning: { visits: 18, successful: "Soft Flash Lights", successRate: 83, exitTime: 35 },
        reasons: [
          "Species identified as Spotted Deer (WS-WL-SD).",
          `Crop configured as ${currentCrop}.`,
          "Medium threat: Young shoot grazing risk.",
          "Soft Floodlight + Low-Frequency Alarm active (Bypassing loud siren).",
          "Farmer alert logged in telemetry history."
        ],
        tree: [
          "What is it? → Spotted Deer (WS-WL-SD)",
          "Where is it? → South Field (CAM-04)",
          "When is it active? → Crepuscular Window",
          "What is it doing? → Herbaceous Shoot Grazing",
          "Is it inside Geofence? → PERIMETER BREACH",
          `Crop Risk Assessment → Moderate (${currentCrop})`,
          "Safe Response Selection → Soft Floodlight + Alarm"
        ]
      };
    }

    if (sp === "Rhesus Macaque" || sp === "Monkey") {
      return {
        threatScore: 82,
        threatStatus: "HIGH THREAT",
        farmThreat: "🔴 High",
        threatColor: "text-red-400 bg-red-500/10 border-red-500/20",
        threatBg: "bg-red-500",
        damageCategory: "Orchard fruit loss + vegetable destruction + stem breaking",
        activityPeriod: "Diurnal (Full daylight orchard raiding)",
        socialBehavior: "Multi-male, multi-female troops with sentinel scouts",
        diet: "Fruits, vegetables, tubers, seeds, tender crop leaves",
        safetyRisk: "Moderate — Intimidation display when in large troops",
        count: 8,
        speed: "Agile Canopy Raid",
        direction: "Tree Line",
        gpsZone: "East Field",
        matrixRowIndex: 4,
        learning: { visits: 45, successful: "Monkey Distress Call", successRate: 79, exitTime: 15 },
        reasons: [
          "Species identified as Rhesus Macaque (WS-WL-RM).",
          `Crop configured as ${currentCrop}.`,
          "High waste ratio: Fruit plucking and branch breaking.",
          "Sprinkler pulse + Primate distress call broadcasted.",
          "Farmer notified of troop intrusion."
        ],
        tree: [
          "What is it? → Rhesus Macaque (WS-WL-RM)",
          "Where is it? → East Field Canopy (CAM-02)",
          "When is it active? → Diurnal Daylight Window",
          "What is it doing? → Orchard & Fruit Plucking Raid",
          "Is it inside Geofence? → ACTIVE TROOP INTRUSION",
          `Crop Risk Assessment → High (${currentCrop})`,
          "Safe Response Selection → Sprinkler Pulse + Distress Call"
        ]
      };
    }

    if (sp === "Langur") {
      return {
        threatScore: 65,
        threatStatus: "MODERATE",
        farmThreat: "🟠 Medium–High",
        threatColor: "text-amber-400 bg-amber-500/10 border-amber-500/20",
        threatBg: "bg-amber-500",
        damageCategory: "Leaf stripping, blossom damage, canopy fruit consumption",
        activityPeriod: "Diurnal (Morning & late afternoon summer peaks)",
        socialBehavior: "Social troops (10 to 50+ individuals)",
        diet: "Leaves, blossoms, wild fruits, tender pods",
        safetyRisk: "Low — High agility, retreats into upper canopy",
        count: 6,
        speed: "Canopy Transit",
        direction: "Perimeter Trees",
        gpsZone: "North-West Field",
        matrixRowIndex: 5,
        learning: { visits: 14, successful: "Visual Strobe Flash", successRate: 82, exitTime: 18 },
        reasons: [
          "Species identified as Langur (WS-WL-LG).",
          `Crop configured as ${currentCrop}.`,
          "Overhead sprinkler pulse + Visual strobe flash engaged.",
          "Safe non-contact deterrent for arboreal primates."
        ],
        tree: [
          "What is it? → Langur (WS-WL-LG)",
          "Where is it? → North-West Tree Buffer",
          "When is it active? → Diurnal Window",
          "What is it doing? → Leaf & Blossom Foraging",
          "Is it inside Geofence? → CANOPY BREACH",
          `Crop Risk Assessment → Moderate (${currentCrop})`,
          "Safe Response Selection → Visual Flash + Sprinkler"
        ]
      };
    }

    if (sp === "Gaur") {
      return {
        threatScore: 98,
        threatStatus: "CRITICAL",
        farmThreat: "🔴 Very High",
        threatColor: "text-red-500 bg-red-500/10 border-red-500/20",
        threatBg: "bg-red-600",
        damageCategory: "Massive biomass consumption + fence flattening + extreme safety risk",
        activityPeriod: "Morning / Evening feeding; Nocturnal in disturbed buffers",
        socialBehavior: "Massive bovine weight (600–1000 kg); Dominant herds",
        diet: "Coarse grasses, bamboo shoots, agricultural foliage",
        safetyRisk: "EXTREME — Do NOT approach, corner, or chase. High hazard to human life",
        count: 1,
        speed: "Approaching",
        direction: "Forest Edge",
        gpsZone: "North Field",
        matrixRowIndex: 6,
        learning: { visits: 5, successful: "Non-Contact Siren", successRate: 90, exitTime: 30 },
        reasons: [
          "Species identified as Gaur / Indian Bison (WS-WL-GR).",
          `Crop configured as ${currentCrop}.`,
          "CRITICAL SAFETY RULE: Non-contact deterrence only.",
          "Do NOT approach or corner the animal.",
          "Automatic emergency alert sent to Forest Department & Farmer Hub."
        ],
        tree: [
          "What is it? → Gaur / Indian Bison (WS-WL-GR)",
          "Where is it? → North Field Buffer (CAM-01)",
          "When is it active? → Evening Feeding Window",
          "What is it doing? → Heavy Biomass Grazing",
          "Is it inside Geofence? → MEGAFAUNA INTRUSION",
          "Human Safety Risk → EXTREME (Do NOT approach)",
          "Safe Response Selection → Non-Contact Strobe + Forest Alert"
        ]
      };
    }

    if (sp === "Cattle" || sp === "Stray Cattle") {
      return {
        threatScore: 28,
        threatStatus: "LOW THREAT",
        farmThreat: "🟡 Medium (Domestic)",
        threatColor: "text-green-500 bg-green-500/10 border-green-500/20",
        threatBg: "bg-green-500",
        damageCategory: "Casual grazing on young foliage + minor boundary trampling",
        activityPeriod: "Mostly daytime grazing & resting",
        socialBehavior: "Domestic livestock (Escaped or stray village herd)",
        diet: "Herbivore (Grasses, crop leaves, stubble)",
        safetyRisk: "Negligible — Docile domestic livestock",
        count: 2,
        speed: "Grazing",
        direction: "Farm Path",
        gpsZone: "South-West Field",
        matrixRowIndex: 7,
        learning: { visits: 31, successful: "Sprinkler / Warning", successRate: 75, exitTime: 90 },
        reasons: [
          "Species identified as Domestic Cattle (WS-DM-CT).",
          `Crop configured as ${currentCrop}.`,
          "Domestic discrimination: Safe non-hostile deterrent.",
          "Aggressive predator siren & forest alerts inhibited.",
          "Low-intensity sprinkler / warning buzzer active.",
          "Farmer notified for routine boundary check."
        ],
        tree: [
          "What is it? → Domestic Cattle (WS-DM-CT)",
          "Where is it? → South-West Farm Path (CAM-04)",
          "When is it active? → Daytime Grazing Window",
          "What is it doing? → Boundary Foliage Grazing",
          "Is it inside Geofence? → LIVESTOCK MONITORED",
          "Domestic Discrimination → True (Siren Bypassed)",
          "Safe Response Selection → Sprinkler Pulse / Warning Buzzer"
        ]
      };
    }

    if (sp === "Goat") {
      return {
        threatScore: 20,
        threatStatus: "LOW THREAT",
        farmThreat: "🟢 Low–Med (Domestic)",
        threatColor: "text-green-500 bg-green-500/10 border-green-500/20",
        threatBg: "bg-green-500",
        damageCategory: "Seedling browsing + young leaf consumption",
        activityPeriod: "Daytime grazing & browsing",
        socialBehavior: "Domestic herd-forming browsers",
        diet: "Shrubs, leaves, young crop seedlings",
        safetyRisk: "Negligible",
        count: 3,
        speed: "Grazing",
        direction: "Boundary Fence",
        gpsZone: "West Field",
        matrixRowIndex: 8,
        learning: { visits: 15, successful: "Warning Buzzer", successRate: 85, exitTime: 20 },
        reasons: [
          "Species identified as Domestic Goat (WS-DM-GT).",
          `Crop configured as ${currentCrop}.`,
          "Domestic discrimination: Low threat level.",
          "Safe non-hostile local warning beep engaged.",
          "Farmer notified for herd retrieval."
        ],
        tree: [
          "What is it? → Domestic Goat (WS-DM-GT)",
          "Where is it? → West Boundary Fence (CAM-05)",
          "When is it active? → Daytime Browsing",
          "What is it doing? → Seedling Browsing",
          "Is it inside Geofence? → LIVESTOCK MONITORED",
          "Domestic Discrimination → True (Low Threat)",
          "Safe Response Selection → Warning Audio Beep"
        ]
      };
    }

    if (sp === "Human") {
      return {
        threatScore: 15,
        threatStatus: "ALERT ONLY",
        farmThreat: "⚠️ Context-dependent",
        threatColor: "text-blue-400 bg-blue-500/10 border-blue-500/20",
        threatBg: "bg-blue-500",
        damageCategory: "Safety monitoring + false positive mitigation",
        activityPeriod: "Day / Night (Farmers, workers, researchers)",
        socialBehavior: "Individual or working group",
        diet: "N/A",
        safetyRisk: "CRITICAL SAFETY RULE: Automated wildlife deterrents are INHIBITED",
        count: 1,
        speed: "Walking",
        direction: "Perimeter Trail",
        gpsZone: "Farm Entrance",
        matrixRowIndex: 9,
        learning: { visits: 50, successful: "Notification Log", successRate: 100, exitTime: 60 },
        reasons: [
          "Entity identified as Human (WS-HM-HU).",
          "CRITICAL SAFETY RULE: Wildlife deterrents automatically inhibited.",
          "Telemetry logged with timestamp for perimeter safety audit.",
          "App push notification sent to farm manager."
        ],
        tree: [
          "What is it? → Human (WS-HM-HU)",
          "Where is it? → Farm Entrance (CAM-01)",
          "Safety Context Check → Farm Worker / Person",
          "Wildlife Deterrence → STRICTLY INHIBITED",
          "Telemetry Event → Logged with Timestamp",
          "Response Selection → Silent App Notification"
        ]
      };
    }

    // Default Fallback
    return {
      threatScore: 10,
      threatStatus: "STABLE",
      farmThreat: "🟡 Monitored",
      threatColor: "text-slate-500 bg-slate-500/10 border-slate-500/20",
      threatBg: "bg-slate-500",
      damageCategory: "Perimeter monitoring",
      activityPeriod: "Variable",
      socialBehavior: "Standard",
      diet: "N/A",
      safetyRisk: "Standard caution",
      count: 0,
      speed: "N/A",
      direction: "N/A",
      gpsZone: "Perimeter Boundary",
      matrixRowIndex: -1,
      learning: { visits: 0, successful: "None", successRate: 0, exitTime: 0 },
      reasons: ["Scanning perimeter... No active wildlife threat detected."],
      tree: ["Perimeter Scan", "All Clear"]
    };
  };

  const specConfig = getSpeciesConfig();

  // 2. Animated confidence counter
  const [animatedConfidence, setAnimatedConfidence] = useState(0);
  useEffect(() => {
    if (simulationState >= 1 || activeScenario?.confidenceBase) {
      let start = 0;
      const end = activeScenario.confidenceBase || activeScenario.confidenceMax || 96.0;
      const duration = 800; // ms
      const stepTime = Math.max(10, Math.floor(duration / end));
      
      const timer = setInterval(() => {
        start += 2;
        if (start >= end) {
          setAnimatedConfidence(end);
          clearInterval(timer);
        } else {
          setAnimatedConfidence(parseFloat(start.toFixed(1)));
        }
      }, stepTime);
      return () => clearInterval(timer);
    } else {
      setAnimatedConfidence(0);
    }
  }, [simulationState, activeScenario?.species, activeScenario?.confidenceBase]);

  // 3. Actuators states mapping based on Species + Crop
  const getActuatorState = (actuator) => {
    const isLiveDetected = simulationState >= 1 || activeScenario?.confidenceBase;
    if (!isLiveDetected) return { state: "OFF", color: "bg-slate-800 text-slate-400" };
    
    // Crop-Aware Sprinkler override
    if (actuator === "Sprinkler") {
      if (currentCrop === "Cotton") {
        return { state: "DISABLED", color: "bg-red-500/10 border border-red-500/30 text-red-500 font-bold" };
      }
      const usesSprinkler = activeScenario.actuators?.sprinkler || activeScenario.species === "Elephant" || activeScenario.species === "Rhesus Macaque" || activeScenario.species === "Langur" || activeScenario.species === "Cattle";
      return usesSprinkler 
        ? { state: "ON", color: "bg-green-500 text-slate-950 font-bold" }
        : { state: "OFF", color: "bg-slate-800 text-slate-400" };
    }

    if (actuator === "Floodlights") {
      const usesFlood = activeScenario.actuators?.floodlight || activeScenario.species === "Elephant" || activeScenario.species === "Wild Boar" || activeScenario.species === "Nilgai" || activeScenario.species === "Spotted Deer" || activeScenario.species === "Gaur";
      return usesFlood
        ? { state: "ON", color: "bg-green-500 text-slate-950 font-bold" }
        : { state: "OFF", color: "bg-slate-800 text-slate-400" };
    }

    if (actuator === "Speaker") {
      const usesSpeaker = activeScenario.actuators?.speaker || activeScenario.species === "Elephant" || activeScenario.species === "Wild Boar" || activeScenario.species === "Nilgai" || activeScenario.species === "Rhesus Macaque" || activeScenario.species === "Gaur";
      return usesSpeaker
        ? { state: "ON", color: "bg-green-500 text-slate-950 font-bold" }
        : { state: "OFF", color: "bg-slate-800 text-slate-400" };
    }

    if (actuator === "ForestAlert") {
      return (activeScenario.species === "Elephant" || activeScenario.species === "Gaur")
        ? { state: "SENT", color: "bg-blue-500 text-white font-bold" }
        : { state: "OFF", color: "bg-slate-800 text-slate-400" };
    }

    if (actuator === "FarmerAlert") {
      return { state: "SENT", color: "bg-blue-500 text-white font-bold" };
    }

    if (actuator === "CameraTracking") {
      return { state: "ACTIVE", color: "bg-blue-500 text-white font-bold" };
    }

    return { state: "OFF", color: "bg-slate-800 text-slate-400" };
  };

  // Matrix data for Section 5 (from WII Animal Behaviour & Farm Impact Knowledge Base)
  const matrixData = [
    { species: "Wild Boar", code: "WS-WL-WB", emoji: "🐗", threat: "🔴 High", primary: "Siren + LED Floodlight", secondary: "Predator Roar Audio", reason: "Rooting soil & tubers, repeat raiding" },
    { species: "Nilgai", code: "WS-WL-NG", emoji: "🐂", threat: "🔴 High", primary: "Directional Floodlight", secondary: "Acoustic Alarm", reason: "Cereal/pulse grazing + trampling" },
    { species: "Spotted Deer", code: "WS-WL-SD", emoji: "🦌", threat: "🟠 Medium", primary: "Soft Floodlight", secondary: "Low-Frequency Alarm", reason: "Shoot grazing (Avoid siren panic)" },
    { species: "Rhesus Macaque", code: "WS-WL-RM", emoji: "🐒", threat: "🔴 High", primary: "Smart Sprinkler Pulse", secondary: "Primate Distress Call", reason: "Fruit plucking, branch breaking" },
    { species: "Langur", code: "WS-WL-LG", emoji: "🐒", threat: "🟠 Med–High", primary: "Overhead Sprinkler", secondary: "Visual Strobe Flash", reason: "Leaf stripping & blossom damage" },
    { species: "Gaur", code: "WS-WL-GR", emoji: "🦬", threat: "🔴 Very High", primary: "Non-Contact Strobe", secondary: "Forest Dept Alert", reason: "Extreme safety hazard (Do NOT approach)" },
    { species: "Cattle", code: "WS-DM-CT", emoji: "🐄", threat: "🟡 Medium", primary: "Water Sprinkler Pulse", secondary: "Warning Buzzer", reason: "Livestock control (Siren inhibit)" },
    { species: "Goat", code: "WS-DM-GT", emoji: "🐐", threat: "🟢 Low–Med", primary: "Local Beep Buzzer", secondary: "Farmer App Check", reason: "Seedling browsing" },
    { species: "Human", code: "WS-HM-HU", emoji: "🚶", threat: "⚠️ Context", primary: "Telemetry Logging", secondary: "Silent App Alert", reason: "Safety rule: Deterrents INHIBITED" },
    { species: "Elephant", code: "WS-WL-EL", emoji: "🐘", threat: "🔴 High", primary: "Directional Floodlight", secondary: "Directional Speaker", reason: "Paddy/Sugarcane (Avoid village siren)" }
  ];

  return (
    <aside className="w-[400px] bg-[#090d16]/95 border-l border-slate-900 flex flex-col fixed top-16 right-0 bottom-0 z-30 p-4 space-y-4 overflow-y-auto select-none backdrop-blur-md">
      
      {/* BRAND HEADER */}
      <div className="flex items-center justify-between border-b border-slate-900 pb-3">
        <div className="flex items-center gap-2">
          <Cpu className="h-4.5 w-4.5 text-green-500" />
          <h2 className="text-sm font-black text-slate-100 tracking-wider font-sans uppercase">
            AI DECISION ENGINE
          </h2>
        </div>
        <span className="text-[8px] font-mono font-bold text-green-500 bg-green-500/10 px-1.5 py-0.5 rounded border border-green-500/20">
          V11.2 INF
        </span>
      </div>

      {/* CROP CONFIGURATION SELECTOR DROPDOWN */}
      <div className="bg-[#111827]/40 border border-slate-900/60 rounded-xl p-3 space-y-2">
        <div className="flex justify-between items-center text-[10px] font-mono">
          <span className="text-slate-400 uppercase font-bold">Crop Configuration</span>
          <span className="text-[8px] text-green-500">Live Feedback</span>
        </div>
        <div className="relative">
          <select
            value={currentCrop}
            onChange={(e) => setCurrentCrop(e.target.value)}
            className="w-full bg-[#030712] border border-slate-800 rounded-lg py-1.5 px-3 text-xs font-semibold text-slate-100 font-sans focus:outline-none focus:border-green-500 cursor-pointer"
          >
            <option value="Cotton">Cotton (High Sensitivity - Sprinkler Guard)</option>
            <option value="Rice">Rice (Low Sensitivity - Water OK)</option>
            <option value="Sugarcane">Sugarcane (Medium Sensitivity - Water OK)</option>
            <option value="Vegetables">Vegetables (High Sensitivity - Water OK)</option>
          </select>
        </div>
      </div>

      {/* SECTION 1: CURRENT DETECTION */}
      <div className="bg-[#111827]/40 border border-slate-900/60 rounded-xl p-3 space-y-3">
        <div className="text-[10px] font-bold font-sans text-slate-400 uppercase tracking-wider border-b border-slate-900 pb-1.5 flex justify-between items-center">
          <span>Current Detection</span>
          {(simulationState >= 1 || activeScenario?.confidenceBase) && (
            (activeScenario.threat === "HIGH" || activeScenario.threat === "CRITICAL" || activeScenario.threat === "MEDIUM" || activeScenario.threat === "WARNING" || activeScenario.threat === "ALERT") ? (
              <span className="flex items-center gap-1 text-[8px] font-mono text-red-500 animate-pulse font-bold">
                <span className="h-1.5 w-1.5 rounded-full bg-red-500" />
                BREACH DETECTED
              </span>
            ) : (
              <span className="flex items-center gap-1 text-[8px] font-mono text-green-400 font-bold bg-green-500/10 px-1.5 py-0.5 rounded border border-green-500/20">
                <span className="h-1.5 w-1.5 rounded-full bg-green-400" />
                LIVESTOCK / DOMESTIC
              </span>
            )
          )}
        </div>

        {(simulationState >= 1 || activeScenario?.confidenceBase) ? (
          <div className="flex gap-3">
            {/* Image / Bounding Box viewport */}
            <div className="relative w-24 h-24 bg-slate-950 rounded-lg border border-slate-900 overflow-hidden flex items-center justify-center shrink-0 crt-overlay">
              {(activeScenario.threat === "HIGH" || activeScenario.threat === "CRITICAL" || activeScenario.threat === "MEDIUM" || activeScenario.threat === "WARNING") ? (
                <motion.div
                  initial={{ scale: 1.1, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="absolute inset-1.5 border-2 border-red-500 rounded-md pointer-events-none z-10"
                />
              ) : (
                <div className="absolute inset-1.5 border-2 border-green-500/80 rounded-md pointer-events-none z-10" />
              )}
              {/* Animal Photo with Bounding Box Overlay */}
              <img
                src={
                  activeScenario.image || (
                    activeScenario.species === "Elephant" ? "/christoffer-brus-7hGF4emWkXs-unsplash.jpg" :
                    activeScenario.species === "Wild Boar" ? "/ed-van-duijn-414NZVxzc20-unsplash.jpg" :
                    (activeScenario.species === "Cattle" || activeScenario.species === "Stray Cattle") ? "https://images.unsplash.com/photo-1570042225831-d98fa7577f1e?q=80&w=300&auto=format&fit=crop" :
                    (activeScenario.species === "Deer" || activeScenario.species === "Spotted Deer") ? "https://images.unsplash.com/photo-1484406566174-9da000fda645?q=80&w=300&auto=format&fit=crop" :
                    activeScenario.species === "Nilgai" ? "https://images.unsplash.com/photo-1589656966895-2f33e7653819?q=80&w=300&auto=format&fit=crop" :
                    activeScenario.species === "Goat" ? "https://images.unsplash.com/photo-1524024973431-2ad916746881?q=80&w=300&auto=format&fit=crop" :
                    (activeScenario.species === "Monkey" || activeScenario.species === "Rhesus Macaque" || activeScenario.species === "Langur") ? "https://images.unsplash.com/photo-1540573133985-87b6da6d54a9?q=80&w=300&auto=format&fit=crop" :
                    activeScenario.species === "Gaur" ? "https://images.unsplash.com/photo-1553531384-cc64ac80f931?q=80&w=300&auto=format&fit=crop" :
                    "/ed-van-duijn-414NZVxzc20-unsplash.jpg"
                  )
                }
                alt={activeScenario.species}
                className="w-full h-full object-cover filter brightness-[0.85] contrast-[1.1]"
              />
              <span className="absolute bottom-1 right-1 text-xs select-none z-10 filter drop-shadow">
                {activeScenario.emoji}
              </span>
            </div>

            {/* Info Grid */}
            <div className="flex-1 min-w-0 text-[10px] font-mono space-y-1 text-left">
              <div className="flex justify-between">
                <span className="text-slate-500">Species:</span>
                <span className="text-slate-200 font-sans font-bold">{getSpeciesTranslated(activeScenario.species)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Confidence:</span>
                <span className="text-green-500 font-bold">
                  {activeScenario.confidenceBase ? `${activeScenario.confidenceBase}%` : (simulationState >= 1 ? `${animatedConfidence}%` : "0%")}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Camera:</span>
                <span className="text-slate-300">{activeScenario.nodeName || `CAM-0${activeScenario.nodeId}`}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Distance:</span>
                <span className="text-slate-300">
                  {`${Math.max(12, specConfig.threatScore - 40)} meters`}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Direction:</span>
                <span className="text-slate-300">{specConfig.direction}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Timestamp:</span>
                <span className="text-slate-400">{activeScenario.timestamp || "10:23:15 PM"}</span>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-6 text-slate-500 font-mono text-[10px] italic">
            Scanning perimeter... No breach active.
          </div>
        )}
      </div>

      {/* SECTION 2: THREAT ANALYSIS (Knowledge-Base Enriched) */}
      <div className="bg-[#111827]/40 border border-slate-900/60 rounded-xl p-3 space-y-3 text-left">
        <div className="text-[10px] font-bold font-sans text-slate-400 uppercase tracking-wider border-b border-slate-900 pb-1.5 flex justify-between items-center">
          <span>Threat & Impact Analysis</span>
          <span className="text-[8px] font-mono text-slate-400">{specConfig.farmThreat}</span>
        </div>
        {(simulationState >= 1 || activeScenario?.confidenceBase) ? (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono text-slate-400">Threat Index:</span>
              <span className={`text-[10px] font-bold font-mono px-2 py-0.5 rounded border ${specConfig.threatColor}`}>
                {specConfig.threatStatus} ({specConfig.threatScore}/100)
              </span>
            </div>
            {/* Animated gauge bar filling up */}
            <div className="h-2 w-full bg-slate-950 rounded-full overflow-hidden">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${specConfig.threatScore}%` }}
                transition={{ duration: 1, ease: "easeOut" }}
                className={`h-full rounded-full ${specConfig.threatBg}`}
              />
            </div>

            {/* Farm Impact & Safety Caution */}
            <div className="bg-slate-950/70 border border-slate-900 rounded p-2 text-[9px] font-mono space-y-1">
              <div className="text-slate-400">
                <strong className="text-slate-300">Farm Damage Risk:</strong> {specConfig.damageCategory}
              </div>
              {specConfig.safetyRisk && (
                <div className="text-amber-400/90 flex items-start gap-1 pt-0.5 border-t border-slate-900">
                  <AlertOctagon className="h-3 w-3 shrink-0 text-amber-400 mt-0.5" />
                  <span><strong>Safety Protocol:</strong> {specConfig.safetyRisk}</span>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="text-center py-2 text-slate-500 font-mono text-[10px] italic">
            Monitoring threat parameters...
          </div>
        )}
      </div>

      {/* SECTION 3: CONTEXT ANALYSIS (Knowledge-Base Enriched) */}
      <div className="bg-[#111827]/40 border border-slate-900/60 rounded-xl p-3 space-y-3 text-left">
        <div className="text-[10px] font-bold font-sans text-slate-400 uppercase tracking-wider border-b border-slate-900 pb-1.5">
          Context & Animal Behaviour
        </div>
        {(simulationState >= 1 || activeScenario?.confidenceBase) ? (
          <div className="space-y-1.5 text-[9px] font-mono">
            <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-slate-300">
              <div><span className="text-slate-500">Current Crop:</span> <span className="text-slate-200">{currentCrop}</span></div>
              <div><span className="text-slate-500">Crop Sensitivity:</span> <span className="text-slate-200">{currentCrop === 'Cotton' ? 'High (Sprinkler Guard)' : 'Medium'}</span></div>
              <div><span className="text-slate-500">Active Window:</span> <span className="text-slate-200">{specConfig.activityPeriod}</span></div>
              <div><span className="text-slate-500">Social Group:</span> <span className="text-slate-200">{specConfig.socialBehavior}</span></div>
              <div><span className="text-slate-500">Diet / Foraging:</span> <span className="text-slate-200">{specConfig.diet}</span></div>
              <div><span className="text-slate-500">Farm Zone:</span> <span className="text-slate-300 font-bold">{specConfig.gpsZone}</span></div>
            </div>
          </div>
        ) : (
          <div className="text-center py-2 text-slate-500 font-mono text-[10px] italic">
            Awaiting environmental context...
          </div>
        )}
      </div>

      {/* SECTION 4: DECISION REASONING TREE (7-Step Cognitive Chain) */}
      <div className="bg-[#111827]/40 border border-slate-900/60 rounded-xl p-3 space-y-3 text-left">
        <div className="text-[10px] font-bold font-sans text-slate-400 uppercase tracking-wider border-b border-slate-900 pb-1.5 flex justify-between items-center">
          <span>Decision Reasoning Tree</span>
          <span className="text-[8px] font-mono text-slate-500">7-Step Cognitive Chain</span>
        </div>
        {(simulationState >= 1 || activeScenario?.confidenceBase) ? (
          <div className="space-y-1">
            {specConfig.tree.map((step, index) => (
              <motion.div
                key={step}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.2 }}
                className="flex items-center gap-1.5 text-[9px] font-mono text-slate-400"
              >
                {index > 0 && <span className="text-slate-600 pl-2">↳</span>}
                <span className={`px-1.5 py-0.5 rounded border leading-none ${
                  index === 0 ? "bg-slate-950 border-slate-900 text-slate-300 font-bold" :
                  step.includes("Threat") || step.includes("BREACH") || step.includes("CRITICAL") ? "bg-red-500/10 border-red-500/20 text-red-400 font-bold" :
                  step.includes("Crop") || step.includes("Geofence") ? "bg-blue-500/10 border-blue-500/20 text-blue-400 font-bold" :
                  step.includes("Disabled") || step.includes("Avoid") || step.includes("INHIBITED") ? "bg-amber-500/10 border border-amber-500/20 text-amber-400 font-extrabold" :
                  step.includes("Notify") || step.includes("Alert") || step.includes("Selection") ? "bg-green-500/10 border-green-500/20 text-green-400" :
                  "bg-slate-900/60 border-slate-800 text-slate-300"
                }`}>
                  {step}
                </span>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="text-center py-2 text-slate-500 font-mono text-[10px] italic">
            Tree idle.
          </div>
        )}
      </div>

      {/* SECTION 5: SPECIES SPECIFIC DECISION MATRIX */}
      <div className="bg-[#111827]/40 border border-slate-900/60 rounded-xl p-3 space-y-3">
        <div className="text-[10px] font-bold font-sans text-slate-400 uppercase tracking-wider border-b border-slate-900 pb-1.5 flex justify-between items-center">
          <span>Species Decision Matrix</span>
          <span className="text-[8px] font-mono text-slate-500">WII Literature Taxonomy</span>
        </div>
        <div className="overflow-x-auto text-[8px] font-mono max-h-[220px] overflow-y-auto pr-1">
          <table className="w-full text-left">
            <thead>
              <tr className="text-slate-500 border-b border-slate-900 h-6">
                <th>Species</th>
                <th>Threat</th>
                <th>Primary</th>
                <th>Secondary</th>
                <th>Farm Reason</th>
              </tr>
            </thead>
            <tbody>
              {matrixData.map((row, index) => {
                const isHighlighted = (activeScenario.species === row.species || activeScenario.code === row.code) && (simulationState >= 1 || activeScenario?.confidenceBase);
                return (
                  <tr 
                    key={index} 
                    className={`border-b border-slate-900/70 h-7.5 transition-all duration-300 ${
                      isHighlighted 
                        ? 'bg-green-500/10 border-green-500/30 text-green-400 font-bold' 
                        : 'text-slate-400 hover:bg-slate-900/30'
                    }`}
                  >
                    <td className="whitespace-nowrap font-sans font-semibold text-slate-200">
                      {row.emoji} {row.species}
                    </td>
                    <td className="whitespace-nowrap">{row.threat}</td>
                    <td className="whitespace-nowrap">{row.primary}</td>
                    <td className="whitespace-nowrap">{row.secondary}</td>
                    <td className="text-slate-400">{row.reason}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* SECTION 6: DETERRENT EXECUTION */}
      <div className="bg-[#111827]/40 border border-slate-900/60 rounded-xl p-3 space-y-3">
        <div className="text-[10px] font-bold font-sans text-slate-400 uppercase tracking-wider border-b border-slate-900 pb-1.5">
          Deterrent Execution
        </div>
        <div className="grid grid-cols-2 gap-3">
          {[
            { label: "Flood Lights", key: "Floodlights" },
            { label: "Speaker", key: "Speaker" },
            { label: "Sprinkler", key: "Sprinkler" },
            { label: "Forest Alert", key: "ForestAlert" },
            { label: "Farmer Alert", key: "FarmerAlert" },
            { label: "Camera Tracking", key: "CameraTracking" }
          ].map((item) => {
            const status = getActuatorState(item.key);
            return (
              <div 
                key={item.key}
                className="bg-slate-950/60 border border-slate-900 rounded-lg p-2 flex flex-col justify-between h-14 text-left"
              >
                <span className="text-[9px] font-mono text-slate-500">{item.label}</span>
                <div className="flex justify-between items-center">
                  <span className={`px-1.5 py-0.5 rounded text-[8px] font-extrabold uppercase ${status.color}`}>
                    {status.state}
                  </span>
                  {/* Small animated indicator */}
                  {status.state === "ON" || status.state === "ACTIVE" ? (
                    <span className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />
                  ) : status.state === "SENT" ? (
                    <Check className="h-3 w-3 text-blue-500" />
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* SECTION 7: WHY DID AI CHOOSE THIS RESPONSE? */}
      <div className="bg-[#111827]/40 border border-slate-900/60 rounded-xl p-3 space-y-3 text-left">
        <div className="text-[10px] font-bold font-sans text-slate-400 uppercase tracking-wider border-b border-slate-900 pb-1.5">
          Why Did AI Choose This Response?
        </div>
        {(simulationState >= 1 || activeScenario?.confidenceBase) ? (
          <div className="space-y-1.5">
            {specConfig.reasons.map((reason, index) => (
              <motion.div 
                key={index}
                initial={{ opacity: 0, x: -5 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.15 }}
                className="flex items-start gap-1.5 text-[9px] font-mono text-slate-300"
              >
                <span className="text-green-500 font-bold shrink-0">✓</span>
                <span>{reason}</span>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="text-center py-2 text-slate-500 font-mono text-[10px] italic">
            Awaiting decision execution...
          </div>
        )}
      </div>

      {/* SECTION 8: AI CONFIDENCE & TELEMETRY */}
      <div className="bg-[#111827]/40 border border-slate-900/60 rounded-xl p-3 space-y-3">
        <div className="text-[10px] font-bold font-sans text-slate-400 uppercase tracking-wider border-b border-slate-900 pb-1.5">
          AI Confidence & System Stats
        </div>
        <div className="grid grid-cols-3 gap-2 text-center text-[9px] font-mono">
          <div className="bg-slate-950/60 border border-slate-900 rounded p-1.5">
            <span className="text-slate-500 block">Detect Conf</span>
            <span className="text-green-500 font-bold">{animatedConfidence > 0 ? `${animatedConfidence}%` : "0%"}</span>
          </div>
          <div className="bg-slate-950/60 border border-slate-900 rounded p-1.5">
            <span className="text-slate-500 block">Decide Conf</span>
            <span className="text-green-500 font-bold">{(simulationState >= 1 || activeScenario?.confidenceBase) ? "95%" : "0%"}</span>
          </div>
          <div className="bg-slate-950/60 border border-slate-900 rounded p-1.5">
            <span className="text-slate-500 block">Risk Score</span>
            <span className="text-amber-500 font-bold">{(simulationState >= 1 || activeScenario?.confidenceBase) ? `${specConfig.threatScore}/100` : "0%"}</span>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-[9px] font-mono text-left pt-1">
          <div><span className="text-slate-500">Model:</span> <span className="text-slate-300">YOLOv11 Edge</span></div>
          <div><span className="text-slate-500">Inference Time:</span> <span className="text-slate-300">142 ms</span></div>
          <div><span className="text-slate-500">Inference Device:</span> <span className="text-slate-300">Edge CPU</span></div>
          <div><span className="text-slate-500">Precision:</span> <span className="text-slate-300">FP32 Torch</span></div>
          <div><span className="text-slate-500">Frames Per Second:</span> <span className="text-slate-300">28 FPS</span></div>
        </div>
      </div>

      {/* SECTION 9: LEARNING LOG */}
      <div className="bg-[#111827]/40 border border-slate-900/60 rounded-xl p-3 space-y-3 text-left">
        <div className="text-[10px] font-bold font-sans text-slate-400 uppercase tracking-wider border-b border-slate-900 pb-1.5">
          Learning Log (Adaptive AI)
        </div>
        {(simulationState >= 1 || activeScenario?.confidenceBase) ? (
          <div className="space-y-1 text-[9px] font-mono text-slate-400">
            <div><span className="text-slate-500">Previous Visits:</span> <span className="text-slate-200">{specConfig.learning.visits}</span></div>
            <div><span className="text-slate-500 font-sans">Most Successful:</span> <span className="text-green-400 font-sans font-bold">{specConfig.learning.successful}</span></div>
            <div><span className="text-slate-500">Historical Success Rate:</span> <span className="text-green-500 font-bold">{specConfig.learning.successRate}%</span></div>
            <div><span className="text-slate-500 font-sans">Avg Exit Time:</span> <span className="text-slate-300">{specConfig.learning.exitTime} seconds</span></div>
            <div className="border-t border-slate-900 pt-1.5 mt-1.5">
              <span className="text-slate-500">Recommendation:</span> <span className="text-blue-400 block font-sans font-bold mt-0.5">Autonomous Deterrence Protocol Confirmed</span>
            </div>
          </div>
        ) : (
          <div className="text-center py-2 text-slate-500 font-mono text-[10px] italic">
            Scanning historical databases...
          </div>
        )}
      </div>

    </aside>
  );
}
