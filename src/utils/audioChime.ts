// Web Audio API & Device Sound Engine for Campus Meal Bell, Exam Chime, and 60s Bell
// Supports: Device Ringtone Presets + Custom Device File Upload + Exact 15-Second Activation

export type BellKind =
  | 'lunch_alarm'
  | 'meal_bell'
  | 'exam_alarm'
  | 'exam_chime'
  | 'notification_alarm'
  | 'sixty_sec_bell';

export interface SoundPreset {
  id: string;
  name: string;
  category: 'alarm' | 'ringtone' | 'chime';
  description: string;
}

export const DEVICE_SOUND_PRESETS: SoundPreset[] = [
  {
    id: 'pleasant_dining_chime',
    name: 'Pleasant Melodic Dining Chime (Nice Meal Bell)',
    category: 'chime',
    description: 'Delightful, warm melodic chime arpeggio with golden resonance and soothing dining hall bells'
  },
  {
    id: 'acoustic_dining_gong',
    name: 'Acoustic Dining Hall Gong',
    category: 'chime',
    description: 'Resonant, warm acoustic dinner bell with rich gentle overtones'
  },
  {
    id: 'marimba_phone',
    name: 'Marimba Device Ringtone',
    category: 'ringtone',
    description: 'Warm, resonant melodic wooden marimba sequence'
  },
  {
    id: 'campus_chime_echo',
    name: 'Campus Chimes & Temple Bell',
    category: 'chime',
    description: 'Deep Westminster bronze bell resonance with rich harmonic sustain'
  },
  {
    id: 'gentle_radar',
    name: 'Gentle Radar Alarm',
    category: 'alarm',
    description: 'Ascending high-clarity harmonic radar pulse'
  },
  {
    id: 'digital_alarm_clock',
    name: 'Digital Alarm Clock',
    category: 'alarm',
    description: 'Urgent rhythmic triplet beep alarm (Beep-Beep-Beep)'
  },
  {
    id: 'classic_school_bell',
    name: 'Classic School Electric Bell',
    category: 'alarm',
    description: 'Vibrant mechanical gong bell with rapid metallic clapper strikes'
  },
  {
    id: 'electronic_siren',
    name: 'Electronic Pulse Siren',
    category: 'alarm',
    description: 'High-visibility dual-tone warning alarm'
  },
  {
    id: 'modern_ding_dong',
    name: 'Modern High-Fidelity Ding-Dong',
    category: 'chime',
    description: 'Gentle two-tone arrival chime with stereo spread'
  },
  {
    id: 'vintage_phone',
    name: 'Vintage Telephone Ring',
    category: 'ringtone',
    description: 'Double twin-bell telephone ringer'
  }
];

export interface BellSoundConfig {
  toneId: string;
  customFileName?: string;
  customAudioData?: string; // base64 data URI
  volume: number; // 0 to 1
}

export type { UserCustomTone } from './customToneStore';
import {
  UserCustomTone,
  getUserCustomTonesSync,
  saveUserCustomToneAsync,
  saveMultipleUserCustomTones,
  deleteUserCustomToneAsync,
  findCustomToneByIdSync,
  initCustomToneStore
} from './customToneStore';

export { initCustomToneStore, saveMultipleUserCustomTones };

const DEFAULT_CONFIGS: Record<BellKind, BellSoundConfig> = {
  lunch_alarm: {
    toneId: 'pleasant_dining_chime',
    volume: 0.95
  },
  meal_bell: {
    toneId: 'pleasant_dining_chime',
    volume: 0.95
  },
  exam_alarm: {
    toneId: 'electronic_siren',
    volume: 0.95
  },
  exam_chime: {
    toneId: 'campus_chime_echo',
    volume: 0.9
  },
  notification_alarm: {
    toneId: 'modern_ding_dong',
    volume: 0.85
  },
  sixty_sec_bell: {
    toneId: 'digital_alarm_clock',
    volume: 0.95
  }
};

const STORAGE_KEY_PREFIX = 'usap_device_bell_sound_configs';

let currentActiveUserUid: string | null = null;

// Sets active user context (e.g. from session.userId or session.email)
export function setActiveUserSoundContext(userId: string | null) {
  currentActiveUserUid = userId;
  if (userId) {
    initCustomToneStore(userId).catch(() => {});
  }
}

export function getActiveUserSoundContext(): string | null {
  return currentActiveUserUid;
}

// Get user custom uploaded tones for their account only
export function getUserCustomTones(userId?: string): UserCustomTone[] {
  const uid = userId || currentActiveUserUid || 'guest_user';
  return getUserCustomTonesSync(uid);
}

// Save a new or edited custom tone to user's account only
export function saveUserCustomTone(tone: UserCustomTone): void {
  saveUserCustomToneAsync(tone).catch((err) => {
    console.warn('Error saving custom tone:', err);
  });
}

// Delete custom tone from user's account
export function deleteUserCustomTone(toneId: string, userId?: string): void {
  const uid = userId || currentActiveUserUid || 'guest_user';
  deleteUserCustomToneAsync(toneId, uid).catch((err) => {
    console.warn('Error deleting custom tone:', err);
  });
}

// Find a custom tone by its ID across active user tones
export function findCustomToneById(toneId: string, userId?: string): UserCustomTone | undefined {
  const uid = userId || currentActiveUserUid || 'guest_user';
  return findCustomToneByIdSync(toneId, uid);
}

// Load configurations from device localStorage (scoped to user account if provided)
export function getBellSoundConfigs(userId?: string): Record<BellKind, BellSoundConfig> {
  if (typeof window === 'undefined') return { ...DEFAULT_CONFIGS };
  const uid = userId || currentActiveUserUid || 'default';
  const key = `${STORAGE_KEY_PREFIX}_${uid}`;
  try {
    const raw = localStorage.getItem(key) || localStorage.getItem(STORAGE_KEY_PREFIX);
    if (raw) {
      const parsed = JSON.parse(raw);
      // Upgrade or populate any missing configs with default starters
      const mealTone = (!parsed.meal_bell?.toneId || parsed.meal_bell?.toneId === 'classic_school_bell')
        ? 'pleasant_dining_chime'
        : parsed.meal_bell.toneId;

      return {
        lunch_alarm: { ...DEFAULT_CONFIGS.lunch_alarm, ...(parsed.lunch_alarm || parsed.meal_bell || {}) },
        meal_bell: { ...DEFAULT_CONFIGS.meal_bell, ...(parsed.meal_bell || {}), toneId: mealTone },
        exam_alarm: { ...DEFAULT_CONFIGS.exam_alarm, ...(parsed.exam_alarm || parsed.sixty_sec_bell || {}) },
        exam_chime: { ...DEFAULT_CONFIGS.exam_chime, ...(parsed.exam_chime || {}) },
        notification_alarm: { ...DEFAULT_CONFIGS.notification_alarm, ...(parsed.notification_alarm || {}) },
        sixty_sec_bell: { ...DEFAULT_CONFIGS.sixty_sec_bell, ...(parsed.sixty_sec_bell || {}) }
      };
    }
  } catch {}
  return { ...DEFAULT_CONFIGS };
}

// Save configuration to device localStorage (scoped to user account if provided)
export function saveBellSoundConfig(kind: BellKind, config: Partial<BellSoundConfig>, userId?: string) {
  if (typeof window === 'undefined') return;
  const uid = userId || currentActiveUserUid || 'default';
  const key = `${STORAGE_KEY_PREFIX}_${uid}`;
  try {
    const current = getBellSoundConfigs(uid);
    current[kind] = { ...current[kind], ...config };
    localStorage.setItem(key, JSON.stringify(current));
    // Also save to generic key for background compatibility
    localStorage.setItem(STORAGE_KEY_PREFIX, JSON.stringify(current));
  } catch (err) {
    console.warn('Failed to save sound config:', err);
  }
}

// Active ringing state listener
export interface ActiveRingingStatus {
  kind: BellKind;
  bellName: string;
  toneName: string;
  remainingSeconds: number;
  durationSeconds: number;
}

type RingingListener = (status: ActiveRingingStatus | null) => void;
const ringingListeners: Set<RingingListener> = new Set();

export function subscribeToActiveRinging(listener: RingingListener): () => void {
  ringingListeners.add(listener);
  return () => ringingListeners.delete(listener);
}

function notifyRingingStatus(status: ActiveRingingStatus | null) {
  ringingListeners.forEach((fn) => {
    try {
      fn(status);
    } catch {}
  });
}

// Web Audio Context singleton
let sharedAudioCtx: AudioContext | null = null;
let currentStopFn: (() => void) | null = null;
let currentCountdownTimer: any = null;

function getAudioContext(): AudioContext | null {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return null;
    if (!sharedAudioCtx || sharedAudioCtx.state === 'closed') {
      sharedAudioCtx = new AudioContextClass();
    }
    if (sharedAudioCtx.state === 'suspended') {
      sharedAudioCtx.resume().catch(() => {});
    }
    return sharedAudioCtx;
  } catch {
    return null;
  }
}

export function unlockAudio() {
  const ctx = getAudioContext();
  if (ctx && ctx.state === 'suspended') {
    ctx.resume().catch(() => {});
  }
}

if (typeof window !== 'undefined') {
  const unlockEvents = ['click', 'touchstart', 'keydown', 'pointerdown'];
  const onUserGesture = () => {
    unlockAudio();
    unlockEvents.forEach((ev) => window.removeEventListener(ev, onUserGesture));
  };
  unlockEvents.forEach((ev) => window.addEventListener(ev, onUserGesture, { once: true, passive: true }));
}

export function stopAllAlarms() {
  if (currentCountdownTimer) {
    clearInterval(currentCountdownTimer);
    currentCountdownTimer = null;
  }
  if (currentStopFn) {
    try {
      currentStopFn();
    } catch {}
    currentStopFn = null;
  }
  notifyRingingStatus(null);
}

export function getBellFriendlyName(kind: BellKind): string {
  switch (kind) {
    case 'lunch_alarm':
      return 'Lunch Alarm (12:30 PM - 01:45 PM)';
    case 'meal_bell':
      return 'Meal Bell (Breakfast, Lunch & Dinner)';
    case 'exam_alarm':
      return 'Exam Alarm (Test Commencement Alert)';
    case 'exam_chime':
      return 'Exam Chime Bell';
    case 'notification_alarm':
      return 'Notification Alarm (Announcements & Alerts)';
    case 'sixty_sec_bell':
      return '60s Countdown Warning Bell';
    default:
      return 'Campus Alert Bell';
  }
}

/**
 * Universal Bell Player:
 * Activates the tone for EXACTLY durationSeconds (Default: 15 seconds).
 * Any uploaded tone automatically loops to increase ring duration to 15 seconds.
 */
export function playBellTone(kind: BellKind, durationSeconds = 15): () => void {
  stopAllAlarms();
  const configs = getBellSoundConfigs();
  const config = configs[kind] || DEFAULT_CONFIGS[kind];
  const bellName = getBellFriendlyName(kind);

  let customToneMatch = config.toneId.startsWith('custom_') ? findCustomToneById(config.toneId) : undefined;
  if (!customToneMatch && config.toneId === 'custom_file') {
    const list = getUserCustomTones();
    if (list.length > 0) {
      customToneMatch = list[0];
    }
  }

  let toneName = 'Standard Tone';
  if (customToneMatch) {
    toneName = `Custom: ${customToneMatch.name}`;
  } else if (config.toneId === 'custom_file' && config.customFileName) {
    toneName = `Custom: ${config.customFileName}`;
  } else {
    const preset = DEVICE_SOUND_PRESETS.find((p) => p.id === config.toneId);
    toneName = preset ? preset.name : config.toneId;
  }

  let remaining = durationSeconds;
  notifyRingingStatus({
    kind,
    bellName,
    toneName,
    remainingSeconds: remaining,
    durationSeconds
  });

  // Track 15-second countdown tick
  currentCountdownTimer = setInterval(() => {
    remaining -= 1;
    if (remaining <= 0) {
      clearInterval(currentCountdownTimer);
      currentCountdownTimer = null;
      stopAllAlarms();
    } else {
      notifyRingingStatus({
        kind,
        bellName,
        toneName,
        remainingSeconds: remaining,
        durationSeconds
      });
    }
  }, 1000);

  // 1. Play Custom File if selected (loops to increase duration to full 15 seconds)
  const customAudioUri = customToneMatch?.audioData || config.customAudioData;
  if (customAudioUri) {
    try {
      const audio = new Audio(customAudioUri);
      audio.volume = Math.max(0, Math.min(1, config.volume ?? 1));
      audio.loop = true; // Loops seamlessly to increase ring duration to 15 seconds

      const playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromise.catch((err) => {
          console.warn('Audio play error, falling back to synthesizer:', err);
          playSynthesizedTone('pleasant_dining_chime', config.volume, durationSeconds);
        });
      }

      const stopCustom = () => {
        try {
          audio.pause();
          audio.currentTime = 0;
        } catch {}
      };

      currentStopFn = stopCustom;

      setTimeout(() => {
        if (currentStopFn === stopCustom) {
          stopAllAlarms();
        }
      }, durationSeconds * 1000);

      return stopCustom;
    } catch {
      // Fallback
    }
  }

  // 2. Play Synthesized Web Audio Device Preset (Loops for exactly durationSeconds = 15s)
  const cancelSynth = playSynthesizedTone(config.toneId, config.volume, durationSeconds);
  currentStopFn = cancelSynth;

  setTimeout(() => {
    if (currentStopFn === cancelSynth) {
      stopAllAlarms();
    }
  }, durationSeconds * 1000);

  return cancelSynth;
}

/**
 * Preview custom audio data for exactly 15 seconds
 */
export function playCustomAudioPreview(audioData: string, toneName: string, durationSeconds = 15): () => void {
  stopAllAlarms();
  let remaining = durationSeconds;
  notifyRingingStatus({
    kind: 'meal_bell',
    bellName: 'Audio Preview',
    toneName: `Preview: ${toneName}`,
    remainingSeconds: remaining,
    durationSeconds
  });

  currentCountdownTimer = setInterval(() => {
    remaining -= 1;
    if (remaining <= 0) {
      clearInterval(currentCountdownTimer);
      currentCountdownTimer = null;
      stopAllAlarms();
    } else {
      notifyRingingStatus({
        kind: 'meal_bell',
        bellName: 'Audio Preview',
        toneName: `Preview: ${toneName}`,
        remainingSeconds: remaining,
        durationSeconds
      });
    }
  }, 1000);

  try {
    const audio = new Audio(audioData);
    audio.volume = 0.95;
    audio.loop = true; // Loops seamlessly to 15s
    audio.play().catch(() => {});

    const stopAudio = () => {
      try {
        audio.pause();
        audio.currentTime = 0;
      } catch {}
    };

    currentStopFn = stopAudio;
    setTimeout(() => {
      if (currentStopFn === stopAudio) {
        stopAllAlarms();
      }
    }, durationSeconds * 1000);

    return stopAudio;
  } catch {
    return () => {};
  }
}

/**
 * Synthesizes device ringtone and alarmtone patterns using Web Audio API
 * Runs continuously for durationSeconds (15 seconds).
 */
function playSynthesizedTone(toneId: string, volume = 0.9, durationSeconds = 15): () => void {
  const ctx = getAudioContext();
  if (!ctx) return () => {};

  let isCancelled = false;
  const activeNodes: (OscillatorNode | GainNode)[] = [];
  const loopTimeouts: any[] = [];

  const masterGain = ctx.createGain();
  masterGain.gain.setValueAtTime(Math.max(0.1, Math.min(1, volume)), ctx.currentTime);
  masterGain.connect(ctx.destination);

  // Preset: Pleasant Melodic Dining Chime (Nice Meal Bell - Melodic Dining Hall Carillon)
  if (toneId === 'pleasant_dining_chime') {
    // 5-note welcoming dining arpeggio: F5, A5, C6, E6, F6 then gentle resolution C6, A5, F5
    const phrase = [
      { freq: 698.46, delay: 0.0, len: 1.4, vol: 0.35 },  // F5
      { freq: 880.00, delay: 0.28, len: 1.4, vol: 0.38 }, // A5
      { freq: 1046.50, delay: 0.56, len: 1.5, vol: 0.40 },// C6
      { freq: 1318.51, delay: 0.84, len: 1.4, vol: 0.32 },// E6
      { freq: 1396.91, delay: 1.12, len: 1.8, vol: 0.42 },// F6
      { freq: 1046.50, delay: 1.48, len: 1.4, vol: 0.32 },// C6
      { freq: 880.00, delay: 1.76, len: 1.5, vol: 0.34 }, // A5
      { freq: 698.46, delay: 2.04, len: 2.0, vol: 0.38 }  // F5 (Golden resolving tone)
    ];

    const cycleDuration = 2.4; // seconds per graceful melodic phrase
    const numCycles = Math.ceil(durationSeconds / cycleDuration);

    for (let c = 0; c < numCycles; c++) {
      const cycleStart = ctx.currentTime + c * cycleDuration;

      phrase.forEach((note) => {
        const noteStart = cycleStart + note.delay;
        if (noteStart - ctx.currentTime >= durationSeconds) return;

        // 1. Primary Warm Bell Body (Triangle + Sine blend)
        const osc1 = ctx.createOscillator();
        const gain1 = ctx.createGain();
        osc1.type = 'triangle';
        osc1.frequency.setValueAtTime(note.freq, noteStart);

        gain1.gain.setValueAtTime(0.001, noteStart);
        gain1.gain.linearRampToValueAtTime(note.vol, noteStart + 0.02);
        gain1.gain.exponentialRampToValueAtTime(0.0001, noteStart + note.len);

        osc1.connect(gain1);
        gain1.connect(masterGain);
        osc1.start(noteStart);
        osc1.stop(noteStart + note.len + 0.05);
        activeNodes.push(osc1, gain1);

        // 2. Sweet Resonant Golden Overtone (octave harmonic)
        const osc2 = ctx.createOscillator();
        const gain2 = ctx.createGain();
        osc2.type = 'sine';
        osc2.frequency.setValueAtTime(note.freq * 2.0, noteStart);

        gain2.gain.setValueAtTime(0.001, noteStart);
        gain2.gain.linearRampToValueAtTime(note.vol * 0.45, noteStart + 0.015);
        gain2.gain.exponentialRampToValueAtTime(0.0001, noteStart + note.len * 0.75);

        osc2.connect(gain2);
        gain2.connect(masterGain);
        osc2.start(noteStart);
        osc2.stop(noteStart + note.len * 0.8);
        activeNodes.push(osc2, gain2);

        // 3. Subtle Crystal Shimmer (upper bell partial)
        const osc3 = ctx.createOscillator();
        const gain3 = ctx.createGain();
        osc3.type = 'sine';
        osc3.frequency.setValueAtTime(note.freq * 3.01, noteStart);

        gain3.gain.setValueAtTime(0.001, noteStart);
        gain3.gain.linearRampToValueAtTime(note.vol * 0.2, noteStart + 0.01);
        gain3.gain.exponentialRampToValueAtTime(0.0001, noteStart + 0.5);

        osc3.connect(gain3);
        gain3.connect(masterGain);
        osc3.start(noteStart);
        osc3.stop(noteStart + 0.55);
        activeNodes.push(osc3, gain3);
      });
    }
  }

  // Preset: Acoustic Dining Hall Gong
  else if (toneId === 'acoustic_dining_gong') {
    const gongStep = 2.0; // struck every 2 seconds
    const totalGongs = Math.ceil(durationSeconds / gongStep);

    for (let g = 0; g < totalGongs; g++) {
      const gTime = ctx.currentTime + g * gongStep;
      if (gTime - ctx.currentTime >= durationSeconds) break;

      [440, 554.37, 659.25].forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = idx === 0 ? 'triangle' : 'sine';
        osc.frequency.setValueAtTime(freq, gTime);

        gain.gain.setValueAtTime(0.001, gTime);
        gain.gain.linearRampToValueAtTime(0.35 / (idx + 1), gTime + 0.03);
        gain.gain.exponentialRampToValueAtTime(0.0001, gTime + 1.9);

        osc.connect(gain);
        gain.connect(masterGain);
        osc.start(gTime);
        osc.stop(gTime + 1.95);
        activeNodes.push(osc, gain);
      });
    }
  }

  // Preset 1: Classic School Electric Bell (Rapid continuous hammer strikes)
  else if (toneId === 'classic_school_bell') {
    const strikeInterval = 0.08; // 12.5 strikes per second
    const totalStrikes = Math.floor(durationSeconds / strikeInterval);

    for (let i = 0; i < totalStrikes; i++) {
      const startTime = ctx.currentTime + i * strikeInterval;

      // Base metallic gong clatter
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = 'triangle';
      osc1.frequency.setValueAtTime(i % 2 === 0 ? 820 : 860, startTime);

      gain1.gain.setValueAtTime(0.001, startTime);
      gain1.gain.linearRampToValueAtTime(0.28, startTime + 0.008);
      gain1.gain.exponentialRampToValueAtTime(0.0001, startTime + 0.12);

      osc1.connect(gain1);
      gain1.connect(masterGain);
      osc1.start(startTime);
      osc1.stop(startTime + 0.13);
      activeNodes.push(osc1, gain1);

      // High overtone ring
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(1640, startTime);

      gain2.gain.setValueAtTime(0.001, startTime);
      gain2.gain.linearRampToValueAtTime(0.15, startTime + 0.008);
      gain2.gain.exponentialRampToValueAtTime(0.0001, startTime + 0.09);

      osc2.connect(gain2);
      gain2.connect(masterGain);
      osc2.start(startTime);
      osc2.stop(startTime + 0.1);
      activeNodes.push(osc2, gain2);
    }
  }

  // Preset 2: Digital Alarm Clock (Beep-Beep-Beep triplet pulse)
  else if (toneId === 'digital_alarm_clock') {
    const cycleDuration = 1.0; // 1 second per triplet cycle
    const numCycles = Math.ceil(durationSeconds / cycleDuration);

    for (let c = 0; c < numCycles; c++) {
      const cycleStart = ctx.currentTime + c * cycleDuration;
      // 3 short urgent beeps
      for (let b = 0; b < 3; b++) {
        const beepStart = cycleStart + b * 0.15;
        const beepLen = 0.09;

        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'square';
        osc.frequency.setValueAtTime(987.77, beepStart); // B5

        gain.gain.setValueAtTime(0.001, beepStart);
        gain.gain.linearRampToValueAtTime(0.3, beepStart + 0.01);
        gain.gain.setValueAtTime(0.3, beepStart + beepLen - 0.01);
        gain.gain.linearRampToValueAtTime(0.001, beepStart + beepLen);

        osc.connect(gain);
        gain.connect(masterGain);
        osc.start(beepStart);
        osc.stop(beepStart + beepLen + 0.01);
        activeNodes.push(osc, gain);
      }
    }
  }

  // Preset 3: Marimba Device Ringtone (Melodic rhythmic marimba chime)
  else if (toneId === 'marimba_phone') {
    // Musical motif: C5, E5, G5, B5, C6 arpeggios
    const notes = [523.25, 659.25, 783.99, 987.77, 1046.5, 783.99, 659.25, 523.25];
    const noteDuration = 0.18;
    const loopDuration = notes.length * noteDuration;
    const numLoops = Math.ceil(durationSeconds / loopDuration);

    for (let l = 0; l < numLoops; l++) {
      const loopStart = ctx.currentTime + l * loopDuration;
      notes.forEach((freq, idx) => {
        const noteStart = loopStart + idx * noteDuration;
        if (noteStart - ctx.currentTime >= durationSeconds) return;

        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, noteStart);

        gain.gain.setValueAtTime(0.001, noteStart);
        gain.gain.linearRampToValueAtTime(0.35, noteStart + 0.015);
        gain.gain.exponentialRampToValueAtTime(0.0001, noteStart + 0.35);

        osc.connect(gain);
        gain.connect(masterGain);
        osc.start(noteStart);
        osc.stop(noteStart + 0.4);
        activeNodes.push(osc, gain);
      });
    }
  }

  // Preset 4: Gentle Radar Alarm (Warm radar pings)
  else if (toneId === 'gentle_radar') {
    const pingInterval = 1.25;
    const numPings = Math.ceil(durationSeconds / pingInterval);

    for (let p = 0; p < numPings; p++) {
      const pingStart = ctx.currentTime + p * pingInterval;

      // Two ascending soft harmonic pings
      [659.25, 1046.5].forEach((freq, i) => {
        const t = pingStart + i * 0.18;
        if (t - ctx.currentTime >= durationSeconds) return;

        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, t);

        gain.gain.setValueAtTime(0.001, t);
        gain.gain.linearRampToValueAtTime(0.3, t + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.8);

        osc.connect(gain);
        gain.connect(masterGain);
        osc.start(t);
        osc.stop(t + 0.85);
        activeNodes.push(osc, gain);
      });
    }
  }

  // Preset 5: Campus Chimes & Temple Bell (Westminster rich chimes)
  else if (toneId === 'campus_chime_echo') {
    // Quarters sequence: E4, G#4, F#4, B3 / E4, F#4, G#4, E4
    const chimeFrequencies = [329.63, 415.3, 369.99, 246.94, 329.63, 369.99, 415.3, 329.63];
    const chimeStep = 1.2;
    const totalSteps = Math.ceil(durationSeconds / chimeStep);

    for (let s = 0; s < totalSteps; s++) {
      const freq = chimeFrequencies[s % chimeFrequencies.length];
      const strikeTime = ctx.currentTime + s * chimeStep;
      if (strikeTime - ctx.currentTime >= durationSeconds) break;

      // Fundamental
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = 'triangle';
      osc1.frequency.setValueAtTime(freq, strikeTime);

      gain1.gain.setValueAtTime(0.001, strikeTime);
      gain1.gain.linearRampToValueAtTime(0.35, strikeTime + 0.03);
      gain1.gain.exponentialRampToValueAtTime(0.0001, strikeTime + 2.0);

      osc1.connect(gain1);
      gain1.connect(masterGain);
      osc1.start(strikeTime);
      osc1.stop(strikeTime + 2.1);
      activeNodes.push(osc1, gain1);

      // Shimmer overtone
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(freq * 2.76, strikeTime);

      gain2.gain.setValueAtTime(0.001, strikeTime);
      gain2.gain.linearRampToValueAtTime(0.18, strikeTime + 0.02);
      gain2.gain.exponentialRampToValueAtTime(0.0001, strikeTime + 1.2);

      osc2.connect(gain2);
      gain2.connect(masterGain);
      osc2.start(strikeTime);
      osc2.stop(strikeTime + 1.25);
      activeNodes.push(osc2, gain2);
    }
  }

  // Preset 6: Electronic Pulse Siren
  else if (toneId === 'electronic_siren') {
    const pulseLen = 0.25;
    const numPulses = Math.ceil(durationSeconds / (pulseLen * 2));

    for (let i = 0; i < numPulses; i++) {
      const t1 = ctx.currentTime + i * (pulseLen * 2);
      const t2 = t1 + pulseLen;

      if (t1 - ctx.currentTime < durationSeconds) {
        const osc1 = ctx.createOscillator();
        const gain1 = ctx.createGain();
        osc1.type = 'sawtooth';
        osc1.frequency.setValueAtTime(800, t1);
        gain1.gain.setValueAtTime(0.2, t1);
        osc1.connect(gain1);
        gain1.connect(masterGain);
        osc1.start(t1);
        osc1.stop(t1 + pulseLen);
        activeNodes.push(osc1, gain1);
      }

      if (t2 - ctx.currentTime < durationSeconds) {
        const osc2 = ctx.createOscillator();
        const gain2 = ctx.createGain();
        osc2.type = 'sawtooth';
        osc2.frequency.setValueAtTime(1150, t2);
        gain2.gain.setValueAtTime(0.2, t2);
        osc2.connect(gain2);
        gain2.connect(masterGain);
        osc2.start(t2);
        osc2.stop(t2 + pulseLen);
        activeNodes.push(osc2, gain2);
      }
    }
  }

  // Preset 7: Modern High-Fidelity Ding-Dong
  else if (toneId === 'modern_ding_dong') {
    const pairInterval = 1.6;
    const numPairs = Math.ceil(durationSeconds / pairInterval);

    for (let p = 0; p < numPairs; p++) {
      const pStart = ctx.currentTime + p * pairInterval;

      // Ding (High)
      if (pStart - ctx.currentTime < durationSeconds) {
        const osc1 = ctx.createOscillator();
        const gain1 = ctx.createGain();
        osc1.type = 'sine';
        osc1.frequency.setValueAtTime(783.99, pStart); // G5
        gain1.gain.setValueAtTime(0.001, pStart);
        gain1.gain.linearRampToValueAtTime(0.35, pStart + 0.02);
        gain1.gain.exponentialRampToValueAtTime(0.0001, pStart + 0.9);
        osc1.connect(gain1);
        gain1.connect(masterGain);
        osc1.start(pStart);
        osc1.stop(pStart + 0.95);
        activeNodes.push(osc1, gain1);
      }

      // Dong (Low)
      const pDong = pStart + 0.45;
      if (pDong - ctx.currentTime < durationSeconds) {
        const osc2 = ctx.createOscillator();
        const gain2 = ctx.createGain();
        osc2.type = 'sine';
        osc2.frequency.setValueAtTime(587.33, pDong); // D5
        gain2.gain.setValueAtTime(0.001, pDong);
        gain2.gain.linearRampToValueAtTime(0.35, pDong + 0.02);
        gain2.gain.exponentialRampToValueAtTime(0.0001, pDong + 1.1);
        osc2.connect(gain2);
        gain2.connect(masterGain);
        osc2.start(pDong);
        osc2.stop(pDong + 1.15);
        activeNodes.push(osc2, gain2);
      }
    }
  }

  // Preset 8: Vintage Telephone Ring
  else {
    const ringCycle = 2.5;
    const numRings = Math.ceil(durationSeconds / ringCycle);

    for (let r = 0; r < numRings; r++) {
      const rStart = ctx.currentTime + r * ringCycle;
      // Ring burst for 1.2s, then 1.3s pause
      const burstLen = 1.2;
      const pulseRate = 0.05; // 20 pulses per second
      const pulses = Math.floor(burstLen / pulseRate);

      for (let p = 0; p < pulses; p++) {
        const pt = rStart + p * pulseRate;
        if (pt - ctx.currentTime >= durationSeconds) break;

        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'square';
        osc.frequency.setValueAtTime(p % 2 === 0 ? 440 : 480, pt);

        gain.gain.setValueAtTime(0.001, pt);
        gain.gain.linearRampToValueAtTime(0.2, pt + 0.005);
        gain.gain.exponentialRampToValueAtTime(0.0001, pt + 0.045);

        osc.connect(gain);
        gain.connect(masterGain);
        osc.start(pt);
        osc.stop(pt + 0.05);
        activeNodes.push(osc, gain);
      }
    }
  }

  // Cancel / Stop callback
  const cancelFn = () => {
    isCancelled = true;
    loopTimeouts.forEach((id) => clearTimeout(id));
    activeNodes.forEach((node) => {
      try {
        if ('stop' in node) (node as OscillatorNode).stop();
        if ('disconnect' in node) node.disconnect();
      } catch {}
    });
    try {
      masterGain.disconnect();
    } catch {}
  };

  return cancelFn;
}

// Alarm and Bell Sound Player Functions
export function playLunchAlarm(durationSeconds = 15): () => void {
  return playBellTone('lunch_alarm', durationSeconds);
}

export function playMealTimeAlarm(durationSeconds = 15): () => void {
  return playBellTone('meal_bell', durationSeconds);
}

export function playExamAlarm(durationSeconds = 15): () => void {
  return playBellTone('exam_alarm', durationSeconds);
}

export function playExamBeepAlarm(durationSeconds = 15): () => void {
  return playBellTone('exam_alarm', durationSeconds);
}

export function playExamChime(kind: 'countdown' | 'start' = 'start', durationSeconds = 15): () => void {
  if (kind === 'countdown') {
    return playBellTone('sixty_sec_bell', durationSeconds);
  }
  return playBellTone('exam_chime', durationSeconds);
}

export function playNotificationAlarm(durationSeconds = 8): () => void {
  return playBellTone('notification_alarm', durationSeconds);
}

export function playSixtySecBell(durationSeconds = 15): () => void {
  return playBellTone('sixty_sec_bell', durationSeconds);
}
