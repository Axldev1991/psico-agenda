"use client";

import React from "react";
import { format, isSameDay, isToday } from "date-fns";
import { es } from "date-fns/locale";
import { CalendarSlot } from "../../../domain/agenda.types";
import { Holiday, getHoliday } from "../../../domain/holidays";
import { AbsencePeriod } from "../../../domain/availability.types";
import { isDateInAbsence } from "../../../domain/availability.service";

interface WeekStripProps {
  weekDays: Date[];
  selectedDate: Date;
  onSelectDate: (day: Date) => void;
  agenda: CalendarSlot[];
  holidays: Holiday[];
  absencePeriods?: AbsencePeriod[];
}

export function WeekStrip({
  weekDays,
  selectedDate,
  onSelectDate,
  agenda,
  holidays,
  absencePeriods = [],
}: WeekStripProps) {
  return (
    <div
      role="group"
      aria-label="Días de la semana"
      className="grid grid-cols-7 gap-2 my-4"
    >
      {weekDays.map((day, idx) => {
        const isSelected = isSameDay(day, selectedDate);
        const isTodayDay = isToday(day);
        const count = agenda.filter((slot) => isSameDay(slot.dateTime, day)).length;
        const holiday = getHoliday(day, holidays);
        const absence = isDateInAbsence(day, absencePeriods);

        let containerClass =
          "bg-surface border-line text-ink hover:bg-bg-base/70";
        let subTextClass = "text-ink-sub";
        let countClass = "bg-primary-tint text-primary";

        if (isSelected) {
          containerClass = "bg-primary border-primary text-surface shadow-xs";
          subTextClass = "text-surface/85";
          countClass = "bg-surface/20 text-surface";
        } else if (absence) {
          containerClass = "bg-amber-500/10 border-amber-300 text-ink hover:bg-amber-500/15";
          subTextClass = "text-amber-800 font-semibold";
          countClass = "bg-amber-500/20 text-amber-800";
        } else if (isTodayDay) {
          containerClass = "bg-primary-tint/40 border-primary/50 text-ink";
          subTextClass = "text-primary font-semibold";
          countClass = "bg-primary-tint text-primary";
        }

        return (
          <button
            key={idx}
            type="button"
            onClick={() => onSelectDate(day)}
            aria-pressed={isSelected}
            className={`p-2.5 sm:p-3 rounded-xl border transition-all flex flex-col items-center justify-center relative cursor-pointer ${containerClass}`}
          >
            <span className={`text-sm font-semibold uppercase tracking-wider flex items-center gap-1 ${subTextClass}`}>
              {format(day, "eee", { locale: es })}
              {isTodayDay && (
                <span
                  className={`text-[10px] px-1.5 py-0.5 rounded font-bold uppercase tracking-tight ${
                    isSelected
                      ? "bg-surface/25 text-surface"
                      : "bg-primary-tint text-primary"
                  }`}
                >
                  Hoy
                </span>
              )}
            </span>

            <span className="text-base sm:text-lg font-serif font-semibold mt-0.5">
              {format(day, "d")}
            </span>

            <div className="flex gap-1 items-center mt-1 min-h-4">
              {holiday && (
                <span
                  className="text-[11px] px-1.5 py-0.5 bg-amber-500/20 text-amber-800 rounded font-semibold"
                  title={holiday.name}
                >
                  Feriado
                </span>
              )}
              {absence && !holiday && (
                <span
                  className="text-[11px] px-1.5 py-0.5 bg-amber-500/25 text-amber-900 rounded font-semibold"
                  title={`Receso: ${absence.reason}`}
                >
                  Receso
                </span>
              )}
              {count > 0 && (
                <span
                  className={`text-xs px-2 py-0.5 rounded-full font-mono font-bold ${countClass}`}
                >
                  {count}
                </span>
              )}
            </div>
          </button>
        );
      })}
    </div>
  );
}
