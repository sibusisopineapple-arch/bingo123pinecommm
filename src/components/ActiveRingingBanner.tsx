import React, { useState, useEffect } from 'react';
import { Radio, Square, Bell, Volume2 } from 'lucide-react';
import { subscribeToActiveRinging, stopAllAlarms, ActiveRingingStatus } from '../utils/audioChime';

export const ActiveRingingBanner: React.FC = () => {
  const [status, setStatus] = useState<ActiveRingingStatus | null>(null);

  useEffect(() => {
    const unsub = subscribeToActiveRinging((s) => {
      setStatus(s);
    });
    return () => unsub();
  }, []);

  if (!status) return null;

  const totalDuration = status.durationSeconds || 15;
  const percentLeft = Math.round((status.remainingSeconds / totalDuration) * 100);

  return (
    <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 w-full max-w-lg px-4 pointer-events-auto animate-in slide-in-from-top-4 duration-300">
      <div className="bg-gradient-to-r from-amber-600 via-rose-600 to-purple-800 text-white rounded-3xl p-4 sm:p-5 shadow-2xl border-2 border-white/40 backdrop-blur-md">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-white/20 flex flex-col items-center justify-center text-white shrink-0 shadow-inner font-mono">
              <span className="text-base font-black leading-none">{String(status.remainingSeconds).padStart(2, '0')}</span>
              <span className="text-[9px] font-black uppercase text-amber-200">sec</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-black text-sm sm:text-base tracking-tight">{status.bellName}</span>
                <span className="bg-white text-rose-700 font-mono text-[10px] font-black px-2 py-0.5 rounded-full shadow-2xs uppercase">
                  15s Ringing
                </span>
              </div>
              <p className="text-xs text-white/90 font-medium truncate max-w-xs mt-0.5">
                Sound: <span className="font-bold underline text-amber-200">{status.toneName}</span>
              </p>
            </div>
          </div>

          <button
            onClick={() => stopAllAlarms()}
            className="px-4 py-2 bg-white text-rose-700 hover:bg-rose-50 font-black text-xs rounded-xl shadow-md transition flex items-center gap-1.5 shrink-0 active:scale-95"
            title="Silence the alarm early"
          >
            <Square className="w-3.5 h-3.5 fill-current" />
            <span>Silence ({status.remainingSeconds}s)</span>
          </button>
        </div>

        {/* 15-Second Progress Bar with Countdown Labels */}
        <div className="mt-3 space-y-1">
          <div className="flex items-center justify-between text-[10px] font-mono text-white/80">
            <span>15s Countdown</span>
            <span className="font-bold">{status.remainingSeconds} of {totalDuration} seconds remaining</span>
          </div>
          <div className="w-full bg-black/25 rounded-full h-2 overflow-hidden">
            <div
              className="bg-gradient-to-r from-amber-300 to-white h-full transition-all duration-1000 ease-linear rounded-full"
              style={{ width: `${percentLeft}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
