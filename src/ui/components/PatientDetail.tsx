"use client";

import { useRef } from "react";
import { Patient } from "../../domain/patient.types";
import { exportFullHistoryToWord } from "../../infrastructure/export/docx-exporter";
import { RichTextEditor } from "./RichTextEditor";
import { usePatientDetail } from "../hooks/usePatientDetail";

interface PatientDetailProps {
  patient: Patient;
  onBack: () => void;
}

export function PatientDetail({ patient: initialPatient, onBack }: PatientDetailProps) {
  const {
    patient,
    sortedSessions,
    clinicalHistoryHtml,
    saveFeedback,
    isDownloading,
    downloadError,
    handleHistoryChange,
    handleRetryDownload,
    handleScrollToSession,
  } = usePatientDetail(initialPatient);

  const editorContainerRef = useRef<HTMLDivElement>(null);

  const onScrollToSession = (sessionUuid: string) => {
    handleScrollToSession(sessionUuid, editorContainerRef.current);
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
              disabled={patient.isHistoryLoaded === false}
              onClick={() => exportFullHistoryToWord(patient)}
              className="bg-brand-indigo hover:bg-brand-indigo/90 disabled:opacity-40 disabled:cursor-not-allowed text-white font-title font-bold text-xs px-4 py-2 rounded-xl transition-all cursor-pointer shadow-sm flex items-center gap-1.5"
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

      {/* Workspace de los Dos Mundos o Alerta de Lazy Loading */}
      {patient.isHistoryLoaded === false ? (
        <div className="bg-bg-card border border-brand-sand rounded-3xl p-8 md:p-12 shadow-sm text-center max-w-2xl mx-auto space-y-6 animate-in fade-in duration-300">
          {isDownloading ? (
            <div className="flex flex-col items-center justify-center space-y-4 py-8">
              <div className="h-12 w-12 rounded-full border-4 border-brand-indigo border-t-transparent animate-spin"></div>
              <p className="font-title font-bold text-text-main text-base animate-pulse">📥 Descargando expediente completo de la nube...</p>
              <p className="text-xs text-text-sub">Sincronizando evolución clínica y sesiones previas.</p>
            </div>
          ) : downloadError ? (
            <div className="space-y-4 py-4">
              <span className="text-4xl block">⚠️</span>
              <h3 className="font-title font-bold text-lg text-status-cancelled-dark">No se pudo descargar el historial clínico</h3>
              <p className="text-xs text-text-sub max-w-md mx-auto">{downloadError}</p>
              <button
                onClick={handleRetryDownload}
                className="bg-brand-indigo hover:bg-brand-indigo/90 text-white font-title font-bold text-xs px-5 py-3 rounded-xl transition-all cursor-pointer shadow-sm inline-flex items-center gap-2 mt-2"
              >
                🔄 Reintentar descarga
              </button>
            </div>
          ) : (
            <div className="space-y-4 py-4">
              <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-brand-lavender/30 text-brand-indigo mb-2">
                <span className="text-3xl">📁</span>
              </div>
              <h3 className="font-title font-bold text-lg text-text-main">Historial Clínico Archivado Localmente</h3>
              <p className="text-sm text-text-sub max-w-md mx-auto leading-relaxed">
                Este expediente fue archivado localmente para optimizar el almacenamiento de tu dispositivo. 
                Por favor, conéctate a internet e inicia sesión con tu cuenta de Google Drive para descargarlo.
              </p>
              <div className="bg-bg-base/70 border border-brand-sand/50 rounded-2xl p-4 text-xs font-semibold text-text-sub max-w-sm mx-auto">
                {typeof window !== "undefined" && navigator.onLine 
                  ? "🌐 Conexión detectada. Iniciá sesión en la sección de Sincronización para poder descargar." 
                  : "🔌 Sin conexión a internet detectada."}
              </div>
            </div>
          )}
        </div>
      ) : (
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
                      onClick={() => onScrollToSession(session.uuid)}
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
      )}
    </section>
  );
}
