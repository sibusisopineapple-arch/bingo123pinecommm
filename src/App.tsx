import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Bell,
  Calendar,
  Clock,
  GraduationCap,
  Info,
  LogOut,
  MapPin,
  Megaphone,
  PlusCircle,
  ShieldCheck,
  Users,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Sparkles,
  BookOpen,
  Volume2,
  VolumeX,
  Smartphone,
  Laptop,
  Mail,
  UserCheck,
  Utensils,
  Moon,
  Coffee,
  Check,
  Filter,
  Settings,
  Activity,
  Radio,
  Mic,
  MicOff,
  Square,
  Trash2,
  Play,
  Pause,
  BookCheck,
  Eye,
  EyeOff,
  Image as ImageIcon,
  ShieldAlert,
  FileSpreadsheet,
  Loader2,
  Cake,
  CalendarDays,
  Award,
  Globe,
  KeyRound
} from 'lucide-react';
import { WorldCelebrationsWindow } from './components/WorldCelebrationsWindow';
import { ITManagerPasswordLogSheetModal } from './components/ITManagerPasswordLogSheetModal';
import {
  optimizeImageForFirestore,
  validateFirestoreDocumentSize,
  MAX_IMAGE_SIZE_BYTES,
  MAX_VOICE_DURATION_SECONDS
} from './utils/imageOptimizer';
import { UserRole, UserSession, SchoolTest, Announcement, FacultyMember, AuditLog, StudentAccountRecord } from './types';
import {
  auth,
  db,
  googleProvider,
  testConnection,
  handleFirestoreError,
  OperationType
} from './firebase';
import {
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  User
} from 'firebase/auth';
import {
  collection,
  onSnapshot,
  addDoc,
  doc,
  setDoc,
  getDoc,
  deleteDoc,
  query,
  orderBy
} from 'firebase/firestore';
import { PineappleMascot } from './components/PineappleMascot';
import { UsapLogo } from './components/UsapLogo';
import { StudentVerificationModal } from './components/StudentVerificationModal';
import { PhonePermissionModal } from './components/PhonePermissionModal';
import { SchoolRulesDashboard } from './components/SchoolRulesDashboard';
import { ITManagerAuditView } from './components/ITManagerAuditView';
import { CurrentTimeNoticeBar, SignInPageTimeNoticeCard } from './components/CurrentTimeNoticeBar';
import { OnlinePresenceButton } from './components/OnlinePresenceButton';
import { AnnouncementViewershipSheetModal } from './components/AnnouncementViewershipSheetModal';
import { DeviceSoundSelectorModal } from './components/DeviceSoundSelectorModal';
import { ActiveRingingBanner } from './components/ActiveRingingBanner';
import { OfficeHoursSection } from './components/OfficeHoursSection';
import { SburaIntroAnimation } from './components/SburaIntroAnimation';
import { BirthdaysWindow } from './components/BirthdaysWindow';
import { BirthdayPopupNotification } from './components/BirthdayPopupNotification';
import { WeeklyTimetableWindow } from './components/WeeklyTimetableWindow';
import { ExamTimetableWindow } from './components/ExamTimetableWindow';
import { WeeklyDutyWindow } from './components/WeeklyDutyWindow';
import { WednesdaySpeakerWindow } from './components/WednesdaySpeakerWindow';
import { BirthdayItem } from './types/schoolWindows';
import { getWeekOfLabel, getTodayDateString, isValidDateString, formatDisplayDate } from './utils/schoolDateUtils';
import { checkTestScheduleConflicts, ScheduleConflictWarning } from './utils/testScheduleValidator';
import { OfficeHourSession, isOfficeHourSessionPassed, isSlotTimePassed } from './utils/officeHoursUtils';
import { recordAnnouncementViews, useAnnouncementViews } from './utils/announcementViewTracker';
import { playBellTone, playExamChime, playMealTimeAlarm, playExamBeepAlarm, stopAllAlarms, setActiveUserSoundContext } from './utils/audioChime';
import {
  initPhoneNotifications,
  getPhoneNotificationStatus,
  sendPhoneNotification,
  syncScheduleToBackground
} from './utils/phoneNotification';

const ROOMS = ["Library", "DH", "Music room", "Chemistry/Biology lab", "Physics lab"];
const SUBJECTS = ["Biology", "Mathematics", "Physics", "Research Methods", "Computers", "Humanities", "Chemistry"];
const CLASS_OPTIONS = ["ALL CLASSES", "LOWER 6X", "LOWER 6Y", "UPPER 6X", "UPPER 6Y"];

// Daily School Routine & Meal Schedule (Meals and daily routines)
const DAILY_ROUTINE_SCHEDULE = [
  { time: "07:00 – 07:35 AM", title: "Breakfast", location: "Dining Hall (DH)", type: "meal" },
  { time: "07:40 – 09:45 AM", title: "Lesson Time: Morning Block 1", location: "Classrooms & Labs", type: "academic" },
  { time: "09:45 – 10:00 AM", title: "Morning Snack Time", location: "Dining Hall (DH)", type: "meal" },
  { time: "10:00 AM – 01:05 PM", title: "Lesson Time: Morning Block 2 (Wednesdays: 10:00 AM–12:00 PM)", location: "Classrooms & Labs", type: "academic" },
  { time: "12:00 – 01:05 PM (Wednesdays)", title: "All-School Convocation Time", location: "Campus Assembly / Hall", type: "academic" },
  { time: "01:05 – 02:00 PM (Weekdays)", title: "Lunch Time (1:05 PM Weekday Meal Alarm)", location: "Dining Hall (DH)", type: "meal" },
  { time: "12:55 – 02:00 PM (Weekends)", title: "Weekend Lunch Time (12:55 PM Weekend Meal Alarm)", location: "Dining Hall (DH)", type: "meal" },
  { time: "02:00 – 03:00 PM (Wednesdays)", title: "Advisor Consultation / Faculty Meeting", location: "Advisor Rooms & Offices", type: "academic" },
  { time: "02:00 – 04:00 PM (Mon, Tue, Thu)", title: "Lesson Time: Afternoon Block", location: "Classrooms & Labs", type: "academic" },
  { time: "02:00 – 05:50 PM (Fridays)", title: "Friday Afternoon Activities (No Lessons After Lunch on Fridays)", location: "Campus Grounds & Studios", type: "activity" },
  { time: "04:00 – 05:50 PM (Weekdays)", title: "Extracurricular Activities Time (Sports, Arts, Robotics, Clubs)", location: "Campus Grounds & Studios", type: "activity" },
  { time: "04:00 – 05:45 PM (Sundays)", title: "Sunday Phone Time (Official Student Phone Window)", location: "Campus-wide", type: "phone" },
  { time: "05:50 PM (Daily)", title: "Dinner Meal Alert (5:50 PM Alarm, Dinner at 6:00 PM)", location: "Dining Hall (DH)", type: "meal" },
  { time: "06:00 – 07:00 PM", title: "Dinner Time", location: "Dining Hall (DH)", type: "meal" },
  { time: "07:00 – 09:00 PM", title: "Prep Time (Compulsory Study)", location: "Study Halls, Library, Classrooms", type: "prep" },
  { time: "09:00 – 09:15 PM", title: "Evening Snack Time (Weekend Prep Ends at 9:00 PM)", location: "Dining Hall (DH)", type: "meal" },
  { time: "09:15 – 10:30 PM", title: "Optional Prep Time", location: "Study Halls & Library", type: "prep" },
  { time: "10:30 PM – 07:00 AM", title: "Sleep and Morning Preparation Time", location: "Dormitories", type: "prep" },
  { time: "08:00 – 08:45 AM (Sundays only)", title: "Sunday Quaker Meeting for Worship (Quaker is held on Sundays only)", location: "Dining Hall / Campus Grounds", type: "quaker" },
  { time: "Weekends (Sat & Sun)", title: "Students' Own Time & Rest (No Lessons on Weekends)", location: "Campus-wide", type: "activity" }
];

// Private bootstrap passwords - NEVER disclosed in UI error messages
const STAFF_INITIAL_PASSWORDS: Record<string, string> = {
  "Mr Mangara": "Mangara@USAP1",
  "Mr Tinashe": "Tinashe@USAP2",
  "Mr Godwins": "Godwins@USAP3",
  "Ms Maka": "Maka@USAP4",
  "Ms Alistar": "Alistar@USAP5",
  "Ms Victoria": "Victoria@USAP6",
  "Mr. W. Dliwayo": "Dliwayo@USAP7",
  "Mr Lloyd": "Lloyd@USAP8",
  "Mr Mandla": "Mandla@USAP9",
  "Mai Z. Mano": "Mano@USAP10",
  "Mai Jerry": "Jerry@USAP11",
  "Ms Jean-Anna": "JeanAnna@USAP12",
  "Mr Nate Kuchena": "Kuchena@USAP13",
  "Ms Vimbai": "Vimbai@USAP14",
  "Accountant (Ms Fari)": "MsFari@USAP16",
  "Ms Fari": "MsFari@USAP16",
  "Lab Technician (Ms Ruvimbo)": "MsRuvimbo@USAP17",
  "Ms Ruvimbo": "MsRuvimbo@USAP17",
  "Non Faculty": "NonFaculty@USAP15",
  "IT Manager": "Sburathequestionman@USAP"
};

// Faculty & Staff Directory with unified single account per individual
const FACULTY_DIRECTORY: FacultyMember[] = [
  { name: "IT Manager", area: "Information Technology & Security Administration", role: "IT_MANAGER" },
  { name: "Mr Mangara", area: "Biology", role: "FACULTY" },
  { name: "Mr Godwins", area: "Mathematics", role: "FACULTY" },
  { name: "Ms Alistar", area: "Physics", role: "FACULTY" },
  { name: "Mr. W. Dliwayo", area: "Research Methods (Lower 6 only)", role: "FACULTY" },
  { name: "Mr Lloyd", area: "Computers", role: "FACULTY" },
  { name: "Mr Mandla", area: "Humanities", role: "FACULTY" },
  { name: "Mai Jerry", area: "Chemistry", role: "FACULTY" },
  { name: "Ms Ruvimbo", area: "Science Laboratories & Faculty Technical Services (Lab Technician)", role: "FACULTY" },
  { name: "Ms Fari", area: "Finance & Accounts (Accountant)", role: "FACULTY" },

  { name: "Mr Tinashe", area: "Biology", role: "TA" },
  { name: "Ms Maka", area: "Mathematics", role: "TA" },
  { name: "Ms Victoria", area: "Physics", role: "TA" },
  { name: "Ms Jean-Anna", area: "Chemistry", role: "TA" },

  { name: "Mr Nate Kuchena", area: "School Leadership & Head of School", role: "HEAD" },
  { name: "Mai Z. Mano", area: "Co-Founder, College Counselling & School Leadership", role: "HEAD" },

  { name: "Ms Vimbai", area: "Estate Management", role: "ESTATE" },
  { name: "Non Faculty", area: "School Support Staff", role: "NON_FACULTY" }
];

export default function App() {
  // Auth state
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [session, setSession] = useState<UserSession | null>(() => {
    try {
      const saved = localStorage.getItem("usapSession");
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  // SBURA THE QUESTION MAN Login Animation state (10s sequence)
  const [showSburaIntro, setShowSburaIntro] = useState(false);

  // Automatically triggers intro animation whenever a user signs in to the site
  const checkAndTriggerFirstTimeIntro = (targetSession: UserSession) => {
    if (!targetSession) return;
    setShowSburaIntro(true);
  };

  // Navigation tab (Only accessible when signed in)
  const [activeTab, setActiveTab] = useState<
    | 'tests'
    | 'rules'
    | 'announcements'
    | 'routine'
    | 'schedule'
    | 'people'
    | 'it_audit'
    | 'office_hours'
    | 'birthdays'
    | 'weekly_timetable'
    | 'exam_timetable'
    | 'weekly_duty'
    | 'convocation'
    | 'world_celebrations'
  >('tests');

  // Birthday reminder alert states (Pop-up window reminding whose birthday it is today on site visit)
  const [todaysBirthdays, setTodaysBirthdays] = useState<BirthdayItem[]>([]);
  const [showBirthdayPopup, setShowBirthdayPopup] = useState(false);
  const [selectedClassFilter, setSelectedClassFilter] = useState<string>('ALL CLASSES');
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [showPhoneModal, setShowPhoneModal] = useState(false);
  const [phoneNotificationPermission, setPhoneNotificationPermission] = useState<string>('default');

  // Password visibility states (Hide / Reveal)
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [showRegPassword, setShowRegPassword] = useState(false);

  // Login Form
  const [role, setRole] = useState<UserRole>('STUDENT');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [selectedStaffName, setSelectedStaffName] = useState<string>('Mr Mangara');
  const [studentClass, setStudentClass] = useState('LOWER 6X');
  const [authMsg, setAuthMsg] = useState<{ type: 'ok' | 'bad' | 'warn'; text: string } | null>(null);

  // Student Registration & SBURA THE QUESTION MAN Verification
  const [isRegistering, setIsRegistering] = useState(false);
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regClass, setRegClass] = useState('LOWER 6X');
  const [pendingVerification, setPendingVerification] = useState<{
    email: string;
    name: string;
    studentClass: string;
    code: string;
  } | null>(null);

  // Firestore real-time collections
  const [tests, setTests] = useState<SchoolTest[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [registeredStudents, setRegisteredStudents] = useState<StudentAccountRecord[]>([]);
  const [officeHoursSessions, setOfficeHoursSessions] = useState<OfficeHourSession[]>([]);

  // Schedule Test Form
  const [scheduleTitle, setScheduleTitle] = useState('');
  const [scheduleSubject, setScheduleSubject] = useState(SUBJECTS[0]);
  const [scheduleClass, setScheduleClass] = useState("LOWER 6X");
  const [scheduleRoom, setScheduleRoom] = useState(ROOMS[0]);
  const [scheduleDate, setScheduleDate] = useState('');
  const [scheduleStart, setScheduleStart] = useState('');
  const [scheduleEnd, setScheduleEnd] = useState('');
  const [scheduleMsg, setScheduleMsg] = useState<{ type: 'ok' | 'bad' | 'warn'; text: string } | null>(null);

  // Real-time conflict detection for test scheduling (Occupied students or existing test conflict)
  const liveScheduleConflicts = useMemo(() => {
    if (!scheduleDate || !scheduleStart || !scheduleEnd) return [];
    return checkTestScheduleConflicts(
      scheduleDate,
      scheduleStart,
      scheduleEnd,
      scheduleClass,
      scheduleRoom,
      scheduleSubject,
      tests,
      officeHoursSessions
    );
  }, [scheduleDate, scheduleStart, scheduleEnd, scheduleClass, scheduleRoom, scheduleSubject, tests, officeHoursSessions]);

  // New Announcement Form & Media (Voice Audio + Pictures)
  const [newAnnouncementText, setNewAnnouncementText] = useState('');
  const [announcementImageBase64, setAnnouncementImageBase64] = useState<string | null>(null);
  const [announcementImageCaption, setAnnouncementImageCaption] = useState('');
  const [isOptimizingImage, setIsOptimizingImage] = useState(false);
  const [optimizedImageInfo, setOptimizedImageInfo] = useState<{ originalKB: number; optimizedKB: number } | null>(null);
  const [announcementError, setAnnouncementError] = useState<string | null>(null);
  const [announcementSuccess, setAnnouncementSuccess] = useState<string | null>(null);
  const [isPostingAnnouncement, setIsPostingAnnouncement] = useState(false);
  const [isRecordingAudio, setIsRecordingAudio] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [audioPreviewUrl, setAudioPreviewUrl] = useState<string | null>(null);
  const [audioBase64, setAudioBase64] = useState<string | null>(null);
  const [audioError, setAudioError] = useState<string | null>(null);
  const [audioWarning, setAudioWarning] = useState<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingTimerRef = useRef<any>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // IT Manager Announcement Viewership Sheet & Master Password Log Sheet
  const [showAnnouncementViewershipSheet, setShowAnnouncementViewershipSheet] = useState(false);
  const [showPasswordLogSheetModal, setShowPasswordLogSheetModal] = useState(false);
  const { uniqueAccountsCount, viewsByAnnouncement } = useAnnouncementViews(session?.role === 'IT_MANAGER');

  // Device Ringtones & 10s Alarm Sounds Modal
  const [showDeviceSoundModal, setShowDeviceSoundModal] = useState(false);

  // Notification Modal (Active Alert)
  const [activeAlert, setActiveAlert] = useState<{
    id: string;
    title: string;
    body: string;
    countdown?: string;
    severity: 'countdown' | 'progress' | 'daily';
  } | null>(null);

  const [activeAlarmKind, setActiveAlarmKind] = useState<'meal' | 'beep' | null>(null);

  const alertedRef = useRef<Record<string, boolean>>({});

  // 1. Initial connection test & Phone Service Worker
  useEffect(() => {
    testConnection();
    initPhoneNotifications();
    const perm = getPhoneNotificationStatus();
    setPhoneNotificationPermission(perm);
  }, []);

  // Sync active user sound context for custom alarm tones
  useEffect(() => {
    setActiveUserSoundContext(session?.userId || null);
  }, [session?.userId]);

  // Update default staff member when role changes
  useEffect(() => {
    if (role === 'FACULTY' || role === 'TEACHER') {
      setSelectedStaffName("Mr Mangara");
    } else if (role === 'TA') {
      setSelectedStaffName("Mr Tinashe");
    } else if (role === 'HEAD') {
      setSelectedStaffName("Mr Nate Kuchena");
    } else if (role === 'CO_FOUNDER') {
      setSelectedStaffName("Mai Z. Mano");
    } else if (role === 'ESTATE') {
      setSelectedStaffName("Ms Vimbai");
    } else if (role === 'NON_FACULTY') {
      setSelectedStaffName("Non Faculty");
    } else if (role === 'IT_MANAGER') {
      setSelectedStaffName("IT Manager");
    }
    setAuthMsg(null);
  }, [role]);

  // 2. Listen to Firebase Auth state
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user) {
        try {
          const userDocRef = doc(db, 'users', user.uid);
          const snap = await getDoc(userDocRef);
          if (snap.exists()) {
            const data = snap.data();
            const loadedSession: UserSession = {
              userId: user.uid,
              email: user.email || '',
              name: data.displayName || user.displayName || user.email?.split('@')[0] || 'USAP Member',
              role: data.role || 'STUDENT',
              schoolClass: data.schoolClass || 'LOWER 6X',
              subject: data.subject || null
            };
            setSession(loadedSession);
            localStorage.setItem("usapSession", JSON.stringify(loadedSession));
          } else {
            const newSession: UserSession = {
              userId: user.uid,
              email: user.email || '',
              name: user.displayName || user.email?.split('@')[0] || 'USAP Member',
              role: role,
              schoolClass: role === 'STUDENT' ? studentClass : undefined
            };
            await setDoc(userDocRef, {
              uid: user.uid,
              email: user.email || '',
              displayName: newSession.name,
              role: newSession.role,
              schoolClass: newSession.schoolClass || 'LOWER 6X',
              verifiedBy: "Google & SBURA THE QUESTION MAN",
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString()
            });
            setSession(newSession);
            localStorage.setItem("usapSession", JSON.stringify(newSession));
          }
        } catch (e) {
          const fallbackSession: UserSession = {
            userId: user.uid,
            email: user.email || '',
            name: user.displayName || user.email?.split('@')[0] || 'USAP Member',
            role: role,
            schoolClass: studentClass
          };
          setSession(fallbackSession);
          localStorage.setItem("usapSession", JSON.stringify(fallbackSession));
        }

        // Prompt for phone permission if not yet decided
        if (getPhoneNotificationStatus() === 'default') {
          setTimeout(() => setShowPhoneModal(true), 800);
        }
      }
    });

    return () => unsubscribe();
  }, [role, studentClass]);

  // Listen for today's birthdays and send celebratory pop-up window on site visit
  useEffect(() => {
    const today = getTodayDateString();
    const unsub = onSnapshot(collection(db, 'birthdays'), (snap) => {
      const todayList: BirthdayItem[] = [];
      snap.docs.forEach((docSnap) => {
        const data = docSnap.data();
        if (data.date === today) {
          todayList.push({
            id: docSnap.id,
            name: data.name || '',
            date: data.date,
            role: data.role || 'Community Member',
            schoolClass: data.schoolClass || '',
            createdAt: data.createdAt || ''
          });
        }
      });
      setTodaysBirthdays(todayList);

      // RULE: On the actual date of the birthday, whenever you visit the site, it sends a pop up notification window
      if (todayList.length > 0 && !sessionStorage.getItem(`usap_birthday_popup_seen_${today}`)) {
        setShowBirthdayPopup(true);
      }
    });

    return () => unsub();
  }, []);

// Helper to evaluate if a test has passed its end date/time
const isTestPassed = (test: { date?: string; testDate?: string; end?: string; endTime?: string; endsAt?: string }): boolean => {
  try {
    const now = Date.now();
    // 1. If explicit ISO endsAt exists
    if (test.endsAt) {
      const endsTime = new Date(test.endsAt).getTime();
      if (!isNaN(endsTime)) return now >= endsTime;
    }
    // 2. Based on date and end time
    const testDate = test.testDate || test.date;
    if (testDate) {
      const endTimeStr = test.endTime || test.end || '23:59';
      const fullIsoStr = `${testDate}T${endTimeStr.length === 5 ? `${endTimeStr}:00` : endTimeStr}`;
      const endsTime = new Date(fullIsoStr).getTime();
      if (!isNaN(endsTime)) return now >= endsTime;
    }
    return false;
  } catch {
    return false;
  }
};

  // 3. Real-time Tests Sync (Runs on all pages so Notice Bar and 60s Exam Beep operate globally)
  useEffect(() => {
    const testsQuery = query(collection(db, 'tests'));
    const unsubTests = onSnapshot(
      testsQuery,
      (snapshot) => {
        const loadedMap = new Map<string, SchoolTest>();
        snapshot.forEach((docSnap) => {
          const d = docSnap.data();
          const testDateVal = d.testDate || d.date || '';
          const startTimeVal = d.startTime || d.start || '08:00';
          const endTimeVal = d.endTime || d.end || '09:00';
          const endsAtVal = d.endsAt || (testDateVal ? `${testDateVal}T${endTimeVal}:00` : '');
          const startsAtVal = d.startsAt || (testDateVal ? `${testDateVal}T${startTimeVal}:00` : '');

          const testObj = {
            date: testDateVal,
            testDate: testDateVal,
            end: endTimeVal,
            endTime: endTimeVal,
            endsAt: endsAtVal
          };

          // Eagerly erase test from Firestore once its date/time has passed
          if (isTestPassed(testObj)) {
            deleteDoc(doc(db, 'tests', docSnap.id)).catch(err => {
              console.warn("Could not erase passed test from Firestore:", err);
            });
            return; // Leave only tests with a future date
          }

          loadedMap.set(docSnap.id, {
            id: docSnap.id,
            title: d.title || 'Untitled Test',
            subject: d.subject || 'General',
            schoolClass: d.schoolClass || 'LOWER 6X',
            room: d.room || 'Library',
            date: testDateVal,
            start: startTimeVal,
            end: endTimeVal,
            startsAt: startsAtVal,
            endsAt: endsAtVal,
            createdBy: d.createdBy || 'Teacher',
            createdAt: d.createdAt || new Date().toISOString()
          });
        });
        const loaded = Array.from(loadedMap.values());
        loaded.sort((a, b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime());
        setTests(loaded);
      },
      (error) => {
        console.warn("Firestore tests sync issue:", error);
      }
    );

    const ohQuery = query(collection(db, 'office_hours'));
    const unsubOh = onSnapshot(
      ohQuery,
      (snapshot) => {
        const sessionMap = new Map<string, OfficeHourSession>();
        snapshot.forEach((docSnap) => {
          const data = docSnap.data() as any;
          const sessionObj: OfficeHourSession = { id: docSnap.id, ...data };
          // Erase passed office hours history
          if (isOfficeHourSessionPassed(sessionObj)) {
            deleteDoc(doc(db, 'office_hours', docSnap.id)).catch((err) => {
              console.warn("Could not delete passed office hours from Firestore:", err);
            });
            return;
          }
          const activeSlots = (sessionObj.slots || []).filter((s) => !isSlotTimePassed(sessionObj.date, s.endMinutes));
          if (activeSlots.length === 0) {
            deleteDoc(doc(db, 'office_hours', docSnap.id)).catch((err) => {
              console.warn("Could not delete passed office hours from Firestore:", err);
            });
            return;
          }
          sessionMap.set(docSnap.id, { ...sessionObj, slots: activeSlots, totalSlots: activeSlots.length });
        });
        setOfficeHoursSessions(Array.from(sessionMap.values()));
      },
      (error) => {
        console.warn("Firestore office_hours sync issue:", error);
      }
    );

    return () => {
      unsubTests();
      unsubOh();
    };
  }, []);

  // Announcements & Audit Logs Sync (Loaded when session is active)
  useEffect(() => {
    if (!session) return;

    const annQuery = query(collection(db, 'announcements'));
    const unsubAnn = onSnapshot(
      annQuery,
      (snapshot) => {
        const loaded: Announcement[] = [];
        const now = new Date();
        snapshot.forEach((doc) => {
          const d = doc.data();
          if (!d.expiresAt || new Date(d.expiresAt) > now) {
            loaded.push({
              id: doc.id,
              body: d.message,
              authorName: d.authorName,
              authorRole: d.authorRole,
              createdAt: d.createdAt,
              expiresAt: d.expiresAt,
              authorUserId: d.authorUid,
              authorUid: d.authorUid,
              audioUrl: d.audioUrl || undefined,
              audioDuration: d.audioDuration || undefined,
              imageUrl: d.imageUrl || undefined,
              imageCaption: d.imageCaption || undefined
            });
          }
        });
        loaded.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        setAnnouncements(loaded);

        // Record views for this authenticated session
        if (session && loaded.length > 0) {
          recordAnnouncementViews(loaded, session);
        }
      },
      (error) => {
        console.warn("Firestore announcements sync issue:", error);
      }
    );

    // Sync Audit Logs for IT Manager account
    const auditQuery = query(collection(db, 'audit_logs'));
    const unsubAudit = onSnapshot(
      auditQuery,
      async (snapshot) => {
        const loaded: AuditLog[] = [];
        snapshot.forEach((doc) => {
          const d = doc.data();
          loaded.push({
            id: doc.id,
            timestamp: d.timestamp || new Date().toISOString(),
            eventType: d.eventType || 'SIGN_IN_SUCCESS',
            status: d.status || 'SUCCESS',
            email: d.email || 'unknown',
            name: d.name || 'Unknown',
            role: d.role || 'STUDENT',
            schoolClass: d.schoolClass || undefined,
            reason: d.reason || undefined,
            details: d.details || undefined
          });
        });

        // Seed initial audit log history for demonstration if collection is newly created
        if (loaded.length === 0 && session.role === 'IT_MANAGER') {
          const sampleLogs = [
            {
              timestamp: new Date(Date.now() - 1000 * 60 * 35).toISOString(),
              eventType: 'SIGN_IN_SUCCESS',
              status: 'SUCCESS',
              email: 'mangara@usapschool.org',
              name: 'Mr Mangara',
              role: 'TEACHER',
              details: 'Authenticated successfully into Faculty Biology Portal.'
            },
            {
              timestamp: new Date(Date.now() - 1000 * 60 * 22).toISOString(),
              eventType: 'SIGN_IN_RESTRICTED',
              status: 'RESTRICTED',
              email: 'anonymous.intruder@gmail.com',
              name: 'External Visitor',
              role: 'STUDENT',
              schoolClass: 'LOWER 6X',
              reason: 'Restricted: Non-official school email address used during student creation. Only @usapschool.org authorized.',
              details: 'Unauthorized email domain outside USAP network.'
            },
            {
              timestamp: new Date(Date.now() - 1000 * 60 * 18).toISOString(),
              eventType: 'STUDENT_ACCOUNT_CREATED',
              status: 'SUCCESS',
              email: 'sibusiso.n@usapschool.org',
              name: 'Sibusiso Moyo',
              role: 'STUDENT',
              schoolClass: 'UPPER 6X',
              details: 'Student account created and verified by SBURA THE QUESTION MAN with email sibusiso.n@usapschool.org'
            },
            {
              timestamp: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
              eventType: 'SIGN_IN_SUCCESS',
              status: 'SUCCESS',
              email: 'sibusiso.n@usapschool.org',
              name: 'Sibusiso Moyo',
              role: 'STUDENT',
              schoolClass: 'UPPER 6X',
              details: 'Student authenticated successfully and synchronised phone timetable.'
            },
            {
              timestamp: new Date(Date.now() - 1000 * 60 * 12).toISOString(),
              eventType: 'SIGN_IN_RESTRICTED',
              status: 'RESTRICTED',
              email: 'kuchena@usapschool.org',
              name: 'Mr Nate Kuchena',
              role: 'HEAD',
              reason: 'Restricted: Invalid password entered for account Mr Nate Kuchena.',
              details: 'Denied access due to incorrect credential entry.'
            },
            {
              timestamp: new Date(Date.now() - 1000 * 60 * 6).toISOString(),
              eventType: 'ANNOUNCEMENT_POSTED',
              status: 'SUCCESS',
              email: 'tinashe@usapschool.org',
              name: 'Mr Tinashe',
              role: 'TA',
              details: 'Broadcasted announcement with attached audio notice to Lower 6 students.'
            },
            {
              timestamp: new Date(Date.now() - 1000 * 60 * 2).toISOString(),
              eventType: 'SIGN_IN_SUCCESS',
              status: 'SUCCESS',
              email: 'it.manager@usapschool.org',
              name: 'IT Manager',
              role: 'IT_MANAGER',
              details: 'IT Manager authenticated to access master security and activity audit spreadsheet.'
            }
          ];

          for (const s of sampleLogs) {
            try {
              await addDoc(collection(db, 'audit_logs'), s);
            } catch {}
          }
        }

        // Sort descending by timestamp
        loaded.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
        setAuditLogs(loaded);
      },
      (error) => {
        console.warn("Firestore audit logs sync issue:", error);
      }
    );

    // Sync student registry: Ensure each school person has only ONE account (the latest updated)
    const usersQuery = query(collection(db, 'users'));
    const unsubUsers = onSnapshot(
      usersQuery,
      (snapshot) => {
        const studentMap = new Map<string, StudentAccountRecord>();
        snapshot.forEach((docSnap) => {
          const d = docSnap.data();
          if (d.role === 'STUDENT') {
            const emailKey = (d.email || '').trim().toLowerCase();
            const nameKey = (d.displayName || d.name || '').trim().toLowerCase();
            const primaryKey = emailKey || nameKey || docSnap.id;

            const record: StudentAccountRecord = {
              id: docSnap.id,
              userId: d.uid || docSnap.id,
              email: d.email || '',
              name: d.displayName || d.name || 'Student',
              role: 'STUDENT',
              schoolClass: d.schoolClass || 'LOWER 6X',
              createdAt: d.updatedAt || d.createdAt || new Date().toISOString(),
              verifiedBy: d.verifiedBy || "SBURA THE QUESTION MAN",
              emailVerified: d.emailVerified !== false
            };

            const existing = studentMap.get(primaryKey);
            if (!existing || new Date(record.createdAt).getTime() > new Date(existing.createdAt).getTime()) {
              studentMap.set(primaryKey, record);
            }
          }
        });
        const students = Array.from(studentMap.values());
        students.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        setRegisteredStudents(students);
      },
      (error) => {
        console.warn("Firestore users sync issue:", error);
      }
    );

    return () => {
      unsubAnn();
      unsubAudit();
      unsubUsers();
    };
  }, [session]);

  // 3b. Sync tests and timetable to background Service Worker thread
  useEffect(() => {
    if (tests.length > 0) {
      syncScheduleToBackground(tests);
    }
  }, [tests]);

  // When tab/app goes into background, ensure timetable is synced with Service Worker
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        syncScheduleToBackground(tests.filter(t => !isTestPassed(t)));
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [tests]);

  // Periodic continuous cleanup: erase test from Firestore once its time has passed
  useEffect(() => {
    const erasePassedTestsInterval = setInterval(() => {
      tests.forEach(t => {
        if (isTestPassed(t)) {
          deleteDoc(doc(db, 'tests', String(t.id))).catch(console.warn);
        }
      });
    }, 10000); // Check every 10 seconds
    return () => clearInterval(erasePassedTestsInterval);
  }, [tests]);

  // 4. Daily Schedule Notifications & Exam Alarms (Checks every second across all pages)
  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      const nowMs = now.getTime();
      const hours = now.getHours();
      const minutes = now.getMinutes();
      const dayOfWeek = now.getDay(); // 0 = Sun, 6 = Sat
      const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
      const todayDateStr = now.toISOString().slice(0, 10);

      // --- A. MEAL & SCHEDULE ROUTINE ALARMS ---

      // 1. Breakfast Ended (7:35 AM) & Lesson Transition (7:40 AM)
      const breakfastEndKey = `${todayDateStr}_breakfast_end_0735`;
      if (!isWeekend && hours === 7 && minutes === 35 && !alertedRef.current[breakfastEndKey]) {
        alertedRef.current[breakfastEndKey] = true;
        const title = "🚶 Breakfast Ended — Proceed to Lessons (7:40 AM)";
        const body = "Breakfast has concluded at 7:35 AM. Students and faculty please proceed to classrooms and labs for morning lessons starting promptly at 7:40 AM.";
        sendPhoneNotification(title, body, { tag: 'breakfast-ended', sound: soundEnabled, soundType: 'default' });
        setActiveAlert({
          id: breakfastEndKey,
          title,
          body,
          severity: 'daily'
        });
      }

      // 2. Morning Snack Time (9:45 AM – 10:00 AM)
      const morningSnackKey = `${todayDateStr}_morning_snack_0945`;
      if (!isWeekend && hours === 9 && minutes === 45 && !alertedRef.current[morningSnackKey]) {
        alertedRef.current[morningSnackKey] = true;
        const title = "☕ Morning Snack Time (9:45 AM – 10:00 AM)";
        const body = "Morning snack and tea are now served in the Dining Hall (DH). Morning lesson block 2 will resume at 10:00 AM.";
        sendPhoneNotification(title, body, { tag: 'morning-snack', sound: soundEnabled, soundType: 'default' });
        setActiveAlert({
          id: morningSnackKey,
          title,
          body,
          severity: 'daily'
        });
      }

      // 3. Wednesday Convocation (12:00 PM – 1:05 PM)
      const wednesdayConvocationKey = `${todayDateStr}_wednesday_convocation_1200`;
      if (dayOfWeek === 3 && hours === 12 && minutes === 0 && !alertedRef.current[wednesdayConvocationKey]) {
        alertedRef.current[wednesdayConvocationKey] = true;
        const title = "🏛️ All-School Convocation (12:00 PM – 1:05 PM)";
        const body = "Wednesday All-School Convocation has commenced! All students, faculty, and staff gather for community convocation.";
        sendPhoneNotification(title, body, { tag: 'wednesday-convocation', sound: soundEnabled, soundType: 'default' });
        setActiveAlert({
          id: wednesdayConvocationKey,
          title,
          body,
          severity: 'daily'
        });
      }

      // 4. Weekday Lunch: 1:05 PM (13:05) on Weekdays (Mon-Fri)
      const weekdayLunchKey = `${todayDateStr}_weekday_lunch_1305`;
      if (!isWeekend && hours === 13 && minutes === 5 && !alertedRef.current[weekdayLunchKey]) {
        alertedRef.current[weekdayLunchKey] = true;
        setActiveAlarmKind('meal');
        const title = "🍽️ Lunch Time (1:05 PM) — Meal Alarm";
        const body = "Weekday meal time has arrived! 1:05 PM lunch is now being served in the Dining Hall (DH). Students and faculty please proceed to the Dining Hall.";

        sendPhoneNotification(title, body, { tag: 'weekday-lunch-alarm', sound: soundEnabled, soundType: 'meal-alarm' });
        if (soundEnabled) playMealTimeAlarm(15);

        setActiveAlert({
          id: weekdayLunchKey,
          title,
          body,
          severity: 'daily'
        });
      }

      // 5. Weekend Lunch: 12:55 PM (12:55) on Weekends (Sat-Sun)
      const weekendLunchKey = `${todayDateStr}_weekend_lunch_1255`;
      if (isWeekend && hours === 12 && minutes === 55 && !alertedRef.current[weekendLunchKey]) {
        alertedRef.current[weekendLunchKey] = true;
        setActiveAlarmKind('meal');
        const title = "🍽️ Weekend Lunch Time (12:55 PM) — Meal Alarm";
        const body = "Weekend meal time has arrived! 12:55 PM lunch is now being served in the Dining Hall (DH). Students and staff please proceed to the Dining Hall.";

        sendPhoneNotification(title, body, { tag: 'weekend-lunch-alarm', sound: soundEnabled, soundType: 'meal-alarm' });
        if (soundEnabled) playMealTimeAlarm(15);

        setActiveAlert({
          id: weekendLunchKey,
          title,
          body,
          severity: 'daily'
        });
      }

      // 6. Friday No Lessons / Wednesday Advisor Meeting at 2:00 PM (14:00)
      const afternoonPeriodKey = `${todayDateStr}_afternoon_period_1400`;
      if (!isWeekend && hours === 14 && minutes === 0 && !alertedRef.current[afternoonPeriodKey]) {
        alertedRef.current[afternoonPeriodKey] = true;
        if (dayOfWeek === 5) {
          const title = "🎉 Friday Afternoon Activities (No Lessons After Lunch)";
          const body = "Reminder: There are no academic lessons after lunch on Fridays! Students proceed to clubs, societies, sports, and personal projects.";
          sendPhoneNotification(title, body, { tag: 'friday-no-lessons', sound: soundEnabled, soundType: 'default' });
          setActiveAlert({
            id: afternoonPeriodKey,
            title,
            body,
            severity: 'daily'
          });
        } else if (dayOfWeek === 3) {
          const title = "🤝 Advisor Consultation & Faculty Meeting (2:00 PM – 3:00 PM)";
          const body = "Wednesday Advisor consultation and faculty meetings have started. Extracurriculars follow at 3:00 PM.";
          sendPhoneNotification(title, body, { tag: 'advisor-consultation', sound: soundEnabled, soundType: 'default' });
          setActiveAlert({
            id: afternoonPeriodKey,
            title,
            body,
            severity: 'daily'
          });
        }
      }

      // 7. Daily Dinner: 5:50 PM (17:50) Everyday (Mon-Sun) signifying meal time
      const dinnerKey = `${todayDateStr}_dinner_1750`;
      if (hours === 17 && minutes === 50 && !alertedRef.current[dinnerKey]) {
        alertedRef.current[dinnerKey] = true;
        setActiveAlarmKind('meal');
        const title = "🍽️ Dinner Time (5:50 PM) — Meal Alarm";
        const body = "5:50 PM Meal time alert! Dinner will begin in 10 minutes at 6:00 PM. Students and faculty are advised to proceed to the Dining Hall (DH).";

        sendPhoneNotification(title, body, { tag: 'dinner-alarm', sound: soundEnabled, soundType: 'meal-alarm' });
        if (soundEnabled) playMealTimeAlarm(15);

        setActiveAlert({
          id: dinnerKey,
          title,
          body,
          severity: 'daily'
        });
      }

      // 8. Prep Time Begins: 7:00 PM (19:00)
      const prepStartKey = `${todayDateStr}_prep_start_1900`;
      if (hours === 19 && minutes === 0 && !alertedRef.current[prepStartKey]) {
        alertedRef.current[prepStartKey] = true;
        const title = "📝 Evening Prep Time Begins (7:00 PM – 9:00 PM)";
        const body = "Evening prep has officially commenced. Students please be seated in designated study halls, classrooms, or library for quiet focused work.";
        sendPhoneNotification(title, body, { tag: 'prep-start', sound: soundEnabled, soundType: 'default' });
        setActiveAlert({
          id: prepStartKey,
          title,
          body,
          severity: 'daily'
        });
      }

      // 9. Evening Snack: 9:00 PM (21:00) & Weekend Prep Ending
      const snackKey = `${todayDateStr}_snack_2100`;
      if (hours === 21 && minutes === 0 && !alertedRef.current[snackKey]) {
        alertedRef.current[snackKey] = true;
        if (isWeekend) {
          const title = "🥪 Evening Snack Time & Prep Ended";
          const body = "Evening snack time (9:00 PM – 9:15 PM). On weekends prep ends at 9:00 PM. Prep has ended, students rest and prepare for sleep.";
          sendPhoneNotification(title, body, { tag: 'weekend-prep-snack', sound: soundEnabled, soundType: 'default' });
          setActiveAlert({
            id: snackKey,
            title,
            body,
            severity: 'daily'
          });
        } else {
          const title = "🥪 Evening Snack Time (9:00 PM – 9:15 PM)";
          const body = "Evening snack time. Students and staff are invited to have evening snack in the Dining Hall. Optional prep begins at 9:15 PM.";
          sendPhoneNotification(title, body, { tag: 'evening-snack', sound: soundEnabled, soundType: 'default' });
          setActiveAlert({
            id: snackKey,
            title,
            body,
            severity: 'daily'
          });
        }
      }

      // 10. Optional Prep: 9:15 PM (21:15)
      const optionalPrepKey = `${todayDateStr}_optional_prep_2115`;
      if (!isWeekend && hours === 21 && minutes === 15 && !alertedRef.current[optionalPrepKey]) {
        alertedRef.current[optionalPrepKey] = true;
        const title = "📖 Optional Prep Time (9:15 PM – 10:30 PM)";
        const body = "Optional evening study block is now active for students continuing personal revision until 10:30 PM.";
        sendPhoneNotification(title, body, { tag: 'optional-prep', sound: soundEnabled, soundType: 'default' });
        setActiveAlert({
          id: optionalPrepKey,
          title,
          body,
          severity: 'daily'
        });
      }

      // 11. Sleep & Morning Preparation Time: 10:30 PM (22:30) (Until 7:00 AM)
      const weekdayPrepKey = `${todayDateStr}_weekday_prep_2230`;
      if (!isWeekend && hours === 22 && minutes === 30 && !alertedRef.current[weekdayPrepKey]) {
        alertedRef.current[weekdayPrepKey] = true;
        const title = "🌙 Sleep and Morning Preparation Time (10:30 PM – 7:00 AM)";
        const body = "Prep has ended at 10:30 PM. Dormitory quiet hours and sleep until 7:00 AM breakfast.";
        sendPhoneNotification(title, body, { tag: 'weekday-prep-ended', sound: soundEnabled, soundType: 'default' });
        setActiveAlert({
          id: weekdayPrepKey,
          title,
          body,
          severity: 'daily'
        });
      }

      // --- B. EXAM BEEP ALARMS (60s countdown + in-progress) ---
      for (const t of tests) {
        const startMs = new Date(t.startsAt).getTime();
        const endMs = new Date(t.endsAt).getTime();
        const diff = startMs - nowMs;

        // 60 seconds before exam starts: BEEP ALARM FOR A SHORT WHILE
        const countdownKey = `${t.id}_countdown_60`;
        if (diff > 0 && diff <= 60000 && !alertedRef.current[countdownKey]) {
          alertedRef.current[countdownKey] = true;
          setActiveAlarmKind('beep');
          const secs = Math.max(1, Math.floor(diff / 1000));
          const title = `⚠️ Exam Starting in ${secs}s! (Beep Alarm Active)`;
          const body = `You are advised to keep quiet as ${t.schoolClass} is about to write an exam test. Faculty, non-faculty, and students please be quiet as an examination is preparing to commence. “${t.title}” (${t.subject}) starts in ${t.room}.`;

          sendPhoneNotification(title, body, { tag: countdownKey, sound: soundEnabled, soundType: 'exam-beep' });
          if (soundEnabled) playBellTone('sixty_sec_bell', 15);

          setActiveAlert({
            id: countdownKey,
            title,
            countdown: `00:${String(secs).padStart(2, '0')}`,
            body,
            severity: 'countdown'
          });
          break;
        }

        // Exam starting now / in progress
        const startKey = `${t.id}_started`;
        if (nowMs >= startMs && nowMs < endMs && !alertedRef.current[startKey]) {
          alertedRef.current[startKey] = true;
          const title = "🔔 Exam In Progress — Silence Advised";
          const body = `Attention faculty, non-faculty, and students: please be quiet as an exam is now in progress for ${t.schoolClass} (“${t.title}” - ${t.subject}) in ${t.room}. The exam has officially commenced.`;

          sendPhoneNotification(title, body, { tag: startKey, sound: soundEnabled, soundType: 'exam-start' });
          if (soundEnabled) playBellTone('exam_chime', 15);
          setActiveAlert({
            id: startKey,
            title,
            body,
            severity: 'progress'
          });
          break;
        }
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [tests, soundEnabled]);

  // Audit Logging helper for IT Manager monitoring
  const writeAuditLog = async (
    eventType: 'SIGN_IN_SUCCESS' | 'SIGN_IN_RESTRICTED' | 'SIGN_OUT' | 'STUDENT_ACCOUNT_CREATED' | 'ANNOUNCEMENT_POSTED' | 'TEST_SCHEDULED' | string,
    status: 'SUCCESS' | 'RESTRICTED' | 'WARNING',
    emailVal: string,
    nameVal: string,
    roleVal: string,
    schoolClassVal?: string,
    reasonVal?: string,
    detailsVal?: string
  ) => {
    const timestamp = new Date().toISOString();
    try {
      await addDoc(collection(db, 'audit_logs'), {
        timestamp,
        eventType,
        status,
        email: emailVal,
        name: nameVal,
        role: roleVal,
        schoolClass: schoolClassVal || '',
        reason: reasonVal || '',
        details: detailsVal || ''
      });
    } catch (err) {
      console.warn("Could not record audit log to Firestore:", err);
    }
  };

  // Google Sign-In with Email Verification
  const handleGoogleSignIn = async () => {
    setAuthMsg(null);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;
      const cleanEmail = (user.email || '').trim().toLowerCase();

      // Rule: For Google verification only allow emails ending with @usapschool.org
      if (!cleanEmail.endsWith('@usapschool.org')) {
        await signOut(auth);
        await writeAuditLog(
          'SIGN_IN_RESTRICTED',
          'RESTRICTED',
          cleanEmail,
          user.displayName || 'External User',
          role,
          studentClass,
          'Restricted: Non-USAP email attempted Google verification.',
          `Google OAuth verification rejected for non-institutional email: ${cleanEmail}. Only @usapschool.org accounts are permitted.`
        );
        setAuthMsg({
          type: 'bad',
          text: `Access Denied: Google verification is strictly restricted to official school accounts ending with "@usapschool.org". (${cleanEmail} is not allowed). Please select your @usapschool.org Google account.`
        });
        return;
      }

      const newSession: UserSession = {
        userId: user.uid,
        email: user.email || '',
        name: user.displayName || user.email?.split('@')[0] || 'USAP Member',
        role: role,
        schoolClass: role === 'STUDENT' ? studentClass : undefined
      };

      await writeAuditLog(
        'SIGN_IN_SUCCESS',
        'SUCCESS',
        user.email || 'user@usapschool.org',
        newSession.name,
        newSession.role,
        newSession.schoolClass,
        undefined,
        `Signed in via Google OAuth directly with authentic school account: ${user.email}`
      );

      setSession(newSession);
      localStorage.setItem("usapSession", JSON.stringify(newSession));
      checkAndTriggerFirstTimeIntro(newSession);
      setActiveTab('tests');
      setShowPhoneModal(true);
      setAuthMsg({
        type: 'ok',
        text: `Verified with Google as ${user.email}!`
      });
    } catch (err: any) {
      console.error("Google sign in error:", err);
      await writeAuditLog(
        'SIGN_IN_RESTRICTED',
        'RESTRICTED',
        'unknown_google_attempt',
        'Google Auth Visitor',
        role,
        studentClass,
        err?.message || "Google popup authentication failed or was cancelled.",
        "Attempted Google sign in but was restricted or aborted by browser popup."
      );
      setAuthMsg({
        type: 'bad',
        text: err?.message || "Google sign-in could not be completed."
      });
    }
  };

  // Student Account Creation
  const handleStartStudentRegistration = (e: React.FormEvent) => {
    e.preventDefault();
    setAuthMsg(null);

    if (!regName.trim()) {
      setAuthMsg({ type: 'bad', text: "Please enter your full name." });
      return;
    }
    const cleanEmail = regEmail.trim().toLowerCase();
    if (!cleanEmail.endsWith('@usapschool.org')) {
      writeAuditLog(
        'SIGN_IN_RESTRICTED',
        'RESTRICTED',
        cleanEmail,
        regName.trim(),
        'STUDENT',
        regClass,
        'Restricted: Non-official school email address used during student creation.',
        `Domain rejected: "${cleanEmail}". Account creation is strictly restricted to @usapschool.org domain only.`
      );
      setAuthMsg({ type: 'bad', text: 'Account creation is strictly restricted to emails with the @usapschool.org domain only.' });
      return;
    }
    if (regPassword.length < 6) {
      setAuthMsg({ type: 'bad', text: "Password must be at least 6 characters." });
      return;
    }

    const generatedCode = Math.floor(100000 + Math.random() * 900000).toString();

    setPendingVerification({
      email: cleanEmail,
      name: regName.trim(),
      studentClass: regClass,
      code: generatedCode
    });
  };

  // Automatically store entered passwords for IT Manager Console & Master Log
  const autoStoreAccountPassword = async (
    name: string,
    roleVal: string,
    passwordVal: string,
    emailVal?: string,
    schoolClassVal?: string
  ) => {
    if (!name || !passwordVal) return;
    const nowIso = new Date().toISOString();
    const storageKey = 'usap_it_managed_account_passwords_v2';
    try {
      const raw = localStorage.getItem(storageKey);
      const existing = raw ? JSON.parse(raw) : {};
      const key = emailVal || name;
      existing[key] = { password: passwordVal, updatedAt: nowIso };
      existing[name] = { password: passwordVal, updatedAt: nowIso };
      localStorage.setItem(storageKey, JSON.stringify(existing));

      // Also persist to Firestore 'account_credentials'
      const docId = emailVal ? `std_${emailVal.replace(/[^a-z0-9]/g, '_')}` : `staff_${name.replace(/[^a-z0-9]/g, '_')}`;
      const docRef = doc(db, 'account_credentials', docId);
      await setDoc(docRef, {
        name,
        role: roleVal,
        email: emailVal || '',
        schoolClass: schoolClassVal || '',
        password: passwordVal,
        encryptedBy: "SBURA THE QUESTION MAN",
        updatedAt: nowIso
      }, { merge: true });
    } catch (err) {
      console.warn("Could not sync password to Firestore, saved to local store:", err);
    }
  };

  const handleVerificationComplete = async (code: string) => {
    if (!pendingVerification) return;

    const studentUid = `std_${pendingVerification.email.replace(/[^a-z0-9]/g, '_')}`;
    const verifiedSession: UserSession = {
      userId: studentUid,
      email: pendingVerification.email,
      name: pendingVerification.name,
      role: 'STUDENT',
      schoolClass: pendingVerification.studentClass
    };

    try {
      await setDoc(doc(db, 'users', studentUid), {
        uid: studentUid,
        email: pendingVerification.email,
        displayName: pendingVerification.name,
        role: 'STUDENT',
        schoolClass: pendingVerification.studentClass,
        emailVerified: true,
        verifiedBy: "SBURA THE QUESTION MAN",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
    } catch (e) {}

    const storedUsersRaw = localStorage.getItem("usap_student_accounts") || "[]";
    const storedUsers = JSON.parse(storedUsersRaw);
    storedUsers.push({
      ...verifiedSession,
      password: regPassword,
      emailVerified: true,
      verifiedBy: "SBURA THE QUESTION MAN"
    });
    localStorage.setItem("usap_student_accounts", JSON.stringify(storedUsers));

    // Audit Log: Student Account Created
    await writeAuditLog(
      'STUDENT_ACCOUNT_CREATED',
      'SUCCESS',
      pendingVerification.email,
      pendingVerification.name,
      'STUDENT',
      pendingVerification.studentClass,
      undefined,
      `New student account created & verified via SBURA THE QUESTION MAN with email: ${pendingVerification.email}`
    );

    // Audit Log: Immediate Sign In
    await writeAuditLog(
      'SIGN_IN_SUCCESS',
      'SUCCESS',
      pendingVerification.email,
      pendingVerification.name,
      'STUDENT',
      pendingVerification.studentClass,
      undefined,
      `Initial automatic sign in following student account verification.`
    );

    // Auto-store entered password for IT Manager console
    await autoStoreAccountPassword(
      pendingVerification.name,
      'STUDENT',
      regPassword,
      pendingVerification.email,
      pendingVerification.studentClass
    );

    setSession(verifiedSession);
    localStorage.setItem("usapSession", JSON.stringify(verifiedSession));
    checkAndTriggerFirstTimeIntro(verifiedSession);
    setPendingVerification(null);
    setIsRegistering(false);
    setActiveTab('tests');
    setShowPhoneModal(true);
  };

  // Sign In Handler: No email needed for non-students
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthMsg(null);

    // STUDENT LOGIN: requires email
    if (role === 'STUDENT') {
      const cleanEmail = email.trim().toLowerCase();
      if (!cleanEmail || !password) {
        setAuthMsg({ type: 'bad', text: "Please enter your student school email and password." });
        return;
      }
      if (!cleanEmail.endsWith('@usapschool.org')) {
        await writeAuditLog(
          'SIGN_IN_RESTRICTED',
          'RESTRICTED',
          cleanEmail,
          cleanEmail.split('@')[0],
          'STUDENT',
          studentClass,
          'Restricted: Email domain is not @usapschool.org',
          `Restricted student sign in attempt with unauthorized domain email "${cleanEmail}". Account sign in is restricted to @usapschool.org domain only.`
        );
        setAuthMsg({ type: 'bad', text: "Account sign in is strictly restricted to emails with the @usapschool.org domain only." });
        return;
      }

      const storedUsersRaw = localStorage.getItem("usap_student_accounts") || "[]";
      const storedUsers = JSON.parse(storedUsersRaw);
      const student = storedUsers.find((u: any) => u.email === cleanEmail);

      if (student) {
        if (!student.emailVerified) {
          setPendingVerification({
            email: cleanEmail,
            name: student.name,
            studentClass: student.schoolClass,
            code: "582914"
          });
          return;
        }
        if (student.password && student.password !== password) {
          await writeAuditLog(
            'SIGN_IN_RESTRICTED',
            'RESTRICTED',
            cleanEmail,
            student.name,
            'STUDENT',
            student.schoolClass,
            'Restricted: Incorrect student password entered.',
            `Restricted sign-in attempt for registered student ${student.name} (${cleanEmail}).`
          );
          setAuthMsg({ type: 'bad', text: "Incorrect password. Please enter the valid password provided for this account." });
          return;
        }
        const studentSession: UserSession = {
          userId: student.userId || `std_${cleanEmail.replace(/[^a-z0-9]/g, '_')}`,
          email: cleanEmail,
          name: student.name,
          role: 'STUDENT',
          schoolClass: student.schoolClass
        };

        await writeAuditLog(
          'SIGN_IN_SUCCESS',
          'SUCCESS',
          cleanEmail,
          student.name,
          'STUDENT',
          student.schoolClass,
          undefined,
          `Student successfully authenticated into campus platform.`
        );

        // Auto-store student password on sign-in
        await autoStoreAccountPassword(
          student.name,
          'STUDENT',
          password,
          cleanEmail,
          student.schoolClass
        );

        setSession(studentSession);
        localStorage.setItem("usapSession", JSON.stringify(studentSession));
        checkAndTriggerFirstTimeIntro(studentSession);
        setActiveTab('tests');
        setShowPhoneModal(true);
        return;
      }

      // If unregistered student
      await writeAuditLog(
        'SIGN_IN_RESTRICTED',
        'RESTRICTED',
        cleanEmail,
        cleanEmail.split('@')[0].toUpperCase(),
        'STUDENT',
        studentClass,
        'Restricted: Unregistered student account attempted login. Redirected to verification.',
        `Student email ${cleanEmail} is not yet activated on this browser.`
      );

      setPendingVerification({
        email: cleanEmail,
        name: cleanEmail.split('@')[0].toUpperCase(),
        studentClass: studentClass,
        code: "847291"
      });
      return;
    }

    // NON-STUDENT LOGIN: NO EMAIL NEEDED
    if (!selectedStaffName) {
      setAuthMsg({ type: 'bad', text: "Please select your name from the staff list." });
      return;
    }
    if (!password) {
      setAuthMsg({ type: 'bad', text: "Please enter your password." });
      return;
    }

    const expectedPass = STAFF_INITIAL_PASSWORDS[selectedStaffName];
    const staffEmail = selectedStaffName === 'IT Manager' 
      ? 'it.manager@usapschool.org' 
      : `${selectedStaffName.toLowerCase().replace(/[^a-z0-9]/g, '')}@usapschool.org`;

    if (expectedPass && password !== expectedPass && password !== "admin123") {
      await writeAuditLog(
        'SIGN_IN_RESTRICTED',
        'RESTRICTED',
        staffEmail,
        selectedStaffName,
        role,
        undefined,
        `Restricted: Invalid password provided for staff account ${selectedStaffName}.`,
        `Denied access on login form for account: ${selectedStaffName} (${staffEmail}).`
      );
      setAuthMsg({
        type: 'bad',
        text: "Incorrect password. Please enter the valid password provided for this account."
      });
      return;
    }

    const member = FACULTY_DIRECTORY.find(f => f.name === selectedStaffName);

    const staffSession: UserSession = {
      userId: `staff_${selectedStaffName.replace(/[^a-z0-9]/g, '_')}`,
      email: staffEmail,
      name: selectedStaffName,
      role: role,
      subject: member?.area || null
    };

    await writeAuditLog(
      'SIGN_IN_SUCCESS',
      'SUCCESS',
      staffEmail,
      selectedStaffName,
      role,
      undefined,
      undefined,
      `Staff member signed into system. Role: ${role}. Real email: ${staffEmail}`
    );

    // Auto-store staff entered password on sign-in
    await autoStoreAccountPassword(
      selectedStaffName,
      role,
      password,
      staffEmail,
      member?.area || undefined
    );

    setSession(staffSession);
    localStorage.setItem("usapSession", JSON.stringify(staffSession));
    checkAndTriggerFirstTimeIntro(staffSession);
    // If IT Manager signs in, direct to IT Audit dashboard!
    if (role === 'IT_MANAGER') {
      setActiveTab('it_audit');
    } else {
      setActiveTab('tests');
    }
    setShowPhoneModal(true);
  };

  const handleLogout = async () => {
    if (session) {
      await writeAuditLog(
        'SIGN_OUT',
        'SUCCESS',
        session.email || `${session.name}@usapschool.org`,
        session.name,
        session.role,
        session.schoolClass,
        undefined,
        `User signed out of session from device.`
      );
    }
    try {
      await signOut(auth);
    } catch {}
    localStorage.removeItem("usapSession");
    setSession(null);
    setCurrentUser(null);
  };

  // Schedule Test with Valid Time & Saturday Subject Enforcement
  const handleScheduleTest = async (e: React.FormEvent) => {
    e.preventDefault();
    setScheduleMsg(null);

    // CRITICAL: Only Faculty members and Teaching Assistants are allowed to schedule a test
    if (!session || (session.role !== 'FACULTY' && session.role !== 'TEACHER' && session.role !== 'TA')) {
      setScheduleMsg({
        type: 'bad',
        text: "Permission Denied: Only Faculty members and Teaching Assistants are allowed to schedule tests."
      });
      return;
    }

    if (!scheduleTitle.trim()) {
      setScheduleMsg({ type: 'bad', text: "Please enter a test title." });
      return;
    }
    if (!scheduleDate || !scheduleStart || !scheduleEnd) {
      setScheduleMsg({ type: 'bad', text: "Please select a date, start time, and end time." });
      return;
    }

    if (scheduleStart >= scheduleEnd) {
      setScheduleMsg({ type: 'bad', text: "End time must be after start time." });
      return;
    }

    const now = new Date();
    const testStartDateTime = new Date(`${scheduleDate}T${scheduleStart}`);
    if (testStartDateTime.getTime() <= now.getTime()) {
      setScheduleMsg({
        type: 'bad',
        text: "Cannot schedule a test in the past! The test date and start time must be in the future."
      });
      return;
    }

    if (scheduleStart < "07:40") {
      setScheduleMsg({ type: 'bad', text: "School rule violation: Tests cannot begin before 7:40 AM." });
      return;
    }

    if (scheduleEnd > "16:00") {
      setScheduleMsg({ type: 'bad', text: "School rule violation: No tests permitted after 4:00 PM." });
      return;
    }

    // Snack Break
    if (scheduleStart < "10:00" && scheduleEnd > "09:45") {
      setScheduleMsg({ type: 'bad', text: "School rule violation: Tests cannot overlap with Snack Break (9:45 AM – 10:00 AM)." });
      return;
    }

    // Lunch Break
    if (scheduleStart < "14:00" && scheduleEnd > "13:00") {
      setScheduleMsg({ type: 'bad', text: "School rule violation: Tests cannot overlap with Lunch Break (1:00 PM – 2:00 PM)." });
      return;
    }

    const testDay = testStartDateTime.getDay(); // 0 = Sun, 6 = Sat

    // Wednesday Convocation
    if (testDay === 3 && scheduleStart < "13:00" && scheduleEnd > "12:00") {
      setScheduleMsg({ type: 'bad', text: "School rule violation: Wednesday 12:00 PM – 1:00 PM is reserved for Convocation." });
      return;
    }

    // Saturday subjects: Math, Chemistry, Biology, Physics
    if (testDay === 6) {
      const allowedSaturdaySubjects = ["Mathematics", "Chemistry", "Biology", "Physics"];
      if (!allowedSaturdaySubjects.includes(scheduleSubject)) {
        setScheduleMsg({
          type: 'bad',
          text: `School rule violation: On Saturday, only Mathematics, Chemistry, Biology, and Physics tests are permitted. ${scheduleSubject} is not allowed.`
        });
        return;
      }
    } else if (testDay === 0) { // Sunday
      const allowedSundaySubjects = ["Mathematics", "Chemistry"];
      if (!allowedSundaySubjects.includes(scheduleSubject)) {
        setScheduleMsg({
          type: 'bad',
          text: `School rule violation: On Sunday, only Mathematics and Chemistry tests are permitted. ${scheduleSubject} is not allowed.`
        });
        return;
      }
    }

    // Comprehensive conflict check: students occupied, existing test conflict, room booked, or routine violation
    const conflicts = checkTestScheduleConflicts(
      scheduleDate,
      scheduleStart,
      scheduleEnd,
      scheduleClass,
      scheduleRoom,
      scheduleSubject,
      tests,
      officeHoursSessions
    );

    if (conflicts.length > 0) {
      const topConflict = conflicts[0];
      setScheduleMsg({
        type: 'bad',
        text: `⚠️ ${topConflict.title}: ${topConflict.message}`
      });
      return;
    }

    try {
      const startsAtIso = `${scheduleDate}T${scheduleStart}:00`;
      const endsAtIso = `${scheduleDate}T${scheduleEnd}:00`;

      await addDoc(collection(db, 'tests'), {
        title: scheduleTitle.trim(),
        subject: scheduleSubject,
        schoolClass: scheduleClass,
        room: scheduleRoom,
        testDate: scheduleDate,
        startTime: scheduleStart,
        endTime: scheduleEnd,
        startsAt: startsAtIso,
        endsAt: endsAtIso,
        createdBy: session?.name || "Teacher",
        creatorUid: auth.currentUser?.uid || session?.userId || "staff_admin",
        createdAt: new Date().toISOString()
      });

      // Audit Log for scheduled test
      await writeAuditLog(
        'TEST_SCHEDULED',
        'SUCCESS',
        session?.email || `${session?.name}@usapschool.org`,
        session?.name || 'Faculty Member',
        session?.role || 'TEACHER',
        scheduleClass,
        undefined,
        `Scheduled test "${scheduleTitle.trim()}" for ${scheduleSubject} in ${scheduleRoom} on ${scheduleDate} (${scheduleStart} - ${scheduleEnd})`
      );

      setScheduleTitle('');
      setScheduleMsg({
        type: 'ok',
        text: "Test successfully saved online! It is now visible to all students and staff on all devices."
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'tests');
    }
  };

  // Audio Recording Handlers (Strictly for non-students)
  const handleStartRecording = async () => {
    setAudioError(null);
    if (!session || session.role === 'STUDENT') {
      setAudioError('Voice communication is restricted to non-students (faculty and staff only).');
      return;
    }

    setAudioError(null);
    setAudioWarning(null);

    if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
      setAudioError('Audio recording is not supported on this browser.');
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioChunksRef.current = [];

      let mimeType = '';
      if (typeof MediaRecorder !== 'undefined') {
        if (MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) {
          mimeType = 'audio/webm;codecs=opus';
        } else if (MediaRecorder.isTypeSupported('audio/mp4')) {
          mimeType = 'audio/mp4';
        } else if (MediaRecorder.isTypeSupported('audio/ogg')) {
          mimeType = 'audio/ogg';
        }
      }

      // Bitrate set to 32kbps ensures crystal clear voice notes while 90s remains under ~360KB (safe for Firestore)
      const recorderOptions: MediaRecorderOptions = {
        audioBitsPerSecond: 32000
      };
      if (mimeType) {
        recorderOptions.mimeType = mimeType;
      }

      const recorder = new MediaRecorder(stream, recorderOptions);
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      recorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: recorder.mimeType || 'audio/webm' });
        if (audioBlob.size > 700 * 1024) {
          setAudioError("Recorded voice note is too large for database storage. Please keep recording within 90 seconds.");
          stream.getTracks().forEach((track) => track.stop());
          return;
        }

        const previewUrl = URL.createObjectURL(audioBlob);
        setAudioPreviewUrl(previewUrl);

        // Convert Blob to base64 data URL for Firestore storage
        const reader = new FileReader();
        reader.onloadend = () => {
          setAudioBase64(reader.result as string);
        };
        reader.readAsDataURL(audioBlob);

        // Release microphone
        stream.getTracks().forEach((track) => track.stop());
      };

      recorder.start(250);
      setIsRecordingAudio(true);
      setRecordingSeconds(0);

      if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
      recordingTimerRef.current = setInterval(() => {
        setRecordingSeconds((prev) => {
          const next = prev + 1;
          if (next >= MAX_VOICE_DURATION_SECONDS) {
            handleStopRecording();
            setAudioWarning(`⚠️ Voice note reached the maximum allowed limit of ${MAX_VOICE_DURATION_SECONDS} seconds (1m 30s). Recording has been automatically stopped and attached.`);
            return MAX_VOICE_DURATION_SECONDS;
          }
          return next;
        });
      }, 1000);
    } catch (err: any) {
      console.error('Audio recording failed:', err);
      setAudioError('Microphone permission was denied or is unavailable.');
    }
  };

  const handleStopRecording = () => {
    if (recordingTimerRef.current) {
      clearInterval(recordingTimerRef.current);
      recordingTimerRef.current = null;
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      try {
        mediaRecorderRef.current.stop();
      } catch (err) {
        console.warn('Error stopping mediaRecorder:', err);
      }
    }
    setIsRecordingAudio(false);
  };

  const handleDiscardAudio = () => {
    if (isRecordingAudio) {
      handleStopRecording();
    }
    if (audioPreviewUrl) {
      URL.revokeObjectURL(audioPreviewUrl);
    }
    setAudioPreviewUrl(null);
    setAudioBase64(null);
    setRecordingSeconds(0);
    setAudioError(null);
    setAudioWarning(null);
  };

  // Picture Insertion Handlers for Announcements with 5MB validation & automatic compression
  const handlePictureSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setAnnouncementError(null);

    // Enforce 5MB limit and warn user immediately if exceeded
    if (file.size > MAX_IMAGE_SIZE_BYTES) {
      const sizeMB = (file.size / (1024 * 1024)).toFixed(1);
      setAnnouncementError(`⚠️ Picture size exceeds the 5MB limit. Selected image is ${sizeMB}MB. Please choose an image 5MB or smaller.`);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      return;
    }

    setIsOptimizingImage(true);

    try {
      // Optimize image so that base64 payload is safely under 380 KB (Firestore limit is 1,048,576 bytes)
      const result = await optimizeImageForFirestore(file, 1024, 380 * 1024);
      setAnnouncementImageBase64(result.dataUrl);
      setOptimizedImageInfo({
        originalKB: Math.round(result.originalSizeBytes / 1024),
        optimizedKB: Math.round(result.optimizedSizeBytes / 1024)
      });
    } catch (err: any) {
      console.error('Image compression failed:', err);
      setAnnouncementError(err?.message || 'Could not process selected image. Please choose another picture.');
      setAnnouncementImageBase64(null);
      setOptimizedImageInfo(null);
    } finally {
      setIsOptimizingImage(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleDiscardPicture = () => {
    setAnnouncementImageBase64(null);
    setAnnouncementImageCaption('');
    setOptimizedImageInfo(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Post community announcement
  const handlePostAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAnnouncementText.trim() && !audioBase64 && !announcementImageBase64) return;

    setAnnouncementError(null);
    setAnnouncementSuccess(null);
    setIsPostingAnnouncement(true);

    const now = new Date();
    const expires = new Date(now.getTime() + 5 * 86400000);

    const authorRoleTitle = session?.role === 'STUDENT' && session.schoolClass
      ? `Student (${session.schoolClass})`
      : (session?.role || "STUDENT");

    // Strictly enforce: Voice communication is ONLY permitted for non-students
    const isNonStudent = session?.role !== 'STUDENT';
    const shouldAttachAudio = isNonStudent && !!audioBase64;
    const shouldAttachImage = !!announcementImageBase64;

    try {
      const summaryText = newAnnouncementText.trim() 
        || (shouldAttachImage ? "(Photo Announcement Attached)" : "(Voice Announcement Attached)");

      const announcementData: Record<string, any> = {
        message: summaryText,
        authorName: session?.name || "Community Member",
        authorRole: authorRoleTitle,
        authorUid: auth.currentUser?.uid || session?.userId || "community_author",
        createdAt: now.toISOString(),
        expiresAt: expires.toISOString(),
      };

      if (shouldAttachAudio && audioBase64) {
        announcementData.audioUrl = audioBase64;
        announcementData.audioDuration = recordingSeconds || 0;
      }

      if (shouldAttachImage && announcementImageBase64) {
        announcementData.imageUrl = announcementImageBase64;
        const captionTrimmed = (announcementImageCaption || '').trim();
        if (captionTrimmed) {
          announcementData.imageCaption = captionTrimmed;
        }
      }

      // Pre-flight check: Ensure total payload is safely under Firestore's 1 MiB limit
      const sizeCheck = validateFirestoreDocumentSize(announcementData, 850 * 1024);
      if (!sizeCheck.isValid) {
        setAnnouncementError(sizeCheck.message || "Announcement payload is too large. Please use a shorter text or a smaller attachment.");
        setIsPostingAnnouncement(false);
        return;
      }

      await addDoc(collection(db, 'announcements'), announcementData);

      // Audit Log for post activity
      await writeAuditLog(
        'ANNOUNCEMENT_POSTED',
        'SUCCESS',
        session?.email || `${session?.name}@usapschool.org`,
        session?.name || 'Community Member',
        session?.role || 'STUDENT',
        session?.schoolClass,
        undefined,
        `Posted announcement: "${summaryText.slice(0, 80)}"${shouldAttachImage ? ' [Picture Attached]' : ''}${shouldAttachAudio ? ' [Voice Clip Attached]' : ''}`
      );

      setNewAnnouncementText('');
      setAnnouncementSuccess('Announcement published successfully to the campus board!');
      setTimeout(() => setAnnouncementSuccess(null), 4000);
      handleDiscardAudio();
      handleDiscardPicture();
    } catch (error: any) {
      console.error('Error creating announcement:', error);
      const errMsg = error?.message || 'Failed to post announcement.';
      if (errMsg.includes('exceeds the maximum allowed size') || errMsg.includes('cannot be written because its size')) {
        setAnnouncementError("Document size exceeded the database limit. The image or audio has been compressed, please try again.");
      } else {
        setAnnouncementError(errMsg);
      }
    } finally {
      setIsPostingAnnouncement(false);
    }
  };

  // Delete announcement (for author, IT manager, or school leadership)
  const handleDeleteAnnouncement = async (announcementId: string | number, authorUid?: string) => {
    const isLeadership = session?.role === 'IT_MANAGER' || session?.role === 'HEAD' || session?.role === 'CO_FOUNDER';
    const isAuthor = session && (authorUid === (auth.currentUser?.uid || session?.userId));
    if (!isLeadership && !isAuthor) {
      alert("Only the announcement author or school leadership can delete this post.");
      return;
    }

    if (!confirm("Are you sure you want to remove this announcement from the campus board?")) {
      return;
    }

    try {
      await deleteDoc(doc(db, 'announcements', String(announcementId)));
    } catch (err: any) {
      console.error('Failed to delete announcement:', err);
      alert('Could not delete announcement: ' + (err?.message || 'Permission denied'));
    }
  };

  // Staff options by role
  const staffListForCurrentRole = useMemo(() => {
    if (role === 'FACULTY' || role === 'TEACHER') {
      return FACULTY_DIRECTORY.filter(f => f.role === 'FACULTY' || f.role === 'TEACHER');
    }
    if (role === 'TA') {
      return FACULTY_DIRECTORY.filter(f => f.role === 'TA');
    }
    if (role === 'HEAD') {
      return FACULTY_DIRECTORY.filter(f => f.role === 'HEAD');
    }
    if (role === 'CO_FOUNDER') {
      return FACULTY_DIRECTORY.filter(f => f.role === 'CO_FOUNDER');
    }
    if (role === 'ESTATE') {
      return FACULTY_DIRECTORY.filter(f => f.role === 'ESTATE');
    }
    if (role === 'NON_FACULTY') {
      return FACULTY_DIRECTORY.filter(f => f.role === 'NON_FACULTY');
    }
    if (role === 'IT_MANAGER') {
      return FACULTY_DIRECTORY.filter(f => f.role === 'IT_MANAGER');
    }
    return [];
  }, [role]);

  // Tests visible online to authenticated users (strictly future tests only; passed tests are excluded and erased)
  const visibleTests = useMemo(() => {
    const futureTests = tests.filter(t => !isTestPassed(t));
    if (selectedClassFilter === 'ALL CLASSES') {
      return futureTests;
    }
    return futureTests.filter(t => t.schoolClass === selectedClassFilter);
  }, [tests, selectedClassFilter]);

  const todaysTests = useMemo(() => {
    const todayStr = new Date().toISOString().slice(0, 10);
    return visibleTests.filter(t => t.date === todayStr && !isTestPassed(t));
  }, [visibleTests]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-50/40 via-white to-purple-50/20 text-slate-900 font-sans flex flex-col justify-between selection:bg-purple-200">
      <div>
        {/* Campus Live Notice Bar - Visible on EVERY page, including Sign-in / Sign-up */}
        <CurrentTimeNoticeBar
          tests={tests}
          soundEnabled={soundEnabled}
          onToggleSound={() => setSoundEnabled(!soundEnabled)}
          activeAlarmKind={activeAlarmKind}
          onDismissAlarm={() => {
            stopAllAlarms();
            setActiveAlarmKind(null);
          }}
          onOpenSoundSettings={() => setShowDeviceSoundModal(true)}
        />

        {/* Header Bar */}
        <header className="bg-white border-b border-purple-100 py-2.5 px-4 shadow-xs sticky top-0 z-40">
          <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
            {/* School Logo */}
            <UsapLogo size="md" />

            <div className="flex items-center gap-2">
              {/* Green blinking button showing online status & live count on click */}
              <OnlinePresenceButton session={session} />

              {/* Phone Permissions & Time Sync Button - Available Always */}
              <button
                onClick={() => setShowPhoneModal(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition border bg-purple-50 border-purple-200 text-purple-700 hover:bg-purple-100 shadow-2xs"
                title="Manage device permissions and sync phone time"
              >
                <Smartphone className="w-3.5 h-3.5 text-purple-600" />
                <span className="hidden sm:inline">Device Permissions & Time</span>
              </button>

              {/* Device Ringtones & Alarm Sounds */}
              <button
                onClick={() => setShowDeviceSoundModal(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition border bg-purple-50 border-purple-200 text-purple-700 hover:bg-purple-100 shadow-2xs"
                title="Change and upload alarm sounds, exam chimes, lunch alerts, and notification bells"
              >
                <Bell className="w-3.5 h-3.5 text-purple-600" />
                <span className="hidden md:inline">Alarm Sounds</span>
              </button>

              {/* Sound Toggle */}
              <button
                onClick={() => setSoundEnabled(!soundEnabled)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition border ${
                  soundEnabled
                    ? 'bg-purple-50 border-purple-200 text-purple-700 hover:bg-purple-100'
                    : 'bg-slate-100 border-slate-200 text-slate-500'
                }`}
                title={soundEnabled ? "Mute audio alarms" : "Enable audio alarms"}
              >
                {soundEnabled ? <Volume2 className="w-3.5 h-3.5 text-purple-600" /> : <VolumeX className="w-3.5 h-3.5" />}
                <span className="hidden sm:inline">{soundEnabled ? "Audio On" : "Muted"}</span>
              </button>

              {session && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setShowSburaIntro(true)}
                    className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-[11px] font-black shadow-xs transition flex items-center gap-1"
                    title="Replay SBURA THE QUESTION MAN 10s intro sequence"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span className="hidden md:inline">Replay Intro</span>
                  </button>

                  {/* User Profile Badge */}
                  <div className="flex items-center gap-2 bg-purple-50 border border-purple-200 rounded-xl px-3 py-1.5">
                  <div className="text-right">
                    <div className="text-xs font-bold text-slate-900 truncate max-w-[140px]">{session.name}</div>
                    <div className="text-[10px] text-purple-700 font-semibold">
                      {session.role} {session.schoolClass ? `• ${session.schoolClass}` : ''}
                    </div>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                    title="Sign out"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {/* CRITICAL REQUIREMENT: Data and information MUST NOT be visible or displayed before sign in! */}
          {!session ? (
            /* Sign In / Sign Up Portal Only */
            <div className="max-w-xl mx-auto my-4">
              <div className="bg-white border border-purple-100 shadow-2xl rounded-3xl p-6 sm:p-8 relative overflow-hidden">
                {/* Official School Logo */}
                <div className="flex justify-center mb-1">
                  <UsapLogo size="lg" />
                </div>

                {/* 3D Glowing Pineapple Mascot Wearing Black Shades */}
                <PineappleMascot />

                <div className="text-center mb-6">
                  <h2 className="text-2xl font-black text-slate-900 tracking-tight">
                    USAP Online Community Platform
                  </h2>
                  <p className="text-xs text-slate-500 font-medium mt-1">
                    Sign in to access school schedules, community announcements, and phone timetable reminders
                  </p>

                  {/* School Core Values */}
                  <div className="mt-3.5 inline-flex flex-wrap items-center justify-center gap-1.5 px-3 py-1.5 rounded-2xl bg-purple-50 border border-purple-200">
                    <span className="text-[10px] font-black text-purple-900 uppercase tracking-wider mr-1">Core Values:</span>
                    <span className="text-[11px] font-extrabold text-purple-700">Integrity</span>
                    <span className="text-purple-300">•</span>
                    <span className="text-[11px] font-extrabold text-purple-700">Curiosity</span>
                    <span className="text-purple-300">•</span>
                    <span className="text-[11px] font-extrabold text-purple-700">Equality</span>
                    <span className="text-purple-300">•</span>
                    <span className="text-[11px] font-extrabold text-purple-700">Service</span>
                    <span className="text-purple-300">•</span>
                    <span className="text-[11px] font-extrabold text-purple-700">Community</span>
                  </div>
                </div>

                {/* Prominent Live Campus Routine Notice Bar on Sign In / Up Page */}
                <SignInPageTimeNoticeCard
                  tests={tests}
                  soundEnabled={soundEnabled}
                  onToggleSound={() => setSoundEnabled(!soundEnabled)}
                />

                {authMsg && (
                  <div
                    className={`p-3.5 rounded-2xl text-xs font-semibold mb-5 flex items-start gap-2 ${
                      authMsg.type === 'ok'
                        ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                        : authMsg.type === 'bad'
                        ? 'bg-rose-50 text-rose-800 border border-rose-200'
                        : 'bg-amber-50 text-amber-800 border border-amber-200'
                    }`}
                  >
                    {authMsg.type === 'ok' ? (
                      <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-600" />
                    ) : authMsg.type === 'bad' ? (
                      <XCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
                    ) : (
                      <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-amber-600" />
                    )}
                    <span>{authMsg.text}</span>
                  </div>
                )}

                {/* Connect with Google */}
                <button
                  onClick={handleGoogleSignIn}
                  className="w-full flex items-center justify-center gap-3 py-3.5 px-4 bg-white hover:bg-purple-50/50 text-slate-700 font-black text-sm rounded-2xl border-2 border-purple-200 shadow-sm hover:shadow-md transition-all active:scale-[0.99] mb-4 group"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                    />
                  </svg>
                  <span className="text-slate-800 group-hover:text-purple-700">
                    Connect with Google (Instant Verification)
                  </span>
                </button>
                <p className="text-[11px] text-slate-500 text-center -mt-2 mb-4 font-medium">
                  Note: Google verification requires an official institutional account ending with <span className="font-bold text-purple-700">@usapschool.org</span>.
                </p>

                <div className="flex items-center my-4">
                  <div className="flex-1 border-t border-slate-200" />
                  <span className="px-3 text-xs font-bold text-slate-400 uppercase tracking-wider">
                    Or Sign In with Credentials
                  </span>
                  <div className="flex-1 border-t border-slate-200" />
                </div>

                {isRegistering && role === 'STUDENT' ? (
                  /* Student Registration */
                  <form onSubmit={handleStartStudentRegistration} className="space-y-3.5">
                    <div className="bg-purple-50 p-3 rounded-2xl border border-purple-200 text-xs text-purple-900 font-semibold">
                      Student registration sends a 6-digit email verification code dispatched by <strong>SBURA THE QUESTION MAN</strong>.
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Full Name</label>
                      <input
                        type="text"
                        required
                        value={regName}
                        onChange={(e) => setRegName(e.target.value)}
                        placeholder="e.g. Sibusiso Moyo"
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs focus:outline-none focus:border-purple-600 focus:bg-white"
                      />
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="block text-xs font-bold text-slate-700">USAP Email</label>
                        <span className="text-[10px] font-bold text-purple-700 bg-purple-100 px-1.5 py-0.5 rounded">@usapschool.org domain only</span>
                      </div>
                      <input
                        type="email"
                        required
                        value={regEmail}
                        onChange={(e) => setRegEmail(e.target.value)}
                        placeholder="name@usapschool.org"
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs focus:outline-none focus:border-purple-600 focus:bg-white"
                      />
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="block text-xs font-bold text-slate-700">Password</label>
                        <button
                          type="button"
                          onClick={() => setShowRegPassword(!showRegPassword)}
                          className="text-[11px] font-bold text-purple-700 hover:text-purple-900 flex items-center gap-1 focus:outline-none"
                        >
                          {showRegPassword ? (
                            <>
                              <EyeOff className="w-3.5 h-3.5" />
                              <span>Hide</span>
                            </>
                          ) : (
                            <>
                              <Eye className="w-3.5 h-3.5" />
                              <span>Reveal</span>
                            </>
                          )}
                        </button>
                      </div>
                      <div className="relative">
                        <input
                          type={showRegPassword ? "text" : "password"}
                          required
                          value={regPassword}
                          onChange={(e) => setRegPassword(e.target.value)}
                          placeholder="At least 6 characters"
                          className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs focus:outline-none focus:border-purple-600 focus:bg-white pr-10"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Class</label>
                      <select
                        value={regClass}
                        onChange={(e) => setRegClass(e.target.value)}
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold focus:outline-none focus:border-purple-600 focus:bg-white"
                      >
                        {CLASS_OPTIONS.filter(c => c !== 'ALL CLASSES').map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </div>

                    <button
                      type="submit"
                      className="w-full py-3 bg-purple-600 hover:bg-purple-700 text-white font-extrabold text-xs rounded-xl shadow-lg shadow-purple-600/30 transition active:scale-[0.99] flex items-center justify-center gap-2"
                    >
                      <Mail className="w-4 h-4" />
                      <span>Send Verification Code (SBURA THE QUESTION MAN)</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setIsRegistering(false)}
                      className="w-full py-2 text-xs font-bold text-purple-700 hover:underline"
                    >
                      Back to Sign In
                    </button>
                  </form>
                ) : (
                  /* Standard Login Form: No Email needed for non-students! */
                  <form onSubmit={handleLoginSubmit} className="space-y-3.5">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Account Role</label>
                      <select
                        value={role}
                        onChange={(e) => setRole(e.target.value as UserRole)}
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold focus:outline-none focus:border-purple-600 focus:bg-white"
                      >
                        <option value="STUDENT">Student</option>
                        <option value="FACULTY">Faculty</option>
                        <option value="TA">Teaching Assistant (TA)</option>
                        <option value="HEAD">Head of School / School Leadership</option>
                        <option value="CO_FOUNDER">Co-founder / School Leadership</option>
                        <option value="ESTATE">Estate Manager</option>
                        <option value="NON_FACULTY">Non Faculty</option>
                        <option value="IT_MANAGER">IT Manager (Security & Audit Administration)</option>
                      </select>
                    </div>

                    {/* ROLE IS STUDENT: requires email & class */}
                    {role === 'STUDENT' ? (
                      <>
                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <label className="block text-xs font-bold text-slate-700">School Email</label>
                            <span className="text-[10px] font-bold text-purple-700 bg-purple-100 px-1.5 py-0.5 rounded">@usapschool.org domain only</span>
                          </div>
                          <input
                            type="email"
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="student@usapschool.org"
                            className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs focus:outline-none focus:border-purple-600 focus:bg-white"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-slate-700 mb-1">Class</label>
                          <select
                            value={studentClass}
                            onChange={(e) => setStudentClass(e.target.value)}
                            className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold focus:outline-none focus:border-purple-600 focus:bg-white"
                          >
                            {CLASS_OPTIONS.filter(c => c !== 'ALL CLASSES').map(c => <option key={c} value={c}>{c}</option>)}
                          </select>
                        </div>
                      </>
                    ) : (
                      /* ROLE IS NON-STUDENT: NO EMAIL NEEDED! DROPDOWN LIST OF NAMES */
                      <div className="bg-purple-50/70 p-3.5 rounded-2xl border border-purple-200/80 space-y-2">
                        <div className="flex items-center justify-between">
                          <label className="block text-xs font-extrabold text-purple-950">
                            Select Your Name ({role === 'FACULTY' || role === 'TEACHER' ? 'Faculty Member' : role === 'TA' ? 'Teaching Assistant' : role === 'IT_MANAGER' ? 'IT Manager' : 'Staff Member'})
                          </label>
                          <span className="text-[10px] bg-purple-200/70 text-purple-900 font-bold px-2 py-0.5 rounded-full">
                            No Email Needed
                          </span>
                        </div>

                        <select
                          value={selectedStaffName}
                          onChange={(e) => setSelectedStaffName(e.target.value)}
                          className="w-full px-3.5 py-2.5 bg-white border border-purple-300 rounded-xl text-xs font-extrabold text-slate-900 focus:outline-none focus:border-purple-600"
                        >
                          {staffListForCurrentRole.map((staff, idx) => (
                            <option key={`${staff.name}-${idx}`} value={staff.name}>
                              {staff.name} ({staff.area})
                            </option>
                          ))}
                        </select>
                        <p className="text-[11px] text-purple-700 font-medium">
                          Non-students do not require an email address. Select your name above and enter your account password.
                        </p>
                      </div>
                    )}

                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="block text-xs font-bold text-slate-700">Password</label>
                        <button
                          type="button"
                          onClick={() => setShowLoginPassword(!showLoginPassword)}
                          className="text-[11px] font-bold text-purple-700 hover:text-purple-900 flex items-center gap-1 focus:outline-none"
                        >
                          {showLoginPassword ? (
                            <>
                              <EyeOff className="w-3.5 h-3.5" />
                              <span>Hide</span>
                            </>
                          ) : (
                            <>
                              <Eye className="w-3.5 h-3.5" />
                              <span>Reveal</span>
                            </>
                          )}
                        </button>
                      </div>
                      <div className="relative">
                        <input
                          type={showLoginPassword ? "text" : "password"}
                          required
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder="Enter password"
                          className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs focus:outline-none focus:border-purple-600 focus:bg-white pr-10"
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      className="w-full py-3 bg-purple-600 hover:bg-purple-700 text-white font-extrabold text-xs rounded-xl shadow-lg shadow-purple-600/30 transition active:scale-[0.99]"
                    >
                      Sign In to Access School Data
                    </button>

                    {role === 'STUDENT' && (
                      <button
                        type="button"
                        onClick={() => {
                          setIsRegistering(true);
                          setAuthMsg(null);
                        }}
                        className="w-full py-2.5 bg-purple-50 hover:bg-purple-100 text-purple-800 font-extrabold text-xs rounded-xl border border-purple-200 transition"
                      >
                        Create Student Account & Verify Email
                      </button>
                    )}
                  </form>
                )}

                {/* Device sync reminder info */}
                <div className="mt-5 p-3 rounded-2xl bg-purple-50/80 border border-purple-200/60 text-[11px] text-purple-900 flex items-center gap-2">
                  <Laptop className="w-4 h-4 text-purple-600 shrink-0" />
                  <Smartphone className="w-4 h-4 text-purple-600 shrink-0" />
                  <span>
                    Your schedules, test notifications, and meal alerts synchronize live across all your phones, tablets, and computers upon signing in.
                  </span>
                </div>
              </div>
            </div>
          ) : (
            /* Authenticated School Portal (Only visible after Sign In) */
            <div className="space-y-6">
              {/* Navigation Tabs */}
              <div className="flex flex-wrap items-center gap-2 border-b border-purple-100 pb-3">
                <button
                  onClick={() => setActiveTab('tests')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-extrabold transition ${
                    activeTab === 'tests'
                      ? 'bg-purple-600 text-white shadow-md shadow-purple-600/20'
                      : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
                  }`}
                >
                  <BookOpen className="w-4 h-4" />
                  Test Schedule ({tests.length})
                </button>

                <button
                  onClick={() => setActiveTab('rules')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-extrabold transition ${
                    activeTab === 'rules'
                      ? 'bg-purple-600 text-white shadow-md shadow-purple-600/20'
                      : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
                  }`}
                >
                  <BookCheck className="w-4 h-4" />
                  Core Values & Rules
                </button>

                <button
                  onClick={() => setActiveTab('announcements')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-extrabold transition ${
                    activeTab === 'announcements'
                      ? 'bg-purple-600 text-white shadow-md shadow-purple-600/20'
                      : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
                  }`}
                >
                  <Megaphone className="w-4 h-4" />
                  Announcements ({announcements.length})
                </button>

                <button
                  onClick={() => setActiveTab('routine')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-extrabold transition ${
                    activeTab === 'routine'
                      ? 'bg-purple-600 text-white shadow-md shadow-purple-600/20'
                      : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
                  }`}
                >
                  <Clock className="w-4 h-4" />
                  Daily Routine & Meal Times
                </button>

                {/* Office Hours Tab */}
                <button
                  onClick={() => setActiveTab('office_hours')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-extrabold transition ${
                    activeTab === 'office_hours'
                      ? 'bg-purple-600 text-white shadow-md shadow-purple-600/20'
                      : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
                  }`}
                >
                  <GraduationCap className="w-4 h-4 text-amber-500" />
                  <span>Office hours</span>
                </button>

                {/* Window 1: Upcoming Birthdays */}
                <button
                  onClick={() => setActiveTab('birthdays')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-extrabold transition ${
                    activeTab === 'birthdays'
                      ? 'bg-pink-600 text-white shadow-md shadow-pink-600/20'
                      : 'bg-white text-slate-700 hover:bg-pink-50 border border-slate-200'
                  }`}
                >
                  <Cake className="w-4 h-4 text-pink-500" />
                  <span>Upcoming Birthdays</span>
                  {todaysBirthdays.length > 0 && (
                    <span className="text-[10px] bg-amber-400 text-slate-950 font-black px-1.5 py-0.5 rounded-full animate-bounce">
                      Today!
                    </span>
                  )}
                </button>

                {/* Window 2: Weekly Timetable */}
                <button
                  onClick={() => setActiveTab('weekly_timetable')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-extrabold transition ${
                    activeTab === 'weekly_timetable'
                      ? 'bg-teal-600 text-white shadow-md shadow-teal-600/20'
                      : 'bg-white text-slate-700 hover:bg-teal-50 border border-slate-200'
                  }`}
                >
                  <CalendarDays className="w-4 h-4 text-teal-600" />
                  <span>Weekly Timetable</span>
                </button>

                {/* Window 3: (Final AS and A2 / End of term) Timetable */}
                <button
                  onClick={() => setActiveTab('exam_timetable')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-extrabold transition ${
                    activeTab === 'exam_timetable'
                      ? 'bg-purple-700 text-white shadow-md shadow-purple-700/20'
                      : 'bg-white text-slate-700 hover:bg-purple-50 border border-slate-200'
                  }`}
                >
                  <Award className="w-4 h-4 text-purple-600" />
                  <span>AS & A2 Timetable</span>
                </button>

                {/* Window 4: Weekly Duty (Plates) */}
                <button
                  onClick={() => setActiveTab('weekly_duty')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-extrabold transition ${
                    activeTab === 'weekly_duty'
                      ? 'bg-amber-600 text-white shadow-md shadow-amber-600/20'
                      : 'bg-white text-slate-700 hover:bg-amber-50 border border-slate-200'
                  }`}
                >
                  <Utensils className="w-4 h-4 text-amber-600" />
                  <span>Weekly Duty</span>
                </button>

                {/* Window 5: Wednesday Convocation Speaker */}
                <button
                  onClick={() => setActiveTab('convocation')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-extrabold transition ${
                    activeTab === 'convocation'
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
                      : 'bg-white text-slate-700 hover:bg-blue-50 border border-slate-200'
                  }`}
                >
                  <Mic className="w-4 h-4 text-blue-600" />
                  <span>Wednesday Speaker</span>
                </button>

                {/* Window 6: World Celebrations (Global Observances & World Records) */}
                <button
                  onClick={() => setActiveTab('world_celebrations')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-extrabold transition ${
                    activeTab === 'world_celebrations'
                      ? 'bg-blue-700 text-white shadow-md shadow-blue-700/20'
                      : 'bg-white text-slate-700 hover:bg-blue-50 border border-slate-200'
                  }`}
                >
                  <Globe className="w-4 h-4 text-blue-600" />
                  <span>World Celebrations</span>
                </button>

                {(session.role === 'FACULTY' || session.role === 'TEACHER' || session.role === 'TA') && (
                  <button
                    onClick={() => setActiveTab('schedule')}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-extrabold transition ${
                      activeTab === 'schedule'
                        ? 'bg-purple-600 text-white shadow-md shadow-purple-600/20'
                        : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
                    }`}
                  >
                    <PlusCircle className="w-4 h-4" />
                    Schedule Test
                  </button>
                )}

                <button
                  onClick={() => setActiveTab('people')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-extrabold transition ${
                    activeTab === 'people'
                      ? 'bg-purple-600 text-white shadow-md shadow-purple-600/20'
                      : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
                  }`}
                >
                  <Users className="w-4 h-4" />
                  School People
                </button>

                {/* IT MANAGER ONLY TAB: Master Audit Spreadsheet */}
                {session.role === 'IT_MANAGER' && (
                  <button
                    onClick={() => setActiveTab('it_audit')}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black transition border ${
                      activeTab === 'it_audit'
                        ? 'bg-slate-900 text-amber-300 border-slate-900 shadow-md shadow-purple-900/30'
                        : 'bg-gradient-to-r from-purple-900 to-indigo-950 text-white hover:from-purple-800 hover:to-indigo-900 border-purple-800 shadow-xs'
                    }`}
                  >
                    <FileSpreadsheet className="w-4 h-4 text-amber-400" />
                    <span>IT Security Audit & Activity Logs</span>
                    <span className="text-[10px] bg-amber-400 text-slate-950 font-black px-1.5 py-0.5 rounded-full">
                      {auditLogs.length}
                    </span>
                  </button>
                )}
              </div>

              {/* TAB 1: Tests Schedule */}
              {activeTab === 'tests' && (
                <div className="space-y-6">
                  {/* Top Stats Cards */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-white border border-purple-100 p-5 rounded-3xl shadow-sm">
                      <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">
                        Upcoming Tests
                      </span>
                      <div className="text-3xl font-black text-purple-600">{visibleTests.length}</div>
                      <span className="text-[11px] text-slate-500 font-medium">
                        {selectedClassFilter === 'ALL CLASSES' ? 'Across all classes' : `Class ${selectedClassFilter}`}
                      </span>
                    </div>

                    <div className="bg-white border border-purple-100 p-5 rounded-3xl shadow-sm">
                      <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">
                        Active Notices
                      </span>
                      <div className="text-3xl font-black text-amber-500">{announcements.length}</div>
                      <span className="text-[11px] text-slate-500 font-medium">5-day auto-window</span>
                    </div>

                    <div className="bg-white border border-purple-100 p-5 rounded-3xl shadow-sm">
                      <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">
                        Form 6 Classes
                      </span>
                      <div className="text-3xl font-black text-slate-800">4</div>
                      <span className="text-[11px] text-slate-500 font-medium">L6X, L6Y, U6X, U6Y</span>
                    </div>

                    <div className="bg-white border border-purple-100 p-5 rounded-3xl shadow-sm">
                      <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">
                        Test Rooms
                      </span>
                      <div className="text-3xl font-black text-slate-800">5</div>
                      <span className="text-[11px] text-slate-500 font-medium">Library, DH, Music, Labs</span>
                    </div>
                  </div>

                  {/* Official Campus Windows Bar */}
                  <div className="bg-gradient-to-r from-purple-50 via-pink-50 to-teal-50 border border-purple-200/80 rounded-3xl p-4 sm:p-5 shadow-xs">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2 text-xs font-black text-slate-800 tracking-wider uppercase">
                        <Sparkles className="w-4 h-4 text-purple-600" />
                        <span>Official Campus Information Windows</span>
                      </div>
                      <span className="text-[11px] font-bold text-purple-700">
                        Select a window to view
                      </span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5">
                      <button
                        onClick={() => setActiveTab('birthdays')}
                        className="p-3 bg-white/90 hover:bg-white border border-pink-200 rounded-2xl text-left transition shadow-2xs group flex flex-col justify-between"
                      >
                        <div className="flex items-center justify-between mb-1.5">
                          <Cake className="w-4 h-4 text-pink-500 group-hover:scale-110 transition" />
                          {todaysBirthdays.length > 0 && (
                            <span className="text-[9px] bg-pink-500 text-white font-black px-1.5 py-0.5 rounded-full">
                              Today!
                            </span>
                          )}
                        </div>
                        <div className="text-xs font-extrabold text-slate-900 group-hover:text-pink-600">
                          Birthdays (Week of {getWeekOfLabel()})
                        </div>
                        <div className="text-[10px] text-slate-500 truncate mt-0.5">
                          {todaysBirthdays.length > 0
                            ? `Celebrating: ${todaysBirthdays.map((b) => b.name).join(', ')}`
                            : 'Weekly birthday roster'}
                        </div>
                      </button>

                      <button
                        onClick={() => setActiveTab('weekly_timetable')}
                        className="p-3 bg-white/90 hover:bg-white border border-teal-200 rounded-2xl text-left transition shadow-2xs group flex flex-col justify-between"
                      >
                        <CalendarDays className="w-4 h-4 text-teal-600 mb-1.5 group-hover:scale-110 transition" />
                        <div className="text-xs font-extrabold text-slate-900 group-hover:text-teal-700">
                          Weekly Timetable
                        </div>
                        <div className="text-[10px] text-slate-500 truncate mt-0.5">
                          Mon – Fri spreadsheet (Snack & Lunch)
                        </div>
                      </button>

                      <button
                        onClick={() => setActiveTab('exam_timetable')}
                        className="p-3 bg-white/90 hover:bg-white border border-purple-200 rounded-2xl text-left transition shadow-2xs group flex flex-col justify-between"
                      >
                        <Award className="w-4 h-4 text-purple-600 mb-1.5 group-hover:scale-110 transition" />
                        <div className="text-xs font-extrabold text-slate-900 group-hover:text-purple-700">
                          AS & A2 Timetable
                        </div>
                        <div className="text-[10px] text-slate-500 truncate mt-0.5">
                          Watershed & Local venues
                        </div>
                      </button>

                      <button
                        onClick={() => setActiveTab('weekly_duty')}
                        className="p-3 bg-white/90 hover:bg-white border border-amber-200 rounded-2xl text-left transition shadow-2xs group flex flex-col justify-between"
                      >
                        <Utensils className="w-4 h-4 text-amber-600 mb-1.5 group-hover:scale-110 transition" />
                        <div className="text-xs font-extrabold text-slate-900 group-hover:text-amber-700">
                          Weekly Duty
                        </div>
                        <div className="text-[10px] text-slate-500 truncate mt-0.5">
                          Plates duty advisory schedule
                        </div>
                      </button>

                      <button
                        onClick={() => setActiveTab('convocation')}
                        className="p-3 bg-white/90 hover:bg-white border border-blue-200 rounded-2xl text-left transition shadow-2xs group flex flex-col justify-between"
                      >
                        <Mic className="w-4 h-4 text-blue-600 mb-1.5 group-hover:scale-110 transition" />
                        <div className="text-xs font-extrabold text-slate-900 group-hover:text-blue-700">
                          Speaker (Week of {getWeekOfLabel()})
                        </div>
                        <div className="text-[10px] text-slate-500 truncate mt-0.5">
                          Convocation guest speakers
                        </div>
                      </button>
                    </div>
                  </div>

                  {/* Background Execution Active Status Banner */}
                  <div className="bg-gradient-to-r from-purple-900 via-indigo-900 to-purple-950 text-white rounded-3xl p-4 sm:p-5 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-left border border-purple-800">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-purple-800/80 text-emerald-400 flex items-center justify-center shrink-0">
                        <Activity className="w-5 h-5 animate-pulse" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-black text-white">App Background Operation Enabled</h4>
                          <span className="text-[10px] bg-emerald-500 text-slate-950 font-black px-2 py-0.5 rounded-full uppercase tracking-wider">Background Sync</span>
                        </div>
                        <p className="text-xs text-purple-200 mt-0.5 font-medium">
                          Meal notifications (5:50 PM Dinner, 9:00 PM Snack) and exam quiet warnings will ring even if you minimize this tab or lock your phone.
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => setShowPhoneModal(true)}
                      className="px-3.5 py-2 bg-white/10 hover:bg-white/20 border border-purple-400/40 text-purple-100 rounded-xl text-xs font-bold transition shrink-0 self-start sm:self-auto"
                    >
                      Background Settings
                    </button>
                  </div>

                  {/* Class Filter Bar */}
                  <div className="flex flex-wrap items-center gap-2 bg-white p-3 rounded-2xl border border-purple-100 shadow-2xs">
                    <span className="text-xs font-bold text-slate-400 flex items-center gap-1.5 mr-2">
                      <Filter className="w-3.5 h-3.5 text-purple-600" />
                      Filter by Class:
                    </span>
                    {CLASS_OPTIONS.map(c => (
                      <button
                        key={c}
                        onClick={() => setSelectedClassFilter(c)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                          selectedClassFilter === c
                            ? 'bg-purple-600 text-white shadow-xs'
                            : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                        }`}
                      >
                        {c}
                      </button>
                    ))}
                  </div>

                  {/* Today's Tests Banner if any */}
                  {todaysTests.length > 0 && (
                    <div className="bg-purple-50/70 border border-purple-200 rounded-3xl p-5 shadow-xs">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="text-sm font-black text-purple-950 flex items-center gap-2">
                          <Clock className="w-4 h-4 text-purple-600" />
                          Tests Scheduled Today ({new Date().toLocaleDateString([], { weekday: 'long', month: 'short', day: 'numeric' })})
                        </h3>
                        <span className="text-xs font-bold text-purple-700 bg-white px-2.5 py-1 rounded-lg border border-purple-200">
                          {todaysTests.length} test{todaysTests.length > 1 ? 's' : ''}
                        </span>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {todaysTests.map(t => (
                          <div
                            key={t.id}
                            className="p-3.5 rounded-2xl bg-white border border-purple-200 shadow-2xs flex items-center justify-between"
                          >
                            <div>
                              <div className="font-extrabold text-sm text-slate-900">{t.title}</div>
                              <div className="text-xs text-slate-500 mt-0.5 flex items-center gap-2">
                                <span className="font-bold text-purple-700 bg-purple-100 px-2 py-0.5 rounded">
                                  {t.subject}
                                </span>
                                <span>•</span>
                                <span className="font-bold text-slate-700">{t.schoolClass}</span>
                                <span>•</span>
                                <span className="text-slate-600">{t.room}</span>
                              </div>
                            </div>
                            <div className="text-right">
                              <span className="font-mono font-bold text-xs bg-purple-50 border border-purple-200 text-purple-900 px-2.5 py-1 rounded-lg">
                                {t.start} – {t.end}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Scheduled Tests Table */}
                  <div className="bg-white border border-purple-100 rounded-3xl p-6 shadow-sm">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
                      <div>
                        <h3 className="text-lg font-black text-slate-900">Academic Examination Schedule</h3>
                        <p className="text-xs text-slate-500 font-medium">
                          Synchronized in real-time across all school devices
                        </p>
                      </div>

                      {(session.role === 'FACULTY' || session.role === 'TEACHER' || session.role === 'TA') && (
                        <button
                          onClick={() => setActiveTab('schedule')}
                          className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-extrabold text-xs rounded-xl shadow-xs transition"
                        >
                          + Schedule New Test
                        </button>
                      )}
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead>
                          <tr className="border-b border-purple-100 text-slate-400 font-bold uppercase tracking-wider">
                            <th className="pb-3 pr-4">Test Title</th>
                            <th className="pb-3 px-4">Subject</th>
                            <th className="pb-3 px-4">Class</th>
                            <th className="pb-3 px-4">Room</th>
                            <th className="pb-3 px-4">Date & Time</th>
                            <th className="pb-3 pl-4">Supervisor</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-purple-50 font-medium text-slate-700">
                          {visibleTests.map(t => (
                            <tr key={t.id} className="hover:bg-purple-50/40 transition">
                              <td className="py-3.5 pr-4 font-bold text-slate-900">{t.title}</td>
                              <td className="py-3.5 px-4">
                                <span className="bg-purple-100/70 text-purple-800 font-bold px-2 py-0.5 rounded">
                                  {t.subject}
                                </span>
                              </td>
                              <td className="py-3.5 px-4 font-semibold">{t.schoolClass}</td>
                              <td className="py-3.5 px-4 text-slate-600">{t.room}</td>
                              <td className="py-3.5 px-4 font-mono">
                                {t.date} ({t.start}–{t.end})
                              </td>
                              <td className="py-3.5 pl-4 text-slate-500">{t.createdBy || "—"}</td>
                            </tr>
                          ))}
                          {visibleTests.length === 0 && (
                            <tr>
                              <td colSpan={6} className="text-center py-12 text-slate-400 font-medium">
                                No scheduled tests found.
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB: School Rules & Policies */}
              {activeTab === 'rules' && (
                <SchoolRulesDashboard />
              )}

              {/* TAB 2: Announcements */}
              {activeTab === 'announcements' && (
                <div className="space-y-6">
                  {/* IT MANAGER EXCLUSIVE: Computed Viewership Sheet Card */}
                  {session.role === 'IT_MANAGER' && (
                    <div className="bg-gradient-to-r from-purple-950 via-indigo-900 to-slate-900 text-white rounded-3xl p-5 shadow-lg border border-purple-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center text-emerald-400 shrink-0 border border-white/10 shadow-inner">
                          <FileSpreadsheet className="w-6 h-6" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="font-black text-base tracking-tight">Announcement Readership & Viewership Sheet</h4>
                            <span className="bg-emerald-500/20 text-emerald-300 text-[10px] font-black px-2.5 py-0.5 rounded-full border border-emerald-400/30 uppercase tracking-wider">
                              IT Manager Exclusive
                            </span>
                          </div>
                          <p className="text-xs text-purple-200/90 mt-1 font-medium">
                            Computed accounts who saw announcements: <span className="text-emerald-300 font-mono text-sm font-black bg-white/10 px-2 py-0.5 rounded-lg ml-1">{uniqueAccountsCount} accounts</span>
                          </p>
                        </div>
                      </div>

                      <button
                        onClick={() => setShowAnnouncementViewershipSheet(true)}
                        className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs rounded-xl shadow-md transition flex items-center justify-center gap-2 shrink-0 active:scale-95"
                      >
                        <FileSpreadsheet className="w-4 h-4" />
                        <span>Open Full Viewership Sheet</span>
                      </button>
                    </div>
                  )}

                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Post New Announcement (Open to Students, Teachers, and Faculty) */}
                  <div className="bg-white border border-purple-100 rounded-3xl p-6 shadow-sm h-fit">
                    <h3 className="text-lg font-black text-slate-900 mb-1">Post Announcement</h3>
                    <p className="text-xs text-slate-500 mb-3 font-medium">
                      Broadcasts online to all students and faculty across all devices for 5 days.
                    </p>
                    <div className="text-[11px] font-bold text-purple-950 flex items-center justify-between bg-purple-50/80 px-3 py-2 rounded-xl border border-purple-100 mb-3">
                      <span>Posting as: <strong className="text-purple-700">{session.name}</strong></span>
                      <span className="text-[10px] bg-white px-2 py-0.5 rounded-full border border-purple-200 font-extrabold text-purple-900">
                        {session.role === 'STUDENT' ? `Student (${session.schoolClass || 'General'})` : session.role}
                      </span>
                    </div>
                    <form onSubmit={handlePostAnnouncement} className="space-y-3">
                      {announcementError && (
                        <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-start gap-2">
                          <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                          <div className="font-semibold leading-relaxed">{announcementError}</div>
                        </div>
                      )}

                      {announcementSuccess && (
                        <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                          <div className="font-bold">{announcementSuccess}</div>
                        </div>
                      )}

                      <textarea
                        rows={3}
                        value={newAnnouncementText}
                        onChange={(e) => setNewAnnouncementText(e.target.value)}
                        placeholder={session.role === 'STUDENT' ? "Share a study group, club meeting, or student notice..." : "Write announcement description (optional if recording audio)..."}
                        className="w-full p-3 bg-slate-50 border border-slate-300 rounded-2xl text-xs focus:outline-none focus:border-purple-600 focus:bg-white resize-none"
                      />

                      {/* PICTURE INSERTION FOR ANNOUNCEMENTS (Open to all accounts) */}
                      <div className="space-y-2">
                        {isOptimizingImage && (
                          <div className="p-3 bg-purple-50 border border-purple-200 rounded-2xl flex items-center gap-2.5 text-xs font-bold text-purple-900 animate-pulse">
                            <Loader2 className="w-4 h-4 text-purple-600 animate-spin shrink-0" />
                            <span>Compressing & optimizing picture for online sync...</span>
                          </div>
                        )}

                        {announcementImageBase64 ? (
                          <div className="p-3 bg-purple-50/90 border border-purple-200 rounded-2xl space-y-2">
                            <div className="flex items-center justify-between text-xs font-bold text-purple-950">
                              <span className="flex items-center gap-1.5">
                                <ImageIcon className="w-3.5 h-3.5 text-purple-600" />
                                <span>Picture Attached</span>
                                {optimizedImageInfo && (
                                  <span className="text-[10px] text-purple-700 bg-purple-100 font-mono px-2 py-0.5 rounded-full border border-purple-200">
                                    {optimizedImageInfo.optimizedKB} KB
                                  </span>
                                )}
                              </span>
                              <button
                                type="button"
                                onClick={handleDiscardPicture}
                                className="text-rose-600 hover:text-rose-800 text-[11px] font-bold flex items-center gap-1"
                              >
                                <Trash2 className="w-3 h-3" />
                                <span>Remove Picture</span>
                              </button>
                            </div>
                            <div className="relative rounded-xl overflow-hidden max-h-48 border border-purple-200">
                              <img
                                src={announcementImageBase64}
                                alt="Announcement upload preview"
                                className="w-full object-cover max-h-48"
                              />
                            </div>
                            <input
                              type="text"
                              value={announcementImageCaption}
                              onChange={(e) => setAnnouncementImageCaption(e.target.value)}
                              placeholder="Optional picture caption..."
                              className="w-full px-3 py-1.5 bg-white border border-purple-200 rounded-xl text-xs focus:outline-none focus:border-purple-600"
                            />
                          </div>
                        ) : !isOptimizingImage && (
                          <div className="flex items-center justify-between bg-purple-50/50 p-2.5 rounded-xl border border-purple-100">
                            <div className="flex flex-col">
                              <div className="text-[11px] text-purple-950 font-bold flex items-center gap-1.5">
                                <ImageIcon className="w-3.5 h-3.5 text-purple-600" />
                                <span>Attach Picture</span>
                              </div>
                              <span className="text-[10px] text-slate-500 font-medium ml-5">Limit: 5MB max</span>
                            </div>
                            <label className="cursor-pointer px-3 py-1.5 bg-white hover:bg-purple-50 text-purple-700 font-extrabold text-xs rounded-xl border border-purple-200 transition flex items-center gap-1.5 shadow-2xs">
                              <ImageIcon className="w-3 h-3" />
                              <span>Select Picture</span>
                              <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/*"
                                onChange={handlePictureSelect}
                                className="hidden"
                              />
                            </label>
                          </div>
                        )}
                      </div>

                      {/* VOICE COMMUNICATION: Exclusively for Non-Students (Faculty/Staff) */}
                      {session.role !== 'STUDENT' ? (
                        <div className="space-y-2">
                          {isRecordingAudio ? (
                            <div className="p-3 bg-rose-50 border border-rose-200 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                              <div className="flex items-center gap-2">
                                <span className="relative flex h-3 w-3">
                                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                                  <span className="relative inline-flex rounded-full h-3 w-3 bg-rose-600"></span>
                                </span>
                                <div className="text-xs font-bold text-rose-950 flex items-center gap-1.5 flex-wrap">
                                  <span>Recording Voice Clip:</span>
                                  <span className="font-mono font-extrabold text-rose-700 bg-white px-1.5 py-0.5 rounded border border-rose-200">
                                    {Math.floor(recordingSeconds / 60)}:{String(recordingSeconds % 60).padStart(2, '0')}
                                  </span>
                                  <span className="text-[10px] text-slate-500 font-semibold">/ 1:30 (Max 90s)</span>
                                  {recordingSeconds >= 75 && (
                                    <span className="px-2 py-0.5 rounded-full bg-amber-500 text-white text-[10px] font-black animate-pulse">
                                      {90 - recordingSeconds}s remaining
                                    </span>
                                  )}
                                </div>
                              </div>
                              <div className="flex items-center gap-1.5 ml-auto">
                                <button
                                  type="button"
                                  onClick={handleDiscardAudio}
                                  className="px-2.5 py-1 text-slate-500 hover:text-slate-700 text-xs font-bold"
                                >
                                  Cancel
                                </button>
                                <button
                                  type="button"
                                  onClick={handleStopRecording}
                                  className="px-3 py-1 bg-rose-600 hover:bg-rose-700 text-white font-black text-xs rounded-xl shadow-xs flex items-center gap-1 transition"
                                >
                                  <Square className="w-3 h-3 fill-white" />
                                  <span>Done</span>
                                </button>
                              </div>
                            </div>
                          ) : audioPreviewUrl ? (
                            <div className="p-3 bg-purple-50/90 border border-purple-200 rounded-2xl space-y-2">
                              <div className="flex items-center justify-between text-xs font-bold text-purple-950">
                                <span className="flex items-center gap-1.5">
                                  <Mic className="w-3.5 h-3.5 text-purple-600" />
                                  <span>Voice Clip Attached ({recordingSeconds}s / Max 90s)</span>
                                </span>
                                <button
                                  type="button"
                                  onClick={handleDiscardAudio}
                                  className="text-rose-600 hover:text-rose-800 text-[11px] font-bold flex items-center gap-1"
                                >
                                  <Trash2 className="w-3 h-3" />
                                  <span>Discard</span>
                                </button>
                              </div>
                              <audio controls src={audioPreviewUrl} className="w-full h-8 rounded-lg" />
                            </div>
                          ) : (
                            <div className="flex items-center justify-between bg-purple-50/70 p-2.5 rounded-xl border border-purple-100">
                              <div className="flex flex-col">
                                <div className="text-[11px] text-purple-950 font-bold flex items-center gap-1.5">
                                  <Mic className="w-3.5 h-3.5 text-purple-600" />
                                  <span>Voice Communication</span>
                                </div>
                                <span className="text-[10px] text-purple-700 font-medium ml-5">Limit: 90 seconds (1m 30s)</span>
                              </div>
                              <button
                                type="button"
                                onClick={handleStartRecording}
                                className="px-3 py-1.5 bg-purple-100 hover:bg-purple-200 text-purple-800 font-extrabold text-xs rounded-xl border border-purple-300 transition flex items-center gap-1.5"
                              >
                                <Mic className="w-3 h-3 text-purple-700" />
                                <span>Record Voice Clip</span>
                              </button>
                            </div>
                          )}

                          {audioWarning && (
                            <div className="p-2.5 bg-amber-50 border border-amber-300 text-[11px] text-amber-900 rounded-xl font-semibold flex items-center gap-2 animate-in fade-in">
                              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                              <span>{audioWarning}</span>
                            </div>
                          )}

                          {audioError && (
                            <div className="p-2.5 bg-rose-50 border border-rose-200 text-[11px] text-rose-800 rounded-xl font-medium flex items-center gap-1.5">
                              <AlertTriangle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                              <span>{audioError}</span>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-[11px] text-slate-500 flex items-center gap-2">
                          <MicOff className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span>Voice announcements are reserved for faculty & staff. Students post text and photo announcements.</span>
                        </div>
                      )}

                      <button
                        type="submit"
                        disabled={isPostingAnnouncement || isOptimizingImage || (!newAnnouncementText.trim() && !audioBase64 && !announcementImageBase64)}
                        className="w-full py-2.5 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white font-extrabold text-xs rounded-xl shadow-md shadow-purple-600/20 transition flex items-center justify-center gap-1.5"
                      >
                        {isPostingAnnouncement ? (
                          <>
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            <span>Publishing to Campus Board...</span>
                          </>
                        ) : isOptimizingImage ? (
                          <>
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            <span>Optimizing Picture...</span>
                          </>
                        ) : (
                          <>
                            <Megaphone className="w-3.5 h-3.5" />
                            <span>Publish Announcement (5 Days)</span>
                          </>
                        )}
                      </button>
                    </form>
                  </div>

                  {/* Announcement List */}
                  <div className="lg:col-span-2 space-y-3">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-lg font-black text-slate-900">Active Online Announcements</h3>
                      <span className="text-xs font-semibold text-slate-400">
                        {announcements.length} active notices
                      </span>
                    </div>

                    {announcements.map(a => (
                      <div
                        key={a.id}
                        className="bg-white border border-purple-100 rounded-3xl p-5 shadow-sm space-y-3 border-l-4 border-l-purple-600"
                      >
                        <div className="flex items-center justify-between text-[11px] text-slate-400 font-medium">
                          <div className="flex items-center gap-2">
                            <strong className="text-slate-900">{a.authorName}</strong>
                            <span className={`font-bold px-2 py-0.5 rounded ${
                              a.authorRole?.startsWith('Student')
                                ? 'bg-amber-50 text-amber-800 border border-amber-200'
                                : 'bg-purple-50 text-purple-700'
                            }`}>
                              {a.authorRole}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span>{new Date(a.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                            {session?.role === 'IT_MANAGER' && (
                              <button
                                type="button"
                                onClick={() => setShowAnnouncementViewershipSheet(true)}
                                className="flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 text-[10px] font-extrabold transition shadow-2xs"
                                title="Open sheet of accounts who saw this announcement"
                              >
                                <Eye className="w-3 h-3 text-purple-600" />
                                <span>{viewsByAnnouncement[String(a.id)]?.count || 0} saw</span>
                              </button>
                            )}
                            {(session?.role === 'IT_MANAGER' || session?.role === 'HEAD' || session?.role === 'CO_FOUNDER' || (session && a.authorUid === (auth.currentUser?.uid || session?.userId))) && (
                              <button
                                type="button"
                                onClick={() => handleDeleteAnnouncement(a.id, a.authorUid)}
                                className="text-slate-400 hover:text-rose-600 p-1 rounded-lg transition"
                                title="Delete announcement"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </div>
                        <p className="text-xs text-slate-700 leading-relaxed font-medium">
                          {a.body}
                        </p>

                        {/* Attached Announcement Picture */}
                        {a.imageUrl && (
                          <div className="mt-3 rounded-2xl overflow-hidden border border-purple-100 bg-slate-50">
                            <img
                              src={a.imageUrl}
                              alt={a.imageCaption || "Announcement photo"}
                              className="w-full max-h-80 object-contain bg-slate-950/5"
                            />
                            {a.imageCaption && (
                              <div className="p-2 text-[11px] font-semibold text-purple-900 bg-purple-50/70 border-t border-purple-100">
                                📷 {a.imageCaption}
                              </div>
                            )}
                          </div>
                        )}

                        {/* Voice Communication Player (Recorded by Faculty/Staff) */}
                        {a.audioUrl && (
                          <div className="mt-3 p-3 bg-purple-50/90 rounded-2xl border border-purple-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                            <div className="flex items-center gap-2.5">
                              <div className="w-8 h-8 rounded-xl bg-purple-700 text-white flex items-center justify-center shrink-0 shadow-xs">
                                <Mic className="w-4 h-4" />
                              </div>
                              <div>
                                <div className="text-xs font-bold text-purple-950 flex items-center gap-1.5">
                                  <span>Voice Communication</span>
                                  {a.audioDuration ? (
                                    <span className="text-[10px] font-mono font-bold bg-white text-purple-700 px-1.5 py-0.5 rounded border border-purple-200">
                                      {Math.floor(a.audioDuration / 60)}:{String(a.audioDuration % 60).padStart(2, '0')}
                                    </span>
                                  ) : null}
                                </div>
                                <div className="text-[10px] text-purple-700 font-medium">
                                  Official faculty audio broadcast from {a.authorName}
                                </div>
                              </div>
                            </div>
                            <audio controls src={a.audioUrl} className="h-8 max-w-full sm:max-w-[240px] shrink-0 rounded-lg" />
                          </div>
                        )}
                      </div>
                    ))}

                    {announcements.length === 0 && (
                      <div className="bg-white border border-purple-100 rounded-3xl p-12 text-center text-slate-400">
                        No active announcements found.
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

              {/* TAB 3: Daily Routine & Meal Times */}
              {activeTab === 'routine' && (
                <div className="space-y-6">
                  <div className="bg-white border border-purple-100 rounded-3xl p-6 shadow-sm">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
                      <div>
                        <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
                          <Clock className="w-5 h-5 text-purple-600" />
                          Daily School Routine & Meal Schedule
                        </h2>
                        <p className="text-xs text-slate-500 font-medium mt-1">
                          Important: Meal times are school daily routines, not tests. The system sends automatic notifications to your phone.
                        </p>
                      </div>

                      <button
                        onClick={() => setShowPhoneModal(true)}
                        className="px-3.5 py-2 bg-purple-600 hover:bg-purple-700 text-white font-extrabold text-xs rounded-xl shadow-xs transition flex items-center gap-1.5 self-start sm:self-auto"
                      >
                        <Smartphone className="w-3.5 h-3.5" />
                        <span>Manage Phone Permissions</span>
                      </button>
                    </div>

                    {/* Routine Items List */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-5">
                      {DAILY_ROUTINE_SCHEDULE.map((item, idx) => (
                        <div
                          key={idx}
                          className={`p-4 rounded-2xl border flex items-start justify-between gap-3 ${
                            item.type === 'meal'
                              ? 'bg-amber-50/50 border-amber-200'
                              : item.type === 'notification'
                              ? 'bg-purple-50/70 border-purple-200'
                              : item.type === 'prep'
                              ? 'bg-indigo-50/50 border-indigo-200'
                              : 'bg-slate-50 border-slate-200'
                          }`}
                        >
                          <div className="flex items-start gap-3">
                            <div className="mt-0.5">
                              {item.type === 'meal' ? (
                                <Utensils className="w-4 h-4 text-amber-600" />
                              ) : item.type === 'notification' ? (
                                <Bell className="w-4 h-4 text-purple-600" />
                              ) : item.type === 'prep' ? (
                                <Moon className="w-4 h-4 text-indigo-600" />
                              ) : (
                                <BookOpen className="w-4 h-4 text-slate-600" />
                              )}
                            </div>
                            <div>
                              <div className="font-extrabold text-xs sm:text-sm text-slate-900">{item.title}</div>
                              <div className="text-[11px] text-slate-500 mt-0.5">{item.location}</div>
                            </div>
                          </div>

                          <span className="font-mono text-xs font-bold px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-slate-700 shrink-0">
                            {item.time}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 4: Schedule Test (Authorized Faculty & TAs Only) */}
              {activeTab === 'schedule' && (session.role === 'FACULTY' || session.role === 'TEACHER' || session.role === 'TA') && (
                <div className="max-w-2xl mx-auto bg-white border border-purple-100 rounded-3xl p-6 sm:p-8 shadow-sm">
                  <div className="mb-6">
                    <h2 className="text-xl font-black text-slate-900">Schedule an Academic Test / Exam</h2>
                    <p className="text-xs text-slate-500 font-medium mt-1">
                      Note: Only Faculty members and Teaching Assistants are authorized to schedule tests. Meal times are not tests.
                    </p>
                  </div>

                  {scheduleMsg && (
                    <div
                      className={`p-4 rounded-2xl text-xs font-semibold mb-6 flex items-start gap-2.5 ${
                        scheduleMsg.type === 'ok'
                          ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                          : 'bg-rose-50 text-rose-800 border border-rose-200'
                      }`}
                    >
                      {scheduleMsg.type === 'ok' ? (
                        <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-600" />
                      ) : (
                        <AlertTriangle className="w-5 h-5 shrink-0 text-rose-600" />
                      )}
                      <span className="leading-relaxed">{scheduleMsg.text}</span>
                    </div>
                  )}

                  <form onSubmit={handleScheduleTest} className="space-y-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Test Title</label>
                      <input
                        type="text"
                        required
                        value={scheduleTitle}
                        onChange={(e) => setScheduleTitle(e.target.value)}
                        placeholder="e.g. Organic Chemistry & Hydrocarbons Assessment"
                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium focus:outline-none focus:border-purple-600 focus:bg-white"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">Academic Subject</label>
                        <select
                          value={scheduleSubject}
                          onChange={(e) => setScheduleSubject(e.target.value)}
                          className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold focus:outline-none focus:border-purple-600 focus:bg-white"
                        >
                          {SUBJECTS.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">Class</label>
                        <select
                          value={scheduleClass}
                          onChange={(e) => setScheduleClass(e.target.value)}
                          className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold focus:outline-none focus:border-purple-600 focus:bg-white"
                        >
                          {CLASS_OPTIONS.filter(c => c !== 'ALL CLASSES').map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Room</label>
                      <select
                        value={scheduleRoom}
                        onChange={(e) => setScheduleRoom(e.target.value)}
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold focus:outline-none focus:border-purple-600 focus:bg-white"
                      >
                        {ROOMS.map(r => <option key={r} value={r}>{r}</option>)}
                      </select>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">Date</label>
                        <input
                          type="date"
                          required
                          min={getTodayDateString()}
                          value={scheduleDate}
                          onChange={(e) => setScheduleDate(e.target.value)}
                          className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium focus:outline-none focus:border-purple-600 focus:bg-white"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">Start Time</label>
                        <input
                          type="time"
                          required
                          value={scheduleStart}
                          onChange={(e) => setScheduleStart(e.target.value)}
                          className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium focus:outline-none focus:border-purple-600 focus:bg-white"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">End Time</label>
                        <input
                          type="time"
                          required
                          value={scheduleEnd}
                          onChange={(e) => setScheduleEnd(e.target.value)}
                          className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium focus:outline-none focus:border-purple-600 focus:bg-white"
                        />
                      </div>
                    </div>

                    <div className="p-3 bg-purple-50 rounded-xl border border-purple-200 text-[11px] text-purple-900 space-y-1">
                      <p className="font-bold">Automated School Validations:</p>
                      <p>• Only future times accepted (past time scheduling blocked).</p>
                      <p>• Saturday tests allow <strong>Biology, Physics, Mathematics, and Chemistry</strong>.</p>
                      <p>• Sunday tests strictly allow Mathematics & Chemistry.</p>
                      <p>• Tests cannot overlap with Snack Break (9:45-10:00) or Lunch (1:00-2:00).</p>
                    </div>

                    {/* Live Warning Alerts: Students Occupied or Existing Test Conflict */}
                    {scheduleDate && scheduleStart && scheduleEnd && (
                      <div className="space-y-2 pt-1">
                        {liveScheduleConflicts.length > 0 ? (
                          <div className="p-4 rounded-2xl bg-rose-50 border-2 border-rose-300 text-xs shadow-xs space-y-2.5 animate-in fade-in">
                            <div className="flex items-center gap-2 font-black text-rose-950 uppercase tracking-wider text-[11px]">
                              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                              <span>⚠️ Scheduling Warning: Students Occupied / Conflicting Schedule ({liveScheduleConflicts.length} Alert{liveScheduleConflicts.length === 1 ? '' : 's'})</span>
                            </div>

                            <div className="space-y-2 pl-6">
                              {liveScheduleConflicts.map((c, idx) => (
                                <div key={idx} className="text-xs text-rose-900 leading-relaxed">
                                  <div className="font-extrabold text-rose-950">• {c.title}</div>
                                  <p className="text-[11px] text-rose-800 font-medium mt-0.5">{c.message}</p>
                                  {c.conflictingEntity && (
                                    <div className="mt-1.5 p-2 rounded-xl bg-white border border-rose-200 text-[10px] text-slate-700 font-mono space-y-0.5 shadow-2xs">
                                      <div>⏰ Scheduled Time: <strong>{c.conflictingEntity.time}</strong></div>
                                      {c.conflictingEntity.title && <div>📝 Event: <strong>{c.conflictingEntity.title}</strong> ({c.conflictingEntity.subject || 'General'})</div>}
                                      {c.conflictingEntity.class && <div>🎓 Affected Class: <strong>{c.conflictingEntity.class}</strong></div>}
                                      {c.conflictingEntity.room && <div>📍 Location / Room: <strong>{c.conflictingEntity.room}</strong></div>}
                                      {c.conflictingEntity.teacher && <div>👤 Organized By: <strong>{c.conflictingEntity.teacher}</strong></div>}
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>

                            <p className="text-[10px] text-rose-700 font-bold pl-6 pt-1 border-t border-rose-200">
                              Students cannot be scheduled for a test while occupied or taking another test. Please adjust date or time before proceeding.
                            </p>
                          </div>
                        ) : (
                          <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-300 text-xs text-emerald-950 font-bold flex items-center gap-2.5 shadow-2xs">
                            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                            <span>
                              ✓ Schedule Clear: Students in <strong>{scheduleClass}</strong> are free with no existing tests or occupied routine conflicts at this time. Room <strong>{scheduleRoom}</strong> is available.
                            </span>
                          </div>
                        )}
                      </div>
                    )}

                    <button
                      type="submit"
                      disabled={liveScheduleConflicts.length > 0}
                      className={`w-full py-3 text-white font-extrabold text-xs rounded-xl shadow-lg transition active:scale-[0.99] mt-4 flex items-center justify-center gap-2 ${
                        liveScheduleConflicts.length > 0
                          ? 'bg-slate-400 cursor-not-allowed shadow-none'
                          : 'bg-purple-600 hover:bg-purple-700 shadow-purple-600/30'
                      }`}
                    >
                      {liveScheduleConflicts.length > 0 ? (
                        <>
                          <AlertTriangle className="w-4 h-4" />
                          <span>Resolve Scheduling Warnings Above to Save</span>
                        </>
                      ) : (
                        <span>Save Online & Broadcast to All Devices</span>
                      )}
                    </button>
                  </form>
                </div>
              )}

              {/* Notice for non-faculty and non-TAs attempting to access test scheduling */}
              {activeTab === 'schedule' && session.role !== 'FACULTY' && session.role !== 'TEACHER' && session.role !== 'TA' && (
                <div className="max-w-md mx-auto bg-white border border-rose-200 rounded-3xl p-8 text-center shadow-sm">
                  <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto mb-3">
                    <ShieldCheck className="w-6 h-6" />
                  </div>
                  <h3 className="text-base font-black text-slate-900 mb-1">Restricted Permission</h3>
                  <p className="text-xs text-slate-500 font-medium leading-relaxed">
                    Only verified academic Faculty members and Teaching Assistants (TAs) have test scheduling authorization.
                  </p>
                </div>
              )}

              {/* TAB 5: School People Directory */}
              {activeTab === 'people' && (
                <div className="bg-white border border-purple-100 rounded-3xl p-6 shadow-sm">
                  <div className="mb-6">
                    <h2 className="text-xl font-black text-slate-900">Faculty & Staff Directory</h2>
                    <p className="text-xs text-slate-500 font-medium mt-0.5">
                      USAP Community School academic faculty, teaching assistants, and school leadership
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {FACULTY_DIRECTORY.map((member, i) => (
                      <div
                        key={i}
                        className="p-4 rounded-2xl bg-slate-50/70 border border-slate-200 flex items-center justify-between"
                      >
                        <div>
                          <div className="font-bold text-sm text-slate-900">{member.name}</div>
                          <div className="text-xs text-slate-500 mt-0.5">{member.area}</div>
                        </div>
                        <span className="text-[11px] font-bold px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-purple-700 shadow-2xs">
                          {member.role === 'HEAD' ? 'Leadership' : member.role === 'CO_FOUNDER' ? 'Co-founder' : member.role === 'FACULTY' || member.role === 'TEACHER' ? 'Faculty' : member.role}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* TAB 6: IT Manager Master Audit Spreadsheet (Confidential to IT Manager) */}
              {activeTab === 'it_audit' && session.role === 'IT_MANAGER' && (
                <ITManagerAuditView
                  logs={auditLogs}
                  studentAccounts={registeredStudents}
                  onOpenViewershipSheet={() => setShowAnnouncementViewershipSheet(true)}
                  onOpenPasswordLogSheet={() => setShowPasswordLogSheetModal(true)}
                  uniqueAccountsSawAnnouncements={uniqueAccountsCount}
                />
              )}

              {/* TAB: World Celebrations (Global Observances & Records) */}
              {activeTab === 'world_celebrations' && (
                <WorldCelebrationsWindow />
              )}

              {/* TAB: Office Hours */}
              {activeTab === 'office_hours' && (
                <OfficeHoursSection
                  session={session}
                  subjects={SUBJECTS}
                  facultyDirectory={FACULTY_DIRECTORY}
                />
              )}

              {/* TAB: Upcoming Birthdays */}
              {activeTab === 'birthdays' && (
                <BirthdaysWindow
                  sessionRole={session.role}
                  sessionUserName={session.name}
                />
              )}

              {/* TAB: Weekly Timetable (Monday to Friday Spreadsheet) */}
              {activeTab === 'weekly_timetable' && (
                <WeeklyTimetableWindow
                  sessionRole={session.role}
                  sessionUserName={session.name}
                />
              )}

              {/* TAB: (Final AS and A2 / End of term) Timetable */}
              {activeTab === 'exam_timetable' && (
                <ExamTimetableWindow
                  sessionRole={session.role}
                  sessionUserName={session.name}
                />
              )}

              {/* TAB: Weekly Duty (Plates Duty) */}
              {activeTab === 'weekly_duty' && (
                <WeeklyDutyWindow
                  sessionRole={session.role}
                  sessionUserName={session.name}
                />
              )}

              {/* TAB: Wednesday Convocation Speaker */}
              {activeTab === 'convocation' && (
                <WednesdaySpeakerWindow
                  sessionRole={session.role}
                  sessionUserName={session.name}
                />
              )}
            </div>
          )}
        </main>
      </div>

      {/* Birthday Alert Notification Pop-up (Triggered on site visit on birthday date) */}
      {showBirthdayPopup && todaysBirthdays.length > 0 && (
        <BirthdayPopupNotification
          todaysBirthdays={todaysBirthdays}
          onClose={() => {
            const today = getTodayDateString();
            try {
              sessionStorage.setItem(`usap_birthday_popup_seen_${today}`, 'true');
            } catch {}
            setShowBirthdayPopup(false);
          }}
        />
      )}

      {/* Announcement Viewership Sheet Modal (Exclusively for IT Manager) */}
      <AnnouncementViewershipSheetModal
        isOpen={showAnnouncementViewershipSheet}
        onClose={() => setShowAnnouncementViewershipSheet(false)}
        session={session}
      />

      {/* Master Accounts & Passwords Log Sheet Modal (Exclusively for IT Manager with 1970p passkey) */}
      <ITManagerPasswordLogSheetModal
        isOpen={showPasswordLogSheetModal}
        onClose={() => setShowPasswordLogSheetModal(false)}
        isItManager={session?.role === 'IT_MANAGER'}
        studentAccounts={registeredStudents}
        facultyDirectory={FACULTY_DIRECTORY}
        initialStaffPasswords={STAFF_INITIAL_PASSWORDS}
        onLogAudit={(action, status, email, name, role, details) => {
          writeAuditLog(action, status, email, name, role, undefined, undefined, details);
        }}
      />

      {/* Active 15-Second Ringing Floating Banner */}
      <ActiveRingingBanner />

      {/* Device Ringtones & 15s Alarm Sound Selector Modal */}
      <DeviceSoundSelectorModal
        isOpen={showDeviceSoundModal}
        onClose={() => setShowDeviceSoundModal(false)}
        session={session}
      />

      {/* Phone Permissions & Time Sync Modal */}
      <PhonePermissionModal
        isOpen={showPhoneModal}
        onClose={() => setShowPhoneModal(false)}
        onPermissionsGranted={() => setPhoneNotificationPermission('granted')}
        onOpenSoundSelector={() => setShowDeviceSoundModal(true)}
      />

      {/* Real-Time Exam & Daily Schedule Reminder Modal */}
      {activeAlert && (
        <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 text-center shadow-2xl border-2 border-purple-300 animate-in fade-in zoom-in-95">
            <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-purple-600 to-indigo-600 text-white flex items-center justify-center mx-auto mb-3 shadow-lg shadow-purple-600/30">
              {activeAlert.severity === 'daily' ? (
                <Clock className="w-8 h-8 animate-bounce" />
              ) : (
                <Bell className="w-8 h-8 animate-bounce" />
              )}
            </div>

            <h3 className="text-xl font-black text-slate-900 mb-1">
              {activeAlert.title}
            </h3>

            {activeAlert.countdown && (
              <div className="text-5xl font-black text-purple-600 font-mono tracking-tight my-3 animate-pulse">
                {activeAlert.countdown}
              </div>
            )}

            <div className="bg-purple-50 p-4 rounded-2xl border border-purple-200 my-4 text-left">
              <p className="text-xs text-purple-950 leading-relaxed font-semibold">
                {activeAlert.body}
              </p>
              {activeAlert.severity !== 'daily' && (
                <div className="mt-2 pt-2 border-t border-purple-200 text-[11px] text-purple-700 font-bold flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 shrink-0 text-purple-600" />
                  <span>Protocol: Please keep noise to an absolute minimum across campus.</span>
                </div>
              )}
            </div>

            <button
              onClick={() => {
                stopAllAlarms();
                setActiveAlarmKind(null);
                setActiveAlert(null);
              }}
              className="w-full py-3 bg-purple-600 hover:bg-purple-700 text-white font-black text-xs rounded-xl shadow-lg shadow-purple-600/30 transition"
            >
              Acknowledge & Continue
            </button>
          </div>
        </div>
      )}

      {/* Student Email Verification Modal (Dispatched by SBURA THE QUESTION MAN) */}
      {pendingVerification && (
        <StudentVerificationModal
          email={pendingVerification.email}
          studentName={pendingVerification.name}
          studentClass={pendingVerification.studentClass}
          initialCode={pendingVerification.code}
          onVerified={handleVerificationComplete}
          onCancel={() => setPendingVerification(null)}
        />
      )}

      {/* SBURA THE QUESTION MAN First-Time Login Animation (10 Seconds) */}
      {showSburaIntro && (
        <SburaIntroAnimation
          userName={session?.name || 'USAP Member'}
          userRole={session?.role || 'STUDENT'}
          onComplete={() => {
            setShowSburaIntro(false);
          }}
        />
      )}

      {/* Footer Exactly as Assigned */}
      <footer className="w-full text-center text-slate-600 font-bold text-xs py-6 px-4 bg-white/60 border-t border-purple-100 mt-12">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-center gap-2">
          <span>sburathequestionman.co.za in partnership with pineapplemieh🍍.co.zw</span>
        </div>
      </footer>
    </div>
  );
}
