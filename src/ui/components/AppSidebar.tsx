"use client";

import React from "react";
import { Patient } from "../../domain/patient.types";
import { useUIState } from "../context/UIContext";
import { useGoogleDrive } from "../hooks/useGoogleDrive";
import { Icon } from "./common/Icon";
import { BrandLogo } from "./navigation/BrandLogo";
import { DriveCard } from "./navigation/DriveCard";
import { PrivacyToggleButton } from "./navigation/PrivacyToggleButton";
import { NotificationBell } from "./navigation/NotificationBell";
import { AppNotification } from "../../domain/notification.types";

interface AppSidebarProps {
  isMobileMenuOpen: boolean;
  setIsMobileMenuOpen: (open: boolean) => void;
  isBlurred: boolean;
  setIsBlurred: (blurred: boolean | ((prev: boolean) => boolean)) => void;
  recentPatients: Patient[];
  notifications: AppNotification[];
  unreadCount: number;
  onDismissNotification: (id: string) => void;
  onDismissAllNotifications: () => void;
}

export function AppSidebar({
  isMobileMenuOpen,
  setIsMobileMenuOpen,
  isBlurred,
  setIsBlurred,
  recentPatients,
  notifications,
  unreadCount,
  onDismissNotification,
  onDismissAllNotifications,
}: AppSidebarProps) {
  const {
    activeTab,
    setActiveTab,
    isSidebarCollapsed,
    setIsSidebarCollapsed,
    setSelectedPatientForDetail,
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

  const handleTogglePrivacy = () => {
    setIsBlurred((prev) => !prev);
  };

  return (
    <aside
      className={`fixed inset-y-0 left-0 z-40 md:sticky md:flex flex-col justify-between bg-surface border-r border-line transition-all duration-300 ease-in-out ${
        isMobileMenuOpen ? "translate-x-0 w-64" : "-translate-x-full md:translate-x-0"
      } ${isSidebarCollapsed ? "md:w-20" : "md:w-60"} min-h-screen`}
    >
      {/* Top Section: Brand & Nav */}
      <div className="flex flex-col">
        {/* Brand Header */}
        <div className="flex items-center justify-between p-4 border-b border-line h-16">
          <BrandLogo isCollapsed={isSidebarCollapsed} />

          <div className="flex items-center gap-1">
            <NotificationBell
              notifications={notifications}
              unreadCount={unreadCount}
              onDismiss={onDismissNotification}
              onDismissAll={onDismissAllNotifications}
            />

            <button
              type="button"
              onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
              className="hidden md:flex p-1.5 hover:bg-bg-base rounded-lg text-ink-sub hover:text-ink transition-colors cursor-pointer"
              title={isSidebarCollapsed ? "Expandir barra lateral" : "Colapsar barra lateral"}
            >
              <Icon name={isSidebarCollapsed ? "chev-r" : "chev-l"} size={16} />
            </button>
          </div>
        </div>

        {/* Primary Navigation Links */}
        <nav className="p-3 space-y-1" aria-label="Principal">
          <button
            type="button"
            onClick={() => {
              setActiveTab("calendar");
              setIsMobileMenuOpen(false);
            }}
            aria-current={activeTab === "calendar" ? "page" : undefined}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
              activeTab === "calendar"
                ? "bg-primary-tint text-primary font-semibold"
                : "text-ink hover:bg-bg-base hover:text-ink"
            } ${isSidebarCollapsed ? "md:justify-center md:px-0" : ""}`}
            title="Agenda"
          >
            <Icon name="calendar" size={18} />
            {!isSidebarCollapsed && <span>Agenda</span>}
          </button>

          <button
            type="button"
            onClick={() => {
              if (activeTab === "patients") {
                setSelectedPatientForDetail(null);
              }
              setActiveTab("patients");
              setIsMobileMenuOpen(false);
            }}
            aria-current={activeTab === "patients" ? "page" : undefined}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
              activeTab === "patients"
                ? "bg-primary-tint text-primary font-semibold"
                : "text-ink hover:bg-bg-base hover:text-ink"
            } ${isSidebarCollapsed ? "md:justify-center md:px-0" : ""}`}
            title="Fichero"
          >
            <Icon name="folder" size={18} />
            {!isSidebarCollapsed && <span>Fichero</span>}
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab("settings");
              setIsMobileMenuOpen(false);
            }}
            aria-current={activeTab === "settings" ? "page" : undefined}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
              activeTab === "settings"
                ? "bg-primary-tint text-primary font-semibold"
                : "text-ink hover:bg-bg-base hover:text-ink"
            } ${isSidebarCollapsed ? "md:justify-center md:px-0" : ""}`}
            title="Configuración"
          >
            <Icon name="settings" size={18} />
            {!isSidebarCollapsed && <span>Configuración</span>}
          </button>
        </nav>

        {/* Recent Patients */}
        {recentPatients.length > 0 && (
          <div className="p-3 border-t border-line space-y-2">
            <h4
              className={`text-sm font-semibold text-ink-sub px-3 ${
                isSidebarCollapsed ? "md:text-center md:px-0 text-xs" : ""
              }`}
            >
              {isSidebarCollapsed ? "Rec." : "Pacientes recientes"}
            </h4>
            <div
              className={`space-y-1 ${
                isSidebarCollapsed ? "flex flex-col items-center" : ""
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
                      type="button"
                      onClick={() => {
                        setSelectedPatientForDetail(p);
                        setActiveTab("patients");
                      }}
                      className="h-8 w-8 rounded-full bg-primary-tint text-primary text-xs font-semibold flex items-center justify-center cursor-pointer transition-colors hover:bg-primary/20"
                      title={p.fullName}
                    >
                      {initials}
                    </button>
                  );
                }

                return (
                  <button
                    key={p.uuid}
                    type="button"
                    onClick={() => {
                      setSelectedPatientForDetail(p);
                      setActiveTab("patients");
                    }}
                    className={`w-full text-left px-3 py-1.5 rounded-lg text-sm text-ink hover:text-primary hover:bg-primary-tint/60 transition-colors cursor-pointer truncate ${
                      isBlurred ? "blur-xs select-none" : ""
                    }`}
                    title={p.fullName}
                  >
                    {p.fullName}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Bottom Section: Drive Card & Privacy */}
      <div className="p-3 border-t border-line space-y-2.5 bg-surface">
        <DriveCard
          isCollapsed={isSidebarCollapsed}
          googleToken={googleToken}
          loading={loadingDrive}
          syncStatus={syncStatus}
          lastSynced={lastSynced}
          onConnect={connectGoogle}
          onDisconnect={disconnectGoogle}
          onSync={performSync}
          onPreloadOffline={preloadAllForOffline}
          onDownloadLogs={downloadDiagnosticLogs}
        />

        <PrivacyToggleButton
          isBlurred={isBlurred}
          onToggle={handleTogglePrivacy}
          isCollapsed={isSidebarCollapsed}
        />
      </div>
    </aside>
  );
}
