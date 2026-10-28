"use client";

import React, { useState, useEffect } from "react";
import { Icon } from "../common/Icon";

interface CopyScheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
  fromDay: number;
  onApply: (targetDays: number[]) => void;
}

const DAYS = [
  { index: 1, label: "Lunes" },
  { index: 2, label: "Martes" },
  { index: 3, label: "Miércoles" },
  { index: 4, label: "Jueves" },
  { index: 5, label: "Viernes" },
  { index: 6, label: "Sábado" },
  { index: 0, label: "Domingo" },
];

export function CopyScheduleModal({
  isOpen,
  onClose,
  fromDay,
  onApply,
}: CopyScheduleModalProps) {
  const [selectedDays, setSelectedDays] = useState<number[]>([]);

  useEffect(() => {
    if (isOpen) {
      // By default, select all Mon-Fri except source day
      const defaultTargets = [1, 2, 3, 4, 5].filter((d) => d !== fromDay);
      setSelectedDays(defaultTargets);
    }
  }, [isOpen, fromDay]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const toggleDay = (dayIndex: number) => {
    setSelectedDays((prev) =>
      prev.includes(dayIndex) ? prev.filter((d) => d !== dayIndex) : [...prev, dayIndex]
    );
  };

  const handleApply = () => {
    onApply(selectedDays);
    onClose();
  };

  const fromDayLabel = DAYS.find((d) => d.index === fromDay)?.label || "Día";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/40 backdrop-blur-xs"
      onClick={onClose}
    >
      <div
        className="bg-surface border border-line rounded-2xl shadow-xl w-full max-w-md p-6 space-y-5"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="copy-modal-title"
      >
        <div className="flex items-center justify-between pb-3 border-b border-line">
          <div>
            <h2 id="copy-modal-title" className="text-lg font-semibold text-ink">
              Copiar horario de {fromDayLabel}
            </h2>
            <p className="text-sm text-ink-sub mt-0.5">
              Seleccioná los días a los que querés aplicar esta misma configuración:
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-ink-sub hover:text-ink hover:bg-bg-base rounded-lg transition-colors cursor-pointer"
            aria-label="Cerrar modal"
          >
            <Icon name="x" size={18} />
          </button>
        </div>

        <div className="grid grid-cols-2 gap-2.5 py-1">
          {DAYS.map((day) => {
            const isSource = day.index === fromDay;
            const isSelected = selectedDays.includes(day.index);

            return (
              <button
                key={day.index}
                type="button"
                disabled={isSource}
                onClick={() => toggleDay(day.index)}
                className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl border text-sm font-medium transition-all cursor-pointer ${
                  isSource
                    ? "opacity-40 border-line bg-bg-base cursor-not-allowed text-ink-sub"
                    : isSelected
                    ? "border-primary bg-primary-tint/30 text-primary font-semibold shadow-xs"
                    : "border-line bg-surface hover:bg-bg-base/60 text-ink"
                }`}
              >
                <span>{day.label}</span>
                {isSource ? (
                  <span className="text-xs text-ink-sub">(Origen)</span>
                ) : isSelected ? (
                  <span className="text-primary">
                    <Icon name="check" size={16} />
                  </span>
                ) : null}
              </button>
            );
          })}
        </div>

        <div className="flex items-center justify-end gap-3 pt-3 border-t border-line">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border border-line rounded-xl text-sm font-medium text-ink hover:bg-bg-base transition-colors cursor-pointer"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleApply}
            disabled={selectedDays.length === 0}
            className="px-5 py-2 bg-primary hover:bg-primary-hover text-surface text-sm font-semibold rounded-xl shadow-xs transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Copiar a {selectedDays.length} {selectedDays.length === 1 ? "día" : "días"}
          </button>
        </div>
      </div>
    </div>
  );
}
