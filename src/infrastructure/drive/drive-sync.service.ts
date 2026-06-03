import { GoogleDriveRepository } from "./google-drive.repository";
import { DexiePatientRepository } from "../db/dexie-patient.repository";
import { DexieSessionRepository } from "../db/dexie-session.repository";
import { Patient } from "../../domain/patient.types";
import { Session, RecurrenceRule } from "../../domain/session.types";
import { generateFullHistoryWordHtml, generateSessionWordHtml } from "../export/docx-exporter";

const driveRepo = new GoogleDriveRepository();
const patientRepo = new DexiePatientRepository();
const sessionRepo = new DexieSessionRepository();

interface BackupData {
  patients: Patient[];
  sessions: Session[];
  recurrenceRules: RecurrenceRule[];
  exportedAt: string;
}

export class DriveSyncService {
  /**
   * Algoritmo de Depuración (Eviction) silencioso
   */
  async evictOldCache(): Promise<void> {
    try {
      const threshold = new Date();
      threshold.setDate(threshold.getDate() - 180); // 180 días atrás
      
      const allPatients = await patientRepo.getAll();
      const allSessions = await sessionRepo.getAll();

      for (const patient of allPatients) {
        if (patient.status === 'inactive' || patient.isHistoryLoaded === false) continue;

        // Buscar si tiene alguna sesión en la ventana de 180 días o a futuro
        const hasRecentActivity = allSessions.some(s => 
          s.patientUuid === patient.uuid && 
          new Date(s.dateTime) >= threshold
        );

        if (!hasRecentActivity) {
          // Evicción local: eliminar datos clínicos pesados
          const updatedPatient = {
            ...patient,
            status: 'inactive' as const,
            clinicalHistory: undefined,
            isHistoryLoaded: false,
            updatedAt: patient.updatedAt // MANTENEMOS la misma marca temporal
          };
          await patientRepo.save(updatedPatient);
          // Eliminar también las sesiones físicas del paciente del IndexedDB local
          await sessionRepo.deleteByPatient(patient.uuid);
        }
      }
    } catch (err) {
      console.error("Error ejecutando evictOldCache en servicio:", err);
    }
  }

  /**
   * Descarga el historial clínico y sesiones de un paciente específico de manera diferida.
   */
  async downloadPatientHistory(uuid: string, googleToken: string): Promise<void> {
    driveRepo.setAccessToken(googleToken);
    const patientsFolderId = await driveRepo.getOrCreateFolder("patients", "appDataFolder");
    const fileContent = await driveRepo.downloadFileFromFolder(patientsFolderId, `${uuid}.json`);
    if (!fileContent) {
      throw new Error("No se encontró el expediente del paciente en Google Drive.");
    }

    const remotePatientData = JSON.parse(fileContent);
    const localPatient = await patientRepo.getByUuid(uuid);
    if (localPatient) {
      const updatedPatient = {
        ...localPatient,
        clinicalHistory: remotePatientData.clinicalHistory,
        isHistoryLoaded: true,
        status: 'active' as const
      };
      await patientRepo.save(updatedPatient);
    }

    await sessionRepo.deleteByPatient(uuid);
    if (Array.isArray(remotePatientData.sessions)) {
      await sessionRepo.saveAll(remotePatientData.sessions);
    }
  }

  /**
   * Descarga en bucle todos los expedientes pendientes para habilitar el uso 100% offline.
   */
  async preloadAllForOffline(googleToken: string): Promise<void> {
    driveRepo.setAccessToken(googleToken);
    const patientsFolderId = await driveRepo.getOrCreateFolder("patients", "appDataFolder");
    const allPatients = await patientRepo.getAll();
    const inactivePatients = allPatients.filter(p => p.isHistoryLoaded === false);

    for (const patient of inactivePatients) {
      const fileContentStr = await driveRepo.downloadFileFromFolder(patientsFolderId, `${patient.uuid}.json`);
      if (fileContentStr) {
        const patientData = JSON.parse(fileContentStr);
        patient.clinicalHistory = patientData.clinicalHistory;
        patient.isHistoryLoaded = true;
        patient.status = 'active';

        await patientRepo.save(patient);

        await sessionRepo.deleteByPatient(patient.uuid);
        if (Array.isArray(patientData.sessions)) {
          await sessionRepo.saveAll(patientData.sessions);
        }
      }
    }
  }

  /**
   * Sincronización selectiva de metadatos e índices activos.
   */
  async performSync(googleToken: string): Promise<{ lastSynced: string }> {
    driveRepo.setAccessToken(googleToken);
    const patientsFolderId = await driveRepo.getOrCreateFolder("patients", "appDataFolder");

    // 1. Obtener Datos Locales
    const localPatients = await patientRepo.getAll();
    const localSessions = await sessionRepo.getAll();
    const localRecurrence = await sessionRepo.getRecurrenceRules();

    // 2. Descargar Datos de la Nube (index-db.json o migración desde backup viejo)
    let remoteIndexStr = await driveRepo.downloadFileFromFolder("appDataFolder", "index-db.json");
    let isMigrating = false;
    let remoteBackupData: BackupData | null = null;

    if (!remoteIndexStr) {
      const oldBackupStr = await driveRepo.downloadBackup();
      if (oldBackupStr) {
        isMigrating = true;
        try {
          remoteBackupData = JSON.parse(oldBackupStr);
        } catch (e) {
          console.error("Error parseando backup viejo:", e);
        }
      }
    }

    let remotePatients: Patient[] = [];
    let remoteRecurrence: RecurrenceRule[] = [];

    if (remoteIndexStr) {
      const indexData = JSON.parse(remoteIndexStr);
      remotePatients = indexData.patients || [];
      remoteRecurrence = indexData.recurrenceRules || [];
    } else if (isMigrating && remoteBackupData) {
      remotePatients = remoteBackupData.patients || [];
      remoteRecurrence = remoteBackupData.recurrenceRules || [];
    }

    // Fusión de Pacientes (Comparando por UUID y updatedAt)
    const patientMap = new Map<string, Patient>();
    const patientsToUpload: string[] = [];
    const patientsToDownload: string[] = [];

    remotePatients.forEach(p => {
      if (isMigrating) {
        p.isHistoryLoaded = true;
        p.status = 'active';
      }
      patientMap.set(p.uuid, p);
    });

    localPatients.forEach(localP => {
      const remoteP = patientMap.get(localP.uuid);
      if (remoteP) {
        const localTime = new Date(localP.updatedAt).getTime();
        const remoteTime = new Date(remoteP.updatedAt).getTime();

        if (localTime > remoteTime) {
          // Local es más nuevo -> planear subida (solo si el historial está cargado localmente)
          patientMap.set(localP.uuid, localP);
          if (localP.isHistoryLoaded !== false) {
            patientsToUpload.push(localP.uuid);
          }
        } else if (remoteTime > localTime) {
          // Remoto es más nuevo -> planear descarga si el local ya estaba cargado o el remoto es activo
          if (localP.isHistoryLoaded === true || remoteP.status === 'active') {
            patientsToDownload.push(localP.uuid);
          }
        }
      } else {
        // Solo existe localmente -> subir
        patientMap.set(localP.uuid, localP);
        if (localP.isHistoryLoaded !== false) {
          patientsToUpload.push(localP.uuid);
        }
      }
    });

    // Pacientes nuevos remotamente
    remotePatients.forEach(remoteP => {
      const localP = localPatients.find(p => p.uuid === remoteP.uuid);
      if (!localP) {
        if (remoteP.status === 'active' || isMigrating) {
          patientsToDownload.push(remoteP.uuid);
        }
      }
    });

    const mergedPatients = Array.from(patientMap.values());

    // Si es migración, subir todos a archivos individuales
    if (isMigrating && remoteBackupData) {
      for (const p of remoteBackupData.patients) {
        const pSessions = (remoteBackupData.sessions || []).filter(s => s.patientUuid === p.uuid);
        const fileContent = {
          uuid: p.uuid,
          clinicalHistory: p.clinicalHistory || "",
          sessions: pSessions
        };
        await driveRepo.uploadFileToFolder(patientsFolderId, `${p.uuid}.json`, "application/json", JSON.stringify(fileContent));
      }
    }

    // Procesar subidas de pacientes modificados localmente
    for (const uuid of patientsToUpload) {
      const localP = localPatients.find(p => p.uuid === uuid);
      if (localP) {
        const pSessions = localSessions.filter(s => s.patientUuid === uuid);
        const fileContent = {
          uuid: localP.uuid,
          clinicalHistory: localP.clinicalHistory || "",
          sessions: pSessions
        };
        await driveRepo.uploadFileToFolder(patientsFolderId, `${uuid}.json`, "application/json", JSON.stringify(fileContent));
      }
    }

    // Procesar descargas de pacientes modificados remotamente
    for (const uuid of patientsToDownload) {
      let fileContentStr: string | null = null;
      if (isMigrating && remoteBackupData) {
        const p = remoteBackupData.patients.find(x => x.uuid === uuid);
        if (p) {
          const pSessions = (remoteBackupData.sessions || []).filter(s => s.patientUuid === uuid);
          fileContentStr = JSON.stringify({
            uuid: p.uuid,
            clinicalHistory: p.clinicalHistory || "",
            sessions: pSessions
          });
        }
      } else {
        fileContentStr = await driveRepo.downloadFileFromFolder(patientsFolderId, `${uuid}.json`);
      }

      if (fileContentStr) {
        const patientData = JSON.parse(fileContentStr);
        const idx = mergedPatients.findIndex(p => p.uuid === uuid);
        if (idx !== -1) {
          mergedPatients[idx].clinicalHistory = patientData.clinicalHistory;
          mergedPatients[idx].isHistoryLoaded = true;
          mergedPatients[idx].status = 'active';
        }
        // Actualizar sesiones locales del paciente
        await sessionRepo.deleteByPatient(uuid);
        if (Array.isArray(patientData.sessions)) {
          await sessionRepo.saveAll(patientData.sessions);
        }
      }
    }

    // Fusión de Reglas de Recurrencia
    const recurrenceMap = new Map<string, RecurrenceRule>();
    remoteRecurrence.forEach(r => recurrenceMap.set(r.patientUuid, r));
    localRecurrence.forEach(localR => {
      if (!recurrenceMap.has(localR.patientUuid)) {
        recurrenceMap.set(localR.patientUuid, localR);
      }
    });
    const mergedRecurrence = Array.from(recurrenceMap.values());

    // Escribir datos consolidados localmente
    await patientRepo.saveAll(mergedPatients);
    await sessionRepo.saveAllRecurrenceRules(mergedRecurrence);

    // Crear index-db.json despojando las historias clínicas detalladas
    const indexPatients = mergedPatients.map(p => {
      const { clinicalHistory, ...rest } = p;
      return rest;
    });

    const indexData = {
      patients: indexPatients,
      recurrenceRules: mergedRecurrence,
      exportedAt: new Date().toISOString()
    };

    await driveRepo.uploadFileToFolder("appDataFolder", "index-db.json", "application/json", JSON.stringify(indexData));

    // Sincronizar estructura visible en Drive
    const finalSessions = await sessionRepo.getAll();
    this.syncVisibleFiles(mergedPatients, finalSessions).catch(err => {
      console.error("Error en sincronización de archivos visibles:", err);
    });

    const timestamp = new Date().toLocaleString("es-AR", {
      day: "2-digit",
      month: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });

    return { lastSynced: timestamp };
  }

  /**
   * Sincronizador en segundo plano de la estructura visible del consultorio (con guardas DLP).
   */
  private async syncVisibleFiles(patients: Patient[], sessions: Session[]) {
    try {
      console.log("Iniciando volcado de archivos visibles en Google Drive...");
      const rootFolderId = await driveRepo.getOrCreateFolder("PSICO-AGENDA");
      const pacientesFolderId = await driveRepo.getOrCreateFolder("pacientes", rootFolderId);

      for (const patient of patients) {
        // REQ-5: Si el historial no está cargado localmente, no sobrescribimos el archivo remoto con datos vacíos
        if (patient.isHistoryLoaded === false) {
          console.log(`[DLP Guard] Saltando sync visible para paciente inactivo: ${patient.fullName}`);
          continue;
        }

        const partialUuid = patient.uuid.substring(0, 8);
        const patientFolderName = `${patient.fullName}_${partialUuid}`;
        
        // Crear carpeta del paciente
        const patientFolderId = await driveRepo.getOrCreateFolder(patientFolderName, pacientesFolderId);

        // A. Subir/Actualizar perfil.json del paciente
        const profileData = {
          uuid: patient.uuid,
          fullName: patient.fullName,
          email: patient.email,
          phone: patient.phone,
          address: patient.address,
          healthInsurance: patient.healthInsurance,
          affiliateNumber: patient.affiliateNumber,
          sessionPrice: patient.sessionPrice,
          createdAt: patient.createdAt,
          updatedAt: patient.updatedAt,
        };
        await driveRepo.uploadFileToFolder(
          patientFolderId,
          "perfil.json",
          "application/json",
          JSON.stringify(profileData, null, 2)
        );

        // B. Subir/Actualizar Historial_Clinico.doc consolidado
        const fullHistoryHtml = generateFullHistoryWordHtml(patient);
        await driveRepo.uploadFileToFolder(
          patientFolderId,
          "Historial_Clinico.doc",
          "application/msword",
          "\ufeff" + fullHistoryHtml
        );

        // C. Subir evoluciones individuales en la subcarpeta 'sesiones'
        const patientSessions = sessions.filter(s => s.patientUuid === patient.uuid);
        if (patientSessions.length > 0) {
          const sessionsFolderId = await driveRepo.getOrCreateFolder("sesiones", patientFolderId);

          for (const session of patientSessions) {
            const dateStr = session.dateTime.split("T")[0];
            const sessionDate = new Date(session.dateTime);
            const timeStr = `${sessionDate.getHours().toString().padStart(2, '0')}-${sessionDate.getMinutes().toString().padStart(2, '0')}`;
            const filename = `${dateStr}_${timeStr}_Sesion.doc`;

            const sessionHtml = generateSessionWordHtml(patient, session);
            await driveRepo.uploadFileToFolder(
              sessionsFolderId,
              filename,
              "application/msword",
              "\ufeff" + sessionHtml
            );
          }
        }
      }
      console.log("Volcado de archivos visibles en Drive completado.");
    } catch (error) {
      console.error("Error al sincronizar estructura visible en Drive:", error);
    }
  }
}
