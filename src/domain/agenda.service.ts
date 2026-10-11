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
      // Check if this date/patient was already processed in recurrence to prevent duplicates
      const alreadyCovered = agenda.some(
        (slot) =>
          slot.patientUuid === session.patientUuid &&
          isSameDay(slot.dateTime, sessionDate)
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
