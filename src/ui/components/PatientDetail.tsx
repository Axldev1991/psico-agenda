"use client";

import { useEffect, useRef, useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { Patient } from "../../domain/patient.types";
import { Session } from "../../domain/session.types";
import { exportFullHistoryToWord } from "../../infrastructure/export/docx-exporter";
import { RichTextEditor } from "./RichTextEditor";
import { DexiePatientRepository } from "../../infrastructure/db/dexie-patient.repository";
import { DexieSessionRepository } from "../../infrastructure/db/dexie-session.repository";

interface PatientDetailProps {
  patient: Patient;
  onBack: () => void;
}

const patientRepo = new DexiePatientRepository();
const sessionRepo = new DexieSessionRepository();

export function PatientDetail({ patient: initialPatient, onBack }: PatientDetailProps) {
  // Cargar el paciente de forma reactiva de IndexedDB para ver cambios en tiempo real
  const dbPatient = useLiveQuery(
    () => patientRepo.getByUuid(initialPatient.uuid),
    [initialPatient.uuid]
  );
  const patient = dbPatient || initialPatient;

  // Cargar todas las sesiones físicas grabadas del paciente
  const sessions = useLiveQuery(
    () => sessionRepo.getByPatient(patient.uuid),
    [patient.uuid]
  ) || [];

  // Orden cronológico inverso (sesiones más recientes primero para mostrar al principio)
  const sortedSessions = [...sessions].sort(
    (a, b) => new Date(b.dateTime).getTime() - new Date(a.dateTime).getTime()
  );

  const [clinicalHistoryHtml, setClinicalHistoryHtml] = useState<string>("");
  const [saveFeedback, setSaveFeedback] = useState(false);
  const editorContainerRef = useRef<HTMLDivElement>(null);

  // Cargar el historial clínico inicial del paciente
  useEffect(() => {
    if (patient) {
      setClinicalHistoryHtml(patient.clinicalHistory || "");
    }
  }, [patient.uuid, patient.clinicalHistory]);

  // AUTO-PREPEND LOGIC: Si hay nuevas sesiones físicas registradas en IndexedDB que no figuren con su anclaje en el historial clínico, las prependemos al inicio con formato premium.
  useEffect(() => {
    if (sessions.length === 0 || !patient) return;

    let currentHistory = patient.clinicalHistory || "";
    let wasModified = false;

    // Ordenamos las sesiones de la más antigua a la más nueva para ir agregando las más nuevas arriba del todo secuencialmente
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
        
        // Membrete estético de Word con ID de ancla
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
      // Guardar de inmediato en IndexedDB
      const updatedPatient = { ...patient, clinicalHistory: currentHistory };
      patientRepo.save(updatedPatient);
      setClinicalHistoryHtml(currentHistory);
    }
  }, [sessions, patient.uuid]);

  // Guardar cambios del gran editor unificado
  const handleHistoryChange = async (newHtml: string) => {
    setClinicalHistoryHtml(newHtml);
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
  };

  // Desplazar editor al anclaje de la sesión
  const handleScrollToSession = (sessionUuid: string) => {
    if (editorContainerRef.current) {
      const editorDiv = editorContainerRef.current.querySelector(".contenteditable") || editorContainerRef.current.querySelector("[contenteditable]");
      if (editorDiv) {
        const anchor = editorDiv.querySelector(`#session-anchor-${sessionUuid}`);
        if (anchor) {
          anchor.scrollIntoView({ behavior: "smooth", block: "start" });
        }
      }
    }
  };

  return (
    <section className="space-y-6 animate-in fade-in duration-300">
      {/* Cabecera del Paciente */}
      <div className="bg-bg-card border border-brand-sand rounded-3xl p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-brand-sand/50 pb-6">
          <div className="flex items-center gap-4">
            <button
              onClick={onBack}
              className="h-10 w-10 rounded-xl bg-bg-base border border-brand-sand hover:bg-brand-sand/20 text-brand-indigo flex items-center justify-center font-bold transition-all cursor-pointer shadow-sm text-sm"
              title="Volver al Fichero"
            >
              ←
            </button>
            <div>
              <span className="text-[10px] text-text-sub font-bold uppercase tracking-wider block">Historial Clínico</span>
              <h2 className="font-title font-bold text-2xl text-text-main mt-0.5">{patient.fullName}</h2>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            {saveFeedback && (
              <span className="text-[10px] text-status-confirmed-dark bg-status-confirmed-light border border-status-confirmed-dark/25 px-3 py-1.5 rounded-xl font-bold animate-pulse">
                💾 Guardado Automático
              </span>
            )}
            <span className="font-mono text-xs font-bold bg-brand-lavender/30 text-text-main border border-brand-lavender/40 px-3 py-1.5 rounded-xl shadow-sm">
              Arancel: ${patient.sessionPrice.toLocaleString("es-AR")} ARS
            </span>
            <button
              onClick={() => exportFullHistoryToWord(patient)}
              className="bg-brand-indigo hover:bg-brand-indigo/90 text-white font-title font-bold text-xs px-4 py-2 rounded-xl transition-all cursor-pointer shadow-sm flex items-center gap-1.5"
              title="Exportar todo el historial clínico a un único Word (.doc)"
            >
              📥 Exportar Historial Completo
            </button>
          </div>
        </div>

        {/* Detalles Rápidos */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-6 text-xs font-medium">
          <div className="bg-bg-base/50 p-3 rounded-2xl border border-brand-sand/30">
            <span className="text-text-sub block text-[10px] uppercase font-bold tracking-wider">Teléfono de Contacto</span>
            <span className="text-text-main block mt-1 text-sm font-semibold">{patient.phone || "—"}</span>
          </div>
          <div className="bg-bg-base/50 p-3 rounded-2xl border border-brand-sand/30">
            <span className="text-text-sub block text-[10px] uppercase font-bold tracking-wider">Correo Electrónico</span>
            <span className="text-text-main block mt-1 text-sm font-semibold truncate" title={patient.email}>{patient.email || "Sin correo"}</span>
          </div>
          <div className="bg-bg-base/50 p-3 rounded-2xl border border-brand-sand/30">
            <span className="text-text-sub block text-[10px] uppercase font-bold tracking-wider">Obra Social / Prepaga</span>
            <span className="text-text-main block mt-1 text-sm font-semibold">
              {patient.healthInsurance ? `${patient.healthInsurance} (N° ${patient.affiliateNumber || "—"})` : "Particular"}
            </span>
          </div>
          <div className="bg-bg-base/50 p-3 rounded-2xl border border-brand-sand/30">
            <span className="text-text-sub block text-[10px] uppercase font-bold tracking-wider">Dirección Física</span>
            <span className="text-text-main block mt-1 text-sm font-semibold truncate" title={patient.address}>{patient.address || "—"}</span>
          </div>
        </div>
      </div>

      {/* Workspace de los Dos Mundos: Panel de Anclas + Gran Editor */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Barra Lateral Izquierda: Anclas de Sesiones */}
        <div className="lg:col-span-3 bg-bg-card border border-brand-sand rounded-3xl p-5 shadow-sm space-y-4 max-h-[75vh] overflow-y-auto">
          <div>
            <h3 className="font-title font-bold text-sm text-text-main">📍 Índice de Sesiones</h3>
            <p className="text-[10px] text-text-sub font-semibold mt-0.5">Hacé clic para desplazarte en el historial</p>
          </div>
          
          {sortedSessions.length === 0 ? (
            <p className="text-xs text-text-sub/70 italic py-4">No hay sesiones programadas.</p>
          ) : (
            <div className="space-y-2">
              {sortedSessions.map((session, index) => {
                const sessionDate = new Date(session.dateTime);
                const dateFormatted = sessionDate.toLocaleDateString("es-AR", {
                  day: "2-digit",
                  month: "2-digit",
                  hour: "2-digit",
                  minute: "2-digit",
                });
                const sessionNumber = sortedSessions.length - index;

                return (
                  <button
                    key={session.uuid}
                    onClick={() => handleScrollToSession(session.uuid)}
                    className="w-full text-left bg-bg-base/50 hover:bg-brand-indigo/10 border border-brand-sand/30 hover:border-brand-indigo/35 p-3 rounded-2xl transition-all cursor-pointer flex items-center justify-between group"
                  >
                    <div>
                      <span className="font-title font-bold text-xs text-text-main block group-hover:text-brand-indigo">
                        Sesión N° {sessionNumber}
                      </span>
                      <span className="text-[10px] text-text-sub block mt-0.5 font-mono">
                        {dateFormatted} hs
                      </span>
                    </div>
                    <span className={`text-[8px] font-bold px-2 py-0.5 rounded-full border ${
                      session.status === "completed"
                        ? "bg-status-confirmed-light text-status-confirmed-dark border-status-confirmed-dark/20"
                        : session.status === "cancelled"
                        ? "bg-status-cancelled-light text-status-cancelled-dark border-status-cancelled-dark/20"
                        : "bg-brand-sand/30 text-text-sub border-brand-sand/55"
                    }`}>
                      {session.status === "completed" ? "Atendido" : session.status === "cancelled" ? "Cancelado" : "Programado"}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Panel Derecho: Gran Editor Clínico Word-Like */}
        <div 
          ref={editorContainerRef}
          className="lg:col-span-9 bg-white border border-brand-sand rounded-3xl p-6 md:p-8 shadow-md max-h-[75vh] overflow-y-auto space-y-4"
        >
          <div className="border-b border-brand-sand pb-4 flex items-center justify-between">
            <div>
              <h3 className="font-title font-bold text-base text-text-main">📖 Expediente Clínico Unificado</h3>
              <p className="text-[10px] text-text-sub font-semibold mt-0.5">Formato compatible nativo con Microsoft Word</p>
            </div>
            <span className="text-[10px] text-text-sub/50 font-semibold italic">Guardado automático en IndexedDB</span>
          </div>

          <div className="prose max-w-none">
            <RichTextEditor
              initialValue={clinicalHistoryHtml}
              onChange={handleHistoryChange}
              placeholder="Comenzá a redactar el expediente clínico unificado de este paciente..."
            />
          </div>
        </div>
      </div>
    </section>
  );
}
