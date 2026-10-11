import { Session, RecurrenceRule } from "./session.types";
import { Patient } from "./patient.types";
import { Holiday } from "./holidays";

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
}

export interface ComputeAgendaSlotsParams {
  intervalStart: Date;
  intervalEnd: Date;
  recurrenceRules: RecurrenceRule[];
  dbSessions: Session[];
  patients: Patient[];
  holidays?: Holiday[];
}
