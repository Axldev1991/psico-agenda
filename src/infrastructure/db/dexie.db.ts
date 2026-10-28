import Dexie, { Table } from 'dexie';
import { Patient } from '../../domain/patient.types';
import { Session, RecurrenceRule, MovementConfig, PunctuationConfig } from '../../domain/session.types';


export class PsicoAgendaDatabase extends Dexie {
  patients!: Table<Patient>;
  sessions!: Table<Session>;
  recurrenceRules!: Table<RecurrenceRule>;
  movementConfigs!: Table<MovementConfig>;
  punctuationConfigs!: Table<PunctuationConfig>;
  appSettings!: Table<{ key: string; value: any }>;

  constructor() {
    super('PsicoAgendaDB');
    
    // Versión 1 (Hito 1)
    this.version(1).stores({
      patients: 'uuid, fullName, createdAt'
    });

    // Versión 2 (Hito 2): Incorporamos soporte para sesiones y reglas de turnos
    this.version(2).stores({
      patients: 'uuid, fullName, createdAt',
      sessions: 'uuid, patientUuid, dateTime, status',
      recurrenceRules: 'patientUuid' // patientUuid es la clave primaria aquí
    });

    // Versión 3 (Caché Inteligente e Historiales Archivados)
    this.version(3).stores({
      patients: 'uuid, fullName, createdAt, status, isHistoryLoaded',
      sessions: 'uuid, patientUuid, dateTime, status',
      recurrenceRules: 'patientUuid'
    });

    // Versión 4: Detección y clasificación de tipo de paciente y edad
    this.version(4).stores({
      patients: 'uuid, fullName, createdAt, status, isHistoryLoaded, type',
      sessions: 'uuid, patientUuid, dateTime, status',
      recurrenceRules: 'patientUuid'
    });

    // Versión 5: Personalización de movimientos (Categorías)
    this.version(5).stores({
      patients: 'uuid, fullName, createdAt, status, isHistoryLoaded, type',
      sessions: 'uuid, patientUuid, dateTime, status',
      recurrenceRules: 'patientUuid',
      movementConfigs: 'key'
    });

    // Versión 6: Personalización de puntuaciones (Resaltados del editor)
    this.version(6).stores({
      patients: 'uuid, fullName, createdAt, status, isHistoryLoaded, type',
      sessions: 'uuid, patientUuid, dateTime, status',
      recurrenceRules: 'patientUuid',
      movementConfigs: 'key',
      punctuationConfigs: 'key'
    });

    // Versión 7: Persistencia de disponibilidad, duración y recesos/vacaciones
    this.version(7).stores({
      patients: 'uuid, fullName, createdAt, status, isHistoryLoaded, type',
      sessions: 'uuid, patientUuid, dateTime, status',
      recurrenceRules: 'patientUuid',
      movementConfigs: 'key',
      punctuationConfigs: 'key',
      appSettings: 'key'
    });
  }
}

export const db = new PsicoAgendaDatabase();
