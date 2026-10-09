import React, { useState, useEffect, useMemo } from 'react';
import { Cake, Calendar, Plus, Trash2, Edit3, ShieldAlert, Sparkles, CheckCircle2 } from 'lucide-react';
import { collection, onSnapshot, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../firebase';
import { BirthdayItem } from '../types/schoolWindows';
import {
  getWeekOfLabel,
  getTodayDateString,
  isValidDateString,
  normalizeBirthdayDate,
  formatDisplayDate,
  isDatePassed
} from '../utils/schoolDateUtils';

interface BirthdaysWindowProps {
  sessionRole?: string;
  sessionUserName?: string;
}

export const BirthdaysWindow: React.FC<BirthdaysWindowProps> = ({
  sessionRole,
  sessionUserName
}) => {
  const canEdit = sessionRole === 'HEAD' || sessionRole === 'IT_MANAGER';

  const [birthdays, setBirthdays] = useState<BirthdayItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Form states (Head and IT Manager only)
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formName, setFormName] = useState('');
  const [formDate, setFormDate] = useState('');
  const [formRole, setFormRole] = useState('Student');
  const [formClass, setFormClass] = useState('LOWER 6X');
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Real-time synchronization & automatic deletion of passed birthdays
  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'birthdays'), async (snap) => {
      const today = getTodayDateString();
      const items: BirthdayItem[] = [];

      for (const docSnap of snap.docs) {
        const data = docSnap.data();
        const item: BirthdayItem = {
          id: docSnap.id,
          name: data.name || '',
          date: data.date || '',
          role: data.role || 'Community Member',
          schoolClass: data.schoolClass || '',
          createdAt: data.createdAt || '',
          createdBy: data.createdBy || ''
        };

        // RULE: The birthday detail is deleted automatically when the day has passed.
        // If inputted birthday has passed or is invalid, delete automatically.
        if (item.date && (isDatePassed(item.date) || !isValidDateString(item.date))) {
          try {
            await deleteDoc(doc(db, 'birthdays', item.id));
          } catch (e) {
            console.warn('Failed to auto-delete passed birthday:', e);
          }
        } else if (item.date && isValidDateString(item.date)) {
          items.push(item);
        }
      }

      // Sort upcoming birthdays chronologically
      items.sort((a, b) => a.date.localeCompare(b.date));
      setBirthdays(items);
      setLoading(false);
    });

    return () => unsub();
  }, []);

  const today = getTodayDateString();
  const currentWeekTitle = `Birthdays for week of ${getWeekOfLabel(today)}`;

  // RULE: Group birthdays weekly, e.g. "Birthdays for week of 4 October 2026"
  const weeklyBirthdayGroups = useMemo(() => {
    const groups: { weekTitle: string; items: BirthdayItem[] }[] = [];
    const map = new Map<string, BirthdayItem[]>();

    birthdays.forEach((b) => {
      const title = `Birthdays for week of ${getWeekOfLabel(b.date)}`;
      if (!map.has(title)) {
        map.set(title, []);
      }
      map.get(title)!.push(b);
    });

    map.forEach((items, weekTitle) => {
      groups.push({ weekTitle, items });
    });

    return groups;
  }, [birthdays]);

  const handleOpenAddModal = (item?: BirthdayItem) => {
    setFormError(null);
    if (item) {
      setEditingId(item.id);
      setFormName(item.name);
      setFormDate(item.date);
      setFormRole(item.role || 'Student');
      setFormClass(item.schoolClass || 'LOWER 6X');
    } else {
      setEditingId(null);
      setFormName('');
      setFormDate(getTodayDateString());
      setFormRole('Student');
      setFormClass('LOWER 6X');
    }
    setShowAddModal(true);
  };

  const handleSaveBirthday = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canEdit) {
      setFormError('Access restricted: Only the Head and IT Manager can edit birthdays.');
      return;
    }

    const cleanName = formName.trim();
    if (!cleanName || !formDate) {
      setFormError('Please enter both the name of the individual and their birthday date.');
      return;
    }

    if (!isValidDateString(formDate)) {
      setFormError('Please enter a valid calendar date in format YYYY-MM-DD.');
      return;
    }

    // Automatically normalize birth-year inputs (e.g. 2008-10-15 -> 2026-10-15)
    const { normalizedDate } = normalizeBirthdayDate(formDate);

    // RULE: If inputted birthday has passed, reject passed dates
    if (isDatePassed(normalizedDate)) {
      setFormError('The selected birthday date has already passed. Only current or upcoming birthdays can be saved.');
      return;
    }

    setIsSubmitting(true);
    setFormError(null);

    try {
      if (editingId) {
        await updateDoc(doc(db, 'birthdays', editingId), {
          name: cleanName,
          date: normalizedDate,
          role: formRole,
          schoolClass: formRole === 'Student' ? formClass : '',
          updatedAt: new Date().toISOString(),
          updatedBy: sessionUserName || 'Admin'
        });
      } else {
        await addDoc(collection(db, 'birthdays'), {
          name: cleanName,
          date: normalizedDate,
          role: formRole,
          schoolClass: formRole === 'Student' ? formClass : '',
          createdAt: new Date().toISOString(),
          createdBy: sessionUserName || 'Admin'
        });
      }

      setShowAddModal(false);
    } catch (err: any) {
      setFormError(err.message || 'Failed to save birthday detail.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteBirthday = async (id: string, name: string) => {
    if (!canEdit) return;
    if (!window.confirm(`Are you sure you want to remove the birthday for ${name}?`)) return;
    try {
      await deleteDoc(doc(db, 'birthdays', id));
    } catch (err) {
      console.error('Failed to delete birthday:', err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-pink-500 via-purple-600 to-indigo-600 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute -top-12 -right-12 w-48 h-48 bg-white/10 rounded-full blur-2xl pointer-events-none" />
        
        <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 text-xs font-black tracking-wider uppercase backdrop-blur-md">
              <Cake className="w-3.5 h-3.5 text-pink-200" />
              <span>Campus Celebrations</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight">
              {currentWeekTitle}
            </h2>
            <p className="text-pink-100 text-xs sm:text-sm max-w-xl">
              Celebrating our students, faculty, and community members weekly. Birthdays are automatically archived once the day has passed.
            </p>
          </div>

          {/* Action button for Head & IT Manager */}
          {canEdit && (
            <button
              onClick={() => handleOpenAddModal()}
              className="px-4 py-2.5 bg-white text-purple-900 hover:bg-pink-50 font-black text-xs rounded-2xl shadow-lg transition active:scale-95 flex items-center gap-2 shrink-0"
            >
              <Plus className="w-4 h-4 text-purple-600" />
              <span>Add Birthday</span>
            </button>
          )}
        </div>

        {/* Role Notice */}
        <div className="relative z-10 mt-4 pt-4 border-t border-white/15 flex flex-wrap items-center justify-between text-[11px] text-pink-100">
          <span>Window valid to everyone • Managed exclusively by School Head & IT Manager</span>
          {canEdit && (
            <span className="font-bold text-amber-200 flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Editor Access Enabled ({sessionRole})</span>
            </span>
          )}
        </div>
      </div>

      {/* Main Content Area */}
      {loading ? (
        <div className="p-12 text-center text-slate-500 font-mono text-xs">
          Loading upcoming birthdays...
        </div>
      ) : birthdays.length === 0 ? (
        /* RULE: If non entered state "(No upcoming birthday)" */
        <div className="bg-white rounded-3xl border border-pink-100 p-12 text-center shadow-sm">
          <div className="w-16 h-16 rounded-full bg-pink-50 text-pink-400 mx-auto flex items-center justify-center mb-3">
            <Cake className="w-8 h-8" />
          </div>
          <h3 className="text-base font-black text-slate-800">
            (No upcoming birthday)
          </h3>
          <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
            There are currently no upcoming birthdays scheduled in the system.
          </p>
          {canEdit && (
            <button
              onClick={() => handleOpenAddModal()}
              className="mt-4 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs rounded-xl shadow-md transition"
            >
              Add the first birthday
            </button>
          )}
        </div>
      ) : (
        /* Weekly Birthdays Groups (e.g. Birthdays for week of 4 October 2026) */
        <div className="space-y-8">
          {weeklyBirthdayGroups.map((group) => (
            <div key={group.weekTitle} className="space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-pink-200">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-pink-600" />
                  <h3 className="text-base font-black text-slate-900 tracking-tight">
                    {group.weekTitle}
                  </h3>
                </div>
                <span className="text-xs bg-pink-100 text-pink-800 font-extrabold px-2.5 py-0.5 rounded-full">
                  {group.items.length} {group.items.length === 1 ? 'Birthday' : 'Birthdays'}
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {group.items.map((item) => {
                  const isToday = item.date === today;
                  const formattedDate = formatDisplayDate(item.date, {
                    weekday: 'short',
                    month: 'short',
                    day: 'numeric'
                  });

                  return (
                    <div
                      key={item.id}
                      className={`p-5 rounded-3xl border transition-all duration-200 relative overflow-hidden bg-white ${
                        isToday
                          ? 'border-pink-400 ring-2 ring-pink-300/50 shadow-lg shadow-pink-100'
                          : 'border-purple-100 hover:border-purple-200 shadow-sm'
                      }`}
                    >
                      {/* Today Ribbon Badge */}
                      {isToday && (
                        <div className="absolute top-0 right-0 bg-gradient-to-l from-pink-500 to-amber-500 text-white text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-bl-xl shadow-sm flex items-center gap-1">
                          <Sparkles className="w-3 h-3" />
                          <span>Birthday Today!</span>
                        </div>
                      )}

                      <div className="flex items-start justify-between gap-3">
                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-pink-100 to-purple-100 flex items-center justify-center text-pink-600 text-xl font-bold shrink-0 shadow-2xs">
                          🎂
                        </div>

                        {canEdit && (
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => handleOpenAddModal(item)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-purple-600 hover:bg-purple-50 transition"
                              title="Edit birthday detail"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteBirthday(item.id, item.name)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition"
                              title="Delete birthday"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}
                      </div>

                      <div className="mt-4">
                        <h4 className="text-lg font-black text-slate-900 leading-snug">
                          {item.name}
                        </h4>
                        <div className="text-xs text-purple-700 font-semibold mt-0.5">
                          {item.role || 'Community Member'} {item.schoolClass ? `• ${item.schoolClass}` : ''}
                        </div>
                      </div>

                      <div className="mt-4 pt-3 border-t border-purple-50 flex items-center justify-between text-xs text-slate-500 font-medium">
                        <div className="flex items-center gap-1.5 font-bold text-slate-700">
                          <Calendar className="w-3.5 h-3.5 text-purple-600" />
                          <span>{formattedDate}</span>
                        </div>
                        <span className="text-[11px] font-mono text-purple-600 bg-purple-50 px-2 py-0.5 rounded-full font-bold">
                          {isToday ? 'Happening Now' : 'Upcoming'}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add / Edit Birthday Modal (Head & IT Manager only) */}
      {showAddModal && canEdit && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200"
        >
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl border border-purple-100 relative animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-purple-100 mb-5">
              <div className="flex items-center gap-2">
                <Cake className="w-5 h-5 text-pink-600" />
                <h3 className="text-lg font-black text-slate-900">
                  {editingId ? 'Edit Birthday Detail' : 'Add Upcoming Birthday'}
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

            <form onSubmit={handleSaveBirthday} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Name of Individual *
                </label>
                <input
                  type="text"
                  required
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="e.g. Sibusiso N., Ms Maka, Mr Mangara"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-purple-200 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Date of Birthday *
                </label>
                <input
                  type="date"
                  required
                  value={formDate}
                  min={today}
                  onChange={(e) => setFormDate(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-purple-200 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 font-medium"
                />
                <span className="text-[10px] text-slate-400 mt-1 block">
                  * Note: Passed birthdays are automatically deleted by system policy.
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Role
                  </label>
                  <select
                    value={formRole}
                    onChange={(e) => setFormRole(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-purple-200 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="Student">Student</option>
                    <option value="Teacher">Teacher</option>
                    <option value="TA">Teaching Assistant (TA)</option>
                    <option value="Head">School Head</option>
                    <option value="Staff">Faculty / Staff</option>
                    <option value="Estate">Estate Team</option>
                  </select>
                </div>

                {formRole === 'Student' && (
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      School Class
                    </label>
                    <select
                      value={formClass}
                      onChange={(e) => setFormClass(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-purple-200 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-purple-500"
                    >
                      <option value="LOWER 6X">LOWER 6X</option>
                      <option value="LOWER 6Y">LOWER 6Y</option>
                      <option value="UPPER 6X">UPPER 6X</option>
                      <option value="UPPER 6Y">UPPER 6Y</option>
                    </select>
                  </div>
                )}
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
                  {isSubmitting ? 'Saving...' : editingId ? 'Update Birthday' : 'Save Birthday'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
