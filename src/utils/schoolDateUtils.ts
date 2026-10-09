/**
 * Comprehensive utility functions for school windows dates,
 * weekly groupings, calendar validation, and safe formatting.
 */

/**
 * Returns today's date formatted as local "YYYY-MM-DD"
 * Prevents UTC timezone drift issues where evening local times jump to the next day.
 */
export function getTodayDateString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Format a Date object as local "YYYY-MM-DD"
 */
export function formatDateToISO(d: Date): string {
  if (isNaN(d.getTime())) return getTodayDateString();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Safely parse any date input (YYYY-MM-DD, ISO string, or Date)
 * into a valid Date object set at local midday (12:00:00) to avoid timezone shifts.
 */
export function parseValidDate(input?: string | Date | null): Date {
  if (!input) return new Date();
  if (input instanceof Date) {
    return isNaN(input.getTime()) ? new Date() : input;
  }
  if (typeof input === 'string') {
    const clean = input.trim();
    // Handle YYYY-MM-DD
    const match = clean.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
    if (match) {
      const year = parseInt(match[1], 10);
      const month = parseInt(match[2], 10) - 1;
      const day = parseInt(match[3], 10);
      const d = new Date(year, month, day, 12, 0, 0);
      if (!isNaN(d.getTime())) return d;
    }
    const d = new Date(clean);
    if (!isNaN(d.getTime())) return d;
  }
  return new Date();
}

/**
 * Validates if an input string is a valid real calendar date
 */
export function isValidDateString(input?: string | null): boolean {
  if (!input || typeof input !== 'string') return false;
  const clean = input.trim();
  const match = clean.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return false;
  const year = parseInt(match[1], 10);
  const month = parseInt(match[2], 10);
  const day = parseInt(match[3], 10);

  if (year < 1900 || year > 2100) return false;
  if (month < 1 || month > 12) return false;
  if (day < 1 || day > 31) return false;

  const d = new Date(year, month - 1, day);
  return d.getFullYear() === year && (d.getMonth() + 1) === month && d.getDate() === day;
}

/**
 * Safely check if a date string (YYYY-MM-DD) is in the past compared to local today.
 */
export function isDatePassed(dateStr?: string | null): boolean {
  if (!dateStr || !isValidDateString(dateStr)) return false;
  const today = getTodayDateString();
  return dateStr < today;
}

/**
 * Returns the formatted starting week label for a given date, e.g. "4 October 2026"
 * Used for weekly birthday and convocation groupings.
 * Always handles any input safely and guarantees a valid human-readable date.
 */
export function getWeekOfLabel(dateInput?: string | Date | null): string {
  const target = parseValidDate(dateInput);
  const day = target.getDay(); // 0 is Sunday
  const sunday = new Date(target);
  sunday.setDate(target.getDate() - day);

  const dayNum = sunday.getDate();
  const monthName = sunday.toLocaleDateString('en-US', { month: 'long' });
  const year = sunday.getFullYear();

  return `${dayNum} ${monthName} ${year}`;
}

/**
 * Check if a date string falls strictly on a Wednesday
 */
export function isWednesday(dateInput?: string | Date | null): boolean {
  if (!dateInput) return false;
  const d = parseValidDate(dateInput);
  return d.getDay() === 3;
}

/**
 * Get the next upcoming Wednesday from a reference date (or today).
 * If the reference date is already a Wednesday and in the future/today, it returns that date.
 */
export function getNextWednesday(fromDateInput?: string | Date | null): string {
  const ref = fromDateInput ? parseValidDate(fromDateInput) : new Date();
  const day = ref.getDay();
  const daysUntilWednesday = (3 - day + 7) % 7;
  const target = new Date(ref);
  target.setDate(ref.getDate() + (daysUntilWednesday === 0 && isDatePassed(formatDateToISO(ref)) ? 7 : daysUntilWednesday));
  return formatDateToISO(target);
}

/**
 * Normalize an inputted birthday:
 * If someone enters their birth year (e.g. 2008-10-15), calculates the current/upcoming occurrence (e.g. 2026-10-15).
 * If the date in the current year has already passed, advances to next year so their celebration isn't discarded.
 */
export function normalizeBirthdayDate(inputDateStr: string): { normalizedDate: string; wasAdjusted: boolean } {
  if (!isValidDateString(inputDateStr)) {
    return { normalizedDate: inputDateStr, wasAdjusted: false };
  }

  const [inputYearStr, monthStr, dayStr] = inputDateStr.split('-');
  const inputYear = parseInt(inputYearStr, 10);
  const currentYear = new Date().getFullYear();
  const today = getTodayDateString();

  // If the user entered an earlier year (birth year)
  if (inputYear < currentYear) {
    const candidateThisYear = `${currentYear}-${monthStr}-${dayStr}`;
    if (isValidDateString(candidateThisYear)) {
      if (candidateThisYear >= today) {
        return { normalizedDate: candidateThisYear, wasAdjusted: true };
      } else {
        // Already passed this year, upcoming occurrence is next year
        const candidateNextYear = `${currentYear + 1}-${monthStr}-${dayStr}`;
        return { normalizedDate: candidateNextYear, wasAdjusted: true };
      }
    }
  }

  return { normalizedDate: inputDateStr, wasAdjusted: false };
}

/**
 * Safely format any date string for human display (e.g. "Wed, 7 Oct 2026")
 */
export function formatDisplayDate(dateInput?: string | Date | null, options?: Intl.DateTimeFormatOptions): string {
  try {
    const d = parseValidDate(dateInput);
    const defaultOptions: Intl.DateTimeFormatOptions = {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    };
    return d.toLocaleDateString('en-US', options || defaultOptions);
  } catch {
    return dateInput ? String(dateInput) : '';
  }
}
