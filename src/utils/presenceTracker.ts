import { useState, useEffect, useRef } from 'react';
import { collection, doc, setDoc, onSnapshot, query, where, deleteDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { UserSession } from '../types';

export interface PresenceUser {
  id: string;
  userId?: string | null;
  userName: string;
  role: string;
  schoolClass?: string | null;
  email?: string | null;
  isOnline: boolean;
  lastSeen: string;
  deviceType: 'mobile' | 'desktop';
  signedInAt?: string | null;
}

// Generate or retrieve a persistent session ID for this browser tab
function getOrCreateSessionId(): string {
  if (typeof window === 'undefined') return 'server_session';
  const key = 'usap_presence_session_id';
  let id = sessionStorage.getItem(key);
  if (!id) {
    id = 'sess_' + Math.random().toString(36).substring(2, 11) + '_' + Date.now().toString(36);
    sessionStorage.setItem(key, id);
  }
  return id;
}

export function useOnlinePresence(session: UserSession | null) {
  const [isBrowserOnline, setIsBrowserOnline] = useState<boolean>(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );
  const [activeUsers, setActiveUsers] = useState<PresenceUser[]>([]);
  const [totalSignInsToday, setTotalSignInsToday] = useState<number>(0);
  const [currentTimeStr, setCurrentTimeStr] = useState<string>('');
  const sessionIdRef = useRef<string>(getOrCreateSessionId());

  // Listen to browser online/offline status
  useEffect(() => {
    const handleOnline = () => setIsBrowserOnline(true);
    const handleOffline = () => setIsBrowserOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Live clock timestamp for observation
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTimeStr(
        now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Heartbeat: update current presence doc every 15 seconds while online
  useEffect(() => {
    const sessionId = sessionIdRef.current;

    const sendHeartbeat = async (statusOnline = true) => {
      if (!navigator.onLine && statusOnline) return;

      try {
        const isMobile = typeof navigator !== 'undefined' && /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent);
        const presenceData: Record<string, any> = {
          id: sessionId,
          userId: session?.userId || null,
          userName: session?.name || 'Visitor / Guest',
          role: session?.role || 'VISITOR',
          schoolClass: session?.schoolClass || null,
          email: session?.email || null,
          isOnline: statusOnline,
          lastSeen: new Date().toISOString(),
          deviceType: isMobile ? 'mobile' : 'desktop'
        };

        if (session) {
          presenceData.signedInAt = new Date().toISOString();
        }

        await setDoc(doc(db, 'online_presence', sessionId), presenceData, { merge: true });
      } catch (err) {
        // Silently handle transient connection blips
      }
    };

    // Initial heartbeat
    if (isBrowserOnline) {
      sendHeartbeat(true);
    }

    // Periodic heartbeat every 15 seconds
    const interval = setInterval(() => {
      if (navigator.onLine) {
        sendHeartbeat(true);
      }
    }, 15000);

    // Set offline on page unload or visibility change
    const handleBeforeUnload = () => {
      sendHeartbeat(false);
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        sendHeartbeat(false);
      } else if (document.visibilityState === 'visible' && navigator.onLine) {
        sendHeartbeat(true);
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      clearInterval(interval);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      sendHeartbeat(false);
    };
  }, [session, isBrowserOnline]);

  // Subscribe to real-time online presence collection
  useEffect(() => {
    // If user is offline, do not sync active counts
    if (!isBrowserOnline) {
      setActiveUsers([]);
      return;
    }

    const unsub = onSnapshot(
      collection(db, 'online_presence'),
      (snapshot) => {
        const nowMs = Date.now();
        const active: PresenceUser[] = [];

        snapshot.forEach((d) => {
          const data = d.data() as PresenceUser;
          if (data && data.isOnline) {
            // Heartbeat considered fresh within the last 50 seconds
            const lastSeenMs = data.lastSeen ? new Date(data.lastSeen).getTime() : 0;
            if (nowMs - lastSeenMs < 50000) {
              active.push(data);
            }
          }
        });

        // Sort: Signed in users first, then by name
        active.sort((a, b) => {
          if (a.role !== 'VISITOR' && b.role === 'VISITOR') return -1;
          if (a.role === 'VISITOR' && b.role !== 'VISITOR') return 1;
          return a.userName.localeCompare(b.userName);
        });

        setActiveUsers(active);
      },
      (err) => {
        console.warn('Error reading online presence:', err);
      }
    );

    return () => unsub();
  }, [isBrowserOnline]);

  // Subscribe to audit_logs to count sign-ins on the site
  useEffect(() => {
    if (!isBrowserOnline) return;

    const todayDateStr = new Date().toISOString().slice(0, 10);
    const unsub = onSnapshot(
      collection(db, 'audit_logs'),
      (snapshot) => {
        let countToday = 0;
        snapshot.forEach((d) => {
          const log = d.data();
          if (log.eventType === 'SIGN_IN_SUCCESS') {
            const logDate = (log.timestamp || '').slice(0, 10);
            if (logDate === todayDateStr) {
              countToday++;
            }
          }
        });
        setTotalSignInsToday(countToday);
      },
      (err) => {
        console.warn('Error reading sign-in count:', err);
      }
    );

    return () => unsub();
  }, [isBrowserOnline]);

  const activePeopleCount = isBrowserOnline ? Math.max(1, activeUsers.length) : 0;
  const signedInUsersCount = isBrowserOnline ? activeUsers.filter((u) => u.role !== 'VISITOR').length : 0;

  return {
    isBrowserOnline,
    activePeopleCount,
    signedInUsersCount,
    activeUsers,
    totalSignInsToday,
    currentTimeStr
  };
}
