import React, { useState, useEffect } from 'react';
import {
  Clock,
  Volume2,
  VolumeX,
  Bell,
  Sparkles,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  Play,
  Check,
  Calendar
} from 'lucide-react';
import { getCurrentCampusSchedule, CurrentScheduleInfo } from '../utils/campusSchedule';
import { SchoolTest } from '../types';
import {
  playLunchAlarm,
  playMealTimeAlarm,
  playExamAlarm,
  playExamBeepAlarm,
  playExamChime,
  playNotificationAlarm,
  playSixtySecBell,
  stopAllAlarms,
  unlockAudio
} from '../utils/audioChime';

interface Props {
  tests?: SchoolTest[];
  soundEnabled: boolean;
  onToggleSound: () => void;
  activeAlarmKind?: 'meal' | 'beep' | null;
  onDismissAlarm?: () => void;
  onOpenSoundSettings?: () => void;
}

export const CurrentTimeNoticeBar: React.FC<Props> = ({
  tests = [],
  soundEnabled,
  onToggleSound,
  activeAlarmKind,
  onDismissAlarm,
  onOpenSoundSettings
}) => {
  const [now, setNow] = useState<Date>(new Date());
  const [schedule, setSchedule] = useState<CurrentScheduleInfo>(() => getCurrentCampusSchedule(new Date(), tests));
  const [isExpanded, setIsExpanded] = useState<boolean>(false);
  const [testSoundPlaying, setTestSoundPlaying] = useState<string | null>(null);

  // Update clock every second
  useEffect(() => {
    const timer = setInterval(() => {
      const cur = new Date();
      setNow(cur);
      setSchedule(getCurrentCampusSchedule(cur, tests));
    }, 1000);
    return () => clearInterval(timer);
  }, [tests]);

  const handleTestAudio = (type: 'lunch' | 'meal' | 'beep' | 'exam' | 'notif') => {
    unlockAudio();
    stopAllAlarms();
    setTestSoundPlaying(type);

    if (type === 'lunch') {
      playLunchAlarm(5);
    } else if (type === 'meal') {
      playMealTimeAlarm(5);
    } else if (type === 'beep') {
      playSixtySecBell(6);
    } else if (type === 'notif') {
      playNotificationAlarm(5);
    } else {
      playExamAlarm(5);
    }

    setTimeout(() => {
      setTestSoundPlaying(null);
    }, 3000);
  };

  // Format time display
  const timeString = now.toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true
  });

  const dateString = now.toLocaleDateString([], {
    weekday: 'short',
    month: 'short',
    day: 'numeric'
  });

  const isExamNotice = schedule.category === 'EXAM';
  const isAlarmFiring = !!activeAlarmKind;

  return (
    <div
      role="region"
      aria-label="Campus Time & Schedule Notice"
      className={`w-full transition-all duration-300 border-b z-40 sticky top-0 backdrop-blur-md ${
        isAlarmFiring
          ? 'bg-rose-900 text-white border-rose-600 shadow-lg shadow-rose-900/30'
          : isExamNotice
          ? 'bg-gradient-to-r from-rose-900 via-amber-900 to-rose-950 text-white border-rose-500 shadow-md'
          : schedule.category === 'MEAL'
          ? 'bg-gradient-to-r from-amber-900 via-purple-950 to-amber-950 text-amber-100 border-amber-500/50'
          : schedule.category === 'QUAKER'
          ? 'bg-gradient-to-r from-purple-950 via-indigo-950 to-purple-900 text-purple-100 border-purple-400/50'
          : schedule.category === 'PHONE_TIME'
          ? 'bg-gradient-to-r from-indigo-950 via-blue-950 to-indigo-900 text-indigo-100 border-indigo-400/50'
          : schedule.category === 'EXTRACURRICULAR'
          ? 'bg-gradient-to-r from-teal-950 via-emerald-950 to-slate-900 text-teal-100 border-teal-500/40'
          : schedule.category === 'OWN_TIME'
          ? 'bg-gradient-to-r from-emerald-950 via-teal-950 to-slate-900 text-emerald-100 border-emerald-500/40'
          : schedule.category === 'PREP'
          ? 'bg-gradient-to-r from-violet-950 via-slate-950 to-purple-950 text-violet-100 border-violet-400/40'
          : schedule.category === 'SNACK'
          ? 'bg-gradient-to-r from-emerald-950 via-slate-950 to-teal-950 text-emerald-100 border-emerald-400/40'
          : schedule.category === 'SLEEP'
          ? 'bg-slate-950 text-slate-300 border-slate-800'
          : 'bg-gradient-to-r from-purple-950 via-slate-950 to-indigo-950 text-white border-purple-800/40'
      }`}
    >
      {/* ACTIVE RINGING ALARM BANNER (When meal alarm or 60s beep fires) */}
      {isAlarmFiring && (
        <div className="bg-rose-600 text-white px-3 py-2 flex items-center justify-between text-xs font-black animate-pulse">
          <div className="flex items-center gap-2">
            <Bell className="w-4 h-4 animate-bounce shrink-0" />
            <span>
              {activeAlarmKind === 'beep'
                ? '⚠️ EXAM IN 60 SECONDS! BEEP ALARM ACTIVE — PREPARE FOR STRICT SILENCE'
                : '🍽️ MEAL TIME ALARM RINGING! PLEASE PROCEED TO THE DINING HALL'}
            </span>
          </div>
          <button
            onClick={() => {
              stopAllAlarms();
              if (onDismissAlarm) onDismissAlarm();
            }}
            className="px-3 py-1 bg-white text-rose-900 rounded-lg text-xs font-black shadow hover:bg-rose-50 transition"
          >
            Acknowledge & Silence
          </button>
        </div>
      )}

      {/* MAIN NOTICE BAR HEADER */}
      <div className="max-w-7xl mx-auto px-3 sm:px-4 py-2 flex flex-wrap items-center justify-between gap-2 text-xs">
        {/* LEFT: Live Clock & Calendar */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-black/40 border border-white/10 font-mono">
            <Clock className="w-3.5 h-3.5 text-amber-300 animate-pulse" />
            <span className="font-extrabold text-white tracking-wide text-xs">{timeString}</span>
          </div>
          <div className="hidden sm:flex items-center gap-1 text-[11px] text-white/70 font-semibold">
            <Calendar className="w-3 h-3 text-purple-300" />
            <span>{dateString}</span>
          </div>
        </div>

        {/* CENTER: Current Time Period Status */}
        <div className="flex-1 flex items-center justify-center gap-2 min-w-[200px] text-center sm:text-left">
          <span
            className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider shrink-0 flex items-center gap-1 ${
              schedule.badgeStyle
            }`}
          >
            <span>{schedule.icon}</span>
            <span>{schedule.statusBadge}</span>
          </span>

          <div className="truncate max-w-[260px] sm:max-w-md lg:max-w-xl">
            <span className="font-black text-white text-xs">{schedule.title}</span>
            <span className="hidden md:inline text-[11px] text-white/80 ml-2 font-medium">
              — {schedule.description}
            </span>
          </div>
        </div>

        {/* RIGHT: Next Event & Audio Controls */}
        <div className="flex items-center gap-2 shrink-0 ml-auto">
          {schedule.nextEvent && (
            <div className="hidden lg:flex items-center gap-1 px-2.5 py-1 rounded-xl bg-white/10 text-[11px] font-bold text-white/90">
              <span className="text-white/60">Next:</span>
              <span className="text-amber-300 font-extrabold">{schedule.nextEvent.name}</span>
              <span className="text-white/60">({schedule.nextEvent.timeStr})</span>
            </div>
          )}

          {/* Sound / Alarm Toggle Button */}
          <button
            onClick={onToggleSound}
            title={soundEnabled ? 'Device Alarms Sound Active' : 'Device Alarms Muted'}
            className={`p-1.5 rounded-xl border transition flex items-center gap-1 text-[11px] font-extrabold ${
              soundEnabled
                ? 'bg-purple-600/60 border-purple-400 text-purple-100 hover:bg-purple-600'
                : 'bg-slate-800/70 border-slate-700 text-slate-400 hover:text-white'
            }`}
          >
            {soundEnabled ? (
              <>
                <Volume2 className="w-3.5 h-3.5 text-emerald-300" />
                <span className="hidden xl:inline text-[10px]">Alarms ON</span>
              </>
            ) : (
              <>
                <VolumeX className="w-3.5 h-3.5 text-rose-300" />
                <span className="hidden xl:inline text-[10px]">Muted</span>
              </>
            )}
          </button>

          {/* Expand Details Toggle */}
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/10 text-white/90 transition flex items-center gap-1 text-[11px] font-bold"
            title="View Full Campus Routine & Test Alarms"
          >
            <span className="hidden sm:inline text-[10px]">Schedule</span>
            {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* EXPANDED SCHEDULE & ALARM DRAWER */}
      {isExpanded && (
        <div className="bg-slate-950/95 text-slate-100 border-t border-white/10 p-3 sm:p-5 text-xs animate-in slide-in-from-top-2 duration-200">
          <div className="max-w-7xl mx-auto space-y-4">
            {/* Top Row: Current Period Detailed Info & Alarms Tester */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {/* Box 1: Current Period */}
              <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 space-y-1.5">
                <div className="text-[10px] uppercase tracking-wider text-purple-300 font-extrabold flex items-center gap-1">
                  <Sparkles className="w-3 h-3" />
                  <span>Current School Time</span>
                </div>
                <div className="text-base font-black text-white flex items-center gap-2">
                  <span>{schedule.icon}</span>
                  <span>{schedule.title}</span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed font-medium">
                  {schedule.description}
                </p>
                <div className="text-[11px] font-mono text-amber-300 font-bold pt-1">
                  Scheduled Window: {schedule.timeWindow}
                </div>
              </div>

              {/* Box 2: Automated Alarm Timetable */}
              <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 space-y-1.5">
                <div className="text-[10px] uppercase tracking-wider text-amber-300 font-extrabold flex items-center gap-1">
                  <Bell className="w-3 h-3" />
                  <span>Device Alarm Timetable</span>
                </div>
                <ul className="text-[11px] space-y-1 font-medium text-slate-200">
                  <li className="flex items-center justify-between">
                    <span>Weekday Lunch Alarm:</span>
                    <strong className="text-amber-300 font-mono">1:05 PM (Mon–Fri)</strong>
                  </li>
                  <li className="flex items-center justify-between">
                    <span>Weekend Lunch Alarm:</span>
                    <strong className="text-amber-300 font-mono">12:55 PM (Sat–Sun)</strong>
                  </li>
                  <li className="flex items-center justify-between">
                    <span>Daily Dinner Alarm:</span>
                    <strong className="text-amber-300 font-mono">5:50 PM (Everyday)</strong>
                  </li>
                  <li className="flex items-center justify-between">
                    <span>Exam Countdown Beep:</span>
                    <strong className="text-rose-300 font-mono">60s Before Exam</strong>
                  </li>
                  <li className="flex items-center justify-between">
                    <span>Sunday Phone Time:</span>
                    <strong className="text-indigo-300 font-mono">4:00 PM – 5:45 PM</strong>
                  </li>
                </ul>
              </div>

              {/* Box 3: Test Device Alarms & Audio Chimes */}
              <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="text-[10px] uppercase tracking-wider text-emerald-300 font-extrabold flex items-center gap-1">
                    <Volume2 className="w-3 h-3" />
                    <span>Test & Change Alarms</span>
                  </div>
                  {onOpenSoundSettings && (
                    <button
                      onClick={onOpenSoundSettings}
                      className="px-2 py-0.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-[10px] font-bold transition flex items-center gap-1"
                    >
                      <Sparkles className="w-2.5 h-2.5 text-amber-300" />
                      <span>Customizer</span>
                    </button>
                  )}
                </div>
                <p className="text-[11px] text-slate-300">
                  Verify device volume or change alarm sounds anytime:
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 pt-1">
                  <button
                    onClick={() => handleTestAudio('lunch')}
                    className="p-1.5 rounded-xl bg-amber-600/30 hover:bg-amber-600/50 border border-amber-400/40 text-[10px] font-black text-amber-200 transition flex items-center justify-center gap-1"
                  >
                    {testSoundPlaying === 'lunch' ? <Check className="w-3 h-3 text-emerald-400" /> : <Play className="w-3 h-3" />}
                    <span>Lunch</span>
                  </button>

                  <button
                    onClick={() => handleTestAudio('meal')}
                    className="p-1.5 rounded-xl bg-amber-600/30 hover:bg-amber-600/50 border border-amber-400/40 text-[10px] font-black text-amber-200 transition flex items-center justify-center gap-1"
                  >
                    {testSoundPlaying === 'meal' ? <Check className="w-3 h-3 text-emerald-400" /> : <Play className="w-3 h-3" />}
                    <span>Meal Bell</span>
                  </button>

                  <button
                    onClick={() => handleTestAudio('beep')}
                    className="p-1.5 rounded-xl bg-rose-600/30 hover:bg-rose-600/50 border border-rose-400/40 text-[10px] font-black text-rose-200 transition flex items-center justify-center gap-1"
                  >
                    {testSoundPlaying === 'beep' ? <Check className="w-3 h-3 text-emerald-400" /> : <Play className="w-3 h-3" />}
                    <span>60s Count</span>
                  </button>

                  <button
                    onClick={() => handleTestAudio('exam')}
                    className="p-1.5 rounded-xl bg-purple-600/30 hover:bg-purple-600/50 border border-purple-400/40 text-[10px] font-black text-purple-200 transition flex items-center justify-center gap-1"
                  >
                    {testSoundPlaying === 'exam' ? <Check className="w-3 h-3 text-emerald-400" /> : <Play className="w-3 h-3" />}
                    <span>Exam Bell</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Bottom Row: USAP Core Schedule Guidelines */}
            <div className="pt-2.5 border-t border-white/10 flex flex-col gap-1.5 text-[11px] text-slate-300">
              <div>
                <strong className="text-white">Daily Weekday Routine:</strong> Breakfast (7:00 AM – 7:35 AM) • Lessons Block 1 (7:40 AM – 9:45 AM) • Morning Snack (9:45 AM – 10:00 AM) • Lessons Block 2 (10:00 AM – 1:05 PM) • Lunch (1:05 PM – 2:00 PM) • Afternoon Lessons (2:00 PM – 4:00 PM) • Extracurriculars (4:00 PM – 5:50 PM) • Dinner (6:00 PM – 7:00 PM) • Compulsory Prep (7:00 PM – 9:00 PM) • Evening Snack (9:00 PM – 9:15 PM) • Optional Prep (9:15 PM – 10:30 PM) • Sleep & Morning Prep (10:30 PM – 7:00 AM).
              </div>
              <div className="flex flex-wrap items-center justify-between text-slate-400 gap-2">
                <div>
                  <strong className="text-amber-300">Wednesday Exception:</strong> Convocation (12:00 PM – 1:05 PM) • Consultation (2:00 PM – 3:00 PM) • Extracurriculars till dinner | <strong className="text-emerald-300">Friday Exception:</strong> No lessons after lunch (Activities 2:00 PM – 5:50 PM)
                </div>
                <div>
                  <strong className="text-purple-300">Weekends:</strong> No Lessons • Sunday Quaker Meeting (8:00 AM – 8:45 AM) • Sunday Phone Window (4:00 PM – 5:45 PM)
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

/**
 * Dedicated Notice Bar / Card displayed prominently inside the Sign-In / Sign-Up portal
 */
export const SignInPageTimeNoticeCard: React.FC<{
  tests?: SchoolTest[];
  soundEnabled: boolean;
  onToggleSound: () => void;
}> = ({ tests = [], soundEnabled, onToggleSound }) => {
  const [now, setNow] = useState<Date>(new Date());
  const [schedule, setSchedule] = useState<CurrentScheduleInfo>(() => getCurrentCampusSchedule(new Date(), tests));
  const [isPlayingTest, setIsPlayingTest] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      const cur = new Date();
      setNow(cur);
      setSchedule(getCurrentCampusSchedule(cur, tests));
    }, 1000);
    return () => clearInterval(timer);
  }, [tests]);

  const handleTestAlarm = () => {
    unlockAudio();
    stopAllAlarms();
    setIsPlayingTest(true);
    playMealTimeAlarm(4);
    setTimeout(() => setIsPlayingTest(false), 3000);
  };

  const timeString = now.toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true
  });

  const dateString = now.toLocaleDateString([], {
    weekday: 'long',
    month: 'short',
    day: 'numeric'
  });

  return (
    <div className="w-full mb-6 p-4 rounded-3xl bg-gradient-to-br from-purple-950 via-indigo-950 to-slate-950 text-white shadow-xl border-2 border-purple-400/40 relative overflow-hidden animate-in fade-in duration-300">
      {/* Background ambient glow */}
      <div className="absolute -right-8 -bottom-8 w-36 h-36 bg-purple-500/20 rounded-full blur-2xl pointer-events-none" />
      <div className="absolute -left-8 -top-8 w-36 h-36 bg-amber-500/15 rounded-full blur-2xl pointer-events-none" />

      {/* Top row: Live Clock + Status Pill */}
      <div className="flex flex-wrap items-center justify-between gap-2 mb-2.5">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-black/40 border border-white/15 font-mono text-xs font-black text-amber-300 tracking-wider">
            <Clock className="w-3.5 h-3.5 text-amber-300 animate-pulse" />
            <span>{timeString}</span>
          </div>
          <span className="text-[11px] font-bold text-purple-200/90">{dateString}</span>
        </div>

        <span
          className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 shadow-sm ${schedule.badgeStyle}`}
        >
          <span>{schedule.icon}</span>
          <span>{schedule.statusBadge}</span>
        </span>
      </div>

      {/* Center: What Time It Is Right Now */}
      <div className="space-y-1 my-2">
        <div className="text-sm sm:text-base font-black text-white flex items-center gap-2">
          <span className="text-lg">{schedule.icon}</span>
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-white to-purple-200">
            {schedule.title}
          </span>
        </div>
        <p className="text-xs text-purple-100/90 leading-relaxed font-medium">
          {schedule.description}
        </p>
      </div>

      {/* Bottom row: Time Window, Next Routine, & Test Alarm Action */}
      <div className="pt-2.5 mt-2.5 border-t border-white/15 flex flex-wrap items-center justify-between gap-2 text-[11px]">
        <div className="flex items-center gap-2 text-purple-200 font-bold">
          <span className="text-white/60 font-medium">Scheduled Window:</span>
          <span className="font-mono text-amber-300 bg-white/10 px-2 py-0.5 rounded-lg">
            {schedule.timeWindow}
          </span>
        </div>

        <div className="flex items-center gap-2 ml-auto">
          {schedule.nextEvent && (
            <div className="hidden sm:inline-block text-[10px] text-white/75 font-semibold">
              Next: <strong className="text-amber-300">{schedule.nextEvent.name}</strong> ({schedule.nextEvent.timeStr})
            </div>
          )}

          <button
            type="button"
            onClick={handleTestAlarm}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-400/40 text-amber-200 font-extrabold text-[10px] transition shadow-xs"
            title="Test meal alarm ring on device"
          >
            {isPlayingTest ? <Check className="w-3 h-3 text-emerald-400" /> : <Volume2 className="w-3 h-3" />}
            <span>{isPlayingTest ? 'Ringing...' : 'Test Alarm'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
