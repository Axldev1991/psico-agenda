import {
  TimeRange,
  DaySchedule,
  WeeklyAvailability,
  AvailabilitySettings,
  AbsencePeriod,
} from './availability.types';

/**
 * Converts a "HH:mm" 24h time string into minutes elapsed since midnight.
 */
export function timeToMinutes(time: string): number {
  if (!time || typeof time !== 'string') return NaN;
  const parts = time.split(':');
  if (parts.length !== 2) return NaN;
  const hours = parseInt(parts[0], 10);
  const minutes = parseInt(parts[1], 10);
  if (isNaN(hours) || isNaN(minutes)) return NaN;
  if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) return NaN;
  return hours * 60 + minutes;
}

/**
 * Validates that a single TimeRange has start strictly before end.
 */
export function validateTimeRange(range: TimeRange): boolean {
  if (!range) return false;
  const startMin = timeToMinutes(range.start);
  const endMin = timeToMinutes(range.end);
  if (isNaN(startMin) || isNaN(endMin)) return false;
  return startMin < endMin;
}

/**
 * Validates an array of time ranges for a single day:
 * - Each range must be valid.
 * - No two ranges may overlap (adjacent ranges where rangeA.end === rangeB.start are permitted).
 */
export function validateDayRanges(ranges: TimeRange[]): { valid: boolean; error?: string } {
  if (!ranges || ranges.length === 0) {
    return { valid: true };
  }

  for (let i = 0; i < ranges.length; i++) {
    if (!validateTimeRange(ranges[i])) {
      return {
        valid: false,
        error: `La franja #${i + 1} (${ranges[i]?.start || ''} - ${ranges[i]?.end || ''}) no es válida. La hora de inicio debe ser anterior a la de fin.`,
      };
    }
  }

  // Sort by start time to check for overlaps
  const sorted = [...ranges].sort((a, b) => timeToMinutes(a.start) - timeToMinutes(b.start));

  for (let i = 0; i < sorted.length - 1; i++) {
    const currentEnd = timeToMinutes(sorted[i].end);
    const nextStart = timeToMinutes(sorted[i + 1].start);
    if (currentEnd > nextStart) {
      return {
        valid: false,
        error: `Las franjas se superponen: (${sorted[i].start} - ${sorted[i].end}) y (${sorted[i + 1].start} - ${sorted[i + 1].end}).`,
      };
    }
  }

  return { valid: true };
}

/**
 * Deep-clones the schedule from `fromDay` into `toDays` immutably.
 */
export function copySchedule(
  weekly: WeeklyAvailability,
  fromDay: number,
  toDays: number[]
): WeeklyAvailability {
  const source = weekly[fromDay];
  if (!source) return weekly;

  const result: WeeklyAvailability = { ...weekly };
  toDays.forEach((targetDay) => {
    result[targetDay] = {
      enabled: source.enabled,
      ranges: source.ranges.map((r) => ({ ...r })),
    };
  });

  return result;
}

/**
 * Checks if a given consultation slot starting at `slotStart` with `durationMinutes`
 * falls completely inside one of the enabled schedule's ranges for that day.
 */
export function isSlotWithinAvailability(
  slotStart: Date,
  durationMinutes: number,
  schedule: DaySchedule
): boolean {
  if (!schedule || !schedule.enabled || !schedule.ranges || schedule.ranges.length === 0) {
    return false;
  }

  const slotStartMinutes = slotStart.getHours() * 60 + slotStart.getMinutes();
  const slotEndMinutes = slotStartMinutes + durationMinutes;

  return schedule.ranges.some((range) => {
    const rangeStart = timeToMinutes(range.start);
    const rangeEnd = timeToMinutes(range.end);
    return slotStartMinutes >= rangeStart && slotEndMinutes <= rangeEnd;
  });
}

/**
 * Sensible default availability settings for clinical psychology practices.
 */
export function getDefaultAvailabilitySettings(): AvailabilitySettings {
  const defaultRanges: TimeRange[] = [
    { start: '09:00', end: '13:00' },
    { start: '15:00', end: '19:00' },
  ];

  const weekly: WeeklyAvailability = {
    0: { enabled: false, ranges: [] }, // Sunday
    1: { enabled: true, ranges: defaultRanges.map((r) => ({ ...r })) }, // Monday
    2: { enabled: true, ranges: defaultRanges.map((r) => ({ ...r })) }, // Tuesday
    3: { enabled: true, ranges: defaultRanges.map((r) => ({ ...r })) }, // Wednesday
    4: { enabled: true, ranges: defaultRanges.map((r) => ({ ...r })) }, // Thursday
    5: { enabled: true, ranges: defaultRanges.map((r) => ({ ...r })) }, // Friday
    6: { enabled: false, ranges: [] }, // Saturday
  };

  return {
    weekly,
    defaultSessionDurationMinutes: 50,
    intervalStepMinutes: 60,
    absencePeriods: [],
  };
}

/**
 * Checks if a given Date falls within any active absence period (inclusive of startDate and endDate).
 */
export function isDateInAbsence(
  date: Date,
  absences?: AbsencePeriod[]
): AbsencePeriod | undefined {
  if (!date || !absences || absences.length === 0) return undefined;
  if (isNaN(date.getTime())) return undefined;

  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  const targetDateStr = `${y}-${m}-${d}`;

  return absences.find((absence) => {
    if (!absence.startDate || !absence.endDate) return false;
    return targetDateStr >= absence.startDate && targetDateStr <= absence.endDate;
  });
}

/**
 * Validates an absence period:
 * - startDate and endDate must be valid ISO YYYY-MM-DD
 * - startDate must be <= endDate
 * - reason must not be empty
 */
export function validateAbsencePeriod(period: Partial<AbsencePeriod>): { valid: boolean; error?: string } {
  if (!period) return { valid: false, error: 'El período no puede estar vacío.' };
  if (!period.startDate || !/^\d{4}-\d{2}-\d{2}$/.test(period.startDate)) {
    return { valid: false, error: 'Fecha de inicio inválida.' };
  }
  if (!period.endDate || !/^\d{4}-\d{2}-\d{2}$/.test(period.endDate)) {
    return { valid: false, error: 'Fecha de fin inválida.' };
  }
  if (period.startDate > period.endDate) {
    return { valid: false, error: 'La fecha de inicio debe ser anterior o igual a la de fin.' };
  }
  if (!period.reason || !period.reason.trim()) {
    return { valid: false, error: 'Debés ingresar un motivo para el período de receso.' };
  }
  return { valid: true };
}

/**
 * Merges local and remote AvailabilitySettings (used during cloud sync):
 * - Absence periods are unioned by id (or by date range and reason).
 * - Remote weekly schedule and durations take precedence if provided, falling back to local.
 */
export function mergeAvailabilitySettings(
  local: AvailabilitySettings,
  remote?: AvailabilitySettings
): AvailabilitySettings {
  if (!remote) return local;
  if (!local) return remote;

  const absenceMap = new Map<string, AbsencePeriod>();
  (local.absencePeriods || []).forEach((a) => {
    const key = a.id || `${a.startDate}_${a.endDate}_${a.reason}`;
    absenceMap.set(key, a);
  });
  (remote.absencePeriods || []).forEach((a) => {
    const key = a.id || `${a.startDate}_${a.endDate}_${a.reason}`;
    absenceMap.set(key, a);
  });

  return {
    weekly: remote.weekly ? { ...local.weekly, ...remote.weekly } : local.weekly,
    defaultSessionDurationMinutes:
      remote.defaultSessionDurationMinutes || local.defaultSessionDurationMinutes,
    intervalStepMinutes: remote.intervalStepMinutes || local.intervalStepMinutes,
    absencePeriods: Array.from(absenceMap.values()),
  };
}

