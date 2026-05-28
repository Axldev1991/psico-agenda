"use client";

import { useState, useEffect } from "react";
import { GoogleDriveRepository } from "../../infrastructure/drive/google-drive.repository";
import { DexiePatientRepository } from "../../infrastructure/db/dexie-patient.repository";
import { DexieSessionRepository } from "../../infrastructure/db/dexie-session.repository";
import { Patient } from "../../domain/patient.types";
import { Session, RecurrenceRule } from "../../domain/session.types";

const driveRepo = new GoogleDriveRepository();
const patientRepo = new DexiePatientRepository();
const sessionRepo = new DexieSessionRepository();

interface BackupData {
  patients: Patient[];
  sessions: Session[];
  recurrenceRules: RecurrenceRule[];
  exportedAt: string;
}

export function useGoogleDrive() {
  const [googleToken, setGoogleToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [syncStatus, setSyncStatus] = useState<"idle" | "syncing" | "synced" | "error">("idle");
  const [lastSynced, setLastSynced] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Leer estado de la sesión local inicial al montar el hook
  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedSync = localStorage.getItem("gd-last-synced");
      if (savedSync) setLastSynced(savedSync);

      const cachedToken = sessionStorage.getItem("gd-access-token");
      if (cachedToken) {
        setGoogleToken(cachedToken);
        // Inyectar el token en la instancia del repositorio
        (driveRepo as any).accessToken = cachedToken;
      }
    }
  }, []);

  const connectGoogle = async () => {
    setLoading(true);
    setErrorMessage(null);
    try {
      const token = await driveRepo.login();
      setGoogleToken(token);
      sessionStorage.setItem("gd-access-token", token);
      setSyncStatus("idle");
    } catch (err: any) {
      console.error(err);
      setErrorMessage("No se pudo conectar con Google Drive: " + err.message);
      setSyncStatus("error");
    } finally {
      setLoading(false);
    }
  };

  const disconnectGoogle = () => {
    driveRepo.logout();
    setGoogleToken(null);
    sessionStorage.removeItem("gd-access-token");
    setSyncStatus("idle");
  };

  /**
   * Algoritmo de Fusión Local de Dos Vías (Two-Way Last-Write-Wins Merge)
   */
  const performSync = async () => {
    if (!googleToken) return;
    setLoading(true);
    setSyncStatus("syncing");
    setErrorMessage(null);

    try {
      // 1. Obtener Datos Locales
      const localPatients = await patientRepo.getAll();
      const localSessions = await sessionRepo.getAll();
      const localRecurrence = await sessionRepo.getRecurrenceRules();

      // 2. Descargar Datos de la Nube (si existen)
      const remoteBackupStr = await driveRepo.downloadBackup();
      
      let mergedPatients: Patient[] = [...localPatients];
      let mergedSessions: Session[] = [...localSessions];
      let mergedRecurrence: RecurrenceRule[] = [...localRecurrence];

      if (remoteBackupStr) {
        const remoteData: BackupData = JSON.parse(remoteBackupStr);

        // A. Fusión de Pacientes (Comparando por UUID y updatedAt)
        const patientMap = new Map<string, Patient>();
        // Primero indexamos los remotos
        remoteData.patients.forEach(p => patientMap.set(p.uuid, p));
        // Luego iteramos los locales y resolvemos colisiones por Last-Write-Wins
        localPatients.forEach(localP => {
          const remoteP = patientMap.get(localP.uuid);
          if (remoteP) {
            const localTime = new Date(localP.updatedAt).getTime();
            const remoteTime = new Date(remoteP.updatedAt).getTime();
            if (localTime > remoteTime) {
              patientMap.set(localP.uuid, localP); // Ganó el local por ser más nuevo
            }
          } else {
            patientMap.set(localP.uuid, localP); // No existía remoto, conservamos local
          }
        });
        mergedPatients = Array.from(patientMap.values());

        // B. Fusión de Sesiones (Comparando por UUID y updatedAt)
        const sessionMap = new Map<string, Session>();
        remoteData.sessions.forEach(s => sessionMap.set(s.uuid, s));
        localSessions.forEach(localS => {
          const remoteS = sessionMap.get(localS.uuid);
          if (remoteS) {
            const localTime = new Date(localS.updatedAt).getTime();
            const remoteTime = new Date(remoteS.updatedAt).getTime();
            if (localTime > remoteTime) {
              sessionMap.set(localS.uuid, localS); // Ganó el local
            }
          } else {
            sessionMap.set(localS.uuid, localS); // Conservamos local
          }
        });
        mergedSessions = Array.from(sessionMap.values());

        // C. Fusión de Reglas de Recurrencia (Comparando por patientUuid)
        const recurrenceMap = new Map<string, RecurrenceRule>();
        remoteData.recurrenceRules.forEach(r => recurrenceMap.set(r.patientUuid, r));
        localRecurrence.forEach(localR => {
          if (!recurrenceMap.has(localR.patientUuid)) {
            recurrenceMap.set(localR.patientUuid, localR);
          }
        });
        mergedRecurrence = Array.from(recurrenceMap.values());
      }

      // 3. Escribir Datos Fusionados en IndexedDB Local de forma masiva
      // Usaremos bulkPut para pisar/actualizar registros en IndexedDB de forma atómica y reactiva
      await patientRepo.saveAll(mergedPatients);
      await sessionRepo.saveAll(mergedSessions);
      await sessionRepo.saveAllRecurrenceRules(mergedRecurrence);

      // 4. Crear nuevo Backup JSON y subirlo a Google Drive
      const newBackup: BackupData = {
        patients: mergedPatients,
        sessions: mergedSessions,
        recurrenceRules: mergedRecurrence,
        exportedAt: new Date().toISOString(),
      };

      await driveRepo.uploadBackup(JSON.stringify(newBackup));

      // 5. Actualizar estados de Sincronización
      const timestamp = new Date().toLocaleString("es-AR", {
        day: "2-digit",
        month: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      });

      setLastSynced(timestamp);
      localStorage.setItem("gd-last-synced", timestamp);
      setSyncStatus("synced");
    } catch (err: any) {
      console.error("Error en sincronización:", err);
      setErrorMessage("Sincronización fallida: " + err.message);
      setSyncStatus("error");
    } finally {
      setLoading(false);
    }
  };

  return {
    googleToken,
    loading,
    syncStatus,
    lastSynced,
    errorMessage,
    connectGoogle,
    disconnectGoogle,
    performSync,
  };
}
