import { playExamChime, playMealTimeAlarm, playExamBeepAlarm } from './audioChime';
import { SchoolTest } from '../types';

let swRegistration: ServiceWorkerRegistration | null = null;

// Initialize Service Worker with Background Execution Support
export async function initPhoneNotifications(): Promise<boolean> {
  if (typeof window === 'undefined') return false;

  if ('serviceWorker' in navigator) {
    try {
      const reg = await navigator.serviceWorker.register('/sw.js', { scope: '/' });
      swRegistration = reg;

      // Register Background Sync if supported
      if ('sync' in reg) {
        try {
          await (reg as any).sync.register('usap-sync-alarms');
          console.log('Background Sync registered successfully');
        } catch (e) {
          console.log('Background sync registration skipped:', e);
        }
      }

      // Register Periodic Background Sync if supported (Android Chromium)
      if ('periodicSync' in reg) {
        try {
          const status = await (navigator as any).permissions?.query({ name: 'periodic-background-sync' });
          if (status?.state === 'granted' || !status) {
            await (reg as any).periodicSync.register('usap-periodic-alarms', {
              minInterval: 60 * 1000 // 1 minute
            });
            console.log('Periodic Background Sync registered');
          }
        } catch (e) {
          console.log('Periodic background sync skipped:', e);
        }
      }

      console.log('USAP Background Service Worker registered');
      return true;
    } catch (e) {
      console.warn('ServiceWorker registration error:', e);
    }
  }
  return false;
}

// Request Notification & Background Alert Permission
export async function requestPhoneNotificationPermission(): Promise<NotificationPermission> {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return 'denied';
  }

  try {
    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      await initPhoneNotifications();
    }
    return permission;
  } catch {
    return 'denied';
  }
}

// Check current notification permission
export function getPhoneNotificationStatus(): 'granted' | 'denied' | 'default' | 'unsupported' {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return 'unsupported';
  }
  return Notification.permission;
}

// Sync tests and timetable to the background Service Worker thread
export function syncScheduleToBackground(tests: SchoolTest[]) {
  if (typeof navigator === 'undefined' || !navigator.serviceWorker) return;

  const controller = navigator.serviceWorker.controller;
  if (controller) {
    controller.postMessage({
      type: 'SYNC_BACKGROUND_SCHEDULE',
      tests: tests.map(t => ({
        id: t.id,
        title: t.title,
        subject: t.subject,
        schoolClass: t.schoolClass,
        room: t.room,
        startsAt: t.startsAt,
        endsAt: t.endsAt
      }))
    });
  } else if (navigator.serviceWorker.ready) {
    navigator.serviceWorker.ready.then(reg => {
      if (reg.active) {
        reg.active.postMessage({
          type: 'SYNC_BACKGROUND_SCHEDULE',
          tests: tests.map(t => ({
            id: t.id,
            title: t.title,
            subject: t.subject,
            schoolClass: t.schoolClass,
            room: t.room,
            startsAt: t.startsAt,
            endsAt: t.endsAt
          }))
        });
      }
    });
  }
}

// Send immediate phone notification
export function sendPhoneNotification(
  title: string,
  body: string,
  options?: {
    tag?: string;
    sound?: boolean;
    soundType?: 'meal-alarm' | 'exam-beep' | 'exam-start' | 'countdown' | 'default';
  }
) {
  // 1. Phone Vibration tailored to notification urgency
  if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
    try {
      if (options?.soundType === 'meal-alarm') {
        // Sustained bell vibration pattern
        navigator.vibrate([400, 200, 400, 200, 400, 200, 800]);
      } else if (options?.soundType === 'exam-beep') {
        // Quick urgent beeping vibration pattern
        navigator.vibrate([120, 80, 120, 80, 120, 80, 120, 80, 300]);
      } else {
        navigator.vibrate([300, 150, 300, 150, 500]);
      }
    } catch {}
  }

  // 2. Audio Chime / Alarm
  if (options?.sound !== false) {
    if (options?.soundType === 'meal-alarm') {
      playMealTimeAlarm();
    } else if (options?.soundType === 'exam-beep') {
      playExamBeepAlarm();
    } else if (options?.soundType === 'countdown') {
      playExamChime('countdown');
    } else {
      playExamChime('start');
    }
  }

  // 3. Service Worker Notification (Primary for mobile background operation)
  if (swRegistration && swRegistration.showNotification) {
    swRegistration.showNotification(title, {
      body,
      icon: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><text y=".9em" font-size="90">🍍</text></svg>',
      badge: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><text y=".9em" font-size="90">🍍</text></svg>',
      tag: options?.tag || 'usap-reminder',
      renotify: true,
      requireInteraction: true,
      data: { url: '/' },
      vibrate: [300, 150, 300, 150, 500],
      actions: [
        { action: 'open', title: 'Open Timetable' },
        { action: 'dismiss', title: 'Acknowledge' }
      ]
    } as any).catch(() => {
      fallbackNotification(title, body, options?.tag);
    });
    return;
  }

  // 4. Standard Browser Notification fallback
  fallbackNotification(title, body, options?.tag);
}

function fallbackNotification(title: string, body: string, tag?: string) {
  if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
    try {
      new Notification(title, {
        body,
        icon: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><text y=".9em" font-size="90">🍍</text></svg>',
        tag: tag || 'usap-reminder',
      });
    } catch (e) {
      console.warn('Standard notification failed:', e);
    }
  }
}
