"use client";

import React, { useState, useMemo, useEffect } from "react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import {
  CalendarSlot,
  RescheduleScope,
  AvailableSlot,
  RescheduleSlotParams,
  SwapSlotsParams,
} from "../../../domain/agenda.types";
import { findAvailableSlots } from "../../../domain/agenda.service";
import { useUIState } from "../../context/UIContext";
import { Icon } from "../common/Icon";
import { DateInput } from "../common/DateInput";

interface RescheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
  slot: CalendarSlot | null;
  bookedSlots: CalendarSlot[];
  onReschedule: (params: RescheduleSlotParams) => Promise<void>;
  onSwap: (params: SwapSlotsParams) => Promise<void>;
}

type Mode = "reschedule" | "swap";

export function RescheduleModal({
  isOpen,
  onClose,
  slot,
  bookedSlots,
  onReschedule,
  onSwap,
}: RescheduleModalProps) {
  const [mode, setMode] = useState<Mode>("reschedule");
  const [scope, setScope] = useState<RescheduleScope>("eventual");
  const [targetDateStr, setTargetDateStr] = useState("");
  const [selectedAvailableSlot, setSelectedAvailableSlot] = useState<AvailableSlot | null>(null);
  const [selectedSwapSlotKey, setSelectedSwapSlotKey] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { showToast } = useUIState();

  useEffect(() => {
    if (slot) {
      setTargetDateStr(format(slot.dateTime, "yyyy-MM-dd"));
      setSelectedAvailableSlot(null);
      setSelectedSwapSlotKey("");
      setMode("reschedule");
      setScope("eventual");
    }
  }, [slot]);

  const targetDate = useMemo(() => {
    if (!targetDateStr) return new Date();
    return new Date(`${targetDateStr}T00:00:00`);
  }, [targetDateStr]);

  const availableSlots = useMemo(() => {
    if (!targetDateStr) return [];
    return findAvailableSlots({
      targetDate,
      bookedSlots,
      startHour: 8,
      endHour: 20,
      slotDurationMinutes: 50,
    });
  }, [targetDateStr, targetDate, bookedSlots]);

  const swapCandidates = useMemo(() => {
    if (!slot) return [];
    return bookedSlots.filter(
      (s) =>
        s.patientUuid !== slot.patientUuid &&
        s.status !== "cancelled" &&
        s.dateTime.getTime() !== slot.dateTime.getTime()
    );
  }, [slot, bookedSlots]);

  if (!isOpen || !slot) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    try {
      setIsSubmitting(true);
      if (mode === "reschedule") {
        if (!selectedAvailableSlot) return;
        await onReschedule({
          slot,
          newDateTime: selectedAvailableSlot.dateTime,
          scope,
        });
      } else {
        const targetSlot = swapCandidates.find(
          (c) => `${c.patientUuid}-${c.dateTime.getTime()}` === selectedSwapSlotKey
        );
        if (!targetSlot) return;
        await onSwap({
          slotA: slot,
          slotB: targetSlot,
          scope,
        });
      }

      showToast(
        mode === "reschedule"
          ? "¡Turno reagendado correctamente!"
          : "¡Intercambio de turnos realizado con éxito!",
        "success"
      );
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  const currentSlotTimeStr = format(slot.dateTime, "HH:mm");
  const currentSlotDateStr = format(slot.dateTime, "EEEE d 'de' MMMM", { locale: es });

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="reschedule-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 backdrop-blur-xs p-4"
    >
      <div className="bg-surface border border-line rounded-2xl max-w-3xl w-full overflow-hidden shadow-xl animate-in fade-in zoom-in-95 duration-150 flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-line flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary-tint text-primary rounded-xl shrink-0">
              <Icon name="refresh" size={20} />
            </div>
            <div>
              <h3 id="reschedule-modal-title" className="font-serif font-medium text-lg text-ink leading-tight">
                Reagendar turno
              </h3>
              <p className="text-sm text-ink-sub mt-0.5">
                Paciente: <strong className="text-ink font-semibold">{slot.patientName}</strong>
              </p>
            </div>
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

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-5 space-y-4 overflow-y-auto">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-start">
            {/* Left Column: Context & Modifiers (5 cols) */}
            <div className="md:col-span-5 space-y-3.5">
              {/* Current slot info banner */}
              <div className="p-3 bg-bg-base/60 border border-line rounded-xl text-sm flex items-start gap-2.5">
                <div className="p-1.5 bg-primary-tint text-primary rounded-lg shrink-0 mt-0.5">
                  <Icon name="calendar" size={16} />
                </div>
                <div className="min-w-0">
                  <span className="text-xs text-ink-sub block uppercase tracking-wider font-semibold">
                    Turno actual
                  </span>
                  <span className="text-sm text-ink font-semibold capitalize block truncate">
                    {currentSlotDateStr}
                  </span>
                  <span className="text-xs text-ink-sub block">
                    A las {currentSlotTimeStr} hs
                  </span>
                </div>
              </div>

              {/* Operation Mode Selector: Move vs Swap */}
              <div>
                <label className="text-sm font-semibold text-ink block mb-1.5">
                  Tipo de reagendamiento
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setMode("reschedule")}
                    className={`p-2.5 rounded-xl border text-left transition-colors cursor-pointer flex flex-col gap-0.5 ${
                      mode === "reschedule"
                        ? "bg-primary-tint/40 border-primary text-primary"
                        : "bg-surface border-line text-ink hover:border-line-control"
                    }`}
                  >
                    <div className="flex items-center gap-1.5 font-semibold text-sm">
                      <Icon name="refresh" size={14} />
                      <span>Disponible</span>
                    </div>
                    <span className="text-xs text-ink-sub">
                      Espacio libre
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setMode("swap")}
                    className={`p-2.5 rounded-xl border text-left transition-colors cursor-pointer flex flex-col gap-0.5 ${
                      mode === "swap"
                        ? "bg-primary-tint/40 border-primary text-primary"
                        : "bg-surface border-line text-ink hover:border-line-control"
                    }`}
                  >
                    <div className="flex items-center gap-1.5 font-semibold text-sm">
                      <Icon name="repeat" size={14} />
                      <span>Intercambio</span>
                    </div>
                    <span className="text-xs text-ink-sub">
                      Con otro paciente
                    </span>
                  </button>
                </div>
              </div>

              {/* Scope Selector: Eventual vs Permanent */}
              <div>
                <label className="text-sm font-semibold text-ink block mb-1.5">
                  Alcance de la modificación
                </label>
                <div className="space-y-2">
                  <label
                    className={`p-2.5 rounded-xl border cursor-pointer transition-colors flex items-start gap-2.5 ${
                      scope === "eventual"
                        ? "bg-primary-tint/30 border-primary text-ink"
                        : "bg-surface border-line text-ink hover:border-line-control"
                    }`}
                  >
                    <input
                      type="radio"
                      name="scope"
                      value="eventual"
                      checked={scope === "eventual"}
                      onChange={() => setScope("eventual")}
                      className="mt-0.5 accent-primary"
                    />
                    <div className="text-sm leading-snug">
                      <span className="font-semibold block text-sm">Solo esta vez</span>
                      <span className="text-xs text-ink-sub">
                        Modificación eventual (mantiene fijos)
                      </span>
                    </div>
                  </label>

                  <label
                    className={`p-2.5 rounded-xl border cursor-pointer transition-colors flex items-start gap-2.5 ${
                      scope === "permanent"
                        ? "bg-primary-tint/30 border-primary text-ink"
                        : "bg-surface border-line text-ink hover:border-line-control"
                    }`}
                  >
                    <input
                      type="radio"
                      name="scope"
                      value="permanent"
                      checked={scope === "permanent"}
                      onChange={() => setScope("permanent")}
                      className="mt-0.5 accent-primary"
                    />
                    <div className="text-sm leading-snug">
                      <span className="font-semibold block text-sm">De ahora en más</span>
                      <span className="text-xs text-ink-sub">
                        Permanente (actualiza recurrencia)
                      </span>
                    </div>
                  </label>
                </div>
              </div>
            </div>

            {/* Right Column: Target Date & Slot Selection (7 cols) */}
            <div className="md:col-span-7 bg-bg-base/30 p-3.5 border border-line rounded-xl space-y-3">
              {mode === "reschedule" && (
                <>
                  <div>
                    <label
                      htmlFor="reschedule-date"
                      className="text-sm font-semibold text-ink block mb-1"
                    >
                      Fecha de destino <span className="text-primary font-bold">*</span>
                    </label>
                    <DateInput
                      id="reschedule-date"
                      required
                      value={targetDateStr}
                      onChange={(iso) => {
                        setTargetDateStr(iso);
                        setSelectedAvailableSlot(null);
                      }}
                    />
                  </div>

                  <div>
                    <label className="text-sm font-semibold text-ink block mb-1.5">
                      Horarios disponibles ({availableSlots.length} libres)
                    </label>
                    {availableSlots.length === 0 ? (
                      <p className="text-sm text-ink-sub p-4 border border-dashed border-line rounded-xl text-center bg-surface">
                        No hay horarios disponibles para esta fecha.
                      </p>
                    ) : (
                      <div className="grid grid-cols-3 sm:grid-cols-4 gap-1.5 max-h-48 overflow-y-auto p-0.5">
                        {availableSlots.map((av) => {
                          const isSelected = selectedAvailableSlot?.time === av.time;
                          return (
                            <button
                              key={av.time}
                              type="button"
                              onClick={() => setSelectedAvailableSlot(av)}
                              className={`py-2 px-1 text-sm font-mono rounded-lg border text-center transition-all cursor-pointer ${
                                isSelected
                                  ? "bg-primary text-surface border-primary font-bold shadow-xs scale-102"
                                  : "bg-surface text-ink border-line hover:border-line-control hover:bg-bg-base"
                              }`}
                            >
                              {av.time}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </>
              )}

              {mode === "swap" && (
                <div className="space-y-3">
                  <div>
                    <label
                      htmlFor="swap-candidate"
                      className="text-sm font-semibold text-ink block mb-1.5"
                    >
                      Seleccionar turno a intercambiar <span className="text-primary font-bold">*</span>
                    </label>
                    {swapCandidates.length === 0 ? (
                      <p className="text-sm text-ink-sub p-4 border border-dashed border-line rounded-xl text-center bg-surface">
                        No hay otros turnos programados para intercambiar.
                      </p>
                    ) : (
                      <select
                        id="swap-candidate"
                        required
                        value={selectedSwapSlotKey}
                        onChange={(e) => setSelectedSwapSlotKey(e.target.value)}
                        className="w-full bg-surface border border-line rounded-lg px-3 py-2 text-ink focus:outline-none focus:border-primary text-base cursor-pointer transition-colors"
                      >
                        <option value="">Seleccionar paciente y turno</option>
                        {swapCandidates.map((c) => {
                          const key = `${c.patientUuid}-${c.dateTime.getTime()}`;
                          const formattedTime = format(c.dateTime, "EEE d/MM HH:mm", {
                            locale: es,
                          });
                          return (
                            <option key={key} value={key}>
                              {c.patientName} — {formattedTime} hs
                            </option>
                          );
                        })}
                      </select>
                    )}
                  </div>
                  <p className="text-xs text-ink-sub leading-relaxed">
                    Se intercambiarán los turnos de ambos pacientes preservando la duración y consistencia en la agenda.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Modal Footer */}
          <div className="pt-3 border-t border-line flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 text-sm font-semibold text-ink-sub hover:text-ink hover:bg-bg-base rounded-lg transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={
                isSubmitting ||
                (mode === "reschedule" && !selectedAvailableSlot) ||
                (mode === "swap" && !selectedSwapSlotKey)
              }
              className="px-4 py-2 bg-primary hover:bg-primary-hover disabled:opacity-50 text-surface text-sm font-semibold rounded-lg shadow-xs transition-colors cursor-pointer"
            >
              {isSubmitting ? "Guardando..." : "Confirmar cambio"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
