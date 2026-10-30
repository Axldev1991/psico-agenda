"use client";

import { useRef, useState, useMemo, useEffect } from "react";
import { Patient } from "../../domain/patient.types";
import { RichTextEditor } from "./RichTextEditor";
import { usePatientDetail } from "../hooks/usePatientDetail";
import { extractHighlights, findInitialSession } from "../../domain/patient.utils";
import { useUIState } from "../context/UIContext";
import { SessionSidebar } from "./SessionSidebar";
import { ActiveSessionHeader } from "./ActiveSessionHeader";
import { useSettings } from "../hooks/useSettings";
import { PatientDetailHeader } from "./patient-detail/PatientDetailHeader";
import { PatientArchivedNotice } from "./patient-detail/PatientArchivedNotice";
import { PatientSearchFilters } from "./patient-detail/PatientSearchFilters";
import { PatientExtraNotes } from "./patient-detail/PatientExtraNotes";
import { SyncStatusBadge } from "./patient-detail/SyncStatusBadge";
import { Icon } from "./common/Icon";

interface PatientDetailProps {
  patient: Patient;
  onBack: () => void;
  onEdit: (patient: Patient) => void;
}

const defaultPunctuation = [
  { key: "yellow", color: "#FEF08A", label: "Amarillo" },
  { key: "green", color: "#BBF7D0", label: "Verde" },
  { key: "purple", color: "#E9D5FF", label: "Lavanda" },
  { key: "orange", color: "#FED7AA", label: "Arena" },
];

function rgbToHex(rgbStr: string): string {
  const match = rgbStr.match(/\d+/g);
  if (!match) return rgbStr;
  const r = parseInt(match[0], 10);
  const g = parseInt(match[1], 10);
  const b = parseInt(match[2], 10);
  return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1).toUpperCase();
}

function cleanHtmlText(html: string): string {
  return html.replace(/<[^>]*>/g, " ");
}

export function PatientDetail({ patient: initialPatient, onBack, onEdit }: PatientDetailProps) {
  const { targetSessionUuidForDetail, setTargetSessionUuidForDetail } = useUIState();
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
    createNewSession,
    handleHistoryChange,
    handleRetryDownload,
    changeSessionColor,
    changeSessionDescription,
    changeSessionPayment,
  } = usePatientDetail(initialPatient, targetSessionUuidForDetail);

  useEffect(() => {
    if (targetSessionUuidForDetail) {
      setTargetSessionUuidForDetail(null);
    }
  }, [targetSessionUuidForDetail, setTargetSessionUuidForDetail]);

  const [activeTab, setActiveTab] = useState<"timeline" | "notes">("timeline");
  const editorContainerRef = useRef<HTMLDivElement>(null);

  // Filtros de búsqueda facetada
  const { movementConfigs, punctuationConfigs } = useSettings();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedMovementFilter, setSelectedMovementFilter] = useState("");
  const [selectedPunctuationFilter, setSelectedPunctuationFilter] = useState("");

  const configsToUse = punctuationConfigs.length > 0 ? punctuationConfigs : defaultPunctuation;

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
        const config = configsToUse.find((c) => c.key === selectedPunctuationFilter);
        if (!config) return false;

        const sessionSnippets = extractHighlights(session.notes || "", [session]);
        if (sessionSnippets.length === 0) return false;

        const configColorHex = config.color.toUpperCase();
        const hasMatch = sessionSnippets.some((snippet) => {
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
      const isSelectedInFiltered = filteredSessions.some((s) => s.uuid === selectedSessionUuid);
      if (!isSelectedInFiltered) {
        const fallback = findInitialSession(filteredSessions);
        setSelectedSessionUuid(fallback?.uuid || filteredSessions[0].uuid);
      }
    } else {
      setSelectedSessionUuid(null);
    }
  }, [filteredSessions, selectedSessionUuid, setSelectedSessionUuid]);

  const selectedSessionIndex = sortedSessions.findIndex((s) => s.uuid === selectedSessionUuid);
  const selectedSession = selectedSessionIndex !== -1 ? sortedSessions[selectedSessionIndex] : null;
  const selectedSessionNumber = selectedSession ? sortedSessions.length - selectedSessionIndex : null;

  const selectedSessionDateFormatted = selectedSession
    ? (() => {
        const d = new Date(selectedSession.dateTime);
        const day = d.toLocaleDateString("es-AR", {
          weekday: "long",
          year: "numeric",
          month: "long",
          day: "numeric",
        });
        const hours = String(d.getHours()).padStart(2, "0");
        const minutes = String(d.getMinutes()).padStart(2, "0");
        return `${day}, ${hours}:${minutes} hs`;
      })()
    : "";

  const handleClearFilters = () => {
    setSearchQuery("");
    setSelectedMovementFilter("");
    setSelectedPunctuationFilter("");
  };

  return (
    <>
      <section className="space-y-6 view-transition">
        {/* Cabecera del Paciente */}
        <PatientDetailHeader patient={patient} sessions={sortedSessions} onBack={onBack} onEdit={onEdit} />

        {/* Workspace o Alerta de Lazy Loading */}
        {patient.isHistoryLoaded === false ? (
          <PatientArchivedNotice
            isDownloading={isDownloading}
            downloadError={downloadError}
            onRetryDownload={handleRetryDownload}
          />
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Barra Lateral Izquierda: Anclas de Sesiones */}
            <SessionSidebar
              sortedSessions={filteredSessions}
              allSessions={sortedSessions}
              selectedSessionUuid={selectedSessionUuid}
              setSelectedSessionUuid={setSelectedSessionUuid}
              setActiveTab={setActiveTab}
              onCreateSession={createNewSession}
            />

            {/* Panel Derecho: Gran Editor Clínico Word-Like con Pestañas */}
            <div className="lg:col-span-9 space-y-4">
              {/* Tabs */}
              <div className="flex border-b border-line bg-surface p-1 rounded-t-3xl gap-4 px-6 pt-3 shadow-xs">
                <button
                  onClick={() => setActiveTab("timeline")}
                  className={`pb-2.5 text-base font-semibold transition-all border-b-2 cursor-pointer inline-flex items-center gap-1.5 ${
                    activeTab === "timeline"
                      ? "border-primary text-primary"
                      : "border-transparent text-ink-muted hover:text-ink"
                  }`}
                >
                  <Icon name="file" size={13} />
                  <span>Expediente Continuo</span>
                </button>
                <button
                  onClick={() => setActiveTab("notes")}
                  className={`pb-2.5 text-base font-semibold transition-all border-b-2 cursor-pointer inline-flex items-center gap-1.5 ${
                    activeTab === "notes"
                      ? "border-primary text-primary"
                      : "border-transparent text-ink-muted hover:text-ink"
                  }`}
                >
                  <Icon name="pin" size={13} />
                  <span>Anotaciones Extras</span>
                </button>
              </div>

              <div key={activeTab} className="view-transition">
                {activeTab === "timeline" ? (
                  <div className="space-y-4">
                    {/* Barra de Filtros Facetados */}
                    <PatientSearchFilters
                      searchQuery={searchQuery}
                      onSearchQueryChange={setSearchQuery}
                      selectedMovementFilter={selectedMovementFilter}
                      onMovementFilterChange={setSelectedMovementFilter}
                      movementConfigs={movementConfigs}
                      selectedPunctuationFilter={selectedPunctuationFilter}
                      onPunctuationFilterChange={setSelectedPunctuationFilter}
                      punctuationConfigs={configsToUse}
                      onClearFilters={handleClearFilters}
                    />

                    <div
                      ref={editorContainerRef}
                      className="bg-surface border border-line rounded-b-3xl p-6 md:p-8 shadow-xs max-h-[82vh] overflow-y-auto space-y-4"
                    >
                      <div className="border-b border-line pb-4">
                        <h3 className="font-serif font-bold text-base text-ink">
                          Expediente Clínico Unificado
                        </h3>
                        <p className="text-sm text-ink-sub mt-0.5">
                          Formato compatible nativo con Microsoft Word
                        </p>
                      </div>

                      {selectedSession && selectedSessionNumber ? (
                        <div key={selectedSession.uuid} className="space-y-4 view-transition">
                          <ActiveSessionHeader
                            selectedSession={selectedSession}
                            selectedSessionNumber={selectedSessionNumber}
                            selectedSessionDateFormatted={selectedSessionDateFormatted}
                            changeSessionDescription={changeSessionDescription}
                            changeSessionColor={changeSessionColor}
                            changeSessionPayment={changeSessionPayment}
                          />

                          <RichTextEditor
                            key={selectedSession.uuid}
                            initialValue={selectedSessionContentHtml}
                            onChange={handleHistoryChange}
                            onBlur={triggerAutoSyncIfPending}
                            placeholder="Comenzá a redactar la evolución clínica de esta sesión..."
                          />
                        </div>
                      ) : sortedSessions.length === 0 ? (
                        <div className="text-center py-14 px-6 bg-surface border border-dashed border-line rounded-2xl shadow-xs space-y-4">
                          <div className="w-12 h-12 mx-auto rounded-full bg-primary-tint text-primary flex items-center justify-center">
                            <Icon name="file" size={24} />
                          </div>
                          <div className="space-y-1">
                            <h4 className="font-semibold text-base text-ink">
                              Aún no hay evoluciones registradas para este paciente
                            </h4>
                            <p className="text-sm text-ink-sub max-w-md mx-auto">
                              Podés iniciar una nueva evolución clínica ahora para comenzar a redactar las notas de la sesión.
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => createNewSession()}
                            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-white text-base font-semibold hover:bg-primary-hover active:scale-95 transition-all shadow-sm cursor-pointer"
                          >
                            <Icon name="plus" size={16} />
                            <span>Iniciar nueva evolución clínica</span>
                          </button>
                        </div>
                      ) : (
                        <div className="text-center py-16 text-base text-ink-sub font-medium bg-bg-base/50 rounded-2xl border border-dashed border-line">
                          No se encontraron sesiones que coincidan con los filtros de búsqueda.
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <PatientExtraNotes patientUuid={patient.uuid} />
                )}
              </div>
            </div>
          </div>
        )}
      </section>

      {/* Semáforo de Respaldo Flotante */}
      <SyncStatusBadge
        googleToken={googleToken}
        syncStatus={syncStatus}
        isLocalSaving={isLocalSaving}
        saveFeedback={saveFeedback}
        hasPendingDriveUpload={hasPendingDriveUpload}
      />
    </>
  );
}
