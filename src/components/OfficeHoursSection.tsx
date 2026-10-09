import React, { useState, useEffect } from 'react';
import {
  Calendar,
  Clock,
  User,
  Users,
  PlusCircle,
  CheckCircle2,
  AlertTriangle,
  FileSpreadsheet,
  Trash2,
  X,
  Printer,
  ChevronDown,
  Filter,
  GraduationCap,
  Sparkles,
  Info,
  ShieldCheck,
  Building,
  Check,
  FlaskConical
} from 'lucide-react';
import {
  collection,
  onSnapshot,
  doc,
  setDoc,
  deleteDoc,
  updateDoc,
  query
} from 'firebase/firestore';
import { db } from '../firebase';
import {
  OFFICE_HOURS_CLASSES,
  OFFICE_HOURS_SLOT_MINUTES,
  OfficeHoursClass,
  OfficeHoursSlotDuration,
  OfficeHourSession,
  OfficeHourSlot,
  RegisteredStudent,
  getMaxSlotCapacity,
  getSlotRegisteredStudents,
  isSlotTimePassed,
  isOfficeHourSessionPassed,
  validateOfficeHoursTime,
  generateOfficeHourSlots,
  minutesToTimeString,
  timeStringToMinutes
} from '../utils/officeHoursUtils';

interface FacultyMember {
  name: string;
  area: string;
  role: string;
}

interface Props {
  session: {
    userId: string;
    email: string;
    name: string;
    role: string;
    schoolClass?: string;
  };
  subjects: string[];
  facultyDirectory: FacultyMember[];
}

const LOCAL_STORAGE_OFFICE_HOURS_KEY = 'usap_office_hours_cache';

export const OfficeHoursSection: React.FC<Props> = ({ session, subjects, facultyDirectory }) => {
  const [sessions, setSessions] = useState<OfficeHourSession[]>([]);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [filterClass, setFilterClass] = useState<string>('ALL');
  const [filterSubject, setFilterSubject] = useState<string>('ALL');
  const [filterTeacher, setFilterTeacher] = useState<string>('ALL');
  const [activeSpreadsheetModal, setActiveSpreadsheetModal] = useState<OfficeHourSession | null>(null);

  // Form State for Scheduling by Faculty & Teaching Assistants (TAs)
  const teacherMembers = facultyDirectory.filter((f) => f.role === 'FACULTY' || f.role === 'TEACHER' || f.role === 'TA');
  const defaultTeacherName = teacherMembers.some((t) => t.name === session.name)
    ? session.name
    : teacherMembers[0]?.name || session.name;

  const defaultTeacherSubject =
    teacherMembers.find((t) => t.name === defaultTeacherName)?.area || subjects[0];

  const [formTeacherName, setFormTeacherName] = useState(defaultTeacherName);
  const [formSubject, setFormSubject] = useState(defaultTeacherSubject);
  const [formTargetClass, setFormTargetClass] = useState<OfficeHoursClass>(OFFICE_HOURS_CLASSES[0]);
  const [formDate, setFormDate] = useState(() => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  });
  const [formStartTime, setFormStartTime] = useState('16:30'); // 4:30 PM
  const [formEndTime, setFormEndTime] = useState('17:30'); // 5:30 PM
  const [formSlotMinutes, setFormSlotMinutes] = useState<OfficeHoursSlotDuration>(15);
  const [formLocation, setFormLocation] = useState('Faculty Office / Classroom');
  const [formNotes, setFormNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [actionSuccessMessage, setActionSuccessMessage] = useState<string | null>(null);

  const isTeacherOrTA = session.role === 'FACULTY' || session.role === 'TEACHER' || session.role === 'TA' || session.role === 'HEAD';
  const isStudent = session.role === 'STUDENT';

  // 1. Real-time Firebase Sync & Automatic Deletion of Passed Office Hours History
  useEffect(() => {
    // Load local cache first and drop passed sessions / slots
    try {
      const cached = localStorage.getItem(LOCAL_STORAGE_OFFICE_HOURS_KEY);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed)) {
          const seen = new Set<string>();
          const deduped: OfficeHourSession[] = [];
          for (const item of parsed) {
            if (!item || !item.id || seen.has(item.id)) continue;
            if (isOfficeHourSessionPassed(item)) continue; // Drop passed history
            const activeSlots = (item.slots || []).filter((s: OfficeHourSlot) => !isSlotTimePassed(item.date, s.endMinutes));
            if (activeSlots.length === 0) continue;
            seen.add(item.id);
            deduped.push({ ...item, slots: activeSlots, totalSlots: activeSlots.length });
          }
          setSessions(deduped);
        }
      }
    } catch {}

    const q = query(collection(db, 'office_hours'));
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const sessionMap = new Map<string, OfficeHourSession>();
        snapshot.forEach((docSnap) => {
          const data = docSnap.data() as any;
          const sessionDate = data.date || '';
          const sessionEndTime = data.endTime || '17:30';

          const sessionObj: OfficeHourSession = {
            id: docSnap.id,
            teacherName: data.teacherName || 'Faculty Teacher',
            teacherUid: data.teacherUid || '',
            teacherEmail: data.teacherEmail || '',
            subject: data.subject || 'General',
            targetClass: data.targetClass || 'Lower 6 X and Y',
            date: sessionDate,
            startTime: data.startTime || '16:30',
            endTime: sessionEndTime,
            slotDurationMinutes: data.slotDurationMinutes || 15,
            totalSlots: data.totalSlots || 4,
            location: data.location || 'Faculty Office',
            notes: data.notes || '',
            slots: data.slots || [],
            createdAt: data.createdAt || new Date().toISOString()
          };

          // RULE: Delete office hour history when session time has passed
          if (isOfficeHourSessionPassed(sessionObj)) {
            deleteDoc(doc(db, 'office_hours', docSnap.id)).catch((err) => {
              console.warn('Could not delete passed office hours session:', err);
            });
            return; // Eagerly remove from active memory
          }

          // RULE: Delete office hour history when individual slot time has passed
          const activeSlots: OfficeHourSlot[] = (sessionObj.slots || []).filter((s: OfficeHourSlot) => {
            return !isSlotTimePassed(sessionDate, s.endMinutes);
          });

          // If all slots have passed, delete the entire session from Firestore
          if (activeSlots.length === 0) {
            deleteDoc(doc(db, 'office_hours', docSnap.id)).catch((err) => {
              console.warn('Could not delete completed office hour session with all slots passed:', err);
            });
            return;
          }

          // If some slots have passed, update Firestore document to prune passed slot history
          if (activeSlots.length < (sessionObj.slots || []).length) {
            updateDoc(doc(db, 'office_hours', docSnap.id), {
              slots: activeSlots,
              totalSlots: activeSlots.length
            }).catch((err) => {
              console.warn('Could not purge passed slots from office hours doc:', err);
            });
            sessionObj.slots = activeSlots;
            sessionObj.totalSlots = activeSlots.length;
          }

          sessionMap.set(docSnap.id, sessionObj);
        });

        const loaded = Array.from(sessionMap.values());
        // Sort by date and startTime
        loaded.sort((a, b) => {
          const dateComp = a.date.localeCompare(b.date);
          if (dateComp !== 0) return dateComp;
          return a.startTime.localeCompare(b.startTime);
        });

        setSessions(loaded);
        try {
          localStorage.setItem(LOCAL_STORAGE_OFFICE_HOURS_KEY, JSON.stringify(loaded));
        } catch {}
      },
      (error) => {
        console.warn('Firestore office_hours sync error (using local cache):', error);
      }
    );

    // Periodic live cleaner: Every 30 seconds, automatically delete passed office hours and slots as time advances
    const liveCleanerTimer = setInterval(() => {
      setSessions((prev) => {
        let hasChanges = false;
        const remainingSessions: OfficeHourSession[] = [];

        for (const sessionItem of prev) {
          if (isOfficeHourSessionPassed(sessionItem)) {
            hasChanges = true;
            deleteDoc(doc(db, 'office_hours', sessionItem.id)).catch(() => {});
            continue;
          }

          const activeSlots = (sessionItem.slots || []).filter(
            (s) => !isSlotTimePassed(sessionItem.date, s.endMinutes)
          );

          if (activeSlots.length === 0) {
            hasChanges = true;
            deleteDoc(doc(db, 'office_hours', sessionItem.id)).catch(() => {});
            continue;
          }

          if (activeSlots.length < (sessionItem.slots || []).length) {
            hasChanges = true;
            updateDoc(doc(db, 'office_hours', sessionItem.id), {
              slots: activeSlots,
              totalSlots: activeSlots.length
            }).catch(() => {});
            remainingSessions.push({ ...sessionItem, slots: activeSlots, totalSlots: activeSlots.length });
          } else {
            remainingSessions.push(sessionItem);
          }
        }

        if (hasChanges) {
          try {
            localStorage.setItem(LOCAL_STORAGE_OFFICE_HOURS_KEY, JSON.stringify(remainingSessions));
          } catch {}
        }

        return hasChanges ? remainingSessions : prev;
      });
    }, 30000);

    return () => {
      unsubscribe();
      clearInterval(liveCleanerTimer);
    };
  }, []);

  // Update subject when teacher selection changes
  const handleTeacherChange = (teacherName: string) => {
    setFormTeacherName(teacherName);
    const member = facultyDirectory.find((f) => f.name === teacherName);
    if (member && subjects.includes(member.area)) {
      setFormSubject(member.area);
    }
  };

  // Preview generated slots in real time
  const timeValidation = validateOfficeHoursTime(formStartTime, formEndTime, formDate);
  const previewSlots = timeValidation.valid
    ? generateOfficeHourSlots(formStartTime, formEndTime, formSlotMinutes, formSubject)
    : [];

  // Create Office Hours Session (Teachers & TAs)
  const handleCreateOfficeHours = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isTeacherOrTA) {
      setFormError('Only teachers and teaching assistants (TAs) can schedule office hours.');
      return;
    }

    const validation = validateOfficeHoursTime(formStartTime, formEndTime, formDate);
    if (!validation.valid) {
      setFormError(validation.conflictDescription || 'Invalid office hours schedule.');
      return;
    }

    const generatedSlots = generateOfficeHourSlots(formStartTime, formEndTime, formSlotMinutes, formSubject);
    if (generatedSlots.length === 0) {
      setFormError('No consultation spaces could be created with the specified duration.');
      return;
    }

    setIsSubmitting(true);
    setFormError(null);

    const newSessionId = `oh_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const newSession: OfficeHourSession = {
      id: newSessionId,
      teacherName: formTeacherName,
      teacherUid: session.userId,
      teacherEmail: session.email,
      subject: formSubject,
      targetClass: formTargetClass,
      date: formDate,
      startTime: formStartTime,
      endTime: formEndTime,
      slotDurationMinutes: formSlotMinutes,
      totalSlots: generatedSlots.length,
      location: formLocation,
      notes: formNotes,
      slots: generatedSlots,
      createdAt: new Date().toISOString()
    };

    try {
      await setDoc(doc(db, 'office_hours', newSessionId), newSession);

      // Safe de-duplicated local cache update
      setSessions((prev) => {
        const exists = prev.some((s) => s.id === newSession.id);
        const next = exists
          ? prev.map((s) => (s.id === newSession.id ? newSession : s))
          : [...prev, newSession];
        try {
          localStorage.setItem(LOCAL_STORAGE_OFFICE_HOURS_KEY, JSON.stringify(next));
        } catch {}
        return next;
      });

      setShowScheduleModal(false);
      const isChem = formSubject.toLowerCase() === 'chemistry';
      setActionSuccessMessage(
        `Done! Office hours for ${newSession.subject} with ${newSession.teacherName} (${newSession.totalSlots} spaces numbered 1–${newSession.totalSlots}${isChem ? ' • up to 5 students per space' : ''}) scheduled successfully.`
      );
      setTimeout(() => setActionSuccessMessage(null), 5000);
    } catch (err: any) {
      console.error('Error creating office hours:', err);
      // Fallback to local storage if Firestore write fails
      setSessions((prev) => {
        const exists = prev.some((s) => s.id === newSession.id);
        const next = exists
          ? prev.map((s) => (s.id === newSession.id ? newSession : s))
          : [...prev, newSession];
        try {
          localStorage.setItem(LOCAL_STORAGE_OFFICE_HOURS_KEY, JSON.stringify(next));
        } catch {}
        return next;
      });
      setShowScheduleModal(false);
      setActionSuccessMessage(`Office hours created and saved locally (${newSession.totalSlots} spaces).`);
      setTimeout(() => setActionSuccessMessage(null), 5000);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Student registers their name for a specific slot (up to 5 for Chemistry)
  const handleRegisterSlot = async (sessionItem: OfficeHourSession, slotNumber: number) => {
    const targetSlot = sessionItem.slots.find((s) => s.slotNumber === slotNumber);
    if (!targetSlot) return;

    // Check if slot time has passed
    if (isSlotTimePassed(sessionItem.date, targetSlot.endMinutes)) {
      setActionSuccessMessage(`Cannot register: This slot time (${targetSlot.startTime} – ${targetSlot.endTime}) has already passed.`);
      setTimeout(() => setActionSuccessMessage(null), 5000);
      return;
    }

    const currentStudents = getSlotRegisteredStudents(targetSlot);
    const maxCapacity = targetSlot.maxCapacity || getMaxSlotCapacity(sessionItem.subject);

    // Check if student already registered in this slot
    const alreadyRegistered = currentStudents.some(
      (st) => st.studentUid === session.userId || (st.studentName === session.name && session.name)
    );
    if (alreadyRegistered) {
      setActionSuccessMessage(`You are already registered for Space #${slotNumber}.`);
      setTimeout(() => setActionSuccessMessage(null), 4000);
      return;
    }

    // Check capacity: Chemistry allows maximum of 5 students per slot
    if (currentStudents.length >= maxCapacity) {
      const isChem = sessionItem.subject.toLowerCase() === 'chemistry';
      setActionSuccessMessage(
        isChem
          ? `Slot capacity reached: A maximum of 5 students can register for chemistry office hours on the same slot.`
          : `Space #${slotNumber} is already filled. Please select an available space.`
      );
      setTimeout(() => setActionSuccessMessage(null), 5000);
      return;
    }

    const newStudent: RegisteredStudent = {
      studentUid: session.userId,
      studentName: session.name,
      studentEmail: session.email,
      studentClass: session.schoolClass || 'STUDENT',
      bookedAt: new Date().toISOString()
    };

    const nextStudents = [...currentStudents, newStudent];

    const updatedSlots = sessionItem.slots.map((s) => {
      if (s.slotNumber === slotNumber) {
        return {
          ...s,
          maxCapacity,
          students: nextStudents,
          studentUid: nextStudents[0]?.studentUid || null,
          studentName: nextStudents.map((st) => st.studentName).join(', '),
          studentEmail: nextStudents[0]?.studentEmail || null,
          studentClass: nextStudents[0]?.studentClass || null,
          bookedAt: nextStudents[0]?.bookedAt || new Date().toISOString()
        };
      }
      return s;
    });

    try {
      await updateDoc(doc(db, 'office_hours', sessionItem.id), {
        slots: updatedSlots
      });
      const isChem = sessionItem.subject.toLowerCase() === 'chemistry';
      setActionSuccessMessage(
        isChem
          ? `Successfully registered for Chemistry Office Hours Space #${slotNumber} (${nextStudents.length}/5 students enrolled).`
          : `Successfully registered your name for Space #${slotNumber} (${sessionItem.slots[slotNumber - 1]?.startTime} – ${sessionItem.slots[slotNumber - 1]?.endTime}).`
      );
      setTimeout(() => setActionSuccessMessage(null), 5000);
    } catch (err) {
      // Local fallback
      setSessions((prev) =>
        prev.map((item) =>
          item.id === sessionItem.id ? { ...item, slots: updatedSlots } : item
        )
      );
    }
  };

  // Cancel registration for a student on a slot
  const handleCancelRegistration = async (
    sessionItem: OfficeHourSession,
    slotNumber: number,
    targetStudentUid?: string
  ) => {
    const uidToRemove = targetStudentUid || session.userId;
    const isTeacherClearingAll = !targetStudentUid && (session.role === 'FACULTY' || session.role === 'TEACHER' || session.role === 'TA' || session.role === 'HEAD');

    const updatedSlots = sessionItem.slots.map((s) => {
      if (s.slotNumber === slotNumber) {
        if (isTeacherClearingAll) {
          // Clear entire slot
          return {
            ...s,
            students: [],
            studentUid: null,
            studentName: null,
            studentEmail: null,
            studentClass: null,
            bookedAt: null
          };
        }

        const currentStudents = getSlotRegisteredStudents(s);
        const remainingStudents = currentStudents.filter(
          (st) => st.studentUid !== uidToRemove && st.studentName !== session.name
        );

        return {
          ...s,
          students: remainingStudents,
          studentUid: remainingStudents[0]?.studentUid || null,
          studentName: remainingStudents.length > 0 ? remainingStudents.map((st) => st.studentName).join(', ') : null,
          studentEmail: remainingStudents[0]?.studentEmail || null,
          studentClass: remainingStudents[0]?.studentClass || null,
          bookedAt: remainingStudents[0]?.bookedAt || null
        };
      }
      return s;
    });

    try {
      await updateDoc(doc(db, 'office_hours', sessionItem.id), {
        slots: updatedSlots
      });
      setActionSuccessMessage(`Cancelled registration for Space #${slotNumber}.`);
      setTimeout(() => setActionSuccessMessage(null), 4000);
    } catch (err) {
      setSessions((prev) =>
        prev.map((item) =>
          item.id === sessionItem.id ? { ...item, slots: updatedSlots } : item
        )
      );
    }
  };

  // Teacher deletes the whole office hours session
  const handleDeleteSession = async (sessionId: string) => {
    if (window.confirm('Are you sure you want to remove this office hours session?')) {
      try {
        await deleteDoc(doc(db, 'office_hours', sessionId));
      } catch (err) {
        setSessions((prev) => prev.filter((s) => s.id !== sessionId));
      }
    }
  };

  // Filtered Sessions with strict uniqueness guarantee
  const filteredSessions = React.useMemo(() => {
    const seen = new Set<string>();
    return sessions.filter((s) => {
      if (!s || !s.id || seen.has(s.id)) return false;
      seen.add(s.id);
      if (filterClass !== 'ALL' && s.targetClass !== filterClass) return false;
      if (filterSubject !== 'ALL' && s.subject !== filterSubject) return false;
      if (filterTeacher !== 'ALL' && s.teacherName !== filterTeacher) return false;
      return true;
    });
  }, [sessions, filterClass, filterSubject, filterTeacher]);

  return (
    <div className="space-y-6">
      {/* Top Banner & Action Header */}
      <div className="bg-gradient-to-r from-purple-900 via-indigo-900 to-slate-900 rounded-3xl p-6 text-white shadow-xl border border-purple-700/50">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div className="space-y-2">
            <div className="flex items-center gap-2.5">
              <span className="p-2.5 bg-amber-400 text-slate-950 rounded-2xl shadow-inner font-black">
                <GraduationCap className="w-5 h-5" />
              </span>
              <div>
                <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white flex items-center gap-2">
                  <span>Office hours</span>
                  <span className="px-2.5 py-0.5 rounded-full bg-amber-400/20 text-amber-300 text-xs font-black uppercase tracking-wider border border-amber-400/30">
                    Faculty Consultations
                  </span>
                </h2>
                <p className="text-xs text-purple-200/90 font-medium">
                  Teachers & Teaching Assistants (TAs) schedule consultation blocks • Students register individual time slots
                </p>
              </div>
            </div>

            {/* Special Schedule Allowance Notice */}
            <div className="p-3 bg-white/10 rounded-2xl border border-white/15 text-[11px] leading-relaxed text-purple-100 flex items-start gap-2 max-w-3xl">
              <Sparkles className="w-4 h-4 text-amber-300 shrink-0 mt-0.5" />
              <span>
                <strong>Schedule Privilege:</strong> Office hours are not affected by regular school time hours. They are the only sessions permitted to overlap school classes, extracurricular activities, and prep time, but <strong>strictly exclude meal times</strong> (Breakfast, Snacks, Lunch, Dinner) and <strong>sleep time</strong> (10:30 PM – 7:00 AM).
              </span>
            </div>
          </div>

          {/* Action: Teacher / TA Schedule Button */}
          {isTeacherOrTA ? (
            <button
              onClick={() => {
                setFormError(null);
                setShowScheduleModal(true);
              }}
              className="px-5 py-3 rounded-2xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs transition flex items-center justify-center gap-2 shadow-lg shadow-amber-400/20 active:scale-95 shrink-0"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Schedule Office Hours</span>
            </button>
          ) : isStudent ? (
            <div className="px-4 py-2.5 rounded-2xl bg-white/10 border border-white/20 text-[11px] font-semibold text-purple-200 shrink-0">
              🎓 Logged in as Student: <strong className="text-white">{session.name}</strong> ({session.schoolClass || 'Student'})
              <div className="text-[10px] text-amber-300">Click &quot;Add My Name&quot; on available slots to register.</div>
            </div>
          ) : (
            <div className="px-4 py-2.5 rounded-2xl bg-white/10 border border-white/20 text-[11px] font-semibold text-purple-200 shrink-0">
              👤 Logged in as: <strong className="text-white">{session.name}</strong> ({session.role})
            </div>
          )}
        </div>
      </div>

      {/* Success Banner */}
      {actionSuccessMessage && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-300 text-xs text-emerald-950 font-bold flex items-center justify-between shadow-xs animate-in fade-in">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{actionSuccessMessage}</span>
          </div>
          <button
            onClick={() => setActionSuccessMessage(null)}
            className="text-emerald-700 hover:text-emerald-900 font-black text-xs"
          >
            ✕
          </button>
        </div>
      )}

      {/* Filters Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-600">
            <Filter className="w-3.5 h-3.5 text-purple-600" />
            <span>Filter By:</span>
          </div>

          {/* Class Filter */}
          <select
            value={filterClass}
            onChange={(e) => setFilterClass(e.target.value)}
            className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:border-purple-600"
          >
            <option value="ALL">All Classes</option>
            {OFFICE_HOURS_CLASSES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>

          {/* Subject Filter */}
          <select
            value={filterSubject}
            onChange={(e) => setFilterSubject(e.target.value)}
            className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:border-purple-600"
          >
            <option value="ALL">All Subjects</option>
            {subjects.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>

          {/* Teacher / TA Filter */}
          <select
            value={filterTeacher}
            onChange={(e) => setFilterTeacher(e.target.value)}
            className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:border-purple-600"
          >
            <option value="ALL">All Teachers & TAs</option>
            {teacherMembers.map((t, idx) => (
              <option key={`filter-teacher-${t.name}-${idx}`} value={t.name}>
                {t.name} ({t.area}{t.role === 'TA' ? ' - TA' : ''})
              </option>
            ))}
          </select>
        </div>

        <div className="text-xs font-bold text-slate-500">
          Showing <span className="text-purple-700 font-extrabold">{filteredSessions.length}</span> office hour session{filteredSessions.length === 1 ? '' : 's'}
        </div>
      </div>

      {/* Office Hours Sessions Cards */}
      {filteredSessions.length > 0 ? (
        <div className="space-y-6">
          {filteredSessions.map((sessionItem, idx) => {
            const bookedCount = sessionItem.slots.filter((s) => !!s.studentName).length;
            const isUserRegistered = sessionItem.slots.some((s) => s.studentUid === session.userId);
            const isCreatorTeacher = session.userId === sessionItem.teacherUid || session.name === sessionItem.teacherName;

            return (
              <div
                key={sessionItem.id || `session-${idx}`}
                className="bg-white rounded-3xl border-2 border-purple-100 shadow-md overflow-hidden hover:border-purple-300 transition"
              >
                {/* Session Card Header */}
                <div className="bg-gradient-to-r from-purple-50 via-slate-50 to-indigo-50/70 p-4 sm:p-5 border-b border-purple-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="px-2.5 py-0.5 rounded-full bg-purple-600 text-white font-black text-xs uppercase tracking-wider">
                        {sessionItem.subject}
                      </span>
                      <span className="px-2.5 py-0.5 rounded-full bg-indigo-100 text-indigo-900 border border-indigo-200 font-extrabold text-xs">
                        Class: {sessionItem.targetClass}
                      </span>
                      <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300 font-bold text-[11px] font-mono">
                        {sessionItem.slotDurationMinutes} min/student
                      </span>
                    </div>

                    <h3 className="text-base sm:text-lg font-black text-slate-900 pt-1 flex items-center gap-2">
                      <span>{sessionItem.teacherName} — Office Hours</span>
                    </h3>

                    <div className="flex flex-wrap items-center gap-3 text-xs text-slate-600 font-medium">
                      <span className="flex items-center gap-1 text-slate-800 font-bold">
                        <Calendar className="w-3.5 h-3.5 text-purple-600" />
                        {sessionItem.date}
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1 font-mono font-bold text-slate-800">
                        <Clock className="w-3.5 h-3.5 text-purple-600" />
                        {minutesToTimeString(timeStringToMinutes(sessionItem.startTime))} – {minutesToTimeString(timeStringToMinutes(sessionItem.endTime))}
                      </span>
                      {sessionItem.location && (
                        <>
                          <span>•</span>
                          <span className="flex items-center gap-1">
                            <Building className="w-3.5 h-3.5 text-purple-600" />
                            {sessionItem.location}
                          </span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Actions & Status Pill */}
                  <div className="flex items-center gap-2.5 shrink-0 self-start md:self-center">
                    <div className="text-right">
                      <div className="text-xs font-black text-slate-900 font-mono">
                        {bookedCount} / {sessionItem.totalSlots} Spaces Filled
                      </div>
                      <div className="text-[10px] text-slate-500 font-semibold">
                        {sessionItem.totalSlots - bookedCount} spaces remaining
                      </div>
                    </div>

                    {/* View / Print Full Spreadsheet Modal Button */}
                    <button
                      onClick={() => setActiveSpreadsheetModal(sessionItem)}
                      className="px-3 py-1.5 bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 font-bold text-xs rounded-xl transition flex items-center gap-1.5 shadow-2xs"
                      title="Open full spreadsheet modal"
                    >
                      <FileSpreadsheet className="w-3.5 h-3.5" />
                      <span>Spreadsheet</span>
                    </button>

                    {/* Delete for creator teacher */}
                    {(isCreatorTeacher || session.role === 'HEAD') && (
                      <button
                        onClick={() => handleDeleteSession(sessionItem.id)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition"
                        title="Delete office hours session"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>

                {/* SPREADSHEET TABLE FOR REGISTERING (Spaces Numbered 1-N) */}
                <div className="p-4 sm:p-5 overflow-x-auto">
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-2.5">
                    <div className="text-xs font-extrabold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                      <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                      <span>Office Hours Registration Spreadsheet ({sessionItem.totalSlots} Spaces Numbered 1–{sessionItem.totalSlots})</span>
                    </div>

                    {sessionItem.subject.toLowerCase() === 'chemistry' && (
                      <div className="px-2.5 py-1 rounded-xl bg-purple-100 text-purple-900 border border-purple-200 font-bold text-[11px] flex items-center gap-1.5 shadow-2xs">
                        <FlaskConical className="w-3.5 h-3.5 text-purple-700" />
                        <span>Chemistry Group Capacity: Up to 5 students can register for the same slot</span>
                      </div>
                    )}
                  </div>

                  <table className="w-full text-left text-xs border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
                    <thead className="bg-slate-100 text-slate-700 font-black uppercase text-[10px] border-b border-slate-200">
                      <tr>
                        <th className="py-2.5 px-3 w-16 text-center">Space #</th>
                        <th className="py-2.5 px-3">Time Slot</th>
                        <th className="py-2.5 px-3">Duration</th>
                        <th className="py-2.5 px-4">Students Registered</th>
                        <th className="py-2.5 px-3">Class</th>
                        <th className="py-2.5 px-3 text-center">Status</th>
                        <th className="py-2.5 px-3 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 font-medium">
                      {sessionItem.slots.map((slot) => {
                        const registeredStudents = getSlotRegisteredStudents(slot);
                        const maxCapacity = slot.maxCapacity || getMaxSlotCapacity(sessionItem.subject);
                        const isSlotFull = registeredStudents.length >= maxCapacity;
                        const isBookedByCurrentUser = registeredStudents.some(
                          (st) => st.studentUid === session.userId || (st.studentName === session.name && session.name)
                        );
                        const isChem = sessionItem.subject.toLowerCase() === 'chemistry';

                        return (
                          <tr
                            key={slot.slotNumber}
                            className={`transition ${
                              isBookedByCurrentUser
                                ? 'bg-amber-50/70 hover:bg-amber-100/60'
                                : registeredStudents.length > 0
                                ? 'bg-slate-50/50 hover:bg-slate-50'
                                : 'bg-white hover:bg-purple-50/40'
                            }`}
                          >
                            {/* Space # (Numbered 1 to N) */}
                            <td className="py-2.5 px-3 text-center font-mono font-black text-slate-900 bg-slate-50/70 border-r border-slate-200">
                              <span className="w-6 h-6 rounded-full inline-flex items-center justify-center bg-white border border-slate-300 shadow-2xs text-xs">
                                {slot.slotNumber}
                              </span>
                            </td>

                            {/* Time Slot */}
                            <td className="py-2.5 px-3 font-mono font-bold text-slate-800 whitespace-nowrap">
                              {slot.startTime} – {slot.endTime}
                            </td>

                            {/* Duration */}
                            <td className="py-2.5 px-3 text-slate-500 font-semibold whitespace-nowrap">
                              {sessionItem.slotDurationMinutes} mins
                            </td>

                            {/* Students Registered */}
                            <td className="py-2.5 px-4 font-bold">
                              {registeredStudents.length > 0 ? (
                                <div className="space-y-1 py-0.5">
                                  {registeredStudents.map((st, sIdx) => {
                                    const isThisUser = st.studentUid === session.userId || st.studentName === session.name;
                                    return (
                                      <div
                                        key={st.studentUid || sIdx}
                                        className="flex items-center justify-between gap-2 text-[11px] bg-white px-2 py-1 rounded-lg border border-slate-200 shadow-2xs"
                                      >
                                        <div className="flex items-center gap-1.5 min-w-0">
                                          <span className="w-4 h-4 rounded-full bg-purple-100 text-purple-700 font-bold text-[9px] flex items-center justify-center shrink-0">
                                            {sIdx + 1}
                                          </span>
                                          <span className="font-bold text-slate-800 truncate">{st.studentName}</span>
                                          <span className="text-[10px] text-slate-500 shrink-0">({st.studentClass || 'Student'})</span>
                                          {isThisUser && (
                                            <span className="px-1.5 py-0.2 rounded bg-amber-400 text-slate-950 font-black text-[9px] uppercase shrink-0">
                                              You
                                            </span>
                                          )}
                                        </div>
                                        {(isThisUser || isCreatorTeacher || session.role === 'HEAD') && (
                                          <button
                                            onClick={() => handleCancelRegistration(sessionItem, slot.slotNumber, st.studentUid)}
                                            className="text-[10px] text-rose-600 hover:text-rose-800 font-bold hover:underline shrink-0"
                                            title="Cancel registration"
                                          >
                                            Cancel
                                          </button>
                                        )}
                                      </div>
                                    );
                                  })}
                                  {!isSlotFull && isChem && (
                                    <div className="text-[10px] text-emerald-700 font-bold pl-1">
                                      + {maxCapacity - registeredStudents.length} more student spot{maxCapacity - registeredStudents.length === 1 ? '' : 's'} available
                                    </div>
                                  )}
                                </div>
                              ) : (
                                <span className="text-slate-400 italic font-normal">
                                  — Available Space {isChem ? `(0/${maxCapacity} Students)` : ''} —
                                </span>
                              )}
                            </td>

                            {/* Class */}
                            <td className="py-2.5 px-3 text-slate-600">
                              {registeredStudents.length > 0
                                ? Array.from(new Set(registeredStudents.map((st) => st.studentClass).filter(Boolean))).join(', ') || sessionItem.targetClass
                                : sessionItem.targetClass}
                            </td>

                            {/* Status */}
                            <td className="py-2.5 px-3 text-center whitespace-nowrap">
                              {isSlotFull ? (
                                <span className="px-2 py-0.5 rounded-full bg-slate-200 text-slate-800 text-[10px] font-black uppercase tracking-wider">
                                  Full ({registeredStudents.length}/{maxCapacity})
                                </span>
                              ) : registeredStudents.length > 0 ? (
                                <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300 text-[10px] font-black uppercase tracking-wider">
                                  {registeredStudents.length}/{maxCapacity} Joined
                                </span>
                              ) : (
                                <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-black uppercase tracking-wider border border-emerald-300">
                                  Open ({maxCapacity} Max)
                                </span>
                              )}
                            </td>

                            {/* Action Button */}
                            <td className="py-2.5 px-3 text-right whitespace-nowrap">
                              {/* If Student and slot not full and not joined yet */}
                              {isStudent && !isBookedByCurrentUser && !isSlotFull && (
                                <button
                                  onClick={() => handleRegisterSlot(sessionItem, slot.slotNumber)}
                                  className="px-3 py-1 bg-purple-600 hover:bg-purple-700 text-white font-extrabold text-[11px] rounded-lg shadow-xs transition active:scale-95 flex items-center gap-1 ml-auto"
                                >
                                  <PlusCircle className="w-3 h-3" />
                                  <span>{registeredStudents.length > 0 ? `Join Space (${registeredStudents.length}/${maxCapacity})` : 'Add My Name'}</span>
                                </button>
                              )}

                              {/* If Student joined this slot: can cancel their spot */}
                              {isStudent && isBookedByCurrentUser && (
                                <button
                                  onClick={() => handleCancelRegistration(sessionItem, slot.slotNumber)}
                                  className="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-bold text-[10px] rounded-lg transition ml-auto"
                                >
                                  Cancel My Spot
                                </button>
                              )}

                              {/* If Student and slot is full and student didn't join */}
                              {isStudent && !isBookedByCurrentUser && isSlotFull && (
                                <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-md">
                                  Slot Full ({maxCapacity})
                                </span>
                              )}

                              {/* If Teacher or Head: can clear slot */}
                              {(isCreatorTeacher || session.role === 'HEAD') && registeredStudents.length > 0 && (
                                <button
                                  onClick={() => handleCancelRegistration(sessionItem, slot.slotNumber)}
                                  className="px-2 py-0.5 text-slate-400 hover:text-rose-600 text-[10px] font-semibold transition ml-auto underline"
                                >
                                  Clear Space ({registeredStudents.length})
                                </button>
                              )}

                              {/* Non-student and not booked */}
                              {!isStudent && registeredStudents.length === 0 && (
                                <span className="text-slate-300 text-[10px]">—</span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-white rounded-3xl border border-slate-200 p-8 text-center space-y-3">
          <GraduationCap className="w-12 h-12 text-slate-300 mx-auto" />
          <h3 className="text-base font-bold text-slate-700">No Office Hours Scheduled</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            {isTeacherOrTA
              ? 'Click "Schedule Office Hours" above to open consultation slots for students.'
              : 'There are currently no office hours scheduled matching your filter. Please check back soon or choose another filter.'}
          </p>
        </div>
      )}

      {/* SCHEDULE OFFICE HOURS MODAL (TEACHERS & TAs) */}
      {showScheduleModal && isTeacherOrTA && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/75 backdrop-blur-xs animate-in fade-in overflow-y-auto"
        >
          <div className="bg-white rounded-3xl border border-purple-200 shadow-2xl max-w-2xl w-full flex flex-col overflow-hidden animate-in zoom-in-95 my-auto max-h-[92vh]">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-purple-950 via-indigo-900 to-slate-900 text-white p-5 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-amber-400 text-slate-950 flex items-center justify-center font-black shrink-0">
                  <GraduationCap className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-black tracking-tight">
                    Schedule Office Hours
                  </h3>
                  <p className="text-[11px] text-purple-200/80 font-medium">
                    Set up consultation slots for students to register their names
                  </p>
                </div>
              </div>

              <button
                onClick={() => setShowScheduleModal(false)}
                className="w-8 h-8 rounded-xl bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleCreateOfficeHours} className="p-5 sm:p-6 overflow-y-auto space-y-5 flex-1">
              {formError && (
                <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-xs text-rose-800 font-bold flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <span>{formError}</span>
                </div>
              )}

              {/* Special Schedule Privilege Info Box */}
              <div className="p-3.5 bg-amber-50 rounded-2xl border border-amber-200 text-xs text-amber-950 space-y-1">
                <div className="font-black flex items-center gap-1.5 text-amber-900">
                  <ShieldCheck className="w-4 h-4 text-amber-600" />
                  <span>Office Hours Scheduling Rules</span>
                </div>
                <p className="text-[11px] text-amber-900/90 leading-relaxed font-medium">
                  • <strong>Allowed Overlaps:</strong> Regular school classes, afternoon extracurriculars, and prep study blocks.<br />
                  • <strong>Strictly Prohibited:</strong> Meal times (Breakfast 7:00–7:35 AM, Morning Snack 9:45–10:00 AM, Lunch 1:05–2:00 PM, Dinner 5:50–7:00 PM, Evening Snack 9:00–9:15 PM) and Sleep time (10:30 PM – 7:00 AM).
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Teacher / TA Selection */}
                <div>
                  <label className="block text-xs font-black text-slate-800 uppercase tracking-wider mb-1.5">
                    Faculty Teacher or TA:
                  </label>
                  <select
                    value={formTeacherName}
                    onChange={(e) => handleTeacherChange(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:outline-none focus:border-purple-600 shadow-2xs"
                  >
                    {teacherMembers.map((t, idx) => (
                      <option key={`modal-teacher-${t.name}-${idx}`} value={t.name}>
                        {t.name} ({t.area}{t.role === 'TA' ? ' - TA' : ''})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Subject Selection */}
                <div>
                  <label className="block text-xs font-black text-slate-800 uppercase tracking-wider mb-1.5">
                    Subject:
                  </label>
                  <select
                    value={formSubject}
                    onChange={(e) => setFormSubject(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:outline-none focus:border-purple-600 shadow-2xs"
                  >
                    {subjects.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Class Selection: Exact options specified by user */}
                <div>
                  <label className="block text-xs font-black text-slate-800 uppercase tracking-wider mb-1.5">
                    Target Class to Choose:
                  </label>
                  <select
                    value={formTargetClass}
                    onChange={(e) => setFormTargetClass(e.target.value as OfficeHoursClass)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:outline-none focus:border-purple-600 shadow-2xs"
                  >
                    {OFFICE_HOURS_CLASSES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Date */}
                <div>
                  <label className="block text-xs font-black text-slate-800 uppercase tracking-wider mb-1.5">
                    Consultation Date:
                  </label>
                  <input
                    type="date"
                    value={formDate}
                    onChange={(e) => setFormDate(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:outline-none focus:border-purple-600 shadow-2xs"
                    required
                  />
                </div>
              </div>

              {/* Time Selection */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-black text-slate-800 uppercase tracking-wider mb-1.5">
                    Start Time:
                  </label>
                  <input
                    type="time"
                    value={formStartTime}
                    onChange={(e) => setFormStartTime(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold font-mono focus:outline-none focus:border-purple-600 shadow-2xs"
                    required
                  />
                  <span className="text-[10px] text-slate-400 mt-1 block">
                    e.g. 16:30 for 4:30 PM
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-black text-slate-800 uppercase tracking-wider mb-1.5">
                    End Time:
                  </label>
                  <input
                    type="time"
                    value={formEndTime}
                    onChange={(e) => setFormEndTime(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold font-mono focus:outline-none focus:border-purple-600 shadow-2xs"
                    required
                  />
                  <span className="text-[10px] text-slate-400 mt-1 block">
                    e.g. 17:30 for 5:30 PM
                  </span>
                </div>
              </div>

              {/* Office Minutes Per Student Dropdown / Radio */}
              <div>
                <label className="block text-xs font-black text-slate-800 uppercase tracking-wider mb-1.5">
                  Office Minutes for Each Student:
                </label>
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                  {OFFICE_HOURS_SLOT_MINUTES.map((mins) => {
                    const isSelected = formSlotMinutes === mins;
                    return (
                      <button
                        key={mins}
                        type="button"
                        onClick={() => setFormSlotMinutes(mins)}
                        className={`py-2 px-2 rounded-xl text-xs font-black transition border text-center ${
                          isSelected
                            ? 'bg-purple-600 text-white border-purple-600 shadow-sm'
                            : 'bg-slate-50 text-slate-700 border-slate-200 hover:border-purple-300'
                        }`}
                      >
                        {mins} mins
                      </button>
                    );
                  })}
                </div>
                <span className="text-[10px] text-slate-500 mt-1 block">
                  Select consultation time allotted per student space.
                </span>
              </div>

              {/* Real-Time Spreadsheet Preview Box */}
              <div className="p-4 rounded-2xl bg-purple-50/80 border border-purple-200 space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="text-xs font-black text-purple-950 flex items-center gap-1.5">
                    <FileSpreadsheet className="w-4 h-4 text-purple-600" />
                    <span>Generated Spreadsheet Preview</span>
                  </div>
                  {timeValidation.valid ? (
                    <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-black uppercase">
                      ✓ Time Valid
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 text-[10px] font-black uppercase">
                      ✕ Time Conflict
                    </span>
                  )}
                </div>

                {timeValidation.valid ? (
                  <div className="space-y-2">
                    <div className="text-xs text-purple-900 font-semibold">
                      Total duration: <strong>{timeStringToMinutes(formEndTime) - timeStringToMinutes(formStartTime)} minutes</strong>. Spaces to be filled: <strong className="text-purple-700">{previewSlots.length} spaces numbered 1–{previewSlots.length}</strong>.
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
                      {previewSlots.map((slot) => (
                        <div
                          key={slot.slotNumber}
                          className="p-2 rounded-xl bg-white border border-purple-200 text-center font-mono text-[10px]"
                        >
                          <div className="font-black text-purple-950">Space #{slot.slotNumber}</div>
                          <div className="text-slate-600 font-bold">{slot.startTime} – {slot.endTime}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="text-xs text-rose-700 font-bold flex items-start gap-1.5">
                    <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>{timeValidation.conflictDescription}</span>
                  </div>
                )}
              </div>

              {/* Location & Notes */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-black text-slate-800 uppercase tracking-wider mb-1.5">
                    Consultation Location (Optional):
                  </label>
                  <input
                    type="text"
                    value={formLocation}
                    onChange={(e) => setFormLocation(e.target.value)}
                    placeholder="e.g. Biology Lab, Faculty Office..."
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-purple-600 shadow-2xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-black text-slate-800 uppercase tracking-wider mb-1.5">
                    Special Instructions (Optional):
                  </label>
                  <input
                    type="text"
                    value={formNotes}
                    onChange={(e) => setFormNotes(e.target.value)}
                    placeholder="e.g. Bring your lab workbook..."
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-purple-600 shadow-2xs"
                  />
                </div>
              </div>

              {/* Form Buttons */}
              <div className="pt-2 flex items-center justify-end gap-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowScheduleModal(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 text-xs font-bold hover:bg-slate-50 transition"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={!timeValidation.valid || isSubmitting}
                  className={`px-5 py-2.5 rounded-xl font-black text-xs text-white shadow-md transition flex items-center gap-2 ${
                    !timeValidation.valid || isSubmitting
                      ? 'bg-slate-300 cursor-not-allowed'
                      : 'bg-purple-600 hover:bg-purple-700 active:scale-95'
                  }`}
                >
                  <Check className="w-4 h-4" />
                  <span>{isSubmitting ? 'Creating Spreadsheet...' : 'Publish Office Hours'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* FULL SPREADSHEET MODAL / PRINT VIEW */}
      {activeSpreadsheetModal && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/75 backdrop-blur-xs animate-in fade-in overflow-y-auto"
        >
          <div className="bg-white rounded-3xl border border-purple-200 shadow-2xl max-w-4xl w-full flex flex-col overflow-hidden animate-in zoom-in-95 my-auto max-h-[92vh]">
            {/* Spreadsheet Header */}
            <div className="bg-gradient-to-r from-emerald-900 via-teal-900 to-slate-900 text-white p-5 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center text-emerald-300 font-black shrink-0 border border-white/20">
                  <FileSpreadsheet className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-black tracking-tight flex items-center gap-2">
                    <span>{activeSpreadsheetModal.subject} — Office Hours Roster</span>
                    <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/40 text-[10px] font-mono">
                      {activeSpreadsheetModal.date}
                    </span>
                  </h3>
                  <p className="text-[11px] text-emerald-100 font-medium">
                    Faculty: <strong>{activeSpreadsheetModal.teacherName}</strong> • Class: <strong>{activeSpreadsheetModal.targetClass}</strong> • Slot: <strong>{activeSpreadsheetModal.slotDurationMinutes} min</strong>
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white font-bold text-xs rounded-xl transition flex items-center gap-1.5"
                  title="Print spreadsheet"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Print Roster</span>
                </button>

                <button
                  onClick={() => setActiveSpreadsheetModal(null)}
                  className="w-8 h-8 rounded-xl bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Modal Body: Spreadsheet */}
            <div className="p-5 sm:p-6 overflow-y-auto space-y-4 flex-1">
              <div className="border-2 border-slate-300 rounded-2xl overflow-hidden shadow-xs">
                <table className="w-full text-left text-xs font-mono">
                  <thead className="bg-slate-100 text-slate-800 font-black uppercase text-[11px] border-b-2 border-slate-300">
                    <tr>
                      <th className="py-3 px-3 text-center border-r border-slate-300 w-16">Space #</th>
                      <th className="py-3 px-4 border-r border-slate-300">Time Interval</th>
                      <th className="py-3 px-3 border-r border-slate-300">Duration</th>
                      <th className="py-3 px-4 border-r border-slate-300">Registered Student Name</th>
                      <th className="py-3 px-3 border-r border-slate-300">Student Class</th>
                      <th className="py-3 px-3 text-center">Registration Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-300 font-semibold">
                    {activeSpreadsheetModal.slots.map((slot) => {
                      const registeredStudents = getSlotRegisteredStudents(slot);
                      const maxCapacity = slot.maxCapacity || getMaxSlotCapacity(activeSpreadsheetModal.subject);
                      const isBooked = registeredStudents.length > 0;
                      const isFull = registeredStudents.length >= maxCapacity;

                      return (
                        <tr
                          key={slot.slotNumber}
                          className={isBooked ? 'bg-emerald-50/40' : 'bg-white hover:bg-slate-50'}
                        >
                          <td className="py-3 px-3 text-center font-black bg-slate-50 border-r border-slate-300">
                            {slot.slotNumber}
                          </td>
                          <td className="py-3 px-4 font-bold border-r border-slate-300 text-slate-900">
                            {slot.startTime} – {slot.endTime}
                          </td>
                          <td className="py-3 px-3 border-r border-slate-300 text-slate-600">
                            {activeSpreadsheetModal.slotDurationMinutes} min
                          </td>
                          <td className="py-3 px-4 border-r border-slate-300 text-slate-900 font-sans">
                            {registeredStudents.length > 0 ? (
                              <div className="space-y-0.5">
                                {registeredStudents.map((st, sIdx) => (
                                  <div key={st.studentUid || sIdx} className="text-[11px] font-bold text-slate-900 flex items-center gap-1.5">
                                    <span className="text-slate-400 font-mono text-[10px]">{sIdx + 1}.</span>
                                    <span>{st.studentName}</span>
                                    <span className="text-slate-500 font-normal text-[10px]">({st.studentClass || 'Student'})</span>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <span className="text-slate-400 font-normal italic font-mono">— OPEN SPACE —</span>
                            )}
                          </td>
                          <td className="py-3 px-3 border-r border-slate-300 text-slate-700">
                            {registeredStudents.length > 0
                              ? Array.from(new Set(registeredStudents.map((st) => st.studentClass).filter(Boolean))).join(', ') || activeSpreadsheetModal.targetClass
                              : activeSpreadsheetModal.targetClass}
                          </td>
                          <td className="py-3 px-3 text-center">
                            {isFull ? (
                              <span className="px-2 py-0.5 rounded-full bg-emerald-600 text-white text-[10px] font-black uppercase">
                                Full ({registeredStudents.length}/{maxCapacity})
                              </span>
                            ) : isBooked ? (
                              <span className="px-2 py-0.5 rounded-full bg-amber-500 text-white text-[10px] font-black uppercase">
                                {registeredStudents.length}/{maxCapacity} Joined
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded-full bg-slate-200 text-slate-600 text-[10px] font-black uppercase">
                                Available ({maxCapacity})
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div className="text-[11px] text-slate-500 flex items-center justify-between font-medium pt-2">
                <span>Location: <strong>{activeSpreadsheetModal.location || 'Faculty Room'}</strong></span>
                <span>USAP Community School • Faculty Office Hours Roster</span>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end shrink-0">
              <button
                onClick={() => setActiveSpreadsheetModal(null)}
                className="px-5 py-2 bg-slate-800 hover:bg-slate-900 text-white font-extrabold text-xs rounded-xl shadow-xs transition"
              >
                Close Spreadsheet
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
