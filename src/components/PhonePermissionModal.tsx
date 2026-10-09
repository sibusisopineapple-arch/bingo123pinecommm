import React, { useState, useEffect } from 'react';
import {
  Smartphone,
  Clock,
  Bell,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Settings,
  RefreshCw,
  SunMedium,
  Zap,
  HardDrive,
  Download,
  Volume2,
  Check,
  X,
  Radio,
  Activity,
  Layers,
  Mic,
  MicOff
} from 'lucide-react';
import { UsapLogo } from './UsapLogo';
import {
  queryAllDevicePermissions,
  requestNotificationPermission,
  requestMicrophonePermission,
  requestPersistentStorage,
  toggleScreenWakeLock,
  triggerDeviceVibration,
  promptPwaInstall,
  subscribeToPermissionChanges,
  DevicePermissionsState
} from '../utils/devicePermissions';
import { sendPhoneNotification } from '../utils/phoneNotification';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onPermissionsUpdated?: () => void;
  onPermissionsGranted?: () => void;
  onOpenSoundSelector?: () => void;
}

export const PhonePermissionModal: React.FC<Props> = ({
  isOpen,
  onClose,
  onPermissionsUpdated,
  onPermissionsGranted,
  onOpenSoundSelector,
}) => {
  const [deviceState, setDeviceState] = useState<DevicePermissionsState>({
    notifications: 'prompt',
    microphone: 'prompt',
    wakeLock: false,
    persistentStorage: false,
    batteryLevel: null,
    batteryCharging: null,
    deviceTime: '',
    deviceTimeZone: '',
    timeZoneOffset: '',
    isMobile: false,
    canInstallPwa: false,
    hasVibration: false,
    backgroundExecutionActive: false,
    backgroundSyncSupported: false,
    periodicSyncSupported: false,
    isServiceWorkerActive: false,
  });

  const [isRequestingNotifications, setIsRequestingNotifications] = useState(false);
  const [isRequestingMicrophone, setIsRequestingMicrophone] = useState(false);
  const [micFeedback, setMicFeedback] = useState<string | null>(null);
  const [showSettingsGuide, setShowSettingsGuide] = useState(false);
  const [showBackgroundHelp, setShowBackgroundHelp] = useState(false);
  const [vibrationFeedback, setVibrationFeedback] = useState(false);
  const [storageFeedback, setStorageFeedback] = useState<string | null>(null);
  const [testBackgroundCountdown, setTestBackgroundCountdown] = useState<number | null>(null);

  const refreshState = async () => {
    const updated = await queryAllDevicePermissions();
    setDeviceState(updated);
  };

  useEffect(() => {
    if (!isOpen) return;

    refreshState();
    const interval = setInterval(refreshState, 1000);
    const unsubscribe = subscribeToPermissionChanges(() => {
      refreshState();
      if (onPermissionsUpdated) onPermissionsUpdated();
    });

    return () => {
      clearInterval(interval);
      unsubscribe();
    };
  }, [isOpen]);

  if (!isOpen) return null;

  // Handle Request Notifications & Background Execution
  const handleRequestNotification = async () => {
    setIsRequestingNotifications(true);
    try {
      const status = await requestNotificationPermission();
      if (status === 'granted') {
        sendPhoneNotification(
          "📲 Background Execution & Alarms Active!",
          `Device Time: ${deviceState.deviceTime} (${deviceState.deviceTimeZone}). USAP School will notify you in the background for Dinner (5:50 PM), Snack (9:00 PM), and Exam warnings.`
        );
        if (onPermissionsGranted) onPermissionsGranted();
      } else if (status === 'denied') {
        setShowSettingsGuide(true);
      }
      await refreshState();
      if (onPermissionsUpdated) onPermissionsUpdated();
    } catch {
      setShowSettingsGuide(true);
    } finally {
      setIsRequestingNotifications(false);
    }
  };

  // Handle Request Microphone Permission
  const handleRequestMicrophone = async () => {
    setIsRequestingMicrophone(true);
    setMicFeedback(null);
    try {
      const status = await requestMicrophonePermission();
      if (status === 'granted') {
        setMicFeedback("Microphone permission granted! Voice communication is enabled.");
      } else if (status === 'denied') {
        setMicFeedback("Microphone was denied. Please allow microphone access in your browser/phone settings.");
        setShowSettingsGuide(true);
      } else {
        setMicFeedback("Microphone not supported on this browser.");
      }
      await refreshState();
      if (onPermissionsUpdated) onPermissionsUpdated();
    } catch {
      setShowSettingsGuide(true);
    } finally {
      setIsRequestingMicrophone(false);
      setTimeout(() => setMicFeedback(null), 4000);
    }
  };

  // Handle Background Test (5 seconds countdown)
  const handleTriggerBackgroundTest = () => {
    setTestBackgroundCountdown(5);
    let count = 5;
    const timer = setInterval(() => {
      count -= 1;
      setTestBackgroundCountdown(count);
      if (count <= 0) {
        clearInterval(timer);
        setTestBackgroundCountdown(null);
        sendPhoneNotification(
          "🔔 Background Alarm Test Successful!",
          "USAP School background engine is functioning properly. Timetable reminders will ring even when the app is minimized."
        );
      }
    }, 1000);
  };

  // Handle Wake Lock Toggle
  const handleToggleWakeLock = async () => {
    const nextState = !deviceState.wakeLock;
    await toggleScreenWakeLock(nextState);
    await refreshState();
  };

  // Handle Persistent Storage Request
  const handleRequestStorage = async () => {
    const granted = await requestPersistentStorage();
    setStorageFeedback(granted ? "Permanent storage granted!" : "Storage permission requested");
    setTimeout(() => setStorageFeedback(null), 3500);
    await refreshState();
  };

  // Handle Test Vibration
  const handleTestVibrate = () => {
    const success = triggerDeviceVibration([250, 100, 250, 100, 450]);
    if (success) {
      setVibrationFeedback(true);
      setTimeout(() => setVibrationFeedback(false), 2000);
    }
  };

  // Handle PWA Install
  const handleInstallApp = async () => {
    await promptPwaInstall();
    await refreshState();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-8 shadow-2xl border-2 border-purple-200 animate-in fade-in zoom-in-95 my-4">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-purple-100 pb-4 mb-4">
          <UsapLogo size="sm" />
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-black uppercase tracking-wider bg-purple-100 text-purple-800 px-3 py-1 rounded-full">
              Device & Background
            </span>
            <button
              onClick={onClose}
              className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Title */}
        <div className="text-left mb-5">
          <div className="flex items-center gap-2 text-purple-950 font-black text-lg">
            <Smartphone className="w-5 h-5 text-purple-600" />
            <h3>Allow App to Work in Background</h3>
          </div>
          <p className="text-xs text-slate-500 font-medium mt-1">
            Allow USAP Community School to operate continuously in the background to dispatch timely meal reminders (5:50 PM Dinner, 9:00 PM Snack) and exam quiet warnings even when the phone is locked.
          </p>
        </div>

        {/* FEATURE: Background Execution Status Card */}
        <div className="p-4 rounded-2xl bg-gradient-to-br from-purple-900 to-indigo-950 text-white mb-4 text-left border border-purple-800 shadow-md">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2 font-bold text-xs">
              <Activity className="w-4 h-4 text-emerald-400 animate-pulse" />
              <span>Background Service Worker Status</span>
            </div>
            <span
              className={`text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider ${
                deviceState.backgroundExecutionActive
                  ? 'bg-emerald-500 text-slate-950'
                  : 'bg-amber-400 text-slate-950'
              }`}
            >
              {deviceState.backgroundExecutionActive ? 'Active in Background' : 'Permission Required'}
            </span>
          </div>

          <p className="text-[11px] text-purple-200 mb-3 leading-relaxed">
            {deviceState.backgroundExecutionActive
              ? 'USAP School is active in the background. Background alarms and meal timers will trigger automatically when this tab is closed or your phone screen is turned off.'
              : 'Grant notification permission below to allow the background Service Worker thread to monitor schedules when the app is closed or minimized.'}
          </p>

          <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-purple-800/80">
            {deviceState.notifications !== 'granted' ? (
              <button
                onClick={handleRequestNotification}
                disabled={isRequestingNotifications}
                className="px-3.5 py-2 bg-purple-500 hover:bg-purple-400 text-white font-extrabold text-xs rounded-xl shadow-xs transition flex items-center gap-1.5 disabled:opacity-60"
              >
                {isRequestingNotifications ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <ShieldCheck className="w-3.5 h-3.5" />}
                <span>Allow Background Alerts & Time</span>
              </button>
            ) : (
              <button
                onClick={handleTriggerBackgroundTest}
                disabled={testBackgroundCountdown !== null}
                className="px-3.5 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs rounded-xl shadow-xs transition flex items-center gap-1.5"
              >
                <Radio className="w-3.5 h-3.5" />
                <span>
                  {testBackgroundCountdown !== null
                    ? `Minimize now! Alert in ${testBackgroundCountdown}s...`
                    : 'Test Background Alert (5s)'}
                </span>
              </button>
            )}

            <button
              onClick={() => setShowBackgroundHelp(!showBackgroundHelp)}
              className="text-[11px] text-purple-300 hover:text-white font-bold underline ml-auto"
            >
              {showBackgroundHelp ? 'Hide OS Guide' : 'Phone OS Sleep Guide'}
            </button>
          </div>
        </div>

        {/* Battery & OS Sleep Guidance for Background Execution */}
        {showBackgroundHelp && (
          <div className="bg-indigo-50 border border-indigo-200 rounded-2xl p-4 mb-4 text-left text-xs space-y-2">
            <div className="flex items-center gap-1.5 font-bold text-indigo-950">
              <Layers className="w-4 h-4 text-indigo-600" />
              <span>How to Keep App Alive in Background on Mobile OS:</span>
            </div>
            <ul className="text-[11px] text-indigo-900 space-y-1.5 list-disc pl-4">
              <li>
                <strong>Android (Chrome / Samsung):</strong> Go to <em>Settings → Apps → Chrome / USAP School → Battery → Select "Unrestricted"</em>. This prevents Android from putting the app to sleep.
              </li>
              <li>
                <strong>iPhone (iOS):</strong> Tap <em>Share → Add to Home Screen</em>. PWA home screen web apps on iOS 16.4+ support background Web Push alerts.
              </li>
              <li>
                <strong>Do Not Disturb:</strong> Allow USAP School notifications through priority / quiet mode if you wish to receive exam countdowns.
              </li>
            </ul>
          </div>
        )}

        {/* SECTION 1: Clock & Time Synchronization */}
        <div className="bg-purple-50/80 border border-purple-200 rounded-2xl p-4 mb-4 text-left space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-purple-950 flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-purple-600" />
              Device Clock & Timezone Synchronization
            </span>
            <span className="text-[10px] font-mono bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-bold">
              Time Synced
            </span>
          </div>

          <div className="bg-white p-3 rounded-xl border border-purple-100 text-xs font-medium space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-slate-500">Live Device Time:</span>
              <strong className="font-mono text-purple-950 text-base font-black">
                {deviceState.deviceTime || '--:--:--'}
              </strong>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-500">Timezone & Offset:</span>
              <span className="text-slate-700 font-semibold">
                {deviceState.deviceTimeZone} ({deviceState.timeZoneOffset})
              </span>
            </div>
          </div>
          <p className="text-[11px] text-purple-800 font-medium">
            Accurate device time ensures exact dispatch for <strong>5:50 PM Dinner</strong>, <strong>9:00 PM Snack</strong>, <strong>Prep End</strong>, and <strong>60-Second Exam warnings</strong>.
          </p>
        </div>

        {/* SECTION 2: Notification Permissions */}
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 mb-4 text-left">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Bell className="w-4 h-4 text-purple-600" />
              <span className="text-xs font-bold text-slate-900">Background Alerts & Alarms</span>
            </div>
            <span
              className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                deviceState.notifications === 'granted'
                  ? 'bg-emerald-100 text-emerald-800'
                  : deviceState.notifications === 'denied'
                  ? 'bg-rose-100 text-rose-800'
                  : 'bg-amber-100 text-amber-800'
              }`}
            >
              {deviceState.notifications}
            </span>
          </div>

          <p className="text-[11px] text-slate-600 mb-3">
            Allows your phone to ring, buzz, and display notifications for upcoming exams, quiet hours, and daily meals.
          </p>

          {deviceState.notifications !== 'granted' ? (
            <button
              onClick={handleRequestNotification}
              disabled={isRequestingNotifications}
              className="w-full py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-extrabold text-xs rounded-xl shadow-md shadow-purple-600/20 transition flex items-center justify-center gap-2 disabled:opacity-60"
            >
              {isRequestingNotifications ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <ShieldCheck className="w-3.5 h-3.5" />
              )}
              <span>Grant Phone Notification Permission</span>
            </button>
          ) : (
            <div className="flex items-center justify-between bg-emerald-50 border border-emerald-200 text-emerald-800 p-2.5 rounded-xl text-xs font-bold">
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                Phone Alarms & Reminders Active
              </span>
              <button
                onClick={() => sendPhoneNotification("🔔 Test Alert", "Phone communication is active!")}
                className="text-[10px] bg-white border border-emerald-300 text-emerald-700 px-2 py-1 rounded-lg hover:bg-emerald-100 transition"
              >
                Send Test
              </button>
            </div>
          )}
        </div>

        {/* SECTION 2b: Microphone Permission for Voice Announcements */}
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 mb-4 text-left">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Mic className="w-4 h-4 text-purple-600" />
              <span className="text-xs font-bold text-slate-900">Microphone Permission</span>
            </div>
            <span
              className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                deviceState.microphone === 'granted'
                  ? 'bg-emerald-100 text-emerald-800'
                  : deviceState.microphone === 'denied'
                  ? 'bg-rose-100 text-rose-800'
                  : 'bg-amber-100 text-amber-800'
              }`}
            >
              {deviceState.microphone}
            </span>
          </div>

          <p className="text-[11px] text-slate-600 mb-3">
            Required for recording and sending high-fidelity voice audio clips on the School Announcements board.
          </p>

          {deviceState.microphone !== 'granted' ? (
            <button
              onClick={handleRequestMicrophone}
              disabled={isRequestingMicrophone}
              className="w-full py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-extrabold text-xs rounded-xl shadow-md shadow-purple-600/20 transition flex items-center justify-center gap-2 disabled:opacity-60"
            >
              {isRequestingMicrophone ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Mic className="w-3.5 h-3.5" />
              )}
              <span>Allow Microphone Permission</span>
            </button>
          ) : (
            <div className="flex items-center justify-between bg-emerald-50 border border-emerald-200 text-emerald-800 p-2.5 rounded-xl text-xs font-bold">
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                Microphone Access Granted
              </span>
              <button
                onClick={handleRequestMicrophone}
                className="text-[10px] bg-white border border-emerald-300 text-emerald-700 px-2.5 py-1 rounded-lg hover:bg-emerald-100 transition"
              >
                Re-test Mic
              </button>
            </div>
          )}

          {micFeedback && (
            <div className="mt-2.5 p-2 rounded-xl bg-purple-100/70 text-purple-900 text-[11px] font-bold">
              {micFeedback}
            </div>
          )}
        </div>

        {/* SECTION 3: Hardware Integrations (Wake Lock, Vibration, Battery, Storage) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4 text-left">
          {/* Screen Wake Lock */}
          <div className="p-3.5 rounded-2xl border border-slate-200 bg-white space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
                <SunMedium className="w-4 h-4 text-amber-500" />
                <span>Keep Screen Awake</span>
              </div>
              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${deviceState.wakeLock ? 'bg-amber-100 text-amber-900' : 'bg-slate-100 text-slate-500'}`}>
                {deviceState.wakeLock ? 'Active' : 'Off'}
              </span>
            </div>
            <p className="text-[10px] text-slate-500 leading-tight">
              Prevents phone display from sleeping during test countdowns.
            </p>
            <button
              onClick={handleToggleWakeLock}
              className={`w-full py-1.5 rounded-lg text-xs font-bold transition border ${
                deviceState.wakeLock
                  ? 'bg-amber-50 border-amber-300 text-amber-900 hover:bg-amber-100'
                  : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
              }`}
            >
              {deviceState.wakeLock ? 'Release Wake Lock' : 'Enable Wake Lock'}
            </button>
          </div>

          {/* Haptic Vibration */}
          <div className="p-3.5 rounded-2xl border border-slate-200 bg-white space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
                <Zap className="w-4 h-4 text-indigo-600" />
                <span>Phone Haptic Buzz</span>
              </div>
              <span className="text-[10px] font-bold text-slate-400">
                {deviceState.hasVibration ? 'Supported' : 'Unavailable'}
              </span>
            </div>
            <p className="text-[10px] text-slate-500 leading-tight">
              Silent vibration motor alerts for exams in quiet zones.
            </p>
            <button
              onClick={handleTestVibrate}
              disabled={!deviceState.hasVibration}
              className="w-full py-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 rounded-lg text-xs font-bold transition disabled:opacity-50"
            >
              {vibrationFeedback ? 'Buzzing Phone! 📳' : 'Test Vibration'}
            </button>
          </div>

          {/* Persistent Storage */}
          <div className="p-3.5 rounded-2xl border border-slate-200 bg-white space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
                <HardDrive className="w-4 h-4 text-teal-600" />
                <span>Offline Storage</span>
              </div>
              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${deviceState.persistentStorage ? 'bg-teal-100 text-teal-900' : 'bg-slate-100 text-slate-500'}`}>
                {deviceState.persistentStorage ? 'Permanent' : 'Standard'}
              </span>
            </div>
            <p className="text-[10px] text-slate-500 leading-tight">
              Retains timetable data when phone is in low memory mode.
            </p>
            <button
              onClick={handleRequestStorage}
              className="w-full py-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 rounded-lg text-xs font-bold transition"
            >
              {storageFeedback || (deviceState.persistentStorage ? 'Storage Locked' : 'Request Lock')}
            </button>
          </div>

          {/* Battery Status */}
          <div className="p-3.5 rounded-2xl border border-slate-200 bg-white space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
                <Smartphone className="w-4 h-4 text-purple-600" />
                <span>Battery Guard</span>
              </div>
              <span className="text-[10px] font-mono font-bold text-slate-700">
                {deviceState.batteryLevel !== null ? `${deviceState.batteryLevel}%` : 'N/A'}
              </span>
            </div>
            <p className="text-[10px] text-slate-500 leading-tight">
              {deviceState.batteryCharging ? 'Charging ⚡' : 'Monitors battery level for exams.'}
            </p>
            <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
              <div
                className={`h-full transition-all ${
                  (deviceState.batteryLevel || 100) > 20 ? 'bg-emerald-500' : 'bg-rose-500'
                }`}
                style={{ width: `${deviceState.batteryLevel || 100}%` }}
              />
            </div>
          </div>
        </div>

        {/* PWA Home Screen Installation (If available) */}
        {deviceState.canInstallPwa && (
          <div className="p-3.5 rounded-2xl bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-200 mb-4 text-left flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <Download className="w-4 h-4 text-purple-700" />
              <div>
                <div className="text-xs font-bold text-purple-950">Install App to Phone Home Screen</div>
                <div className="text-[10px] text-purple-700">Runs as standalone app with full background execution</div>
              </div>
            </div>
            <button
              onClick={handleInstallApp}
              className="px-3 py-1.5 bg-purple-600 text-white font-bold text-xs rounded-xl shadow-xs transition hover:bg-purple-700 shrink-0"
            >
              Install
            </button>
          </div>
        )}

        {/* Device Ringtones & Alarmtone Configuration (15s duration) */}
        {onOpenSoundSelector && (
          <div className="p-3.5 rounded-2xl bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 mb-4 text-left flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-amber-600 text-white flex items-center justify-center shrink-0 shadow-2xs">
                <Bell className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xs font-black text-amber-950">Device Ringtones & Alarmtones</div>
                <div className="text-[10px] text-amber-800 font-medium">Link custom phone sounds for Meal Bell, Exam Chime, & 60s Warning (15s active countdown)</div>
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenSoundSelector();
              }}
              className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-black text-xs rounded-xl shadow-xs transition shrink-0"
            >
              Configure Bells
            </button>
          </div>
        )}

        {/* Settings Help Accordion */}
        {showSettingsGuide && (
          <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4 mb-4 text-left text-xs space-y-2">
            <div className="flex items-center gap-1.5 font-bold text-rose-900">
              <Settings className="w-4 h-4 text-rose-600" />
              <span>Direct Phone Settings Instructions:</span>
            </div>
            <ul className="text-[11px] text-rose-800 space-y-1 list-disc pl-4">
              <li>
                <strong>Android:</strong> Open phone <em>Settings → Apps → Chrome / Firefox / USAP School → Permissions → Notifications & Microphone → Allow</em>.
              </li>
              <li>
                <strong>iPhone / iOS:</strong> Open <em>Settings → Safari / Chrome → Notifications → Allow</em>, and enable <em>Microphone</em> under website permissions.
              </li>
              <li>
                <strong>Time Access:</strong> Ensure <em>Settings → Date & Time → "Set automatically"</em> is enabled on your phone.
              </li>
            </ul>
          </div>
        )}

        {/* Modal Footer Controls */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-100">
          <button
            onClick={() => setShowSettingsGuide(!showSettingsGuide)}
            className="text-xs font-bold text-purple-700 hover:text-purple-900 flex items-center gap-1"
          >
            <Settings className="w-3.5 h-3.5" />
            <span>{showSettingsGuide ? 'Hide Settings Guide' : 'Phone Settings Guide'}</span>
          </button>

          <button
            onClick={onClose}
            className="px-5 py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-extrabold text-xs rounded-xl shadow-md transition"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
