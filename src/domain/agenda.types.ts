import { Session, RecurrenceRule } from "./session.types";
import { Patient } from "./patient.types";
import { Holiday } from "./holidays";
import { WeeklyAvailability, AbsencePeriod } from "./availability.types";

export interface CalendarSlot {
  uuid?: string; // Present if already persisted as a physical Session in DB
  patientUuid: string;
  patientName: string;
  dateTime: Date;
  durationMinutes: number;
  status: 'scheduled' | 'completed' | 'cancelled' | 'missed';
  price: number;
  notes?: string;
  isRecurrent: boolean;
  holiday?: Holiday;
  isSuspended?: boolean;
  absence?: AbsencePeriod;
}

export interface ComputeAgendaSlotsParams {
  intervalStart: Date;
  intervalEnd: Date;
  recurrenceRules: RecurrenceRule[];
  dbSessions: Session[];
  patients: Patient[];
  holidays?: Holiday[];
  absencePeriods?: AbsencePeriod[];
}

export type RecurrenceCadence = 'weekly' | 'biweekly' | 'monthly';

export interface BuildRRuleOptions {
  cadence: RecurrenceCadence;
  daysOfWeek: number[]; // 0 = MO, 1 = TU, 2 = WE, 3 = TH, 4 = FR, 5 = SA, 6 = SU
  startDate?: string;   // YYYY-MM-DD
}

export interface AvailableSlot {
  time: string;           // "16:00"
  dateTime: Date;
  formattedTime: string;  // "16:00 hs"
}

export interface FindAvailableSlotsParams {
  targetDate: Date;
  bookedSlots: CalendarSlot[];
  startHour?: number;          // Default 8 (08:00)
  endHour?: number;            // Default 20 (20:00)
  slotDurationMinutes?: number;// Default 50
  intervalStepMinutes?: number;// Default 60
  weeklyAvailability?: WeeklyAvailability;
  absencePeriods?: AbsencePeriod[];
}

export type RescheduleScope = 'eventual' | 'permanent';

export interface RescheduleSlotParams {
  slot: CalendarSlot;
  newDateTime: Date;
  scope: RescheduleScope;
  existingRule?: RecurrenceRule;
  bookedSlots?: CalendarSlot[];
}

export interface RescheduleResult {
  success: boolean;
  error?: 'conflict' | 'missing_rule';
  cancelException?: Session;
  newSession?: Session;
  updatedRule?: RecurrenceRule;
}

export interface SwapSlotsParams {
  slotA: CalendarSlot;
  slotB: CalendarSlot;
  scope: RescheduleScope;
  ruleA?: RecurrenceRule;
  ruleB?: RecurrenceRule;
  bookedSlots?: CalendarSlot[];
}

export interface SwapResult {
  success: boolean;
  error?: 'conflict';
  sessionsToSave: Session[];
  rulesToSave: RecurrenceRule[];
}

