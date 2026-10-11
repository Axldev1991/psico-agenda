"use client";

import { useRef, useState, useMemo, useEffect } from "react";
import { Patient } from "../../domain/patient.types";
import { RichTextEditor } from "./RichTextEditor";
import { usePatientDetail } from "../hooks/usePatientDetail";
import { extractHighlights } from "../../domain/patient.utils";
import { SessionSidebar } from "./SessionSidebar";
import { ActiveSessionHeader } from "./ActiveSessionHeader";
import { CeciForm } from "./CeciForm";
import { useSettings } from "../hooks/useSettings";
import { PatientDetailHeader } from "./patient-detail/PatientDetailHeader";
import { PatientArchivedNotice } from "./patient-detail/PatientArchivedNotice";
import { PatientSearchFilters } from "./patient-detail/PatientSearchFilters";
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

  const handleClearFilters = () => {
    setSearchQuery("");
    setSelectedMovementFilter("");
    setSelectedPunctuationFilter("");
  };

  return (
    <>
      <section className="space-y-6 animate-in fade-in duration-300">
        {/* Cabecera del Paciente */}
        <PatientDetailHeader patient={patient} onBack={onBack} onEdit={onEdit} />

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
            />

            {/* Panel Derecho: Gran Editor Clínico Word-Like con Pestañas */}
            <div className="lg:col-span-9 space-y-4">
              {/* Tabs */}
              <div className="flex border-b border-line bg-surface p-1 rounded-t-3xl gap-4 px-6 pt-3 shadow-xs">
                <button
                  onClick={() => setActiveTab("timeline")}
                  className={`pb-2.5 text-xs font-semibold transition-all border-b-2 cursor-pointer inline-flex items-center gap-1.5 ${
                    activeTab === "timeline"
                      ? "border-primary text-primary"
                      : "border-transparent text-ink-muted hover:text-ink"
                  }`}
                >
                  <Icon name="file" size={13} />
                  <span>Expediente Continuo</span>
                </button>
                <button
                  onClick={() => setActiveTab("ceci")}
                  className={`pb-2.5 text-xs font-semibold transition-all border-b-2 cursor-pointer inline-flex items-center gap-1.5 ${
                    activeTab === "ceci"
                      ? "border-primary text-primary"
                      : "border-transparent text-ink-muted hover:text-ink"
                  }`}
                >
                  <Icon name="folder" size={13} />
                  <span>Ficha CECI</span>
                </button>
              </div>

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
                    className="bg-surface border border-line rounded-b-3xl p-6 md:p-8 shadow-xs max-h-[75vh] overflow-y-auto space-y-4"
                  >
                    <div className="border-b border-line pb-4 flex items-center justify-between">
                      <div>
                        <h3 className="font-serif font-bold text-base text-ink">
                          Expediente Clínico Unificado
                        </h3>
                        <p className="text-xs text-ink-muted mt-0.5">
                          Formato compatible nativo con Microsoft Word
                        </p>
                      </div>
                      <span className="text-[10px] text-ink-muted/60 font-mono">
                        Guardado automático en IndexedDB
                      </span>
                    </div>

                    {selectedSession && selectedSessionNumber ? (
                      <div className="space-y-4">
                        <ActiveSessionHeader
                          selectedSession={selectedSession}
                          selectedSessionNumber={selectedSessionNumber}
                          selectedSessionDateFormatted={selectedSessionDateFormatted}
                          changeSessionDescription={changeSessionDescription}
                          changeSessionColor={changeSessionColor}
                        />

                        <RichTextEditor
                          key={selectedSession.uuid}
                          initialValue={selectedSessionContentHtml}
                          onChange={handleHistoryChange}
                          onBlur={triggerAutoSyncIfPending}
                          placeholder="Comenzá a redactar la evolución clínica de esta sesión..."
                        />
                      </div>
                    ) : (
                      <div className="text-center py-16 text-xs text-ink-muted font-medium bg-sand-light/30 rounded-2xl border border-dashed border-line">
                        No se encontraron sesiones que coincidan con los filtros de búsqueda.
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <CeciForm patient={patient} handleCeciChange={handleCeciChange} />
              )}
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
