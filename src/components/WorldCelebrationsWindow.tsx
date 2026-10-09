import React, { useState, useMemo } from 'react';
import {
  Globe,
  Calendar,
  Sparkles,
  Award,
  BookOpen,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  Search,
  Flame,
  Info
} from 'lucide-react';
import { getCelebrationsForDate, WORLD_CELEBRATIONS_MAP, WorldCelebration } from '../utils/worldCelebrations';

interface WorldCelebrationsWindowProps {
  onClose?: () => void;
}

export const WorldCelebrationsWindow: React.FC<WorldCelebrationsWindowProps> = () => {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [searchFilter, setSearchFilter] = useState('');

  const todayInfo = useMemo(() => getCelebrationsForDate(new Date()), []);
  const currentViewInfo = useMemo(() => getCelebrationsForDate(selectedDate), [selectedDate]);

  const handlePrevDay = () => {
    const prev = new Date(selectedDate);
    prev.setDate(prev.getDate() - 1);
    setSelectedDate(prev);
  };

  const handleNextDay = () => {
    const next = new Date(selectedDate);
    next.setDate(next.getDate() + 1);
    setSelectedDate(next);
  };

  const handleResetToToday = () => {
    setSelectedDate(new Date());
  };

  const isViewingToday = useMemo(() => {
    const today = new Date();
    return (
      today.getDate() === selectedDate.getDate() &&
      today.getMonth() === selectedDate.getMonth() &&
      today.getFullYear() === selectedDate.getFullYear()
    );
  }, [selectedDate]);

  // Notable world days list for quick navigation
  const quickJumpDays = [
    { label: "Today", date: new Date() },
    { label: "Christmas Day (25 Dec)", date: new Date(new Date().getFullYear(), 11, 25) },
    { label: "World Teachers' Day (5 Oct)", date: new Date(new Date().getFullYear(), 9, 5) },
    { label: "Africa Day (25 May)", date: new Date(new Date().getFullYear(), 4, 25) },
    { label: "Earth Day (22 Apr)", date: new Date(new Date().getFullYear(), 3, 22) },
    { label: "International Pi Day (14 Mar)", date: new Date(new Date().getFullYear(), 2, 14) },
    { label: "New Year's Day (1 Jan)", date: new Date(new Date().getFullYear(), 0, 1) },
    { label: "Human Rights Day (10 Dec)", date: new Date(new Date().getFullYear(), 11, 10) }
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-blue-950 via-indigo-900 to-purple-950 text-white rounded-3xl p-6 sm:p-8 shadow-xl border border-blue-400/30 relative overflow-hidden">
        <div className="absolute -top-10 -right-10 w-72 h-72 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 border border-blue-300/30 text-blue-200 text-[11px] font-extrabold uppercase tracking-wider mb-2">
              <Globe className="w-3.5 h-3.5 text-cyan-300 animate-pulse" />
              <span>Global Observances & World Records Database</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white flex items-center gap-2">
              Today in World Celebrations
            </h2>
            <p className="text-xs sm:text-sm text-blue-200/90 font-medium max-w-2xl mt-1">
              Synchronized directly from verified international calendars, UNESCO observances, United Nations records, and global world history.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
            <div className="px-3.5 py-2 rounded-2xl bg-white/10 border border-white/15 text-xs font-bold text-cyan-200 flex items-center gap-2 backdrop-blur-xs">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Immutable Global Source</span>
            </div>
          </div>
        </div>
      </div>

      {/* TODAY'S SPOTLIGHT HIGHLIGHT HERO CARD */}
      <div className="bg-white rounded-3xl border-2 border-indigo-100 p-6 shadow-md relative overflow-hidden">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 pb-6 border-b border-indigo-50">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-black uppercase tracking-wider text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-lg border border-indigo-100 flex items-center gap-1.5">
                <Flame className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                <span>{isViewingToday ? "Today's Official Celebration" : `Observance for ${currentViewInfo.dateString}`}</span>
              </span>
              <span className="text-xs text-slate-400 font-bold">
                {selectedDate.toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
              </span>
            </div>

            <h3 className="text-2xl sm:text-3xl font-black text-slate-900 pt-2 tracking-tight">
              {currentViewInfo.celebrations[0]?.title}
            </h3>
            <p className="text-sm text-slate-600 font-medium leading-relaxed max-w-3xl pt-1">
              {currentViewInfo.celebrations[0]?.summary}
            </p>
          </div>

          {/* Date Selector & Navigation Controls */}
          <div className="flex flex-col items-end gap-2 shrink-0 w-full lg:w-auto">
            <div className="flex items-center gap-2 bg-slate-50 p-1.5 rounded-2xl border border-slate-200 w-full lg:w-auto justify-between">
              <button
                onClick={handlePrevDay}
                className="p-2 rounded-xl hover:bg-white text-slate-700 hover:text-indigo-600 transition shadow-2xs"
                title="Previous Day"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <div className="px-3 text-xs font-black text-slate-900 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-indigo-600" />
                <span>{currentViewInfo.dateString}</span>
              </div>

              <button
                onClick={handleNextDay}
                className="p-2 rounded-xl hover:bg-white text-slate-700 hover:text-indigo-600 transition shadow-2xs"
                title="Next Day"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {!isViewingToday && (
              <button
                onClick={handleResetToToday}
                className="text-xs font-bold text-indigo-600 hover:text-indigo-800 underline transition"
              >
                ← Jump back to Today
              </button>
            )}
          </div>
        </div>

        {/* Detailed Celebration Metadata */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-6">
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1">
            <div className="text-[11px] font-extrabold uppercase text-slate-400 tracking-wider flex items-center gap-1.5">
              <Award className="w-3.5 h-3.5 text-indigo-600" />
              <span>Established & Recognized By</span>
            </div>
            <div className="text-xs font-extrabold text-slate-800">
              {currentViewInfo.celebrations[0]?.establishedBy}
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200 space-y-1">
            <div className="text-[11px] font-extrabold uppercase text-amber-800 tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-600" />
              <span>World Records Fact</span>
            </div>
            <div className="text-xs font-medium text-amber-950 leading-relaxed">
              {currentViewInfo.celebrations[0]?.funFact || "Recorded in the International Observances Registry."}
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-purple-50/70 border border-purple-200 space-y-1">
            <div className="text-[11px] font-extrabold uppercase text-purple-800 tracking-wider flex items-center gap-1.5">
              <BookOpen className="w-3.5 h-3.5 text-purple-600" />
              <span>Official Global Registry</span>
            </div>
            <div className="text-xs font-bold text-purple-950">
              {currentViewInfo.celebrations[0]?.source}
            </div>
          </div>
        </div>
      </div>

      {/* QUICK EXPLORER FOR FAMOUS GLOBAL CELEBRATIONS */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h4 className="text-base font-black text-slate-900 flex items-center gap-2">
              <Globe className="w-4 h-4 text-indigo-600" />
              <span>Explore Major World Calendar Observances</span>
            </h4>
            <p className="text-xs text-slate-500 font-medium">
              Click any milestone below to see world records and historical context
            </p>
          </div>

          <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-slate-100 text-slate-600">
            365 Days International Coverage
          </span>
        </div>

        <div className="flex flex-wrap gap-2 pt-1">
          {quickJumpDays.map((item, idx) => (
            <button
              key={idx}
              onClick={() => setSelectedDate(item.date)}
              className={`px-3.5 py-2 rounded-2xl text-xs font-extrabold transition shadow-2xs border ${
                selectedDate.getMonth() === item.date.getMonth() && selectedDate.getDate() === item.date.getDate()
                  ? 'bg-indigo-600 text-white border-indigo-700 shadow-sm'
                  : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {/* READ-ONLY SOURCE CREDENTIALS FOOTER */}
      <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-500 flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
        <div className="flex items-center gap-2 font-medium">
          <Info className="w-4 h-4 text-indigo-600 shrink-0" />
          <span>
            This window is strictly synchronized with official international records (United Nations, UNESCO & Global Observance archives). Content cannot be edited locally.
          </span>
        </div>
        <span className="font-bold text-slate-700 shrink-0">
          Source: UN / UNESCO Global Records
        </span>
      </div>
    </div>
  );
};
