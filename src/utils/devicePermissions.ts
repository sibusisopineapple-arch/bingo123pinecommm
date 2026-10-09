// Comprehensive Device Permissions & Hardware Integration Utility

export interface DevicePermissionsState {
  notifications: 'granted' | 'denied' | 'prompt' | 'unsupported';
  microphone: 'granted' | 'denied' | 'prompt' | 'unsupported';
  wakeLock: boolean;
  persistentStorage: boolean;
  batteryLevel: number | null;
  batteryCharging: boolean | null;
  deviceTime: string;
  deviceTimeZone: string;
  timeZoneOffset: string;
  isMobile: boolean;
  canInstallPwa: boolean;
  hasVibration: boolean;
  backgroundExecutionActive: boolean;
  backgroundSyncSupported: boolean;
  periodicSyncSupported: boolean;
  isServiceWorkerActive: boolean;
}

let wakeLockSentinel: any = null;
let deferredPrompt: any = null;

// Listen for PWA Install Prompt
if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
  });
}

// Check if user is on mobile
export function isMobileDevice(): boolean {
  if (typeof navigator === 'undefined') return false;
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
}

// Format UTC offset
export function getTimeZoneOffsetString(): string {
  const offsetMinutes = -new Date().getTimezoneOffset();
  const sign = offsetMinutes >= 0 ? '+' : '-';
  const hours = Math.floor(Math.abs(offsetMinutes) / 60);
  const mins = Math.abs(offsetMinutes) % 60;
  return `UTC${sign}${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;
}

// Request Notification Permission
export async function requestNotificationPermission(): Promise<'granted' | 'denied' | 'default'> {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return 'denied';
  }
  try {
    const result = await Notification.requestPermission();
    return result;
  } catch {
    return 'denied';
  }
}

// Request Microphone Permission
export async function requestMicrophonePermission(): Promise<'granted' | 'denied' | 'unsupported'> {
  if (typeof navigator === 'undefined' || !navigator.mediaDevices || typeof navigator.mediaDevices.getUserMedia !== 'function') {
    return 'unsupported';
  }
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    // Release audio tracks immediately after permission check
    stream.getTracks().forEach((track) => track.stop());
    return 'granted';
  } catch (err: any) {
    if (err?.name === 'NotAllowedError' || err?.name === 'PermissionDeniedError') {
      return 'denied';
    }
    return 'denied';
  }
}

// Request Persistent Storage
export async function requestPersistentStorage(): Promise<boolean> {
  if (typeof navigator !== 'undefined' && navigator.storage && navigator.storage.persist) {
    try {
      const isPersisted = await navigator.storage.persist();
      return isPersisted;
    } catch {
      return false;
    }
  }
  return false;
}

// Toggle Screen Wake Lock (keep screen awake during exams & timetable)
export async function toggleScreenWakeLock(enable: boolean): Promise<boolean> {
  if (typeof navigator === 'undefined' || !('wakeLock' in navigator)) {
    return false;
  }

  try {
    if (enable) {
      wakeLockSentinel = await (navigator as any).wakeLock.request('screen');
      wakeLockSentinel.addEventListener('release', () => {
        wakeLockSentinel = null;
      });
      return true;
    } else {
      if (wakeLockSentinel) {
        await wakeLockSentinel.release();
        wakeLockSentinel = null;
      }
      return false;
    }
  } catch {
    return false;
  }
}

// Check current wake lock status
export function isWakeLockActive(): boolean {
  return wakeLockSentinel !== null && !wakeLockSentinel.released;
}

// Trigger Phone Haptic Vibration
export function triggerDeviceVibration(pattern: number[] = [200, 100, 200]): boolean {
  if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
    try {
      return navigator.vibrate(pattern);
    } catch {
      return false;
    }
  }
  return false;
}

// Trigger PWA Installation to Home Screen
export async function promptPwaInstall(): Promise<boolean> {
  if (!deferredPrompt) return false;
  try {
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    deferredPrompt = null;
    return outcome === 'accepted';
  } catch {
    return false;
  }
}

export function canInstallPwa(): boolean {
  return deferredPrompt !== null;
}

// Fetch all current device permissions & hardware states
export async function queryAllDevicePermissions(): Promise<DevicePermissionsState> {
  const now = new Date();
  const isMobile = isMobileDevice();

  // 1. Notifications
  let notifications: 'granted' | 'denied' | 'prompt' | 'unsupported' = 'unsupported';
  if (typeof window !== 'undefined' && 'Notification' in window) {
    if (Notification.permission === 'granted') notifications = 'granted';
    else if (Notification.permission === 'denied') notifications = 'denied';
    else notifications = 'prompt';
  }

  // 1b. Microphone
  let microphone: 'granted' | 'denied' | 'prompt' | 'unsupported' = 'unsupported';
  if (typeof navigator !== 'undefined' && navigator.permissions && typeof navigator.permissions.query === 'function') {
    try {
      const micStatus = await navigator.permissions.query({ name: 'microphone' as any });
      if (micStatus.state === 'granted') microphone = 'granted';
      else if (micStatus.state === 'denied') microphone = 'denied';
      else microphone = 'prompt';
    } catch {
      // Fallback if permissions.query doesn't support 'microphone'
      if (typeof navigator.mediaDevices !== 'undefined' && typeof navigator.mediaDevices.getUserMedia === 'function') {
        microphone = 'prompt';
      }
    }
  } else if (typeof navigator !== 'undefined' && typeof navigator.mediaDevices !== 'undefined' && typeof navigator.mediaDevices.getUserMedia === 'function') {
    microphone = 'prompt';
  }

  // 2. Persistent Storage
  let persistentStorage = false;
  if (typeof navigator !== 'undefined' && navigator.storage && navigator.storage.persisted) {
    try {
      persistentStorage = await navigator.storage.persisted();
    } catch {}
  }

  // 3. Battery Guard
  let batteryLevel: number | null = null;
  let batteryCharging: boolean | null = null;
  if (typeof navigator !== 'undefined' && 'getBattery' in navigator) {
    try {
      const battery = await (navigator as any).getBattery();
      batteryLevel = Math.round(battery.level * 100);
      batteryCharging = battery.charging;
    } catch {}
  }

  // 4. Background Execution & Service Worker
  let isServiceWorkerActive = false;
  let backgroundSyncSupported = false;
  let periodicSyncSupported = false;

  if (typeof navigator !== 'undefined' && 'serviceWorker' in navigator) {
    isServiceWorkerActive = !!navigator.serviceWorker.controller;
    if ('SyncManager' in window || 'sync' in (ServiceWorkerRegistration.prototype as any)) {
      backgroundSyncSupported = true;
    }
    if ('periodicSync' in (ServiceWorkerRegistration.prototype as any)) {
      periodicSyncSupported = true;
    }
  }

  // Background execution is considered active when notifications are granted and service worker is running
  const backgroundExecutionActive = notifications === 'granted' && isServiceWorkerActive;

  // 5. Time
  const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'System Local Time';
  const timeString = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });

  return {
    notifications,
    microphone,
    wakeLock: isWakeLockActive(),
    persistentStorage,
    batteryLevel,
    batteryCharging,
    deviceTime: timeString,
    deviceTimeZone: timeZone,
    timeZoneOffset: getTimeZoneOffsetString(),
    isMobile,
    canInstallPwa: canInstallPwa(),
    hasVibration: typeof navigator !== 'undefined' && 'vibrate' in navigator,
    backgroundExecutionActive,
    backgroundSyncSupported,
    periodicSyncSupported,
    isServiceWorkerActive
  };
}

// Subscribe to Permission changes if supported by browser
export function subscribeToPermissionChanges(callback: () => void): () => void {
  if (typeof navigator === 'undefined' || !navigator.permissions || !navigator.permissions.query) {
    return () => {};
  }

  let statusObj: PermissionStatus | null = null;
  let micStatusObj: PermissionStatus | null = null;

  try {
    navigator.permissions.query({ name: 'notifications' as PermissionName }).then((status) => {
      statusObj = status;
      status.onchange = () => {
        callback();
      };
    }).catch(() => {});

    navigator.permissions.query({ name: 'microphone' as any }).then((status) => {
      micStatusObj = status;
      status.onchange = () => {
        callback();
      };
    }).catch(() => {});
  } catch {}

  return () => {
    if (statusObj) {
      statusObj.onchange = null;
    }
    if (micStatusObj) {
      micStatusObj.onchange = null;
    }
  };
}
