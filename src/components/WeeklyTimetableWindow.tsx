import React, { useState, useEffect } from 'react';
import { CalendarDays, Plus, Trash2, Edit3, Save, X, RotateCcw, ShieldAlert, Sparkles, BookOpen } from 'lucide-react';
import { doc, onSnapshot, setDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { WeeklyTimetableDoc, WeeklyTimetableSlot, TIMETABLE_SUBJECTS, DEFAULT_WEEKLY_SLOTS } from '../types/schoolWindows';

interface WeeklyTimetableWindowProps {
  sessionRole?: string;
  sessionUserName?: string;
}

const TIMETABLE_DOC_ID = 'usap_weekly_class_timetable';

// Visual color mapping for subjects
const getSubjectColor = (sub: string) => {
  switch (sub) {
    case 'Mathematics':
      return 'bg-blue-50 text-blue-800 border-blue-200';
    case 'Physics':
      return 'bg-indigo-50 text-indigo-800 border-indigo-200';
    case 'Chemistry':
      return 'bg-amber-50 text-amber-900 border-amber-200';
    case 'Biology':
      return 'bg-emerald-50 text-emerald-800 border-emerald-200';
    case 'Computers':
      return 'bg-cyan-50 text-cyan-800 border-cyan-200';
    case 'Humanities':
      return 'bg-rose-50 text-rose-800 border-rose-200';
    case 'Research Methods':
      return 'bg-orange-50 text-orange-900 border-orange-200';
    case 'College Counseling':
      return 'bg-purple-100 text-purple-900 border-purple-300 font-extrabold shadow-2xs';
    case 'Capstone':
      return 'bg-teal-100 text-teal-900 border-teal-300 font-extrabold shadow-2xs';
    case 'Snack':
      return 'bg-amber-100 text-amber-950 border-amber-300 font-extrabold shadow-2xs';
    case 'Lunch':
      return 'bg-orange-100 text-orange-950 border-orange-300 font-extrabold shadow-2xs';
    case 'Assembly / Advisory':
      return 'bg-slate-100 text-slate-800 border-slate-300 font-bold';
    default:
      return 'bg-slate-50 text-slate-600 border-slate-200';
  }
};

export const WeeklyTimetableWindow: React.FC<WeeklyTimetableWindowProps> = ({
  sessionRole,
  sessionUserName
}) => {
  const canEdit = sessionRole === 'HEAD' || sessionRole === 'IT_MANAGER';

  const [timetable, setTimetable] = useState<WeeklyTimetableDoc | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editSlots, setEditSlots] = useState<WeeklyTimetableSlot[]>([]);
  const [saveStatus, setSaveStatus] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Real-time synchronization
  useEffect(() => {
    const unsub = onSnapshot(doc(db, 'weekly_timetables', TIMETABLE_DOC_ID), (snap) => {
      if (snap.exists()) {
        const data = snap.data() as WeeklyTimetableDoc;
        setTimetable(data);
        if (!isEditing) {
          setEditSlots(data.slots || []);
        }
      } else {
        setTimetable(null);
      }
      setLoading(false);
    });

    return () => unsub();
  }, [isEditing]);

  const handleStartEditing = () => {
    if (!canEdit) return;
    setErrorMsg(null);
    setSaveStatus(null);
    if (timetable && timetable.slots && timetable.slots.length > 0) {
      setEditSlots(JSON.parse(JSON.stringify(timetable.slots)));
    } else {
      setEditSlots(JSON.parse(JSON.stringify(DEFAULT_WEEKLY_SLOTS)));
    }
    setIsEditing(true);
  };

  const handleCellChange = (slotId: string, day: 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday', value: string) => {
    setEditSlots((prev) =>
      prev.map((slot) => (slot.id === slotId ? { ...slot, [day]: value } : slot))
    );
  };

  const handleTimeChange = (slotId: string, newTime: string) => {
    setEditSlots((prev) =>
      prev.map((slot) => (slot.id === slotId ? { ...slot, time: newTime } : slot))
    );
  };

  const handleAddRow = () => {
    const newSlot: WeeklyTimetableSlot = {
      id: `slot_${Date.now()}`,
      time: '16:30 – 17:30',
      label: `Period ${editSlots.length + 1}`,
      monday: 'Study / Free Period',
      tuesday: 'Study / Free Period',
      wednesday: 'Study / Free Period',
      thursday: 'Study / Free Period',
      friday: 'Study / Free Period'
    };
    setEditSlots((prev) => [...prev, newSlot]);
  };

  const handleRemoveRow = (slotId: string) => {
    setEditSlots((prev) => prev.filter((s) => s.id !== slotId));
  };

  const handleSave = async () => {
    if (!canEdit) {
      setErrorMsg('Access restricted: Only the School Head and IT Manager can edit the timetable.');
      return;
    }

    try {
      const docData: WeeklyTimetableDoc = {
        id: TIMETABLE_DOC_ID,
        title: 'USAP Weekly Academic Timetable (Monday – Friday)',
        targetClass: 'ALL CLASSES',
        slots: editSlots,
        updatedAt: new Date().toISOString(),
        updatedBy: sessionUserName || 'Admin'
      };

      await setDoc(doc(db, 'weekly_timetables', TIMETABLE_DOC_ID), docData);
      setIsEditing(false);
      setSaveStatus('Timetable saved successfully!');
      setTimeout(() => setSaveStatus(null), 3000);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to save timetable.');
    }
  };

  const handleDeleteTimetable = async () => {
    if (!canEdit) return;
    if (!window.confirm('Are you sure you want to delete the entire weekly timetable?')) return;
    try {
      await deleteDoc(doc(db, 'weekly_timetables', TIMETABLE_DOC_ID));
      setIsEditing(false);
      setSaveStatus('Timetable deleted.');
    } catch (err) {
      console.error(err);
    }
  };

  const handleLoadDefaults = () => {
    setEditSlots(JSON.parse(JSON.stringify(DEFAULT_WEEKLY_SLOTS)));
  };

  const displaySlots = isEditing ? editSlots : (timetable?.slots || []);

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-700 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute -top-12 -right-12 w-48 h-48 bg-white/10 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 text-xs font-black tracking-wider uppercase backdrop-blur-md">
              <CalendarDays className="w-3.5 h-3.5 text-emerald-200" />
              <span>Monday to Friday Schedule</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight">
              Weekly Timetable
            </h2>
            <p className="text-teal-100 text-xs sm:text-sm max-w-xl">
              Official academic schedule including College Counseling, Capstone, and Core Subjects. Persists week-to-week.
            </p>
          </div>

          {/* Action buttons for Head & IT Manager */}
          {canEdit && (
            <div className="flex flex-wrap items-center gap-2 shrink-0">
              {isEditing ? (
                <>
                  <button
                    onClick={handleAddRow}
                    className="px-3.5 py-2 bg-white/20 hover:bg-white/30 text-white font-bold text-xs rounded-xl transition flex items-center gap-1.5"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Row</span>
                  </button>
                  <button
                    onClick={handleLoadDefaults}
                    className="px-3.5 py-2 bg-white/20 hover:bg-white/30 text-white font-bold text-xs rounded-xl transition flex items-center gap-1.5"
                    title="Load standard school template"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Reset Template</span>
                  </button>
                  <button
                    onClick={() => setIsEditing(false)}
                    className="px-3.5 py-2 bg-white/10 hover:bg-white/20 text-white font-bold text-xs rounded-xl transition flex items-center gap-1"
                  >
                    <X className="w-3.5 h-3.5" />
                    <span>Cancel</span>
                  </button>
                  <button
                    onClick={handleSave}
                    className="px-4 py-2 bg-white text-emerald-900 hover:bg-emerald-50 font-black text-xs rounded-xl shadow-lg transition active:scale-95 flex items-center gap-1.5"
                  >
                    <Save className="w-3.5 h-3.5 text-emerald-700" />
                    <span>Save Spreadsheet</span>
                  </button>
                </>
              ) : (
                <>
                  {timetable && (
                    <button
                      onClick={handleDeleteTimetable}
                      className="px-3 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-100 border border-red-300/30 font-bold text-xs rounded-xl transition flex items-center gap-1"
                      title="Delete Timetable"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Delete</span>
                    </button>
                  )}
                  <button
                    onClick={handleStartEditing}
                    className="px-4 py-2.5 bg-white text-teal-900 hover:bg-teal-50 font-black text-xs rounded-2xl shadow-lg transition active:scale-95 flex items-center gap-2"
                  >
                    <Edit3 className="w-4 h-4 text-teal-700" />
                    <span>{timetable ? 'Edit Timetable Spreadsheet' : 'Create Weekly Timetable'}</span>
                  </button>
                </>
              )}
            </div>
          )}
        </div>

        {/* Status / Role Info */}
        <div className="relative z-10 mt-4 pt-4 border-t border-white/15 flex flex-wrap items-center justify-between text-[11px] text-teal-100">
          <span>Spreadsheet viewed by everyone • Editable and deletable by School Head & IT Manager only</span>
          {canEdit && (
            <span className="font-bold text-amber-200 flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Full Manager Controls ({sessionRole})</span>
            </span>
          )}
        </div>
      </div>

      {saveStatus && (
        <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{saveStatus}</span>
        </div>
      )}

      {errorMsg && (
        <div className="p-3.5 rounded-2xl bg-red-50 border border-red-200 text-red-800 text-xs font-bold flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 text-red-600 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Spreadsheet Main Window */}
      {loading ? (
        <div className="p-12 text-center text-slate-500 font-mono text-xs">
          Loading weekly timetable...
        </div>
      ) : displaySlots.length === 0 && !isEditing ? (
        /* Empty state: If none, state (None) */
        <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center shadow-sm">
          <div className="w-16 h-16 rounded-full bg-teal-50 text-teal-600 mx-auto flex items-center justify-center mb-3">
            <BookOpen className="w-8 h-8" />
          </div>
          <h3 className="text-base font-black text-slate-800">
            (None)
          </h3>
          <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
            No weekly academic timetable has been uploaded by the School Head or IT Manager yet.
          </p>
          {canEdit && (
            <button
              onClick={handleStartEditing}
              className="mt-4 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs rounded-xl shadow-md transition"
            >
              Initialize Weekly Timetable
            </button>
          )}
        </div>
      ) : (
        /* Monday to Friday Responsive Spreadsheet */
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden">
          <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2 text-xs">
            <div className="font-extrabold text-slate-800 flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-teal-500" />
              <span>USAP ACADEMIC TIMETABLE (MON – FRI SPREADSHEET)</span>
            </div>
            {isEditing ? (
              <span className="text-amber-700 bg-amber-50 px-2.5 py-1 rounded-full font-bold text-[11px] border border-amber-200">
                Editing Mode Active • Select subjects from intersections
              </span>
            ) : (
              <span className="text-slate-500 text-[11px]">
                Last updated: {timetable?.updatedAt ? new Date(timetable.updatedAt).toLocaleDateString() : 'Active'}
              </span>
            )}
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[760px]">
              <thead>
                <tr className="bg-slate-100/80 border-b border-slate-200 text-xs font-black text-slate-700 uppercase tracking-wider">
                  <th className="py-3.5 px-4 w-36 border-r border-slate-200 bg-slate-200/50">
                    Time Column
                  </th>
                  <th className="py-3.5 px-4 border-r border-slate-200">Monday</th>
                  <th className="py-3.5 px-4 border-r border-slate-200">Tuesday</th>
                  <th className="py-3.5 px-4 border-r border-slate-200">Wednesday</th>
                  <th className="py-3.5 px-4 border-r border-slate-200">Thursday</th>
                  <th className="py-3.5 px-4">Friday</th>
                  {isEditing && <th className="py-3.5 px-2 w-12 text-center">Row</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {displaySlots.map((slot, idx) => (
                  <tr
                    key={slot.id || idx}
                    className={`hover:bg-slate-50/80 transition ${
                      idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/40'
                    }`}
                  >
                    {/* Time Column */}
                    <td className="py-3 px-4 font-mono font-bold text-slate-800 border-r border-slate-200 bg-slate-50/60 whitespace-nowrap">
                      {isEditing ? (
                        <input
                          type="text"
                          value={slot.time}
                          onChange={(e) => handleTimeChange(slot.id, e.target.value)}
                          className="w-full px-2 py-1 rounded-lg border border-slate-300 text-xs font-mono font-bold focus:ring-1 focus:ring-teal-500"
                        />
                      ) : (
                        <div className="space-y-0.5">
                          <div className="text-[10px] text-slate-400 font-sans uppercase tracking-wider font-semibold">
                            {slot.label || `Period ${idx + 1}`}
                          </div>
                          <div>{slot.time}</div>
                        </div>
                      )}
                    </td>

                    {/* Monday to Friday Intersections */}
                    {(['monday', 'tuesday', 'wednesday', 'thursday', 'friday'] as const).map((dayKey) => {
                      const subject = slot[dayKey];
                      return (
                        <td
                          key={dayKey}
                          className="py-2.5 px-3 border-r border-slate-200 last:border-r-0 align-middle"
                        >
                          {isEditing ? (
                            <select
                              value={subject}
                              onChange={(e) => handleCellChange(slot.id, dayKey, e.target.value)}
                              className="w-full p-1.5 rounded-lg border border-slate-300 text-xs font-semibold focus:ring-1 focus:ring-teal-500 bg-white"
                            >
                              {TIMETABLE_SUBJECTS.map((s) => (
                                <option key={s} value={s}>
                                  {s}
                                </option>
                              ))}
                            </select>
                          ) : (
                            <div
                              className={`p-2 rounded-xl border text-xs font-bold leading-tight ${getSubjectColor(
                                subject
                              )}`}
                            >
                              {subject}
                            </div>
                          )}
                        </td>
                      );
                    })}

                    {/* Remove Row in Edit Mode */}
                    {isEditing && (
                      <td className="py-2.5 px-2 text-center align-middle">
                        <button
                          onClick={() => handleRemoveRow(slot.id)}
                          className="p-1 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50"
                          title="Remove time block"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
