import { ISessionRepository } from '../../repositories/session.repository';
import { Session, RecurrenceRule } from '../../domain/session.types';
import { db } from './dexie.db';

export class DexieSessionRepository implements ISessionRepository {
  // --- Métodos de Sesiones ---
  async getAll(): Promise<Session[]> {
    return db.sessions.toArray();
  }

  async getByUuid(uuid: string): Promise<Session | undefined> {
    return db.sessions.get(uuid);
  }

  async getByPatient(patientUuid: string): Promise<Session[]> {
    return db.sessions.where('patientUuid').equals(patientUuid).sortBy('dateTime');
  }

  async save(session: Session): Promise<void> {
    await db.sessions.put(session);
  }

  async saveAll(sessions: Session[]): Promise<void> {
    if (sessions.length === 0) return;
    await db.sessions.bulkPut(sessions);
  }

  async delete(uuid: string): Promise<void> {
    await db.sessions.delete(uuid);
  }

  async deleteByPatient(patientUuid: string): Promise<void> {
    await db.sessions.where('patientUuid').equals(patientUuid).delete();
  }

  // --- Métodos de Reglas de Recurrencia ---
  async getRecurrenceRules(): Promise<RecurrenceRule[]> {
    return db.recurrenceRules.toArray();
  }

  async getRecurrenceRuleByPatient(patientUuid: string): Promise<RecurrenceRule | undefined> {
    return db.recurrenceRules.get(patientUuid);
  }

  async saveRecurrenceRule(rule: RecurrenceRule): Promise<void> {
    await db.recurrenceRules.put(rule);
  }

  async saveAllRecurrenceRules(rules: RecurrenceRule[]): Promise<void> {
    if (rules.length === 0) return;
    await db.recurrenceRules.bulkPut(rules);
  }

  async deleteRecurrenceRule(patientUuid: string): Promise<void> {
    await db.recurrenceRules.delete(patientUuid);
  }
}
