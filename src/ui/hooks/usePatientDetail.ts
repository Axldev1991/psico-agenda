import { useState, useEffect, useRef, useMemo } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { Patient } from "../../domain/patient.types";
import { container } from "../../infrastructure/container";
import { useGoogleDrive } from "./useGoogleDrive";
import { parseClinicalHistory, rebuildClinicalHistory } from "../../domain/patient.utils";

const patientRepo = container.getPatientRepository();
const sessionRepo = container.getSessionRepository();

export function usePatientDetail(initialPatient: Patient) {
  const dbPatient = useLiveQuery(
    () => patientRepo.getByUuid(initialPatient.uuid),
    [initialPatient.uuid]
  );
  const patient = dbPatient || initialPatient;

  const sessions = useLiveQuery(
    () => sessionRepo.getByPatient(patient.uuid),
    [patient.uuid]
  ) || [];

  const sortedSessions = useMemo(() => {
    return [...sessions].sort(
      (a, b) => new Date(b.dateTime).getTime() - new Date(a.dateTime).getTime()
    );
  }, [sessions]);

  const [selectedSessionUuid, setSelectedSessionUuid] = useState<string | null>(null);
  const [sessionContents, setSessionContents] = useState<Map<string, string>>(new Map());
  const [saveFeedback, setSaveFeedback] = useState(false);
  const [isLocalSaving, setIsLocalSaving] = useState(false);
  const [hasPendingDriveUpload, setHasPendingDriveUpload] = useState(false);

  const saveTimeoutRef = useRef<any>(null);
  const uploadTimeoutRef = useRef<any>(null);
  const pendingDriveUploadRef = useRef(false);

  const sessionContentsRef = useRef<Map<string, string>>(new Map());

  useEffect(() => {
    sessionContentsRef.current = sessionContents;
  }, [sessionContents]);

  useEffect(() => {
    pendingDriveUploadRef.current = hasPendingDriveUpload;
  }, [hasPendingDriveUpload]);

  const { googleToken, downloadPatientHistory, performSync, syncStatus } = useGoogleDrive();
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadError, setDownloadError] = useState<string | null>(null);

  const latestStateRef = useRef({ patient, sessions, googleToken, selectedSessionUuid });
  useEffect(() => {
    latestStateRef.current = { patient, sessions, googleToken, selectedSessionUuid };
  }, [patient, sessions, googleToken, selectedSessionUuid]);

  // Auto-descarga al ingresar al expediente si no está en caché local
  useEffect(() => {
    console.log("DEBUG: Verificando autodescarga. ¿Token?", !!googleToken, "¿Historial cargado?", patient.isHistoryLoaded);
    const autoDownload = async () => {
      if (patient.isHistoryLoaded === false && googleToken) {
        console.log("DEBUG: Condiciones cumplidas, iniciando descarga para:", patient.uuid);
        setIsDownloading(true);
        setDownloadError(null);
        try {
          await downloadPatientHistory(patient.uuid);
        } catch (err: any) {
          console.log("DEBUG: Error en descarga:", err);
          setDownloadError(err.message || "Error al intentar sincronizar el expediente desde Drive.");
        } finally {
          setIsDownloading(false);
        }
      } else {
        console.log("DEBUG: Autodescarga salteada. ¿Token faltante o Historial ya cargado?");
      }
    };
    autoDownload();
  }, [patient.isHistoryLoaded, patient.uuid, googleToken]);

  const handleRetryDownload = async () => {
    setIsDownloading(true);
    setDownloadError(null);
    try {
      await downloadPatientHistory(patient.uuid);
    } catch (err: any) {
      setDownloadError(err.message || "Error en la descarga manual.");
    } finally {
      setIsDownloading(false);
    }
  };

  const triggerAutoSyncIfPending = async () => {
    if (!googleToken || !pendingDriveUploadRef.current) return;

    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
      try {
        const fullHtml = rebuildClinicalHistory(sessions, sessionContentsRef.current);
        const updatedPatient = {
          ...patient,
          clinicalHistory: fullHtml,
          isHistoryLoaded: true,
          updatedAt: new Date().toISOString(),
        };
        await patientRepo.save(updatedPatient);

        if (selectedSessionUuid) {
          const currentSession = sessions.find(s => s.uuid === selectedSessionUuid);
          if (currentSession) {
            const newHtml = sessionContentsRef.current.get(selectedSessionUuid);
            if (newHtml !== undefined) {
              const updatedSession = {
                ...currentSession,
                notes: newHtml,
                updatedAt: new Date().toISOString(),
              };
              await sessionRepo.save(updatedSession);
            }
          }
        }
        setIsLocalSaving(false);
        setSaveFeedback(true);
        setTimeout(() => setSaveFeedback(false), 1500);
      } catch (e) {
        setIsLocalSaving(false);
        console.error("Error forzando guardado local antes de sync:", e);
      }
    }

    if (uploadTimeoutRef.current) {
      clearTimeout(uploadTimeoutRef.current);
    }

    try {
      setHasPendingDriveUpload(false);
      await performSync();
    } catch (err) {
      console.error("Error en sincronización automática de fondo:", err);
      setHasPendingDriveUpload(true);
    }
  };

  // Intervalo de seguridad de 3 minutos
  useEffect(() => {
    const interval = setInterval(() => {
      if (hasPendingDriveUpload && googleToken) {
        triggerAutoSyncIfPending();
      }
    }, 180000);

    return () => clearInterval(interval);
  }, [hasPendingDriveUpload, googleToken]);

  // Garantizar guardado local/sincronización al desmontar el componente (salir de la ficha)
  useEffect(() => {
    return () => {
      const { patient: currentPatient, sessions: currentSessions, googleToken: currentToken, selectedSessionUuid: currentSessionUuid } = latestStateRef.current;

      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
        
        // Forzar guardado local inmediato de emergencia
        const forceLocalSave = async () => {
          try {
            const latestHistory = rebuildClinicalHistory(currentSessions, sessionContentsRef.current);
            const updatedPatient = {
              ...currentPatient,
              clinicalHistory: latestHistory,
              isHistoryLoaded: true,
              updatedAt: new Date().toISOString(),
            };
            await patientRepo.save(updatedPatient);

            if (currentSessionUuid) {
              const currentSession = currentSessions.find(s => s.uuid === currentSessionUuid);
              if (currentSession) {
                const newHtml = sessionContentsRef.current.get(currentSessionUuid);
                if (newHtml !== undefined) {
                  const updatedSession = {
                    ...currentSession,
                    notes: newHtml,
                    updatedAt: new Date().toISOString(),
                  };
                  await sessionRepo.save(updatedSession);
                }
              }
            }
            
            // Si hay token, sincronizar a la nube de inmediato
            if (currentToken) {
              await performSync();
            }
          } catch (e) {
            console.error("Error forzando guardado local en desmontaje:", e);
          }
        };
        forceLocalSave();
      } else if (pendingDriveUploadRef.current && currentToken) {
        // Si no había guardado local pendiente pero sí quedaba subir a la nube
        performSync().catch(err => {
          console.error("Error en sincronización final al desmontar:", err);
        });
      }

      if (uploadTimeoutRef.current) {
        clearTimeout(uploadTimeoutRef.current);
      }
    };
  }, []);

  // Cargar el historial clínico inicial del paciente
  useEffect(() => {
    if (patient) {
      const parsed = parseClinicalHistory(patient.clinicalHistory || "");
      setSessionContents(parsed);
    }
  }, [patient.uuid, patient.clinicalHistory]);

  // Seleccionar automáticamente la sesión activa inicial cuando se cargan las sesiones
  useEffect(() => {
    if (sortedSessions.length > 0 && !selectedSessionUuid) {
      setSelectedSessionUuid(sortedSessions[0].uuid);
    }
  }, [sortedSessions, selectedSessionUuid]);

  // AUTO-PREPEND LOGIC: prepend sessions that don't have an anchor in clinical history
  useEffect(() => {
    if (sessions.length === 0 || !patient || patient.isHistoryLoaded === false) return;

    let currentHistory = patient.clinicalHistory || "";
    const parsed = parseClinicalHistory(currentHistory);
    let mapModified = false;

    sessions.forEach((session) => {
      if (!parsed.has(session.uuid)) {
        parsed.set(
          session.uuid,
          `<div style="font-family: Arial, sans-serif; font-size: 11pt; line-height: 1.6; color: #334155; min-height: 20px;">Escribí la evolución clínica aquí...</div><br/>`
        );
        mapModified = true;
      }
    });

    if (mapModified) {
      const fullHtml = rebuildClinicalHistory(sessions, parsed);
      const updatedPatient = { ...patient, clinicalHistory: fullHtml };
      patientRepo.save(updatedPatient);
      setSessionContents(parsed);
    }
  }, [sessions, patient.uuid, patient.isHistoryLoaded]);

  const handleHistoryChange = (newHtml: string) => {
    if (!selectedSessionUuid) return;

    const newContents = new Map(sessionContents);
    newContents.set(selectedSessionUuid, newHtml);
    setSessionContents(newContents);
    sessionContentsRef.current = newContents;
    setHasPendingDriveUpload(true);
    pendingDriveUploadRef.current = true;
    setIsLocalSaving(true);

    // 1. Guardado local en IndexedDB (1s debounce)
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    saveTimeoutRef.current = setTimeout(async () => {
      try {
        const fullHtml = rebuildClinicalHistory(sessions, newContents);
        const updatedPatient = {
          ...patient,
          clinicalHistory: fullHtml,
          isHistoryLoaded: true,
          updatedAt: new Date().toISOString(),
        };
        await patientRepo.save(updatedPatient);

        const currentSession = sessions.find(s => s.uuid === selectedSessionUuid);
        if (currentSession) {
          const updatedSession = {
            ...currentSession,
            notes: newHtml,
            updatedAt: new Date().toISOString(),
          };
          await sessionRepo.save(updatedSession);
        }

        setIsLocalSaving(false);
        setSaveFeedback(true);
        setHasPendingDriveUpload(true);
        setTimeout(() => setSaveFeedback(false), 1500);
      } catch (err) {
        setIsLocalSaving(false);
        console.error("Error guardando el historial clínico por sesión:", err);
      }
    }, 1000);

    // 2. Guardado en Google Drive (15s debounce)
    if (uploadTimeoutRef.current) {
      clearTimeout(uploadTimeoutRef.current);
    }
    if (googleToken) {
      uploadTimeoutRef.current = setTimeout(() => {
        triggerAutoSyncIfPending();
      }, 15000);
    }
  };

  const handleScrollToSession = (sessionUuid: string, containerEl: HTMLElement | null) => {
    // Ya no es crítico el scroll porque cambiamos de sesión activa en la UI, pero dejamos la estructura vacía por compatibilidad
  };

  // Guardar cambios en ficha CECI
  const handleCeciChange = async (key: string, value: string) => {
    try {
      const updatedPatient = {
        ...patient,
        [key]: value,
        updatedAt: new Date().toISOString(),
      };
      await patientRepo.save(updatedPatient);
      setHasPendingDriveUpload(true);
    } catch (err) {
      console.error("Error guardando datos CECI:", err);
    }
  };

  // Cambiar color visual de la sesión
  const changeSessionColor = async (sessionUuid: string, newColor: string) => {
    try {
      const targetSession = sessions.find(s => s.uuid === sessionUuid);
      if (targetSession) {
        const updatedSession = {
          ...targetSession,
          colorTag: newColor,
          updatedAt: new Date().toISOString(),
        };
        await sessionRepo.save(updatedSession);
        
        // Actualizar updatedAt del paciente para forzar sincronización
        const updatedPatient = {
          ...patient,
          updatedAt: new Date().toISOString(),
        };
        await patientRepo.save(updatedPatient);
        
        // Marcar cambios pendientes y disparar sincronización inmediata
        pendingDriveUploadRef.current = true;
        setHasPendingDriveUpload(true);
        triggerAutoSyncIfPending();
      }
    } catch (err) {
      console.error("Error al cambiar el color de la sesión:", err);
    }
  };

  // Cambiar motivo/descripción de la sesión
  const changeSessionDescription = async (sessionUuid: string, newDescription: string) => {
    try {
      const targetSession = sessions.find(s => s.uuid === sessionUuid);
      if (targetSession) {
        const updatedSession = {
          ...targetSession,
          description: newDescription,
          updatedAt: new Date().toISOString(),
        };
        await sessionRepo.save(updatedSession);
        
        // Actualizar updatedAt del paciente para forzar sincronización
        const updatedPatient = {
          ...patient,
          updatedAt: new Date().toISOString(),
        };
        await patientRepo.save(updatedPatient);
        
        // Marcar cambios pendientes y disparar sincronización inmediata
        pendingDriveUploadRef.current = true;
        setHasPendingDriveUpload(true);
        triggerAutoSyncIfPending();
      }
    } catch (err) {
      console.error("Error al cambiar la descripción de la sesión:", err);
    }
  };

  return {
    patient,
    sortedSessions,
    selectedSessionUuid,
    setSelectedSessionUuid,
    selectedSessionContentHtml: sessionContents.get(selectedSessionUuid || "") || "",
    saveFeedback,
    isLocalSaving,
    hasPendingDriveUpload,
    syncStatus,
    triggerAutoSyncIfPending,
    isDownloading,
    downloadError,
    googleToken,
    handleHistoryChange,
    handleRetryDownload,
    handleScrollToSession,
    handleCeciChange,
    changeSessionColor,
    changeSessionDescription,
  };
}
