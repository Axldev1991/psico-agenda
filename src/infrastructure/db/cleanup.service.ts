import { db } from './dexie.db';

export const MODEL_PATIENT_UUIDS = ['patient-axel-pasado', 'patient-axel-futuro'] as const;

/**
 * Purges demo/model patients and all associated clinical entities from IndexedDB.
 * Ensures model artifacts never leak into a therapist's production practice.
 */
export async function purgeAxelModelPatients(): Promise<boolean> {
  let purgedAny = false;

  try {
    await db.transaction(
      'rw',
      [db.patients, db.sessions, db.recurrenceRules, db.extraNotes],
      async () => {
        for (const uuid of MODEL_PATIENT_UUIDS) {
          const patient = await db.patients.get(uuid);
          if (patient) {
            purgedAny = true;
            await db.patients.delete(uuid);
          }

          const sessionCount = await db.sessions.where('patientUuid').equals(uuid).count();
          if (sessionCount > 0) {
            purgedAny = true;
            await db.sessions.where('patientUuid').equals(uuid).delete();
          }

          const rule = await db.recurrenceRules.get(uuid);
          if (rule) {
            purgedAny = true;
            await db.recurrenceRules.delete(uuid);
          }

          const noteCount = await db.extraNotes.where('patientUuid').equals(uuid).count();
          if (noteCount > 0) {
            purgedAny = true;
            await db.extraNotes.where('patientUuid').equals(uuid).delete();
          }
        }
      }
    );
  } catch (err) {
    console.warn('Falla en saneamiento de pacientes modelo:', err);
  }

  return purgedAny;
}

