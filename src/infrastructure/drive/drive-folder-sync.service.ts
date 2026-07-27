import { Patient } from "../../domain/patient.types";
import { Session } from "../../domain/session.types";
import { generateFullHistoryWordHtml, generateSessionWordHtml } from "../export/docx-exporter";
import { driveLogger } from "./drive-logger";
import { container } from "../container";

export class DriveFolderSyncService {
  /**
   * Sincronizador de la estructura visible del consultorio (.doc y .json) en Google Drive.
   */
  async syncVisibleFiles(patients: Patient[], sessions: Session[]): Promise<void> {
    const driveRepo = container.getDriveRepository();
    try {
      driveLogger.log("info", "Creando/Buscando carpetas de consultorio en Google Drive...");
      const rootFolderId = await driveRepo.getOrCreateFolder("PSICO-AGENDA");
      const pacientesFolderId = await driveRepo.getOrCreateFolder("pacientes", rootFolderId);

      for (const patient of patients) {
        // DLP Guard: Si el historial no está cargado localmente, no sobrescribimos el archivo remoto
        if (patient.isHistoryLoaded === false) {
          driveLogger.log("info", `[DLP Guard] Saltando sync visible para paciente inactivo: ${patient.fullName}`);
          continue;
        }

        const partialUuid = patient.uuid.includes("-demo-") 
          ? patient.uuid 
          : patient.uuid.substring(0, 8);
        const patientFolderName = `${patient.fullName}_${partialUuid}`;
        
        driveLogger.log("info", `Procesando volcado visible para: ${patient.fullName} (Carpeta: ${patientFolderName})...`);
        // Buscar si ya existe una carpeta para este paciente usando su UUID único como sufijo
        let patientFolderId: string;
        const existingFolder = await driveRepo.findFolderBySuffix(partialUuid, pacientesFolderId);
        
        if (existingFolder) {
          patientFolderId = existingFolder.id;
          // Si el nombre del paciente cambió, renombramos la carpeta
          if (existingFolder.name !== patientFolderName) {
            driveLogger.log("info", `[Rename] Renombrando carpeta en Drive: de "${existingFolder.name}" a "${patientFolderName}"`);
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
          const appDataPatientsFolderId = await driveRepo.getOrCreateFolder("patients", "appDataFolder");
          const jsonMetadata = await driveRepo.getFileMetadata(appDataPatientsFolderId, `${patient.uuid}.json`);
          const existingDocMetadata = await driveRepo.getFileMetadata(patientFolderId, docFilename);
          
          if (existingDocMetadata && jsonMetadata) {
            const docModifiedTime = new Date(existingDocMetadata.modifiedTime).getTime();
            const jsonModifiedTime = new Date(jsonMetadata.modifiedTime).getTime();
            
            // Si el Word en Drive es al menos 15 segundos más nuevo que el JSON de backup,
            // significa que fue editado directamente en Drive (en sync normal se suben juntos).
            if (docModifiedTime > jsonModifiedTime + 15000) {
              const rawDate = new Date(existingDocMetadata.modifiedTime);
              const formattedDate = rawDate.toLocaleDateString("es-AR", {
                day: "2-digit",
                month: "2-digit",
                year: "numeric",
              }).replace(/[\/\s:]/g, "-") + "_" + 
              rawDate.toLocaleTimeString("es-AR", {
                hour: "2-digit",
                minute: "2-digit",
              }).replace(/[\/\s:]/g, "-");
              
              const backupName = `Historial_Clinico_Editado_en_Drive_${formattedDate}.doc`;
              driveLogger.log("info", `[Word Backup] Detectada edición manual en Drive para ${patient.fullName}. Resguardando como "${backupName}"`);
              await driveRepo.renameFileOrFolder(existingDocMetadata.id, backupName);
            }
          }
        } catch (metadataErr) {
          console.error("Error verificando o resguardando el Word existente:", metadataErr);
        }

        const fullHistoryHtml = generateFullHistoryWordHtml(patient);
        await driveRepo.uploadFileToFolder(
          patientFolderId,
          docFilename,
          "application/msword",
          "\ufeff" + fullHistoryHtml
        );

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
