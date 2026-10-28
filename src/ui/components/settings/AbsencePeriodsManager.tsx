"use client";

import React, { useState } from "react";
import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import { AbsencePeriod } from "../../../domain/availability.types";
import { validateAbsencePeriod } from "../../../domain/availability.service";
import { Icon } from "../common/Icon";
import { DateInput } from "../common/DateInput";

interface AbsencePeriodsManagerProps {
  absencePeriods: AbsencePeriod[];
  onAddPeriod: (period: Omit<AbsencePeriod, "id">) => void;
  onRemovePeriod: (id: string) => void;
}

export function AbsencePeriodsManager({
  absencePeriods,
  onAddPeriod,
  onRemovePeriod,
}: AbsencePeriodsManagerProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const validation = validateAbsencePeriod({
      startDate,
      endDate: endDate || startDate,
      reason,
    });

    if (!validation.valid) {
      setError(validation.error || "Datos inválidos");
      return;
    }

    onAddPeriod({
      startDate,
      endDate: endDate || startDate,
      reason: reason.trim(),
    });

    // Reset form
    setStartDate("");
    setEndDate("");
    setReason("");
    setIsAdding(false);
  };

  const formatDateLabel = (isoDate: string) => {
    try {
      const parsed = parseISO(isoDate);
      return format(parsed, "d 'de' MMMM, yyyy", { locale: es });
    } catch {
      return isoDate;
    }
  };

  return (
    <div className="bg-surface border border-line rounded-xl p-5 shadow-xs space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
        <div>
          <h4 className="font-semibold text-ink text-base flex items-center gap-2">
            <span>Períodos de receso y vacaciones</span>
            {absencePeriods.length > 0 && (
              <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-primary-tint text-primary">
                {absencePeriods.length}
              </span>
            )}
          </h4>
          <p className="text-xs text-ink-sub mt-0.5">
            Definí las fechas en las que no prestarás atención. Las sesiones recurrentes se tacharán en la agenda y se excluirán de la facturación proyectada.
          </p>
        </div>

        {!isAdding && (
          <button
            type="button"
            onClick={() => setIsAdding(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-primary/10 hover:bg-primary/20 text-primary text-sm font-semibold rounded-lg transition-colors cursor-pointer self-start sm:self-auto shrink-0"
          >
            <Icon name="plus" size={15} />
            <span>Nuevo período</span>
          </button>
        )}
      </div>

      {/* Formulario para nuevo período */}
      {isAdding && (
        <form
          onSubmit={handleAdd}
          className="p-4 bg-bg-base/60 border border-line rounded-xl space-y-3.5 animate-in fade-in duration-150"
        >
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-ink">Agregar nuevo período de ausencia</span>
            <button
              type="button"
              onClick={() => {
                setIsAdding(false);
                setError(null);
              }}
              className="text-xs text-ink-sub hover:text-ink cursor-pointer"
            >
              Cancelar
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label htmlFor="absence-start-date" className="text-sm font-semibold text-ink block mb-1">
                Fecha de inicio <span className="text-primary font-bold">*</span>
              </label>
              <DateInput
                id="absence-start-date"
                required
                value={startDate}
                onChange={(val) => {
                  setStartDate(val);
                  if (!endDate) setEndDate(val);
                }}
              />
            </div>

            <div>
              <label htmlFor="absence-end-date" className="text-sm font-semibold text-ink block mb-1">
                Fecha de fin <span className="text-primary font-bold">*</span>
              </label>
              <DateInput
                id="absence-end-date"
                required
                value={endDate}
                onChange={(val) => setEndDate(val)}
              />
            </div>
          </div>

          <div>
            <label htmlFor="absence-reason" className="text-sm font-semibold text-ink block mb-1">
              Motivo o etiqueta <span className="text-primary font-bold">*</span>
            </label>
            <input
              id="absence-reason"
              type="text"
              required
              placeholder="ej. Vacaciones de verano, Congreso de Salud Mental, Licencia médica"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full bg-surface border border-line rounded-lg px-3 py-2 text-ink text-base focus:outline-none focus:border-primary transition-colors"
            />
          </div>

          {error && (
            <div
              role="alert"
              className="flex items-center gap-2 p-2.5 bg-red-500/10 border border-red-500/20 text-red-700 text-xs rounded-lg"
            >
              <Icon name="alert" size={14} className="shrink-0 text-red-600" />
              <span>{error}</span>
            </div>
          )}

          <div className="flex items-center justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={() => {
                setIsAdding(false);
                setError(null);
              }}
              className="px-3 py-1.5 text-sm font-semibold text-ink-sub hover:text-ink rounded-lg transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 bg-primary hover:bg-primary-hover text-surface text-sm font-semibold rounded-lg shadow-xs transition-colors cursor-pointer"
            >
              Guardar período
            </button>
          </div>
        </form>
      )}

      {/* Lista de períodos configurados */}
      {absencePeriods.length === 0 ? (
        <div className="py-4 px-3 text-center border border-dashed border-line rounded-lg text-xs text-ink-sub bg-bg-base/20">
          No tenés períodos de vacaciones o ausencias configurados.
        </div>
      ) : (
        <div className="space-y-2">
          {absencePeriods.map((period) => (
            <div
              key={period.id}
              className="flex items-center justify-between p-3 bg-surface border border-line rounded-lg hover:border-line-control transition-colors"
            >
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-ink text-sm">{period.reason}</span>
                  <span className="px-2 py-0.5 text-xs font-medium rounded-md bg-amber-500/15 text-amber-700">
                    Receso
                  </span>
                </div>
                <p className="text-xs text-ink-sub">
                  Desde el <strong className="text-ink font-medium">{formatDateLabel(period.startDate)}</strong> hasta el{" "}
                  <strong className="text-ink font-medium">{formatDateLabel(period.endDate)}</strong>
                </p>
              </div>

              <button
                type="button"
                onClick={() => onRemovePeriod(period.id)}
                aria-label={`Eliminar período ${period.reason}`}
                className="p-1.5 text-ink-sub hover:text-red-600 hover:bg-red-500/10 rounded-md transition-colors cursor-pointer"
              >
                <Icon name="trash" size={16} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
