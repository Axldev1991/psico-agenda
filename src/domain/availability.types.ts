export interface TimeRange {
  start: string; // "HH:mm" (e.g. "09:00")
  end: string;   // "HH:mm" (e.g. "13:00")
}

export interface DaySchedule {
  enabled: boolean;
  ranges: TimeRange[];
}

// Keyed by day of week: 0 = Sunday, 1 = Monday, ..., 6 = Saturday
export type WeeklyAvailability = Record<number, DaySchedule>;

export interface AvailabilitySettings {
  weekly: WeeklyAvailability;
  defaultSessionDurationMinutes: number; // e.g. 50
  intervalStepMinutes: number;           // e.g. 60
}
