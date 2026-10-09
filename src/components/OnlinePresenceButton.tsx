import React, { useState } from 'react';
import {
  Users,
  Wifi,
  WifiOff,
  UserCheck,
  Smartphone,
  Laptop,
  Clock,
  ShieldCheck,
  X,
  Sparkles,
  Activity
} from 'lucide-react';
import { useOnlinePresence } from '../utils/presenceTracker';
import { UserSession } from '../types';

interface Props {
  session: UserSession | null;
}

export const OnlinePresenceButton: React.FC<Props> = ({ session }) => {
  const [isOpen, setIsOpen] = useState(false);
  const {
    isBrowserOnline,
    activePeopleCount,
    signedInUsersCount,
    activeUsers,
    totalSignInsToday,
    currentTimeStr
  } = useOnlinePresence(session);

  return (
    <>
      {/* GREEN BUTTON BLINKING SHOWING ONLINE (OR OFFLINE WHEN DISCONNECTED) */}
      <button
        onClick={() => setIsOpen(true)}
        type="button"
        title={
          isBrowserOnline
            ? `You are online • Click to see live people and sign-ins on site (${activePeopleCount} online)`
            : 'You are offline • No count available'
        }
        className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-black transition-all border shadow-xs ${
          isBrowserOnline
            ? 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border-emerald-300 ring-2 ring-emerald-400/20 active:scale-95'
            : 'bg-slate-100 hover:bg-slate-200 text-slate-500 border-slate-300 active:scale-95'
        }`}
      >
        {isBrowserOnline ? (
          <>
            {/* Blinking green indicator */}
            <span className="relative flex h-2.5 w-2.5 shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
            </span>
            <span className="tracking-wide">Online</span>
            {/* Live Count Badge (Only shown when user is online) */}
            <span className="px-1.5 py-0.5 rounded-md bg-emerald-600 text-white font-mono text-[10px] font-extrabold shadow-2xs">
              {activePeopleCount}
            </span>
          </>
        ) : (
          <>
            {/* Offline gray indicator - strictly NO count when user is offline */}
            <span className="h-2.5 w-2.5 rounded-full bg-slate-400 shrink-0"></span>
            <span className="tracking-wide">Offline</span>
          </>
        )}
      </button>

      {/* MODAL: LIVE SITE PRESENCE & SIGN-IN ACTIVITY */}
      {isOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-200"
        >
          <div className="bg-white rounded-3xl border border-purple-100 shadow-2xl max-w-lg w-full overflow-hidden animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-purple-900 via-indigo-900 to-slate-900 text-white p-5 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-2xl bg-white/10 flex items-center justify-center text-emerald-400 shrink-0 border border-white/10">
                  <Activity className="w-5 h-5 animate-pulse" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-black tracking-tight">USAP Site Live Presence</h3>
                    {isBrowserOnline ? (
                      <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/40 text-[10px] font-black uppercase tracking-wider">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-ping"></span>
                        Live
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full bg-slate-500/30 text-slate-300 border border-slate-400/30 text-[10px] font-black uppercase tracking-wider">
                        Offline
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-purple-200/80 font-medium">
                    Real-time concurrent presence and authentic sign-in metrics
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="w-8 h-8 rounded-xl bg-white/10 hover:bg-white/20 text-white/80 hover:text-white flex items-center justify-center transition"
                title="Close modal"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 sm:p-6 space-y-4">
              {isBrowserOnline ? (
                <>
                  {/* Observation Timestamp Badge */}
                  <div className="flex items-center justify-between px-3.5 py-2 rounded-2xl bg-purple-50/70 border border-purple-100 text-xs">
                    <span className="text-purple-950 font-bold flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-purple-600" />
                      <span>Observation Time:</span>
                    </span>
                    <span className="font-mono font-extrabold text-purple-900 bg-white px-2 py-0.5 rounded-lg border border-purple-200">
                      {currentTimeStr || 'Now'}
                    </span>
                  </div>

                  {/* 2 Big Stat Cards */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    {/* STAT 1: People in the site at that same time */}
                    <div className="p-4 rounded-3xl bg-gradient-to-br from-emerald-50 to-teal-50/50 border-2 border-emerald-200 space-y-1 relative overflow-hidden">
                      <div className="flex items-center justify-between text-emerald-900">
                        <span className="text-[11px] font-extrabold uppercase tracking-wider flex items-center gap-1.5">
                          <Users className="w-3.5 h-3.5 text-emerald-600" />
                          <span>People On Site</span>
                        </span>
                        <span className="relative flex h-2 w-2">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                        </span>
                      </div>
                      <div className="text-3xl font-black text-emerald-900 tracking-tight">
                        {activePeopleCount}
                      </div>
                      <p className="text-[11px] text-emerald-800/90 font-medium leading-relaxed">
                        Total active people in the site at this exact same time.
                      </p>
                    </div>

                    {/* STAT 2: Number of sign-ins on the site at that specific time */}
                    <div className="p-4 rounded-3xl bg-gradient-to-br from-indigo-50 to-purple-50/50 border-2 border-indigo-200 space-y-1 relative overflow-hidden">
                      <div className="flex items-center justify-between text-indigo-900">
                        <span className="text-[11px] font-extrabold uppercase tracking-wider flex items-center gap-1.5">
                          <UserCheck className="w-3.5 h-3.5 text-indigo-600" />
                          <span>Active Sign-Ins</span>
                        </span>
                        <span className="text-[10px] font-mono font-bold bg-white text-indigo-700 px-1.5 py-0.5 rounded border border-indigo-200">
                          Live Now
                        </span>
                      </div>
                      <div className="text-3xl font-black text-indigo-900 tracking-tight">
                        {signedInUsersCount}
                      </div>
                      <p className="text-[11px] text-indigo-800/90 font-medium leading-relaxed">
                        Authenticated USAP members active on the site right now.
                      </p>
                    </div>
                  </div>

                  {/* Additional Insight: Total Sign-Ins Logged on Site Today (Daily Sign Ins - Visible to Everyone) */}
                  <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-3 text-xs">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center shrink-0">
                        <ShieldCheck className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="font-extrabold text-slate-900">Daily Sign-Ins Logged Today</div>
                        <div className="text-[10px] text-slate-500">Security-verified authentic logins today</div>
                      </div>
                    </div>
                    <div className="font-mono text-base font-black text-purple-700 bg-white px-3 py-1 rounded-xl border border-purple-200">
                      {totalSignInsToday} sign-ins
                    </div>
                  </div>

                  {/* ACTIVE ACCOUNTS LIST: NOW VISIBLE TO EVERYONE */}
                  <div className="space-y-2.5 pt-1">
                    <div className="flex items-center justify-between text-xs font-extrabold text-slate-900">
                      <span className="flex items-center gap-1.5 text-purple-950">
                        <Users className="w-4 h-4 text-purple-700" />
                        <span>Online Accounts on Site ({activeUsers.length})</span>
                      </span>
                      <span className="text-[10px] bg-emerald-100 text-emerald-800 font-extrabold px-2 py-0.5 rounded-full border border-emerald-200">
                        Live Active
                      </span>
                    </div>

                    <div className="max-h-52 overflow-y-auto space-y-1.5 pr-1 text-xs">
                      {activeUsers.map((u, i) => (
                        <div
                          key={`${u.id}-${i}`}
                          className="p-2.5 rounded-2xl bg-white border border-purple-100 hover:border-purple-300 flex items-center justify-between gap-2 shadow-2xs transition"
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            {/* Online green dot */}
                            <span className="h-2 w-2 rounded-full bg-emerald-500 shrink-0"></span>
                            <div className="truncate">
                              <div className="font-bold text-slate-900 flex items-center gap-1.5">
                                <span>{u.userName}</span>
                                {u.schoolClass && (
                                  <span className="text-[10px] text-purple-700 font-extrabold">
                                    ({u.schoolClass})
                                  </span>
                                )}
                              </div>
                              {u.email && (
                                <div className="text-[10px] text-slate-400 font-mono truncate">
                                  {u.email}
                                </div>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            <span
                              className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                                u.role === 'VISITOR'
                                  ? 'bg-slate-100 text-slate-600 border border-slate-200'
                                  : u.role === 'STUDENT'
                                  ? 'bg-amber-50 text-amber-800 border border-amber-200'
                                  : 'bg-purple-50 text-purple-800 border border-purple-200'
                              }`}
                            >
                              {u.role === 'VISITOR' ? 'Guest Visitor' : u.role}
                            </span>

                            {u.deviceType === 'mobile' ? (
                              <span title="Mobile device">
                                <Smartphone className="w-3.5 h-3.5 text-slate-400" />
                              </span>
                            ) : (
                              <span title="Desktop / Laptop">
                                <Laptop className="w-3.5 h-3.5 text-slate-400" />
                              </span>
                            )}
                          </div>
                        </div>
                      ))}

                      {activeUsers.length === 0 && (
                        <div className="text-center py-4 text-xs text-slate-400 font-medium">
                          No active accounts detected on site.
                        </div>
                      )}
                    </div>
                  </div>
                </>
              ) : (
                /* OFFLINE VIEW - STRICT REQUIREMENT: No count when user is offline */
                <div className="py-8 text-center space-y-3">
                  <div className="w-14 h-14 rounded-3xl bg-slate-100 text-slate-500 mx-auto flex items-center justify-center border border-slate-200">
                    <WifiOff className="w-7 h-7" />
                  </div>
                  <div className="space-y-1">
                    <h4 className="text-base font-black text-slate-900">You Are Currently Offline</h4>
                    <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
                      Per presence protocol, live site counts and visitor metrics are disabled when offline. Connect to the internet to see the number of people on the site and live sign-in stats.
                    </p>
                  </div>
                  <div className="pt-2">
                    <span className="text-[11px] font-bold text-slate-400 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200">
                      Live counters paused while offline
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs">
              <span className="text-slate-400 text-[11px] font-medium flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-purple-600" />
                USAP Synchronized Presence
              </span>
              <button
                onClick={() => setIsOpen(false)}
                className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-extrabold text-xs shadow-xs transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
