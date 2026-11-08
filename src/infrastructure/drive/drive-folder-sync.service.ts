import { Patient } from "../../domain/patient.types";
import { Session } from "../../domain/session.types";
import { generateFullHistoryWordHtml, generateSessionWordHtml, generateExtraNotesWordHtml } from "../export/docx-exporter";
import { driveLogger } from "./drive-logger";
import type { IDriveRepository } from "../../repositories/drive.repository";
import type { IExtraNoteRepository } from "../../repositories/extra-note.repository";

export function extractFolderUuidSuffix(uuid: string): string {
  if (uuid.includes("-demo-")) return uuid;
  if (uuid.startsWith("patient-")) {
    // Para identificadores con prefijo 'patient-', usamos los últimos 8 caracteres para garantizar unicidad y evitar colisiones
    return uuid.slice(-8);
  }
  // Para UUIDs estándar v4 (ej. 8f4b238e-9d2a...), los primeros 8 son únicos
  return uuid.substring(0, 8);
}

export class DriveFolderSyncService {
  constructor(
    private customDriveRepo?: IDriveRepository,
    private customExtraNoteRepo?: IExtraNoteRepository
  ) {}

  /**
   * Sincronizador de la estructura visible del consultorio (.doc y .json) en Google Drive.
   */
  async syncVisibleFiles(patients: Patient[], sessions: Session[]): Promise<void> {
    const driveRepo = this.customDriveRepo || (await import("../container")).container.getDriveRepository();
    const extraNoteRepo = this.customExtraNoteRepo || (await import("../container")).container.getExtraNoteRepository();
    try {
      driveLogger.log("info", "Creando/Buscando carpetas de consultorio en Google Drive...");
      const rootFolderId = await driveRepo.getOrCreateFolder("PSICO-AGENDA");
      const pacientesFolderId = await driveRepo.getOrCreateFolder("pacientes", rootFolderId);

      for (const patient of patients) {
        const partialUuid = extractFolderUuidSuffix(patient.uuid);

        // Si el paciente fue marcado como eliminado (soft delete), movemos su carpeta en Drive a la papelera
        if (patient.deletedAt) {
          const existingFolder = await driveRepo.findFolderBySuffix(partialUuid, pacientesFolderId);
          if (existingFolder) {
            driveLogger.log("info", `[Trash] Moviendo carpeta de paciente eliminado [${partialUuid}] a la papelera de Drive`);
            try {
              await driveRepo.trashFile(existingFolder.id);
            } catch (trashErr) {
              console.error("Error moviendo carpeta a papelera en Drive:", trashErr);
            }
          }
          continue;
        }

        const patientFolderName = `${patient.fullName}_${partialUuid}`;

        // DLP Guard: Si el historial no está cargado localmente, no sobrescribimos el archivo remoto
        if (patient.isHistoryLoaded === false) {
          driveLogger.log("info", `[DLP Guard] Saltando sync visible para paciente inactivo [${partialUuid}]`);
          continue;
        }
        
        driveLogger.log("info", `Procesando volcado visible para paciente [${partialUuid}]...`);
        // Buscar si ya existe una carpeta para este paciente usando su UUID único como sufijo
        let patientFolderId: string;
        const existingFolder = await driveRepo.findFolderBySuffix(partialUuid, pacientesFolderId);
        
        if (existingFolder) {
          patientFolderId = existingFolder.id;
          // Si el nombre del paciente cambió, renombramos la carpeta
          if (existingFolder.name !== patientFolderName) {
            driveLogger.log("info", `[Rename] Renombrando carpeta en Drive para paciente [${partialUuid}]`);
            try {
              await driveRepo.renameFileOrFolder(existingFolder.id, patientFolderName);
            } catch (renameErr) {
              console.error("Error intentando renombrar la carpeta en Drive:", renameErr);
            }
          }
        } else {
          // Crear nueva carpeta si no existe
          patientFolderId = await driveRepo.getOrCreateFolder(patientFolderName, pacientesFolderId);
        }

        // A. Subir/Actualizar perfil.json del paciente
        // Obtener el perfil.json existente antes de pisarlo para saber cuándo fue la última sincronización
        let lastSyncTime = 0;
        try {
          const existingProfileMetadata = await driveRepo.getFileMetadata(patientFolderId, "perfil.json");
          if (existingProfileMetadata) {
            lastSyncTime = new Date(existingProfileMetadata.modifiedTime).getTime();
          }
        } catch (err) {
          console.error("Error al leer perfil.json existente:", err);
        }

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
        const docFilename = "Historial_Clinico.doc";
        try {
          // Buscar tanto Historial_Clinico.doc como Historial_Clinico.docx (por conversión automática de Drive)
          const docMetadata = await driveRepo.getFileMetadata(patientFolderId, "Historial_Clinico.doc");
          const docxMetadata = await driveRepo.getFileMetadata(patientFolderId, "Historial_Clinico.docx");
          
          const filesToCheck = [docMetadata, docxMetadata].filter(Boolean) as { id: string; modifiedTime: string; name: string }[];
          
          for (const fileMetadata of filesToCheck) {
            const fileModifiedTime = new Date(fileMetadata.modifiedTime).getTime();
            const isDocx = fileMetadata.name.endsWith(".docx");
            
            // Regla de respaldo:
            // 1. Si es .docx: la app nunca sube este formato, por ende siempre es una edición manual externa.
            // 2. Si es .doc: se respalda si su fecha es posterior al último perfil.json sincronizado (+ 15s de margen).
            const shouldBackup = isDocx || (lastSyncTime > 0 && fileModifiedTime > lastSyncTime + 15000);
            
            if (shouldBackup) {
              const rawDate = new Date(fileMetadata.modifiedTime);
              const formattedDate = rawDate.toLocaleDateString("es-AR", {
                day: "2-digit",
                month: "2-digit",
                year: "numeric",
              }).replace(/[\/\s:]/g, "-") + "_" + 
              rawDate.toLocaleTimeString("es-AR", {
                hour: "2-digit",
                minute: "2-digit",
              }).replace(/[\/\s:]/g, "-");
              
              const extension = isDocx ? ".docx" : ".doc";
              const backupName = `Historial_Clinico_Editado_en_Drive_${formattedDate}${extension}`;
              
              driveLogger.log("info", `[Word Backup] Detectada edición manual en Drive en "${fileMetadata.name}". Resguardando como "${backupName}"`);
              await driveRepo.renameFileOrFolder(fileMetadata.id, backupName);
            }
          }
        } catch (metadataErr) {
          console.error("Error verificando o resguardando el Word existente:", metadataErr);
        }

        let extraNotesContent = "";
        try {
          const patientExtraNotes = await extraNoteRepo.getByPatient(patient.uuid);
          if (patientExtraNotes.length > 0) {
            extraNotesContent = patientExtraNotes.map(n => n.content).join("<br/><br/>");
          }
        } catch (e) {
          console.warn("Falla al recuperar anotaciones extras para volcado:", e);
        }

        const fullHistoryHtml = generateFullHistoryWordHtml(patient, { extraNotesContent });
        await driveRepo.uploadFileToFolder(
          patientFolderId,
          docFilename,
          "application/msword",
          "\ufeff" + fullHistoryHtml
        );

        if (extraNotesContent) {
          const extraDocFilename = "Anotaciones_Extras.doc";
          const extraDocHtml = generateExtraNotesWordHtml(patient, extraNotesContent);
          await driveRepo.uploadFileToFolder(
            patientFolderId,
            extraDocFilename,
            "application/msword",
            "\ufeff" + extraDocHtml
          );
        }

        // C. Subir evoluciones individuales en la subcarpeta 'sesiones' (sólo atendidas)
        const patientSessions = sessions.filter(s => s.patientUuid === patient.uuid && s.status === "completed");
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
      driveLogger.log("info", "Volcado de archivos visibles en Drive completado.");
    } catch (error: any) {
      driveLogger.log("error", `Falla en volcado de archivos visibles: ${error.message}`, error);
      console.error("Error al sincronizar estructura visible en Drive:", error);
      throw error;
    }
  }
}
