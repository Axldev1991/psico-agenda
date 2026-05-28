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
    <div className="min-h-screen bg-slate-900 text-slate-100 font-sans antialiased">
      {/* Navbar Premium */}
      <header className="border-b border-slate-800 bg-slate-950/80 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-violet-600 to-indigo-600 flex items-center justify-center font-bold text-white shadow-md shadow-violet-900/30">
              Ψ
            </div>
            <div>
              <span className="font-bold text-lg tracking-tight bg-gradient-to-r from-violet-400 to-indigo-200 bg-clip-text text-transparent">
                PSICO-AGENDA
              </span>
              <span className="text-xs block text-slate-500 font-medium">Soberanía de Datos Clínicos</span>
            </div>
          </div>

          {/* Toggle de vistas */}
          <div className="bg-slate-900 p-1 rounded-xl border border-slate-800 flex">
            <button
              onClick={() => setActiveTab("calendar")}
              className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition-all cursor-pointer ${
                activeTab === "calendar"
                  ? "bg-violet-600 text-white shadow-md"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              📅 Agenda
            </button>
            <button
              onClick={() => setActiveTab("patients")}
              className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition-all cursor-pointer ${
                activeTab === "patients"
                  ? "bg-violet-600 text-white shadow-md"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              📂 Fichero
            </button>
          </div>

          <div className="flex items-center gap-3">
            {/* Botón de pánico */}
            <button
              onClick={() => setIsBlurred(!isBlurred)}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-300 cursor-pointer ${
                isBlurred
                  ? "bg-emerald-600 text-white shadow-lg ring-2 ring-emerald-400"
                  : "bg-rose-950/40 text-rose-300 border border-rose-800/50 hover:bg-rose-900/30"
              }`}
            >
              🔒 {isBlurred ? "Revelar" : "Ocultar Datos"}
            </button>

            {activeTab === "patients" ? (
              <button
                onClick={() => setShowPatientModal(true)}
                className="bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-semibold text-sm px-4 py-2 rounded-lg transition-all shadow-md active:scale-95 cursor-pointer"
              >
                + Nuevo Paciente
              </button>
            ) : (
              <button
                onClick={() => setShowSessionModal(true)}
                className="bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-semibold text-sm px-4 py-2 rounded-lg transition-all shadow-md active:scale-95 cursor-pointer"
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
