import { describe, it, expect } from "vitest";
import { computeAgendaSlots } from "./agenda.service";
import { RecurrenceRule, Session } from "./session.types";
import { Patient } from "./patient.types";
import { Holiday } from "./holidays";

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
});
