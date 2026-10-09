import React, { useState } from 'react';
import {
  ShieldAlert,
  VolumeX,
  Shirt,
  UtensilsCrossed,
  Briefcase,
  HeartHandshake,
  CheckCircle2,
  Clock,
  Sparkles,
  Info,
  Shield,
  Lightbulb,
  Scale,
  HandHeart,
  Users
} from 'lucide-react';

export const SchoolRulesDashboard: React.FC = () => {
  const [selectedFilter, setSelectedFilter] = useState<'ALL' | 'VALUES' | 'ACADEMIC' | 'LIFESTYLE' | 'COMMUNITY'>('ALL');

  // USAP School Core Values
  const coreValues = [
    {
      name: "Integrity",
      motto: "Uncompromising honesty, academic authenticity, and moral courage",
      description: "Doing the right thing even when no one is watching. In all academic assessments, examinations, interpersonal relationships, and leadership obligations, students and faculty uphold truthfulness, personal honor, and mutual trust.",
      icon: Shield,
      accent: "from-purple-600 to-indigo-600",
      bgLight: "bg-purple-50",
      border: "border-purple-200",
      textCol: "text-purple-700"
    },
    {
      name: "Curiosity",
      motto: "Voracious inquiry, intellectual depth, and critical thought",
      description: "Relentless passion for exploration, questioning assumptions, scientific discovery, and creative problem-solving. USAP scholars interrogate the world with open minds and seek innovative solutions to continental challenges.",
      icon: Lightbulb,
      accent: "from-amber-500 to-orange-500",
      bgLight: "bg-amber-50",
      border: "border-amber-200",
      textCol: "text-amber-700"
    },
    {
      name: "Equality",
      motto: "Inherent human dignity, fairness, and mutual respect",
      description: "Belief in the equal worth of every individual. Our community embraces socioeconomic, cultural, and ideological diversity, ensuring an inclusive campus where every voice is valued and dignity is unconditional.",
      icon: Scale,
      accent: "from-emerald-600 to-teal-600",
      bgLight: "bg-emerald-50",
      border: "border-emerald-200",
      textCol: "text-emerald-700"
    },
    {
      name: "Service",
      motto: "Empathetic stewardship, servant leadership, and social impact",
      description: "Using our intellect, skills, and resources to uplift humanity. Demonstrated daily through our Work Programme, peer mentorship, environmental care, and proactive commitment to national and continental transformation.",
      icon: HandHeart,
      accent: "from-rose-500 to-pink-600",
      bgLight: "bg-rose-50",
      border: "border-rose-200",
      textCol: "text-rose-700"
    },
    {
      name: "Community",
      motto: "Ubuntu, collective solidarity, and shared responsibility",
      description: "Living as one interconnected family where individual flourishing and communal wellbeing are indivisible. Fostered through silent Quaker worship, shared dining hall fellowship, and collective stewardship.",
      icon: Users,
      accent: "from-blue-600 to-cyan-600",
      bgLight: "bg-blue-50",
      border: "border-blue-200",
      textCol: "text-blue-700"
    }
  ];

  const schoolRules = [
    {
      id: 'uniform',
      category: 'LIFESTYLE',
      valueTie: 'Integrity & Equality',
      title: 'School Uniform Policy',
      rule: 'Students are required to be dressed in complete school uniform during official school hours on all weekdays.',
      details: 'Full school uniform is compulsory from 7:40 AM through the close of the academic day from Monday to Friday. Neat and tidy presentation is expected at all times across academic buildings, the library, and assembly grounds.',
      tag: 'Mandatory Weekdays',
      icon: Shirt,
      color: 'purple'
    },
    {
      id: 'prep',
      category: 'ACADEMIC',
      valueTie: 'Curiosity & Integrity',
      title: 'Silent Evening Prep',
      rule: 'Silent prep must be strictly observed during designated evening study hours in all academic venues and study halls.',
      details: 'Evening study sessions require absolute quiet to maintain an optimal academic learning environment. Weekday prep concludes at 10:30 PM, whereas weekend prep concludes at 9:00 PM, after which students must retire to their dormitories to sleep.',
      tag: 'Strict Silence',
      icon: VolumeX,
      color: 'indigo'
    },
    {
      id: 'exams',
      category: 'ACADEMIC',
      valueTie: 'Integrity & Equality',
      title: 'Exam Quiet Protocol',
      rule: 'Students and staff must maintain complete silence across campus throughout all official examination sessions.',
      details: 'Whenever an examination or academic test is in session in the library, dining hall, or laboratories, adjacent areas are designated strict quiet zones. Noise disruptions are strictly prohibited.',
      tag: 'Campus Quiet Zone',
      icon: ShieldAlert,
      color: 'rose'
    },
    {
      id: 'meals',
      category: 'LIFESTYLE',
      valueTie: 'Community & Equality',
      title: 'Mandatory Meal Attendance',
      rule: 'Attendance at Lunch and Dinner is compulsory for all students; Breakfast and Snack breaks are optional.',
      details: 'To safeguard community health, nutrition, and accountability, Lunch (1:00 PM – 2:00 PM) and Dinner (6:00 PM – 7:00 PM) are mandatory for all students. Breakfast (7:00 AM – 7:35 AM), morning snack (9:45 AM – 10:00 AM), and evening snack (9:00 PM) are optional.',
      tag: 'Lunch & Dinner Compulsory',
      icon: UtensilsCrossed,
      color: 'amber'
    },
    {
      id: 'work_programme',
      category: 'COMMUNITY',
      valueTie: 'Service & Community',
      title: 'Student Work Programme Duties',
      rule: 'All students must punctually report to and diligently complete their assigned work programme duties.',
      details: 'Work programme responsibilities instill stewardship, shared responsibility, and practical leadership across our campus. Students must report on schedule to their designated supervisors (campus maintenance, dining hall service, library archiving, or groundskeeping).',
      tag: 'Campus Stewardship',
      icon: Briefcase,
      color: 'teal'
    },
    {
      id: 'quaker',
      category: 'COMMUNITY',
      valueTie: 'Community & Equality',
      title: 'Sunday Quaker Meeting for Worship',
      rule: 'On Sundays, all community members are expected to gather in the Dining Hall or outdoor grounds for Quaker meeting, unless formally excused on medical grounds.',
      details: 'The Sunday Quaker meeting provides communal reflection, quiet contemplation, and spiritual fellowship. Attendance is expected for all community members; individuals who are unwell must report to the school clinic or leadership beforehand.',
      tag: 'Sundays 8:00 AM – 8:45 AM • Communal Fellowship',
      icon: HeartHandshake,
      color: 'blue'
    }
  ];

  const filteredRules = selectedFilter === 'ALL'
    ? schoolRules
    : schoolRules.filter(r => r.category === selectedFilter);

  return (
    <div className="space-y-6 text-left">
      {/* Hero Banner */}
      <div className="bg-gradient-to-r from-purple-950 via-purple-900 to-indigo-950 text-white p-6 sm:p-8 rounded-3xl shadow-md border border-purple-800 relative overflow-hidden">
        <div className="relative z-10 max-w-3xl">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-800/80 border border-purple-600/60 text-[10px] font-black uppercase tracking-wider text-purple-200 mb-3">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>USAP Community School — Foundation & Community Code</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            School Core Values & Community Policies
          </h2>
          <p className="text-xs sm:text-sm text-purple-200 mt-2 leading-relaxed font-medium">
            Guided by the five pillars of <strong>Integrity, Curiosity, Equality, Service, and Community</strong>. These timeless values govern our academic standards, daily campus routine, and community conduct.
          </p>
        </div>

        {/* 5 Core Values Pill Strip */}
        <div className="mt-5 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2 pt-4 border-t border-purple-800/60">
          {coreValues.map((val) => {
            const Icon = val.icon;
            return (
              <div
                key={val.name}
                className="bg-white/10 backdrop-blur-sm border border-purple-700/50 rounded-2xl p-2.5 text-center flex flex-col items-center justify-center hover:bg-white/15 transition"
              >
                <div className="w-7 h-7 rounded-xl bg-purple-800/90 text-amber-300 flex items-center justify-center mb-1 shadow-xs">
                  <Icon className="w-4 h-4" />
                </div>
                <span className="text-xs font-black text-white tracking-wide">{val.name}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* CORE VALUES DETAIL SECTION */}
      {(selectedFilter === 'ALL' || selectedFilter === 'VALUES') && (
        <div className="bg-white border border-purple-100 rounded-3xl p-6 sm:p-8 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-purple-100 pb-4">
            <div>
              <div className="text-[11px] font-extrabold text-purple-700 uppercase tracking-wider">The 5 Pillars of USAP Community School</div>
              <h3 className="text-xl font-black text-slate-900 mt-0.5">The Five Core Values</h3>
            </div>
            <span className="text-xs font-bold bg-purple-50 text-purple-800 border border-purple-200 px-3 py-1 rounded-full self-start sm:self-auto">
              Integrity • Curiosity • Equality • Service • Community
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-2">
            {coreValues.map((val) => {
              const Icon = val.icon;
              return (
                <div
                  key={val.name}
                  className={`${val.bgLight} border ${val.border} rounded-2xl p-5 flex flex-col justify-between hover:shadow-md transition`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <div className={`w-10 h-10 rounded-2xl bg-gradient-to-br ${val.accent} text-white flex items-center justify-center shadow-sm`}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <span className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-white border ${val.border} ${val.textCol}`}>
                        Core Pillar
                      </span>
                    </div>

                    <h4 className="text-lg font-black text-slate-900 mb-1">
                      {val.name}
                    </h4>
                    <p className={`text-xs font-extrabold ${val.textCol} mb-2.5 italic`}>
                      “{val.motto}”
                    </p>
                    <p className="text-xs text-slate-700 leading-relaxed font-medium">
                      {val.description}
                    </p>
                  </div>

                  <div className="mt-4 pt-3 border-t border-purple-100/60 flex items-center justify-between text-[10.5px] text-slate-500 font-semibold">
                    <span>USAP Principle</span>
                    <span className="text-emerald-700 font-bold flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Practiced Daily
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-purple-100 shadow-2xs">
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            onClick={() => setSelectedFilter('ALL')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
              selectedFilter === 'ALL'
                ? 'bg-purple-600 text-white shadow-2xs'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            All Values & Rules
          </button>
          <button
            onClick={() => setSelectedFilter('VALUES')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
              selectedFilter === 'VALUES'
                ? 'bg-purple-600 text-white shadow-2xs'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            5 Core Values
          </button>
          <button
            onClick={() => setSelectedFilter('ACADEMIC')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
              selectedFilter === 'ACADEMIC'
                ? 'bg-purple-600 text-white shadow-2xs'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            Academic & Quiet Hours
          </button>
          <button
            onClick={() => setSelectedFilter('LIFESTYLE')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
              selectedFilter === 'LIFESTYLE'
                ? 'bg-purple-600 text-white shadow-2xs'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            Uniform & Meals
          </button>
          <button
            onClick={() => setSelectedFilter('COMMUNITY')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
              selectedFilter === 'COMMUNITY'
                ? 'bg-purple-600 text-white shadow-2xs'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            Work Programme & Quaker Meetings
          </button>
        </div>

        <span className="text-[11px] text-slate-400 font-semibold flex items-center gap-1">
          <Info className="w-3.5 h-3.5 text-purple-600" />
          Anchored in Core Values
        </span>
      </div>

      {/* Rule Cards Grid */}
      {selectedFilter !== 'VALUES' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredRules.map((rule) => {
            const Icon = rule.icon;
            return (
              <div
                key={rule.id}
                className="bg-white border border-purple-100 rounded-3xl p-5 sm:p-6 shadow-sm hover:shadow-md transition flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="w-10 h-10 rounded-2xl bg-purple-100 text-purple-700 flex items-center justify-center shrink-0">
                      <Icon className="w-5 h-5" />
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <span className="text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-1 rounded-full bg-purple-50 text-purple-800 border border-purple-200">
                        {rule.tag}
                      </span>
                      <span className="text-[10px] font-bold text-slate-500">
                        Pillar: <strong className="text-purple-700">{rule.valueTie}</strong>
                      </span>
                    </div>
                  </div>

                  <h3 className="text-base font-black text-slate-900 mb-1.5">
                    {rule.title}
                  </h3>
                  <p className="text-xs font-bold text-purple-950 bg-purple-50/70 p-3 rounded-2xl border border-purple-100/80 mb-3 leading-relaxed">
                    “{rule.rule}”
                  </p>
                  <p className="text-xs text-slate-600 leading-relaxed font-medium">
                    {rule.details}
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-purple-50 flex items-center justify-between text-[11px] text-slate-400">
                  <span className="font-semibold">{rule.category} PROTOCOL</span>
                  <span className="text-purple-700 font-bold flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> Mandatory Compliance
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Daily Routine Cross-Reference */}
      <div className="bg-amber-50/70 border border-amber-200 rounded-3xl p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center shrink-0">
            <Clock className="w-5 h-5 text-amber-700" />
          </div>
          <div>
            <h4 className="text-xs sm:text-sm font-extrabold text-amber-950">
              Timetable Synchronization Active
            </h4>
            <p className="text-[11px] text-amber-900 mt-0.5 font-medium">
              Daily routine timings (Breakfast at 7:00 AM, Morning Snack at 9:45 AM, Lunch at 1:05 PM, Dinner at 6:00 PM, Prep 7:00 PM – 9:00 PM, Evening Snack at 9:00 PM, Optional Prep 9:15 PM – 10:30 PM, Wednesday Convocation at 12:00 PM, Friday no-lessons after lunch, and Sunday Quaker Meeting) are synchronized in real-time with device alerts.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
