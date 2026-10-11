"use client";

import React, { useState } from "react";
import { Patient } from "../../domain/patient.types";
import { Session } from "../../domain/session.types";
import { Icon } from "./common/Icon";

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

const WEEKDAY_NAMES = [
  "Lunes",
  "Martes",
  "Miércoles",
  "Jueves",
  "Viernes",
  "Sábado",
  "Domingo",
];

export function SessionModal({
  isOpen,
  onClose,
  patients,
  onCreateManual,
  onCreateRecurrence,
}: SessionModalProps) {
  const [selectedPatientUuid, setSelectedPatientUuid] = useState("");
  const [isRecurrent, setIsRecurrent] = useState(false);
  const [sessionDate, setSessionDate] = useState("");
  const [sessionTime, setSessionTime] = useState("16:00");
  const [recurrenceDay, setRecurrenceDay] = useState("0");

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPatientUuid || !sessionDate || !sessionTime) return;

    if (isRecurrent) {
      await onCreateRecurrence({
        patientUuid: selectedPatientUuid,
        startDate: sessionDate,
        startTime: sessionTime,
        durationMinutes: 50,
        dayOfWeek: Number(recurrenceDay),
      });
    } else {
      const isoDateTime = `${sessionDate}T${sessionTime}:00`;
      await onCreateManual({
        patientUuid: selectedPatientUuid,
        dateTime: isoDateTime,
        status: "scheduled",
      });
    }

    // Reset form
    setSelectedPatientUuid("");
    setIsRecurrent(false);
    setSessionDate("");
    setSessionTime("16:00");
    setRecurrenceDay("0");
    onClose();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="session-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 backdrop-blur-xs p-4"
    >
      <div className="bg-surface border border-line rounded-2xl max-w-lg w-full overflow-hidden shadow-xl animate-in fade-in zoom-in-95 duration-150">
        {/* Modal Header */}
        <div className="p-5 border-b border-line flex items-center justify-between">
          <h3 id="session-modal-title" className="font-serif font-medium text-lg text-ink">
            Programar turno o sesión
          </h3>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar"
            className="p-1.5 text-ink-sub hover:text-ink hover:bg-bg-base rounded-md transition-colors cursor-pointer"
          >
            <Icon name="x" size={18} />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <p className="text-xs text-ink-sub">
            Los campos marcados con <span className="text-primary font-bold">*</span> son obligatorios.
          </p>

          {/* Patient Selection */}
          <div>
            <label htmlFor="modal-patient" className="text-xs font-semibold text-ink block mb-1">
              Paciente <span className="text-primary font-bold">*</span>
            </label>
            <select
              id="modal-patient"
              required
              value={selectedPatientUuid}
              onChange={(e) => setSelectedPatientUuid(e.target.value)}
              className="w-full bg-surface border border-line rounded-lg px-3 py-2 text-ink focus:outline-none focus:border-primary text-sm cursor-pointer transition-colors"
            >
              <option value="">Seleccionar paciente</option>
              {patients.map((p) => (
                <option key={p.uuid} value={p.uuid}>
                  {p.fullName}
                </option>
              ))}
            </select>
          </div>

          {/* Recurrence Checkbox Card */}
          <label className="flex items-start gap-3 p-3.5 rounded-xl border border-line bg-bg-base/60 cursor-pointer hover:bg-bg-base transition-colors">
            <input
              type="checkbox"
              checked={isRecurrent}
              onChange={(e) => setIsRecurrent(e.target.checked)}
              className="mt-0.5 h-4 w-4 accent-primary rounded cursor-pointer"
            />
            <div className="text-xs">
              <span className="font-semibold text-ink block">¿Es un turno recurrente?</span>
              <span className="text-ink-sub mt-0.5 block leading-relaxed">
                Los turnos recurrentes se cargan automáticamente todas las semanas, el mismo día y horario, durante todo el año.
              </span>
            </div>
          </label>

          {/* Info Alert on Recurrence */}
          {isRecurrent && (
            <div
              role="status"
              className="flex items-center gap-2 p-3 bg-primary-tint/60 text-primary border border-primary/20 rounded-xl text-xs"
            >
              <Icon name="repeat" size={16} />
              <span>
                Se repetirá todos los {WEEKDAY_NAMES[Number(recurrenceDay)].toLowerCase()} a las {sessionTime}.
              </span>
            </div>
          )}

          {/* Date & Time Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label htmlFor="modal-date" className="text-xs font-semibold text-ink block mb-1">
                {isRecurrent ? "Fecha de inicio *" : "Fecha del turno *"}
              </label>
              <input
                id="modal-date"
                type="date"
                required
                value={sessionDate}
                onChange={(e) => {
                  setSessionDate(e.target.value);
                  if (e.target.value) {
                    const parsed = new Date(e.target.value + "T00:00:00");
                    const jsDay = parsed.getDay(); // 0=Domingo, 1=Lunes...
                    // Convert to 0=Lunes... 6=Domingo
                    const rDay = jsDay === 0 ? 6 : jsDay - 1;
                    setRecurrenceDay(String(rDay));
                  }
                }}
                className="w-full bg-surface border border-line rounded-lg px-3 py-2 text-ink focus:outline-none focus:border-primary text-sm cursor-pointer transition-colors"
              />
            </div>

            <div>
              <label htmlFor="modal-time" className="text-xs font-semibold text-ink block mb-1">
                Hora <span className="text-primary font-bold">*</span>
              </label>
              <input
                id="modal-time"
                type="time"
                required
                value={sessionTime}
                onChange={(e) => setSessionTime(e.target.value)}
                className="w-full bg-surface border border-line rounded-lg px-3 py-2 text-ink focus:outline-none focus:border-primary text-sm cursor-pointer transition-colors"
              />
              <span className="text-[10px] text-ink-sub mt-1 block">
                Formato de 24 horas, ej. 16:00.
              </span>
            </div>
          </div>

          {/* Recurrence Day of Week */}
          {isRecurrent && (
            <div>
              <label htmlFor="modal-day" className="text-xs font-semibold text-ink block mb-1">
                Día semanal de atención <span className="text-primary font-bold">*</span>
              </label>
              <select
                id="modal-day"
                value={recurrenceDay}
                onChange={(e) => setRecurrenceDay(e.target.value)}
                className="w-full bg-surface border border-line rounded-lg px-3 py-2 text-ink focus:outline-none focus:border-primary text-sm cursor-pointer transition-colors"
              >
                {WEEKDAY_NAMES.map((name, idx) => (
                  <option key={idx} value={String(idx)}>
                    {name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Modal Footer */}
          <div className="pt-4 border-t border-line flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 text-xs font-semibold text-ink-sub hover:text-ink hover:bg-bg-base rounded-lg transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-primary hover:bg-primary-hover text-surface text-xs font-semibold rounded-lg shadow-xs transition-colors cursor-pointer"
            >
              Programar turno
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
