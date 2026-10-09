import React, { useState, useEffect } from 'react';
import { Utensils, Calendar, Plus, Trash2, Edit3, ShieldAlert, Sparkles, CheckCircle2 } from 'lucide-react';
import { doc, onSnapshot, setDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { WeeklyDutyDoc, DailyDutyItem } from '../types/schoolWindows';
import {
  getTodayDateString,
  formatDateToISO,
  isValidDateString,
  isDatePassed,
  formatDisplayDate,
  parseValidDate
} from '../utils/schoolDateUtils';

interface WeeklyDutyWindowProps {
  sessionRole?: string;
  sessionUserName?: string;
}

const DUTY_DOC_ID = 'usap_current_weekly_duty';

const DAYS_OF_WEEK: ('Sunday' | 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday')[] = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday'
];

export const WeeklyDutyWindow: React.FC<WeeklyDutyWindowProps> = ({
  sessionRole,
  sessionUserName
}) => {
  const canEdit = sessionRole === 'HEAD' || sessionRole === 'IT_MANAGER';

  const [weeklyDuty, setWeeklyDuty] = useState<WeeklyDutyDoc | null>(null);
  const [loading, setLoading] = useState(true);
  const [showEditModal, setShowEditModal] = useState(false);
  const [formDays, setFormDays] = useState<DailyDutyItem[]>([]);
  const [weekLabel, setWeekLabel] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Helper to generate current week's starting Sunday or Monday
  const getSuggestedDates = (startingFromDate?: string) => {
    const base = startingFromDate ? parseValidDate(startingFromDate) : new Date();
    const currentDay = base.getDay(); // 0 is Sun
    const startSunday = new Date(base);
    startSunday.setDate(base.getDate() - currentDay);

    return DAYS_OF_WEEK.map((dayName, idx) => {
      const d = new Date(startSunday);
      d.setDate(startSunday.getDate() + idx);
      const iso = formatDateToISO(d);
      return {
        dayName,
        date: iso,
        advisoryGroup: `Advisory Group ${idx + 1}`,
        notes: 'Breakfast, Lunch & Dinner plates wash & wipe'
      };
    });
  };

  // Real-time synchronization & automatic discarding of passed days
  useEffect(() => {
    const unsub = onSnapshot(doc(db, 'weekly_duties', DUTY_DOC_ID), async (snap) => {
      if (snap.exists()) {
        const data = snap.data() as WeeklyDutyDoc;
        const today = getTodayDateString();

        // RULE: When the day has passed, discard the advisory group on plates duty whose day has passed.
        const activeDays = (data.days || []).filter((d) => d.date && isValidDateString(d.date) && !isDatePassed(d.date));

        if (activeDays.length !== (data.days || []).length) {
          try {
            if (activeDays.length === 0) {
              // Entire week has passed, discard the weekly duty document
              await deleteDoc(doc(db, 'weekly_duties', DUTY_DOC_ID));
              setWeeklyDuty(null);
            } else {
              // Update doc with remaining active days
              await setDoc(doc(db, 'weekly_duties', DUTY_DOC_ID), {
                ...data,
                days: activeDays,
                updatedAt: new Date().toISOString()
              });
              setWeeklyDuty({ ...data, days: activeDays });
            }
          } catch (e) {
            console.warn('Failed to prune passed plates duty days:', e);
            setWeeklyDuty({ ...data, days: activeDays });
          }
        } else {
          setWeeklyDuty(data);
        }
      } else {
        setWeeklyDuty(null);
      }
      setLoading(false);
    });

    return () => unsub();
  }, []);

  const handleOpenEditModal = () => {
    setFormError(null);
    if (weeklyDuty && weeklyDuty.days && weeklyDuty.days.length > 0) {
      setFormDays(JSON.parse(JSON.stringify(weeklyDuty.days)));
      setWeekLabel(weeklyDuty.weekLabel || 'Current Academic Week');
    } else {
      const suggested = getSuggestedDates();
      setFormDays(suggested);
      const now = new Date();
      setWeekLabel(`Week of ${now.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`);
    }
    setShowEditModal(true);
  };

  const handleDayGroupChange = (idx: number, group: string) => {
    setFormDays((prev) => {
      const copy = [...prev];
      copy[idx].advisoryGroup = group;
      return copy;
    });
  };

  const handleDayDateChange = (idx: number, newDate: string) => {
    setFormDays((prev) => {
      const copy = [...prev];
      copy[idx].date = newDate;
      return copy;
    });
  };

  const handleDayNotesChange = (idx: number, notes: string) => {
    setFormDays((prev) => {
      const copy = [...prev];
      copy[idx].notes = notes;
      return copy;
    });
  };

  const handleSaveDuty = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canEdit) {
      setFormError('Access restricted: Only the School Head and IT Manager can edit weekly duty.');
      return;
    }

    const today = getTodayDateString();
    // Filter out any days already passed upon input or with invalid dates
    const validDays = formDays.filter((d) => d.date && isValidDateString(d.date) && !isDatePassed(d.date));

    if (validDays.length === 0) {
      setFormError('All selected days are in the past or invalid. Please select valid dates for the current or upcoming week.');
      return;
    }

    setIsSubmitting(true);
    setFormError(null);

    try {
      const dutyDoc: WeeklyDutyDoc = {
        id: DUTY_DOC_ID,
        weekLabel: weekLabel.trim() || 'Current Week Plates Duty',
        weekStartDate: validDays[0].date,
        days: validDays,
        updatedAt: new Date().toISOString(),
        updatedBy: sessionUserName || 'Admin'
      };

      await setDoc(doc(db, 'weekly_duties', DUTY_DOC_ID), dutyDoc);
      setShowEditModal(false);
    } catch (err: any) {
      setFormError(err.message || 'Failed to save weekly duty roster.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteDuty = async () => {
    if (!canEdit) return;
    if (!window.confirm('Are you sure you want to discard the current weekly plates duty schedule?')) return;
    try {
      await deleteDoc(doc(db, 'weekly_duties', DUTY_DOC_ID));
    } catch (err) {
      console.error(err);
    }
  };

  const today = getTodayDateString();
  const activeDays = weeklyDuty?.days || [];

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-amber-600 via-orange-600 to-rose-600 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute -top-12 -right-12 w-48 h-48 bg-white/10 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 text-xs font-black tracking-wider uppercase backdrop-blur-md">
              <Utensils className="w-3.5 h-3.5 text-amber-200" />
              <span>Dining Hall & Community Service</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight">
              Weekly Duty (Plates Duty)
            </h2>
            <p className="text-amber-100 text-xs sm:text-sm max-w-xl">
              Advisory groups assigned on plates duty for Sunday through Saturday. Passed days are automatically pruned each midnight.
            </p>
          </div>

          {canEdit && (
            <div className="flex items-center gap-2 shrink-0">
              {weeklyDuty && (
                <button
                  onClick={handleDeleteDuty}
                  className="px-3.5 py-2.5 bg-red-500/20 hover:bg-red-500/30 text-white border border-red-300/30 font-bold text-xs rounded-2xl transition"
                >
                  Discard Roster
                </button>
              )}
              <button
                onClick={handleOpenEditModal}
                className="px-4 py-2.5 bg-white text-orange-950 hover:bg-amber-50 font-black text-xs rounded-2xl shadow-lg transition active:scale-95 flex items-center gap-2"
              >
                <Plus className="w-4 h-4 text-orange-600" />
                <span>{weeklyDuty ? 'Update Duty Roster' : 'Input Weekly Duty'}</span>
              </button>
            </div>
          )}
        </div>

        <div className="relative z-10 mt-4 pt-4 border-t border-white/15 flex flex-wrap items-center justify-between text-[11px] text-amber-100">
          <span>Displayed to everyone • Inputted Sunday/Monday by School Head & IT Manager only</span>
          {canEdit && (
            <span className="font-bold text-amber-200 flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Roster Editor Mode ({sessionRole})</span>
            </span>
          )}
        </div>
      </div>

      {/* Main Roster Display */}
      {loading ? (
        <div className="p-12 text-center text-slate-500 font-mono text-xs">
          Loading weekly duty schedule...
        </div>
      ) : !weeklyDuty || activeDays.length === 0 ? (
        /* Empty state: If none, state (None) */
        <div className="bg-white rounded-3xl border border-amber-100 p-12 text-center shadow-sm">
          <div className="w-16 h-16 rounded-full bg-amber-50 text-amber-600 mx-auto flex items-center justify-center mb-3">
            <Utensils className="w-8 h-8" />
          </div>
          <h3 className="text-base font-black text-slate-800">
            (None)
          </h3>
          <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
            No active plates duty roster has been published for this week yet.
          </p>
          {canEdit && (
            <button
              onClick={handleOpenEditModal}
              className="mt-4 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl shadow-md transition"
            >
              Input Weekly Duty Roster
            </button>
          )}
        </div>
      ) : (
        /* Daily Duty Cards */
        <div className="space-y-4">
          <div className="flex items-center justify-between text-xs font-bold text-slate-600 px-1">
            <span>{weeklyDuty.weekLabel}</span>
            <span className="text-[11px] text-amber-700 font-mono font-normal">
              Showing active days (passed days automatically discarded)
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {activeDays.map((item) => {
              const isToday = item.date === today;
              const formattedDate = formatDisplayDate(item.date, {
                month: 'short',
                day: 'numeric'
              });

              return (
                <div
                  key={`${item.dayName}-${item.date}`}
                  className={`p-5 rounded-3xl border transition-all duration-200 bg-white relative overflow-hidden ${
                    isToday
                      ? 'border-amber-400 ring-2 ring-amber-300/50 shadow-lg shadow-amber-100'
                      : 'border-slate-200 hover:border-slate-300 shadow-sm'
                  }`}
                >
                  {isToday && (
                    <div className="absolute top-0 right-0 bg-amber-500 text-white text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-bl-xl shadow-sm flex items-center gap-1">
                      <Sparkles className="w-3 h-3" />
                      <span>On Duty Today!</span>
                    </div>
                  )}

                  <div className="flex items-center gap-3 mb-3">
                    <div
                      className={`w-11 h-11 rounded-2xl flex items-center justify-center font-bold text-base shrink-0 ${
                        isToday
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      <Utensils className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-base font-black text-slate-900 leading-snug">
                        {item.dayName}
                      </div>
                      <div className="text-xs text-slate-500 font-medium">
                        {formattedDate}
                      </div>
                    </div>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-amber-50/80 border border-amber-200/70 mb-2">
                    <div className="text-[10px] font-mono uppercase tracking-wider text-amber-800 font-extrabold mb-0.5">
                      Assigned Advisory Group
                    </div>
                    <div className="text-sm font-black text-slate-900">
                      {item.advisoryGroup}
                    </div>
                  </div>

                  {item.notes && (
                    <div className="text-[11px] text-slate-500 font-medium leading-relaxed">
                      {item.notes}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Edit Modal (Head & IT Manager only) */}
      {showEditModal && canEdit && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200"
        >
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-xl w-full shadow-2xl border border-amber-100 relative max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-amber-100 mb-5">
              <div className="flex items-center gap-2">
                <Utensils className="w-5 h-5 text-amber-600" />
                <h3 className="text-lg font-black text-slate-900">
                  Configure Weekly Plates Duty Roster
                </h3>
              </div>
              <button
                onClick={() => setShowEditModal(false)}
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

            <form onSubmit={handleSaveDuty} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Week Title / Description
                </label>
                <input
                  type="text"
                  required
                  value={weekLabel}
                  onChange={(e) => setWeekLabel(e.target.value)}
                  placeholder="e.g. Week of Oct 5 – Oct 11, 2026"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-amber-200 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 font-medium"
                />
              </div>

              <div className="space-y-3 pt-2">
                <div className="text-xs font-black text-slate-800 uppercase tracking-wider">
                  Daily Advisory Group Assignments
                </div>

                {formDays.map((d, idx) => (
                  <div
                    key={d.dayName}
                    className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-black text-xs text-slate-900 w-24">
                        {d.dayName}
                      </span>
                      <input
                        type="date"
                        value={d.date}
                        min={today}
                        onChange={(e) => handleDayDateChange(idx, e.target.value)}
                        className="px-2 py-1 rounded-lg border border-slate-300 text-xs font-mono font-medium"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <input
                        type="text"
                        required
                        value={d.advisoryGroup}
                        onChange={(e) => handleDayGroupChange(idx, e.target.value)}
                        placeholder="Advisory Group (e.g. Group 1, Mr Mangara)"
                        className="px-3 py-1.5 rounded-xl border border-slate-300 text-xs font-bold bg-white"
                      />
                      <input
                        type="text"
                        value={d.notes || ''}
                        onChange={(e) => handleDayNotesChange(idx, e.target.value)}
                        placeholder="Duty notes (e.g. Breakfast, Lunch, Dinner)"
                        className="px-3 py-1.5 rounded-xl border border-slate-300 text-xs bg-white text-slate-600"
                      />
                    </div>
                  </div>
                ))}
              </div>

              <div className="pt-4 flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shadow-md transition disabled:opacity-50"
                >
                  {isSubmitting ? 'Saving Roster...' : 'Save Weekly Duty'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
