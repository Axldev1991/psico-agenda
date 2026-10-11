"use client";

import React, { useState, useEffect, useMemo } from "react";
import { UIProvider, useUIState } from "../ui/context/UIContext";
import { usePatients } from "../ui/hooks/usePatients";
import { useCalendar } from "../ui/hooks/useCalendar";
import { useGoogleDrive } from "../ui/hooks/useGoogleDrive";
import { useRecentPatients } from "../ui/hooks/useRecentPatients";
import { AppSidebar } from "../ui/components/AppSidebar";
import { DevLogsConsole } from "../ui/components/DevLogsConsole";
import { PatientModal } from "../ui/components/PatientModal";
import { SessionModal } from "../ui/components/SessionModal";
import { CalendarView } from "../ui/views/CalendarView";
import { PatientsView } from "../ui/views/PatientsView";
import { SettingsView } from "../ui/views/SettingsView";
import { Patient } from "../domain/patient.types";
import { Icon } from "../ui/components/common/Icon";
import { BrandLogo } from "../ui/components/navigation/BrandLogo";

function HomeContent() {
  const { patients, addPatient, updatePatient } = usePatients();
  const { addManualSession, addRecurrence } = useCalendar();
  const { errorMessage } = useGoogleDrive();
  const { recentPatientUuids, addRecentPatient } = useRecentPatients();

  const {
    activeTab,
    selectedPatientForDetail,
    setSelectedPatientForDetail,
    patientToEdit,
    isPatientModalOpen,
    closePatientModal,
    isSessionModalOpen,
    closeSessionModal,
    navigateToPatientDetail,
  } = useUIState();

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isBlurred, setIsBlurred] = useState(false);

  // Inactivity auto-blur: shield sensitive records after 5 minutes of no input
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    const INACTIVITY_MS = 5 * 60 * 1000; // 5 minutos

    const resetTimer = () => {
      clearTimeout(timer);
      timer = setTimeout(() => {
        setIsBlurred(true);
      }, INACTIVITY_MS);
    };

    const events = ["mousedown", "mousemove", "keydown", "touchstart", "scroll"];
    events.forEach((evt) => window.addEventListener(evt, resetTimer, { passive: true }));
    resetTimer();

    return () => {
      clearTimeout(timer);
      events.forEach((evt) => window.removeEventListener(evt, resetTimer));
    };
  }, []);

  // Sync recent patient on selection
  useEffect(() => {
    if (selectedPatientForDetail?.uuid) {
      addRecentPatient(selectedPatientForDetail.uuid);
    }
  }, [selectedPatientForDetail, addRecentPatient]);

  const recentPatients = useMemo(() => {
    return recentPatientUuids
      .map((uuid) => patients.find((p) => p.uuid === uuid))
      .filter((p): p is Patient => !!p);
  }, [recentPatientUuids, patients]);

  const handleUpdatePatient = async (
    uuid: string,
    patientData: Omit<Patient, "uuid" | "createdAt" | "updatedAt">
  ) => {
    await updatePatient(uuid, patientData);
    const updated = patients.find((p) => p.uuid === uuid);
    if (updated) {
      setSelectedPatientForDetail({ ...updated, ...patientData });
    }
  };

  const handleNavigateByUuid = (patientUuid: string) => {
    const patient = patients.find((p) => p.uuid === patientUuid);
    if (patient) {
      navigateToPatientDetail(patient);
    }
  };

  return (
    <div className="min-h-screen bg-bg-base text-ink font-sans antialiased selection:bg-primary-tint flex flex-col md:flex-row">
      {/* Mobile Top Header */}
      <header className="md:hidden flex items-center justify-between px-4 h-14 bg-surface border-b border-line sticky top-0 z-50">
        <button
          type="button"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="h-9 w-9 rounded-lg border border-line-control hover:bg-bg-base text-ink flex items-center justify-center transition-colors cursor-pointer"
          aria-label={isMobileMenuOpen ? "Cerrar menú" : "Abrir menú"}
        >
          <Icon name={isMobileMenuOpen ? "x" : "menu"} size={18} />
        </button>

        <BrandLogo size="sm" />

        <button
          type="button"
          onClick={() => setIsBlurred((prev) => !prev)}
          aria-pressed={isBlurred}
          className={`h-9 w-9 rounded-lg border flex items-center justify-center transition-colors cursor-pointer ${
            isBlurred
              ? "bg-primary-tint text-primary border-primary/40"
              : "bg-surface hover:bg-bg-base text-ink border-line-control"
          }`}
          aria-label={isBlurred ? "Revelar datos" : "Ocultar datos"}
          title={isBlurred ? "Revelar datos" : "Ocultar datos"}
        >
          <Icon name={isBlurred ? "eye-off" : "eye"} size={18} />
        </button>
      </header>

      {/* Mobile Backdrop */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40 md:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Navigation Sidebar */}
      <AppSidebar
        isMobileMenuOpen={isMobileMenuOpen}
        setIsMobileMenuOpen={setIsMobileMenuOpen}
        isBlurred={isBlurred}
        setIsBlurred={setIsBlurred}
        recentPatients={recentPatients}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-h-screen overflow-x-hidden">
        {errorMessage && (
          <div className="bg-status-cancelled-light border-b border-status-cancelled-dark/20 text-status-cancelled-dark px-4 py-2.5 text-sm flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span>⚠️</span>
              <span className="font-semibold">{errorMessage}</span>
            </div>
          </div>
        )}

        <main
          className={`flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 transition-all duration-500 ${
            isBlurred ? "blur-md pointer-events-none select-none" : ""
          }`}
        >
          {activeTab === "calendar" && (
            <CalendarView onNavigateToPatientDetail={handleNavigateByUuid} />
          )}
          {activeTab === "patients" && <PatientsView />}
          {activeTab === "settings" && <SettingsView />}
        </main>
      </div>

      {/* Modales */}
      <PatientModal
        isOpen={isPatientModalOpen}
        onClose={closePatientModal}
        onCreate={addPatient}
        patientToEdit={patientToEdit}
        onUpdate={handleUpdatePatient}
      />

      <SessionModal
        isOpen={isSessionModalOpen}
        onClose={closeSessionModal}
        patients={patients}
        onCreateManual={addManualSession}
        onCreateRecurrence={addRecurrence}
      />

      {/* Dev Console */}
      <DevLogsConsole />
    </div>
  );
}

export default function Home() {
  // Service Worker registration
  useEffect(() => {
    if (typeof window !== "undefined" && "serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/sw.js")
        .then((reg) => console.log("Service Worker registrado con éxito:", reg.scope))
        .catch((err) => console.error("Error al registrar Service Worker:", err));
    }
  }, []);

  return (
    <UIProvider>
      <HomeContent />
    </UIProvider>
  );
}
