"use client";

import { useRef, useState, useMemo, useEffect } from "react";
import { Patient } from "../../domain/patient.types";
import { exportFullHistoryToWord } from "../../infrastructure/export/docx-exporter";
import { RichTextEditor } from "./RichTextEditor";
import { usePatientDetail } from "../hooks/usePatientDetail";
import { calculateAge, extractHighlights } from "../../domain/patient.utils";
import { SessionSidebar } from "./SessionSidebar";
import { ActiveSessionHeader } from "./ActiveSessionHeader";
import { CeciForm } from "./CeciForm";
import { useSettings } from "../hooks/useSettings";

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
    isLocalSaving,
    hasPendingDriveUpload,
    syncStatus,
    triggerAutoSyncIfPending,
    isDownloading,
    downloadError,
    googleToken,
    handleHistoryChange,
    handleRetryDownload,
    handleCeciChange,
    changeSessionColor,
    changeSessionDescription,
  } = usePatientDetail(initialPatient);

  const [activeTab, setActiveTab] = useState<"timeline" | "ceci">("timeline");
  const editorContainerRef = useRef<HTMLDivElement>(null);

  // Filtros de búsqueda facetada
  const { movementConfigs, punctuationConfigs } = useSettings();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedMovementFilter, setSelectedMovementFilter] = useState("");
  const [selectedPunctuationFilter, setSelectedPunctuationFilter] = useState("");

  const defaultPunctuation = [
    { key: "yellow", color: "#FEF08A", label: "Amarillo" },
    { key: "green", color: "#BBF7D0", label: "Verde" },
    { key: "purple", color: "#E9D5FF", label: "Lavanda" },
    { key: "orange", color: "#FED7AA", label: "Arena" }
  ];
  const configsToUse = punctuationConfigs.length > 0 ? punctuationConfigs : defaultPunctuation;

  const rgbToHex = (rgbStr: string) => {
    const match = rgbStr.match(/\d+/g);
    if (!match) return rgbStr;
    const r = parseInt(match[0]);
    const g = parseInt(match[1]);
    const b = parseInt(match[2]);
    return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1).toUpperCase();
  };

  const cleanHtmlText = (html: string) => {
    return html.replace(/<[^>]*>/g, " ");
  };

  // Filtrado de sesiones reactivo
  const filteredSessions = useMemo(() => {
    return sortedSessions.filter((session) => {
      // 1. Filtro por Movimiento
      if (selectedMovementFilter) {
        if ((session.colorTag || "indigo") !== selectedMovementFilter) {
          return false;
        }
      }

      // 2. Filtro por Puntuación (Resaltado)
      if (selectedPunctuationFilter) {
        const config = configsToUse.find(c => c.key === selectedPunctuationFilter);
        if (!config) return false;
        
        // Extraemos marcaciones de esta única sesión
        const sessionSnippets = extractHighlights(session.notes || "", [session]);
        if (sessionSnippets.length === 0) return false;

        const configColorHex = config.color.toUpperCase();
        const hasMatch = sessionSnippets.some(snippet => {
          const snippetColor = snippet.color.startsWith("rgb") 
            ? rgbToHex(snippet.color) 
            : snippet.color.toUpperCase();
          return snippetColor === configColorHex;
        });
        if (!hasMatch) return false;
      }

      // 3. Filtro por palabra clave o frase en evolución o tema
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const cleanNotes = cleanHtmlText(session.notes || "").toLowerCase();
        const cleanDescription = (session.description || "").toLowerCase();
        if (!cleanNotes.includes(query) && !cleanDescription.includes(query)) {
          return false;
        }
      }

      return true;
    });
  }, [sortedSessions, searchQuery, selectedMovementFilter, selectedPunctuationFilter, configsToUse]);

  // Selección automática de la sesión al filtrar
  useEffect(() => {
    if (filteredSessions.length > 0) {
      const isSelectedInFiltered = filteredSessions.some(s => s.uuid === selectedSessionUuid);
      if (!isSelectedInFiltered) {
        setSelectedSessionUuid(filteredSessions[0].uuid);
      }
    } else {
      setSelectedSessionUuid(null);
    }
  }, [filteredSessions, selectedSessionUuid, setSelectedSessionUuid]);

  const selectedSessionIndex = sortedSessions.findIndex((s) => s.uuid === selectedSessionUuid);
  const selectedSession = selectedSessionIndex !== -1 ? sortedSessions[selectedSessionIndex] : null;
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
          <SessionSidebar
            sortedSessions={filteredSessions}
            allSessions={sortedSessions}
            selectedSessionUuid={selectedSessionUuid}
            setSelectedSessionUuid={setSelectedSessionUuid}
            setActiveTab={setActiveTab}
          />

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
              <div className="space-y-4">
                {/* Barra de Filtros Facetados (Buscador) */}
                <div className="bg-bg-card border border-brand-sand rounded-3xl p-5 shadow-sm space-y-3.5">
                  <div className="flex flex-col lg:flex-row gap-3">
                    <div className="flex-1">
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Buscar por palabra, frase o tema en el expediente..."
                        className="w-full bg-bg-base/30 border border-brand-sand/40 hover:border-brand-sand/70 focus:border-brand-indigo focus:bg-white focus:outline-none px-4 py-2 text-xs font-semibold text-text-main rounded-2xl transition-all"
                      />
                    </div>
                    
                    <div className="flex flex-wrap items-center gap-3">
                      <select
                        value={selectedMovementFilter}
                        onChange={(e) => setSelectedMovementFilter(e.target.value)}
                        className="bg-bg-base/30 border border-brand-sand/40 hover:border-brand-sand/70 focus:border-brand-indigo focus:bg-white focus:outline-none px-3.5 py-2 text-xs font-semibold text-text-main rounded-2xl transition-all cursor-pointer min-w-[170px]"
                      >
                        <option value="">Todos los movimientos</option>
                        {movementConfigs.map(m => (
                          <option key={m.key} value={m.key}>{m.label}</option>
                        ))}
                      </select>

                      <select
                        value={selectedPunctuationFilter}
                        onChange={(e) => setSelectedPunctuationFilter(e.target.value)}
                        className="bg-bg-base/30 border border-brand-sand/40 hover:border-brand-sand/70 focus:border-brand-indigo focus:bg-white focus:outline-none px-3.5 py-2 text-xs font-semibold text-text-main rounded-2xl transition-all cursor-pointer min-w-[170px]"
                      >
                        <option value="">Todas las puntuaciones</option>
                        {configsToUse.map(p => (
                          <option key={p.key} value={p.key}>{p.label}</option>
                        ))}
                      </select>

                      {(searchQuery || selectedMovementFilter || selectedPunctuationFilter) && (
                        <button
                          onClick={() => {
                            setSearchQuery("");
                            setSelectedMovementFilter("");
                            setSelectedPunctuationFilter("");
                          }}
                          className="text-xs text-brand-indigo hover:text-brand-indigo/80 font-bold transition-colors cursor-pointer whitespace-nowrap px-1"
                          type="button"
                        >
                          Limpiar filtros
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                <div 
                  ref={editorContainerRef}
                  className="bg-white border border-brand-sand rounded-b-3xl p-6 md:p-8 shadow-md max-h-[75vh] overflow-y-auto space-y-4"
                >
                  <div className="border-b border-brand-sand pb-4 flex items-center justify-between">
                    <div>
                      <h3 className="font-title font-bold text-base text-text-main">Expediente Clínico Unificado</h3>
                      <p className="text-[10px] text-text-sub font-semibold mt-0.5">Formato compatible nativo con Microsoft Word</p>
                    </div>
                    <span className="text-[10px] text-text-sub/50 font-semibold italic">Guardado automático en IndexedDB</span>
                  </div>

                  {selectedSession && (
                    <ActiveSessionHeader
                      selectedSession={selectedSession}
                      selectedSessionNumber={selectedSessionNumber}
                      selectedSessionDateFormatted={selectedSessionDateFormatted}
                      changeSessionDescription={changeSessionDescription}
                      changeSessionColor={changeSessionColor}
                    />
                  )}

                  {selectedSession ? (
                    <div className="prose max-w-none">
                      <RichTextEditor
                        key={selectedSessionUuid || "empty"}
                        initialValue={selectedSessionContentHtml}
                        onChange={handleHistoryChange}
                        onBlur={triggerAutoSyncIfPending}
                        placeholder="Comenzá a redactar la evolución clínica de esta sesión..."
                      />
                    </div>
                  ) : (
                    <div className="text-center py-16 text-xs text-text-sub/70 font-semibold bg-bg-base/10 rounded-2xl border border-dashed border-brand-sand/60">
                      No se encontraron sesiones que coincidan con los filtros de búsqueda.
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <CeciForm
                patient={patient}
                handleCeciChange={handleCeciChange}
              />
            )}
          </div>
        </div>
      )}
    </section>

    {/* Semáforo de Respaldo Flotante */}
    <div className="fixed bottom-6 right-6 z-50 animate-in fade-in slide-in-from-bottom-4 duration-300 select-none">
      {googleToken ? (
        syncStatus === "syncing" ? (
          <div className="bg-brand-indigo/90 backdrop-blur-md text-white border border-brand-indigo/40 px-5 py-3 rounded-full font-bold shadow-xl flex items-center gap-2 hover:scale-105 transition-transform duration-200">
            <span className="animate-spin text-sm">🌀</span> Sincronizando en la nube...
          </div>
        ) : isLocalSaving ? (
          <div className="bg-amber-500/90 backdrop-blur-md text-white border border-amber-400/40 px-5 py-3 rounded-full font-bold shadow-xl flex items-center gap-2 animate-pulse hover:scale-105 transition-transform duration-200">
            Guardando en PC...
          </div>
        ) : saveFeedback || hasPendingDriveUpload ? (
          <div className="bg-amber-500/90 backdrop-blur-md text-white border border-amber-400/40 px-5 py-3 rounded-full font-bold shadow-xl flex items-center gap-2 hover:scale-105 transition-transform duration-200">
            Guardando en PC
          </div>
        ) : (
          <div className="bg-emerald-600/90 backdrop-blur-md text-white border border-emerald-500/40 px-5 py-3 rounded-full font-bold shadow-xl flex items-center gap-2 hover:scale-105 transition-transform duration-200">
            Respaldo al día
          </div>
        )
      ) : (
        isLocalSaving ? (
          <div className="bg-amber-500/90 backdrop-blur-md text-white border border-amber-400/40 px-5 py-3 rounded-full font-bold shadow-xl flex items-center gap-2 animate-pulse hover:scale-105 transition-transform duration-200">
            Guardando en PC...
          </div>
        ) : saveFeedback ? (
          <div className="bg-emerald-600/90 backdrop-blur-md text-white border border-emerald-500/40 px-5 py-3 rounded-full font-bold shadow-xl flex items-center gap-2 hover:scale-105 transition-transform duration-200 animate-bounce">
            ¡Guardado en PC!
          </div>
        ) : (
          <div className="bg-slate-600/90 backdrop-blur-md text-white border border-slate-500/40 px-5 py-3 rounded-full font-bold shadow-xl flex items-center gap-2 hover:scale-105 transition-transform duration-200 opacity-80">
            Guardado en PC (Sin conexión)
          </div>
        )
      )}
    </div>
    </>
  );
}
