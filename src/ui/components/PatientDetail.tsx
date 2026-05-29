"use client";

import { useState } from "react";
import { Patient } from "../../domain/patient.types";
import { Session } from "../../domain/session.types";
import { usePatientHistory } from "../hooks/usePatientHistory";
import { exportSessionToWord, exportFullHistoryToWord } from "../../infrastructure/export/docx-exporter";
import { RichTextEditor } from "./RichTextEditor";

interface PatientDetailProps {
  patient: Patient;
  onBack: () => void;
}

export function PatientDetail({ patient, onBack }: PatientDetailProps) {
  const {
    sessions,
    allSessionsCount,
    loading,
    searchTerm,
    setSearchTerm,
    saveNotes,
  } = usePatientHistory(patient.uuid);

  // Vista activa: 'timeline' (sesiones individuales) o 'unified' (historial continuado tipo hoja única)
  const [viewMode, setViewMode] = useState<"timeline" | "unified">("timeline");

  // Estado para controlar qué sesión se está editando activamente y sus textos locales temporales
  const [editingSessionUuid, setEditingSessionUuid] = useState<string | null>(null);
  const [tempNotes, setTempNotes] = useState<string>("");
  const [saveFeedback, setSaveFeedback] = useState<string | null>(null); // Uuid de la sesión guardada con éxito

  const handleStartEdit = (session: Session) => {
    setEditingSessionUuid(session.uuid);
    setTempNotes(session.notes || "");
  };

  const handleAutofillHeader = (session: Session) => {
    const sessionDate = new Date(session.dateTime).toLocaleDateString("es-AR", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

    const headerTemplate = `<h3 style="color: #4f46e5; margin-top: 0; margin-bottom: 8px; font-family: sans-serif;">EVOLUCIÓN CLÍNICA</h3><strong>Fecha:</strong> ${sessionDate}<br/><strong>Paciente:</strong> ${patient.fullName}<br/><br/><strong>Motivo de consulta / Evolución:</strong><br/>- &nbsp;`;
    setTempNotes(headerTemplate);
  };

  const handleSave = async (session: Session) => {
    try {
      await saveNotes(
        {
          uuid: session.uuid,
          dateTime: session.dateTime,
          status: session.status,
          priceAtSession: session.priceAtSession,
        },
        tempNotes
      );
      setEditingSessionUuid(null);
      setSaveFeedback(session.uuid);
      setTimeout(() => setSaveFeedback(null), 2000);
    } catch (err) {
      console.error("Error guardando notas clínicas:", err);
    }
  };

  const handleStatusChange = async (session: Session, newStatus: Session["status"]) => {
    try {
      await saveNotes(
        {
          uuid: session.uuid,
          dateTime: session.dateTime,
          status: newStatus,
          priceAtSession: session.priceAtSession,
        },
        session.notes || ""
      );
      setSaveFeedback(session.uuid);
      setTimeout(() => setSaveFeedback(null), 2000);
    } catch (err) {
      console.error("Error actualizando estado del turno:", err);
    }
  };

  return (
    <section className="space-y-6 animate-in fade-in duration-300">
      {/* Botón de volver y Cabecera del Paciente */}
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
            <span className="font-mono text-xs font-bold bg-brand-lavender/30 text-text-main border border-brand-lavender/40 px-3 py-1.5 rounded-xl shadow-sm">
              Honorario: ${patient.sessionPrice.toLocaleString("es-AR")} ARS
            </span>
            <span className="font-mono text-xs font-bold bg-brand-sand/20 text-text-sub border border-brand-sand/50 px-3 py-1.5 rounded-xl">
              Sesiones físicas: {allSessionsCount}
            </span>
          </div>
        </div>

        {/* Detalles de contacto rápidos */}
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

      {/* Control del Historial */}
      <div className="bg-bg-card border border-brand-sand rounded-3xl p-6 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-brand-sand/30 pb-4">
          <div>
            <h3 className="font-title font-bold text-lg text-text-main">Diario de Sesiones y Notas Clínicas</h3>
            <p className="text-xs text-text-sub font-medium mt-0.5">Gestión de evoluciones del paciente</p>
          </div>

          <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
            {/* Buscador */}
            <input
              type="text"
              placeholder="🔍 Buscar en notas..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-bg-base border border-brand-sand rounded-xl px-4 py-2 text-text-main placeholder:text-text-sub/50 focus:outline-none focus:border-brand-indigo focus:ring-1 focus:ring-brand-indigo text-xs w-full sm:w-44 transition-all cursor-pointer"
            />

            {/* Selector de Vista */}
            <div className="bg-bg-base p-1 rounded-xl border border-brand-sand flex text-[10px]">
              <button
                type="button"
                onClick={() => setViewMode("timeline")}
                className={`px-3 py-1 rounded-lg font-title font-bold transition-all cursor-pointer ${
                  viewMode === "timeline"
                    ? "bg-brand-indigo text-white shadow-sm"
                    : "text-text-sub hover:text-text-main"
                }`}
              >
                📅 Sesiones
              </button>
              <button
                type="button"
                onClick={() => setViewMode("unified")}
                className={`px-3 py-1 rounded-lg font-title font-bold transition-all cursor-pointer ${
                  viewMode === "unified"
                    ? "bg-brand-indigo text-white shadow-sm"
                    : "text-text-sub hover:text-text-main"
                }`}
              >
                📖 Continuo
              </button>
            </div>

            {/* Exportación Completa */}
            {sessions.length > 0 && (
              <button
                onClick={() => exportFullHistoryToWord(patient, sessions)}
                className="bg-brand-indigo hover:bg-brand-indigo/90 text-white font-title font-bold text-xs px-3 py-2 rounded-xl transition-all cursor-pointer shadow-sm"
                title="Exportar todo el historial clínico consolidado en un solo archivo de Word"
              >
                📥 Exportar Todo
              </button>
            )}
          </div>
        </div>

        {/* Timeline o Vista Unificada de sesiones */}
        {loading ? (
          <div className="py-16 text-center text-text-sub font-semibold">
            Cargando evoluciones de IndexedDB...
          </div>
        ) : sessions.length === 0 ? (
          <div className="py-16 text-center">
            <div className="h-16 w-16 bg-bg-base rounded-full flex items-center justify-center mx-auto mb-4 border border-brand-sand text-2xl">
              📝
            </div>
            <h4 className="font-title font-bold text-text-main mb-1">
              {searchTerm ? "No se encontraron coincidencias" : "No hay sesiones clínicas registradas"}
            </h4>
            <p className="text-xs text-text-sub max-w-sm mx-auto">
              {searchTerm
                ? "Probá ingresando otra palabra clave en el buscador superior."
                : "Las sesiones aparecerán aquí una vez que programes un turno en la Agenda y modifiques su estado o inicies su evolución clínica."}
            </p>
          </div>
        ) : viewMode === "unified" ? (
          /* VISTA UNIFICADA / DOSSIER CLÍNICO CONTINUO EDITABLE */
          <div className="bg-bg-base border border-brand-sand rounded-3xl p-6 md:p-8 space-y-8 max-h-[70vh] overflow-y-auto shadow-inner animate-in zoom-in-95 duration-300">
            <div className="border-b-2 border-brand-indigo/35 pb-4 mb-4 text-center">
              <h4 className="font-title font-bold text-base text-text-main">FICHA DE EVOLUCIÓN HISTÓRICA CONSOLIDADA (EDITABLE)</h4>
              <p className="text-[10px] text-text-sub uppercase font-bold tracking-wider mt-1">Hacé clic en cualquier sesión para redactar en tiempo real</p>
            </div>
            
            {[...sessions].reverse().map((session, index) => {
              const sessionDate = new Date(session.dateTime);
              const formattedDate = sessionDate.toLocaleDateString("es-AR", {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              });

              return (
                <div key={session.uuid} className="space-y-2 pb-6 border-b border-brand-sand/40 last:border-0 last:pb-0">
                  <div className="flex items-center justify-between text-[11px] font-title font-bold text-text-sub select-none pb-1">
                    <span className="capitalize">
                      📅 Sesión N° {index + 1} — {formattedDate}
                    </span>
                    <div className="flex items-center gap-2">
                      {/* Indicador de guardado exitoso */}
                      {saveFeedback === session.uuid && (
                        <span className="text-[9px] text-status-confirmed-dark font-bold animate-pulse">
                          Autoguardado...
                        </span>
                      )}
                      <select
                        value={session.status}
                        onChange={(e) => handleStatusChange(session, e.target.value as any)}
                        className="bg-transparent border-0 text-[10px] font-bold text-brand-indigo hover:text-brand-indigo/90 focus:outline-none cursor-pointer p-0"
                      >
                        <option value="scheduled">Programado</option>
                        <option value="completed">Atendido</option>
                        <option value="cancelled">Cancelado</option>
                        <option value="missed">Ausente</option>
                      </select>
                    </div>
                  </div>

                  <div className="pl-4 border-l border-brand-sand/65">
                    <RichTextEditor
                      variant="continuous"
                      initialValue={session.notes || ""}
                      onChange={async (newHtml) => {
                        await saveNotes(
                          {
                            uuid: session.uuid,
                            dateTime: session.dateTime,
                            status: session.status,
                            priceAtSession: session.priceAtSession,
                          },
                          newHtml
                        );
                        setSaveFeedback(session.uuid);
                        setTimeout(() => setSaveFeedback(null), 1500);
                      }}
                      placeholder="Escribí la evolución para esta sesión..."
                    />
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* VISTA POR TARJETAS INDIVIDUALES (LÍNEA DE TIEMPO) */
          <div className="space-y-6 relative before:absolute before:inset-y-0 before:left-6 before:w-0.5 before:bg-brand-sand/40">
            {sessions.map((session) => {
              const sessionDate = new Date(session.dateTime);
              const formattedDate = sessionDate.toLocaleDateString("es-AR", {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              });
              const isEditing = editingSessionUuid === session.uuid;
              const hasNotes = !!session.notes;

              return (
                <div key={session.uuid} className="relative pl-12 group animate-in slide-in-from-left-4 duration-300">
                  {/* Círculo indicador del timeline */}
                  <div className="absolute left-4 top-1.5 h-4.5 w-4.5 rounded-full border-2 border-brand-indigo bg-bg-card z-10 flex items-center justify-center transition-all group-hover:scale-110">
                    <div className="h-1.5 w-1.5 rounded-full bg-brand-indigo" />
                  </div>

                  {/* Caja de evolución */}
                  <div className="bg-bg-base/60 border border-brand-sand rounded-2xl p-5 space-y-4 hover:bg-bg-base transition-all hover:shadow-sm">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-brand-sand/30 pb-3">
                      <div>
                        <span className="font-title font-bold text-xs text-text-main block capitalize">
                          {formattedDate}
                        </span>
                        <span className="font-mono text-[9px] text-text-sub block mt-0.5">
                          ID Sesión: {session.uuid.substring(0, 8)}... | Importe: ${session.priceAtSession.toLocaleString("es-AR")} ARS
                        </span>
                      </div>

                      <div className="flex items-center gap-3">
                        {/* Indicador de guardado exitoso */}
                        {saveFeedback === session.uuid && (
                          <span className="text-[10px] text-status-confirmed-dark bg-status-confirmed-light border border-status-confirmed-dark/25 px-2 py-0.5 rounded-md font-bold animate-pulse">
                            ¡Guardado!
                          </span>
                        )}

                        {/* Selector de Estado */}
                        <select
                          value={session.status}
                          onChange={(e) => handleStatusChange(session, e.target.value as any)}
                          className="bg-bg-card border border-brand-sand rounded-xl px-2 py-1 text-[11px] font-title font-bold text-text-main focus:outline-none cursor-pointer"
                        >
                          <option value="scheduled">Programado</option>
                          <option value="completed">Atendido / Cerrado</option>
                          <option value="cancelled">Cancelado</option>
                          <option value="missed">Ausente</option>
                        </select>

                        {/* Botón Word */}
                        <button
                          onClick={() => exportSessionToWord(patient, session)}
                          className="bg-bg-card hover:bg-brand-sand/30 border border-brand-sand text-text-sub hover:text-text-main p-1.5 rounded-xl transition-all cursor-pointer text-xs"
                          title="Descargar Evolución (.doc / Word)"
                        >
                          💾 Word
                        </button>
                      </div>
                    </div>

                    {/* Sección del Editor / Contenido */}
                    {isEditing ? (
                      <div className="space-y-3 animate-in fade-in duration-200">
                        <div className="flex items-center justify-between">
                          <label className="text-[10px] text-brand-indigo font-bold uppercase tracking-wider block">
                            Editor Clínico Enriquecido
                          </label>
                          <button
                            type="button"
                            onClick={() => handleAutofillHeader(session)}
                            className="bg-brand-indigo/10 hover:bg-brand-indigo/20 text-brand-indigo text-[10px] font-bold px-2 py-0.5 rounded transition-all cursor-pointer"
                          >
                            ⚡ Autocompletar Cabecera
                          </button>
                        </div>
                        <RichTextEditor
                          initialValue={tempNotes}
                          onChange={setTempNotes}
                        />
                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => setEditingSessionUuid(null)}
                            className="text-text-sub hover:text-text-main text-[11px] font-title font-bold px-3 py-1.5 transition-all cursor-pointer"
                          >
                            Cancelar
                          </button>
                          <button
                            type="button"
                            onClick={() => handleSave(session)}
                            className="bg-brand-indigo hover:bg-brand-indigo/90 text-white font-title font-bold text-[11px] px-4 py-1.5 rounded-xl transition-all shadow-sm cursor-pointer"
                          >
                            Guardar Nota
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {hasNotes ? (
                          <div 
                            className="bg-bg-card border border-brand-sand/55 rounded-xl p-4 text-xs text-text-main max-h-96 overflow-y-auto font-sans leading-relaxed"
                            dangerouslySetInnerHTML={{ __html: session.notes || "" }}
                          />
                        ) : (
                          <div className="text-center py-6 border-2 border-dashed border-brand-sand rounded-xl bg-bg-card/40">
                            <span className="text-text-sub text-[11px] font-medium block">
                              No hay notas clínicas registradas para esta sesión.
                            </span>
                          </div>
                        )}

                        <div className="flex items-center justify-end">
                          <button
                            onClick={() => handleStartEdit(session)}
                            className="bg-brand-indigo/10 hover:bg-brand-indigo/20 text-brand-indigo hover:text-brand-indigo/90 font-title font-bold text-[11px] px-4 py-1.5 rounded-xl transition-all cursor-pointer shadow-sm"
                          >
                            {hasNotes ? "📝 Editar Evolución" : "✍️ Escribir Nota"}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
