import { CalendarSlot } from "./agenda.types";
import { isSameMonth } from "date-fns";

export interface MonthlyBillingSummary {
  projectedTotal: number;
  collectedTotal: number;
  pendingTotal: number;
  unrealizedTotal: number;
  sessionCount: number;
  byMethod?: {
    cash: number;
    transfer: number;
    mercadopago: number;
  };
}

export function computeMonthlyBilling(slots: CalendarSlot[], targetMonth: Date): MonthlyBillingSummary {
  const summary: MonthlyBillingSummary = {
    projectedTotal: 0,
    collectedTotal: 0,
    pendingTotal: 0,
    unrealizedTotal: 0,
    sessionCount: 0,
    byMethod: {
      cash: 0,
      transfer: 0,
      mercadopago: 0,
    },
  };

  for (const slot of slots) {
    if (isSameMonth(slot.dateTime, targetMonth)) {
      // Exclude slots that are suspended by vacation/absence or coincide with holidays
      if (slot.isSuspended || (slot.status === 'scheduled' && (slot.holiday || slot.absence))) {
        continue;
      }

      const price = slot.price || 0;
      summary.projectedTotal += price;
      summary.sessionCount += 1;

      if (slot.status === 'completed') {
        if (slot.paymentStatus === 'paid') {
          summary.collectedTotal += price;
          if (slot.paymentMethod && summary.byMethod) {
            summary.byMethod[slot.paymentMethod] = (summary.byMethod[slot.paymentMethod] || 0) + price;
          }
        } else {
          summary.pendingTotal += price;
        }
      } else if (slot.status === 'cancelled' || slot.status === 'missed') {
        summary.unrealizedTotal += price;
      }
    }
  }

  return summary;
}
