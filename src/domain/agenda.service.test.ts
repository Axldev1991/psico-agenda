import { describe, it, expect } from "vitest";
import { 
  computeAgendaSlots, 
  buildRRuleString, 
  findAvailableSlots, 
  findConflictingSlot,
  rescheduleSlot,
  swapSlots
} from "./agenda.service";
import { RecurrenceRule, Session } from "./session.types";
import { Patient } from "./patient.types";
import { Holiday } from "./holidays";
import { AvailableSlot, CalendarSlot } from "./agenda.types";

describe("Agenda Domain Service (computeAgendaSlots)", () => {
  const intervalStart = new Date("2026-10-12T00:00:00.000Z"); // Monday
  const intervalEnd = new Date("2026-10-18T23:59:59.999Z"); // Sunday

  const mockPatient: Patient = {
    uuid: "p-1",
    fullName: "Juan Pérez",
    email: "juan@example.com",
    phone: "11223344",
    address: "Calle Falsa 123",
    healthInsurance: "OSDE",
    affiliateNumber: "12345",
    sessionPrice: 25000,
    type: "adult",
    status: "active",
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
  };

  it("expands a weekly recurring rule into an agenda slot", () => {
    const recurrenceRule: RecurrenceRule = {
      patientUuid: "p-1",
      rruleString: "DTSTART:20261006T000000Z\nRRULE:FREQ=WEEKLY;BYDAY=TU",
      startDate: "2026-10-06",
      startTime: "16:00",
      durationMinutes: 50,
    };

    const slots = computeAgendaSlots({
      intervalStart,
      intervalEnd,
      recurrenceRules: [recurrenceRule],
      dbSessions: [],
      patients: [mockPatient],
    });

    expect(slots).toHaveLength(1);
    expect(slots[0].patientUuid).toBe("p-1");
    expect(slots[0].patientName).toBe("Juan Pérez");
    expect(slots[0].isRecurrent).toBe(true);
    expect(slots[0].status).toBe("scheduled");
    expect(slots[0].price).toBe(25000);
    expect(slots[0].durationMinutes).toBe(50);
    expect(slots[0].dateTime.getDay()).toBe(2); // Tuesday
  });

  it("overrides a recurring slot with an existing database session exception", () => {
    const recurrenceRule: RecurrenceRule = {
      patientUuid: "p-1",
      rruleString: "DTSTART:20261006T000000Z\nRRULE:FREQ=WEEKLY;BYDAY=TU",
      startDate: "2026-10-06",
      startTime: "16:00",
      durationMinutes: 50,
    };

    const cancelledSession: Session = {
      uuid: "sess-override-1",
      patientUuid: "p-1",
      dateTime: "2026-10-13T16:00:00",
      status: "cancelled",
      priceAtSession: 20000,
      notes: "Canceló con aviso previo",
      createdAt: "2026-10-10T00:00:00.000Z",
      updatedAt: "2026-10-10T00:00:00.000Z",
    };

    const slots = computeAgendaSlots({
      intervalStart,
      intervalEnd,
      recurrenceRules: [recurrenceRule],
      dbSessions: [cancelledSession],
      patients: [mockPatient],
    });

    expect(slots).toHaveLength(1);
    expect(slots[0].uuid).toBe("sess-override-1");
    expect(slots[0].status).toBe("cancelled");
    expect(slots[0].price).toBe(20000);
    expect(slots[0].notes).toBe("Canceló con aviso previo");
    expect(slots[0].isRecurrent).toBe(true);
  });

  it("includes standalone one-off manual sessions", () => {
    const manualSession: Session = {
      uuid: "sess-manual-1",
      patientUuid: "p-1",
      dateTime: "2026-10-15T18:00:00", // Thursday
      status: "scheduled",
      priceAtSession: 30000,
      notes: "Sesión extraordinaria de interconsulta",
      createdAt: "2026-10-10T00:00:00.000Z",
      updatedAt: "2026-10-10T00:00:00.000Z",
    };

    const slots = computeAgendaSlots({
      intervalStart,
      intervalEnd,
      recurrenceRules: [],
      dbSessions: [manualSession],
      patients: [mockPatient],
    });

    expect(slots).toHaveLength(1);
    expect(slots[0].uuid).toBe("sess-manual-1");
    expect(slots[0].isRecurrent).toBe(false);
    expect(slots[0].price).toBe(30000);
    expect(slots[0].notes).toBe("Sesión extraordinaria de interconsulta");
  });

  it("tags slots falling on official holidays", () => {
    const recurrenceRule: RecurrenceRule = {
      patientUuid: "p-1",
      rruleString: "DTSTART:20261005T000000Z\nRRULE:FREQ=WEEKLY;BYDAY=MO", // Monday Oct 12
      startDate: "2026-10-05",
      startTime: "10:00",
      durationMinutes: 50,
    };

    const holiday: Holiday = {
      date: "2026-10-12",
      name: "Día del Respeto a la Diversidad Cultural",
    };

    const slots = computeAgendaSlots({
      intervalStart,
      intervalEnd,
      recurrenceRules: [recurrenceRule],
      dbSessions: [],
      patients: [mockPatient],
      holidays: [holiday],
    });

    expect(slots).toHaveLength(1);
    expect(slots[0].holiday).toBeDefined();
    expect(slots[0].holiday?.name).toBe("Día del Respeto a la Diversidad Cultural");
  });

  it("sorts multiple slots in ascending chronological order", () => {
    const session1: Session = {
      uuid: "sess-1",
      patientUuid: "p-1",
      dateTime: "2026-10-15T18:00:00",
      status: "scheduled",
      priceAtSession: 25000,
      createdAt: "2026-01-01T00:00:00.000Z",
      updatedAt: "2026-01-01T00:00:00.000Z",
    };

    const session2: Session = {
      uuid: "sess-2",
      patientUuid: "p-1",
      dateTime: "2026-10-13T10:00:00",
      status: "scheduled",
      priceAtSession: 25000,
      createdAt: "2026-01-01T00:00:00.000Z",
      updatedAt: "2026-01-01T00:00:00.000Z",
    };

    const slots = computeAgendaSlots({
      intervalStart,
      intervalEnd,
      recurrenceRules: [],
      dbSessions: [session1, session2],
      patients: [mockPatient],
    });

    expect(slots).toHaveLength(2);
    expect(slots[0].uuid).toBe("sess-2");
    expect(slots[1].uuid).toBe("sess-1");
  });

  describe("buildRRuleString", () => {
    it("generates multi-day weekly RRule string", () => {
      const result = buildRRuleString({
        cadence: "weekly",
        daysOfWeek: [0, 3], // Monday & Thursday
        startDate: "2026-10-01",
      });
      expect(result).toBe("DTSTART:20261001T000000Z\nRRULE:FREQ=WEEKLY;BYDAY=MO,TH");
    });

    it("generates biweekly RRule string with interval=2", () => {
      const result = buildRRuleString({
        cadence: "biweekly",
        daysOfWeek: [1], // Tuesday
        startDate: "2026-10-06",
      });
      expect(result).toBe("DTSTART:20261006T000000Z\nRRULE:FREQ=WEEKLY;INTERVAL=2;BYDAY=TU");
    });

    it("generates monthly RRule string with ordinal BYSETPOS", () => {
      const result1 = buildRRuleString({
        cadence: "monthly",
        daysOfWeek: [4], // Friday Oct 23 -> 4th Friday
        startDate: "2026-10-23",
      });
      expect(result1).toBe("DTSTART:20261023T000000Z\nRRULE:FREQ=MONTHLY;BYDAY=FR;BYSETPOS=4");

      const resultLast = buildRRuleString({
        cadence: "monthly",
        daysOfWeek: [4], // Friday Oct 30 -> 5th Friday -> last (-1)
        startDate: "2026-10-30",
      });
      expect(resultLast).toBe("DTSTART:20261030T000000Z\nRRULE:FREQ=MONTHLY;BYDAY=FR;BYSETPOS=-1");
    });

    it("throws error if no days of week are selected", () => {
      expect(() =>
        buildRRuleString({
          cadence: "weekly",
          daysOfWeek: [],
        })
      ).toThrow("At least one day of week must be selected");
    });
  });

  describe("Multi-day and Biweekly computeAgendaSlots expansion", () => {
    it("expands a multi-day rule into multiple slots within the same week", () => {
      const multiDayRule: RecurrenceRule = {
        patientUuid: "p-1",
        rruleString: "DTSTART:20261001T000000Z\nRRULE:FREQ=WEEKLY;BYDAY=MO,TH",
        startDate: "2026-10-01",
        startTime: "16:00",
        durationMinutes: 50,
      };

      const slots = computeAgendaSlots({
        intervalStart, // 2026-10-12 to 2026-10-18
        intervalEnd,
        recurrenceRules: [multiDayRule],
        dbSessions: [],
        patients: [mockPatient],
      });

      expect(slots).toHaveLength(2);
      expect(slots[0].dateTime.getDay()).toBe(1); // Monday (12 Oct)
      expect(slots[1].dateTime.getDay()).toBe(4); // Thursday (15 Oct)
    });

    it("expands a biweekly rule skipping alternate weeks", () => {
      const twoWeekIntervalStart = new Date("2026-10-05T00:00:00.000Z"); // Week 1
      const twoWeekIntervalEnd = new Date("2026-10-18T23:59:59.999Z");   // Week 2

      const biweeklyRule: RecurrenceRule = {
        patientUuid: "p-1",
        rruleString: "DTSTART:20261006T000000Z\nRRULE:FREQ=WEEKLY;INTERVAL=2;BYDAY=TU",
        startDate: "2026-10-06",
        startTime: "16:00",
        durationMinutes: 50,
      };

      const slots = computeAgendaSlots({
        intervalStart: twoWeekIntervalStart,
        intervalEnd: twoWeekIntervalEnd,
        recurrenceRules: [biweeklyRule],
        dbSessions: [],
        patients: [mockPatient],
      });

      // Should only appear on Tuesday Week 1 (Oct 6), skipping Tuesday Week 2 (Oct 13)
      expect(slots).toHaveLength(1);
      expect(slots[0].dateTime.toISOString()).toContain("2026-10-06");
    });
  });

  describe("findAvailableSlots", () => {
    it("finds all unbooked slots and ignores cancelled appointments", () => {
      const targetDate = new Date(2026, 9, 14);

      const bookedSlots = [
        {
          patientUuid: "p-1",
          patientName: "Juan",
          dateTime: new Date(2026, 9, 14, 10, 0, 0), // 10:00
          durationMinutes: 50,
          status: "scheduled" as const,
          price: 25000,
          isRecurrent: true,
        },
        {
          patientUuid: "p-2",
          patientName: "Pedro",
          dateTime: new Date(2026, 9, 14, 11, 0, 0), // 11:00 CANCELLED
          durationMinutes: 50,
          status: "cancelled" as const,
          price: 25000,
          isRecurrent: false,
        },
      ];

      const available = findAvailableSlots({
        targetDate,
        bookedSlots,
        startHour: 9,
        endHour: 13,
        slotDurationMinutes: 50,
        intervalStepMinutes: 60,
      });

      const availableTimes = available.map((s: AvailableSlot) => s.time);

      // 09:00: free
      // 10:00: booked (scheduled) -> excluded
      // 11:00: cancelled -> available!
      // 12:00: free
      expect(availableTimes).toContain("09:00");
      expect(availableTimes).not.toContain("10:00");
      expect(availableTimes).toContain("11:00");
      expect(availableTimes).toContain("12:00");
    });

    it("restricts slots based on weekly availability and split shifts", () => {
      // 2026-10-14 is a Wednesday (day 3)
      const targetWednesday = new Date(2026, 9, 14);

      const weekly = {
        0: { enabled: false, ranges: [] },
        1: { enabled: false, ranges: [] },
        2: { enabled: false, ranges: [] },
        3: {
          enabled: true,
          ranges: [
            { start: "09:00", end: "12:00" },
            { start: "16:00", end: "19:00" },
          ],
        },
        4: { enabled: false, ranges: [] },
        5: { enabled: false, ranges: [] },
        6: { enabled: false, ranges: [] },
      };

      const available = findAvailableSlots({
        targetDate: targetWednesday,
        bookedSlots: [],
        slotDurationMinutes: 50,
        intervalStepMinutes: 60,
        weeklyAvailability: weekly,
      });

      const times = available.map((s) => s.time);
      // Morning shift (09:00 - 12:00): 09:00 and 10:00, 11:00 (11:00 to 11:50 fits before 12:00)
      expect(times).toContain("09:00");
      expect(times).toContain("10:00");
      expect(times).toContain("11:00");

      // Midday gap (12:00 to 16:00) should NOT have slots
      expect(times).not.toContain("12:00");
      expect(times).not.toContain("13:00");
      expect(times).not.toContain("14:00");
      expect(times).not.toContain("15:00");

      // Afternoon shift (16:00 - 19:00): 16:00, 17:00, 18:00
      expect(times).toContain("16:00");
      expect(times).toContain("17:00");
      expect(times).toContain("18:00");
      expect(times).not.toContain("19:00");
    });

    it("returns empty array if target day is disabled in weekly availability", () => {
      // 2026-10-18 is Sunday (day 0)
      const targetSunday = new Date(2026, 9, 18);

      const weekly = {
        0: { enabled: false, ranges: [{ start: "10:00", end: "14:00" }] },
        1: { enabled: true, ranges: [{ start: "10:00", end: "14:00" }] },
        2: { enabled: true, ranges: [] },
        3: { enabled: true, ranges: [] },
        4: { enabled: true, ranges: [] },
        5: { enabled: true, ranges: [] },
        6: { enabled: false, ranges: [] },
      };

      const available = findAvailableSlots({
        targetDate: targetSunday,
        bookedSlots: [],
        weeklyAvailability: weekly,
      });

      expect(available).toEqual([]);
    });
  });

  describe("findConflictingSlot", () => {
    const existingSlot = {
      patientUuid: "p-1",
      patientName: "Juan Pérez",
      dateTime: new Date(2026, 9, 14, 10, 0, 0), // 10:00 to 10:50
      durationMinutes: 50,
      status: "scheduled" as const,
      price: 25000,
      isRecurrent: false,
    };

    it("returns the conflicting slot when proposed slot overlaps", () => {
      // Overlap: 10:30 to 11:20 (overlaps with 10:00-10:50)
      const proposedStart = new Date(2026, 9, 14, 10, 30, 0);
      const conflict = findConflictingSlot(proposedStart, 50, [existingSlot]);
      expect(conflict).toBeDefined();
      expect(conflict?.patientName).toBe("Juan Pérez");
    });

    it("returns undefined when proposed slot is right after existing without overlap", () => {
      // 10:50 to 11:40
      const proposedStart = new Date(2026, 9, 14, 10, 50, 0);
      const conflict = findConflictingSlot(proposedStart, 50, [existingSlot]);
      expect(conflict).toBeUndefined();
    });

    it("ignores cancelled appointments", () => {
      const cancelledSlot = { ...existingSlot, status: "cancelled" as const };
      const proposedStart = new Date(2026, 9, 14, 10, 20, 0);
      const conflict = findConflictingSlot(proposedStart, 50, [cancelledSlot]);
      expect(conflict).toBeUndefined();
    });

    it("ignores appointments on other days", () => {
      const otherDay = new Date(2026, 9, 15, 10, 20, 0);
      const conflict = findConflictingSlot(otherDay, 50, [existingSlot]);
      expect(conflict).toBeUndefined();
    });

    it("ignores suspended appointments (e.g. suspended by vacation)", () => {
      const suspendedSlot = { ...existingSlot, isSuspended: true };
      const proposedStart = new Date(2026, 9, 14, 10, 30, 0);
      const conflict = findConflictingSlot(proposedStart, 50, [suspendedSlot]);
      expect(conflict).toBeUndefined();
    });
  });

  describe("Absence and Vacation Integration", () => {
    const absences = [
      {
        id: "abs-1",
        startDate: "2026-10-14",
        endDate: "2026-10-16",
        reason: "Vacaciones",
      },
    ];

    it("returns empty available slots if target date falls in an absence period", () => {
      const targetDate = new Date(2026, 9, 14); // Wednesday Oct 14
      const available = findAvailableSlots({
        targetDate,
        bookedSlots: [],
        absencePeriods: absences,
      });

      expect(available).toEqual([]);
    });

    it("tags recurring slots as isSuspended and sets absence if falling inside vacation period", () => {
      const weeklyRule: RecurrenceRule = {
        patientUuid: "p-1",
        rruleString: "DTSTART:20261001T000000Z\nRRULE:FREQ=WEEKLY;BYDAY=WE",
        startDate: "2026-10-01",
        startTime: "10:00",
        durationMinutes: 50,
      };

      const slots = computeAgendaSlots({
        intervalStart, // 2026-10-12 to 2026-10-18
        intervalEnd,
        recurrenceRules: [weeklyRule],
        dbSessions: [],
        patients: [mockPatient],
        absencePeriods: absences,
      });

      expect(slots).toHaveLength(1);
      expect(slots[0].isSuspended).toBe(true);
      expect(slots[0].absence?.reason).toBe("Vacaciones");
    });
  });

  describe("rescheduleSlot", () => {
    // Oct 14, 2026 is Wednesday
    const baseSlot: CalendarSlot = {
      uuid: "session-1",
      patientUuid: "p-1",
      patientName: "Juan Pérez",
      dateTime: new Date(2026, 9, 14, 16, 0, 0),
      durationMinutes: 50,
      status: "scheduled",
      price: 25000,
      isRecurrent: true,
    };

    const existingRule: RecurrenceRule = {
      patientUuid: "p-1",
      rruleString: "DTSTART:20261014T000000Z\nRRULE:FREQ=WEEKLY;BYDAY=WE",
      startDate: "2026-10-14",
      startTime: "16:00",
      durationMinutes: 50,
    };

    it("reschedules eventually, creating cancel exception and new session", () => {
      // Oct 15, 2026 is Thursday
      const newDateTime = new Date(2026, 9, 15, 10, 0, 0);

      const result = rescheduleSlot({
        slot: baseSlot,
        newDateTime,
        scope: "eventual",
      });

      expect(result.success).toBe(true);
      expect(result.cancelException).toBeDefined();
      expect(result.cancelException?.status).toBe("cancelled");
      expect(result.cancelException?.uuid).toBe("session-1"); // keep same uuid if provided

      expect(result.newSession).toBeDefined();
      expect(result.newSession?.status).toBe("scheduled");
      expect(result.newSession?.dateTime).toBe(newDateTime.toISOString());
      expect(result.newSession?.uuid).toBeDefined();
      expect(result.newSession?.uuid).not.toBe("session-1");
    });

    it("reschedules permanently, updating the RecurrenceRule with local time and day", () => {
      // Oct 16, 2026 is Friday
      const newDateTime = new Date(2026, 9, 16, 9, 0, 0);

      const result = rescheduleSlot({
        slot: baseSlot,
        newDateTime,
        scope: "permanent",
        existingRule,
      });

      expect(result.success).toBe(true);
      expect(result.updatedRule).toBeDefined();
      expect(result.updatedRule?.startTime).toBe("09:00");
      expect(result.updatedRule?.startDate).toBe("2026-10-16");
      expect(result.updatedRule?.rruleString).toContain("BYDAY=FR");
    });

    it("preserves other days in multi-day recurrence rules when rescheduling permanently", () => {
      const multiDayRule: RecurrenceRule = {
        patientUuid: "p-1",
        rruleString: "DTSTART:20261014T000000Z\nRRULE:FREQ=WEEKLY;BYDAY=WE,FR",
        startDate: "2026-10-14",
        startTime: "16:00",
        durationMinutes: 50,
      };

      // Move Wednesday slot to Monday (Oct 19, 2026) at 11:00
      const newDateTime = new Date(2026, 9, 19, 11, 0, 0);

      const result = rescheduleSlot({
        slot: baseSlot,
        newDateTime,
        scope: "permanent",
        existingRule: multiDayRule,
      });

      expect(result.success).toBe(true);
      expect(result.updatedRule?.startTime).toBe("11:00");
      expect(result.updatedRule?.startDate).toBe("2026-10-19");
      // Wednesday (WE) moved to Monday (MO), while Friday (FR) was preserved!
      expect(result.updatedRule?.rruleString).toContain("BYDAY=MO,FR");
    });

    it("fails permanent reschedule if no rule is provided", () => {
      const newDateTime = new Date(2026, 9, 16, 9, 0, 0);

      const result = rescheduleSlot({
        slot: baseSlot,
        newDateTime,
        scope: "permanent",
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe("missing_rule");
    });

    it("detects conflict and returns error", () => {
      const newDateTime = new Date(2026, 9, 15, 10, 0, 0);

      const bookedSlots: CalendarSlot[] = [
        {
          uuid: "session-2",
          patientUuid: "p-2",
          patientName: "Maria",
          dateTime: new Date(2026, 9, 15, 10, 30, 0), // Conflicts with 10:00 (duration 50)
          durationMinutes: 50,
          status: "scheduled",
          price: 25000,
          isRecurrent: false,
        },
      ];

      const result = rescheduleSlot({
        slot: baseSlot,
        newDateTime,
        scope: "eventual",
        bookedSlots,
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe("conflict");
    });
  });

  describe("swapSlots", () => {
    const slotA: CalendarSlot = {
      uuid: "session-a",
      patientUuid: "p-1",
      patientName: "Juan Pérez",
      dateTime: new Date(2026, 9, 14, 16, 0, 0), // Wednesday 16:00
      durationMinutes: 50,
      status: "scheduled",
      price: 25000,
      isRecurrent: true,
    };

    const slotB: CalendarSlot = {
      uuid: "session-b",
      patientUuid: "p-2",
      patientName: "Maria Paz",
      dateTime: new Date(2026, 9, 15, 10, 0, 0), // Thursday 10:00
      durationMinutes: 50,
      status: "scheduled",
      price: 25000,
      isRecurrent: true,
    };

    const ruleA: RecurrenceRule = {
      patientUuid: "p-1",
      rruleString: "DTSTART:20261014T000000Z\nRRULE:FREQ=WEEKLY;BYDAY=WE",
      startDate: "2026-10-14",
      startTime: "16:00",
      durationMinutes: 50,
    };

    const ruleB: RecurrenceRule = {
      patientUuid: "p-2",
      rruleString: "DTSTART:20261015T000000Z\nRRULE:FREQ=WEEKLY;BYDAY=TH",
      startDate: "2026-10-15",
      startTime: "10:00",
      durationMinutes: 50,
    };

    it("swaps eventually, creating 4 sessions (2 cancellations, 2 new)", () => {
      const result = swapSlots({
        slotA,
        slotB,
        scope: "eventual",
      });

      expect(result.success).toBe(true);
      expect(result.sessionsToSave).toHaveLength(4);

      const cancellations = result.sessionsToSave.filter((s) => s.status === "cancelled");
      const scheduled = result.sessionsToSave.filter((s) => s.status === "scheduled");

      expect(cancellations).toHaveLength(2);
      expect(scheduled).toHaveLength(2);

      // Check dates are swapped
      const newA = scheduled.find((s) => s.patientUuid === "p-1");
      const newB = scheduled.find((s) => s.patientUuid === "p-2");

      expect(newA?.dateTime).toBe(slotB.dateTime.toISOString());
      expect(newB?.dateTime).toBe(slotA.dateTime.toISOString());
    });

    it("swaps permanently, updating 2 RecurrenceRules", () => {
      const result = swapSlots({
        slotA,
        slotB,
        scope: "permanent",
        ruleA,
        ruleB,
      });

      expect(result.success).toBe(true);
      expect(result.rulesToSave).toHaveLength(2);

      const newRuleA = result.rulesToSave.find((r) => r.patientUuid === "p-1");
      const newRuleB = result.rulesToSave.find((r) => r.patientUuid === "p-2");

      expect(newRuleA?.startDate).toBe("2026-10-15"); // from B
      expect(newRuleA?.startTime).toBe("10:00"); // from B
      expect(newRuleA?.rruleString).toContain("BYDAY=TH");

      expect(newRuleB?.startDate).toBe("2026-10-14"); // from A
      expect(newRuleB?.startTime).toBe("16:00"); // from A
      expect(newRuleB?.rruleString).toContain("BYDAY=WE");
    });

    it("detects conflict with a third party slot", () => {
      const thirdSlot: CalendarSlot = {
        uuid: "session-c",
        patientUuid: "p-3",
        patientName: "Carlos",
        dateTime: new Date(2026, 9, 14, 16, 30, 0), // Conflicts with Maria at Juan's time
        durationMinutes: 50,
        status: "scheduled",
        price: 25000,
        isRecurrent: false,
      };

      const result = swapSlots({
        slotA,
        slotB,
        scope: "eventual",
        bookedSlots: [thirdSlot],
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe("conflict");
    });
  });

  describe("Session Modality (Presencial vs Virtual)", () => {
    const patient: Patient = {
      uuid: "p-online",
      fullName: "Online Patient",
      sessionPrice: 20000,
      createdAt: "",
      updatedAt: "",
    };

    it("assigns modality from recurrence rule and defaults to in_person when not specified", () => {
      const onlineRule: RecurrenceRule = {
        patientUuid: "p-online",
        rruleString: "DTSTART:20261014T000000Z\nRRULE:FREQ=WEEKLY;BYDAY=WE",
        startDate: "2026-10-14",
        startTime: "16:00",
        durationMinutes: 50,
        modality: "online",
      };

      const defaultRule: RecurrenceRule = {
        patientUuid: "p-online",
        rruleString: "DTSTART:20261016T000000Z\nRRULE:FREQ=WEEKLY;BYDAY=FR",
        startDate: "2026-10-16",
        startTime: "16:00",
        durationMinutes: 50,
      };

      const slots = computeAgendaSlots({
        intervalStart: new Date(2026, 9, 12),
        intervalEnd: new Date(2026, 9, 18),
        recurrenceRules: [onlineRule, defaultRule],
        dbSessions: [],
        patients: [patient],
      });

      const wednesdaySlot = slots.find((s) => s.dateTime.getDay() === 3);
      const fridaySlot = slots.find((s) => s.dateTime.getDay() === 5);

      expect(wednesdaySlot?.modality).toBe("online");
      expect(fridaySlot?.modality).toBe("in_person");
    });

    it("prioritizes dbSession override modality over recurrence rule modality", () => {
      const rule: RecurrenceRule = {
        patientUuid: "p-online",
        rruleString: "DTSTART:20261014T000000Z\nRRULE:FREQ=WEEKLY;BYDAY=WE",
        startDate: "2026-10-14",
        startTime: "16:00",
        durationMinutes: 50,
        modality: "in_person",
      };

      const sessionOverride: Session = {
        uuid: "sess-override",
        patientUuid: "p-online",
        dateTime: "2026-10-14T16:00:00.000Z",
        status: "scheduled",
        priceAtSession: 20000,
        modality: "online",
        createdAt: "",
        updatedAt: "",
      };

      const slots = computeAgendaSlots({
        intervalStart: new Date(2026, 9, 12),
        intervalEnd: new Date(2026, 9, 18),
        recurrenceRules: [rule],
        dbSessions: [sessionOverride],
        patients: [patient],
      });

      expect(slots[0].modality).toBe("online");
    });

    it("preserves modality when rescheduling eventually", () => {
      const slot: CalendarSlot = {
        uuid: "slot-online",
        patientUuid: "p-online",
        patientName: "Online Patient",
        dateTime: new Date(2026, 9, 14, 16, 0),
        durationMinutes: 50,
        status: "scheduled",
        price: 20000,
        modality: "online",
        isRecurrent: true,
      };

      const res = rescheduleSlot({
        slot,
        newDateTime: new Date(2026, 9, 15, 10, 0),
        scope: "eventual",
      });

      expect(res.success).toBe(true);
      expect(res.cancelException?.modality).toBe("online");
      expect(res.newSession?.modality).toBe("online");
    });
  });
});
