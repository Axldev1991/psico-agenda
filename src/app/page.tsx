"use client";

import { useState } from "react";
import { usePatients } from "../ui/hooks/usePatients";
import { useCalendar } from "../ui/hooks/useCalendar";
import { PatientModal } from "../ui/components/PatientModal";
import { SessionModal } from "../ui/components/SessionModal";
import { PatientManager } from "../ui/components/PatientManager";
import { CalendarGrid } from "../ui/components/CalendarGrid";

export default function Home() {
  const { patients, loading: loadingPatients, addPatient, removePatient } = usePatients();
  const {
    currentDate,
    weekDays,
    agenda,
    nextWeek,
    prevWeek,
    goToToday,
    addManualSession,
    addRecurrence,
    updateSessionStatus,
    removeRecurrenceRule,
    holidays,
  } = useCalendar();

  // Vista activa: 'calendar' o 'patients'
  const [activeTab, setActiveTab] = useState<"calendar" | "patients">("calendar");

  // Estados comunes de UI para modales y pánico
  const [showPatientModal, setShowPatientModal] = useState(false);
  const [showSessionModal, setShowSessionModal] = useState(false);
  const [isBlurred, setIsBlurred] = useState(false); // Botón de privacidad

  return (
    <div className="min-h-screen bg-bg-base text-text-main font-sans antialiased selection:bg-brand-indigo/20">
      {/* Navbar Premium Calmo */}
      <header className="border-b border-brand-sand bg-bg-card/90 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-brand-indigo to-brand-blue flex items-center justify-center font-bold text-white shadow-sm shadow-brand-indigo/20 font-title text-lg">
              Ψ
            </div>
            <div>
              <span className="font-title font-bold text-lg tracking-tight text-text-main">
                PSICO-AGENDA
              </span>
              <span className="text-[11px] block text-text-sub font-medium leading-none">Soberanía de Datos Clínicos</span>
            </div>
          </div>

          {/* Toggle de vistas */}
          <div className="bg-bg-base p-1 rounded-xl border border-brand-sand flex">
            <button
              onClick={() => setActiveTab("calendar")}
              className={`px-4 py-1.5 rounded-lg text-xs font-title font-bold transition-all cursor-pointer ${
                activeTab === "calendar"
                  ? "bg-brand-indigo text-white shadow-sm"
                  : "text-text-sub hover:text-text-main"
              }`}
            >
              📅 Agenda
            </button>
            <button
              onClick={() => setActiveTab("patients")}
              className={`px-4 py-1.5 rounded-lg text-xs font-title font-bold transition-all cursor-pointer ${
                activeTab === "patients"
                  ? "bg-brand-indigo text-white shadow-sm"
                  : "text-text-sub hover:text-text-main"
              }`}
            >
              📂 Fichero
            </button>
          </div>

          <div className="flex items-center gap-3">
            {/* Botón de pánico/privacidad */}
            <button
              onClick={() => setIsBlurred(!isBlurred)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all duration-350 cursor-pointer ${
                isBlurred
                  ? "bg-status-confirmed-dark text-white shadow-md shadow-status-confirmed-dark/20"
                  : "bg-status-cancelled-light text-status-cancelled-dark border border-status-cancelled-dark/20 hover:bg-status-cancelled-light/80"
              }`}
            >
              🔒 {isBlurred ? "Revelar" : "Ocultar Datos"}
            </button>

            {activeTab === "patients" ? (
              <button
                onClick={() => setShowPatientModal(true)}
                className="bg-brand-indigo hover:bg-brand-indigo/90 text-white font-title font-bold text-xs px-4 py-2 rounded-xl transition-all shadow-sm cursor-pointer"
              >
                + Nuevo Paciente
              </button>
            ) : (
              <button
                onClick={() => setShowSessionModal(true)}
                className="bg-brand-indigo hover:bg-brand-indigo/90 text-white font-title font-bold text-xs px-4 py-2 rounded-xl transition-all shadow-sm cursor-pointer"
              >
                + Programar Turno
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Contenido Principal */}
      <main
        className={`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 transition-all duration-500 ${
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
          />
        ) : (
          <PatientManager
            patients={patients}
            loading={loadingPatients}
            onRemovePatient={removePatient}
            onOpenPatientModal={() => setShowPatientModal(true)}
          />
        )}
      </main>

      {/* Modal para Crear Paciente */}
      <PatientModal
        isOpen={showPatientModal}
        onClose={() => setShowPatientModal(false)}
        onCreate={addPatient}
      />

      {/* Modal para Programar Turno */}
      <SessionModal
        isOpen={showSessionModal}
        onClose={() => setShowSessionModal(false)}
        patients={patients}
        onCreateManual={addManualSession}
        onCreateRecurrence={addRecurrence}
      />
    </div>
  );
}
