"use client";

import React from "react";
import { Patient } from "../../domain/patient.types";
import { useUIState } from "../context/UIContext";
import { useGoogleDrive } from "../hooks/useGoogleDrive";

interface AppSidebarProps {
  isMobileMenuOpen: boolean;
  setIsMobileMenuOpen: (open: boolean) => void;
  isBlurred: boolean;
  setIsBlurred: (blurred: boolean | ((prev: boolean) => boolean)) => void;
  recentPatients: Patient[];
}

export function AppSidebar({
  isMobileMenuOpen,
  setIsMobileMenuOpen,
  isBlurred,
  setIsBlurred,
  recentPatients,
}: AppSidebarProps) {
  const {
    activeTab,
    setActiveTab,
    isSidebarCollapsed,
    setIsSidebarCollapsed,
    setSelectedPatientForDetail,
    openNewPatientModal,
    openSessionModal,
  } = useUIState();

  const {
    googleToken,
    loading: loadingDrive,
    syncStatus,
    lastSynced,
    connectGoogle,
    disconnectGoogle,
    performSync,
    preloadAllForOffline,
    downloadDiagnosticLogs,
  } = useGoogleDrive();

  return (
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
            <div
              className={`transition-all duration-300 ${
                isSidebarCollapsed ? "opacity-0 md:w-0" : "opacity-100"
              }`}
            >
              <span className="font-title font-bold text-base tracking-tight text-text-main whitespace-nowrap">
                PSICO-AGENDA
              </span>
              <span className="text-[9px] block text-text-sub font-medium leading-none whitespace-nowrap">
                Datos Clínicos
              </span>
            </div>
          </div>

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
            <span
              className={`transition-opacity duration-300 ${
                isSidebarCollapsed ? "md:hidden" : "opacity-100"
              }`}
            >
              Agenda
            </span>
          </button>

          <button
            onClick={() => {
              if (activeTab === "patients") {
                setSelectedPatientForDetail(null);
              }
              setActiveTab("patients");
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
            <span
              className={`transition-opacity duration-300 ${
                isSidebarCollapsed ? "md:hidden" : "opacity-100"
              }`}
            >
              Fichero
            </span>
          </button>

          <button
            onClick={() => {
              setActiveTab("settings");
              setIsMobileMenuOpen(false);
            }}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-title font-bold transition-all cursor-pointer ${
              activeTab === "settings"
                ? "bg-brand-indigo text-white shadow-sm"
                : "text-text-sub hover:text-text-main hover:bg-brand-sand/20"
            } ${isSidebarCollapsed ? "md:justify-center" : ""}`}
            title="Configuración"
          >
            <span className="text-base">⚙️</span>
            <span
              className={`transition-opacity duration-300 ${
                isSidebarCollapsed ? "md:hidden" : "opacity-100"
              }`}
            >
              Configuración
            </span>
          </button>
        </nav>

        {/* Pacientes Recientes */}
        {recentPatients.length > 0 && (
          <div className="p-3 border-t border-brand-sand/50 space-y-2">
            <span
              className={`text-[10px] text-text-sub font-bold uppercase tracking-wider block px-3 ${
                isSidebarCollapsed ? "md:text-center md:px-0" : ""
              }`}
            >
              {isSidebarCollapsed ? "Rec." : "Recientes"}
            </span>
            <div
              className={`space-y-1 ${
                isSidebarCollapsed
                  ? "flex flex-col items-center animate-in fade-in"
                  : "animate-in fade-in"
              }`}
            >
              {recentPatients.map((p) => {
                const initials = p.fullName
                  .split(" ")
                  .map((n) => n[0])
                  .join("")
                  .slice(0, 2)
                  .toUpperCase();

                if (isSidebarCollapsed) {
                  return (
                    <button
                      key={p.uuid}
                      onClick={() => {
                        setSelectedPatientForDetail(p);
                        setActiveTab("patients");
                      }}
                      className="h-8 w-8 rounded-full bg-brand-indigo/10 hover:bg-brand-indigo/25 text-brand-indigo text-xs font-bold flex items-center justify-center cursor-pointer transition-all border border-brand-indigo/20 shadow-sm"
                      title={p.fullName}
                    >
                      {initials}
                    </button>
                  );
                }

                return (
                  <button
                    key={p.uuid}
                    onClick={() => {
                      setSelectedPatientForDetail(p);
                      setActiveTab("patients");
                    }}
                    className="w-full text-left px-3 py-2 rounded-xl text-xs font-semibold text-text-sub hover:text-text-main hover:bg-brand-sand/20 transition-all cursor-pointer truncate"
                    title={p.fullName}
                  >
                    {p.fullName}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Action Buttons inside Nav */}
        <div className="p-3 border-t border-brand-sand/50">
          {activeTab === "patients" ? (
            <button
              onClick={() => {
                openNewPatientModal();
                setIsMobileMenuOpen(false);
              }}
              className="w-full bg-brand-indigo hover:bg-brand-indigo/90 text-white font-title font-bold text-xs py-2.5 rounded-xl transition-all shadow-sm cursor-pointer flex items-center justify-center gap-2"
              title="Nuevo Paciente"
            >
              <span>+</span>
              <span className={`${isSidebarCollapsed ? "md:hidden" : ""}`}>
                Nuevo Paciente
              </span>
            </button>
          ) : (
            <button
              onClick={() => {
                openSessionModal();
                setIsMobileMenuOpen(false);
              }}
              className="w-full bg-brand-indigo hover:bg-brand-indigo/90 text-white font-title font-bold text-xs py-2.5 rounded-xl transition-all shadow-sm cursor-pointer flex items-center justify-center gap-2"
              title="Programar Turno"
            >
              <span>+</span>
              <span className={`${isSidebarCollapsed ? "md:hidden" : ""}`}>
                Programar Turno
              </span>
            </button>
          )}
        </div>
      </div>

      {/* Sidebar Footer Controls (Google Drive & Privacy) */}
      <div className="p-3 border-t border-brand-sand space-y-3 bg-bg-card">
        <div className="space-y-2">
          {googleToken ? (
            <div className="bg-bg-base border border-brand-sand p-2 rounded-xl text-xs shadow-sm space-y-2">
              <div
                className={`flex items-center gap-2 ${
                  isSidebarCollapsed ? "md:justify-center" : ""
                }`}
              >
                <span className="flex h-2 w-2 shrink-0 rounded-full bg-status-confirmed-dark animate-pulse" />
                <span
                  className={`font-bold text-[10px] text-text-main ${
                    isSidebarCollapsed ? "md:hidden" : ""
                  }`}
                >
                  Nube Activa
                </span>
              </div>
              {!isSidebarCollapsed && lastSynced && (
                <div className="text-[9px] text-text-sub font-mono leading-none">
                  Sync: {syncStatus === "syncing" ? "Sincronizando..." : lastSynced}
                </div>
              )}
              <div
                className={`flex ${
                  isSidebarCollapsed ? "md:flex-col md:items-center" : "flex-row"
                } gap-1.5 justify-start`}
              >
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
                  onClick={downloadDiagnosticLogs}
                  title="Descargar Logs de Diagnóstico"
                  className="bg-brand-sand hover:bg-brand-sand/85 text-text-main p-1.5 rounded-lg cursor-pointer transition-colors text-[9px] font-bold border border-brand-sand/55 flex items-center justify-center"
                >
                  📋 {isSidebarCollapsed ? "" : "Logs"}
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
          onClick={() => setIsBlurred((prev) => !prev)}
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
  );
}
