"use client";

import React from "react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Icon } from "../common/Icon";

interface CalendarHeaderProps {
  weekStart: Date;
  weekEnd: Date;
  onPrevWeek: () => void;
  onNextWeek: () => void;
  onGoToToday: () => void;
  onOpenSessionModal: () => void;
}

export function CalendarHeader({
  weekStart,
  weekEnd,
  onPrevWeek,
  onNextWeek,
  onGoToToday,
  onOpenSessionModal,
}: CalendarHeaderProps) {
  const rangeLabel = `Semana del ${format(weekStart, "d 'de' MMMM", { locale: es })} al ${format(
    weekEnd,
    "d 'de' MMMM 'de' yyyy",
    { locale: es }
  )}`;

  return (
    <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-line">
      <div>
        <h1 className="text-3xl font-serif font-medium text-ink tracking-tight">Agenda</h1>
        <p className="text-xs md:text-sm text-ink-sub mt-0.5 capitalize">{rangeLabel}</p>
      </div>

      <div className="flex items-center gap-3 self-start md:self-auto flex-wrap">
        {/* Segmented navigation buttons */}
        <div
          role="group"
          aria-label="Navegar entre semanas"
          className="inline-flex items-center rounded-lg border border-line bg-surface p-0.5 shadow-xs"
        >
          <button
            type="button"
            onClick={onPrevWeek}
            aria-label="Semana anterior"
            className="p-1.5 text-ink-sub hover:text-ink hover:bg-bg-base rounded-md transition-colors cursor-pointer"
          >
            <Icon name="chev-l" size={16} />
          </button>
          <button
            type="button"
            onClick={onGoToToday}
            className="px-3 py-1 text-xs font-semibold text-ink hover:bg-bg-base rounded-md transition-colors cursor-pointer"
          >
            Hoy
          </button>
          <button
            type="button"
            onClick={onNextWeek}
            aria-label="Semana siguiente"
            className="p-1.5 text-ink-sub hover:text-ink hover:bg-bg-base rounded-md transition-colors cursor-pointer"
          >
            <Icon name="chev-r" size={16} />
          </button>
        </div>

        {/* Primary Action Button */}
        <button
          type="button"
          onClick={onOpenSessionModal}
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-primary hover:bg-primary-hover text-surface text-xs font-semibold rounded-lg shadow-xs transition-colors cursor-pointer"
        >
          <Icon name="plus" size={16} />
          <span>Programar turno</span>
        </button>
      </div>
    </header>
  );
}
