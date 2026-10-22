import { CalendarSlot } from "./agenda.types";
import { isSameMonth } from "date-fns";

export interface MonthlyBillingSummary {
  projectedTotal: number;
  collectedTotal: number;
  unrealizedTotal: number;
  sessionCount: number;
}

export function computeMonthlyBilling(slots: CalendarSlot[], targetMonth: Date): MonthlyBillingSummary {
  const summary: MonthlyBillingSummary = {
    projectedTotal: 0,
    collectedTotal: 0,
    unrealizedTotal: 0,
    sessionCount: 0,
  };

  for (const slot of slots) {
    if (isSameMonth(slot.dateTime, targetMonth)) {
      // Exclude virtual scheduled slots that coincide with holidays
      if (slot.status === 'scheduled' && slot.holiday) {
        continue;
      }

      const price = slot.price || 0;
      summary.projectedTotal += price;
      summary.sessionCount += 1;

      if (slot.status === 'completed') {
        summary.collectedTotal += price;
      } else if (slot.status === 'cancelled' || slot.status === 'missed') {
        summary.unrealizedTotal += price;
      }
    }
  }

  return summary;
}
