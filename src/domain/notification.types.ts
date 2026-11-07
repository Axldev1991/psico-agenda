export type NotificationType = 'imminent_session' | 'daily_summary' | 'recess_warning' | 'rescheduled_session' | 'pending_evolution';

export type NotificationSeverity = 'info' | 'warning' | 'urgent';

export interface AppNotification {
  id: string;
  type: NotificationType;
  severity: NotificationSeverity;
  title: string;
  message: string;
  timestamp: string; // ISO string
  sessionUuid?: string;
  patientUuid?: string;
  patientName?: string;
  sessionTime?: string; // "HH:mm"
}
