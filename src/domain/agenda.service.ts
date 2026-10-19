import { RRule } from "rrule";
import { parseISO, isSameDay } from "date-fns";
import { CalendarSlot, ComputeAgendaSlotsParams } from "./agenda.types";
import { getHoliday } from "./holidays";

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
  } = params;

  const agenda: CalendarSlot[] = [];
  const patientMap = new Map(patients.map((p) => [p.uuid, p]));

  // 1. Process Recurrent Rules
  recurrenceRules.forEach((rule) => {
    const patient = patientMap.get(rule.patientUuid);
    if (!patient) return;

    try {
      const rrule = RRule.fromString(rule.rruleString);
      const occurrences = rrule.between(intervalStart, intervalEnd, true);

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
export function findAvailableSlots(params: {
  targetDate: Date;
  bookedSlots: CalendarSlot[];
  startHour?: number;          // Default 8 (08:00)
  endHour?: number;            // Default 20 (20:00)
  slotDurationMinutes?: number;// Default 50
  intervalStepMinutes?: number;// Default 60
}): { time: string; dateTime: Date; formattedTime: string }[] {
  const {
    targetDate,
    bookedSlots,
    startHour = 8,
    endHour = 20,
    slotDurationMinutes = 50,
    intervalStepMinutes = 60,
  } = params;

  const available: { time: string; dateTime: Date; formattedTime: string }[] = [];
  const year = targetDate.getFullYear();
  const month = targetDate.getMonth();
  const day = targetDate.getDate();

  // Find all active booked slots on this day (ignoring cancelled slots)
  const activeDaySlots = bookedSlots.filter(
    (s) => isSameDay(s.dateTime, targetDate) && s.status !== 'cancelled'
  );

  for (let hour = startHour; hour < endHour; hour++) {
    for (let minute = 0; minute < 60; minute += intervalStepMinutes) {
      const slotStart = new Date(year, month, day, hour, minute, 0, 0);
      const slotEnd = new Date(slotStart.getTime() + slotDurationMinutes * 60 * 1000);

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

