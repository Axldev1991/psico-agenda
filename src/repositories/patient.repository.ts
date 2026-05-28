import { Patient } from '../domain/patient.types';

export interface IPatientRepository {
  getAll(): Promise<Patient[]>;
  getByUuid(uuid: string): Promise<Patient | undefined>;
  save(patient: Patient): Promise<void>;
  delete(uuid: string): Promise<void>;
}
