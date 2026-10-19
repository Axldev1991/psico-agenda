"use client";

import React, { useState, useMemo, useRef } from "react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { RRule } from "rrule";
import { Patient } from "../../domain/patient.types";
import { Session } from "../../domain/session.types";
import { RecurrenceCadence } from "../../domain/agenda.types";
import { buildRRuleString } from "../../domain/agenda.service";
import { useUIState } from "../context/UIContext";
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
    daysOfWeek?: number[];
    cadence?: RecurrenceCadence;
  }) => Promise<void>;
}

const WEEKDAYS = [
  { index: 0, short: "Lu", name: "Lunes" },
  { index: 1, short: "Ma", name: "Martes" },
  { index: 2, short: "Mi", name: "Miércoles" },
  { index: 3, short: "Ju", name: "Jueves" },
  { index: 4, short: "Vi", name: "Viernes" },
  { index: 5, short: "Sá", name: "Sábado" },
  { index: 6, short: "Do", name: "Domingo" },
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
  const [displayDate, setDisplayDate] = useState("");
  const [sessionTime, setSessionTime] = useState("16:00");
  const [selectedDays, setSelectedDays] = useState<number[]>([0]);
  const [cadence, setCadence] = useState<RecurrenceCadence>("weekly");

  const datePickerRef = useRef<HTMLInputElement>(null);
  const { showToast } = useUIState();

  const toggleDay = (dayIndex: number) => {
    setSelectedDays((prev) => {
      if (prev.includes(dayIndex)) {
        if (prev.length === 1) return prev;
        return prev.filter((d) => d !== dayIndex);
      } else {
        return [...prev, dayIndex].sort((a, b) => a - b);
      }
    });
  };

  const handleDateChange = (dateVal: string) => {
    setSessionDate(dateVal);
    if (dateVal) {
      const parsed = new Date(dateVal + "T00:00:00");
      const jsDay = parsed.getDay();
      const rDay = jsDay === 0 ? 6 : jsDay - 1;
      setSelectedDays([rDay]);
    }
  };

  const handleDisplayDateChange = (val: string) => {
    const digits = val.replace(/\D/g, "").slice(0, 8);
    let formatted = digits;
    if (digits.length >= 5) {
      formatted = `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
    } else if (digits.length >= 3) {
      formatted = `${digits.slice(0, 2)}/${digits.slice(2)}`;
    }
    setDisplayDate(formatted);

    if (digits.length === 8) {
      const d = parseInt(digits.slice(0, 2), 10);
      const m = parseInt(digits.slice(2, 4), 10);
      const y = parseInt(digits.slice(4), 10);
      if (m >= 1 && m <= 12 && d >= 1 && d <= 31 && y >= 2000 && y <= 2100) {
        const iso = `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
        handleDateChange(iso);
      }
    } else if (digits.length === 0) {
      handleDateChange("");
    }
  };

  const handleNativeDateChange = (isoVal: string) => {
    handleDateChange(isoVal);
    if (isoVal) {
      const [y, m, d] = isoVal.split("-");
      setDisplayDate(`${d}/${m}/${y}`);
    } else {
      setDisplayDate("");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPatientUuid || !sessionDate || !sessionTime) return;

    if (isRecurrent) {
      await onCreateRecurrence({
        patientUuid: selectedPatientUuid,
        startDate: sessionDate,
        startTime: sessionTime,
        durationMinutes: 50,
        daysOfWeek: selectedDays,
        cadence,
      });
    } else {
      const isoDateTime = `${sessionDate}T${sessionTime}:00`;
      await onCreateManual({
        patientUuid: selectedPatientUuid,
        dateTime: isoDateTime,
        status: "scheduled",
      });
    }

    showToast("¡Turno programado correctamente!", "success");

    // Reset form
    setSelectedPatientUuid("");
    setIsRecurrent(false);
    setSessionDate("");
    setDisplayDate("");
    setSessionTime("16:00");
    setSelectedDays([0]);
    setCadence("weekly");
    onClose();
  };

  const selectedDaysSummary = selectedDays
    .map((d) => WEEKDAYS.find((w) => w.index === d)?.name)
    .filter(Boolean)
    .join(" y ");

  const recurrenceBannerMessage = useMemo(() => {
    if (cadence === "monthly" && sessionDate) {
      try {
        const parsed = new Date(`${sessionDate}T00:00:00`);
        const dayOfMonth = parsed.getDate();
        const ordinal = Math.ceil(dayOfMonth / 7);
        const ordinalLabel = ordinal >= 5 ? "último" : `${ordinal}°`;
        const dayName = WEEKDAYS.find((w) => w.index === selectedDays[0])?.name || "día";

        const rruleStr = buildRRuleString({
          cadence: "monthly",
          daysOfWeek: selectedDays,
          startDate: sessionDate,
        });
        const rule = RRule.fromString(rruleStr);
        const nextOccurrence = rule.after(parsed, false);
        const nextStr = nextOccurrence
          ? ` (próximo turno: ${format(nextOccurrence, "d 'de' MMMM", { locale: es })})`
          : "";

        return `Se repetirá el ${ordinalLabel} ${dayName.toLowerCase()} de cada mes a las ${sessionTime} hs${nextStr}.`;
      } catch {
        // fallback to standard message
      }
    }

    if (cadence === "biweekly") {
      return `Se repetirá cada 14 días (quincenal) los ${selectedDaysSummary || "días seleccionados"} a las ${sessionTime} hs.`;
    }

    return `Se repetirá todas las semanas los ${selectedDaysSummary || "días seleccionados"} a las ${sessionTime} hs.`;
  }, [cadence, sessionDate, selectedDays, selectedDaysSummary, sessionTime]);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="session-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 backdrop-blur-xs p-4"
    >
      <div className="bg-surface border border-line rounded-2xl max-w-2xl w-full overflow-hidden shadow-xl animate-in fade-in zoom-in-95 duration-150">
        {/* Modal Header */}
        <div className="p-5 border-b border-line flex items-center justify-between">
          <div>
            <h3 id="session-modal-title" className="font-serif font-medium text-lg text-ink">
              Programar turno o sesión
            </h3>
            <p className="text-xs text-ink-sub mt-0.5">
              Los campos con <span className="text-primary font-bold">*</span> son obligatorios.
            </p>
          </div>
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
          {/* Row 1: Patient Selection & Recurrence Switch */}
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-3.5 items-end">
            <div className="sm:col-span-7">
              <label htmlFor="modal-patient" className="text-sm font-semibold text-ink block mb-1.5">
                Paciente <span className="text-primary font-bold">*</span>
              </label>
              <select
                id="modal-patient"
                required
                value={selectedPatientUuid}
                onChange={(e) => setSelectedPatientUuid(e.target.value)}
                className="w-full bg-surface border border-line rounded-lg px-3 py-2 text-ink focus:outline-none focus:border-primary text-base cursor-pointer transition-colors"
              >
                <option value="">Seleccionar paciente</option>
                {patients.map((p) => (
                  <option key={p.uuid} value={p.uuid}>
                    {p.fullName}
                  </option>
                ))}
              </select>
            </div>

            <div className="sm:col-span-5">
              <label className="flex items-center gap-2.5 p-2.5 rounded-lg border border-line bg-bg-base/60 cursor-pointer hover:bg-bg-base transition-colors h-10.5">
                <input
                  type="checkbox"
                  checked={isRecurrent}
                  onChange={(e) => setIsRecurrent(e.target.checked)}
                  className="h-4 w-4 accent-primary rounded cursor-pointer shrink-0"
                />
                <div className="text-sm leading-tight select-none">
                  <span className="font-semibold text-ink block text-sm">Turno recurrente</span>
                  <span className="text-[11px] text-ink-sub block">Periódico fijo</span>
                </div>
              </label>
            </div>
          </div>

          {/* Row 2: Date & Time Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label htmlFor="modal-date" className="text-sm font-semibold text-ink block mb-1.5">
                {isRecurrent ? "Fecha de inicio *" : "Fecha del turno *"}
              </label>
              <div className="relative flex items-center">
                <input
                  id="modal-date"
                  type="text"
                  required
                  placeholder="DD/MM/AAAA"
                  value={displayDate}
                  onChange={(e) => handleDisplayDateChange(e.target.value)}
                  className="w-full bg-surface border border-line rounded-lg px-3 py-2 pr-10 text-ink focus:outline-none focus:border-primary text-base transition-colors"
                />
                <button
                  type="button"
                  onClick={() => datePickerRef.current?.showPicker()}
                  title="Abrir calendario"
                  aria-label="Abrir selector de fecha"
                  className="absolute right-2.5 p-1 text-ink-sub hover:text-primary transition-colors cursor-pointer"
                >
                  <Icon name="calendar" size={18} />
                </button>
                <input
                  ref={datePickerRef}
                  type="date"
                  tabIndex={-1}
                  value={sessionDate}
                  onChange={(e) => handleNativeDateChange(e.target.value)}
                  className="sr-only pointer-events-none"
                  aria-hidden="true"
                />
              </div>
              <span className="text-xs text-ink-sub mt-1 block">
                Formato DD/MM/AAAA (ej. 22/10/2026)
              </span>
            </div>

            <div>
              <label htmlFor="modal-time" className="text-sm font-semibold text-ink block mb-1.5">
                Hora <span className="text-primary font-bold">*</span>
              </label>
              <input
                id="modal-time"
                type="time"
                required
                value={sessionTime}
                onChange={(e) => setSessionTime(e.target.value)}
                className="w-full bg-surface border border-line rounded-lg px-3 py-2 text-ink focus:outline-none focus:border-primary text-base cursor-pointer transition-colors"
              />
            </div>
          </div>

          {/* Row 3: Recurrence Options (2 Columns) */}
          {isRecurrent && (
            <div className="p-3.5 bg-bg-base/40 border border-line rounded-xl space-y-3 animate-in fade-in duration-150">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Cadence Selector */}
                <div>
                  <label className="text-sm font-semibold text-ink block mb-1.5">
                    Frecuencia de repetición
                  </label>
                  <div className="grid grid-cols-3 gap-1.5">
                    <button
                      type="button"
                      onClick={() => setCadence("weekly")}
                      className={`py-1.5 px-1 text-sm font-medium rounded-lg border text-center transition-colors cursor-pointer ${
                        cadence === "weekly"
                          ? "bg-primary text-surface border-primary font-semibold"
                          : "bg-surface text-ink border-line hover:border-line-control"
                      }`}
                    >
                      Semanal
                    </button>
                    <button
                      type="button"
                      onClick={() => setCadence("biweekly")}
                      className={`py-1.5 px-1 text-sm font-medium rounded-lg border text-center transition-colors cursor-pointer ${
                        cadence === "biweekly"
                          ? "bg-primary text-surface border-primary font-semibold"
                          : "bg-surface text-ink border-line hover:border-line-control"
                      }`}
                    >
                      Quincenal
                    </button>
                    <button
                      type="button"
                      onClick={() => setCadence("monthly")}
                      className={`py-1.5 px-1 text-sm font-medium rounded-lg border text-center transition-colors cursor-pointer ${
                        cadence === "monthly"
                          ? "bg-primary text-surface border-primary font-semibold"
                          : "bg-surface text-ink border-line hover:border-line-control"
                      }`}
                    >
                      Mensual
                    </button>
                  </div>
                </div>

                {/* Day Selection (Multi-day) */}
                <div>
                  <label className="text-sm font-semibold text-ink block mb-1.5">
                    Días semanales ({selectedDays.length})
                  </label>
                  <div className="flex items-center gap-1">
                    {WEEKDAYS.map((day) => {
                      const isSelected = selectedDays.includes(day.index);
                      return (
                        <button
                          key={day.index}
                          type="button"
                          onClick={() => toggleDay(day.index)}
                          title={day.name}
                          className={`flex-1 py-1.5 rounded-lg text-sm font-semibold transition-all cursor-pointer border ${
                            isSelected
                              ? "bg-primary-tint text-primary border-primary font-bold shadow-xs"
                              : "bg-surface text-ink-sub border-line hover:border-line-control hover:text-ink"
                          }`}
                        >
                          {day.short}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Info Alert on Recurrence */}
              <div
                role="status"
                className="flex items-center gap-2 px-3 py-2 bg-primary-tint/60 text-primary border border-primary/20 rounded-lg text-sm"
              >
                <Icon name="repeat" size={15} className="shrink-0" />
                <span className="leading-tight text-xs sm:text-sm">
                  {recurrenceBannerMessage}
                </span>
              </div>
            </div>
          )}

          {/* Modal Footer */}
          <div className="pt-3 border-t border-line flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-semibold text-ink-sub hover:text-ink hover:bg-bg-base rounded-lg transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-primary hover:bg-primary-hover text-surface text-sm font-semibold rounded-lg shadow-xs transition-colors cursor-pointer"
            >
              Programar turno
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
