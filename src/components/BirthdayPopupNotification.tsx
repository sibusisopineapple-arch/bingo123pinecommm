import React, { useEffect } from 'react';
import { Cake, Sparkles, Heart, PartyPopper, X } from 'lucide-react';
import { BirthdayItem } from '../types/schoolWindows';

interface BirthdayPopupNotificationProps {
  todaysBirthdays: BirthdayItem[];
  onClose: () => void;
}

export const BirthdayPopupNotification: React.FC<BirthdayPopupNotificationProps> = ({
  todaysBirthdays,
  onClose
}) => {
  // Play cheerful birthday chime sound on mount
  useEffect(() => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        const ctx = new AudioCtx();
        if (ctx.state === 'suspended') ctx.resume();
        const now = ctx.currentTime;
        // Warm celebratory arpeggio notes (C5, E5, G5, C6)
        const notes = [523.25, 659.25, 783.99, 1046.50];
        notes.forEach((freq, idx) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(freq, now + idx * 0.15);
          gain.gain.setValueAtTime(0.001, now + idx * 0.15);
          gain.gain.linearRampToValueAtTime(0.18, now + idx * 0.15 + 0.04);
          gain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.15 + 1.2);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(now + idx * 0.15);
          osc.stop(now + idx * 0.15 + 1.25);
        });
      }
    } catch {}
  }, []);

  if (todaysBirthdays.length === 0) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300"
    >
      <div className="relative w-full max-w-md bg-gradient-to-b from-amber-50 via-white to-pink-50 rounded-3xl border-2 border-amber-300 shadow-2xl p-6 sm:p-8 text-center overflow-hidden animate-in zoom-in-95 duration-300">
        {/* Festive background accents */}
        <div className="absolute -top-10 -right-10 w-32 h-32 bg-amber-200/50 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-pink-200/50 rounded-full blur-2xl pointer-events-none" />

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-full transition"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Cake Icon with Sparkles */}
        <div className="relative inline-flex items-center justify-center mb-4">
          <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-amber-400 via-pink-400 to-purple-500 p-1 shadow-lg shadow-amber-400/30 animate-bounce" style={{ animationDuration: '2s' }}>
            <div className="w-full h-full bg-white rounded-full flex items-center justify-center">
              <Cake className="w-10 h-10 text-amber-500" />
            </div>
          </div>
          <PartyPopper className="w-6 h-6 text-pink-500 absolute -top-1 -right-2 animate-pulse" />
          <Sparkles className="w-6 h-6 text-amber-500 absolute -bottom-1 -left-2 animate-spin" style={{ animationDuration: '4s' }} />
        </div>

        {/* Headline */}
        <div className="inline-block px-3 py-1 rounded-full bg-amber-100 border border-amber-300 text-amber-800 text-xs font-black uppercase tracking-wider mb-2">
          🎂 Campus Birthday Alert Today!
        </div>

        <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight mb-2">
          Happy Birthday! 🎉
        </h2>

        <p className="text-xs text-slate-600 mb-5 font-medium">
          Whenever you visit the site today, we celebrate our amazing community members.
        </p>

        {/* Celebrants Card */}
        <div className="space-y-2 mb-6">
          {todaysBirthdays.map((b) => (
            <div
              key={b.id}
              className="p-4 rounded-2xl bg-white/90 border border-amber-200/80 shadow-md flex items-center justify-center gap-3"
            >
              <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-amber-100 to-pink-100 flex items-center justify-center text-amber-600 font-bold text-sm shrink-0">
                🎂
              </div>
              <div className="text-left">
                <div className="text-lg font-black text-slate-900 leading-tight">
                  {b.name}
                </div>
                <div className="text-xs text-purple-700 font-bold">
                  {b.role || 'USAP Community Member'} {b.schoolClass ? `• ${b.schoolClass}` : ''}
                </div>
              </div>
            </div>
          ))}
        </div>

        <p className="text-xs font-bold text-purple-900 mb-6 flex items-center justify-center gap-1.5">
          <Heart className="w-4 h-4 text-pink-500 fill-pink-500 animate-pulse" />
          <span>Wishing you a joyful, blessed and inspiring year ahead!</span>
        </p>

        {/* Acknowledge Button */}
        <button
          onClick={onClose}
          className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-amber-500 via-pink-500 to-purple-600 hover:from-amber-600 hover:via-pink-600 hover:to-purple-700 text-white font-black text-sm shadow-xl shadow-pink-500/25 transition active:scale-95 flex items-center justify-center gap-2"
        >
          <PartyPopper className="w-4 h-4" />
          <span>Celebrate & Continue to Campus</span>
        </button>
      </div>
    </div>
  );
};
