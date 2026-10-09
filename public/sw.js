// USAP Community School - Advanced Background Service Worker
// Enables Background Execution, Offline Caching, Background Sync, and Timetable Alarms

const CACHE_NAME = 'usap-school-v2';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/standalone.html'
];

// In-worker storage for background scheduled alerts
let backgroundAlarms = [];
let alertedKeys = {};
let backgroundIntervalId = null;

// 1. INSTALLATION: Pre-cache core shell
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS).catch((err) => {
        console.warn('Pre-caching non-fatal warning:', err);
      });
    }).then(() => self.skipWaiting())
  );
});

// 2. ACTIVATION: Claim all clients immediately & clean old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      );
    }).then(() => self.clients.claim())
  );
  startBackgroundTimer();
});

// 3. FETCH: Stale-while-revalidate for offline operation
self.addEventListener('fetch', (event) => {
  // Pass non-GET and firestore / api requests through network
  if (event.request.method !== 'GET' || event.request.url.includes('firestore.googleapis.com') || event.request.url.includes('identitytoolkit')) {
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      const fetchPromise = fetch(event.request).then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }
        return networkResponse;
      }).catch(() => cachedResponse);

      return cachedResponse || fetchPromise;
    })
  );
});

// 4. BACKGROUND ALARM TICKER
function startBackgroundTimer() {
  if (backgroundIntervalId) clearInterval(backgroundIntervalId);

  // Check every 15 seconds in the background
  backgroundIntervalId = setInterval(() => {
    checkBackgroundAlarms();
  }, 15000);
}

function checkBackgroundAlarms() {
  const now = new Date();
  const hours = now.getHours();
  const minutes = now.getMinutes();
  const day = now.getDay(); // 0 = Sun, 6 = Sat
  const isWeekend = day === 0 || day === 6;
  const todayStr = now.toISOString().slice(0, 10);
  const nowMs = now.getTime();

  // A. Daily Meal Alarms
  // 1. Weekday Lunch: 1:05 PM (13:05)
  const weekdayLunchKey = `${todayStr}_bg_lunch_weekday_1305`;
  if (!isWeekend && hours === 13 && minutes === 5 && !alertedKeys[weekdayLunchKey]) {
    alertedKeys[weekdayLunchKey] = true;
    showBgNotification(
      '🍽️ Lunch Time (1:05 PM) — Meal Alarm',
      'Weekday lunch is now served! Students and staff proceed to the Dining Hall (DH).',
      'weekday-lunch-alarm'
    );
  }

  // 2. Weekend Lunch: 12:55 PM (12:55)
  const weekendLunchKey = `${todayStr}_bg_lunch_weekend_1255`;
  if (isWeekend && hours === 12 && minutes === 55 && !alertedKeys[weekendLunchKey]) {
    alertedKeys[weekendLunchKey] = true;
    showBgNotification(
      '🍽️ Weekend Lunch Time (12:55 PM) — Meal Alarm',
      'Weekend lunch is now served! Students and staff proceed to the Dining Hall (DH).',
      'weekend-lunch-alarm'
    );
  }

  // 3. Everyday Dinner: 5:50 PM (17:50) signifying meal time
  const dinnerKey = `${todayStr}_bg_dinner_1750`;
  if (hours === 17 && minutes === 50 && !alertedKeys[dinnerKey]) {
    alertedKeys[dinnerKey] = true;
    showBgNotification(
      '🍽️ Dinner Time (5:50 PM) — Meal Alarm',
      '5:50 PM Meal time alert! Dinner is served in 10 minutes at 6:00 PM. Please proceed to the Dining Hall (DH).',
      'dinner-bg-alarm'
    );
  }

  // 4. Evening Snack (9:00 PM)
  const snackKey = `${todayStr}_bg_snack_2100`;
  if (hours === 21 && minutes === 0 && !alertedKeys[snackKey]) {
    alertedKeys[snackKey] = true;
    const body = isWeekend
      ? 'Evening snack time. On weekends prep ends at 9:00 PM. Students are advised to sleep immediately.'
      : 'Evening snack time. Students and staff are invited to have their evening snack in the DH.';
    showBgNotification('🥪 Evening Snack Time', body, 'snack-bg-alarm');
  }

  // 5. Weekday Prep Ended (10:30 PM)
  const prepKey = `${todayStr}_bg_prep_2230`;
  if (!isWeekend && hours === 22 && minutes === 30 && !alertedKeys[prepKey]) {
    alertedKeys[prepKey] = true;
    showBgNotification('🌙 Prep Has Ended', 'Weekday prep has ended. Students are advised to proceed to dormitories and sleep.', 'prep-bg-alarm');
  }

  // B. Registered dynamic tests (60s countdown & Exam Start alerts)
  if (Array.isArray(backgroundAlarms)) {
    for (const test of backgroundAlarms) {
      if (!test.startsAt) continue;
      const startMs = new Date(test.startsAt).getTime();
      const diff = startMs - nowMs;

      // 60-Second Exam Countdown (Beep Alarm active)
      const countdownKey = `${test.id}_bg_countdown`;
      if (diff > 0 && diff <= 65000 && !alertedKeys[countdownKey]) {
        alertedKeys[countdownKey] = true;
        showBgNotification(
          `⚠️ Exam Beep Alarm: Starting in 60s!`,
          `Strict silence advised: ${test.schoolClass} is about to write “${test.title}” (${test.subject}) in ${test.room}. Campus quiet protocol active.`,
          countdownKey
        );
      }

      // Exam Started
      const startKey = `${test.id}_bg_started`;
      const endMs = new Date(test.endsAt || startMs + 3600000).getTime();
      if (nowMs >= startMs && nowMs < endMs && !alertedKeys[startKey]) {
        alertedKeys[startKey] = true;
        showBgNotification(
          `🔔 Exam In Progress — Silence Advised`,
          `Exam has officially commenced: ${test.schoolClass} (“${test.title}” - ${test.subject}) in ${test.room}. Please maintain strict silence.`,
          startKey
        );
      }
    }
  }
}

function showBgNotification(title, body, tag) {
  self.registration.showNotification(title, {
    body,
    icon: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><text y=".9em" font-size="90">🍍</text></svg>',
    badge: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><text y=".9em" font-size="90">🍍</text></svg>',
    tag: tag || 'usap-background-alert',
    renotify: true,
    requireInteraction: true, // Stays on screen/phone lock screen until user acts
    vibrate: [300, 150, 300, 150, 500],
    data: { url: '/' },
    actions: [
      { action: 'open', title: 'Open Timetable' },
      { action: 'dismiss', title: 'Acknowledge' }
    ]
  }).catch((e) => {
    console.warn('Background showNotification error:', e);
  });
}

// 5. CLIENT COMMUNICATION & SYNC
self.addEventListener('message', (event) => {
  if (!event.data) return;

  // Immediate notification request
  if (event.data.type === 'SHOW_NOTIFICATION') {
    const { title, body, tag } = event.data;
    showBgNotification(title, body, tag);
  }

  // Sync timetable tests to background worker
  if (event.data.type === 'SYNC_BACKGROUND_SCHEDULE') {
    backgroundAlarms = event.data.tests || [];
    checkBackgroundAlarms();
  }

  // Ping / Keep-alive
  if (event.data.type === 'BACKGROUND_PING') {
    event.ports && event.ports[0] && event.ports[0].postMessage({ status: 'active', alarmsCount: backgroundAlarms.length });
  }
});

// 6. BACKGROUND SYNC API (Standard Web API)
self.addEventListener('sync', (event) => {
  if (event.tag === 'usap-sync-alarms' || event.tag === 'sync-usap-schedule') {
    event.waitUntil(Promise.resolve(checkBackgroundAlarms()));
  }
});

// 7. PERIODIC BACKGROUND SYNC API (Chromium / Android)
self.addEventListener('periodicsync', (event) => {
  if (event.tag === 'usap-periodic-alarms') {
    event.waitUntil(Promise.resolve(checkBackgroundAlarms()));
  }
});

// 8. NOTIFICATION CLICK HANDLING
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'dismiss') {
    return;
  }

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if ('focus' in client) {
          return client.focus();
        }
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow('/');
      }
    })
  );
});

// 9. PUSH EVENT (Web Push fallback)
self.addEventListener('push', (event) => {
  let data = { title: 'USAP School Alert', body: 'New timetable announcement.' };
  if (event.data) {
    try {
      data = event.data.json();
    } catch {
      data.body = event.data.text();
    }
  }
  event.waitUntil(showBgNotification(data.title, data.body, 'usap-push'));
});
