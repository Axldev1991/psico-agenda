import { RRule } from "rrule";
import { parseISO, isSameDay, format } from "date-fns";
import { 
  CalendarSlot, 
  ComputeAgendaSlotsParams, 
  FindAvailableSlotsParams,
  RescheduleSlotParams,
  RescheduleResult,
  SwapSlotsParams,
  SwapResult,
  RecurrenceCadence
} from "./agenda.types";
import { getHoliday } from "./holidays";
import { isSlotWithinAvailability, isDateInAbsence } from "./availability.service";

/**
 * Computes calendar slots for a given time interval by combining:
 * 1. Recurring series expansion via RRule.
 * 2. Overrides from persisted database sessions (cancellations, modifications).
 * 3. Standalone manual sessions.
 * 4. Holiday associations and chronological sorting.
 */
export function computeAgendaSlots(params: ComputeAgendaSlotsParams): CalendarSlot[] {
  const {
    intervalStart,
    intervalEnd,
    recurrenceRules,
    dbSessions,
    patients,
    holidays = [],
    absencePeriods = [],
  } = params;

  const agenda: CalendarSlot[] = [];
  const patientMap = new Map(patients.map((p) => [p.uuid, p]));

  // 1. Process Recurrent Rules
  recurrenceRules.forEach((rule) => {
    const patient = patientMap.get(rule.patientUuid);
    if (!patient) return;

    try {
      const rrule = RRule.fromString(rule.rruleString);
      // Normalize query interval to UTC day boundaries to prevent timezone skew (e.g. UTC-3 excluding Monday at 00:00Z)
      const queryStart = new Date(Date.UTC(
        intervalStart.getFullYear(),
        intervalStart.getMonth(),
        intervalStart.getDate(),
        0, 0, 0, 0
      ));
      const queryEnd = new Date(Date.UTC(
        intervalEnd.getFullYear(),
        intervalEnd.getMonth(),
        intervalEnd.getDate(),
        23, 59, 59, 999
      ));
      const occurrences = rrule.between(queryStart, queryEnd, true);

      occurrences.forEach((occurrence) => {
        // Extract UTC calendar date from RRule occurrence to prevent timezone skew
        const year = occurrence.getUTCFullYear();
        const month = occurrence.getUTCMonth();
        const day = occurrence.getUTCDate();
        const [hours, minutes] = rule.startTime.split(":").map(Number);
        
        const slotDateTime = new Date(year, month, day, hours, minutes, 0, 0);

        // Check if there is a recorded session override in the database for the same patient & day
        const dbOverride = dbSessions.find(
          (s) =>
            s.patientUuid === rule.patientUuid &&
            isSameDay(parseISO(s.dateTime), slotDateTime)
        );

        const activeAbsence = isDateInAbsence(slotDateTime, absencePeriods);

        if (dbOverride) {
          agenda.push({
            uuid: dbOverride.uuid,
            patientUuid: rule.patientUuid,
            patientName: patient.fullName,
            dateTime: slotDateTime,
            durationMinutes: rule.durationMinutes,
            status: dbOverride.status,
            price: dbOverride.priceAtSession,
            notes: dbOverride.notes,
            isRecurrent: true,
            holiday: getHoliday(slotDateTime, holidays),
            isSuspended: !!activeAbsence,
            absence: activeAbsence,
          });
        } else {
          agenda.push({
            patientUuid: rule.patientUuid,
            patientName: patient.fullName,
            dateTime: slotDateTime,
            durationMinutes: rule.durationMinutes,
            status: "scheduled",
            price: patient.sessionPrice,
            isRecurrent: true,
            holiday: getHoliday(slotDateTime, holidays),
            isSuspended: !!activeAbsence,
            absence: activeAbsence,
          });
        }
      });
    } catch (err) {
      console.error("Error parsing RRule string:", rule.rruleString, err);
    }
  });

  // 2. Process Standalone Manual Sessions
  dbSessions.forEach((session) => {
    const sessionDate = parseISO(session.dateTime);
    if (sessionDate >= intervalStart && sessionDate <= intervalEnd) {
      // Check if this session was already processed in recurrence overrides
      const alreadyCovered = session.uuid && agenda.some(
        (slot) => slot.uuid === session.uuid
      );

      if (!alreadyCovered) {
        const patient = patientMap.get(session.patientUuid);
        const activeAbsence = isDateInAbsence(sessionDate, absencePeriods);
        agenda.push({
          uuid: session.uuid,
          patientUuid: session.patientUuid,
          patientName: patient ? patient.fullName : "Paciente Desconocido",
          dateTime: sessionDate,
          durationMinutes: 50,
          status: session.status,
          price: session.priceAtSession,
          notes: session.notes,
          isRecurrent: false,
          holiday: getHoliday(sessionDate, holidays),
          isSuspended: !!activeAbsence,
          absence: activeAbsence,
        });
      }
    }
  });

  // 3. Chronological Sort
  return agenda.sort((a, b) => a.dateTime.getTime() - b.dateTime.getTime());
}

/**
 * Builds an RFC 5545 compliant RRule string based on clinical cadence, selected days, and start date.
 */
export function buildRRuleString(options: {
  cadence: 'weekly' | 'biweekly' | 'monthly';
  daysOfWeek: number[]; // 0 = MO, 1 = TU, 2 = WE, 3 = TH, 4 = FR, 5 = SA, 6 = SU
  startDate?: string;   // "YYYY-MM-DD"
}): string {
  const dayNames = ['MO', 'TU', 'WE', 'TH', 'FR', 'SA', 'SU'] as const;
  const sortedDays = Array.from(new Set(options.daysOfWeek))
    .filter((d) => d >= 0 && d <= 6)
    .sort((a, b) => a - b);

  if (sortedDays.length === 0) {
    throw new Error('At least one day of week must be selected');
  }

  const byDays = sortedDays.map((d) => dayNames[d]).join(',');
  const dtstart = options.startDate
    ? `DTSTART:${options.startDate.replace(/-/g, '')}T000000Z\nRRULE:`
    : '';

  switch (options.cadence) {
    case 'weekly':
      return `${dtstart}FREQ=WEEKLY;BYDAY=${byDays}`;
    case 'biweekly':
      return `${dtstart}FREQ=WEEKLY;INTERVAL=2;BYDAY=${byDays}`;
    case 'monthly': {
      if (options.startDate) {
        // Compute ordinal week position of the start date (1st, 2nd, 3rd, 4th, or last)
        const dayOfMonth = parseInt(options.startDate.split('-')[2], 10);
        const ordinal = Math.ceil(dayOfMonth / 7);
        const setPos = ordinal >= 5 ? -1 : ordinal;
        return `${dtstart}FREQ=MONTHLY;BYDAY=${byDays};BYSETPOS=${setPos}`;
      }
      return `${dtstart}FREQ=MONTHLY;BYDAY=${byDays};BYSETPOS=1`;
    }
    default:
      return `${dtstart}FREQ=WEEKLY;BYDAY=${byDays}`;
  }
}

/**
 * Computes unbooked, free consultation slots for a given day within working clinical hours.
 */
export function findAvailableSlots(
  params: FindAvailableSlotsParams
): { time: string; dateTime: Date; formattedTime: string }[] {
  const {
    targetDate,
    bookedSlots,
    startHour: customStartHour,
    endHour: customEndHour,
    slotDurationMinutes = 50,
    intervalStepMinutes = 60,
    weeklyAvailability,
    absencePeriods,
  } = params;

  // If target date falls within an active absence/recess period, no slots are available
  if (isDateInAbsence(targetDate, absencePeriods)) {
    return [];
  }

  const available: { time: string; dateTime: Date; formattedTime: string }[] = [];
  const year = targetDate.getFullYear();
  const month = targetDate.getMonth();
  const day = targetDate.getDate();

  // If weekly availability is supplied, check if the day is enabled
  const daySchedule = weeklyAvailability ? weeklyAvailability[targetDate.getDay()] : undefined;
  if (weeklyAvailability) {
    if (!daySchedule || !daySchedule.enabled || !daySchedule.ranges || daySchedule.ranges.length === 0) {
      return [];
    }
  }

  const startHour = customStartHour ?? 8;
  const endHour = customEndHour ?? 20;

  // Find all active booked slots on this day (ignoring cancelled slots)
  const activeDaySlots = bookedSlots.filter(
    (s) => isSameDay(s.dateTime, targetDate) && s.status !== 'cancelled'
  );

  // Search range: if weeklyAvailability is provided, scan between 06:00 and 23:00 or custom bounds
  const loopStartHour = weeklyAvailability ? 6 : startHour;
  const loopEndHour = weeklyAvailability ? 23 : endHour;

  for (let hour = loopStartHour; hour < loopEndHour; hour++) {
    for (let minute = 0; minute < 60; minute += intervalStepMinutes) {
      const slotStart = new Date(year, month, day, hour, minute, 0, 0);
      const slotEnd = new Date(slotStart.getTime() + slotDurationMinutes * 60 * 1000);

      // If weekly availability is enabled, check if slot falls strictly inside one of the day's ranges
      if (daySchedule && !isSlotWithinAvailability(slotStart, slotDurationMinutes, daySchedule)) {
        continue;
      }

      // Check collision with any existing active booked appointment
      const hasConflict = activeDaySlots.some((booked) => {
        const bookedStart = new Date(booked.dateTime).getTime();
        const bookedDuration = booked.durationMinutes || 50;
        const bookedEnd = bookedStart + bookedDuration * 60 * 1000;

        return (
          slotStart.getTime() < bookedEnd &&
          slotEnd.getTime() > bookedStart
        );
      });

      if (!hasConflict) {
        const hh = String(hour).padStart(2, '0');
        const mm = String(minute).padStart(2, '0');
        const time = `${hh}:${mm}`;
        available.push({
          time,
          dateTime: slotStart,
          formattedTime: `${time} hs`,
        });
      }
    }
  }

  return available;
}

/**
 * Checks if a proposed appointment time interval overlaps with any existing active booked slot.
 */
export function findConflictingSlot(
  slotStart: Date,
  durationMinutes: number,
  bookedSlots: CalendarSlot[]
): CalendarSlot | undefined {
  const slotEnd = new Date(slotStart.getTime() + durationMinutes * 60 * 1000);

  return bookedSlots.find((booked) => {
    if (booked.status === 'cancelled' || booked.isSuspended) return false;
    if (!isSameDay(booked.dateTime, slotStart)) return false;

    const bookedStart = new Date(booked.dateTime).getTime();
    const bookedDuration = booked.durationMinutes || 50;
    const bookedEnd = bookedStart + bookedDuration * 60 * 1000;

    return slotStart.getTime() < bookedEnd && slotEnd.getTime() > bookedStart;
  });
}

function isSameSlot(s: CalendarSlot, target: CalendarSlot): boolean {
  if (target.uuid && s.uuid) return s.uuid === target.uuid;
  return s.patientUuid === target.patientUuid && s.dateTime.getTime() === target.dateTime.getTime();
}

function parseCadenceFromRRule(rruleString: string): RecurrenceCadence {
  if (rruleString.includes('FREQ=MONTHLY')) return 'monthly';
  if (rruleString.includes('INTERVAL=2')) return 'biweekly';
  return 'weekly';
}

function parseDaysOfWeekFromRRule(rruleString: string): number[] {
  const dayMap: Record<string, number> = {
    MO: 0,
    TU: 1,
    WE: 2,
    TH: 3,
    FR: 4,
    SA: 5,
    SU: 6,
  };
  const match = rruleString.match(/BYDAY=([A-Z,]+)/);
  if (!match) return [];
  return match[1]
    .split(',')
    .map((d) => dayMap[d.trim()])
    .filter((d): d is number => d !== undefined);
}

function computeUpdatedDaysOfWeek(
  existingRruleString: string,
  oldDateTime: Date,
  newDateTime: Date
): number[] {
  const existingDays = parseDaysOfWeekFromRRule(existingRruleString);
  const oldDay = (oldDateTime.getDay() + 6) % 7;
  const newDay = (newDateTime.getDay() + 6) % 7;

  if (existingDays.includes(oldDay)) {
    return Array.from(new Set(existingDays.map((d) => (d === oldDay ? newDay : d)))).sort((a, b) => a - b);
  }
  return [newDay];
}

export function rescheduleSlot(params: RescheduleSlotParams): RescheduleResult {
  const { slot, newDateTime, scope, existingRule, bookedSlots = [] } = params;

  if (bookedSlots.length > 0) {
    const otherBooked = bookedSlots.filter((s) => !isSameSlot(s, slot));
    const conflict = findConflictingSlot(newDateTime, slot.durationMinutes, otherBooked);
    if (conflict) {
      return { success: false, error: 'conflict' };
    }
  }

  if (scope === 'permanent') {
    if (!slot.isRecurrent || !existingRule) {
      return { success: false, error: 'missing_rule' };
    }

    const cadence = parseCadenceFromRRule(existingRule.rruleString);
    const daysOfWeek = computeUpdatedDaysOfWeek(existingRule.rruleString, slot.dateTime, newDateTime);
    const startTime = format(newDateTime, 'HH:mm');
    const startDate = format(newDateTime, 'yyyy-MM-dd');

    const updatedRule = {
      ...existingRule,
      startDate,
      startTime,
      rruleString: buildRRuleString({ cadence, daysOfWeek, startDate }),
    };

    return { success: true, updatedRule };
  }

  // Eventual
  const nowStr = new Date().toISOString();

  const cancelException = {
    uuid: slot.uuid || crypto.randomUUID(),
    patientUuid: slot.patientUuid,
    dateTime: slot.dateTime.toISOString(),
    status: 'cancelled' as const,
    priceAtSession: slot.price,
    notes: slot.notes,
    createdAt: nowStr,
    updatedAt: nowStr,
  };

  const newSession = {
    uuid: crypto.randomUUID(),
    patientUuid: slot.patientUuid,
    dateTime: newDateTime.toISOString(),
    status: 'scheduled' as const,
    priceAtSession: slot.price,
    notes: slot.notes,
    createdAt: nowStr,
    updatedAt: nowStr,
  };

  return { success: true, cancelException, newSession };
}

export function swapSlots(params: SwapSlotsParams): SwapResult {
  const { slotA, slotB, scope, ruleA, ruleB, bookedSlots = [] } = params;

  if (bookedSlots.length > 0) {
    const otherBooked = bookedSlots.filter(
      (s) => !isSameSlot(s, slotA) && !isSameSlot(s, slotB)
    );

    const conflictA = findConflictingSlot(slotB.dateTime, slotA.durationMinutes, otherBooked);
    if (conflictA) return { success: false, error: 'conflict', sessionsToSave: [], rulesToSave: [] };

    const conflictB = findConflictingSlot(slotA.dateTime, slotB.durationMinutes, otherBooked);
    if (conflictB) return { success: false, error: 'conflict', sessionsToSave: [], rulesToSave: [] };
  }

  if (scope === 'permanent') {
    const rulesToSave = [];

    if (slotA.isRecurrent && ruleA) {
      const cadenceA = parseCadenceFromRRule(ruleA.rruleString);
      const daysOfWeekA = computeUpdatedDaysOfWeek(ruleA.rruleString, slotA.dateTime, slotB.dateTime);
      const startTime = format(slotB.dateTime, 'HH:mm');
      const startDate = format(slotB.dateTime, 'yyyy-MM-dd');

      rulesToSave.push({
        ...ruleA,
        startDate,
        startTime,
        rruleString: buildRRuleString({ cadence: cadenceA, daysOfWeek: daysOfWeekA, startDate }),
      });
    }

    if (slotB.isRecurrent && ruleB) {
      const cadenceB = parseCadenceFromRRule(ruleB.rruleString);
      const daysOfWeekB = computeUpdatedDaysOfWeek(ruleB.rruleString, slotB.dateTime, slotA.dateTime);
      const startTime = format(slotA.dateTime, 'HH:mm');
      const startDate = format(slotA.dateTime, 'yyyy-MM-dd');

      rulesToSave.push({
        ...ruleB,
        startDate,
        startTime,
        rruleString: buildRRuleString({ cadence: cadenceB, daysOfWeek: daysOfWeekB, startDate }),
      });
    }

    return { success: true, sessionsToSave: [], rulesToSave };
  }

  // Eventual
  const nowStr = new Date().toISOString();

  const cancelA = {
    uuid: slotA.uuid || crypto.randomUUID(),
    patientUuid: slotA.patientUuid,
    dateTime: slotA.dateTime.toISOString(),
    status: 'cancelled' as const,
    priceAtSession: slotA.price,
    notes: slotA.notes,
    createdAt: nowStr,
    updatedAt: nowStr,
  };

  const cancelB = {
    uuid: slotB.uuid || crypto.randomUUID(),
    patientUuid: slotB.patientUuid,
    dateTime: slotB.dateTime.toISOString(),
    status: 'cancelled' as const,
    priceAtSession: slotB.price,
    notes: slotB.notes,
    createdAt: nowStr,
    updatedAt: nowStr,
  };

  const newA = {
    uuid: crypto.randomUUID(),
    patientUuid: slotA.patientUuid,
    dateTime: slotB.dateTime.toISOString(),
    status: 'scheduled' as const,
    priceAtSession: slotA.price,
    notes: slotA.notes,
    createdAt: nowStr,
    updatedAt: nowStr,
  };

  const newB = {
    uuid: crypto.randomUUID(),
    patientUuid: slotB.patientUuid,
    dateTime: slotA.dateTime.toISOString(),
    status: 'scheduled' as const,
    priceAtSession: slotB.price,
    notes: slotB.notes,
    createdAt: nowStr,
    updatedAt: nowStr,
  };

  return { 
    success: true, 
    sessionsToSave: [cancelA, cancelB, newA, newB], 
    rulesToSave: [] 
  };
}

