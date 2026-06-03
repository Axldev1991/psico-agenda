import { useState, useEffect, useRef } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { Patient } from "../../domain/patient.types";
import { DexiePatientRepository } from "../../infrastructure/db/dexie-patient.repository";
import { DexieSessionRepository } from "../../infrastructure/db/dexie-session.repository";
import { useGoogleDrive } from "./useGoogleDrive";

const patientRepo = new DexiePatientRepository();
const sessionRepo = new DexieSessionRepository();

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

  const sortedSessions = [...sessions].sort(
    (a, b) => new Date(b.dateTime).getTime() - new Date(a.dateTime).getTime()
  );

  const [clinicalHistoryHtml, setClinicalHistoryHtml] = useState<string>("");
  const [saveFeedback, setSaveFeedback] = useState(false);
  const saveTimeoutRef = useRef<any>(null);

  const { googleToken, downloadPatientHistory } = useGoogleDrive();
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadError, setDownloadError] = useState<string | null>(null);

  // Auto-descarga al ingresar al expediente si no está en caché local
  useEffect(() => {
    const autoDownload = async () => {
      if (patient.isHistoryLoaded === false && googleToken) {
        setIsDownloading(true);
        setDownloadError(null);
        try {
          await downloadPatientHistory(patient.uuid);
        } catch (err: any) {
          setDownloadError(err.message || "Error al intentar sincronizar el expediente desde Drive.");
        } finally {
          setIsDownloading(false);
        }
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

  // Limpiar el timeout al desmontar
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, []);

  // Cargar el historial clínico inicial del paciente
  useEffect(() => {
    if (patient) {
      setClinicalHistoryHtml(patient.clinicalHistory || "");
    }
  }, [patient.uuid, patient.clinicalHistory]);

  // AUTO-PREPEND LOGIC: prepend sessions that don't have an anchor in clinical history
  useEffect(() => {
    if (sessions.length === 0 || !patient || patient.isHistoryLoaded === false) return;

    let currentHistory = patient.clinicalHistory || "";
    let wasModified = false;

    const oldestFirstSessions = [...sessions].sort(
      (a, b) => new Date(a.dateTime).getTime() - new Date(b.dateTime).getTime()
    );

    oldestFirstSessions.forEach((session, index) => {
      const anchorId = `session-anchor-${session.uuid}`;
      if (!currentHistory.includes(anchorId)) {
        const sessionDate = new Date(session.dateTime).toLocaleDateString("es-AR", {
          weekday: "long",
          year: "numeric",
          month: "long",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        });
        const sessionNumber = index + 1;
        
        const headerHtml = `
          <div id="${anchorId}" style="margin-top: 24px; margin-bottom: 8px; border-bottom: 2px solid #4f46e5; padding-bottom: 4px; font-family: Arial, sans-serif;">
            <h3 style="color: #4f46e5; font-size: 14pt; margin: 0;">📅 Sesión N° ${sessionNumber} — ${sessionDate}</h3>
            <p style="margin: 2px 0 0 0; color: #64748b; font-size: 10px;">Estado: ${
              session.status === "completed"
                ? "Atendido"
                : session.status === "cancelled"
                ? "Cancelado"
                : "Programado"
            }</p>
          </div>
          <div style="font-family: Arial, sans-serif; font-size: 11pt; line-height: 1.6; color: #334155; min-height: 20px;">
            Escribí la evolución clínica aquí...
          </div>
          <br/>
        `;
        currentHistory = headerHtml + currentHistory;
        wasModified = true;
      }
    });

    if (wasModified) {
      const updatedPatient = { ...patient, clinicalHistory: currentHistory };
      patientRepo.save(updatedPatient);
      setClinicalHistoryHtml(currentHistory);
    }
  }, [sessions, patient.uuid, patient.isHistoryLoaded]);

  // Guardar cambios del gran editor unificado (Debounce de 1000ms)
  const handleHistoryChange = (newHtml: string) => {
    setClinicalHistoryHtml(newHtml);

    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    saveTimeoutRef.current = setTimeout(async () => {
      try {
        const updatedPatient = {
          ...patient,
          clinicalHistory: newHtml,
          updatedAt: new Date().toISOString(),
        };
        await patientRepo.save(updatedPatient);
        setSaveFeedback(true);
        setTimeout(() => setSaveFeedback(false), 1500);
      } catch (err) {
        console.error("Error guardando el historial clínico unificado:", err);
      }
    }, 1000);
  };

  const handleScrollToSession = (sessionUuid: string, containerEl: HTMLElement | null) => {
    if (containerEl) {
      const editorDiv = containerEl.querySelector(".contenteditable") || containerEl.querySelector("[contenteditable]");
      if (editorDiv) {
        const anchor = editorDiv.querySelector(`#session-anchor-${sessionUuid}`);
        if (anchor) {
          anchor.scrollIntoView({ behavior: "smooth", block: "start" });
        }
      }
    }
  };

  return {
    patient,
    sortedSessions,
    clinicalHistoryHtml,
    saveFeedback,
    isDownloading,
    downloadError,
    googleToken,
    handleHistoryChange,
    handleRetryDownload,
    handleScrollToSession,
  };
}
