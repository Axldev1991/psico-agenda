import { IExtraNoteRepository } from '../../repositories/extra-note.repository';
import { ExtraNote } from '../../domain/extra-note.types';
import { db } from './dexie.db';

export class DexieExtraNoteRepository implements IExtraNoteRepository {
  async getAll(): Promise<ExtraNote[]> {
    return db.extraNotes.toArray();
  }

  async getByUuid(uuid: string): Promise<ExtraNote | undefined> {
    return db.extraNotes.get(uuid);
  }

  async getByPatient(patientUuid: string): Promise<ExtraNote[]> {
    return db.extraNotes.where('patientUuid').equals(patientUuid).toArray();
  }

  async save(note: ExtraNote): Promise<void> {
    await db.extraNotes.put(note);
  }

  async saveAll(notes: ExtraNote[]): Promise<void> {
    if (notes.length === 0) return;
    await db.extraNotes.bulkPut(notes);
  }

  async delete(uuid: string): Promise<void> {
    await db.extraNotes.delete(uuid);
  }

  async deleteByPatient(patientUuid: string): Promise<void> {
    await db.extraNotes.where('patientUuid').equals(patientUuid).delete();
  }
}
