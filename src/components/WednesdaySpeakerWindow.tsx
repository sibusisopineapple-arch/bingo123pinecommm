import React, { useState, useEffect } from 'react';
import { Mic, Calendar, Plus, Trash2, Edit3, ShieldAlert, Sparkles, CheckCircle2, User, AlertCircle } from 'lucide-react';
import { collection, onSnapshot, addDoc, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { ConvocationSpeakerItem } from '../types/schoolWindows';
import {
  getWeekOfLabel,
  getTodayDateString,
  isValidDateString,
  isWednesday,
  getNextWednesday,
  isDatePassed,
  formatDisplayDate
} from '../utils/schoolDateUtils';

interface WednesdaySpeakerWindowProps {
  sessionRole?: string;
  sessionUserName?: string;
}

export const WednesdaySpeakerWindow: React.FC<WednesdaySpeakerWindowProps> = ({
  sessionRole,
  sessionUserName
}) => {
  const canEdit = sessionRole === 'HEAD' || sessionRole === 'IT_MANAGER';

  const [speakers, setSpeakers] = useState<ConvocationSpeakerItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Form states (Head and IT Manager only)
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formDate, setFormDate] = useState('');
  const [formName, setFormName] = useState('');
  const [formTopic, setFormTopic] = useState('');
  const [formAffiliation, setFormAffiliation] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Real-time synchronization & automatic erasing of passed dates
  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'convocation_speakers'), async (snap) => {
      const today = getTodayDateString();
      const items: ConvocationSpeakerItem[] = [];

      for (const docSnap of snap.docs) {
        const data = docSnap.data();
        const speaker: ConvocationSpeakerItem = {
          id: docSnap.id,
          date: data.date || '',
          speakerName: data.speakerName || '',
          topic: data.topic || '',
          affiliation: data.affiliation || '',
          createdAt: data.createdAt || '',
          createdBy: data.createdBy || ''
        };

        // RULE: When the day has passed or if invalid, erase data entered.
        if (speaker.date && (isDatePassed(speaker.date) || !isValidDateString(speaker.date))) {
          try {
            await deleteDoc(doc(db, 'convocation_speakers', speaker.id));
          } catch (e) {
            console.warn('Failed to erase passed convocation speaker:', e);
          }
        } else if (speaker.date && isValidDateString(speaker.date)) {
          items.push(speaker);
        }
      }

      // Sort chronologically
      items.sort((a, b) => a.date.localeCompare(b.date));
      setSpeakers(items);
      setLoading(false);
    });

    return () => unsub();
  }, []);

  const handleOpenAddModal = (speaker?: ConvocationSpeakerItem) => {
    setFormError(null);
    if (speaker) {
      setEditingId(speaker.id);
      setFormDate(speaker.date);
      setFormName(speaker.speakerName);
      setFormTopic(speaker.topic || '');
      setFormAffiliation(speaker.affiliation || '');
    } else {
      setEditingId(null);
      setFormDate(getNextWednesday());
      setFormName('');
      setFormTopic('');
      setFormAffiliation('');
    }
    setShowAddModal(true);
  };

  const handleSaveSpeaker = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canEdit) {
      setFormError('Access restricted: Only the School Head and IT Manager can enter convocation speakers.');
      return;
    }

    const cleanName = formName.trim();
    if (!cleanName || !formDate) {
      setFormError('Please enter both the date and the name of the convocation speaker.');
      return;
    }

    if (!isValidDateString(formDate)) {
      setFormError('Please enter a valid calendar date in format YYYY-MM-DD.');
      return;
    }

    // RULE: Only date should be valid for Wednesday only.
    if (!isWednesday(formDate)) {
      const dayDisplay = formatDisplayDate(formDate);
      setFormError(`Invalid date: The selected date (${dayDisplay}) is not a Wednesday. Convocation speakers can only be scheduled on a Wednesday.`);
      return;
    }

    if (isDatePassed(formDate)) {
      setFormError('Cannot schedule a speaker for a Wednesday that has already passed.');
      return;
    }

    setIsSubmitting(true);
    setFormError(null);

    try {
      if (editingId) {
        await updateDoc(doc(db, 'convocation_speakers', editingId), {
          date: formDate,
          speakerName: cleanName,
          topic: formTopic.trim(),
          affiliation: formAffiliation.trim(),
          updatedAt: new Date().toISOString(),
          updatedBy: sessionUserName || 'Admin'
        });
      } else {
        await addDoc(collection(db, 'convocation_speakers'), {
          date: formDate,
          speakerName: cleanName,
          topic: formTopic.trim(),
          affiliation: formAffiliation.trim(),
          createdAt: new Date().toISOString(),
          createdBy: sessionUserName || 'Admin'
        });
      }

      setShowAddModal(false);
    } catch (err: any) {
      setFormError(err.message || 'Failed to save convocation speaker.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteSpeaker = async (id: string, name: string) => {
    if (!canEdit) return;
    if (!window.confirm(`Are you sure you want to remove the convocation speaker ${name}?`)) return;
    try {
      await deleteDoc(doc(db, 'convocation_speakers', id));
    } catch (err) {
      console.error(err);
    }
  };

  const today = new Date().toISOString().split('T')[0];

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-blue-700 via-indigo-700 to-purple-800 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute -top-12 -right-12 w-48 h-48 bg-white/10 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 text-xs font-black tracking-wider uppercase backdrop-blur-md">
              <Mic className="w-3.5 h-3.5 text-blue-200" />
              <span>Campus Assembly & Convocation</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight">
              Convocation speaker for week of {getWeekOfLabel(today)}
            </h2>
            <p className="text-blue-100 text-xs sm:text-sm max-w-xl">
              Distinguished guest speakers and community presentations scheduled exclusively for Wednesday convocation. Automatically erased once the Wednesday passes.
            </p>
          </div>

          {canEdit && (
            <button
              onClick={() => handleOpenAddModal()}
              className="px-4 py-2.5 bg-white text-blue-900 hover:bg-blue-50 font-black text-xs rounded-2xl shadow-lg transition active:scale-95 flex items-center gap-2 shrink-0"
            >
              <Plus className="w-4 h-4 text-blue-700" />
              <span>Enter Convocation Speaker</span>
            </button>
          )}
        </div>

        <div className="relative z-10 mt-4 pt-4 border-t border-white/15 flex flex-wrap items-center justify-between text-[11px] text-blue-200">
          <span>Official announcements viewable by everyone • Configured by School Head & IT Manager only</span>
          {canEdit && (
            <span className="font-bold text-amber-200 flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Convocation Coordinator Privileges ({sessionRole})</span>
            </span>
          )}
        </div>
      </div>

      {/* Main Display Area */}
      {loading ? (
        <div className="p-12 text-center text-slate-500 font-mono text-xs">
          Loading convocation speaker...
        </div>
      ) : speakers.length === 0 ? (
        /* RULE: If there is no convocation speaker entered, just display (None) on the window */
        <div className="bg-white rounded-3xl border border-blue-100 p-12 text-center shadow-sm">
          <div className="w-16 h-16 rounded-full bg-blue-50 text-blue-600 mx-auto flex items-center justify-center mb-3">
            <Mic className="w-8 h-8" />
          </div>
          <h3 className="text-base font-black text-slate-800">
            (None)
          </h3>
          <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
            No Wednesday convocation speaker is currently scheduled.
          </p>
          {canEdit && (
            <button
              onClick={() => handleOpenAddModal()}
              className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-md transition"
            >
              Enter Wednesday Speaker
            </button>
          )}
        </div>
      ) : (
        /* Convocation Speaker Cards */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {speakers.map((item) => {
            const isToday = item.date === today;
            const formattedDate = formatDisplayDate(item.date, {
              weekday: 'long',
              month: 'long',
              day: 'numeric',
              year: 'numeric'
            });

            return (
              <div
                key={item.id}
                className={`p-6 rounded-3xl border transition-all duration-200 bg-white relative overflow-hidden ${
                  isToday
                    ? 'border-blue-400 ring-2 ring-blue-300/50 shadow-lg shadow-blue-100'
                    : 'border-slate-200 hover:border-slate-300 shadow-sm'
                }`}
              >
                {isToday && (
                  <div className="absolute top-0 right-0 bg-blue-600 text-white text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-bl-xl shadow-sm flex items-center gap-1">
                    <Sparkles className="w-3 h-3" />
                    <span>Speaking Today!</span>
                  </div>
                )}

                <div className="flex items-start justify-between gap-3 mb-4">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-blue-100 to-indigo-100 flex items-center justify-center text-blue-700 text-2xl font-bold shrink-0">
                    <Mic className="w-7 h-7 text-blue-600" />
                  </div>

                  {canEdit && (
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleOpenAddModal(item)}
                        className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
                        title="Edit speaker"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteSpeaker(item.id, item.speakerName)}
                        className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                        title="Delete speaker"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>

                <div className="space-y-1.5">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-100 text-blue-900 text-xs font-black tracking-wide">
                    <Calendar className="w-3.5 h-3.5 text-blue-700" />
                    <span>Convocation speaker for week of {getWeekOfLabel(item.date)}</span>
                  </div>
                  <div className="text-xs font-bold text-slate-500 flex items-center gap-1">
                    <span>{formattedDate}</span>
                  </div>
                  <h4 className="text-xl font-black text-slate-900 leading-snug pt-1">
                    {item.speakerName}
                  </h4>
                  {item.affiliation && (
                    <div className="text-xs text-slate-500 font-semibold">
                      {item.affiliation}
                    </div>
                  )}
                </div>

                {item.topic && (
                  <div className="mt-4 p-3.5 rounded-2xl bg-blue-50/70 border border-blue-100">
                    <div className="text-[10px] font-mono uppercase tracking-wider text-blue-800 font-extrabold mb-0.5">
                      Presentation Topic / Theme
                    </div>
                    <div className="text-xs font-bold text-slate-800">
                      "{item.topic}"
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Add / Edit Speaker Modal (Head & IT Manager only) */}
      {showAddModal && canEdit && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200"
        >
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl border border-blue-100 relative animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-blue-100 mb-5">
              <div className="flex items-center gap-2">
                <Mic className="w-5 h-5 text-blue-600" />
                <h3 className="text-lg font-black text-slate-900">
                  {editingId ? 'Edit Convocation Speaker' : 'Enter Wednesday Speaker'}
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

            <form onSubmit={handleSaveSpeaker} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Convocation Date * (Must be a Wednesday)
                </label>
                <input
                  type="date"
                  required
                  min={today}
                  value={formDate}
                  onChange={(e) => setFormDate(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-blue-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                />
                <div className="flex flex-wrap items-center justify-between gap-1.5 mt-1.5">
                  {isValidDateString(formDate) && isWednesday(formDate) ? (
                    <span className="text-[11px] text-emerald-700 font-extrabold flex items-center gap-1 bg-emerald-50 px-2 py-0.5 rounded-full">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      Valid Wednesday: {formatDisplayDate(formDate, { month: 'short', day: 'numeric', year: 'numeric' })}
                    </span>
                  ) : isValidDateString(formDate) ? (
                    <span className="text-[11px] text-amber-700 font-extrabold flex items-center gap-1 bg-amber-50 px-2 py-0.5 rounded-full">
                      <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
                      {formatDisplayDate(formDate, { weekday: 'short', month: 'short', day: 'numeric' })} is not a Wednesday
                    </span>
                  ) : null}

                  <button
                    type="button"
                    onClick={() => setFormDate(getNextWednesday(formDate))}
                    className="text-[11px] font-bold text-blue-700 hover:text-blue-900 underline ml-auto"
                  >
                    Auto-select Wednesday
                  </button>
                </div>
                <span className="text-[10px] text-blue-600 mt-1 block">
                  * Note: Strictly restricted to Wednesdays only. Data is automatically erased when the day passes.
                </span>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Name of Convocation Speaker *
                </label>
                <input
                  type="text"
                  required
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="e.g. Dr. Rebecca Sengwayo, Mr Tafadzwa..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-blue-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Topic / Theme (Optional)
                </label>
                <input
                  type="text"
                  value={formTopic}
                  onChange={(e) => setFormTopic(e.target.value)}
                  placeholder="e.g. Leadership & Global Impact, Capstone Insights"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-blue-200 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Affiliation / Organization (Optional)
                </label>
                <input
                  type="text"
                  value={formAffiliation}
                  onChange={(e) => setFormAffiliation(e.target.value)}
                  placeholder="e.g. USAP Alum, EcoTech Zimbabwe, Guest Lecturer"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-blue-200 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
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
                  className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md transition disabled:opacity-50"
                >
                  {isSubmitting ? 'Saving Speaker...' : editingId ? 'Update Speaker' : 'Save Speaker'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
