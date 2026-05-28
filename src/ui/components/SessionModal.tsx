"use client";

import { useState } from "react";
import { Patient } from "../../domain/patient.types";
import { Session } from "../../domain/session.types";

interface SessionModalProps {
  isOpen: boolean;
  onClose: () => void;
  patients: Patient[];
  onCreateManual: (data: {
    patientUuid: string;
    dateTime: string;
    status: Session["status"];
    notes?: string;
  }) => Promise<void>;
  onCreateRecurrence: (data: {
    patientUuid: string;
    startDate: string;
    startTime: string;
    durationMinutes: number;
    dayOfWeek: number;
  }) => Promise<void>;
}

export function SessionModal({
  isOpen,
  onClose,
  patients,
  onCreateManual,
  onCreateRecurrence,
}: SessionModalProps) {
  const [selectedPatientUuid, setSelectedPatientUuid] = useState("");
  const [isRecurrent, setIsRecurrent] = useState(false);
  const [sessionDate, setSessionDate] = useState(""); // YYYY-MM-DD
  const [sessionTime, setSessionTime] = useState("16:00");
  const [recurrenceDay, setRecurrenceDay] = useState("0"); // 0=Lunes, 1=Martes...

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPatientUuid || !sessionDate || !sessionTime) return;

    if (isRecurrent) {
      await onCreateRecurrence({
        patientUuid: selectedPatientUuid,
        startDate: sessionDate,
        startTime: sessionTime,
        durationMinutes: 50, // Duración por defecto (50 mins)
        dayOfWeek: Number(recurrenceDay),
      });
    } else {
      // Reconstruir dateTime ISO
      const isoDateTime = `${sessionDate}T${sessionTime}:00`;
      await onCreateManual({
        patientUuid: selectedPatientUuid,
        dateTime: isoDateTime,
        status: "scheduled",
      });
    }

    // Resetear formulario
    setSelectedPatientUuid("");
    setIsRecurrent(false);
    setSessionDate("");
    setSessionTime("16:00");
    setRecurrenceDay("0");
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl shadow-black/80 animate-in fade-in zoom-in duration-200">
        <div className="p-6 border-b border-slate-800 flex items-center justify-between">
          <h3 className="font-bold text-lg text-slate-100">Programar Turno / Sesión</h3>
          <button
            onClick={onClose}
            className="text-slate-500 hover:text-slate-300 text-xl font-bold"
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="text-xs text-slate-400 font-semibold block mb-1">Seleccionar Paciente *</label>
            <select
              required
              value={selectedPatientUuid}
              onChange={(e) => setSelectedPatientUuid(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-slate-100 focus:outline-none focus:border-violet-600 transition-all text-sm cursor-pointer"
            >
              <option value="">-- Seleccionar Paciente --</option>
              {patients.map((p) => (
                <option key={p.uuid} value={p.uuid}>
                  {p.fullName}
                </option>
              ))}
            </select>
          </div>

          {/* Toggle de Recurrencia */}
          <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm text-slate-300 font-bold">¿Es un turno recurrente?</label>
              <input
                type="checkbox"
                checked={isRecurrent}
                onChange={(e) => setIsRecurrent(e.target.checked)}
                className="h-5 w-5 accent-violet-600 rounded cursor-pointer"
              />
            </div>
            <span className="text-[10px] text-slate-500 block leading-normal">
              Los turnos recurrentes se cargarán automáticamente todas las semanas en el día y horario especificados durante todo el año.
            </span>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-slate-400 font-semibold block mb-1">
                {isRecurrent ? "Fecha de Inicio *" : "Fecha del Turno *"}
              </label>
              <input
                type="date"
                required
                value={sessionDate}
                onChange={(e) => setSessionDate(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-slate-100 focus:outline-none focus:border-violet-600 transition-all text-sm cursor-pointer"
              />
            </div>
            <div>
              <label className="text-xs text-slate-400 font-semibold block mb-1">Hora *</label>
              <input
                type="time"
                required
                value={sessionTime}
                onChange={(e) => setSessionTime(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-slate-100 focus:outline-none focus:border-violet-600 transition-all text-sm cursor-pointer"
              />
            </div>
          </div>

          {/* Selector de día para recurrencia */}
          {isRecurrent && (
            <div>
              <label className="text-xs text-slate-400 font-semibold block mb-1">Día de la semana de atención *</label>
              <select
                value={recurrenceDay}
                onChange={(e) => setRecurrenceDay(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-slate-100 focus:outline-none focus:border-violet-600 transition-all text-sm cursor-pointer"
              >
                <option value="0">Lunes</option>
                <option value="1">Martes</option>
                <option value="2">Miércoles</option>
                <option value="3">Jueves</option>
                <option value="4">Viernes</option>
                <option value="5">Sábado</option>
                <option value="6">Domingo</option>
              </select>
            </div>
          )}

          <div className="pt-4 border-t border-slate-800 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="text-slate-400 hover:text-slate-200 text-sm font-semibold px-4 py-2 transition-all"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-semibold text-sm px-4 py-2 rounded-lg transition-all"
            >
              Programar Turno
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
