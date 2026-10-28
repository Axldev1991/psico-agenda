import { describe, it, expect } from 'vitest';
import {
  timeToMinutes,
  validateTimeRange,
  validateDayRanges,
  copySchedule,
  isSlotWithinAvailability,
  getDefaultAvailabilitySettings,
  isDateInAbsence,
  validateAbsencePeriod,
  mergeAvailabilitySettings,
} from './availability.service';
import { TimeRange, DaySchedule, WeeklyAvailability, AbsencePeriod } from './availability.types';

describe('availability.service (TDD)', () => {
  describe('timeToMinutes', () => {
    it('converts HH:mm to minutes from midnight', () => {
      expect(timeToMinutes('00:00')).toBe(0);
      expect(timeToMinutes('09:30')).toBe(570);
      expect(timeToMinutes('14:15')).toBe(855);
      expect(timeToMinutes('23:59')).toBe(1439);
    });

    it('handles single digit hours gracefully if passed', () => {
      expect(timeToMinutes('9:00')).toBe(540);
    });
  });

  describe('validateTimeRange', () => {
    it('returns true when start is strictly before end', () => {
      expect(validateTimeRange({ start: '09:00', end: '13:00' })).toBe(true);
      expect(validateTimeRange({ start: '14:30', end: '18:00' })).toBe(true);
    });

    it('returns false when start is equal to or after end', () => {
      expect(validateTimeRange({ start: '13:00', end: '13:00' })).toBe(false);
      expect(validateTimeRange({ start: '15:00', end: '14:00' })).toBe(false);
    });

    it('returns false for invalid time formats', () => {
      expect(validateTimeRange({ start: 'invalid', end: '13:00' })).toBe(false);
      expect(validateTimeRange({ start: '09:00', end: '25:00' })).toBe(false);
    });
  });

  describe('validateDayRanges', () => {
    it('returns valid for empty ranges or single valid range', () => {
      expect(validateDayRanges([])).toEqual({ valid: true });
      expect(validateDayRanges([{ start: '09:00', end: '13:00' }])).toEqual({ valid: true });
    });

    it('returns valid for non-overlapping split shifts', () => {
      const ranges: TimeRange[] = [
        { start: '09:00', end: '13:00' },
        { start: '15:00', end: '19:00' },
      ];
      expect(validateDayRanges(ranges)).toEqual({ valid: true });
    });

    it('returns valid when a range starts exactly when previous ends', () => {
      const ranges: TimeRange[] = [
        { start: '09:00', end: '13:00' },
        { start: '13:00', end: '17:00' },
      ];
      expect(validateDayRanges(ranges)).toEqual({ valid: true });
    });

    it('detects overlapping ranges regardless of input order', () => {
      const overlapping1: TimeRange[] = [
        { start: '09:00', end: '14:00' },
        { start: '13:00', end: '18:00' },
      ];
      expect(validateDayRanges(overlapping1).valid).toBe(false);

      const overlappingUnsorted: TimeRange[] = [
        { start: '15:00', end: '19:00' },
        { start: '10:00', end: '16:00' },
      ];
      expect(validateDayRanges(overlappingUnsorted).valid).toBe(false);
    });

    it('returns invalid if any individual range is invalid', () => {
      const invalid: TimeRange[] = [
        { start: '14:00', end: '10:00' },
      ];
      expect(validateDayRanges(invalid).valid).toBe(false);
    });
  });

  describe('copySchedule', () => {
    it('clones a day schedule to specified target days immutably', () => {
      const defaults = getDefaultAvailabilitySettings().weekly;
      const customMonday: DaySchedule = {
        enabled: true,
        ranges: [
          { start: '10:00', end: '14:00' },
          { start: '16:00', end: '20:00' },
        ],
      };

      const updated = { ...defaults, 1: customMonday };
      // Copy Monday (1) to Tuesday (2) and Thursday (4)
      const result = copySchedule(updated, 1, [2, 4]);

      expect(result[2]).toEqual(customMonday);
      expect(result[4]).toEqual(customMonday);
      expect(result[2]).not.toBe(customMonday); // Deep cloned
      expect(result[1]).toEqual(customMonday);
      // Wednesday (3) remains untouched
      expect(result[3]).toEqual(defaults[3]);
    });
  });

  describe('isSlotWithinAvailability', () => {
    const daySchedule: DaySchedule = {
      enabled: true,
      ranges: [
        { start: '09:00', end: '13:00' },
        { start: '15:00', end: '19:00' },
      ],
    };

    it('returns false if day is disabled', () => {
      const disabledSchedule: DaySchedule = { ...daySchedule, enabled: false };
      const date = new Date(2026, 9, 28, 10, 0); // 10:00
      expect(isSlotWithinAvailability(date, 50, disabledSchedule)).toBe(false);
    });

    it('returns true if slot fits entirely within a range', () => {
      const date1 = new Date(2026, 9, 28, 9, 0); // 09:00 to 09:50
      expect(isSlotWithinAvailability(date1, 50, daySchedule)).toBe(true);

      const date2 = new Date(2026, 9, 28, 12, 10); // 12:10 to 13:00
      expect(isSlotWithinAvailability(date2, 50, daySchedule)).toBe(true);

      const date3 = new Date(2026, 9, 28, 15, 0); // 15:00 to 15:50
      expect(isSlotWithinAvailability(date3, 50, daySchedule)).toBe(true);
    });

    it('returns false if slot overflows range end', () => {
      const date = new Date(2026, 9, 28, 12, 30); // 12:30 to 13:20 (range ends at 13:00)
      expect(isSlotWithinAvailability(date, 50, daySchedule)).toBe(false);
    });

    it('returns false if slot falls during lunch break gap', () => {
      const date = new Date(2026, 9, 28, 13, 30); // 13:30
      expect(isSlotWithinAvailability(date, 50, daySchedule)).toBe(false);
    });

    it('returns false if slot is outside all ranges', () => {
      const earlyDate = new Date(2026, 9, 28, 8, 0); // 08:00
      expect(isSlotWithinAvailability(earlyDate, 50, daySchedule)).toBe(false);

      const lateDate = new Date(2026, 9, 28, 19, 0); // 19:00
      expect(isSlotWithinAvailability(lateDate, 50, daySchedule)).toBe(false);
    });
  });

  describe('getDefaultAvailabilitySettings', () => {
    it('provides sensible defaults for clinical consults', () => {
      const defaults = getDefaultAvailabilitySettings();
      expect(defaults.defaultSessionDurationMinutes).toBe(50);
      expect(defaults.intervalStepMinutes).toBe(60);

      // Mon-Fri enabled
      for (let day = 1; day <= 5; day++) {
        expect(defaults.weekly[day].enabled).toBe(true);
        expect(defaults.weekly[day].ranges.length).toBeGreaterThan(0);
      }
      // Weekend disabled by default
      expect(defaults.weekly[0].enabled).toBe(false); // Sun
      expect(defaults.weekly[6].enabled).toBe(false); // Sat
    });
  });

  describe('isDateInAbsence', () => {
    const absences: AbsencePeriod[] = [
      {
        id: 'abs-1',
        startDate: '2026-11-10',
        endDate: '2026-11-20',
        reason: 'Vacaciones de primavera',
      },
      {
        id: 'abs-2',
        startDate: '2026-12-05',
        endDate: '2026-12-05',
        reason: 'Congreso Internacional',
      },
    ];

    it('returns the active absence period if date falls inside range', () => {
      const insideDate = new Date(2026, 10, 15); // 2026-11-15
      const result = isDateInAbsence(insideDate, absences);
      expect(result).toBeDefined();
      expect(result?.id).toBe('abs-1');
      expect(result?.reason).toBe('Vacaciones de primavera');
    });

    it('returns the active absence on exact boundary dates (inclusive)', () => {
      const startDate = new Date(2026, 10, 10); // 2026-11-10
      expect(isDateInAbsence(startDate, absences)?.id).toBe('abs-1');

      const endDate = new Date(2026, 10, 20); // 2026-11-20
      expect(isDateInAbsence(endDate, absences)?.id).toBe('abs-1');

      const singleDay = new Date(2026, 11, 5); // 2026-12-05
      expect(isDateInAbsence(singleDay, absences)?.id).toBe('abs-2');
    });

    it('returns undefined if date falls outside all absence ranges', () => {
      const before = new Date(2026, 10, 9); // 2026-11-09
      expect(isDateInAbsence(before, absences)).toBeUndefined();

      const after = new Date(2026, 10, 21); // 2026-11-21
      expect(isDateInAbsence(after, absences)).toBeUndefined();
    });

    it('returns undefined for empty, null, or invalid inputs', () => {
      expect(isDateInAbsence(new Date(), [])).toBeUndefined();
      expect(isDateInAbsence(new Date('invalid'), absences)).toBeUndefined();
    });
  });

  describe('validateAbsencePeriod', () => {
    it('returns valid for well-formed periods', () => {
      expect(
        validateAbsencePeriod({
          startDate: '2026-11-10',
          endDate: '2026-11-20',
          reason: 'Vacaciones',
        })
      ).toEqual({ valid: true });

      // Single day absence is valid
      expect(
        validateAbsencePeriod({
          startDate: '2026-11-10',
          endDate: '2026-11-10',
          reason: 'Día de estudio',
        })
      ).toEqual({ valid: true });
    });

    it('returns invalid if start date is after end date', () => {
      const res = validateAbsencePeriod({
        startDate: '2026-11-20',
        endDate: '2026-11-10',
        reason: 'Vacaciones',
      });
      expect(res.valid).toBe(false);
      expect(res.error).toContain('La fecha de inicio debe ser anterior o igual a la de fin');
    });

    it('returns invalid if reason is missing or whitespace', () => {
      const res = validateAbsencePeriod({
        startDate: '2026-11-10',
        endDate: '2026-11-20',
        reason: '   ',
      });
      expect(res.valid).toBe(false);
      expect(res.error).toContain('motivo');
    });
  });

  describe('mergeAvailabilitySettings', () => {
    it('returns local if remote is undefined', () => {
      const local = getDefaultAvailabilitySettings();
      expect(mergeAvailabilitySettings(local, undefined)).toEqual(local);
    });

    it('unions absence periods from local and remote without duplicates', () => {
      const local = getDefaultAvailabilitySettings();
      local.absencePeriods = [
        { id: '1', startDate: '2026-11-01', endDate: '2026-11-05', reason: 'Vacaciones 1' },
      ];

      const remote = getDefaultAvailabilitySettings();
      remote.defaultSessionDurationMinutes = 45;
      remote.absencePeriods = [
        { id: '1', startDate: '2026-11-01', endDate: '2026-11-05', reason: 'Vacaciones 1' },
        { id: '2', startDate: '2026-12-20', endDate: '2026-12-31', reason: 'Receso Navidad' },
      ];

      const merged = mergeAvailabilitySettings(local, remote);
      expect(merged.defaultSessionDurationMinutes).toBe(45);
      expect(merged.absencePeriods).toHaveLength(2);
      expect((merged.absencePeriods || []).map((a: AbsencePeriod) => a.id)).toEqual(['1', '2']);
    });
  });
});

