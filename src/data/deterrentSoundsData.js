/**
 * WildShield AI — Acoustic Deterrent Audio Registry & AI Class Mapping
 * 
 * Hardware Target: ESP32 + DFPlayer Mini (MP3-TF-16P V3.0) via UART2
 * Storage Directory: /mp3/0001.mp3 to /mp3/0005.mp3 (FAT32 MicroSD)
 * Web Assets: /audios/0001.mp3 to /audios/0005.mp3
 */

export const DETERRENT_SOUNDS = {
  "0001": {
    id: "0001",
    file: "0001.mp3",
    path: "/audios/0001.mp3",
    dfPlayerTrack: "0001.mp3",
    title: "Bear & Apex Predator Ultrasonic Repellent",
    subtitle: "High-Intensity Ultrasonic Sweep & Deterrent Pulse",
    frequency: "16 kHz – 24 kHz (Ultrasonic Modulated)",
    decibels: "118 dB @ 1m",
    threatLevel: "CRITICAL",
    color: "emerald",
    bgGradient: "from-emerald-500/20 via-emerald-950/40 to-slate-950",
    borderColor: "border-emerald-500/40",
    textColor: "text-emerald-400",
    badgeColor: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
    sizeBytes: 402587,
    sizeFormatted: "393 KB",
    durationSec: 25.1,
    targetClasses: [6, 10],
    targetAnimals: ["Bear", "Human"],
    description: "High-intensity acoustic pulse specifically tuned for large aggressive carnivores and bears without alarming domesticated cattle. Leverages sharp acoustic modulation that penetrates dense foliage.",
    fieldNotes: "Tuned for Ursus species. Highly effective in forest fringe boundaries. Avoid continuous blast; pulse in 4-second intervals to minimize habituation.",
    waveData: [35, 65, 85, 45, 95, 75, 40, 85, 90, 60, 40, 70, 95, 80, 50, 75, 60, 90, 100, 70, 45, 80, 65, 40, 75, 85, 55, 30]
  },
  "0002": {
    id: "0002",
    file: "0002.mp3",
    path: "/audios/0002.mp3",
    dfPlayerTrack: "0002.mp3",
    title: "Extended Herbivore Resonance Deterrent",
    subtitle: "Gentle Dispersal Resonance for Herbivores & Deer",
    frequency: "12 kHz – 19 kHz (Continuous Sweep Resonance)",
    decibels: "104 dB @ 1m",
    threatLevel: "MEDIUM",
    color: "amber",
    bgGradient: "from-amber-500/20 via-amber-950/40 to-slate-950",
    borderColor: "border-amber-500/40",
    textColor: "text-amber-400",
    badgeColor: "bg-amber-500/20 text-amber-300 border-amber-500/30",
    sizeBytes: 10850783,
    sizeFormatted: "10.3 MB",
    durationSec: 678.2,
    targetClasses: [2],
    targetAnimals: ["Deer"],
    description: "Non-traumatic persistent resonance designed to safely redirect deer without causing frantic panic charges or fence entanglements. Promotes calm retreat into forest buffers.",
    fieldNotes: "Deer have sensitive hearing and panic easily with loud sirens. This continuous harmonic tone creates an uncomfortable boundary gradient without panic.",
    waveData: [20, 35, 45, 55, 60, 65, 70, 65, 60, 55, 50, 45, 50, 60, 70, 75, 70, 65, 55, 50, 45, 40, 35, 30, 25, 30, 35, 20]
  },
  "0003": {
    id: "0003",
    file: "0003.mp3",
    path: "/audios/0003.mp3",
    dfPlayerTrack: "0003.mp3",
    title: "Multi-Frequency Bio-Acoustic Disruptor",
    subtitle: "Rapid Staccato Acoustic Burst for Agile Wildlife",
    frequency: "14 kHz – 22 kHz (Multi-Tonal Rapid Burst)",
    decibels: "115 dB @ 1m",
    threatLevel: "HIGH",
    color: "cyan",
    bgGradient: "from-cyan-500/20 via-cyan-950/40 to-slate-950",
    borderColor: "border-cyan-500/40",
    textColor: "text-cyan-400",
    badgeColor: "bg-cyan-500/20 text-cyan-300 border-cyan-500/30",
    sizeBytes: 370354,
    sizeFormatted: "361 KB",
    durationSec: 23.1,
    targetClasses: [1, 3, 4, 9],
    targetAnimals: ["Wild Boar", "Nilgai", "Monkey", "Wild Dogs"],
    description: "Rapid pitch modulation designed to prevent habituation in aggressive pest sounders (Wild Boar), large herbivores (Nilgai), agile troops (Monkey), and canine packs (Wild Dogs).",
    fieldNotes: "Multi-frequency pulses prevent rapid desensitization. Paired with synchronized visual strobe flashes for maximum behavioral deflection.",
    waveData: [45, 80, 25, 90, 35, 100, 45, 85, 30, 95, 50, 90, 40, 100, 60, 85, 35, 95, 40, 90, 50, 80, 35, 90, 45, 75, 35, 20]
  },
  "0004": {
    id: "0004",
    file: "0004.mp3",
    path: "/audios/0004.mp3",
    dfPlayerTrack: "0004.mp3",
    title: "High-Impact Acoustic & Bio-Acoustic Wave",
    subtitle: "Broad-Spectrum Penetrating Megafauna Blast",
    frequency: "8 kHz – 26 kHz (Deep Acoustic Pressure + Ultrasonic)",
    decibels: "122 dB @ 1m (Directional Horn)",
    threatLevel: "CRITICAL",
    color: "rose",
    bgGradient: "from-rose-500/20 via-rose-950/40 to-slate-950",
    borderColor: "border-rose-500/40",
    textColor: "text-rose-400",
    badgeColor: "bg-rose-500/20 text-rose-300 border-rose-500/30",
    sizeBytes: 5589505,
    sizeFormatted: "5.3 MB",
    durationSec: 349.3,
    targetClasses: [0, 5, 7, 8],
    targetAnimals: ["Elephant", "Leopard", "Cattle", "Goat"],
    description: "High-impact acoustic pressure wave designed for megafauna deterrence (Elephant), dangerous ambush predators (Leopard), and persistent livestock boundary breach.",
    fieldNotes: "Generates high directional acoustic pressure. For elephants, overrides village-wide sirens to prevent human stampedes while warning the animal directly.",
    waveData: [60, 90, 100, 95, 85, 70, 80, 95, 100, 90, 75, 85, 95, 100, 90, 80, 85, 95, 90, 75, 80, 85, 70, 60, 50, 40, 30, 20]
  },
  "0005": {
    id: "0005",
    file: "0005.mp3",
    path: "/audios/0005.mp3",
    dfPlayerTrack: "0005.mp3",
    title: "Emergency Perimeter Sweep & Auxiliary Blast",
    subtitle: "Multi-Spectral Rapid Emergency Blast (Override Mode)",
    frequency: "10 kHz – 30 kHz (Full Band Linear Sweep)",
    decibels: "125 dB @ 1m",
    threatLevel: "MAXIMUM",
    color: "red",
    bgGradient: "from-red-600/25 via-red-950/50 to-slate-950",
    borderColor: "border-red-500/50",
    textColor: "text-red-400",
    badgeColor: "bg-red-500/25 text-red-300 border-red-500/40",
    sizeBytes: 173914,
    sizeFormatted: "170 KB",
    durationSec: 10.9,
    targetClasses: [],
    targetAnimals: ["Perimeter Defense", "Multi-Species Breach"],
    description: "Immediate full-spectrum perimeter clearance siren and ultrasonic wave for emergency perimeter breach override. Engaged during simultaneous multi-zone intrusions.",
    fieldNotes: "System override track. Triggers both primary directional horn and secondary node buzzers simultaneously.",
    waveData: [80, 95, 100, 85, 90, 95, 100, 90, 85, 95, 100, 95, 90, 100, 95, 90, 100, 95, 90, 85, 80, 75, 70, 60, 50, 40, 30, 20]
  }
};

/**
 * 1:1 Wildlife Class Mapping specified for WildShield AI YOLOv11 Model
 * 
 * | Class ID | Animal    | Suggested sound ID | Audio file |
 * | -------: | --------- | ------------------ | ---------- |
 * |        0 | Elephant  | 0004               | 0004.mp3   |
 * |        1 | Wild Boar | 0003               | 0003.mp3   |
 * |        2 | Deer      | 0002               | 0002.mp3   |
 * |        3 | Nilgai    | 0003               | 0003.mp3   |
 * |        4 | Monkey    | 0003               | 0003.mp3   |
 * |        5 | Leopard   | 0004               | 0004.mp3   |
 * |        6 | Bear      | 0001               | 0001.mp3   |
 * |        7 | Cattle    | 0004               | 0004.mp3   |
 * |        8 | Goat      | 0004               | 0004.mp3   |
 * |        9 | Wild Dogs | 0003               | 0003.mp3   |
 */
export const ANIMAL_DETERRENT_MAPPINGS = [
  {
    classId: 0,
    animal: "Elephant",
    scientific: "Elephas maximus",
    emoji: "🐘",
    domain: "Wildlife",
    threat: "CRITICAL",
    threatScore: 98,
    suggestedSoundId: "0004",
    audioFile: "0004.mp3",
    avatar: "https://images.unsplash.com/photo-1557050543-4d5f4e07ef46?q=80&w=300&auto=format&fit=crop",
    responseProtocol: "High-Acoustic Wave + Directional Floodlight (Bypass village sirens)",
    habitatRisk: "Crop Trampling, Banana/Grain Raid, Structural Wall Breach",
    secondaryActuators: { strobe: true, horn: true, sprinkler: false }
  },
  {
    classId: 1,
    animal: "Wild Boar",
    scientific: "Sus scrofa",
    emoji: "🐗",
    domain: "Wildlife",
    threat: "HIGH",
    threatScore: 92,
    suggestedSoundId: "0003",
    audioFile: "0003.mp3",
    avatar: "/ed-van-duijn-414NZVxzc20-unsplash.jpg",
    responseProtocol: "Multi-Frequency Bio-Acoustic Burst + Strobe Light",
    habitatRisk: "Rooting soil, consuming ground tubers, severe crop disruption",
    secondaryActuators: { strobe: true, horn: true, sprinkler: true }
  },
  {
    classId: 2,
    animal: "Deer",
    scientific: "Axis axis / Cervidae",
    emoji: "🦌",
    domain: "Wildlife",
    threat: "MEDIUM",
    threatScore: 58,
    suggestedSoundId: "0002",
    audioFile: "0002.mp3",
    avatar: "https://images.unsplash.com/photo-1484406566174-9da000fda645?q=80&w=300&auto=format&fit=crop",
    responseProtocol: "Gentle Dispersal Resonance (Avoid panic charging into fences)",
    habitatRisk: "Grazing young crop seedlings, tender shoots, boundary trampling",
    secondaryActuators: { strobe: false, horn: true, sprinkler: false }
  },
  {
    classId: 3,
    animal: "Nilgai",
    scientific: "Boselaphus tragocamelus",
    emoji: "🐂",
    domain: "Wildlife",
    threat: "HIGH",
    threatScore: 84,
    suggestedSoundId: "0003",
    audioFile: "0003.mp3",
    avatar: "https://images.unsplash.com/photo-1589656966895-2f33e7653819?q=80&w=300&auto=format&fit=crop",
    responseProtocol: "Multi-Frequency Burst + Directional Floodlight",
    habitatRisk: "Pulse & cereal crop grazing, large herd trampling losses",
    secondaryActuators: { strobe: true, horn: true, sprinkler: false }
  },
  {
    classId: 4,
    animal: "Monkey",
    scientific: "Macaca mulatta / Semnopithecus",
    emoji: "🐒",
    domain: "Wildlife",
    threat: "HIGH",
    threatScore: 80,
    suggestedSoundId: "0003",
    audioFile: "0003.mp3",
    avatar: "https://images.unsplash.com/photo-1540573133985-87b6da6d54a9?q=80&w=300&auto=format&fit=crop",
    responseProtocol: "Rapid Staccato Acoustic Burst + Canopy Sprinkler Mist",
    habitatRisk: "Orchard fruit destruction, breaking branches, canopy raids",
    secondaryActuators: { strobe: true, horn: true, sprinkler: true }
  },
  {
    classId: 5,
    animal: "Leopard",
    scientific: "Panthera pardus fusca",
    emoji: "🐆",
    domain: "Wildlife",
    threat: "CRITICAL",
    threatScore: 96,
    suggestedSoundId: "0004",
    audioFile: "0004.mp3",
    avatar: "https://images.unsplash.com/photo-1456926631375-92c8ce872def?q=80&w=300&auto=format&fit=crop",
    responseProtocol: "High-Impact Acoustic Pressure + 360° Perimeter Floodlight + Push Alert",
    habitatRisk: "Apex predator human safety threat, livestock shed stalking",
    secondaryActuators: { strobe: true, horn: true, sprinkler: false }
  },
  {
    classId: 6,
    animal: "Bear",
    scientific: "Melursus ursinus",
    emoji: "🐻",
    domain: "Wildlife",
    threat: "CRITICAL",
    threatScore: 95,
    suggestedSoundId: "0001",
    audioFile: "0001.mp3",
    avatar: "https://images.unsplash.com/photo-1530595467537-0b5996c41f2d?q=80&w=300&auto=format&fit=crop",
    responseProtocol: "Ultrasonic Bear Deterrent Pulse (Track 0001) + Farmer Audio Alert",
    habitatRisk: "High human encounter risk, beehive destruction, orchard foraging",
    secondaryActuators: { strobe: true, horn: true, sprinkler: false }
  },
  {
    classId: 7,
    animal: "Cattle",
    scientific: "Bos taurus",
    emoji: "🐄",
    domain: "Domestic",
    threat: "LOW",
    threatScore: 28,
    suggestedSoundId: "0004",
    audioFile: "0004.mp3",
    avatar: "https://images.unsplash.com/photo-1570042225831-d98fa7577f1e?q=80&w=300&auto=format&fit=crop",
    responseProtocol: "Moderate Audio Wave + Water Sprinkler (Safe herding push)",
    habitatRisk: "Casual crop grazing, boundary fence leaning",
    secondaryActuators: { strobe: false, horn: true, sprinkler: true }
  },
  {
    classId: 8,
    animal: "Goat",
    scientific: "Capra hircus",
    emoji: "🐐",
    domain: "Domestic",
    threat: "LOW",
    threatScore: 22,
    suggestedSoundId: "0004",
    audioFile: "0004.mp3",
    avatar: "https://images.unsplash.com/photo-1524024973431-2ad916746881?q=80&w=300&auto=format&fit=crop",
    responseProtocol: "Local Acoustic Tone + Low-Pressure Sprinkler Mist",
    habitatRisk: "Nibbling young seedlings, shrub stripping",
    secondaryActuators: { strobe: false, horn: true, sprinkler: true }
  },
  {
    classId: 9,
    animal: "Wild Dogs",
    scientific: "Cuon alpinus / Canis lupus familiaris",
    emoji: "🐕",
    domain: "Wildlife",
    threat: "HIGH",
    threatScore: 82,
    suggestedSoundId: "0003",
    audioFile: "0003.mp3",
    avatar: "https://images.unsplash.com/photo-1548199973-03cce0bbc87b?q=80&w=300&auto=format&fit=crop",
    responseProtocol: "Multi-Frequency Canine Disruptor + High-Intensity Strobe",
    habitatRisk: "Pack stalking, livestock intimidation, poultry pen breach",
    secondaryActuators: { strobe: true, horn: true, sprinkler: false },
    defaultUrl: "http://192.168.137.211/siren?track=3"
  },
  {
    classId: 10,
    animal: "Human",
    scientific: "Homo sapiens (Trespasser / Farm Worker)",
    emoji: "🚶",
    domain: "Human",
    threat: "SECURITY",
    threatScore: 88,
    suggestedSoundId: "0001",
    audioFile: "0001.mp3",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=300&auto=format&fit=crop",
    responseProtocol: "Security Siren & Tone (Track 0001) + Security Floodlight",
    habitatRisk: "Crop trespassing, theft, perimeter fence manipulation, researcher presence",
    secondaryActuators: { strobe: false, horn: false, floodlight: true, sprinkler: false },
    defaultUrl: "http://192.168.137.211/siren"
  }
];

export function getSoundById(soundId) {
  if (!soundId) return DETERRENT_SOUNDS["0001"];
  const normalized = String(soundId).padStart(4, '0');
  return DETERRENT_SOUNDS[normalized] || DETERRENT_SOUNDS["0001"];
}

export function getMappingByClassId(classId) {
  return ANIMAL_DETERRENT_MAPPINGS.find(m => m.classId === Number(classId)) || ANIMAL_DETERRENT_MAPPINGS[0];
}

export function getMappingByAnimalName(name) {
  if (!name) return ANIMAL_DETERRENT_MAPPINGS[0];
  const query = String(name).toLowerCase().trim();
  
  // Explicit matches
  if (query.includes('elephant')) return ANIMAL_DETERRENT_MAPPINGS[0];
  if (query.includes('boar') || query.includes('pig')) return ANIMAL_DETERRENT_MAPPINGS[1];
  if (query.includes('deer')) return ANIMAL_DETERRENT_MAPPINGS[2];
  if (query.includes('nilgai') || query.includes('blue bull')) return ANIMAL_DETERRENT_MAPPINGS[3];
  if (query.includes('monkey') || query.includes('macaque') || query.includes('langur')) return ANIMAL_DETERRENT_MAPPINGS[4];
  if (query.includes('leopard') || query.includes('panther')) return ANIMAL_DETERRENT_MAPPINGS[5];
  if (query.includes('bear')) return ANIMAL_DETERRENT_MAPPINGS[6];
  if (query.includes('cattle') || query.includes('cow') || query.includes('bull')) return ANIMAL_DETERRENT_MAPPINGS[7];
  if (query.includes('goat') || query.includes('sheep')) return ANIMAL_DETERRENT_MAPPINGS[8];
  if (query.includes('dog') || query.includes('jackal') || query.includes('canine')) return ANIMAL_DETERRENT_MAPPINGS[9];
  if (query.includes('human') || query.includes('person') || query.includes('man') || query.includes('intruder')) return ANIMAL_DETERRENT_MAPPINGS[10];

  return ANIMAL_DETERRENT_MAPPINGS.find(m => 
    m.animal.toLowerCase().includes(query) || 
    query.includes(m.animal.toLowerCase())
  ) || ANIMAL_DETERRENT_MAPPINGS[0];
}

// Default URL mapping storage helper
export function getInitialAnimalUrls() {
  const defaults = {};
  ANIMAL_DETERRENT_MAPPINGS.forEach(item => {
    if (item.animal === "Human") {
      defaults[item.animal] = "http://192.168.137.211/siren";
    } else {
      defaults[item.animal] = `http://192.168.137.211/siren?track=${parseInt(item.suggestedSoundId, 10)}`;
    }
  });
  return defaults;
}
