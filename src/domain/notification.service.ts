import { format, isSameDay } from 'date-fns';
import { CalendarSlot } from './agenda.types';
import { AppNotification, NotificationSeverity } from './notification.types';

export interface ComputeNotificationParams {
  now: Date;
  slots: CalendarSlot[];
  dismissedIds?: string[];
}

const SEVERITY_WEIGHT: Record<NotificationSeverity, number> = {
  urgent: 3,
  warning: 2,
  info: 1,
};

/**
 * Computes active clinical notifications based on current time and agenda slots.
 * Pure function adhering to Clean Architecture.
 */
export function computeNotifications(params: ComputeNotificationParams): AppNotification[] {
  const { now, slots, dismissedIds = [] } = params;
  if (!now || isNaN(now.getTime()) || !slots || slots.length === 0) {
    return [];
  }

  const dismissedSet = new Set(dismissedIds);
  const notifications: AppNotification[] = [];
  const nowMs = now.getTime();

  // Filter slots for today that are not cancelled
  const todaySlots = slots
    .filter((s) => isSameDay(s.dateTime, now) && s.status !== 'cancelled')
    .sort((a, b) => a.dateTime.getTime() - b.dateTime.getTime());

  // 1. Daily Summary (if there are active sessions scheduled for today)
  const activeTodaySlots = todaySlots.filter((s) => !s.isSuspended);
  if (activeTodaySlots.length > 0) {
    const todayStr = format(now, 'yyyy-MM-dd');
    const summaryId = `notif_summary_${todayStr}`;

    if (!dismissedSet.has(summaryId)) {
      const count = activeTodaySlots.length;
      const first = activeTodaySlots[0];
      const firstTime = format(first.dateTime, 'HH:mm');

      notifications.push({
        id: summaryId,
        type: 'daily_summary',
        severity: 'info',
        title: `Agenda de hoy: ${count} ${count === 1 ? 'consulta' : 'consultas'}`,
        message: `Primer turno a las ${firstTime} hs con ${first.patientName}.`,
        timestamp: now.toISOString(),
      });
    }
  }

  // 2. Imminent Session Alerts (within next 15 minutes) and Recess Warnings
  todaySlots.forEach((slot) => {
    const slotTime = slot.dateTime.getTime();
    const diffMinutes = (slotTime - nowMs) / (60 * 1000);
    const timeFormatted = format(slot.dateTime, 'HH:mm');
    const dateFormatted = format(slot.dateTime, 'yyyy-MM-dd');

    // Imminent alert: between now and +15 minutes for active scheduled appointments
    if (slot.status === 'scheduled' && !slot.isSuspended && diffMinutes > 0 && diffMinutes <= 15) {
      const imminentId = `notif_imminent_${slot.patientUuid}_${dateFormatted}_${timeFormatted}`;
      if (!dismissedSet.has(imminentId)) {
        const roundedMin = Math.ceil(diffMinutes);
        notifications.push({
          id: imminentId,
          type: 'imminent_session',
          severity: 'urgent',
          title: `Sesión en ${roundedMin} min`,
          message: `Con ${slot.patientName} a las ${timeFormatted} hs.`,
          timestamp: slot.dateTime.toISOString(),
          sessionUuid: slot.uuid,
          patientUuid: slot.patientUuid,
          patientName: slot.patientName,
          sessionTime: timeFormatted,
        });
      }
    }

    // Recess warning: scheduled appointment falling on an absence / vacation day
    if (slot.status === 'scheduled' && (slot.isSuspended || slot.absence)) {
      const recessId = `notif_recess_${slot.patientUuid}_${dateFormatted}_${timeFormatted}`;
      if (!dismissedSet.has(recessId)) {
        notifications.push({
          id: recessId,
          type: 'recess_warning',
          severity: 'warning',
          title: 'Turno en período de receso',
          message: `Atención con ${slot.patientName} (${timeFormatted} hs) programada en ${
            slot.absence?.reason || 'receso vacacional'
          }.`,
          timestamp: slot.dateTime.toISOString(),
          sessionUuid: slot.uuid,
          patientUuid: slot.patientUuid,
          patientName: slot.patientName,
          sessionTime: timeFormatted,
        });
      }
    }
  });

  // Sort by severity (urgent > warning > info) then by timestamp
  return notifications.sort((a, b) => {
    const severityDiff = SEVERITY_WEIGHT[b.severity] - SEVERITY_WEIGHT[a.severity];
    if (severityDiff !== 0) return severityDiff;
    return new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime();
  });
}

/**
 * Returns a new dismissed IDs array appending the dismissed ID immutably.
 */
export function dismissNotification(dismissedIds: string[], idToDismiss: string): string[] {
  if (!idToDismiss || dismissedIds.includes(idToDismiss)) {
    return dismissedIds;
  }
  return [...dismissedIds, idToDismiss];
}
