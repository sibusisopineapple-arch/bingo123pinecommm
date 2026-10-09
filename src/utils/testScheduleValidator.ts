// Comprehensive validator and warning alert generator for scheduling academic tests
// Detects when students already have a test or are occupied by school routine, meals, activities, or office hours

import { SchoolTest } from '../types';
import { OfficeHourSession, isOfficeHourSessionPassed } from './officeHoursUtils';

export interface ScheduleConflictWarning {
  type:
    | 'test_conflict'
    | 'routine_occupied'
    | 'room_conflict'
    | 'office_hours_occupied'
    | 'past_time'
    | 'invalid_time'
    | 'subject_restriction';
  severity: 'error' | 'warning';
  title: string;
  message: string;
  conflictingEntity?: {
    title?: string;
    subject?: string;
    room?: string;
    teacher?: string;
    time?: string;
    class?: string;
  };
}

/**
 * Normalizes class strings for comparison
 * e.g. "LOWER 6X", "Lower 6 X", "Lower 6 X and Y", "ALL CLASSES"
 */
export function areClassesOverlapping(classA: string, classB: string): boolean {
  if (!classA || !classB) return true;
  const a = classA.trim().toUpperCase().replace(/\s+/g, ' ');
  const b = classB.trim().toUpperCase().replace(/\s+/g, ' ');

  if (a === 'ALL CLASSES' || b === 'ALL CLASSES') return true;
  if (a === b) return true;

  const aIsLower6 = a.includes('LOWER 6') || a.includes('L6');
  const bIsLower6 = b.includes('LOWER 6') || b.includes('L6');
  const aIsUpper6 = a.includes('UPPER 6') || a.includes('U6');
  const bIsUpper6 = b.includes('UPPER 6') || b.includes('U6');

  // Both X and Y combinations
  if (a.includes('X AND Y') || a.includes('X & Y')) {
    if (aIsLower6 && bIsLower6) return true;
    if (aIsUpper6 && bIsUpper6) return true;
  }
  if (b.includes('X AND Y') || b.includes('X & Y')) {
    if (aIsLower6 && bIsLower6) return true;
    if (aIsUpper6 && bIsUpper6) return true;
  }

  // Exact letter checks
  if (aIsLower6 && bIsLower6) {
    if (a.includes('X') && b.includes('X')) return true;
    if (a.includes('Y') && b.includes('Y')) return true;
  }
  if (aIsUpper6 && bIsUpper6) {
    if (a.includes('X') && b.includes('X')) return true;
    if (a.includes('Y') && b.includes('Y')) return true;
  }

  return false;
}

/**
 * Converts "HH:MM" to total minutes from midnight
 */
function toMinutes(timeStr: string): number {
  if (!timeStr) return 0;
  const parts = timeStr.split(':');
  const h = parseInt(parts[0], 10) || 0;
  const m = parseInt(parts[1], 10) || 0;
  return h * 60 + m;
}

/**
 * Checks if two intervals [startA, endA] and [startB, endB] overlap
 */
function intervalsOverlap(startA: string, endA: string, startB: string, endB: string): boolean {
  const sA = toMinutes(startA);
  const eA = toMinutes(endA);
  const sB = toMinutes(startB);
  const eB = toMinutes(endB);

  return Math.max(sA, sB) < Math.min(eA, eB);
}

/**
 * Formats "HH:MM" 24h into 12h readable string
 */
function formatTime12(timeStr: string): string {
  const mins = toMinutes(timeStr);
  const h24 = Math.floor(mins / 60);
  const m = mins % 60;
  const period = h24 >= 12 ? 'PM' : 'AM';
  const h12 = h24 % 12 === 0 ? 12 : h24 % 12;
  return `${h12 < 10 ? `0${h12}` : h12}:${m < 10 ? `0${m}` : m} ${period}`;
}

/**
 * Main validator: checks whether students are occupied or have another test scheduled
 */
export function checkTestScheduleConflicts(
  date: string,
  startTime: string,
  endTime: string,
  schoolClass: string,
  room: string,
  subject: string,
  existingTests: SchoolTest[],
  officeHours: OfficeHourSession[] = []
): ScheduleConflictWarning[] {
  const warnings: ScheduleConflictWarning[] = [];

  if (!date || !startTime || !endTime) {
    return warnings;
  }

  const sMin = toMinutes(startTime);
  const eMin = toMinutes(endTime);

  // 1. Basic time boundary validation
  if (eMin <= sMin) {
    warnings.push({
      type: 'invalid_time',
      severity: 'error',
      title: 'Invalid Time Interval',
      message: 'End time must be strictly after start time.'
    });
    return warnings;
  }

  // 2. Past time validation
  const now = new Date();
  const testStartDateTime = new Date(`${date}T${startTime}`);
  if (!isNaN(testStartDateTime.getTime()) && testStartDateTime.getTime() <= now.getTime()) {
    warnings.push({
      type: 'past_time',
      severity: 'error',
      title: 'Cannot Schedule in the Past',
      message: 'The test date and start time must be in the future.'
    });
  }

  const testDay = testStartDateTime.getDay(); // 0 = Sun, 6 = Sat, 1 = Mon ... 5 = Fri
  const isWeekend = testDay === 0 || testDay === 6;

  // 3. School Hours & Earliest/Latest Limits
  if (startTime < '07:40') {
    warnings.push({
      type: 'routine_occupied',
      severity: 'error',
      title: 'Students Occupied: Early Morning Preparation',
      message: 'School rule violation: Tests cannot begin before 7:40 AM. Students are occupied with breakfast and morning dorm prep.'
    });
  }

  if (endTime > '16:00') {
    warnings.push({
      type: 'routine_occupied',
      severity: 'error',
      title: 'Students Occupied: After-School Activities / Prep',
      message: 'School rule violation: No tests are permitted after 4:00 PM. Students are occupied with extracurriculars, sports, clubs, and evening prep.'
    });
  }

  // 4. Meal Times & Routine Occupied Periods
  // Breakfast: 07:00 – 07:35
  if (intervalsOverlap(startTime, endTime, '07:00', '07:35')) {
    warnings.push({
      type: 'routine_occupied',
      severity: 'error',
      title: 'Students Occupied: Breakfast Time',
      message: 'Students are occupied: Breakfast (07:00 AM – 07:35 AM) in the Dining Hall. Tests cannot overlap with student meal time.'
    });
  }

  // Morning Snack Break: 09:45 – 10:00
  if (intervalsOverlap(startTime, endTime, '09:45', '10:00')) {
    warnings.push({
      type: 'routine_occupied',
      severity: 'error',
      title: 'Students Occupied: Morning Snack Break',
      message: 'Students are occupied: Morning Snack Break (09:45 AM – 10:00 AM) in the Dining Hall. Tests cannot overlap with student snack time.'
    });
  }

  // Lunch Break: 13:05 – 14:00 (Weekdays) or 12:55 – 14:00 (Weekends)
  const lunchStart = isWeekend ? '12:55' : '13:00';
  if (intervalsOverlap(startTime, endTime, lunchStart, '14:00')) {
    warnings.push({
      type: 'routine_occupied',
      severity: 'error',
      title: 'Students Occupied: Lunch Meal Time',
      message: `Students are occupied: Lunch Meal Time (${isWeekend ? '12:55 PM' : '1:00 PM'} – 2:00 PM) in the Dining Hall. Tests cannot overlap with lunch.`
    });
  }

  // Dinner Time & Alert: 17:50 – 19:00
  if (intervalsOverlap(startTime, endTime, '17:50', '19:00')) {
    warnings.push({
      type: 'routine_occupied',
      severity: 'error',
      title: 'Students Occupied: Dinner Meal Time',
      message: 'Students are occupied: Dinner Meal Time (05:50 PM – 07:00 PM) in the Dining Hall. Students cannot take tests during dinner.'
    });
  }

  // Evening Snack Time: 21:00 – 21:15
  if (intervalsOverlap(startTime, endTime, '21:00', '21:15')) {
    warnings.push({
      type: 'routine_occupied',
      severity: 'error',
      title: 'Students Occupied: Evening Snack Time',
      message: 'Students are occupied: Evening Snack Time (09:00 PM – 09:15 PM) in the Dining Hall.'
    });
  }

  // Evening Compulsory Prep Time: 19:00 – 21:00
  if (intervalsOverlap(startTime, endTime, '19:00', '21:00')) {
    warnings.push({
      type: 'routine_occupied',
      severity: 'error',
      title: 'Students Occupied: Compulsory Evening Prep Time',
      message: 'Students are occupied: Compulsory Evening Prep Time (07:00 PM – 09:00 PM). Students are in designated study halls for quiet focused work.'
    });
  }

  // Sleep and Quiet Hours: 22:30 – 07:00
  if (intervalsOverlap(startTime, endTime, '22:30', '23:59') || intervalsOverlap(startTime, endTime, '00:00', '07:00')) {
    warnings.push({
      type: 'routine_occupied',
      severity: 'error',
      title: 'Students Occupied: Dormitory Sleep & Quiet Hours',
      message: 'Students are occupied: Dormitory Sleep and Morning Preparation Time (10:30 PM – 07:00 AM). Strictly no tests permitted during sleep hours.'
    });
  }

  // Friday Afternoon Activities: 14:00 – 17:50 (Friday is day 5)
  if (testDay === 5 && intervalsOverlap(startTime, endTime, '14:00', '17:50')) {
    warnings.push({
      type: 'routine_occupied',
      severity: 'error',
      title: 'Students Occupied: Friday Afternoon Activities',
      message: 'Students are occupied: Friday Afternoon Activities (02:00 PM – 05:50 PM). School rule: No academic lessons or tests permitted after lunch on Fridays.'
    });
  }

  // Wednesday Convocation: 12:00 – 13:05 (Wednesday is day 3)
  if (testDay === 3 && intervalsOverlap(startTime, endTime, '12:00', '13:05')) {
    warnings.push({
      type: 'routine_occupied',
      severity: 'error',
      title: 'Students Occupied: All-School Convocation',
      message: 'Students are occupied: Wednesday All-School Convocation Time (12:00 PM – 01:05 PM). All students and faculty are in attendance.'
    });
  }

  // Wednesday Advisor Consultation: 14:00 – 15:00
  if (testDay === 3 && intervalsOverlap(startTime, endTime, '14:00', '15:00')) {
    warnings.push({
      type: 'routine_occupied',
      severity: 'error',
      title: 'Students Occupied: Advisor Consultation / Faculty Meeting',
      message: 'Students are occupied: Wednesday Advisor Consultation & Faculty Meeting (02:00 PM – 03:00 PM).'
    });
  }

  // Sunday Quaker Meeting for Worship: 08:00 – 08:45 (Sunday is day 0)
  if (testDay === 0 && intervalsOverlap(startTime, endTime, '08:00', '08:45')) {
    warnings.push({
      type: 'routine_occupied',
      severity: 'error',
      title: 'Students Occupied: Sunday Quaker Meeting for Worship',
      message: 'Students are occupied: Sunday Quaker Meeting for Worship (08:00 AM – 08:45 AM). All students attend Quaker worship.'
    });
  }

  // Sunday Phone Time: 16:00 – 17:45
  if (testDay === 0 && intervalsOverlap(startTime, endTime, '16:00', '17:45')) {
    warnings.push({
      type: 'routine_occupied',
      severity: 'error',
      title: 'Students Occupied: Sunday Phone Window',
      message: 'Students are occupied: Official Sunday Phone Time (04:00 PM – 05:45 PM). Student personal phone and family communication window.'
    });
  }

  // Weekday Extracurriculars: 16:00 – 17:50 (Mon-Thu)
  if (!isWeekend && testDay !== 5 && intervalsOverlap(startTime, endTime, '16:00', '17:50')) {
    warnings.push({
      type: 'routine_occupied',
      severity: 'error',
      title: 'Students Occupied: Extracurricular Activities Time',
      message: 'Students are occupied: Extracurricular Activities Time (04:00 PM – 05:50 PM). Students are engaged in sports, arts, robotics, and clubs.'
    });
  }

  // 5. Weekend Subject Restrictions
  if (testDay === 6) {
    // Saturday: Math, Chemistry, Biology, Physics only
    const allowedSaturday = ['Mathematics', 'Chemistry', 'Biology', 'Physics'];
    if (!allowedSaturday.includes(subject)) {
      warnings.push({
        type: 'subject_restriction',
        severity: 'error',
        title: 'Subject Restriction: Saturday Test Rules',
        message: `School rule violation: On Saturday, only Mathematics, Chemistry, Biology, and Physics tests are permitted. ${subject} is not allowed.`
      });
    }
  } else if (testDay === 0) {
    // Sunday: Math and Chemistry only
    const allowedSunday = ['Mathematics', 'Chemistry'];
    if (!allowedSunday.includes(subject)) {
      warnings.push({
        type: 'subject_restriction',
        severity: 'error',
        title: 'Subject Restriction: Sunday Test Rules',
        message: `School rule violation: On Sunday, only Mathematics and Chemistry tests are permitted. ${subject} is not allowed.`
      });
    }
  }

  // 6. CRITICAL: "HAVE A TEST AT THAT TIME" (STUDENT TEST CONFLICT)
  // Check if students in `schoolClass` ALREADY have a test scheduled at that time on `date`
  for (const t of existingTests) {
    if (t.date !== date) continue;

    // Check if time intervals overlap
    if (intervalsOverlap(startTime, endTime, t.start, t.end)) {
      // Check if student classes overlap
      if (areClassesOverlapping(schoolClass, t.schoolClass)) {
        warnings.push({
          type: 'test_conflict',
          severity: 'error',
          title: `Student Test Conflict: ${schoolClass} Already Has a Test`,
          message: `Students in ${schoolClass} already have a test scheduled at this time: “${t.title}” (${t.subject}) from ${formatTime12(t.start)} to ${formatTime12(t.end)} in ${t.room} (scheduled by ${t.createdBy}). Students cannot take two tests simultaneously.`,
          conflictingEntity: {
            title: t.title,
            subject: t.subject,
            room: t.room,
            teacher: t.createdBy,
            time: `${formatTime12(t.start)} – ${formatTime12(t.end)}`,
            class: t.schoolClass
          }
        });
      }
    }
  }

  // 7. ROOM CONFLICT: Is the requested room already booked?
  for (const t of existingTests) {
    if (t.date !== date) continue;
    if (t.room !== room) continue;

    if (intervalsOverlap(startTime, endTime, t.start, t.end)) {
      warnings.push({
        type: 'room_conflict',
        severity: 'error',
        title: `Room Conflict: ${room} Already Booked`,
        message: `Room conflict: ${room} is already booked on ${date} from ${formatTime12(t.start)} to ${formatTime12(t.end)} for “${t.title}” (${t.subject}, Class: ${t.schoolClass}).`,
        conflictingEntity: {
          title: t.title,
          subject: t.subject,
          room: t.room,
          teacher: t.createdBy,
          time: `${formatTime12(t.start)} – ${formatTime12(t.end)}`,
          class: t.schoolClass
        }
      });
    }
  }

  // 8. STUDENTS OCCUPIED BY SCHEDULED OFFICE HOURS
  for (const oh of officeHours) {
    if (oh.date !== date) continue;
    if (isOfficeHourSessionPassed(oh)) continue;

    if (intervalsOverlap(startTime, endTime, oh.startTime, oh.endTime)) {
      if (areClassesOverlapping(schoolClass, oh.targetClass)) {
        warnings.push({
          type: 'office_hours_occupied',
          severity: 'warning',
          title: `Students Occupied: Office Hours with ${oh.teacherName}`,
          message: `Students in ${schoolClass} have an Office Hours consultation block scheduled: ${oh.teacherName} (${oh.subject}, Target Class: ${oh.targetClass}) from ${formatTime12(oh.startTime)} to ${formatTime12(oh.endTime)} in ${oh.location || 'Faculty Room'}.`,
          conflictingEntity: {
            title: `Office Hours with ${oh.teacherName}`,
            subject: oh.subject,
            room: oh.location,
            teacher: oh.teacherName,
            time: `${formatTime12(oh.startTime)} – ${formatTime12(oh.endTime)}`,
            class: oh.targetClass
          }
        });
      }
    }
  }

  return warnings;
}
