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
        ) : (
          /* DOSSIER CLÍNICO CONTINUO EDITABLE ÚNICO (ÚLTIMA SESIÓN PRIMERO) */
          <div className="bg-bg-base border border-brand-sand rounded-3xl p-6 md:p-8 space-y-8 max-h-[70vh] overflow-y-auto shadow-inner animate-in zoom-in-95 duration-300">
            <div className="border-b-2 border-brand-indigo/35 pb-4 mb-4 text-center">
              <h4 className="font-title font-bold text-base text-text-main">FICHA DE EVOLUCIÓN HISTÓRICA CONSOLIDADA</h4>
              <p className="text-[10px] text-text-sub uppercase font-bold tracking-wider mt-1">Hacé clic en cualquier sesión para redactar en tiempo real (más recientes primero)</p>
            </div>
            
            {sessions.map((session, index) => {
              const sessionDate = new Date(session.dateTime);
              const formattedDate = sessionDate.toLocaleDateString("es-AR", {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              });

              // La primera que se renderiza (index 0) es la última cronológicamente (más nueva)
              const sessionNumber = allSessionsCount - index;

              return (
                <div key={session.uuid} className="space-y-2 pb-6 border-b border-brand-sand/40 last:border-0 last:pb-0">
                  <div className="flex items-center justify-between text-[11px] font-title font-bold text-text-sub select-none pb-1">
                    <span className="capitalize">
                      📅 Sesión N° {sessionNumber} — {formattedDate}
                    </span>
                    <div className="flex items-center gap-2">
                      {/* Indicador de guardado exitoso */}
                      {saveFeedback === session.uuid && (
                        <span className="text-[9px] text-status-confirmed-dark font-bold animate-pulse">
                          Autoguardado...
                        </span>
                      )}
                      {/* Botón Word Individual */}
                      <button
                        onClick={() => exportSessionToWord(patient, session)}
                        className="bg-transparent hover:bg-brand-sand/30 text-text-sub hover:text-text-main px-1.5 py-0.5 rounded transition-all cursor-pointer text-[10px] font-bold"
                        title="Exportar esta sesión individual a Word"
                      >
                        💾 Word
                      </button>
                      <span className="text-brand-sand/80">•</span>
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
        )}
      </div>
    </section>
  );
}
