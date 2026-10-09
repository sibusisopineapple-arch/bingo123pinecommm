import React, { useState, useEffect } from 'react';
import { Award, Plus, Trash2, Calendar, Clock, MapPin, ShieldAlert, Sparkles, Filter, Edit3 } from 'lucide-react';
import { collection, onSnapshot, addDoc, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { ExamTimetableEntry, TIMETABLE_SUBJECTS } from '../types/schoolWindows';
import {
  getTodayDateString,
  isValidDateString,
  isDatePassed,
  formatDisplayDate
} from '../utils/schoolDateUtils';

interface ExamTimetableWindowProps {
  sessionRole?: string;
  sessionUserName?: string;
}

export const ExamTimetableWindow: React.FC<ExamTimetableWindowProps> = ({
  sessionRole,
  sessionUserName
}) => {
  const canEdit = sessionRole === 'HEAD' || sessionRole === 'IT_MANAGER';

  const [exams, setExams] = useState<ExamTimetableEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterLevel, setFilterLevel] = useState<'ALL' | 'AS' | 'A2'>('ALL');
  const [filterVenue, setFilterVenue] = useState<'ALL' | 'Watershed' | 'Local'>('ALL');

  // Form states (Head and IT Manager only)
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formDate, setFormDate] = useState('');
  const [formTime, setFormTime] = useState('08:30 – 11:30');
  const [formSubject, setFormSubject] = useState<string>(TIMETABLE_SUBJECTS[0]);
  const [formLevel, setFormLevel] = useState<'AS' | 'A2'>('AS');
  const [formVenue, setFormVenue] = useState<'Watershed' | 'Local'>('Local');
  const [formPaper, setFormPaper] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Real-time synchronization & automatic deletion of passed exam dates
  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'exam_timetables'), async (snap) => {
      const today = getTodayDateString();
      const items: ExamTimetableEntry[] = [];

      for (const docSnap of snap.docs) {
        const data = docSnap.data();
        const entry: ExamTimetableEntry = {
          id: docSnap.id,
          date: data.date || '',
          time: data.time || '',
          subject: data.subject || '',
          level: data.level || 'AS',
          venue: data.venue || 'Local',
          paperCode: data.paperCode || '',
          createdAt: data.createdAt || '',
          createdBy: data.createdBy || ''
        };

        // RULE: When date has passed or invalid, discard/delete entered information automatically
        if (entry.date && (isDatePassed(entry.date) || !isValidDateString(entry.date))) {
          try {
            await deleteDoc(doc(db, 'exam_timetables', entry.id));
          } catch (e) {
            console.warn('Failed to delete passed exam date:', e);
          }
        } else if (entry.date && isValidDateString(entry.date)) {
          items.push(entry);
        }
      }

      // Sort chronologically by date and time
      items.sort((a, b) => {
        const dDiff = a.date.localeCompare(b.date);
        if (dDiff !== 0) return dDiff;
        return a.time.localeCompare(b.time);
      });

      setExams(items);
      setLoading(false);
    });

    return () => unsub();
  }, []);

  const handleOpenAddModal = (entry?: ExamTimetableEntry) => {
    setFormError(null);
    if (entry) {
      setEditingId(entry.id);
      setFormDate(entry.date);
      setFormTime(entry.time);
      setFormSubject(entry.subject);
      setFormLevel(entry.level);
      setFormVenue(entry.venue);
      setFormPaper(entry.paperCode || '');
    } else {
      setEditingId(null);
      setFormDate(getTodayDateString());
      setFormTime('08:30 – 11:30');
      setFormSubject(TIMETABLE_SUBJECTS[0]);
      setFormLevel('AS');
      setFormVenue('Local');
      setFormPaper('');
    }
    setShowAddModal(true);
  };

  const handleSaveExam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canEdit) {
      setFormError('Access restricted: Only the School Head and IT Manager can edit the exam timetable.');
      return;
    }

    if (!formDate || !formTime.trim() || !formSubject) {
      setFormError('Please complete all required fields.');
      return;
    }

    if (!isValidDateString(formDate)) {
      setFormError('Please enter a valid calendar date in format YYYY-MM-DD.');
      return;
    }

    if (isDatePassed(formDate)) {
      setFormError('Cannot schedule an exam on a date that has already passed.');
      return;
    }

    setIsSubmitting(true);
    setFormError(null);

    try {
      if (editingId) {
        await updateDoc(doc(db, 'exam_timetables', editingId), {
          date: formDate,
          time: formTime.trim(),
          subject: formSubject,
          level: formLevel,
          venue: formVenue,
          paperCode: formPaper.trim(),
          updatedAt: new Date().toISOString(),
          updatedBy: sessionUserName || 'Admin'
        });
      } else {
        await addDoc(collection(db, 'exam_timetables'), {
          date: formDate,
          time: formTime.trim(),
          subject: formSubject,
          level: formLevel,
          venue: formVenue,
          paperCode: formPaper.trim(),
          createdAt: new Date().toISOString(),
          createdBy: sessionUserName || 'Admin'
        });
      }

      setShowAddModal(false);
    } catch (err: any) {
      setFormError(err.message || 'Failed to save exam schedule.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteExam = async (id: string, sub: string) => {
    if (!canEdit) return;
    if (!window.confirm(`Delete exam entry for ${sub}?`)) return;
    try {
      await deleteDoc(doc(db, 'exam_timetables', id));
    } catch (err) {
      console.error(err);
    }
  };

  // Filter items
  const filteredExams = exams.filter((e) => {
    if (filterLevel !== 'ALL' && e.level !== filterLevel) return false;
    if (filterVenue !== 'ALL' && e.venue !== filterVenue) return false;
    return true;
  });

  const today = getTodayDateString();

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-violet-700 via-purple-700 to-indigo-800 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute -top-12 -right-12 w-48 h-48 bg-white/10 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 text-xs font-black tracking-wider uppercase backdrop-blur-md">
              <Award className="w-3.5 h-3.5 text-purple-200" />
              <span>Official Examination Schedule</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight">
              (Final AS and A2 / End of term) Timetable
            </h2>
            <p className="text-purple-100 text-xs sm:text-sm max-w-xl">
              Official venue assignments (Watershed or Local) and time slots for AS and A2 examinations. Entries are automatically archived once dates pass.
            </p>
          </div>

          {canEdit && (
            <button
              onClick={() => handleOpenAddModal()}
              className="px-4 py-2.5 bg-white text-purple-900 hover:bg-purple-50 font-black text-xs rounded-2xl shadow-lg transition active:scale-95 flex items-center gap-2 shrink-0"
            >
              <Plus className="w-4 h-4 text-purple-700" />
              <span>Add Exam Session</span>
            </button>
          )}
        </div>

        <div className="relative z-10 mt-4 pt-4 border-t border-white/15 flex flex-wrap items-center justify-between text-[11px] text-purple-200">
          <span>Official viewable by everyone • Managed by School Head & IT Manager only</span>
          {canEdit && (
            <span className="font-bold text-amber-200 flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Exam Controller Privileges ({sessionRole})</span>
            </span>
          )}
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-3.5 rounded-2xl border border-purple-100 shadow-xs flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2 text-slate-700 font-bold">
          <Filter className="w-4 h-4 text-purple-600" />
          <span>Filter Examinations:</span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Level Filter */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
            {(['ALL', 'AS', 'A2'] as const).map((lvl) => (
              <button
                key={lvl}
                onClick={() => setFilterLevel(lvl)}
                className={`px-3 py-1 rounded-lg font-bold text-xs transition ${
                  filterLevel === lvl
                    ? 'bg-purple-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {lvl}
              </button>
            ))}
          </div>

          {/* Venue Filter */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
            {(['ALL', 'Watershed', 'Local'] as const).map((ven) => (
              <button
                key={ven}
                onClick={() => setFilterVenue(ven)}
                className={`px-3 py-1 rounded-lg font-bold text-xs transition ${
                  filterVenue === ven
                    ? 'bg-purple-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {ven}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main List */}
      {loading ? (
        <div className="p-12 text-center text-slate-500 font-mono text-xs">
          Loading examination schedule...
        </div>
      ) : filteredExams.length === 0 ? (
        /* Empty state: If none, state (None) */
        <div className="bg-white rounded-3xl border border-purple-100 p-12 text-center shadow-sm">
          <div className="w-16 h-16 rounded-full bg-purple-50 text-purple-600 mx-auto flex items-center justify-center mb-3">
            <Award className="w-8 h-8" />
          </div>
          <h3 className="text-base font-black text-slate-800">
            (None)
          </h3>
          <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
            There are currently no Final AS / A2 or end-of-term examinations scheduled.
          </p>
          {canEdit && (
            <button
              onClick={() => handleOpenAddModal()}
              className="mt-4 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs rounded-xl shadow-md transition"
            >
              Add First Examination
            </button>
          )}
        </div>
      ) : (
        /* Examinations Table / Grid */
        <div className="bg-white rounded-3xl border border-purple-100 shadow-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[700px]">
              <thead>
                <tr className="bg-purple-50/70 border-b border-purple-100 text-xs font-black text-purple-950 uppercase tracking-wider">
                  <th className="py-3.5 px-4">Date</th>
                  <th className="py-3.5 px-4">Time</th>
                  <th className="py-3.5 px-4">Subject</th>
                  <th className="py-3.5 px-4">Level</th>
                  <th className="py-3.5 px-4">Venue</th>
                  {canEdit && <th className="py-3.5 px-4 text-right">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-purple-50 text-xs">
                {filteredExams.map((entry) => {
                  const isToday = entry.date === today;
                  const formattedDate = formatDisplayDate(entry.date);

                  return (
                    <tr
                      key={entry.id}
                      className={`hover:bg-purple-50/40 transition ${
                        isToday ? 'bg-amber-50/40' : ''
                      }`}
                    >
                      {/* Date */}
                      <td className="py-3.5 px-4 font-bold text-slate-900 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-purple-600" />
                          <span>{formattedDate}</span>
                          {isToday && (
                            <span className="ml-1 px-1.5 py-0.5 rounded-full bg-amber-400 text-slate-950 font-black text-[9px] uppercase">
                              Today
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Time */}
                      <td className="py-3.5 px-4 font-mono font-bold text-slate-700 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 text-slate-400" />
                          <span>{entry.time}</span>
                        </div>
                      </td>

                      {/* Subject */}
                      <td className="py-3.5 px-4">
                        <div className="font-extrabold text-slate-900 text-sm">
                          {entry.subject}
                        </div>
                        {entry.paperCode && (
                          <div className="text-[10px] text-slate-400 font-mono">
                            Paper: {entry.paperCode}
                          </div>
                        )}
                      </td>

                      {/* Level: AS or A2 */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span
                          className={`px-2.5 py-1 rounded-full font-black text-xs border ${
                            entry.level === 'A2'
                              ? 'bg-purple-100 text-purple-900 border-purple-300'
                              : 'bg-blue-100 text-blue-900 border-blue-300'
                          }`}
                        >
                          {entry.level}
                        </span>
                      </td>

                      {/* Venue: Watershed or Local */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full font-bold text-xs border ${
                            entry.venue === 'Watershed'
                              ? 'bg-emerald-100 text-emerald-900 border-emerald-300'
                              : 'bg-amber-100 text-amber-900 border-amber-300'
                          }`}
                        >
                          <MapPin className="w-3 h-3" />
                          <span>{entry.venue}</span>
                        </span>
                      </td>

                      {/* Actions */}
                      {canEdit && (
                        <td className="py-3.5 px-4 text-right whitespace-nowrap">
                          <div className="inline-flex items-center gap-1">
                            <button
                              onClick={() => handleOpenAddModal(entry)}
                              className="p-1.5 text-slate-400 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition"
                              title="Edit exam"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteExam(entry.id, entry.subject)}
                              className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                              title="Delete exam"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal for adding/editing exam */}
      {showAddModal && canEdit && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200"
        >
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl border border-purple-100 relative animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-purple-100 mb-5">
              <div className="flex items-center gap-2">
                <Award className="w-5 h-5 text-purple-600" />
                <h3 className="text-lg font-black text-slate-900">
                  {editingId ? 'Edit Exam Session' : 'Schedule Final Exam Session'}
                </h3>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                ✕
              </button>
            </div>

            {formError && (
              <div className="mb-4 p-3 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs font-bold flex items-start gap-2">
                <ShieldAlert className="w-4 h-4 shrink-0 text-red-600 mt-0.5" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleSaveExam} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Examination Date *
                </label>
                <input
                  type="date"
                  required
                  min={today}
                  value={formDate}
                  onChange={(e) => setFormDate(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-purple-200 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Time Slot * (e.g. 08:30 – 11:30)
                </label>
                <input
                  type="text"
                  required
                  value={formTime}
                  onChange={(e) => setFormTime(e.target.value)}
                  placeholder="e.g. 08:30 – 11:30"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-purple-200 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 font-medium font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Subject *
                </label>
                <select
                  value={formSubject}
                  onChange={(e) => setFormSubject(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-purple-200 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  {TIMETABLE_SUBJECTS.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {/* Level: AS or A2 */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Level *
                  </label>
                  <select
                    value={formLevel}
                    onChange={(e) => setFormLevel(e.target.value as 'AS' | 'A2')}
                    className="w-full px-3 py-2.5 rounded-xl border border-purple-200 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="AS">AS Level</option>
                    <option value="A2">A2 Level</option>
                  </select>
                </div>

                {/* Venue: Watershed or Local */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Venue *
                  </label>
                  <select
                    value={formVenue}
                    onChange={(e) => setFormVenue(e.target.value as 'Watershed' | 'Local')}
                    className="w-full px-3 py-2.5 rounded-xl border border-purple-200 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="Watershed">Watershed</option>
                    <option value="Local">Local (USAP Campus)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Paper Code / Additional Details (Optional)
                </label>
                <input
                  type="text"
                  value={formPaper}
                  onChange={(e) => setFormPaper(e.target.value)}
                  placeholder="e.g. Paper 1, Multiple Choice, Practical"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-purple-200 text-xs focus:outline-none focus:ring-2 focus:ring-purple-500 font-medium"
                />
              </div>

              <div className="pt-3 flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold shadow-md transition disabled:opacity-50"
                >
                  {isSubmitting ? 'Saving...' : editingId ? 'Update Exam' : 'Save Exam'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
