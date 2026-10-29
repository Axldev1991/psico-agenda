import { computeMonthlyBilling } from "./billing.service";
import { CalendarSlot } from "./agenda.types";
import { describe, it, expect } from "vitest";

describe("Billing Service", () => {
  const targetMonth = new Date("2023-10-15T00:00:00Z");

  const createSlot = (
    status: CalendarSlot['status'],
    price: number,
    dateStr: string,
    paymentStatus: CalendarSlot['paymentStatus'] = 'paid',
    paymentMethod?: CalendarSlot['paymentMethod']
  ): CalendarSlot => ({
    patientUuid: "p-1",
    patientName: "John",
    dateTime: new Date(dateStr),
    durationMinutes: 50,
    status,
    price,
    paymentStatus,
    paymentMethod,
    isRecurrent: false,
  });

  it("computes all zeroes for empty slots", () => {
    const summary = computeMonthlyBilling([], targetMonth);
    expect(summary.projectedTotal).toBe(0);
    expect(summary.collectedTotal).toBe(0);
    expect(summary.pendingTotal).toBe(0);
    expect(summary.unrealizedTotal).toBe(0);
    expect(summary.sessionCount).toBe(0);
  });

  it("computes projected, collected, and unrealized correctly for mixed slots in the target month", () => {
    const slots = [
      createSlot("completed", 100, "2023-10-01T10:00:00Z", "paid", "transfer"),
      createSlot("cancelled", 50, "2023-10-05T10:00:00Z"),
      createSlot("missed", 50, "2023-10-10T10:00:00Z"),
      createSlot("scheduled", 200, "2023-10-20T10:00:00Z"),
      createSlot("completed", 100, "2023-11-01T10:00:00Z"), // Different month
    ];

    const summary = computeMonthlyBilling(slots, targetMonth);
    
    expect(summary.sessionCount).toBe(4);
    expect(summary.projectedTotal).toBe(400); // 100 + 50 + 50 + 200
    expect(summary.collectedTotal).toBe(100);
    expect(summary.unrealizedTotal).toBe(100); // 50 (cancelled) + 50 (missed)
    expect(summary.byMethod?.transfer).toBe(100);
  });

  it("separates collected vs pending when sessions are completed but not paid", () => {
    const slots = [
      createSlot("completed", 120, "2023-10-01T10:00:00Z", "paid", "cash"),
      createSlot("completed", 80, "2023-10-02T10:00:00Z", "pending"),
    ];

    const summary = computeMonthlyBilling(slots, targetMonth);

    expect(summary.sessionCount).toBe(2);
    expect(summary.projectedTotal).toBe(200);
    expect(summary.collectedTotal).toBe(120);
    expect(summary.pendingTotal).toBe(80);
    expect(summary.byMethod?.cash).toBe(120);
  });

  it("handles slots without a price gracefully", () => {
    const slots = [
      createSlot("completed", undefined as unknown as number, "2023-10-01T10:00:00Z"), // testing edge case when price might be falsy
      createSlot("scheduled", null as unknown as number, "2023-10-05T10:00:00Z"),
    ];

    const summary = computeMonthlyBilling(slots, targetMonth);
    
    expect(summary.sessionCount).toBe(2);
    expect(summary.projectedTotal).toBe(0);
    expect(summary.collectedTotal).toBe(0);
    expect(summary.unrealizedTotal).toBe(0);
  });

  it("excludes scheduled slots on holidays, but includes completed sessions on holidays", () => {
    const holidaySlotScheduled: CalendarSlot = {
      ...createSlot("scheduled", 150, "2023-10-12T10:00:00Z"),
      holiday: { date: "2023-10-12", name: "Día del Respeto a la Diversidad Cultural" },
    };

    const holidaySlotCompleted: CalendarSlot = {
      ...createSlot("completed", 150, "2023-10-16T10:00:00Z"),
      holiday: { date: "2023-10-16", name: "Feriado con fines turísticos" },
    };

    const normalSlot: CalendarSlot = createSlot("scheduled", 200, "2023-10-20T10:00:00Z");

    const summary = computeMonthlyBilling([holidaySlotScheduled, holidaySlotCompleted, normalSlot], targetMonth);

    // holidaySlotScheduled is excluded, so sessionCount = 2 (completed on holiday + normal scheduled)
    expect(summary.sessionCount).toBe(2);
    expect(summary.projectedTotal).toBe(350); // 150 + 200
    expect(summary.collectedTotal).toBe(150); // 150 from completed
    expect(summary.unrealizedTotal).toBe(0);
  });

  it("excludes scheduled slots suspended by therapist vacation or absence from projected revenue", () => {
    const suspendedVacationSlot: CalendarSlot = {
      ...createSlot("scheduled", 300, "2023-10-18T15:00:00Z"),
      isSuspended: true,
      absence: {
        id: "abs-1",
        startDate: "2023-10-15",
        endDate: "2023-10-22",
        reason: "Vacaciones",
      },
    };

    const regularSlot: CalendarSlot = createSlot("scheduled", 200, "2023-10-05T10:00:00Z");

    const summary = computeMonthlyBilling([suspendedVacationSlot, regularSlot], targetMonth);

    expect(summary.sessionCount).toBe(1);
    expect(summary.projectedTotal).toBe(200); // 300 from suspendedVacationSlot is excluded
    expect(summary.collectedTotal).toBe(0);
  });
});
