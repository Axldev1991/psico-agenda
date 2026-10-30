"use client";

import React, { useState, useMemo, useEffect } from "react";
import { format, startOfWeek, endOfWeek } from "date-fns";
import { es } from "date-fns/locale";
import { RRule } from "rrule";
import { Patient } from "../../domain/patient.types";
import { Session, RecurrenceRule, SessionModality } from "../../domain/session.types";
import { Holiday } from "../../domain/holidays";
import { RecurrenceCadence, CalendarSlot } from "../../domain/agenda.types";
import { buildRRuleString, findAvailableSlots, findConflictingSlot, computeAgendaSlots } from "../../domain/agenda.service";
import { useAvailabilitySettings } from "../hooks/useAvailabilitySettings";
import { useUIState } from "../context/UIContext";
import { isDateInAbsence } from "../../domain/availability.service";
import { Icon } from "./common/Icon";
import { DateInput } from "./common/DateInput";

interface SessionModalProps {
  isOpen: boolean;
  onClose: () => void;
  patients: Patient[];
  bookedSlots?: CalendarSlot[];
  dbSessions?: Session[];
  recurrenceRules?: RecurrenceRule[];
  holidays?: Holiday[];
  onCreateManual: (data: {
    patientUuid: string;
    dateTime: string;
    status: Session["status"];
    modality?: SessionModality;
    notes?: string;
  }) => Promise<void>;
  onCreateRecurrence: (data: {
    patientUuid: string;
    startDate: string;
    startTime: string;
    durationMinutes: number;
    daysOfWeek?: number[];
    cadence?: RecurrenceCadence;
    modality?: SessionModality;
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
  bookedSlots = [],
  dbSessions = [],
  recurrenceRules = [],
  holidays = [],
  onCreateManual,
  onCreateRecurrence,
}: SessionModalProps) {
  const { settings, reload } = useAvailabilitySettings();
  const [selectedPatientUuid, setSelectedPatientUuid] = useState("");
  const [isRecurrent, setIsRecurrent] = useState(false);
  const [modality, setModality] = useState<SessionModality>("in_person");
  const [sessionDate, setSessionDate] = useState("");
  const [sessionTime, setSessionTime] = useState("16:00");
  const [isException, setIsException] = useState(false);
  const [selectedDays, setSelectedDays] = useState<number[]>([0]);
  const [cadence, setCadence] = useState<RecurrenceCadence>("weekly");

  const { showToast } = useUIState();

  useEffect(() => {
    if (!isOpen) return;
    reload();
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose, reload]);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPatientUuid || !sessionDate || !sessionTime) return;

    if (isRecurrent) {
      await onCreateRecurrence({
        patientUuid: selectedPatientUuid,
        startDate: sessionDate,
        startTime: sessionTime,
        durationMinutes: settings.defaultSessionDurationMinutes,
        daysOfWeek: selectedDays,
        cadence,
        modality,
      });
    } else {
      const isoDateTime = `${sessionDate}T${sessionTime}:00`;
      await onCreateManual({
        patientUuid: selectedPatientUuid,
        dateTime: isoDateTime,
        status: "scheduled",
        modality,
      });
    }

    showToast("¡Turno programado correctamente!", "success");

    // Reset form
    setSelectedPatientUuid("");
    setIsRecurrent(false);
    setModality("in_person");
    setSessionDate("");
    setSessionTime("16:00");
    setIsException(false);
    setSelectedDays([0]);
    setCadence("weekly");
    onClose();
  };

  const effectiveBookedSlots = useMemo(() => {
    if (!sessionDate) return bookedSlots;
    try {
      const target = new Date(`${sessionDate}T00:00:00`);
      if (isNaN(target.getTime())) return bookedSlots;

      if (dbSessions.length > 0 || recurrenceRules.length > 0) {
        const weekStart = startOfWeek(target, { weekStartsOn: 1 });
        const weekEnd = endOfWeek(target, { weekStartsOn: 1 });
        return computeAgendaSlots({
          intervalStart: weekStart,
          intervalEnd: weekEnd,
          recurrenceRules,
          dbSessions,
          patients,
          holidays,
          absencePeriods: settings?.absencePeriods,
        });
      }
    } catch {
      // fallback
    }
    return bookedSlots;
  }, [sessionDate, dbSessions, recurrenceRules, patients, holidays, bookedSlots, settings?.absencePeriods]);

  const activeAbsence = useMemo(() => {
    if (!sessionDate || !settings?.absencePeriods || settings.absencePeriods.length === 0) {
      return undefined;
    }
    try {
      const target = new Date(`${sessionDate}T00:00:00`);
      if (isNaN(target.getTime())) return undefined;
      return isDateInAbsence(target, settings.absencePeriods);
    } catch {
      return undefined;
    }
  }, [sessionDate, settings?.absencePeriods]);

  const availableSlots = useMemo(() => {
    if (!sessionDate) return [];
    try {
      const targetDate = new Date(`${sessionDate}T00:00:00`);
      if (isNaN(targetDate.getTime())) return [];
      return findAvailableSlots({
        targetDate,
        bookedSlots: effectiveBookedSlots,
        slotDurationMinutes: settings.defaultSessionDurationMinutes,
        intervalStepMinutes: settings.intervalStepMinutes,
        weeklyAvailability: settings.weekly,
        absencePeriods: settings.absencePeriods,
      });
    } catch {
      return [];
    }
  }, [sessionDate, effectiveBookedSlots, settings]);

  const conflictingSlot = useMemo(() => {
    if (!sessionDate || !sessionTime || !effectiveBookedSlots || effectiveBookedSlots.length === 0) {
      return undefined;
    }
    try {
      const slotDateTime = new Date(`${sessionDate}T${sessionTime}:00`);
      if (isNaN(slotDateTime.getTime())) return undefined;
      return findConflictingSlot(
        slotDateTime,
        settings.defaultSessionDurationMinutes,
        effectiveBookedSlots
      );
    } catch {
      return undefined;
    }
  }, [sessionDate, sessionTime, effectiveBookedSlots, settings.defaultSessionDurationMinutes]);

  const conflictingPatientName = useMemo(() => {
    if (!conflictingSlot) return "";
    const p = patients.find((pat) => pat.uuid === conflictingSlot.patientUuid);
    return p ? p.fullName : "otro paciente";
  }, [conflictingSlot, patients]);

  useEffect(() => {
    if (!isException && availableSlots.length > 0) {
      const matches = availableSlots.some((s) => s.time === sessionTime);
      if (!matches) {
        setSessionTime(availableSlots[0].time);
      }
    }
  }, [availableSlots, isException, sessionTime]);

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

          {/* Modalidad de atención */}
          <div>
            <label className="text-sm font-semibold text-ink block mb-1.5">
              Modalidad de atención
            </label>
            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => setModality("in_person")}
                className={`flex items-center justify-center gap-2 py-2 px-3 rounded-lg border text-base font-medium transition-all cursor-pointer ${
                  modality === "in_person"
                    ? "bg-primary text-surface border-primary shadow-xs"
                    : "bg-surface border-line text-ink hover:bg-bg-base"
                }`}
              >
                <Icon name="pin" size={15} />
                <span>Presencial</span>
              </button>
              <button
                type="button"
                onClick={() => setModality("online")}
                className={`flex items-center justify-center gap-2 py-2 px-3 rounded-lg border text-base font-medium transition-all cursor-pointer ${
                  modality === "online"
                    ? "bg-primary text-surface border-primary shadow-xs"
                    : "bg-surface border-line text-ink hover:bg-bg-base"
                }`}
              >
                <Icon name="video" size={15} />
                <span>Virtual</span>
              </button>
            </div>
          </div>

          {/* Row 2: Date & Time Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 items-start">
            <div>
              <label htmlFor="modal-date" className="text-sm font-semibold text-ink block mb-1.5">
                {isRecurrent ? "Fecha de inicio *" : "Fecha del turno *"}
              </label>
              <DateInput
                id="modal-date"
                required
                value={sessionDate}
                onChange={handleDateChange}
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label htmlFor="modal-time" className="text-sm font-semibold text-ink">
                  Hora <span className="text-primary font-bold">*</span>
                </label>
                {sessionDate && availableSlots.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setIsException(!isException)}
                    className="text-xs text-primary hover:underline font-medium cursor-pointer transition-colors"
                  >
                    {isException ? "Ver horarios disponibles" : "Horario fuera de agenda"}
                  </button>
                )}
              </div>

              {/* Slot Pills or Manual Time Input */}
              {!isException && sessionDate && availableSlots.length > 0 ? (
                <div className="space-y-2">
                  <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto p-1.5 border border-line rounded-lg bg-bg-base/40">
                    {availableSlots.map((slot) => {
                      const isSelected = sessionTime === slot.time;
                      return (
                        <button
                          key={slot.time}
                          type="button"
                          onClick={() => setSessionTime(slot.time)}
                          className={`px-2.5 py-1 text-sm font-medium rounded-md transition-all cursor-pointer ${
                            isSelected
                              ? "bg-primary text-surface font-semibold shadow-xs"
                              : "bg-surface text-ink border border-line hover:border-line-control hover:bg-bg-base"
                          }`}
                        >
                          {slot.time}
                        </button>
                      );
                    })}
                  </div>
                  <div className="flex items-center justify-between text-xs text-ink-sub">
                    <span>Hora elegida:</span>
                    <input
                      id="modal-time"
                      type="time"
                      required
                      value={sessionTime}
                      onChange={(e) => setSessionTime(e.target.value)}
                      className="bg-surface border border-line rounded-lg px-2.5 py-1 text-ink text-sm font-medium focus:outline-none focus:border-primary cursor-pointer transition-colors"
                    />
                  </div>
                </div>
              ) : (
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <input
                      id="modal-time"
                      type="time"
                      required
                      value={sessionTime}
                      onChange={(e) => setSessionTime(e.target.value)}
                      className="w-full bg-surface border border-line rounded-lg px-3 py-2 text-ink focus:outline-none focus:border-primary text-base cursor-pointer transition-colors"
                    />
                    <span className="text-sm font-semibold text-ink-sub shrink-0 px-2.5 py-2 bg-bg-base border border-line rounded-lg">
                      {sessionTime} hs
                    </span>
                  </div>
                  {sessionDate && (
                    <p className="text-xs text-ink-sub flex items-center gap-1">
                      <Icon name="alert" size={13} className="text-amber-500 shrink-0" />
                      {isException
                        ? "Modo excepción: podés asignar cualquier hora fuera de tu disponibilidad normal."
                        : "No tenés horarios libres según tu disponibilidad para este día. Podés ingresar un horario excepcional."}
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Absence / Recess Alert */}
          {activeAbsence && (
            <div
              role="alert"
              className="flex items-start gap-2.5 p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl text-amber-700 text-sm animate-in fade-in duration-150"
            >
              <Icon name="alert" size={18} className="shrink-0 mt-0.5 text-amber-600" />
              <div className="leading-tight">
                <span className="font-semibold block mb-0.5">Período de receso / vacaciones</span>
                <span>
                  Esta fecha coincide con un receso programado:{" "}
                  <strong className="font-semibold">{activeAbsence.reason || "Vacaciones"}</strong> (del{" "}
                  {activeAbsence.startDate} al {activeAbsence.endDate}). Podés programar el turno si se trata de una atención excepcional.
                </span>
              </div>
            </div>
          )}

          {/* Collision Warning Alert */}
          {conflictingSlot && (
            <div
              role="alert"
              className="flex items-start gap-2.5 p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl text-amber-700 text-sm animate-in fade-in duration-150"
            >
              <Icon name="alert" size={18} className="shrink-0 mt-0.5 text-amber-600" />
              <div className="leading-tight">
                <span className="font-semibold block mb-0.5">Superposición de horarios</span>
                <span>
                  Ya existe un turno agendado para <strong className="font-semibold">{conflictingPatientName}</strong> a las{" "}
                  {format(conflictingSlot.dateTime, "HH:mm")} hs. Podés continuar si se trata de una excepción deliberada.
                </span>
              </div>
            </div>
          )}

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
