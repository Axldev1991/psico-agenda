import { describe, it, expect } from "vitest";
import { computeAgendaSlots, buildRRuleString, findAvailableSlots } from "./agenda.service";
import { RecurrenceRule, Session } from "./session.types";
import { Patient } from "./patient.types";
import { Holiday } from "./holidays";
import { AvailableSlot } from "./agenda.types";

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

    it("generates monthly RRule string", () => {
      const result = buildRRuleString({
        cadence: "monthly",
        daysOfWeek: [4], // Friday
        startDate: "2026-10-01",
      });
      expect(result).toBe("DTSTART:20261001T000000Z\nRRULE:FREQ=MONTHLY;BYDAY=FR");
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
  });
});
