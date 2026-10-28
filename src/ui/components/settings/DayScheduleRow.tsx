"use client";

import React, { useState } from "react";
import { DaySchedule, TimeRange } from "../../../domain/availability.types";
import { CopyScheduleModal } from "./CopyScheduleModal";
import { Icon } from "../common/Icon";

interface DayScheduleRowProps {
  dayIndex: number;
  dayName: string;
  schedule: DaySchedule;
  onToggleEnabled: (enabled: boolean) => void;
  onUpdateRange: (index: number, field: "start" | "end", value: string) => void;
  onAddRange: () => void;
  onRemoveRange: (index: number) => void;
  onCopySchedule: (fromDay: number, toDays: number[]) => void;
}

export function DayScheduleRow({
  dayIndex,
  dayName,
  schedule,
  onToggleEnabled,
  onUpdateRange,
  onAddRange,
  onRemoveRange,
  onCopySchedule,
}: DayScheduleRowProps) {
  const [isCopyModalOpen, setIsCopyModalOpen] = useState(false);

  return (
    <div className="py-4 border-b border-line/60 last:border-b-0 space-y-3">
      {/* Header row: Day name, active switch toggle, and copy button */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={schedule.enabled}
              onChange={(e) => onToggleEnabled(e.target.checked)}
              className="sr-only peer"
              aria-label={`Habilitar atención para ${dayName}`}
            />
            <div className="w-11 h-6 bg-line peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary" />
          </label>
          <span
            className={`text-base font-medium ${
              schedule.enabled ? "text-ink font-semibold" : "text-ink-sub/70"
            }`}
          >
            {dayName}
          </span>
          {!schedule.enabled && (
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-bg-base text-ink-sub border border-line">
              No atiende
            </span>
          )}
        </div>

        {schedule.enabled && (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsCopyModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-line bg-surface hover:bg-bg-base text-xs font-semibold text-ink-sub hover:text-ink transition-colors cursor-pointer shadow-2xs"
              title={`Copiar horario de ${dayName} a otros días`}
            >
              <Icon name="repeat" size={13} />
              <span>Copiar a...</span>
            </button>
            <button
              type="button"
              onClick={onAddRange}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-dashed border-primary/50 bg-primary-tint/20 hover:bg-primary-tint/50 text-xs font-semibold text-primary transition-colors cursor-pointer"
            >
              <Icon name="plus" size={12} />
              <span>+ Franja</span>
            </button>
          </div>
        )}
      </div>

      {/* Ranges list when day is active */}
      {schedule.enabled && (
        <div className="pl-0 sm:pl-14 space-y-2.5">
          {schedule.ranges.length === 0 ? (
            <p className="text-sm text-warn italic">
              No hay franjas configuradas. Agregá al menos una franja horaria.
            </p>
          ) : (
            schedule.ranges.map((range, idx) => (
              <div
                key={idx}
                className="flex items-center gap-2.5 flex-wrap bg-bg-base/40 p-2.5 rounded-xl border border-line/50"
              >
                <span className="text-xs font-semibold text-ink-sub uppercase tracking-wider w-16">
                  {idx === 0 ? "Turno 1" : `Turno ${idx + 1}`}
                </span>
                <div className="flex items-center gap-2">
                  <input
                    type="time"
                    value={range.start}
                    onChange={(e) => onUpdateRange(idx, "start", e.target.value)}
                    className="bg-surface border border-line rounded-lg px-2.5 py-1.5 text-base text-ink font-mono focus:outline-none focus:border-primary transition-colors"
                    aria-label={`Hora inicio franja ${idx + 1} de ${dayName}`}
                  />
                  <span className="text-sm text-ink-sub font-medium">a</span>
                  <input
                    type="time"
                    value={range.end}
                    onChange={(e) => onUpdateRange(idx, "end", e.target.value)}
                    className="bg-surface border border-line rounded-lg px-2.5 py-1.5 text-base text-ink font-mono focus:outline-none focus:border-primary transition-colors"
                    aria-label={`Hora fin franja ${idx + 1} de ${dayName}`}
                  />
                </div>

                {schedule.ranges.length > 1 && (
                  <button
                    type="button"
                    onClick={() => onRemoveRange(idx)}
                    className="p-1.5 text-ink-sub hover:text-err hover:bg-err-tint/40 rounded-lg transition-colors cursor-pointer ml-auto"
                    title="Eliminar esta franja"
                    aria-label={`Eliminar franja ${idx + 1}`}
                  >
                    <Icon name="trash" size={16} />
                  </button>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {/* Modal for cloning schedule */}
      <CopyScheduleModal
        isOpen={isCopyModalOpen}
        onClose={() => setIsCopyModalOpen(false)}
        fromDay={dayIndex}
        onApply={(targetDays) => onCopySchedule(dayIndex, targetDays)}
      />
    </div>
  );
}
