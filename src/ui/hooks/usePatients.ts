import { useLiveQuery } from 'dexie-react-hooks';
import { Patient } from '../../domain/patient.types';
import { container } from '../../infrastructure/container';

const repository = container.getPatientRepository();

export function usePatients() {
  // useLiveQuery es un React Hook provisto por Dexie que automáticamente
  // escucha cambios en IndexedDB y re-renderiza el componente con los datos más actualizados.
  // ¡Esto nos da reactividad en tiempo real sin necesidad de un state manager complejo!
  const rawPatients = useLiveQuery(() => repository.getAll());
  const loading = rawPatients === undefined;
  const patients = (rawPatients || []).filter(p => !p.deletedAt);

  const addPatient = async (patientData: Omit<Patient, 'uuid' | 'createdAt' | 'updatedAt'>) => {
    const newPatient: Patient = {
      ...patientData,
      uuid: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isHistoryLoaded: true,
    };
    await repository.save(newPatient);
  };

  const removePatient = async (uuid: string) => {
    const existing = await repository.getByUuid(uuid);
    if (!existing) return;
    const now = new Date().toISOString();
    const updated: Patient = {
      ...existing,
      deletedAt: now,
      updatedAt: now,
    };
    await repository.save(updated);

    // Cascading soft-delete to sessions and extra notes, and delete recurrence rule
    const sessionRepo = container.getSessionRepository();
    const extraNoteRepo = container.getExtraNoteRepository();

    const patientSessions = await sessionRepo.getByPatient(uuid);
    if (patientSessions.length > 0) {
      const softDeletedSessions = patientSessions.map(s => ({
        ...s,
        deletedAt: s.deletedAt || now,
        updatedAt: now,
      }));
      await sessionRepo.saveAll(softDeletedSessions);
    }
    await sessionRepo.deleteRecurrenceRule(uuid);

    const patientNotes = await extraNoteRepo.getByPatient(uuid);
    if (patientNotes.length > 0) {
      const softDeletedNotes = patientNotes.map(n => ({
        ...n,
        deletedAt: n.deletedAt || now,
        updatedAt: now,
      }));
      await extraNoteRepo.saveAll(softDeletedNotes);
    }
  };

  const updatePatient = async (
    uuid: string,
    patientData: Omit<Patient, "uuid" | "createdAt" | "updatedAt">
  ) => {
    const existing = await repository.getByUuid(uuid);
    if (!existing) return;
    const updated: Patient = {
      ...existing,
      ...patientData,
      updatedAt: new Date().toISOString(),
    };
    await repository.save(updated);
  };

  return {
    patients,
    loading,
    addPatient,
    removePatient,
    updatePatient,
  };
}
