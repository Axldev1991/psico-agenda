import { useLiveQuery } from 'dexie-react-hooks';
import { useState } from 'react';
import { DexieSessionRepository } from '../../infrastructure/db/dexie-session.repository';
import { Session } from '../../domain/session.types';

const repository = new DexieSessionRepository();

export function usePatientHistory(patientUuid: string) {
  const [searchTerm, setSearchTerm] = useState('');

  // Carga reactiva de las sesiones físicas del paciente guardadas en IndexedDB
  const dbSessions = useLiveQuery(
    () => repository.getByPatient(patientUuid),
    [patientUuid]
  );

  const loading = dbSessions === undefined;
  const sessions = dbSessions || [];

  // Filtrado reactivo por texto clínico en las notas
  const filteredSessions = sessions.filter((s) => {
    if (!searchTerm) return true;
    const content = s.notes || '';
    const dateFormatted = new Date(s.dateTime).toLocaleDateString('es-AR');
    return (
      content.toLowerCase().includes(searchTerm.toLowerCase()) ||
      dateFormatted.includes(searchTerm)
    );
  }).sort((a, b) => new Date(b.dateTime).getTime() - new Date(a.dateTime).getTime()); // Más recientes primero para el diario clínico

  // Guardar o actualizar la evolución clínica
  const saveNotes = async (
    sessionData: {
      uuid?: string;
      dateTime: string;
      status: Session['status'];
      priceAtSession: number;
    },
    notes: string
  ) => {
    if (sessionData.uuid) {
      // Modificar existente
      const existing = await repository.getByUuid(sessionData.uuid);
      if (existing) {
        existing.notes = notes;
        existing.updatedAt = new Date().toISOString();
        await repository.save(existing);
      }
    } else {
      // Crear nueva sesión física (por ejemplo, al escribir nota sobre un slot recurrente virtual)
      const newSession: Session = {
        uuid: crypto.randomUUID(),
        patientUuid,
        dateTime: sessionData.dateTime,
        status: sessionData.status,
        priceAtSession: sessionData.priceAtSession,
        notes,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      await repository.save(newSession);
    }
  };

  return {
    sessions: filteredSessions,
    allSessionsCount: sessions.length,
    loading,
    searchTerm,
    setSearchTerm,
    saveNotes,
  };
}
