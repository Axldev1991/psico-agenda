"use client";

import { useState, useEffect } from "react";
import { driveLogger } from "../infrastructure/drive/drive-logger";
import { usePatients } from "../ui/hooks/usePatients";
import { useCalendar } from "../ui/hooks/useCalendar";
import { useGoogleDrive } from "../ui/hooks/useGoogleDrive";
import { PatientModal } from "../ui/components/PatientModal";
import { SessionModal } from "../ui/components/SessionModal";
import { PatientManager } from "../ui/components/PatientManager";
import { CalendarGrid } from "../ui/components/CalendarGrid";
import { PatientDetail } from "../ui/components/PatientDetail";
import { Patient } from "../domain/patient.types";

export default function Home() {
  const { patients, loading: loadingPatients, addPatient, removePatient, updatePatient } = usePatients();
  const {
    currentDate,
    weekDays,
    agenda,
    nextWeek,
    prevWeek,
    goToToday,
    selectDate,
    addManualSession,
    addRecurrence,
    updateSessionStatus,
    removeRecurrenceRule,
    holidays,
    dbSessions,
    recurrenceRules,
  } = useCalendar();

  // Integración de Sincronización Google Drive
  const {
    googleToken,
    loading: loadingDrive,
    syncStatus,
    lastSynced,
    errorMessage,
    connectGoogle,
    disconnectGoogle,
    performSync,
    preloadAllForOffline,
  } = useGoogleDrive();

  // Vista activa: 'calendar' o 'patients'
  const [activeTab, setActiveTab] = useState<"calendar" | "patients">("calendar");
  const [selectedPatientForDetail, setSelectedPatientForDetail] = useState<Patient | null>(null);
  const [patientToEdit, setPatientToEdit] = useState<Patient | null>(null);

  const handleNavigateToPatientDetail = (patientUuid: string) => {
    const patient = patients.find((p) => p.uuid === patientUuid);
    if (patient) {
      setSelectedPatientForDetail(patient);
      setActiveTab("patients");
    }
  };

  const handleOpenNewPatientModal = () => {
    setPatientToEdit(null);
    setShowPatientModal(true);
  };

  const handleUpdatePatient = async (uuid: string, patientData: any) => {
    await updatePatient(uuid, patientData);
    const updated = patients.find((p) => p.uuid === uuid);
    if (updated) {
      setSelectedPatientForDetail({ ...updated, ...patientData });
    }
  };

  // Estados comunes de UI para modales y pánico
  const [showPatientModal, setShowPatientModal] = useState(false);
  const [showSessionModal, setShowSessionModal] = useState(false);
  const [isBlurred, setIsBlurred] = useState(false); // Botón de privacidad
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Estados de la consola de logs
  const [logs, setLogs] = useState<any[]>([]);
  const [isConsoleOpen, setIsConsoleOpen] = useState(false);

  useEffect(() => {
    // Cargar logs existentes al montar
    setLogs(driveLogger.getLogs());

    // Suscribirse a actualizaciones
    const unsubscribe = driveLogger.subscribe(() => {
      setLogs(driveLogger.getLogs());
    });

    return () => unsubscribe();
  }, []);

  return (
    <div className="min-h-screen bg-bg-base text-text-main font-sans antialiased selection:bg-brand-indigo/20 flex flex-col md:flex-row">
      {/* Mobile Top Header (only on small screens) */}
      <header className="md:hidden flex items-center justify-between px-4 h-16 bg-bg-card border-b border-brand-sand sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-brand-indigo to-brand-blue flex items-center justify-center font-bold text-white shadow-sm shadow-brand-indigo/20 font-title text-lg">
            Ψ
          </div>
          <div>
            <span className="font-title font-bold text-base tracking-tight text-text-main">
              PSICO-AGENDA
            </span>
          </div>
        </div>
        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="p-2 text-text-main focus:outline-none hover:bg-brand-sand/35 rounded-lg"
          aria-label="Toggle menu"
        >
          {isMobileMenuOpen ? "✕" : "☰"}
        </button>
      </header>

      {/* Mobile Menu Backdrop */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40 md:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar Navigation Panel */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 md:sticky md:flex flex-col justify-between bg-bg-card border-r border-brand-sand transition-all duration-300 ease-in-out ${
          isMobileMenuOpen ? "translate-x-0 w-64" : "-translate-x-full md:translate-x-0"
        } ${isSidebarCollapsed ? "md:w-20" : "md:w-64"} h-screen`}
      >
        {/* Sidebar Header */}
        <div className="flex flex-col">
          <div className="flex items-center justify-between p-4 border-b border-brand-sand h-16">
            <div className="flex items-center gap-3 overflow-hidden">
              <div className="h-10 w-10 shrink-0 rounded-xl bg-gradient-to-tr from-brand-indigo to-brand-blue flex items-center justify-center font-bold text-white shadow-sm shadow-brand-indigo/20 font-title text-lg">
                Ψ
              </div>
              <div className={`transition-all duration-300 ${isSidebarCollapsed ? "opacity-0 md:w-0" : "opacity-100"}`}>
                <span className="font-title font-bold text-base tracking-tight text-text-main whitespace-nowrap">
                  PSICO-AGENDA
                </span>
                <span className="text-[9px] block text-text-sub font-medium leading-none whitespace-nowrap">Datos Clínicos</span>
              </div>
            </div>
            
            {/* Collapse toggle button (desktop only) */}
            <button
              onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
              className="hidden md:block p-1 hover:bg-brand-sand/35 rounded-lg text-text-sub hover:text-text-main transition-colors cursor-pointer"
              title={isSidebarCollapsed ? "Expandir" : "Colapsar"}
            >
              {isSidebarCollapsed ? "≫" : "≪"}
            </button>
          </div>

          {/* Navigation Links */}
          <nav className="p-3 space-y-1">
            <button
              onClick={() => {
                setActiveTab("calendar");
                setSelectedPatientForDetail(null);
                setIsMobileMenuOpen(false);
              }}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-title font-bold transition-all cursor-pointer ${
                activeTab === "calendar"
                  ? "bg-brand-indigo text-white shadow-sm"
                  : "text-text-sub hover:text-text-main hover:bg-brand-sand/20"
              } ${isSidebarCollapsed ? "md:justify-center" : ""}`}
              title="Agenda"
            >
              <span className="text-base">📅</span>
              <span className={`transition-opacity duration-300 ${isSidebarCollapsed ? "md:hidden" : "opacity-100"}`}>
                Agenda
              </span>
            </button>

            <button
              onClick={() => {
                setActiveTab("patients");
                setSelectedPatientForDetail(null);
                setIsMobileMenuOpen(false);
              }}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-title font-bold transition-all cursor-pointer ${
                activeTab === "patients"
                  ? "bg-brand-indigo text-white shadow-sm"
                  : "text-text-sub hover:text-text-main hover:bg-brand-sand/20"
              } ${isSidebarCollapsed ? "md:justify-center" : ""}`}
              title="Fichero"
            >
              <span className="text-base">📂</span>
              <span className={`transition-opacity duration-300 ${isSidebarCollapsed ? "md:hidden" : "opacity-100"}`}>
                Fichero
              </span>
            </button>
          </nav>

          {/* Action Buttons inside Nav */}
          <div className="p-3 border-t border-brand-sand/50">
            {activeTab === "patients" ? (
              <button
                onClick={() => {
                  handleOpenNewPatientModal();
                  setIsMobileMenuOpen(false);
                }}
                className="w-full bg-brand-indigo hover:bg-brand-indigo/90 text-white font-title font-bold text-xs py-2.5 rounded-xl transition-all shadow-sm cursor-pointer flex items-center justify-center gap-2"
                title="Nuevo Paciente"
              >
                <span>+</span>
                <span className={`${isSidebarCollapsed ? "md:hidden" : ""}`}>Nuevo Paciente</span>
              </button>
            ) : (
              <button
                onClick={() => {
                  setShowSessionModal(true);
                  setIsMobileMenuOpen(false);
                }}
                className="w-full bg-brand-indigo hover:bg-brand-indigo/90 text-white font-title font-bold text-xs py-2.5 rounded-xl transition-all shadow-sm cursor-pointer flex items-center justify-center gap-2"
                title="Programar Turno"
              >
                <span>+</span>
                <span className={`${isSidebarCollapsed ? "md:hidden" : ""}`}>Programar Turno</span>
              </button>
            )}
          </div>
        </div>

        {/* Sidebar Footer Controls (Google Drive & Privacy) */}
        <div className="p-3 border-t border-brand-sand space-y-3 bg-bg-card">
          {/* Google Drive Status Section */}
          <div className="space-y-2">
            {googleToken ? (
              <div className="bg-bg-base border border-brand-sand p-2 rounded-xl text-xs shadow-sm space-y-2">
                <div className={`flex items-center gap-2 ${isSidebarCollapsed ? "md:justify-center" : ""}`}>
                  <span className="flex h-2 w-2 shrink-0 rounded-full bg-status-confirmed-dark animate-pulse" />
                  <span className={`font-bold text-[10px] text-text-main ${isSidebarCollapsed ? "md:hidden" : ""}`}>
                    Nube Activa
                  </span>
                </div>
                {!isSidebarCollapsed && lastSynced && (
                  <div className="text-[9px] text-text-sub font-mono leading-none">
                    Sync: {syncStatus === "syncing" ? "Sincronizando..." : lastSynced}
                  </div>
                )}
                <div className={`flex ${isSidebarCollapsed ? "md:flex-col md:items-center" : "flex-row"} gap-1.5 justify-start`}>
                  <button
                    onClick={performSync}
                    disabled={loadingDrive}
                    title="Sincronizar ahora"
                    className="bg-brand-indigo/10 hover:bg-brand-indigo/20 text-brand-indigo p-1.5 rounded-lg cursor-pointer transition-colors text-[9px] font-bold border border-brand-indigo/20 flex items-center justify-center"
                  >
                    🔄 {isSidebarCollapsed ? "" : "Sync"}
                  </button>
                  <button
                    onClick={preloadAllForOffline}
                    disabled={loadingDrive}
                    title="Pre-cargar todo para uso Offline"
                    className="bg-status-confirmed-light hover:bg-status-confirmed-light/80 text-status-confirmed-dark p-1.5 rounded-lg cursor-pointer transition-colors text-[9px] font-bold border border-status-confirmed-dark/20 flex items-center justify-center"
                  >
                    📥 {isSidebarCollapsed ? "" : "Offline"}
                  </button>
                  <button
                    onClick={disconnectGoogle}
                    title="Desconectar Google Drive"
                    className="bg-status-cancelled-light hover:bg-status-cancelled-light/80 text-status-cancelled-dark p-1.5 rounded-lg cursor-pointer transition-colors text-[9px] flex items-center justify-center"
                  >
                    🚪
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={connectGoogle}
                disabled={loadingDrive}
                className="w-full bg-bg-base hover:bg-brand-sand/40 border border-brand-sand text-text-main font-title font-bold text-xs py-2 rounded-xl transition-all cursor-pointer shadow-sm flex items-center justify-center gap-1.5"
                title="Conectar Drive"
              >
                <span>▲</span>
                <span className={`${isSidebarCollapsed ? "md:hidden" : ""}`}>
                  {loadingDrive ? "..." : "Conectar Drive"}
                </span>
              </button>
            )}
          </div>

          {/* Privacy Button */}
          <button
            onClick={() => setIsBlurred(!isBlurred)}
            className={`w-full py-2 rounded-xl text-xs font-bold transition-all duration-350 cursor-pointer flex items-center justify-center gap-2 ${
              isBlurred
                ? "bg-status-confirmed-dark text-white shadow-md shadow-status-confirmed-dark/20"
                : "bg-status-cancelled-light text-status-cancelled-dark border border-status-cancelled-dark/20 hover:bg-status-cancelled-light/80"
            }`}
            title={isBlurred ? "Revelar Datos" : "Ocultar Datos"}
          >
            <span>🔒</span>
            <span className={`${isSidebarCollapsed ? "md:hidden" : ""}`}>
              {isBlurred ? "Revelar" : "Ocultar Datos"}
            </span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-h-screen overflow-x-hidden">
        {/* Banner de advertencia de error */}
        {errorMessage && (
          <div className="bg-status-cancelled-light border-b border-status-cancelled-dark/20 text-status-cancelled-dark text-xs py-2 px-4 text-center font-title font-bold flex items-center justify-center gap-2 animate-in slide-in-from-top duration-300 shadow-inner">
            ⚠️ {errorMessage}
          </div>
        )}

        {/* Contenido Principal */}
        <main
          className={`flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 transition-all duration-500 ${
            isBlurred ? "blur-md pointer-events-none select-none" : ""
          }`}
        >
          {activeTab === "calendar" ? (
            <CalendarGrid
              currentDate={currentDate}
              weekDays={weekDays}
              agenda={agenda}
              holidays={holidays}
              nextWeek={nextWeek}
              prevWeek={prevWeek}
              goToToday={goToToday}
              onUpdateStatus={updateSessionStatus}
              onRemoveRecurrenceRule={removeRecurrenceRule}
              onOpenSessionModal={() => setShowSessionModal(true)}
              selectDate={selectDate}
              dbSessions={dbSessions}
              recurrenceRules={recurrenceRules}
              onNavigateToPatientDetail={handleNavigateToPatientDetail}
            />
          ) : selectedPatientForDetail ? (
            <PatientDetail
              patient={selectedPatientForDetail}
              onBack={() => setSelectedPatientForDetail(null)}
              onEdit={(patient) => {
                setPatientToEdit(patient);
                setShowPatientModal(true);
              }}
            />
          ) : (
            <PatientManager
              patients={patients}
              loading={loadingPatients}
              onRemovePatient={removePatient}
              onOpenPatientModal={handleOpenNewPatientModal}
              onSelectPatient={setSelectedPatientForDetail}
            />
          )}
        </main>
      </div>

      {/* Modal para Crear/Editar Paciente */}
      <PatientModal
        isOpen={showPatientModal}
        onClose={() => {
          setShowPatientModal(false);
          setPatientToEdit(null);
        }}
        onCreate={addPatient}
        patientToEdit={patientToEdit}
        onUpdate={handleUpdatePatient}
      />

      {/* Modal para Programar Turno */}
      <SessionModal
        isOpen={showSessionModal}
        onClose={() => setShowSessionModal(false)}
        patients={patients}
        onCreateManual={addManualSession}
        onCreateRecurrence={addRecurrence}
      />

      {/* Consola de Desarrollador Integrada (Developer Logs Console) */}
      <div className={`fixed bottom-0 right-0 z-50 transition-all duration-300 ${
        isConsoleOpen ? "w-full md:w-[600px] h-96" : "w-48 h-10"
      } bg-[#1E1E1E] text-white border-t border-l border-brand-sand shadow-2xl rounded-tl-xl flex flex-col font-mono text-[11px]`}>
        {/* Barra superior de la consola */}
        <div 
          onClick={() => setIsConsoleOpen(!isConsoleOpen)} 
          className="h-10 px-4 flex items-center justify-between cursor-pointer border-b border-neutral-700 bg-neutral-900 rounded-tl-xl hover:bg-neutral-800 transition-colors select-none"
        >
          <span className="font-bold flex items-center gap-2">
            ⚙️ Consola Dev ({logs.length} logs)
          </span>
          <span className="text-[10px] text-text-sub font-bold">{isConsoleOpen ? "▼ Minimizar" : "▲ Expandir"}</span>
        </div>

        {/* Cuerpo de la consola (lista de logs) */}
        {isConsoleOpen && (
          <div className="flex-1 flex flex-col overflow-hidden">
            <div className="flex justify-between items-center bg-neutral-950 px-3 py-1.5 border-b border-neutral-800">
              <span className="text-[9px] text-neutral-400 font-bold">LOGS DE GOOGLE DRIVE API</span>
              <div className="flex gap-2">
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    const text = logs.map(l => `[${l.timestamp}] [${l.type.toUpperCase()}] ${l.message}${l.details ? `\nDetalles: ${typeof l.details === 'string' ? l.details : JSON.stringify(l.details, null, 2)}` : ''}`).join('\n');
                    navigator.clipboard.writeText(text);
                  }}
                  className="bg-brand-indigo/20 hover:bg-brand-indigo/40 text-brand-indigo border border-brand-indigo/30 px-2 py-0.5 rounded text-[10px] cursor-pointer font-bold transition-colors"
                  title="Copiar todos los logs al portapapeles"
                >
                  📋 Copiar Todo
                </button>
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    driveLogger.clear();
                  }}
                  className="bg-status-cancelled-light hover:bg-status-cancelled-light/80 text-status-cancelled-dark border border-status-cancelled-dark/30 px-2 py-0.5 rounded text-[10px] cursor-pointer font-bold transition-colors"
                >
                  🗑️ Limpiar
                </button>
              </div>
            </div>
            
            <div className="flex-1 p-3 overflow-y-auto space-y-2 bg-[#121212]">
              {logs.length === 0 ? (
                <div className="text-neutral-500 text-center py-8">No hay logs registrados en esta sesión.</div>
              ) : (
                logs.map((log, index) => {
                  let colorClass = "text-neutral-300";
                  if (log.type === "request") colorClass = "text-yellow-200";
                  else if (log.type === "response") colorClass = "text-green-300";
                  else if (log.type === "error") colorClass = "text-red-400 font-bold";

                  return (
                    <div key={index} className="border-b border-neutral-900 pb-1.5 last:border-0">
                      <div className="flex items-start gap-2">
                        <span className="text-neutral-600 shrink-0 select-none">[{log.timestamp}]</span>
                        <span className={`shrink-0 select-none px-1 rounded text-[9px] uppercase font-bold ${
                          log.type === "request" ? "bg-yellow-950/40 text-yellow-300 border border-yellow-800/30" :
                          log.type === "response" ? "bg-green-950/40 text-green-300 border border-green-800/30" :
                          log.type === "error" ? "bg-red-950/40 text-red-300 border border-red-800/30" :
                          "bg-neutral-800 text-neutral-300"
                        }`}>
                          {log.type}
                        </span>
                        <span className={`break-all ${colorClass}`}>{log.message}</span>
                      </div>
                      {log.details && (
                        <pre className="mt-1 ml-16 p-1.5 bg-neutral-950 rounded text-[9px] text-neutral-400 overflow-x-auto max-w-full whitespace-pre-wrap">
                          {typeof log.details === "string" ? log.details : JSON.stringify(log.details, null, 2)}
                        </pre>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
