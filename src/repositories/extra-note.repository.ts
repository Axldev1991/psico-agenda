import { ExtraNote } from '../domain/extra-note.types';

export interface IExtraNoteRepository {
  getAll(): Promise<ExtraNote[]>;
  getByUuid(uuid: string): Promise<ExtraNote | undefined>;
  getByPatient(patientUuid: string): Promise<ExtraNote[]>;
  save(note: ExtraNote): Promise<void>;
  saveAll(notes: ExtraNote[]): Promise<void>;
  delete(uuid: string): Promise<void>;
  deleteByPatient(patientUuid: string): Promise<void>;
}
