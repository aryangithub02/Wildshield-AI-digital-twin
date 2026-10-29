/**
 * WildShield AI — Animal URL Dispatcher & Webhook Engine
 * 
 * Manages custom target URLs for all 10 animal classes + Human.
 * Automatically hits the corresponding URL whenever an animal or human is detected.
 */

import { ANIMAL_DETERRENT_MAPPINGS, getInitialAnimalUrls } from '../data/deterrentSoundsData';

export const STORAGE_KEY_URLS = 'wildshield_animal_trigger_urls';
export const STORAGE_KEY_METHODS = 'wildshield_animal_url_methods';

/**
 * Check if the species is Human / Person / Intruder
 */
export function isHumanSpecies(species) {
  if (!species) return false;
  const s = String(species).toLowerCase().trim();
  return (
    s.includes('human') || 
    s.includes('person') || 
    s.includes('man') || 
    s.includes('woman') || 
    s.includes('intruder') || 
    s.includes('people') || 
    s === 'ws-hm-hu' || 
    s === 'ws-sec-hm' ||
    s.includes('homo sapiens')
  );
}

/**
 * Play Human Deterrent Sound (Track 0001 / 0001.mp3)
 */
export function playHumanDetectionSound(soundId = '0001') {
  if (typeof window === 'undefined') return;
  try {
    const trackFile = String(soundId).endsWith('.mp3') ? soundId : `${soundId}.mp3`;
    const audioPath = `/audios/${trackFile}`;
    if (!window._wildshieldAudioInstance) {
      window._wildshieldAudioInstance = new Audio();
    }
    const audio = window._wildshieldAudioInstance;
    audio.pause();
    audio.src = audioPath;
    audio.currentTime = 0;
    const playPromise = audio.play();
    if (playPromise !== undefined) {
      playPromise.then(() => {
        console.log(`[WildShield Audio] 🔊 Human Deterrent Audio Playing: ${audioPath}`);
      }).catch(err => {
        console.info("[WildShield Audio] Autoplay notice (click anywhere in dashboard to enable audio):", err.message);
      });
    }
  } catch (err) {
    console.warn("[WildShield Audio] Error playing human audio:", err);
  }
}

// Auto-unlock audio context on first user click or keydown in browser
if (typeof window !== 'undefined' && !window._wildshieldAudioListenerAttached) {
  window._wildshieldAudioListenerAttached = true;
  const unlockAudio = () => {
    try {
      if (!window._wildshieldAudioInstance) {
        window._wildshieldAudioInstance = new Audio('/audios/0001.mp3');
      }
      const p = window._wildshieldAudioInstance.play();
      if (p !== undefined) {
        p.then(() => {
          window._wildshieldAudioInstance.pause();
          window._wildshieldAudioInstance.currentTime = 0;
        }).catch(() => {});
      }
    } catch (e) {}
    window.removeEventListener('click', unlockAudio);
    window.removeEventListener('keydown', unlockAudio);
  };
  window.addEventListener('click', unlockAudio, { once: true });
  window.addEventListener('keydown', unlockAudio, { once: true });
}

/**
 * Standardize species string to match one of the 11 canonical classes
 */
export function normalizeSpeciesName(species) {
  if (!species) return "Elephant";
  const s = String(species).toLowerCase().trim();

  if (s.includes('elephant')) return "Elephant";
  if (s.includes('boar') || s.includes('pig') || s.includes('suidae') || s.includes('wb')) return "Wild Boar";
  if (s.includes('deer') || s.includes('chital') || s.includes('axis') || s.includes('sd')) return "Deer";
  if (s.includes('nilgai') || s.includes('blue bull') || s.includes('ng')) return "Nilgai";
  if (s.includes('monkey') || s.includes('macaque') || s.includes('langur') || s.includes('rm') || s.includes('lg')) return "Monkey";
  if (s.includes('leopard') || s.includes('panther') || s.includes('cat') || s.includes('felid')) return "Leopard";
  if (s.includes('bear') || s.includes('sloth')) return "Bear";
  if (s.includes('cattle') || s.includes('cow') || s.includes('bull') || s.includes('ct')) return "Cattle";
  if (s.includes('goat') || s.includes('sheep') || s.includes('capra') || s.includes('gt')) return "Goat";
  if (s.includes('dog') || s.includes('jackal') || s.includes('canine') || s.includes('wolf')) return "Wild Dogs";
  if (s.includes('human') || s.includes('person') || s.includes('man') || s.includes('woman') || s.includes('people') || s.includes('intruder') || s.includes('hu')) return "Human";

  // Fallback match against ANIMAL_DETERRENT_MAPPINGS
  const found = ANIMAL_DETERRENT_MAPPINGS.find(m => 
    s.includes(m.animal.toLowerCase()) || m.animal.toLowerCase().includes(s)
  );
  return found ? found.animal : "Elephant";
}

/**
 * Get current configured URLs from localStorage (fallback to defaults)
 */
export function getAnimalUrls() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY_URLS);
    if (saved) {
      let parsed = JSON.parse(saved);
      let updated = false;
      // Force rewrite any stale IP (192.168.137.37, 192.168.43.88, 192.168.1.3) to 192.168.137.211
      for (const k of Object.keys(parsed)) {
        if (typeof parsed[k] === 'string' && (parsed[k].includes('192.168.137.37') || parsed[k].includes('192.168.43.88') || parsed[k].includes('192.168.1.3'))) {
          parsed[k] = parsed[k].replace(/192\.168\.(137\.37|43\.88|1\.3)/g, '192.168.137.211');
          updated = true;
        }
      }
      if (updated) {
        localStorage.setItem(STORAGE_KEY_URLS, JSON.stringify(parsed));
      }
      const defaults = getInitialAnimalUrls();
      return { ...defaults, ...parsed };
    }
  } catch (e) {
    console.warn("[WildShield URL Dispatcher] Failed to read stored URLs:", e);
  }
  return getInitialAnimalUrls();
}

/**
 * Persist URLs to localStorage and sync to backend
 */
export function saveAnimalUrls(urls) {
  try {
    localStorage.setItem(STORAGE_KEY_URLS, JSON.stringify(urls));
    // Asynchronously notify backend if online
    fetch('/api/animal-urls', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ urls })
    }).catch(() => {});
  } catch (e) {
    console.warn("[WildShield URL Dispatcher] Failed to save URLs:", e);
  }
}

/**
 * Get HTTP methods (POST/GET) for each animal
 */
export function getAnimalUrlMethods() {
  const defaults = {};
  ANIMAL_DETERRENT_MAPPINGS.forEach(item => {
    defaults[item.animal] = item.animal === "Human" ? "POST" : "POST";
  });
  try {
    const saved = localStorage.getItem(STORAGE_KEY_METHODS);
    if (saved) return { ...defaults, ...JSON.parse(saved) };
  } catch (e) {
    // fallback
  }
  return defaults;
}

/**
 * Save HTTP methods to localStorage
 */
export function saveAnimalUrlMethods(methods) {
  try {
    localStorage.setItem(STORAGE_KEY_METHODS, JSON.stringify(methods));
  } catch (e) {
    console.warn("[WildShield URL Dispatcher] Failed to save methods:", e);
  }
}

// Throttle duplicate hits per species (reduced to 400ms for instant responsiveness)
const lastDispatchedTimestamps = {};

/**
 * Dispatch / Hit the target URL configured for the detected animal or human.
 * 
 * @param {string} speciesName - Raw or standard species name (e.g. 'Wild Boar', 'human', 'WS-WL-SD')
 * @param {object} metadata - Detection metadata (confidence, node, threat, etc.)
 * @param {boolean} force - Force trigger even if throttled
 */
export async function dispatchAnimalDetectionUrl(speciesName, metadata = {}, force = false) {
  const canonicalSpecies = normalizeSpeciesName(speciesName);
  const now = Date.now();
  const lastTime = lastDispatchedTimestamps[canonicalSpecies] || 0;

  // Responsive throttle (400ms instead of sluggish 1800ms)
  if (!force && (now - lastTime < 400)) {
    return { dispatched: false, reason: 'Throttled (too frequent)' };
  }
  lastDispatchedTimestamps[canonicalSpecies] = now;

  const urls = getAnimalUrls();
  const methods = getAnimalUrlMethods();
  const targetUrl = urls[canonicalSpecies];

  if (!targetUrl || targetUrl.trim() === '') {
    console.info(`[WildShield URL Dispatcher] No URL configured for ${canonicalSpecies}.`);
    return { dispatched: false, reason: 'No URL configured' };
  }

  // Ensure any stale IP is instantly redirected to 192.168.137.211
  let cleanUrl = targetUrl.trim();
  if (cleanUrl.includes('192.168.137.37') || cleanUrl.includes('192.168.43.88') || cleanUrl.includes('192.168.1.3')) {
    cleanUrl = cleanUrl.replace(/192\.168\.(137\.37|43\.88|1\.3)/g, '192.168.137.211');
  }

  const method = methods[canonicalSpecies] || 'POST';
  const mapping = ANIMAL_DETERRENT_MAPPINGS.find(m => m.animal === canonicalSpecies) || ANIMAL_DETERRENT_MAPPINGS[0];

  const payload = {
    species: canonicalSpecies,
    class_id: mapping.classId,
    threat: metadata.threat || mapping.threat || "HIGH",
    confidence: metadata.confidence || metadata.confidenceBase || 95.0,
    node: metadata.nodeName || metadata.camera_id || "FN-1",
    suggested_sound_id: mapping.suggestedSoundId,
    audio_file: mapping.audioFile,
    timestamp: new Date().toISOString()
  };

  console.log(`[WildShield URL Dispatcher] 🚀 Hitting URL for [${canonicalSpecies}]: ${method} ${cleanUrl}`);

  // Instant Direct Browser Hit in 0ms (non-blocking keepalive)
  try {
    const options = {
      method: method === 'GET' ? 'GET' : 'POST',
      mode: 'no-cors',
      cache: 'no-store',
      keepalive: true,
      headers: { 'Content-Type': 'application/json' },
      ...(method === 'POST' ? { body: JSON.stringify(payload) } : {})
    };
    fetch(cleanUrl, options).catch(() => {});
  } catch (err) {}

  // High-Speed Image ping fallback (executes immediately in browser networking stack)
  try {
    const img = new Image();
    const sep = cleanUrl.includes('?') ? '&' : '?';
    img.src = `${cleanUrl}${sep}_t=${Date.now()}`;
  } catch (e) {}

  // Parallel asynchronous backend proxy (non-blocking, fire-and-forget)
  fetch('/api/hit-animal-url', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      url: cleanUrl,
      method,
      species: canonicalSpecies,
      payload
    })
  }).catch(() => {});

  // Notify UI via CustomEvent
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('wildshield:animal-url-dispatched', {
      detail: {
        species: canonicalSpecies,
        classId: mapping.classId,
        url: cleanUrl,
        method,
        timestamp: new Date().toLocaleTimeString(),
        audioFile: mapping.audioFile,
        threat: payload.threat
      }
    }));
  }

  // Play audio through Bluetooth Speaker / System Audio (STRICTLY on Human Detection)
  const isHuman = isHumanSpecies(canonicalSpecies) || isHumanSpecies(speciesName);
  if (typeof window !== 'undefined') {
    if (isHuman) {
      playHumanDetectionSound(mapping.suggestedSoundId || '0001');
    } else {
      console.info(`[WildShield Audio] Sound suppressed for [${canonicalSpecies}] — audio triggers strictly on Human detection.`);
    }
  }

  return {
    dispatched: true,
    species: canonicalSpecies,
    url: cleanUrl,
    method
  };
}
