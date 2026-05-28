import { useLiveQuery } from 'dexie-react-hooks';
import { Patient } from '../../domain/patient.types';
import { DexiePatientRepository } from '../../infrastructure/db/dexie-patient.repository';

const repository = new DexiePatientRepository();

export function usePatients() {
  // useLiveQuery es un React Hook provisto por Dexie que automáticamente
  // escucha cambios en IndexedDB y re-renderiza el componente con los datos más actualizados.
  // ¡Esto nos da reactividad en tiempo real sin necesidad de un state manager complejo!
  const rawPatients = useLiveQuery(() => repository.getAll());
  const loading = rawPatients === undefined;
  const patients = rawPatients || [];

  const addPatient = async (patientData: Omit<Patient, 'uuid' | 'createdAt' | 'updatedAt'>) => {
    const newPatient: Patient = {
      ...patientData,
      uuid: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    await repository.save(newPatient);
  };

  const removePatient = async (uuid: string) => {
    await repository.delete(uuid);
  };

  return {
    patients,
    loading,
    addPatient,
    removePatient,
  };
}
