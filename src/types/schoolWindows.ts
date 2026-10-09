// Type definitions for USAP School Windows:
// 1. Upcoming Birthdays
// 2. Weekly Timetable (Mon-Fri Spreadsheet)
// 3. Final AS & A2 / End of Term Exam Timetable
// 4. Weekly Plates Duty (Advisory Groups)
// 5. Wednesday Convocation Speaker

export interface BirthdayItem {
  id: string;
  name: string;
  date: string; // YYYY-MM-DD
  role?: string;
  schoolClass?: string;
  createdAt: string;
  createdBy?: string;
}

export const TIMETABLE_SUBJECTS = [
  "Biology",
  "Mathematics",
  "Physics",
  "Research Methods",
  "Computers",
  "Humanities",
  "Chemistry",
  "College Counseling",
  "Capstone",
  "Snack",
  "Lunch",
  "Study / Free Period",
  "Assembly / Advisory"
] as const;

export type TimetableSubject = typeof TIMETABLE_SUBJECTS[number];

export { getWeekOfLabel } from '../utils/schoolDateUtils';

export interface WeeklyTimetableSlot {
  id: string;
  time: string; // e.g. "07:40 – 08:40"
  label: string; // e.g. "Period 1"
  monday: string;
  tuesday: string;
  wednesday: string;
  thursday: string;
  friday: string;
}

export interface WeeklyTimetableDoc {
  id: string;
  title: string;
  targetClass: string; // e.g. "ALL CLASSES", "LOWER 6", "UPPER 6"
  slots: WeeklyTimetableSlot[];
  updatedAt: string;
  updatedBy: string;
}

export interface ExamTimetableEntry {
  id: string;
  date: string; // YYYY-MM-DD
  time: string; // e.g. "08:30 – 11:30"
  subject: string;
  level: 'AS' | 'A2';
  venue: 'Watershed' | 'Local';
  paperCode?: string;
  createdAt: string;
  createdBy?: string;
}

export interface DailyDutyItem {
  dayName: 'Sunday' | 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday';
  date: string; // YYYY-MM-DD
  advisoryGroup: string; // e.g. "Advisory Group 1 (Mr Mangara)"
  notes?: string;
}

export interface WeeklyDutyDoc {
  id: string;
  weekLabel: string;
  weekStartDate: string; // YYYY-MM-DD
  days: DailyDutyItem[];
  updatedAt: string;
  updatedBy: string;
}

export interface ConvocationSpeakerItem {
  id: string;
  date: string; // YYYY-MM-DD (MUST BE A WEDNESDAY)
  speakerName: string;
  topic?: string;
  affiliation?: string;
  createdAt: string;
  createdBy?: string;
}

// Default initial time slots for the weekly Monday - Friday timetable
export const DEFAULT_WEEKLY_SLOTS: WeeklyTimetableSlot[] = [
  { id: 'p1', time: '07:40 – 08:40', label: 'Period 1', monday: 'Mathematics', tuesday: 'Physics', wednesday: 'Chemistry', thursday: 'Biology', friday: 'Computers' },
  { id: 'p2', time: '08:45 – 09:45', label: 'Period 2', monday: 'Physics', tuesday: 'Mathematics', wednesday: 'Biology', thursday: 'Chemistry', friday: 'Humanities' },
  { id: 'p3', time: '10:00 – 11:00', label: 'Period 3', monday: 'Chemistry', tuesday: 'Biology', wednesday: 'Research Methods', thursday: 'Mathematics', friday: 'College Counseling' },
  { id: 'p4', time: '11:05 – 12:05', label: 'Period 4', monday: 'Biology', tuesday: 'Chemistry', wednesday: 'College Counseling', thursday: 'Physics', friday: 'Capstone' },
  { id: 'p5', time: '12:10 – 13:10', label: 'Period 5', monday: 'Humanities', tuesday: 'Computers', wednesday: 'Capstone', thursday: 'Research Methods', friday: 'Mathematics' },
  { id: 'p6', time: '14:15 – 15:15', label: 'Period 6', monday: 'Computers', tuesday: 'Humanities', wednesday: 'Study / Free Period', thursday: 'College Counseling', friday: 'Physics' },
  { id: 'p7', time: '15:20 – 16:20', label: 'Period 7', monday: 'Research Methods', tuesday: 'College Counseling', wednesday: 'Assembly / Advisory', thursday: 'Capstone', friday: 'Study / Free Period' }
];
