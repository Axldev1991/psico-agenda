"use client";

import React, { useState, useEffect } from "react";
import {
  format,
  isSameDay,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
  isToday,
  addMonths,
  subMonths,
  isWithinInterval,
} from "date-fns";
import { es } from "date-fns/locale";
import { RRule } from "rrule";
import { Icon } from "../common/Icon";
import { computeMonthlyBilling } from "../../../domain/billing.service";
import { MonthlyBillingBadge } from "./MonthlyBillingBadge";
import { CalendarSlot } from "../../../domain/agenda.types";
import { Holiday, getHoliday } from "../../../domain/holidays";
import { Patient } from "../../../domain/patient.types";
import { computeAgendaSlots } from "../../../domain/agenda.service";


interface MiniMonthCalendarProps {
  currentDate: Date;
  weekDays: Date[];
  dbSessions: any[];
  recurrenceRules: any[];
  holidays?: Holiday[];
  patients?: Patient[];
  onSelectDate: (date: Date) => void;
}

export function MiniMonthCalendar({
  currentDate,
  weekDays,
  dbSessions,
  recurrenceRules,
  holidays = [],
  patients = [],
  onSelectDate,
}: MiniMonthCalendarProps) {
  const [viewMonth, setViewMonth] = useState(
    () => new Date(currentDate.getFullYear(), currentDate.getMonth(), 1)
  );

  useEffect(() => {
    setViewMonth(new Date(currentDate.getFullYear(), currentDate.getMonth(), 1));
  }, [currentDate]);

  const monthStart = startOfMonth(viewMonth);
  const monthEnd = endOfMonth(viewMonth);
  const startDate = startOfWeek(monthStart, { weekStartsOn: 1 });
  const endDate = endOfWeek(monthEnd, { weekStartsOn: 1 });
  const monthDays = eachDayOfInterval({ start: startDate, end: endDate });

  const monthlyAgendaSlots = React.useMemo(() => {
    return computeAgendaSlots({
      intervalStart: monthStart,
      intervalEnd: monthEnd,
      recurrenceRules,
      dbSessions,
      patients,
      holidays,
    });
  }, [monthStart, monthEnd, recurrenceRules, dbSessions, patients, holidays]);

  const billingSummary = React.useMemo(() => {
    return computeMonthlyBilling(monthlyAgendaSlots, viewMonth);
  }, [monthlyAgendaSlots, viewMonth]);


  const hasSessionOnDay = (day: Date): boolean => {
    // 1. Physical sessions
    const hasPhysical = dbSessions.some((s) => {
      const sDate = typeof s.dateTime === "string" ? new Date(s.dateTime) : s.dateTime;
      return isSameDay(sDate, day) && s.status !== "cancelled";
    });
    if (hasPhysical) return true;

    // 2. Recurrent virtual sessions
    const dayStart = new Date(day.getFullYear(), day.getMonth(), day.getDate(), 0, 0, 0);
    const dayEnd = new Date(day.getFullYear(), day.getMonth(), day.getDate(), 23, 59, 59);

    for (const rule of recurrenceRules) {
      try {
        const rrule = RRule.fromString(rule.rruleString);
        const occurrences = rrule.between(dayStart, dayEnd, true);
        if (occurrences.length > 0) {
          const hasCancellation = dbSessions.some((s) => {
            const sDate = typeof s.dateTime === "string" ? new Date(s.dateTime) : s.dateTime;
            return (
              s.patientUuid === rule.patientUuid &&
              isSameDay(sDate, day) &&
              s.status === "cancelled"
            );
          });
          if (!hasCancellation) return true;
        }
      } catch {
        // Skip malformed rules
      }
    }

    return false;
  };

  return (
    <aside className="bg-surface border border-line rounded-2xl p-4 shadow-xs w-full lg:w-72 shrink-0">
      {/* Month Navigation Header */}
      <div className="flex items-center justify-between mb-3 pb-2 border-b border-line">
        <button
          type="button"
          onClick={() => setViewMonth(subMonths(viewMonth, 1))}
          className="p-1 hover:bg-bg-base text-ink-sub hover:text-ink rounded-md transition-colors cursor-pointer"
          title="Mes anterior"
          aria-label="Mes anterior"
        >
          <Icon name="chev-l" size={15} />
        </button>
        <span className="text-sm font-semibold text-ink capitalize">
          {format(viewMonth, "MMMM 'de' yyyy", { locale: es })}
        </span>
        <button
          type="button"
          onClick={() => setViewMonth(addMonths(viewMonth, 1))}
          className="p-1 hover:bg-bg-base text-ink-sub hover:text-ink rounded-md transition-colors cursor-pointer"
          title="Mes siguiente"
          aria-label="Mes siguiente"
        >
          <Icon name="chev-r" size={15} />
        </button>
      </div>

      {/* Weekday labels */}
      <div className="grid grid-cols-7 gap-1 text-center mb-1">
        {["lu", "ma", "mi", "ju", "vi", "sá", "do"].map((dayName) => (
          <span
            key={dayName}
            className="text-xs font-semibold text-ink-sub uppercase tracking-wider"
          >
            {dayName}
          </span>
        ))}
      </div>

      {/* Days Grid */}
      <div className="grid grid-cols-7 gap-1">
        {monthDays.map((day, idx) => {
          const isCurrentMonth = isSameMonth(day, viewMonth);
          const hasSession = hasSessionOnDay(day);
          const isSelectedWeek =
            weekDays.length >= 7 &&
            isWithinInterval(day, { start: weekDays[0], end: weekDays[6] });
          const isCurrentDate = isSameDay(day, currentDate);
          const isTodayDay = isToday(day);

          let cellBgClass = "hover:bg-bg-base";
          let textClass = isCurrentMonth ? "text-ink font-medium" : "text-ink-sub/40";

          if (isCurrentDate) {
            cellBgClass = "bg-primary text-surface shadow-xs font-semibold";
            textClass = "text-surface";
          } else if (isTodayDay) {
            cellBgClass = "border border-primary/60 text-primary";
          } else if (isSelectedWeek) {
            cellBgClass = "bg-bg-base/70";
          }

          return (
            <button
              key={idx}
              type="button"
              onClick={() => onSelectDate(day)}
              className={`h-7 w-full flex flex-col items-center justify-center relative rounded-md text-sm transition-colors cursor-pointer ${cellBgClass}`}
            >
              <span className={textClass}>{format(day, "d")}</span>
              {hasSession && (
                <span
                  className={`absolute bottom-0.5 h-1 w-1 rounded-full ${
                    isCurrentDate ? "bg-surface" : "bg-primary"
                  }`}
                  aria-hidden="true"
                />
              )}
            </button>
          );
        })}
      </div>

      <MonthlyBillingBadge summary={billingSummary} targetMonth={viewMonth} />
    </aside>
  );
}
