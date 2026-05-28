import Dexie, { Table } from 'dexie';
import { Patient } from '../../domain/patient.types';

export class PsicoAgendaDatabase extends Dexie {
  patients!: Table<Patient>;

  constructor() {
    super('PsicoAgendaDB');
    this.version(1).stores({
      patients: 'uuid, fullName, createdAt'
    });
  }
}

export const db = new PsicoAgendaDatabase();
