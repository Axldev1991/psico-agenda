"use client";

import { useRef, useState } from "react";
import { Patient } from "../../domain/patient.types";
import { exportFullHistoryToWord } from "../../infrastructure/export/docx-exporter";
import { RichTextEditor } from "./RichTextEditor";
import { usePatientDetail } from "../hooks/usePatientDetail";
import { calculateAge } from "../../domain/patient.utils";

interface PatientDetailProps {
  patient: Patient;
  onBack: () => void;
  onEdit: (patient: Patient) => void;
}

export function PatientDetail({ patient: initialPatient, onBack, onEdit }: PatientDetailProps) {
  const {
    patient,
    sortedSessions,
    selectedSessionUuid,
    setSelectedSessionUuid,
    selectedSessionContentHtml,
    saveFeedback,
    hasPendingDriveUpload,
    syncStatus,
    triggerAutoSyncIfPending,
    isDownloading,
    downloadError,
    googleToken,
    handleHistoryChange,
    handleRetryDownload,
    handleCeciChange,
  } = usePatientDetail(initialPatient);

  const [activeTab, setActiveTab] = useState<"timeline" | "ceci">("timeline");
  const editorContainerRef = useRef<HTMLDivElement>(null);

  const selectedSessionIndex = sortedSessions.findIndex((s) => s.uuid === selectedSessionUuid);
  const selectedSession = sortedSessions[selectedSessionIndex] || sortedSessions[0];
  const selectedSessionNumber = selectedSession ? sortedSessions.length - selectedSessionIndex : null;
  const selectedSessionDateFormatted = selectedSession
    ? new Date(selectedSession.dateTime).toLocaleDateString("es-AR", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "";

  return (
    <>
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
              <div className="flex items-center gap-2 mt-0.5">
                <h2 className="font-title font-bold text-2xl text-text-main">{patient.fullName}</h2>
                {patient.type && (
                  <span className={`text-[10px] font-title font-bold px-2.5 py-0.5 rounded-full ${
                    patient.type === 'adult'
                      ? 'bg-brand-indigo/10 text-brand-indigo border border-brand-indigo/20'
                      : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                  }`}>
                    {patient.type === 'adult' ? 'Adulto' : 'Infanto-Juvenil'}
                  </span>
                )}
                {patient.birthDate && (
                  <span className="text-sm text-text-sub font-semibold">
                    ({calculateAge(patient.birthDate)} años)
                  </span>
                )}
              </div>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-mono text-xs font-bold bg-brand-lavender/30 text-text-main border border-brand-lavender/40 px-3 py-1.5 rounded-xl shadow-sm select-none">
              Arancel: ${patient.sessionPrice.toLocaleString("es-AR")} ARS
            </span>
            <button
              onClick={() => onEdit(patient)}
              className="bg-bg-base hover:bg-brand-sand/20 border border-brand-sand text-brand-indigo font-title font-bold text-xs px-4 py-2 rounded-xl transition-all cursor-pointer shadow-sm flex items-center gap-1.5"
              title="Editar datos personales de la ficha del paciente"
            >
              ✏️ Editar Ficha
            </button>
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

                  // Resolving tag colors
                  const colorClasses: Record<string, string> = {
                    indigo: "bg-brand-indigo/20 text-brand-indigo border-brand-indigo/35",
                    rose: "bg-rose-100 text-rose-800 border-rose-200",
                    emerald: "bg-emerald-100 text-emerald-800 border-emerald-200",
                    amber: "bg-amber-100 text-amber-800 border-amber-200",
                  };
                  const colorTag = session.colorTag || "indigo";
                  const resolvedColor = colorClasses[colorTag] || colorClasses.indigo;

                  return (
                    <button
                      key={session.uuid}
                      onClick={() => {
                        setActiveTab("timeline");
                        setSelectedSessionUuid(session.uuid);
                      }}
                      className={`w-full text-left p-3 rounded-2xl transition-all cursor-pointer flex flex-col gap-1 group border ${
                        selectedSessionUuid === session.uuid
                          ? "bg-brand-indigo/15 border-brand-indigo/60 shadow-sm"
                          : "bg-bg-base/50 hover:bg-brand-indigo/10 border-brand-sand/30 hover:border-brand-indigo/35"
                      }`}
                    >
                      <div className="flex items-center justify-between w-full">
                        <span className="font-title font-bold text-xs text-text-main block group-hover:text-brand-indigo">
                          Sesión N° {sessionNumber}
                        </span>
                        <span className={`text-[8px] font-bold px-2 py-0.5 rounded-full border ${
                          session.status === "completed"
                            ? "bg-status-confirmed-light text-status-confirmed-dark border-status-confirmed-dark/20"
                            : session.status === "cancelled"
                            ? "bg-status-cancelled-light text-status-cancelled-dark border-status-cancelled-dark/20"
                            : "bg-brand-sand/30 text-text-sub border-brand-sand/55"
                        }`}>
                          {session.status === "completed" ? "Atendido" : session.status === "cancelled" ? "Cancelado" : "Programado"}
                        </span>
                      </div>
                      
                      {session.description && (
                        <p className="text-[11px] text-text-main font-semibold line-clamp-1">
                          {session.description}
                        </p>
                      )}

                      <div className="flex items-center justify-between mt-1">
                        <span className="text-[9px] text-text-sub font-mono">
                          {dateFormatted} hs
                        </span>
                        {session.colorTag && (
                          <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded border uppercase ${resolvedColor}`}>
                            {session.colorTag}
                          </span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Panel Derecho: Gran Editor Clínico Word-Like con Pestañas */}
          <div className="lg:col-span-9 space-y-4">
            {/* Tabs */}
            <div className="flex border-b border-brand-sand bg-bg-card p-1 rounded-t-3xl gap-4 px-6 pt-3">
              <button
                onClick={() => setActiveTab("timeline")}
                className={`pb-2.5 text-xs font-title font-bold transition-all border-b-2 cursor-pointer ${
                  activeTab === "timeline"
                    ? "border-brand-indigo text-brand-indigo"
                    : "border-transparent text-text-sub hover:text-text-main"
                }`}
              >
                📖 Expediente Continuo
              </button>
              <button
                onClick={() => setActiveTab("ceci")}
                className={`pb-2.5 text-xs font-title font-bold transition-all border-b-2 cursor-pointer ${
                  activeTab === "ceci"
                    ? "border-brand-indigo text-brand-indigo"
                    : "border-transparent text-text-sub hover:text-text-main"
                }`}
              >
                📋 Ficha CECI
              </button>
            </div>

            {activeTab === "timeline" ? (
              <div 
                ref={editorContainerRef}
                className="bg-white border border-brand-sand rounded-b-3xl p-6 md:p-8 shadow-md max-h-[75vh] overflow-y-auto space-y-4"
              >
                <div className="border-b border-brand-sand pb-4 flex items-center justify-between">
                  <div>
                    <h3 className="font-title font-bold text-base text-text-main">📖 Expediente Clínico Unificado</h3>
                    <p className="text-[10px] text-text-sub font-semibold mt-0.5">Formato compatible nativo con Microsoft Word</p>
                  </div>
                  <span className="text-[10px] text-text-sub/50 font-semibold italic">Guardado automático en IndexedDB</span>
                </div>

                {selectedSession && (
                  <div className="bg-bg-base/50 border-l-4 border-brand-indigo rounded-r-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm select-none">
                    <div>
                      <h4 className="font-title font-bold text-sm text-brand-indigo">
                        📅 Sesión N° {selectedSessionNumber} — {selectedSessionDateFormatted} hs
                      </h4>
                      {selectedSession.description && (
                        <p className="text-xs text-text-main font-semibold mt-1">
                          Motivo: {selectedSession.description}
                        </p>
                      )}
                    </div>
                    <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border self-start sm:self-auto uppercase tracking-wider ${
                      selectedSession.status === "completed"
                        ? "bg-status-confirmed-light text-status-confirmed-dark border-status-confirmed-dark/20"
                        : selectedSession.status === "cancelled"
                        ? "bg-status-cancelled-light text-status-cancelled-dark border-status-cancelled-dark/20"
                        : "bg-brand-sand/30 text-text-sub border-brand-sand/55"
                    }`}>
                      {selectedSession.status === "completed" ? "Atendido" : selectedSession.status === "cancelled" ? "Cancelado" : "Programado"}
                    </span>
                  </div>
                )}

                <div className="prose max-w-none">
                  <RichTextEditor
                    key={selectedSessionUuid}
                    initialValue={selectedSessionContentHtml}
                    onChange={handleHistoryChange}
                    onBlur={triggerAutoSyncIfPending}
                    placeholder="Comenzá a redactar la evolución clínica de esta sesión..."
                  />
                </div>
              </div>
            ) : (
              <div className="bg-white border border-brand-sand rounded-b-3xl p-6 md:p-8 shadow-md max-h-[75vh] overflow-y-auto space-y-6">
                <div>
                  <h3 className="font-title font-bold text-base text-text-main">📋 Ficha del Paciente (CECI)</h3>
                  <p className="text-[10px] text-text-sub font-semibold mt-0.5">Marco y variables clínicas estructuradas</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
                  <div className="md:col-span-2">
                    <label className="text-xs text-text-sub font-bold block mb-1">Convive Con</label>
                    <input
                      type="text"
                      value={patient.ceciConviveCon || ""}
                      onChange={(e) => handleCeciChange("ceciConviveCon", e.target.value)}
                      placeholder="Ej: Padres y un hermano menor..."
                      className="w-full bg-bg-base border border-brand-sand rounded-xl px-4 py-2 text-text-main placeholder:text-text-sub/30 focus:outline-none focus:border-brand-indigo focus:ring-1 focus:ring-brand-indigo text-xs cursor-pointer"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="text-xs text-text-sub font-bold block mb-1">Familia (Estructura familiar)</label>
                    <textarea
                      value={patient.ceciFamilia || ""}
                      onChange={(e) => handleCeciChange("ceciFamilia", e.target.value)}
                      placeholder="Describa la composición y dinámica familiar..."
                      className="w-full bg-bg-base border border-brand-sand rounded-xl px-4 py-2 text-text-main placeholder:text-text-sub/30 focus:outline-none focus:border-brand-indigo focus:ring-1 focus:ring-brand-indigo text-xs cursor-pointer h-20"
                    />
                  </div>

                  <div>
                    <label className="text-xs text-text-sub font-bold block mb-1">Ocupación</label>
                    <input
                      type="text"
                      value={patient.ceciOcupacion || ""}
                      onChange={(e) => handleCeciChange("ceciOcupacion", e.target.value)}
                      placeholder="Ej: Profesional independiente, Estudiante..."
                      className="w-full bg-bg-base border border-brand-sand rounded-xl px-4 py-2 text-text-main placeholder:text-text-sub/30 focus:outline-none focus:border-brand-indigo focus:ring-1 focus:ring-brand-indigo text-xs cursor-pointer"
                    />
                  </div>

                  <div>
                    <label className="text-xs text-text-sub font-bold block mb-1">Estudios</label>
                    <input
                      type="text"
                      value={patient.ceciEstudios || ""}
                      onChange={(e) => handleCeciChange("ceciEstudios", e.target.value)}
                      placeholder="Ej: Universitario en curso, Primario..."
                      className="w-full bg-bg-base border border-brand-sand rounded-xl px-4 py-2 text-text-main placeholder:text-text-sub/30 focus:outline-none focus:border-brand-indigo focus:ring-1 focus:ring-brand-indigo text-xs cursor-pointer"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="text-xs text-text-sub font-bold block mb-1">Tratamientos Anteriores</label>
                    <textarea
                      value={patient.ceciTratamientosAnteriores || ""}
                      onChange={(e) => handleCeciChange("ceciTratamientosAnteriores", e.target.value)}
                      placeholder="Detalle tratamientos psicológicos o psiquiátricos previos..."
                      className="w-full bg-bg-base border border-brand-sand rounded-xl px-4 py-2 text-text-main placeholder:text-text-sub/30 focus:outline-none focus:border-brand-indigo focus:ring-1 focus:ring-brand-indigo text-xs cursor-pointer h-20"
                    />
                  </div>

                  <div>
                    <label className="text-xs text-text-sub font-bold block mb-1">Inicio de Consulta</label>
                    <input
                      type="date"
                      value={patient.ceciInicioConsulta || ""}
                      onChange={(e) => handleCeciChange("ceciInicioConsulta", e.target.value)}
                      className="w-full bg-bg-base border border-brand-sand rounded-xl px-4 py-2 text-text-main focus:outline-none focus:border-brand-indigo focus:ring-1 focus:ring-brand-indigo text-xs cursor-pointer"
                    />
                  </div>

                  <div>
                    <label className="text-xs text-text-sub font-bold block mb-1">Día y Horario de Atención</label>
                    <input
                      type="text"
                      value={patient.ceciDiaHorarioAtencion || ""}
                      onChange={(e) => handleCeciChange("ceciDiaHorarioAtencion", e.target.value)}
                      placeholder="Ej: Miércoles 16:00 hs..."
                      className="w-full bg-bg-base border border-brand-sand rounded-xl px-4 py-2 text-text-main placeholder:text-text-sub/30 focus:outline-none focus:border-brand-indigo focus:ring-1 focus:ring-brand-indigo text-xs cursor-pointer"
                    />
                  </div>

                  <div>
                    <label className="text-xs text-text-sub font-bold block mb-1">Frecuencia del Tratamiento</label>
                    <input
                      type="text"
                      value={patient.ceciFrecuenciaTratamiento || ""}
                      onChange={(e) => handleCeciChange("ceciFrecuenciaTratamiento", e.target.value)}
                      placeholder="Ej: Semanal, Quincenal..."
                      className="w-full bg-bg-base border border-brand-sand rounded-xl px-4 py-2 text-text-main placeholder:text-text-sub/30 focus:outline-none focus:border-brand-indigo focus:ring-1 focus:ring-brand-indigo text-xs cursor-pointer"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="text-xs text-text-sub font-bold block mb-1">Datos Adicionales / Notas</label>
                    <textarea
                      value={patient.ceciDatosAdicionales || ""}
                      onChange={(e) => handleCeciChange("ceciDatosAdicionales", e.target.value)}
                      placeholder="Notas adicionales relevantes para la admisión..."
                      className="w-full bg-bg-base border border-brand-sand rounded-xl px-4 py-2 text-text-main placeholder:text-text-sub/30 focus:outline-none focus:border-brand-indigo focus:ring-1 focus:ring-brand-indigo text-xs cursor-pointer h-20"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </section>

    {/* Semáforo de Respaldo Flotante */}
    {googleToken && (
      <div className="fixed bottom-6 right-6 z-50 animate-in fade-in slide-in-from-bottom-4 duration-300 select-none">
        {syncStatus === "syncing" ? (
          <div className="bg-brand-indigo/90 backdrop-blur-md text-white border border-brand-indigo/40 px-5 py-3 rounded-full font-bold shadow-xl flex items-center gap-2 hover:scale-105 transition-transform duration-200">
            <span className="animate-spin text-sm">🌀</span> ☁️ Sincronizando en la nube...
          </div>
        ) : saveFeedback || hasPendingDriveUpload ? (
          <div className="bg-amber-500/90 backdrop-blur-md text-white border border-amber-400/40 px-5 py-3 rounded-full font-bold shadow-xl flex items-center gap-2 animate-pulse hover:scale-105 transition-transform duration-200">
            💾 Guardado en PC
          </div>
        ) : (
          <div className="bg-emerald-600/90 backdrop-blur-md text-white border border-emerald-500/40 px-5 py-3 rounded-full font-bold shadow-xl flex items-center gap-2 hover:scale-105 transition-transform duration-200">
            ☁️ Respaldo al día
          </div>
        )}
      </div>
    )}
    </>
  );
}
