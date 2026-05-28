import { IPatientRepository } from '../../repositories/patient.repository';
import { Patient } from '../../domain/patient.types';
import { db } from './dexie.db';

export class DexiePatientRepository implements IPatientRepository {
  async getAll(): Promise<Patient[]> {
    return db.patients.toArray();
  }

  async getByUuid(uuid: string): Promise<Patient | undefined> {
    return db.patients.get(uuid);
  }

  async save(patient: Patient): Promise<void> {
    await db.patients.put(patient);
  }

  async delete(uuid: string): Promise<void> {
    await db.patients.delete(uuid);
  }
}
