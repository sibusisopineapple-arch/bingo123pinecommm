// Utility functions and time validation for USAP School Office Hours

export const OFFICE_HOURS_CLASSES = [
  "Lower 6 X and Y",
  "Upper 6 X and Y",
  "Lower 6 X",
  "Lower 6 Y",
  "Upper 6 X",
  "Upper 6 Y"
] as const;

export type OfficeHoursClass = typeof OFFICE_HOURS_CLASSES[number];

export const OFFICE_HOURS_SLOT_MINUTES = [30, 25, 20, 15, 10, 5] as const;
export type OfficeHoursSlotDuration = typeof OFFICE_HOURS_SLOT_MINUTES[number];

export interface RegisteredStudent {
  studentUid: string;
  studentName: string;
  studentEmail?: string | null;
  studentClass?: string | null;
  bookedAt?: string | null;
}

export interface OfficeHourSlot {
  slotNumber: number; // 1, 2, 3, 4...
  startTime: string; // "04:30 PM"
  endTime: string; // "04:45 PM"
  startMinutes: number;
  endMinutes: number;
  maxCapacity?: number; // 5 for Chemistry, 1 for other subjects
  students?: RegisteredStudent[]; // array of registered students (up to maxCapacity)
  studentUid?: string | null;
  studentName?: string | null;
  studentEmail?: string | null;
  studentClass?: string | null;
  bookedAt?: string | null;
}

/**
 * Returns the maximum number of students allowed to register per slot.
 * Chemistry office hours allow a maximum of 5 students on the same slot.
 * Other subjects allow 1 student (1-on-1).
 */
export function getMaxSlotCapacity(subject: string): number {
  if (subject && subject.trim().toLowerCase() === 'chemistry') {
    return 5;
  }
  return 1;
}

/**
 * Extracts the list of registered students from a slot (handling both multi-student and legacy formats).
 */
export function getSlotRegisteredStudents(slot: OfficeHourSlot): RegisteredStudent[] {
  if (slot.students && Array.isArray(slot.students) && slot.students.length > 0) {
    return slot.students;
  }
  if (slot.studentUid || slot.studentName) {
    return [
      {
        studentUid: slot.studentUid || '',
        studentName: slot.studentName || 'Student',
        studentEmail: slot.studentEmail || null,
        studentClass: slot.studentClass || null,
        bookedAt: slot.bookedAt || null
      }
    ];
  }
  return [];
}

/**
 * Checks if a specific slot's end time has passed compared to current local time.
 * If slot date is in the past, or today and endMinutes <= current minutes from midnight, returns true.
 */
export function isSlotTimePassed(dateStr: string, endMinutes: number): boolean {
  if (!dateStr) return false;
  const now = new Date();

  // Local date formatted as YYYY-MM-DD
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  const todayStr = `${y}-${m}-${d}`;

  if (dateStr < todayStr) {
    return true; // Past date
  }
  if (dateStr > todayStr) {
    return false; // Future date
  }

  // Same day: compare current minutes
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  return endMinutes <= currentMinutes;
}

/**
 * Checks if an entire office hour session has passed.
 */
export function isOfficeHourSessionPassed(session: OfficeHourSession): boolean {
  if (!session.date || !session.endTime) return false;
  const endMin = timeStringToMinutes(session.endTime);
  return isSlotTimePassed(session.date, endMin);
}

export interface OfficeHourSession {
  id: string;
  teacherName: string;
  teacherUid: string;
  teacherEmail: string;
  subject: string;
  targetClass: OfficeHoursClass | string;
  date: string; // YYYY-MM-DD
  startTime: string; // "16:30" (24h)
  endTime: string; // "17:30" (24h)
  slotDurationMinutes: OfficeHoursSlotDuration | number;
  totalSlots: number;
  location?: string;
  notes?: string;
  slots: OfficeHourSlot[];
  createdAt: string;
}

/**
 * Parses "HH:MM" (24-hour) string into minutes from midnight (0 - 1439)
 */
export function timeStringToMinutes(timeStr: string): number {
  if (!timeStr) return 0;
  const [hoursStr, minutesStr] = timeStr.split(':');
  const h = parseInt(hoursStr, 10) || 0;
  const m = parseInt(minutesStr, 10) || 0;
  return h * 60 + m;
}

/**
 * Formats minutes from midnight to readable 12-hour string (e.g. "04:30 PM")
 */
export function minutesToTimeString(minutes: number): string {
  const normalized = ((minutes % 1440) + 1440) % 1440;
  const h24 = Math.floor(normalized / 60);
  const m = normalized % 60;
  const period = h24 >= 12 ? 'PM' : 'AM';
  const h12 = h24 % 12 === 0 ? 12 : h24 % 12;
  const hStr = h12 < 10 ? `0${h12}` : `${h12}`;
  const mStr = m < 10 ? `0${m}` : `${m}`;
  return `${hStr}:${mStr} ${period}`;
}

/**
 * Meal & Sleep periods that Office Hours are strictly prohibited from overlapping.
 * Office hours ARE allowed to overlap school hours, extracurriculars, and prep time!
 */
interface ProhibitedPeriod {
  name: string;
  startMinutes: number;
  endMinutes: number;
  description: string;
  days?: number[]; // undefined = all days, [1,2,3,4,5] = weekdays, [0,6] = weekends
}

const PROHIBITED_PERIODS: ProhibitedPeriod[] = [
  {
    name: "Sleep and Morning Preparation Time",
    startMinutes: 22 * 60 + 30, // 22:30 (10:30 PM)
    endMinutes: 24 * 60, // 24:00
    description: "10:30 PM – 07:00 AM (Compulsory Dormitory Quiet Hours & Sleep)"
  },
  {
    name: "Sleep and Morning Preparation Time",
    startMinutes: 0, // 00:00
    endMinutes: 7 * 60, // 07:00 AM
    description: "10:30 PM – 07:00 AM (Compulsory Dormitory Quiet Hours & Sleep)"
  },
  {
    name: "Breakfast Meal Time",
    startMinutes: 7 * 60, // 07:00 AM
    endMinutes: 7 * 60 + 35, // 07:35 AM
    description: "07:00 AM – 07:35 AM (Dining Hall Breakfast)"
  },
  {
    name: "Morning Snack Time",
    startMinutes: 9 * 60 + 45, // 09:45 AM
    endMinutes: 10 * 60, // 10:00 AM
    description: "09:45 AM – 10:00 AM (Morning Snack in Dining Hall)"
  },
  {
    name: "Weekday Lunch Meal Time",
    startMinutes: 13 * 60 + 5, // 01:05 PM (13:05)
    endMinutes: 14 * 60, // 02:00 PM (14:00)
    description: "01:05 PM – 02:00 PM (Weekday Lunch in Dining Hall)",
    days: [1, 2, 3, 4, 5] // Mon-Fri
  },
  {
    name: "Weekend Lunch Meal Time",
    startMinutes: 12 * 60 + 55, // 12:55 PM (12:55)
    endMinutes: 14 * 60, // 02:00 PM (14:00)
    description: "12:55 PM – 02:00 PM (Weekend Lunch in Dining Hall)",
    days: [0, 6] // Sun, Sat
  },
  {
    name: "Dinner Meal Time & Alert",
    startMinutes: 17 * 60 + 50, // 05:50 PM (17:50 alarm, dinner 18:00 - 19:00)
    endMinutes: 19 * 60, // 07:00 PM (19:00)
    description: "05:50 PM – 07:00 PM (Dinner Meal Time in Dining Hall)"
  },
  {
    name: "Evening Snack Time",
    startMinutes: 21 * 60, // 09:00 PM (21:00)
    endMinutes: 21 * 60 + 15, // 09:15 PM (21:15)
    description: "09:00 PM – 09:15 PM (Evening Snack in Dining Hall)"
  }
];

export interface TimeValidationResult {
  valid: boolean;
  conflictName?: string;
  conflictDescription?: string;
  allowedOverlapsNote: string;
}

/**
 * Validates that Office Hours do NOT overlap meal times or sleep time.
 * Explicitly allows overlapping school hours, extracurricular time, and prep time!
 */
export function validateOfficeHoursTime(
  startTime24: string,
  endTime24: string,
  dateStr?: string
): TimeValidationResult {
  const allowedNote =
    "Office hours are allowed to overlap regular school hours, extracurriculars, and prep time, but cannot overlap meal times or sleep time (10:30 PM - 7:00 AM).";

  if (!startTime24 || !endTime24) {
    return { valid: false, conflictName: "Missing Time", conflictDescription: "Please specify both start and end time.", allowedOverlapsNote: allowedNote };
  }

  const startMin = timeStringToMinutes(startTime24);
  const endMin = timeStringToMinutes(endTime24);

  if (endMin <= startMin) {
    return {
      valid: false,
      conflictName: "Invalid Time Range",
      conflictDescription: "End time must be strictly after start time.",
      allowedOverlapsNote: allowedNote
    };
  }

  let dayOfWeek = -1;
  if (dateStr) {
    const d = new Date(dateStr + "T12:00:00");
    if (!isNaN(d.getTime())) {
      dayOfWeek = d.getDay(); // 0 is Sunday, 6 is Saturday
    }
  }

  for (const period of PROHIBITED_PERIODS) {
    if (period.days && dayOfWeek !== -1 && !period.days.includes(dayOfWeek)) {
      continue;
    }

    // Overlap condition: max(startMin, period.startMinutes) < min(endMin, period.endMinutes)
    const overlapStart = Math.max(startMin, period.startMinutes);
    const overlapEnd = Math.min(endMin, period.endMinutes);

    if (overlapStart < overlapEnd) {
      return {
        valid: false,
        conflictName: period.name,
        conflictDescription: `Office hours cannot overlap ${period.name} (${period.description}). Office hours can overlap regular class periods, extracurriculars, or prep time, but meal times and sleep time are strictly protected.`,
        allowedOverlapsNote: allowedNote
      };
    }
  }

  return {
    valid: true,
    allowedOverlapsNote: allowedNote
  };
}

/**
 * Generates numbered slots for registering based on start time, end time, and minutes per student.
 * e.g. 4:30 PM to 5:30 PM with 15 mins -> 4 spaces numbered 1 to 4!
 */
export function generateOfficeHourSlots(
  startTime24: string,
  endTime24: string,
  slotMinutes: number,
  subject?: string
): OfficeHourSlot[] {
  const startMin = timeStringToMinutes(startTime24);
  const endMin = timeStringToMinutes(endTime24);

  if (endMin <= startMin || slotMinutes <= 0) return [];

  const totalDuration = endMin - startMin;
  const numSlots = Math.floor(totalDuration / slotMinutes);
  const maxCap = subject ? getMaxSlotCapacity(subject) : 1;

  const slots: OfficeHourSlot[] = [];

  for (let i = 0; i < numSlots; i++) {
    const sMin = startMin + i * slotMinutes;
    const eMin = sMin + slotMinutes;
    slots.push({
      slotNumber: i + 1,
      startTime: minutesToTimeString(sMin),
      endTime: minutesToTimeString(eMin),
      startMinutes: sMin,
      endMinutes: eMin,
      maxCapacity: maxCap,
      students: [],
      studentUid: null,
      studentName: null,
      studentEmail: null,
      studentClass: null,
      bookedAt: null
    });
  }

  return slots;
}
