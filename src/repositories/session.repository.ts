import { Session, RecurrenceRule } from '../domain/session.types';

export interface ISessionRepository {
  getAll(): Promise<Session[]>;
  getByUuid(uuid: string): Promise<Session | undefined>;
  save(session: Session): Promise<void>;
  saveAll(sessions: Session[]): Promise<void>;
  delete(uuid: string): Promise<void>;
  
  // Métodos específicos para reglas de recurrencia
  getRecurrenceRules(): Promise<RecurrenceRule[]>;
  getRecurrenceRuleByPatient(patientUuid: string): Promise<RecurrenceRule | undefined>;
  saveRecurrenceRule(rule: RecurrenceRule): Promise<void>;
  saveAllRecurrenceRules(rules: RecurrenceRule[]): Promise<void>;
  deleteRecurrenceRule(patientUuid: string): Promise<void>;
}
