// High-Capacity IndexedDB & Memory Store for Custom Alarm & Ringtone Audio Files
// Supports unlimited/large audio file uploads without localStorage quota limits

export interface UserCustomTone {
  id: string; // unique ID e.g. "custom_..."
  userId: string; // Scoped to user's account only
  userEmail?: string;
  name: string; // display name given by user
  fileName: string; // original file name e.g. "my_alarm.mp3"
  audioData: string; // data:audio/...;base64,...
  fileSize: number; // in bytes
  uploadedAt: string; // ISO string
}

const DB_NAME = 'USAP_CustomAlarmTonesDB';
const STORE_NAME = 'user_custom_tones';
const DB_VERSION = 1;

// In-memory cache keyed by userId for instantaneous synchronous audio retrieval during bells
const memoryTonesCache: Map<string, UserCustomTone[]> = new Map();
let isIndexedDBReady = false;

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      reject(new Error('IndexedDB not supported'));
      return;
    }

    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        store.createIndex('userId', 'userId', { unique: false });
      }
    };

    request.onsuccess = () => {
      resolve(request.result);
    };

    request.onerror = () => {
      reject(request.error);
    };
  });
}

// Fallback to localStorage for small configs or initial load
const LS_PREFIX = 'usap_user_custom_tones_';

function getLocalStorageTones(userId: string): UserCustomTone[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(`${LS_PREFIX}${userId}`);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch {}
  return [];
}

function saveLocalStorageTones(userId: string, tones: UserCustomTone[]): void {
  if (typeof window === 'undefined') return;
  try {
    // Only store first 5 small tones in localStorage as emergency backup to avoid quota exceeded
    const smallTones = tones.slice(0, 5).filter((t) => t.fileSize < 1024 * 1024);
    localStorage.setItem(`${LS_PREFIX}${userId}`, JSON.stringify(smallTones));
  } catch {}
}

/**
 * Initialize and load user's custom tones from IndexedDB into memory
 */
export async function initCustomToneStore(userId = 'guest_user'): Promise<UserCustomTone[]> {
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const index = store.index('userId');

    return new Promise((resolve) => {
      const request = index.getAll(IDBKeyRange.only(userId));

      request.onsuccess = () => {
        let results = (request.result || []) as UserCustomTone[];
        // Sort by uploadedAt descending
        results.sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime());

        // Merge with localStorage if IDB was empty
        if (results.length === 0) {
          const lsTones = getLocalStorageTones(userId);
          if (lsTones.length > 0) {
            results = lsTones;
            // Seed into IDB
            saveMultipleUserCustomTones(lsTones, userId).catch(() => {});
          }
        }

        memoryTonesCache.set(userId, results);
        isIndexedDBReady = true;
        resolve(results);
      };

      request.onerror = () => {
        const lsTones = getLocalStorageTones(userId);
        memoryTonesCache.set(userId, lsTones);
        resolve(lsTones);
      };
    });
  } catch (err) {
    const lsTones = getLocalStorageTones(userId);
    memoryTonesCache.set(userId, lsTones);
    return lsTones;
  }
}

/**
 * Synchronously get user custom uploaded tones from in-memory cache / localStorage
 */
export function getUserCustomTonesSync(userId = 'guest_user'): UserCustomTone[] {
  const cached = memoryTonesCache.get(userId);
  if (cached && cached.length > 0) {
    return cached;
  }
  const lsTones = getLocalStorageTones(userId);
  if (lsTones.length > 0) {
    memoryTonesCache.set(userId, lsTones);
    return lsTones;
  }
  return cached || [];
}

/**
 * Find a custom tone by its ID across active user tones
 */
export function findCustomToneByIdSync(toneId: string, userId = 'guest_user'): UserCustomTone | undefined {
  const tones = getUserCustomTonesSync(userId);
  return tones.find((t) => t.id === toneId);
}

/**
 * Save a single custom tone to IndexedDB and memory
 */
export async function saveUserCustomToneAsync(tone: UserCustomTone): Promise<void> {
  const userId = tone.userId || 'guest_user';

  // Update memory cache immediately
  const currentList = getUserCustomTonesSync(userId).filter((t) => t.id !== tone.id);
  currentList.unshift(tone);
  memoryTonesCache.set(userId, currentList);
  saveLocalStorageTones(userId, currentList);

  try {
    const db = await openDB();
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    store.put(tone);
    await new Promise((resolve, reject) => {
      tx.oncomplete = resolve;
      tx.onerror = reject;
    });
  } catch (err) {
    console.warn('IndexedDB write error:', err);
  }
}

/**
 * Save multiple custom tones in a single batch to IndexedDB and memory
 */
export async function saveMultipleUserCustomTones(tones: UserCustomTone[], userId = 'guest_user'): Promise<void> {
  if (tones.length === 0) return;

  const currentList = getUserCustomTonesSync(userId);
  const newMap = new Map<string, UserCustomTone>();

  // Add new tones first
  tones.forEach((t) => newMap.set(t.id, t));
  // Preserve existing tones if not overwritten
  currentList.forEach((t) => {
    if (!newMap.has(t.id)) newMap.set(t.id, t);
  });

  const updatedList = Array.from(newMap.values());
  updatedList.sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime());

  memoryTonesCache.set(userId, updatedList);
  saveLocalStorageTones(userId, updatedList);

  try {
    const db = await openDB();
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    for (const tone of tones) {
      store.put(tone);
    }
    await new Promise((resolve, reject) => {
      tx.oncomplete = resolve;
      tx.onerror = reject;
    });
  } catch (err) {
    console.warn('IndexedDB batch write error:', err);
  }
}

/**
 * Delete a custom tone from IndexedDB and memory
 */
export async function deleteUserCustomToneAsync(toneId: string, userId = 'guest_user'): Promise<void> {
  const currentList = getUserCustomTonesSync(userId).filter((t) => t.id !== toneId);
  memoryTonesCache.set(userId, currentList);
  saveLocalStorageTones(userId, currentList);

  try {
    const db = await openDB();
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    store.delete(toneId);
    await new Promise((resolve, reject) => {
      tx.oncomplete = resolve;
      tx.onerror = reject;
    });
  } catch (err) {
    console.warn('IndexedDB delete error:', err);
  }
}

/**
 * Clear all custom tones for a user
 */
export async function clearAllUserCustomTones(userId = 'guest_user'): Promise<void> {
  memoryTonesCache.set(userId, []);
  if (typeof window !== 'undefined') {
    localStorage.removeItem(`${LS_PREFIX}${userId}`);
  }

  try {
    const db = await openDB();
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const index = store.index('userId');
    const request = index.getAllKeys(IDBKeyRange.only(userId));

    request.onsuccess = () => {
      const keys = request.result;
      for (const key of keys) {
        store.delete(key);
      }
    };
  } catch (err) {
    console.warn('IndexedDB clear error:', err);
  }
}
