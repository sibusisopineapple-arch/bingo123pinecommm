import { useState, useEffect, useRef } from 'react';
import { collection, doc, setDoc, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import { Announcement, UserSession } from '../types';

export interface AnnouncementViewRecord {
  id: string;
  announcementId: string;
  announcementSnippet: string;
  authorName?: string;
  userId: string;
  userEmail: string;
  userName: string;
  userRole: string;
  schoolClass?: string;
  firstSeenAt: string;
  lastSeenAt: string;
}

// Local cache to prevent redundant writes within the same browser session
const recordedViewsInSession = new Set<string>();

/**
 * Automatically records that an authenticated account viewed the active announcements.
 * Each user gets 1 document per announcement in the `announcement_views` collection.
 */
export async function recordAnnouncementViews(announcements: Announcement[], session: UserSession | null) {
  if (!session || !session.userId || !announcements.length) return;

  const now = new Date().toISOString();

  for (const ann of announcements) {
    const docId = `${ann.id}_${session.userId}`;
    if (recordedViewsInSession.has(docId)) continue;

    try {
      recordedViewsInSession.add(docId);
      await setDoc(
        doc(db, 'announcement_views', docId),
        {
          id: docId,
          announcementId: String(ann.id),
          announcementSnippet: (ann.body || '').substring(0, 120),
          authorName: ann.authorName || 'Campus Staff',
          userId: session.userId,
          userEmail: session.email || '',
          userName: session.name,
          userRole: session.role,
          schoolClass: session.schoolClass || '',
          firstSeenAt: now,
          lastSeenAt: now
        },
        { merge: true }
      );
    } catch (err) {
      console.warn('Could not record announcement view:', err);
    }
  }
}

/**
 * Hook to retrieve and compute announcement viewership stats.
 * STRICT SECURITY: Only active when `isItManager` is true.
 */
export function useAnnouncementViews(isItManager: boolean) {
  const [viewRecords, setViewRecords] = useState<AnnouncementViewRecord[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    // If not IT Manager, do not load or compute viewership data
    if (!isItManager) {
      setViewRecords([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    const unsub = onSnapshot(
      collection(db, 'announcement_views'),
      (snapshot) => {
        const loaded: AnnouncementViewRecord[] = [];
        snapshot.forEach((d) => {
          const data = d.data() as AnnouncementViewRecord;
          if (data && data.announcementId && data.userName) {
            loaded.push(data);
          }
        });

        // Sort latest views first
        loaded.sort((a, b) => new Date(b.lastSeenAt).getTime() - new Date(a.lastSeenAt).getTime());
        setViewRecords(loaded);
        setIsLoading(false);
      },
      (err) => {
        console.warn('Failed to listen to announcement_views:', err);
        setIsLoading(false);
      }
    );

    return () => unsub();
  }, [isItManager]);

  // Compute number of unique accounts who saw announcements (only computed if IT manager)
  const uniqueAccountsCount = isItManager
    ? new Set(viewRecords.map((r) => r.userEmail || r.userId || r.userName)).size
    : 0;

  // Breakdown of accounts who saw each specific announcement
  const viewsByAnnouncement = isItManager
    ? viewRecords.reduce((acc, curr) => {
        const annId = curr.announcementId;
        if (!acc[annId]) {
          acc[annId] = {
            count: 0,
            snippet: curr.announcementSnippet,
            authorName: curr.authorName,
            accounts: []
          };
        }
        acc[annId].count += 1;
        acc[annId].accounts.push(curr);
        return acc;
      }, {} as Record<string, { count: number; snippet: string; authorName?: string; accounts: AnnouncementViewRecord[] }>)
    : {};

  // Export to CSV spreadsheet
  const exportToCSV = () => {
    if (!isItManager || !viewRecords.length) return;

    const headers = [
      'Record ID',
      'Account Name',
      'Email',
      'Role',
      'Class',
      'Announcement ID',
      'Announcement Snippet',
      'Author',
      'First Seen Timestamp',
      'Last Seen Timestamp'
    ];

    const rows = viewRecords.map((r) => [
      `"${r.id}"`,
      `"${r.userName.replace(/"/g, '""')}"`,
      `"${(r.userEmail || '').replace(/"/g, '""')}"`,
      `"${r.userRole}"`,
      `"${(r.schoolClass || '').replace(/"/g, '""')}"`,
      `"${r.announcementId}"`,
      `"${(r.announcementSnippet || '').replace(/"/g, '""')}"`,
      `"${(r.authorName || '').replace(/"/g, '""')}"`,
      `"${r.firstSeenAt}"`,
      `"${r.lastSeenAt}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `usap_announcements_viewership_sheet_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return {
    viewRecords,
    uniqueAccountsCount,
    viewsByAnnouncement,
    isLoading,
    exportToCSV
  };
}
