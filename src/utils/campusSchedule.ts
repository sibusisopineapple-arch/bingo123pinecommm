import { SchoolTest } from '../types';

export type ScheduleCategory =
  | 'MEAL'
  | 'QUAKER'
  | 'LESSON'
  | 'EXTRACURRICULAR'
  | 'CONVOCATION'
  | 'CONSULTATION'
  | 'PHONE_TIME'
  | 'OWN_TIME'
  | 'PREP'
  | 'OPTIONAL_PREP'
  | 'SLEEP'
  | 'SNACK'
  | 'EXAM'
  | 'ROUTINE';

export interface CurrentScheduleInfo {
  category: ScheduleCategory;
  title: string;
  shortName: string;
  timeWindow: string;
  description: string;
  statusBadge: string;
  badgeStyle: string; // Tailwind class
  accentBorder: string;
  icon: string;
  nextEvent?: {
    name: string;
    timeStr: string;
    minutesAway: number;
  };
  activeExam?: SchoolTest;
  isExamBeepActive?: boolean;
  examSecondsRemaining?: number;
}

export interface TimeBlock {
  startMin: number;
  endMin: number;
  category: ScheduleCategory;
  shortName: string;
  title: string;
  timeWindow: string;
  description: string;
  icon: string;
  badgeStyle: string;
  accentBorder: string;
}

// Convert hours and minutes to minutes from midnight
export function toMin(h: number, m: number): number {
  return h * 60 + m;
}

// Format minutes from midnight to 12-hour AM/PM string
export function minToTimeString(min: number): string {
  const normalized = (min % 1440 + 1440) % 1440;
  const hours24 = Math.floor(normalized / 60);
  const minutes = normalized % 60;
  const period = hours24 >= 12 ? 'PM' : 'AM';
  const hours12 = hours24 % 12 === 0 ? 12 : hours24 % 12;
  return `${hours12}:${String(minutes).padStart(2, '0')} ${period}`;
}

// Standard Weekday Schedule (Mon, Tue, Thu)
export const STANDARD_WEEKDAY_BLOCKS: TimeBlock[] = [
  {
    startMin: toMin(0, 0),
    endMin: toMin(6, 0),
    category: 'SLEEP',
    shortName: 'Sleep & Rest',
    title: '🌙 Sleep and Morning Preparation Time (10:30 PM – 7:00 AM)',
    timeWindow: '10:30 PM – 6:00 AM',
    description: 'Dormitory quiet hours and sleep. Students rest for morning academic schedule.',
    icon: '🌙',
    badgeStyle: 'bg-slate-700 text-slate-100',
    accentBorder: 'border-slate-300 bg-slate-100 text-slate-900'
  },
  {
    startMin: toMin(6, 0),
    endMin: toMin(7, 0),
    category: 'ROUTINE',
    shortName: 'Morning Rising',
    title: '🌅 Morning Rising & Preparation (6:00 AM – 7:00 AM)',
    timeWindow: '6:00 AM – 7:00 AM',
    description: 'Dorm wakeup, campus freshening, and preparation for breakfast in the Dining Hall.',
    icon: '🌅',
    badgeStyle: 'bg-sky-600 text-white',
    accentBorder: 'border-sky-300 bg-sky-50 text-sky-950'
  },
  {
    startMin: toMin(7, 0),
    endMin: toMin(7, 35),
    category: 'MEAL',
    shortName: 'Breakfast Time',
    title: '🥣 Breakfast Time (7:00 AM – 7:35 AM)',
    timeWindow: '7:00 AM – 7:35 AM',
    description: 'Morning breakfast is served in the Dining Hall (DH). Breakfast ends at 7:35 AM; lessons start promptly at 7:40 AM.',
    icon: '🥣',
    badgeStyle: 'bg-amber-600 text-white ring-2 ring-amber-300 shadow-md',
    accentBorder: 'border-amber-400 bg-amber-50 text-amber-950'
  },
  {
    startMin: toMin(7, 35),
    endMin: toMin(7, 40),
    category: 'ROUTINE',
    shortName: 'Lesson Transition',
    title: '🚶 Transition to Classrooms (7:35 AM – 7:40 AM)',
    timeWindow: '7:35 AM – 7:40 AM',
    description: 'Breakfast has concluded. Students and teachers proceed to classrooms and laboratories for 7:40 AM lessons.',
    icon: '🚶',
    badgeStyle: 'bg-purple-600 text-white',
    accentBorder: 'border-purple-300 bg-purple-50 text-purple-950'
  },
  {
    startMin: toMin(7, 40),
    endMin: toMin(9, 45),
    category: 'LESSON',
    shortName: 'Lesson Time',
    title: '📚 Lesson Time: Morning Block 1 (7:40 AM – 9:45 AM)',
    timeWindow: '7:40 AM – 9:45 AM',
    description: 'Academic lessons and instructional periods in session across classrooms and science/computer laboratories.',
    icon: '📚',
    badgeStyle: 'bg-blue-600 text-white shadow-sm',
    accentBorder: 'border-blue-300 bg-blue-50 text-blue-950'
  },
  {
    startMin: toMin(9, 45),
    endMin: toMin(10, 0),
    category: 'SNACK',
    shortName: 'Morning Snack',
    title: '☕ Morning Snack Time (9:45 AM – 10:00 AM)',
    timeWindow: '9:45 AM – 10:00 AM',
    description: 'Morning tea and snack break in the Dining Hall (DH). Lessons resume promptly at 10:00 AM.',
    icon: '☕',
    badgeStyle: 'bg-emerald-600 text-white ring-2 ring-emerald-300 shadow-md',
    accentBorder: 'border-emerald-400 bg-emerald-50 text-emerald-950'
  },
  {
    startMin: toMin(10, 0),
    endMin: toMin(13, 5),
    category: 'LESSON',
    shortName: 'Lesson Time',
    title: '📚 Lesson Time: Morning Block 2 (10:00 AM – 1:05 PM)',
    timeWindow: '10:00 AM – 1:05 PM',
    description: 'Academic lectures, lab investigations, and classroom discussions. Lunch starts at 1:05 PM.',
    icon: '📚',
    badgeStyle: 'bg-blue-600 text-white shadow-sm',
    accentBorder: 'border-blue-300 bg-blue-50 text-blue-950'
  },
  {
    startMin: toMin(13, 5),
    endMin: toMin(14, 0),
    category: 'MEAL',
    shortName: 'Lunch Time',
    title: '🍽️ Lunch Time (1:05 PM – 2:00 PM)',
    timeWindow: '1:05 PM – 2:00 PM',
    description: 'Weekday lunch served in the Dining Hall (DH). Afternoon lessons begin promptly at 2:00 PM.',
    icon: '🍽️',
    badgeStyle: 'bg-amber-600 text-white ring-2 ring-amber-300 shadow-md',
    accentBorder: 'border-amber-400 bg-amber-50 text-amber-950'
  },
  {
    startMin: toMin(14, 0),
    endMin: toMin(16, 0),
    category: 'LESSON',
    shortName: 'Lesson Time',
    title: '📖 Lesson Time: Afternoon Block (2:00 PM – 4:00 PM)',
    timeWindow: '2:00 PM – 4:00 PM',
    description: 'Afternoon academic classes, subject tutorials, and lab experiments.',
    icon: '📖',
    badgeStyle: 'bg-blue-600 text-white shadow-sm',
    accentBorder: 'border-blue-300 bg-blue-50 text-blue-950'
  },
  {
    startMin: toMin(16, 0),
    endMin: toMin(17, 50),
    category: 'EXTRACURRICULAR',
    shortName: 'Extracurricular Activities',
    title: '⚽ Extracurricular Activities Time (4:00 PM – 5:50 PM)',
    timeWindow: '4:00 PM – 5:50 PM',
    description: 'Extracurricular activities! Sports, athletics, debate, music, robotics, community projects, and student clubs.',
    icon: '⚽',
    badgeStyle: 'bg-teal-600 text-white shadow-sm',
    accentBorder: 'border-teal-300 bg-teal-50 text-teal-950'
  },
  {
    startMin: toMin(17, 50),
    endMin: toMin(18, 0),
    category: 'ROUTINE',
    shortName: 'Dinner Transition',
    title: '🚶 5:50 PM Meal Alert — Assembling for Dinner (5:50 PM – 6:00 PM)',
    timeWindow: '5:50 PM – 6:00 PM',
    description: '5:50 PM Daily meal alarm rings! Students and staff proceed to Dining Hall. Dinner served at 6:00 PM.',
    icon: '🚶',
    badgeStyle: 'bg-purple-600 text-white',
    accentBorder: 'border-purple-300 bg-purple-50 text-purple-950'
  },
  {
    startMin: toMin(18, 0),
    endMin: toMin(19, 0),
    category: 'MEAL',
    shortName: 'Dinner Time',
    title: '🍲 Dinner Time (6:00 PM – 7:00 PM)',
    timeWindow: '6:00 PM – 7:00 PM',
    description: 'Dinner served in the Dining Hall (DH). Evening prep starts at 7:00 PM.',
    icon: '🍲',
    badgeStyle: 'bg-amber-600 text-white ring-2 ring-amber-300 shadow-md',
    accentBorder: 'border-amber-400 bg-amber-50 text-amber-950'
  },
  {
    startMin: toMin(19, 0),
    endMin: toMin(21, 0),
    category: 'PREP',
    shortName: 'Prep Time',
    title: '📝 Prep Time (7:00 PM – 9:00 PM)',
    timeWindow: '7:00 PM – 9:00 PM',
    description: 'Compulsory evening academic study, assignments, and test preparation. Evening snack follows at 9:00 PM.',
    icon: '📝',
    badgeStyle: 'bg-violet-700 text-white shadow-sm',
    accentBorder: 'border-violet-300 bg-violet-50 text-violet-950'
  },
  {
    startMin: toMin(21, 0),
    endMin: toMin(21, 15),
    category: 'SNACK',
    shortName: 'Evening Snack',
    title: '🥪 Evening Snack Time (9:00 PM – 9:15 PM)',
    timeWindow: '9:00 PM – 9:15 PM',
    description: 'Evening snack and tea served in the Dining Hall (DH). Optional prep begins at 9:15 PM.',
    icon: '🥪',
    badgeStyle: 'bg-emerald-600 text-white ring-2 ring-emerald-300 shadow-md',
    accentBorder: 'border-emerald-400 bg-emerald-50 text-emerald-950'
  },
  {
    startMin: toMin(21, 15),
    endMin: toMin(22, 30),
    category: 'OPTIONAL_PREP',
    shortName: 'Optional Prep',
    title: '📖 Optional Prep Time (9:15 PM – 10:30 PM)',
    timeWindow: '9:15 PM – 10:30 PM',
    description: 'Optional evening prep for students continuing personal revision and projects. Prep concludes at 10:30 PM.',
    icon: '📖',
    badgeStyle: 'bg-indigo-600 text-white shadow-sm',
    accentBorder: 'border-indigo-300 bg-indigo-50 text-indigo-950'
  },
  {
    startMin: toMin(22, 30),
    endMin: toMin(24, 0),
    category: 'SLEEP',
    shortName: 'Sleep Time',
    title: '🌙 Sleep and Morning Preparation Time (10:30 PM – 7:00 AM)',
    timeWindow: '10:30 PM – 7:00 AM',
    description: 'Prep has concluded. Dormitory quiet hours, rest, and morning prep.',
    icon: '🌙',
    badgeStyle: 'bg-slate-700 text-slate-100',
    accentBorder: 'border-slate-300 bg-slate-100 text-slate-900'
  }
];

// Wednesday Special Schedule (Convocation at 12:00-1:05 PM, Consultation at 2:00-3:00 PM, Extracurricular till dinner)
export const WEDNESDAY_BLOCKS: TimeBlock[] = [
  {
    startMin: toMin(0, 0),
    endMin: toMin(6, 0),
    category: 'SLEEP',
    shortName: 'Sleep & Rest',
    title: '🌙 Sleep and Morning Preparation Time (10:30 PM – 7:00 AM)',
    timeWindow: '10:30 PM – 6:00 AM',
    description: 'Dormitory quiet hours and sleep.',
    icon: '🌙',
    badgeStyle: 'bg-slate-700 text-slate-100',
    accentBorder: 'border-slate-300 bg-slate-100 text-slate-900'
  },
  {
    startMin: toMin(6, 0),
    endMin: toMin(7, 0),
    category: 'ROUTINE',
    shortName: 'Morning Rising',
    title: '🌅 Morning Rising & Preparation (6:00 AM – 7:00 AM)',
    timeWindow: '6:00 AM – 7:00 AM',
    description: 'Dorm wakeup, campus freshening, and preparation for breakfast in the Dining Hall.',
    icon: '🌅',
    badgeStyle: 'bg-sky-600 text-white',
    accentBorder: 'border-sky-300 bg-sky-50 text-sky-950'
  },
  {
    startMin: toMin(7, 0),
    endMin: toMin(7, 35),
    category: 'MEAL',
    shortName: 'Breakfast Time',
    title: '🥣 Breakfast Time (7:00 AM – 7:35 AM)',
    timeWindow: '7:00 AM – 7:35 AM',
    description: 'Morning breakfast served in Dining Hall. Breakfast ends at 7:35 AM; lessons start at 7:40 AM.',
    icon: '🥣',
    badgeStyle: 'bg-amber-600 text-white ring-2 ring-amber-300 shadow-md',
    accentBorder: 'border-amber-400 bg-amber-50 text-amber-950'
  },
  {
    startMin: toMin(7, 35),
    endMin: toMin(7, 40),
    category: 'ROUTINE',
    shortName: 'Lesson Transition',
    title: '🚶 Transition to Classrooms (7:35 AM – 7:40 AM)',
    timeWindow: '7:35 AM – 7:40 AM',
    description: 'Breakfast concluded. Students proceed to classrooms for 7:40 AM lessons.',
    icon: '🚶',
    badgeStyle: 'bg-purple-600 text-white',
    accentBorder: 'border-purple-300 bg-purple-50 text-purple-950'
  },
  {
    startMin: toMin(7, 40),
    endMin: toMin(9, 45),
    category: 'LESSON',
    shortName: 'Lesson Time',
    title: '📚 Lesson Time: Morning Block 1 (7:40 AM – 9:45 AM)',
    timeWindow: '7:40 AM – 9:45 AM',
    description: 'Wednesday academic instructional periods in session.',
    icon: '📚',
    badgeStyle: 'bg-blue-600 text-white shadow-sm',
    accentBorder: 'border-blue-300 bg-blue-50 text-blue-950'
  },
  {
    startMin: toMin(9, 45),
    endMin: toMin(10, 0),
    category: 'SNACK',
    shortName: 'Morning Snack',
    title: '☕ Morning Snack Time (9:45 AM – 10:00 AM)',
    timeWindow: '9:45 AM – 10:00 AM',
    description: 'Morning tea and snack break in the Dining Hall (DH).',
    icon: '☕',
    badgeStyle: 'bg-emerald-600 text-white ring-2 ring-emerald-300 shadow-md',
    accentBorder: 'border-emerald-400 bg-emerald-50 text-emerald-950'
  },
  {
    startMin: toMin(10, 0),
    endMin: toMin(12, 0),
    category: 'LESSON',
    shortName: 'Lesson Time',
    title: '📚 Lesson Time: Wednesday Morning Block (10:00 AM – 12:00 PM)',
    timeWindow: '10:00 AM – 12:00 PM',
    description: 'Morning lessons in session. All-school Convocation follows at 12:00 PM.',
    icon: '📚',
    badgeStyle: 'bg-blue-600 text-white shadow-sm',
    accentBorder: 'border-blue-300 bg-blue-50 text-blue-950'
  },
  {
    startMin: toMin(12, 0),
    endMin: toMin(13, 5),
    category: 'CONVOCATION',
    shortName: 'Convocation Time',
    title: '🏛️ All-School Convocation Time (12:00 PM – 1:05 PM)',
    timeWindow: '12:00 PM – 1:05 PM',
    description: 'Wednesday All-School Convocation! Community assembly, leadership updates, special presentations, and school fellowship.',
    icon: '🏛️',
    badgeStyle: 'bg-purple-700 text-white ring-2 ring-purple-300 shadow-md',
    accentBorder: 'border-purple-400 bg-purple-50 text-purple-950'
  },
  {
    startMin: toMin(13, 5),
    endMin: toMin(14, 0),
    category: 'MEAL',
    shortName: 'Lunch Time',
    title: '🍽️ Lunch Time (1:05 PM – 2:00 PM)',
    timeWindow: '1:05 PM – 2:00 PM',
    description: 'Wednesday lunch served in the Dining Hall (DH). Advisor consultation follows at 2:00 PM.',
    icon: '🍽️',
    badgeStyle: 'bg-amber-600 text-white ring-2 ring-amber-300 shadow-md',
    accentBorder: 'border-amber-400 bg-amber-50 text-amber-950'
  },
  {
    startMin: toMin(14, 0),
    endMin: toMin(15, 0),
    category: 'CONSULTATION',
    shortName: 'Advisor Consultation',
    title: '🤝 Advisor Consultation / Faculty Meeting (2:00 PM – 3:00 PM)',
    timeWindow: '2:00 PM – 3:00 PM',
    description: 'Advisor group check-ins, student mentorship sessions, and faculty collaboration meetings.',
    icon: '🤝',
    badgeStyle: 'bg-cyan-700 text-white ring-2 ring-cyan-300 shadow-md',
    accentBorder: 'border-cyan-400 bg-cyan-50 text-cyan-950'
  },
  {
    startMin: toMin(15, 0),
    endMin: toMin(17, 50),
    category: 'EXTRACURRICULAR',
    shortName: 'Extracurricular Activities',
    title: '⚽ Extracurricular Activities Time (3:00 PM – 5:50 PM)',
    timeWindow: '3:00 PM – 5:50 PM',
    description: 'Wednesday afternoon extracurriculars! Sports, robotics, arts, music, clubs, and outdoor activities until dinner.',
    icon: '⚽',
    badgeStyle: 'bg-teal-600 text-white shadow-sm',
    accentBorder: 'border-teal-300 bg-teal-50 text-teal-950'
  },
  {
    startMin: toMin(17, 50),
    endMin: toMin(18, 0),
    category: 'ROUTINE',
    shortName: 'Dinner Transition',
    title: '🚶 5:50 PM Meal Alert — Assembling for Dinner (5:50 PM – 6:00 PM)',
    timeWindow: '5:50 PM – 6:00 PM',
    description: '5:50 PM Meal alarm rings! Dinner served at 6:00 PM in the Dining Hall.',
    icon: '🚶',
    badgeStyle: 'bg-purple-600 text-white',
    accentBorder: 'border-purple-300 bg-purple-50 text-purple-950'
  },
  {
    startMin: toMin(18, 0),
    endMin: toMin(19, 0),
    category: 'MEAL',
    shortName: 'Dinner Time',
    title: '🍲 Dinner Time (6:00 PM – 7:00 PM)',
    timeWindow: '6:00 PM – 7:00 PM',
    description: 'Dinner served in the Dining Hall (DH). Evening prep starts at 7:00 PM.',
    icon: '🍲',
    badgeStyle: 'bg-amber-600 text-white ring-2 ring-amber-300 shadow-md',
    accentBorder: 'border-amber-400 bg-amber-50 text-amber-950'
  },
  {
    startMin: toMin(19, 0),
    endMin: toMin(21, 0),
    category: 'PREP',
    shortName: 'Prep Time',
    title: '📝 Prep Time (7:00 PM – 9:00 PM)',
    timeWindow: '7:00 PM – 9:00 PM',
    description: 'Compulsory evening academic study, assignments, and test preparation.',
    icon: '📝',
    badgeStyle: 'bg-violet-700 text-white shadow-sm',
    accentBorder: 'border-violet-300 bg-violet-50 text-violet-950'
  },
  {
    startMin: toMin(21, 0),
    endMin: toMin(21, 15),
    category: 'SNACK',
    shortName: 'Evening Snack',
    title: '🥪 Evening Snack Time (9:00 PM – 9:15 PM)',
    timeWindow: '9:00 PM – 9:15 PM',
    description: 'Evening snack and tea served in the Dining Hall (DH).',
    icon: '🥪',
    badgeStyle: 'bg-emerald-600 text-white ring-2 ring-emerald-300 shadow-md',
    accentBorder: 'border-emerald-400 bg-emerald-50 text-emerald-950'
  },
  {
    startMin: toMin(21, 15),
    endMin: toMin(22, 30),
    category: 'OPTIONAL_PREP',
    shortName: 'Optional Prep',
    title: '📖 Optional Prep Time (9:15 PM – 10:30 PM)',
    timeWindow: '9:15 PM – 10:30 PM',
    description: 'Optional evening prep. Prep ends at 10:30 PM.',
    icon: '📖',
    badgeStyle: 'bg-indigo-600 text-white shadow-sm',
    accentBorder: 'border-indigo-300 bg-indigo-50 text-indigo-950'
  },
  {
    startMin: toMin(22, 30),
    endMin: toMin(24, 0),
    category: 'SLEEP',
    shortName: 'Sleep Time',
    title: '🌙 Sleep and Morning Preparation Time (10:30 PM – 7:00 AM)',
    timeWindow: '10:30 PM – 7:00 AM',
    description: 'Prep has concluded. Dormitory quiet hours, rest, and morning prep.',
    icon: '🌙',
    badgeStyle: 'bg-slate-700 text-slate-100',
    accentBorder: 'border-slate-300 bg-slate-100 text-slate-900'
  }
];

// Friday Special Schedule (No lessons after lunch time)
export const FRIDAY_BLOCKS: TimeBlock[] = [
  {
    startMin: toMin(0, 0),
    endMin: toMin(6, 0),
    category: 'SLEEP',
    shortName: 'Sleep & Rest',
    title: '🌙 Sleep and Morning Preparation Time (10:30 PM – 7:00 AM)',
    timeWindow: '10:30 PM – 6:00 AM',
    description: 'Dormitory quiet hours and sleep.',
    icon: '🌙',
    badgeStyle: 'bg-slate-700 text-slate-100',
    accentBorder: 'border-slate-300 bg-slate-100 text-slate-900'
  },
  {
    startMin: toMin(6, 0),
    endMin: toMin(7, 0),
    category: 'ROUTINE',
    shortName: 'Morning Rising',
    title: '🌅 Morning Rising & Preparation (6:00 AM – 7:00 AM)',
    timeWindow: '6:00 AM – 7:00 AM',
    description: 'Dorm wakeup, campus freshening, and preparation for breakfast in the Dining Hall.',
    icon: '🌅',
    badgeStyle: 'bg-sky-600 text-white',
    accentBorder: 'border-sky-300 bg-sky-50 text-sky-950'
  },
  {
    startMin: toMin(7, 0),
    endMin: toMin(7, 35),
    category: 'MEAL',
    shortName: 'Breakfast Time',
    title: '🥣 Breakfast Time (7:00 AM – 7:35 AM)',
    timeWindow: '7:00 AM – 7:35 AM',
    description: 'Morning breakfast served in Dining Hall. Breakfast ends at 7:35 AM; lessons start at 7:40 AM.',
    icon: '🥣',
    badgeStyle: 'bg-amber-600 text-white ring-2 ring-amber-300 shadow-md',
    accentBorder: 'border-amber-400 bg-amber-50 text-amber-950'
  },
  {
    startMin: toMin(7, 35),
    endMin: toMin(7, 40),
    category: 'ROUTINE',
    shortName: 'Lesson Transition',
    title: '🚶 Transition to Classrooms (7:35 AM – 7:40 AM)',
    timeWindow: '7:35 AM – 7:40 AM',
    description: 'Breakfast concluded. Students proceed to classrooms for 7:40 AM lessons.',
    icon: '🚶',
    badgeStyle: 'bg-purple-600 text-white',
    accentBorder: 'border-purple-300 bg-purple-50 text-purple-950'
  },
  {
    startMin: toMin(7, 40),
    endMin: toMin(9, 45),
    category: 'LESSON',
    shortName: 'Lesson Time',
    title: '📚 Lesson Time: Morning Block 1 (7:40 AM – 9:45 AM)',
    timeWindow: '7:40 AM – 9:45 AM',
    description: 'Friday morning academic instructional periods.',
    icon: '📚',
    badgeStyle: 'bg-blue-600 text-white shadow-sm',
    accentBorder: 'border-blue-300 bg-blue-50 text-blue-950'
  },
  {
    startMin: toMin(9, 45),
    endMin: toMin(10, 0),
    category: 'SNACK',
    shortName: 'Morning Snack',
    title: '☕ Morning Snack Time (9:45 AM – 10:00 AM)',
    timeWindow: '9:45 AM – 10:00 AM',
    description: 'Morning tea and snack break in the Dining Hall (DH). Final Friday lessons resume at 10:00 AM.',
    icon: '☕',
    badgeStyle: 'bg-emerald-600 text-white ring-2 ring-emerald-300 shadow-md',
    accentBorder: 'border-emerald-400 bg-emerald-50 text-emerald-950'
  },
  {
    startMin: toMin(10, 0),
    endMin: toMin(13, 5),
    category: 'LESSON',
    shortName: 'Lesson Time',
    title: '📚 Lesson Time: Final Friday Block (10:00 AM – 1:05 PM)',
    timeWindow: '10:00 AM – 1:05 PM',
    description: 'Final academic lesson block for the week. Note: There are no lessons after lunch on Fridays!',
    icon: '📚',
    badgeStyle: 'bg-blue-600 text-white shadow-sm',
    accentBorder: 'border-blue-300 bg-blue-50 text-blue-950'
  },
  {
    startMin: toMin(13, 5),
    endMin: toMin(14, 0),
    category: 'MEAL',
    shortName: 'Lunch Time',
    title: '🍽️ Friday Lunch Time (1:05 PM – 2:00 PM)',
    timeWindow: '1:05 PM – 2:00 PM',
    description: 'Friday lunch served in the Dining Hall (DH). Academic week instruction ends at lunch.',
    icon: '🍽️',
    badgeStyle: 'bg-amber-600 text-white ring-2 ring-amber-300 shadow-md',
    accentBorder: 'border-amber-400 bg-amber-50 text-amber-950'
  },
  {
    startMin: toMin(14, 0),
    endMin: toMin(17, 50),
    category: 'EXTRACURRICULAR',
    shortName: 'Afternoon Activities',
    title: '⚽ Friday Afternoon Activities (2:00 PM – 5:50 PM)',
    timeWindow: '2:00 PM – 5:50 PM',
    description: 'No lessons after lunch on Friday! Afternoon dedicated to sports matches, clubs, societies, music, and personal projects until dinner.',
    icon: '⚽',
    badgeStyle: 'bg-teal-600 text-white ring-2 ring-teal-300 shadow-md',
    accentBorder: 'border-teal-400 bg-teal-50 text-teal-950'
  },
  {
    startMin: toMin(17, 50),
    endMin: toMin(18, 0),
    category: 'ROUTINE',
    shortName: 'Dinner Transition',
    title: '🚶 5:50 PM Meal Alert — Assembling for Dinner (5:50 PM – 6:00 PM)',
    timeWindow: '5:50 PM – 6:00 PM',
    description: '5:50 PM Daily meal alarm rings! Students proceed to Dining Hall for 6:00 PM dinner.',
    icon: '🚶',
    badgeStyle: 'bg-purple-600 text-white',
    accentBorder: 'border-purple-300 bg-purple-50 text-purple-950'
  },
  {
    startMin: toMin(18, 0),
    endMin: toMin(19, 0),
    category: 'MEAL',
    shortName: 'Dinner Time',
    title: '🍲 Dinner Time (6:00 PM – 7:00 PM)',
    timeWindow: '6:00 PM – 7:00 PM',
    description: 'Friday dinner served in the Dining Hall (DH). Evening prep starts at 7:00 PM.',
    icon: '🍲',
    badgeStyle: 'bg-amber-600 text-white ring-2 ring-amber-300 shadow-md',
    accentBorder: 'border-amber-400 bg-amber-50 text-amber-950'
  },
  {
    startMin: toMin(19, 0),
    endMin: toMin(21, 0),
    category: 'PREP',
    shortName: 'Prep Time',
    title: '📝 Friday Prep Time (7:00 PM – 9:00 PM)',
    timeWindow: '7:00 PM – 9:00 PM',
    description: 'Evening academic review, reading, and prep. Evening snack follows at 9:00 PM.',
    icon: '📝',
    badgeStyle: 'bg-violet-700 text-white shadow-sm',
    accentBorder: 'border-violet-300 bg-violet-50 text-violet-950'
  },
  {
    startMin: toMin(21, 0),
    endMin: toMin(21, 15),
    category: 'SNACK',
    shortName: 'Evening Snack',
    title: '🥪 Evening Snack Time (9:00 PM – 9:15 PM)',
    timeWindow: '9:00 PM – 9:15 PM',
    description: 'Evening snack and tea served in the Dining Hall (DH).',
    icon: '🥪',
    badgeStyle: 'bg-emerald-600 text-white ring-2 ring-emerald-300 shadow-md',
    accentBorder: 'border-emerald-400 bg-emerald-50 text-emerald-950'
  },
  {
    startMin: toMin(21, 15),
    endMin: toMin(22, 30),
    category: 'OPTIONAL_PREP',
    shortName: 'Optional Prep / Wind Down',
    title: '📖 Optional Prep & Weekend Wind Down (9:15 PM – 10:30 PM)',
    timeWindow: '9:15 PM – 10:30 PM',
    description: 'Optional personal reading and relaxed study before weekend lights out.',
    icon: '📖',
    badgeStyle: 'bg-indigo-600 text-white shadow-sm',
    accentBorder: 'border-indigo-300 bg-indigo-50 text-indigo-950'
  },
  {
    startMin: toMin(22, 30),
    endMin: toMin(24, 0),
    category: 'SLEEP',
    shortName: 'Sleep Time',
    title: '🌙 Sleep and Morning Preparation Time (10:30 PM – 7:00 AM)',
    timeWindow: '10:30 PM – 7:00 AM',
    description: 'Prep has concluded. Dormitory quiet hours, rest, and morning prep.',
    icon: '🌙',
    badgeStyle: 'bg-slate-700 text-slate-100',
    accentBorder: 'border-slate-300 bg-slate-100 text-slate-900'
  }
];

// Saturday Schedule (No lessons on weekends)
export const SATURDAY_BLOCKS: TimeBlock[] = [
  {
    startMin: toMin(0, 0),
    endMin: toMin(7, 0),
    category: 'SLEEP',
    shortName: 'Sleep & Rest',
    title: '🌙 Weekend Sleep and Morning Preparation Time (Until 7:00 AM)',
    timeWindow: '9:15 PM – 7:00 AM',
    description: 'Weekend dormitory quiet hours and resting. No lessons on weekends.',
    icon: '🌙',
    badgeStyle: 'bg-slate-700 text-slate-100',
    accentBorder: 'border-slate-300 bg-slate-100 text-slate-900'
  },
  {
    startMin: toMin(7, 0),
    endMin: toMin(8, 30),
    category: 'MEAL',
    shortName: 'Breakfast Time',
    title: '🥣 Weekend Breakfast Time (7:00 AM – 8:30 AM)',
    timeWindow: '7:00 AM – 8:30 AM',
    description: 'Saturday breakfast served in the Dining Hall (DH). Students own time follows.',
    icon: '🥣',
    badgeStyle: 'bg-amber-600 text-white ring-2 ring-amber-300 shadow-md',
    accentBorder: 'border-amber-400 bg-amber-50 text-amber-950'
  },
  {
    startMin: toMin(8, 30),
    endMin: toMin(12, 55),
    category: 'OWN_TIME',
    shortName: "Students' Own Time",
    title: "🌿 Students' Own Time (8:30 AM – 12:55 PM)",
    timeWindow: '8:30 AM – 12:55 PM',
    description: 'On weekends students have their own personal time when not on campus or when there is no test. No academic lessons.',
    icon: '🌿',
    badgeStyle: 'bg-emerald-600 text-white shadow-sm',
    accentBorder: 'border-emerald-300 bg-emerald-50 text-emerald-950'
  },
  {
    startMin: toMin(12, 55),
    endMin: toMin(14, 0),
    category: 'MEAL',
    shortName: 'Lunch Time',
    title: '🍽️ Weekend Lunch Time (12:55 PM – 2:00 PM)',
    timeWindow: '12:55 PM – 2:00 PM',
    description: 'Weekend meal alarm rings at 12:55 PM! Weekend lunch served at the Dining Hall (DH).',
    icon: '🍽️',
    badgeStyle: 'bg-amber-600 text-white ring-2 ring-amber-300 shadow-md',
    accentBorder: 'border-amber-400 bg-amber-50 text-amber-950'
  },
  {
    startMin: toMin(14, 0),
    endMin: toMin(17, 50),
    category: 'OWN_TIME',
    shortName: "Students' Own Time",
    title: "🌿 Students' Own Time (2:00 PM – 5:50 PM)",
    timeWindow: '2:00 PM – 5:50 PM',
    description: "Students' own time: sports, recreation, reading, community life, or revision. 5:50 PM meal alarm rings for dinner.",
    icon: '🌿',
    badgeStyle: 'bg-emerald-600 text-white',
    accentBorder: 'border-emerald-300 bg-emerald-50 text-emerald-950'
  },
  {
    startMin: toMin(17, 50),
    endMin: toMin(18, 0),
    category: 'ROUTINE',
    shortName: 'Dinner Transition',
    title: '🚶 5:50 PM Meal Alert — Assembling for Dinner (5:50 PM – 6:00 PM)',
    timeWindow: '5:50 PM – 6:00 PM',
    description: '5:50 PM Daily meal alarm rings! Dinner served at 6:00 PM in the Dining Hall.',
    icon: '🚶',
    badgeStyle: 'bg-purple-600 text-white',
    accentBorder: 'border-purple-300 bg-purple-50 text-purple-950'
  },
  {
    startMin: toMin(18, 0),
    endMin: toMin(19, 0),
    category: 'MEAL',
    shortName: 'Dinner Time',
    title: '🍲 Dinner Time (6:00 PM – 7:00 PM)',
    timeWindow: '6:00 PM – 7:00 PM',
    description: 'Saturday dinner served in the Dining Hall (DH). Weekend prep starts at 7:00 PM.',
    icon: '🍲',
    badgeStyle: 'bg-amber-600 text-white ring-2 ring-amber-300 shadow-md',
    accentBorder: 'border-amber-400 bg-amber-50 text-amber-950'
  },
  {
    startMin: toMin(19, 0),
    endMin: toMin(21, 0),
    category: 'PREP',
    shortName: 'Prep Time',
    title: '📝 Weekend Prep Time (7:00 PM – 9:00 PM)',
    timeWindow: '7:00 PM – 9:00 PM',
    description: 'Weekend evening study and revision. Weekend prep ends promptly at 9:00 PM!',
    icon: '📝',
    badgeStyle: 'bg-violet-700 text-white shadow-sm',
    accentBorder: 'border-violet-300 bg-violet-50 text-violet-950'
  },
  {
    startMin: toMin(21, 0),
    endMin: toMin(21, 15),
    category: 'SNACK',
    shortName: 'Snack & Prep Ended',
    title: '🥪 Evening Snack — Prep Concluded (9:00 PM – 9:15 PM)',
    timeWindow: '9:00 PM – 9:15 PM',
    description: 'Evening snack in Dining Hall. On weekends prep ends at 9:00 PM. Students rest and prepare for sleep.',
    icon: '🥪',
    badgeStyle: 'bg-emerald-600 text-white ring-2 ring-emerald-300 shadow-md',
    accentBorder: 'border-emerald-400 bg-emerald-50 text-emerald-950'
  },
  {
    startMin: toMin(21, 15),
    endMin: toMin(24, 0),
    category: 'SLEEP',
    shortName: 'Sleep Time',
    title: '🌙 Weekend Sleep and Morning Preparation Time (9:15 PM – 7:00 AM)',
    timeWindow: '9:15 PM – 7:00 AM',
    description: 'Weekend prep concluded. Dormitory quiet hours, rest, and sleep.',
    icon: '🌙',
    badgeStyle: 'bg-slate-700 text-slate-100',
    accentBorder: 'border-slate-300 bg-slate-100 text-slate-900'
  }
];

// Sunday Schedule (Quaker meeting only on Sunday at 8:30-9:30 AM, Phone time 4:00-5:45 PM, No lessons)
export const SUNDAY_BLOCKS: TimeBlock[] = [
  {
    startMin: toMin(0, 0),
    endMin: toMin(7, 0),
    category: 'SLEEP',
    shortName: 'Sleep & Rest',
    title: '🌙 Weekend Sleep and Morning Preparation Time (Until 7:00 AM)',
    timeWindow: '9:15 PM – 7:00 AM',
    description: 'Sunday morning quiet hours. No academic lessons.',
    icon: '🌙',
    badgeStyle: 'bg-slate-700 text-slate-100',
    accentBorder: 'border-slate-300 bg-slate-100 text-slate-900'
  },
  {
    startMin: toMin(7, 0),
    endMin: toMin(8, 0),
    category: 'MEAL',
    shortName: 'Breakfast Time',
    title: '🥣 Sunday Breakfast Time (7:00 AM – 8:00 AM)',
    timeWindow: '7:00 AM – 8:00 AM',
    description: 'Sunday morning breakfast served in the Dining Hall (DH). Sunday Quaker meeting follows at 8:00 AM.',
    icon: '🥣',
    badgeStyle: 'bg-amber-600 text-white ring-2 ring-amber-300 shadow-md',
    accentBorder: 'border-amber-400 bg-amber-50 text-amber-950'
  },
  {
    startMin: toMin(8, 0),
    endMin: toMin(8, 45),
    category: 'QUAKER',
    shortName: 'Sunday Quaker Meeting',
    title: '🕊️ Sunday Quaker Meeting for Worship (8:00 AM – 8:45 AM)',
    timeWindow: '8:00 AM – 8:45 AM',
    description: 'Sunday Quaker meeting for silent worship, reflection, and community grounding in the Dining Hall or grounds. (Quaker is held on Sundays only).',
    icon: '🕊️',
    badgeStyle: 'bg-purple-700 text-white ring-2 ring-purple-300 shadow-md',
    accentBorder: 'border-purple-400 bg-purple-50 text-purple-950'
  },
  {
    startMin: toMin(8, 45),
    endMin: toMin(12, 55),
    category: 'OWN_TIME',
    shortName: "Students' Own Time",
    title: "🌿 Students' Own Time (8:45 AM – 12:55 PM)",
    timeWindow: '8:45 AM – 12:55 PM',
    description: 'Students personal time following Quaker worship: relaxation, reading, and study when no test is scheduled.',
    icon: '🌿',
    badgeStyle: 'bg-emerald-600 text-white shadow-sm',
    accentBorder: 'border-emerald-300 bg-emerald-50 text-emerald-950'
  },
  {
    startMin: toMin(12, 55),
    endMin: toMin(14, 0),
    category: 'MEAL',
    shortName: 'Lunch Time',
    title: '🍽️ Sunday Lunch Time (12:55 PM – 2:00 PM)',
    timeWindow: '12:55 PM – 2:00 PM',
    description: 'Weekend meal alarm rings at 12:55 PM! Sunday lunch served in the Dining Hall (DH).',
    icon: '🍽️',
    badgeStyle: 'bg-amber-600 text-white ring-2 ring-amber-300 shadow-md',
    accentBorder: 'border-amber-400 bg-amber-50 text-amber-950'
  },
  {
    startMin: toMin(14, 0),
    endMin: toMin(16, 0),
    category: 'OWN_TIME',
    shortName: "Students' Own Time",
    title: "🌿 Students' Own Time (2:00 PM – 4:00 PM)",
    timeWindow: '2:00 PM – 4:00 PM',
    description: "Students' personal time: laundry, recreation, reading, or rest. Sunday phone time begins at 4:00 PM.",
    icon: '🌿',
    badgeStyle: 'bg-emerald-600 text-white',
    accentBorder: 'border-emerald-300 bg-emerald-50 text-emerald-950'
  },
  {
    startMin: toMin(16, 0),
    endMin: toMin(17, 45),
    category: 'PHONE_TIME',
    shortName: 'Sunday Phone Time',
    title: '📱 Sunday Phone Time (4:00 PM – 5:45 PM)',
    timeWindow: '4:00 PM – 5:45 PM',
    description: 'Official USAP Sunday student phone access window. Students connect with parents, family, and loved ones.',
    icon: '📱',
    badgeStyle: 'bg-indigo-600 text-white ring-2 ring-indigo-300 shadow-md',
    accentBorder: 'border-indigo-400 bg-indigo-50 text-indigo-950'
  },
  {
    startMin: toMin(17, 45),
    endMin: toMin(18, 0),
    category: 'ROUTINE',
    shortName: 'Phone Hand-in & Dinner Assembly',
    title: '🚶 Phone Hand-in & Assembling for Dinner (5:45 PM – 6:00 PM)',
    timeWindow: '5:45 PM – 6:00 PM',
    description: 'Sunday phone time concluded. Devices safely returned to safekeeping. Proceed to Dining Hall for 6:00 PM dinner.',
    icon: '🚶',
    badgeStyle: 'bg-purple-600 text-white',
    accentBorder: 'border-purple-300 bg-purple-50 text-purple-950'
  },
  {
    startMin: toMin(18, 0),
    endMin: toMin(19, 0),
    category: 'MEAL',
    shortName: 'Dinner Time',
    title: '🍲 Dinner Time (6:00 PM – 7:00 PM)',
    timeWindow: '6:00 PM – 7:00 PM',
    description: 'Sunday dinner served in the Dining Hall (DH). Sunday evening prep begins at 7:00 PM.',
    icon: '🍲',
    badgeStyle: 'bg-amber-600 text-white ring-2 ring-amber-300 shadow-md',
    accentBorder: 'border-amber-400 bg-amber-50 text-amber-950'
  },
  {
    startMin: toMin(19, 0),
    endMin: toMin(21, 0),
    category: 'PREP',
    shortName: 'Prep Time',
    title: '📝 Sunday Prep Time (7:00 PM – 9:00 PM)',
    timeWindow: '7:00 PM – 9:00 PM',
    description: 'Sunday evening prep: preparing for the upcoming academic week, homework, and study.',
    icon: '📝',
    badgeStyle: 'bg-violet-700 text-white shadow-sm',
    accentBorder: 'border-violet-300 bg-violet-50 text-violet-950'
  },
  {
    startMin: toMin(21, 0),
    endMin: toMin(21, 15),
    category: 'SNACK',
    shortName: 'Evening Snack',
    title: '🥪 Evening Snack Time (9:00 PM – 9:15 PM)',
    timeWindow: '9:00 PM – 9:15 PM',
    description: 'Evening snack and tea in the Dining Hall (DH). Optional prep begins at 9:15 PM.',
    icon: '🥪',
    badgeStyle: 'bg-emerald-600 text-white ring-2 ring-emerald-300 shadow-md',
    accentBorder: 'border-emerald-400 bg-emerald-50 text-emerald-950'
  },
  {
    startMin: toMin(21, 15),
    endMin: toMin(22, 30),
    category: 'OPTIONAL_PREP',
    shortName: 'Optional Prep',
    title: '📖 Optional Prep Time (9:15 PM – 10:30 PM)',
    timeWindow: '9:15 PM – 10:30 PM',
    description: 'Optional evening prep for students finalizing weekly schedules. Concludes at 10:30 PM.',
    icon: '📖',
    badgeStyle: 'bg-indigo-600 text-white shadow-sm',
    accentBorder: 'border-indigo-300 bg-indigo-50 text-indigo-950'
  },
  {
    startMin: toMin(22, 30),
    endMin: toMin(24, 0),
    category: 'SLEEP',
    shortName: 'Sleep Time',
    title: '🌙 Sleep and Morning Preparation Time (10:30 PM – 7:00 AM)',
    timeWindow: '10:30 PM – 7:00 AM',
    description: 'Sunday prep has concluded. Dormitory quiet hours, rest, and morning prep.',
    icon: '🌙',
    badgeStyle: 'bg-slate-700 text-slate-100',
    accentBorder: 'border-slate-300 bg-slate-100 text-slate-900'
  }
];

export function getScheduleBlocksForDay(dayIndex: number): TimeBlock[] {
  switch (dayIndex) {
    case 0: // Sunday
      return SUNDAY_BLOCKS;
    case 3: // Wednesday
      return WEDNESDAY_BLOCKS;
    case 5: // Friday
      return FRIDAY_BLOCKS;
    case 6: // Saturday
      return SATURDAY_BLOCKS;
    default: // Mon, Tue, Thu
      return STANDARD_WEEKDAY_BLOCKS;
  }
}

export function getCurrentCampusSchedule(now: Date = new Date(), tests: SchoolTest[] = []): CurrentScheduleInfo {
  const hours = now.getHours();
  const minutes = now.getMinutes();
  const currentMin = hours * 60 + minutes;
  const day = now.getDay(); // 0 = Sun, 1 = Mon, ..., 6 = Sat
  const nowMs = now.getTime();

  // 1. Check for Active or 60-Second Imminent Exam
  for (const t of tests) {
    if (!t.startsAt) continue;
    const startMs = new Date(t.startsAt).getTime();
    const endMs = new Date(t.endsAt || startMs + 3600000).getTime();
    const diff = startMs - nowMs;

    // Exam starting in <= 60 seconds (Beep Alarm Active)
    if (diff > 0 && diff <= 60000) {
      const secs = Math.max(1, Math.floor(diff / 1000));
      return {
        category: 'EXAM',
        title: `⚠️ EXAM IN ${secs} SECONDS: ${t.schoolClass} ${t.subject}`,
        shortName: `Exam in ${secs}s`,
        timeWindow: `${t.start} – ${t.end}`,
        description: `Beep alarm active! ${t.schoolClass} is about to write “${t.title}” (${t.subject}) in ${t.room}. Strict campus silence is required.`,
        statusBadge: `BEEP ALARM • STARTING IN ${secs}s`,
        badgeStyle: 'bg-rose-600 text-white animate-pulse shadow-md shadow-rose-600/30',
        accentBorder: 'border-rose-500 bg-rose-50/90 text-rose-950',
        icon: '⚠️',
        activeExam: t,
        isExamBeepActive: true,
        examSecondsRemaining: secs
      };
    }

    // Exam in progress right now
    if (nowMs >= startMs && nowMs < endMs) {
      return {
        category: 'EXAM',
        title: `🔔 EXAM IN PROGRESS: ${t.schoolClass} “${t.title}”`,
        shortName: 'Exam In Progress',
        timeWindow: `${t.start} – ${t.end}`,
        description: `Official test currently in session in ${t.room}. Please maintain absolute silence across campus and avoid hallway noise.`,
        statusBadge: 'EXAM ACTIVE • SILENCE REQUIRED',
        badgeStyle: 'bg-amber-600 text-white font-black animate-pulse shadow-md',
        accentBorder: 'border-amber-500 bg-amber-50/90 text-amber-950',
        icon: '🔔',
        activeExam: t
      };
    }
  }

  // 2. Select appropriate day blocks
  const dayBlocks = getScheduleBlocksForDay(day);

  const currentBlock = dayBlocks.find((b) => currentMin >= b.startMin && currentMin < b.endMin) || dayBlocks[0];
  const currentIndex = dayBlocks.indexOf(currentBlock);
  const nextBlock = dayBlocks[currentIndex + 1] || dayBlocks[0];

  const minutesAway = currentBlock.endMin > currentMin
    ? currentBlock.endMin - currentMin
    : (1440 - currentMin + nextBlock.startMin);

  return {
    category: currentBlock.category,
    title: currentBlock.title,
    shortName: currentBlock.shortName,
    timeWindow: currentBlock.timeWindow,
    description: currentBlock.description,
    statusBadge: currentBlock.shortName.toUpperCase(),
    badgeStyle: currentBlock.badgeStyle,
    accentBorder: currentBlock.accentBorder,
    icon: currentBlock.icon,
    nextEvent: {
      name: nextBlock.shortName,
      timeStr: minToTimeString(nextBlock.startMin),
      minutesAway
    }
  };
}
