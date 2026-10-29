"use client";

import React, { useState } from "react";
import { Patient } from "../../domain/patient.types";
import { useUIState } from "../context/UIContext";
import { useGoogleDrive } from "../hooks/useGoogleDrive";
import { Icon } from "./common/Icon";
import { BrandLogo } from "./navigation/BrandLogo";
import { DriveCard } from "./navigation/DriveCard";
import { PrivacyToggleButton } from "./navigation/PrivacyToggleButton";
import { NotificationsDrawer } from "./navigation/NotificationsDrawer";
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
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);

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
    <>
      <aside
        className={`fixed inset-y-0 left-0 z-40 md:sticky md:top-0 md:flex flex-col justify-between bg-surface border-r border-line transition-all duration-300 ease-in-out h-screen max-h-screen overflow-hidden ${
          isMobileMenuOpen ? "translate-x-0 w-64" : "-translate-x-full md:translate-x-0"
        } ${isSidebarCollapsed ? "md:w-20" : "md:w-64"}`}
      >
        {/* Top Section: Brand & Nav */}
        <div className="flex flex-col shrink-0 min-h-0">
          {/* Brand Header */}
          <div
            className={`flex items-center border-b border-line h-16 shrink-0 transition-all ${
              isSidebarCollapsed ? "justify-center px-2" : "justify-between px-3.5 py-3"
            }`}
          >
            {isSidebarCollapsed ? (
              <button
                type="button"
                onClick={() => setIsSidebarCollapsed(false)}
                className="group relative flex items-center justify-center h-10 w-10 rounded-xl hover:bg-bg-base transition-colors cursor-pointer"
                title="Expandir barra lateral"
              >
                <BrandLogo isCollapsed={true} size="sm" />
                <span className="absolute inset-0 bg-primary/10 rounded-xl opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-primary font-bold">
                  <Icon name="chev-r" size={18} />
                </span>
              </button>
            ) : (
              <>
                <BrandLogo isCollapsed={false} />

                <button
                  type="button"
                  onClick={() => setIsSidebarCollapsed(true)}
                  className="hidden md:flex p-1.5 hover:bg-bg-base rounded-lg text-ink-sub hover:text-ink transition-colors cursor-pointer"
                  title="Colapsar barra lateral"
                >
                  <Icon name="chev-l" size={16} />
                </button>
              </>
            )}
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
              onClick={() => setIsNotificationsOpen(true)}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer relative ${
                isNotificationsOpen
                  ? "bg-primary-tint text-primary font-semibold"
                  : "text-ink hover:bg-bg-base hover:text-ink"
              } ${isSidebarCollapsed ? "md:justify-center md:px-0" : ""}`}
              title="Avisos y recordatorios"
            >
              <div className="relative flex items-center justify-center">
                <Icon name="bell" size={18} />
                {unreadCount > 0 && isSidebarCollapsed && (
                  <span className="absolute -top-1 -right-1 flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-primary" />
                  </span>
                )}
              </div>
              {!isSidebarCollapsed && (
                <>
                  <span className="flex-1 text-left">Avisos</span>
                  {unreadCount > 0 && (
                    <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-primary-tint text-primary font-mono">
                      {unreadCount}
                    </span>
                  )}
                </>
              )}
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
          <div className="p-3 border-t border-line space-y-1.5 shrink-0">
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
              {recentPatients.slice(0, 3).map((p) => {
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
      <div className="p-3 border-t border-line space-y-2.5 bg-surface shrink-0 mt-auto">
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

    <NotificationsDrawer
      isOpen={isNotificationsOpen}
      onClose={() => setIsNotificationsOpen(false)}
      notifications={notifications}
      unreadCount={unreadCount}
      onDismiss={onDismissNotification}
      onDismissAll={onDismissAllNotifications}
      isSidebarCollapsed={isSidebarCollapsed}
    />
  </>
  );
}

