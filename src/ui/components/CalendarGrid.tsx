"use client";

import React from "react";
import { format, isSameDay } from "date-fns";
import { es } from "date-fns/locale";
import { CalendarSlot } from "../../domain/agenda.types";
import { Holiday, getHoliday } from "../../domain/holidays";
import { Session } from "../../domain/session.types";
import { CalendarHeader } from "./calendar/CalendarHeader";
import { WeekStrip } from "./calendar/WeekStrip";
import { AppointmentCard } from "./calendar/AppointmentCard";
import { AppointmentEmptyState } from "./calendar/AppointmentEmptyState";
import { MiniMonthCalendar } from "./calendar/MiniMonthCalendar";

interface CalendarGridProps {
  currentDate: Date;
  weekDays: Date[];
  agenda: CalendarSlot[];
  holidays: Holiday[];
  nextWeek: () => void;
  prevWeek: () => void;
  goToToday: () => void;
  onUpdateStatus: (slot: CalendarSlot, status: Session["status"]) => Promise<void>;
  onRemoveRecurrenceRule: (patientUuid: string) => Promise<void>;
  onOpenSessionModal: () => void;
  selectDate: (date: Date) => void;
  dbSessions: any[];
  recurrenceRules: any[];
  onNavigateToPatientDetail: (patientUuid: string) => void;
}

export function CalendarGrid({
  currentDate,
  weekDays,
  agenda,
  holidays,
  nextWeek,
  prevWeek,
  goToToday,
  onUpdateStatus,
  onRemoveRecurrenceRule,
  onOpenSessionModal,
  selectDate,
  dbSessions,
  recurrenceRules,
  onNavigateToPatientDetail,
}: CalendarGridProps) {
  const currentHoliday = getHoliday(currentDate, holidays);
  const dayAppointments = agenda.filter((slot) => isSameDay(slot.dateTime, currentDate));

  return (
    <section className="space-y-4">
      {/* 1. Header with Week Navigation & Single Programar Turno Button */}
      {weekDays.length >= 7 && (
        <CalendarHeader
          weekStart={weekDays[0]}
          weekEnd={weekDays[6]}
          onPrevWeek={prevWeek}
          onNextWeek={nextWeek}
          onGoToToday={goToToday}
          onOpenSessionModal={onOpenSessionModal}
        />
      )}

      {/* 2. 7-Day Week Strip */}
      <WeekStrip
        weekDays={weekDays}
        selectedDate={currentDate}
        onSelectDate={selectDate}
        agenda={agenda}
        holidays={holidays}
      />

      {/* 3. Main Workspace: Selected Day Appointments + Mini Calendar */}
      <div className="flex flex-col lg:flex-row gap-6 items-start">
        {/* Daily Appointments Column */}
        <section
          aria-labelledby="selected-day-title"
          className="flex-1 w-full bg-surface border border-line rounded-2xl p-5 shadow-xs"
        >
          {/* Day Heading */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 mb-4 border-b border-line gap-2">
            <div>
              <span className="text-[11px] font-semibold text-ink-sub uppercase tracking-wider block">
                Turnos para el
              </span>
              <h2
                id="selected-day-title"
                className="text-lg font-serif font-semibold text-ink capitalize"
              >
                {format(currentDate, "eeee d 'de' MMMM 'de' yyyy", { locale: es })}
              </h2>
            </div>

            {currentHoliday && (
              <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/15 text-amber-800 self-start sm:self-auto">
                Feriado: {currentHoliday.name}
              </span>
            )}
          </div>

          {/* List or Empty State */}
          {dayAppointments.length === 0 ? (
            <AppointmentEmptyState onOpenSessionModal={onOpenSessionModal} />
          ) : (
            <div className="space-y-2.5">
              {dayAppointments.map((slot, idx) => (
                <AppointmentCard
                  key={idx}
                  slot={slot}
                  onUpdateStatus={onUpdateStatus}
                  onRemoveRecurrenceRule={onRemoveRecurrenceRule}
                  onNavigateToPatientDetail={onNavigateToPatientDetail}
                />
              ))}
            </div>
          )}
        </section>

        {/* Mini Month Calendar */}
        <MiniMonthCalendar
          currentDate={currentDate}
          weekDays={weekDays}
          dbSessions={dbSessions}
          recurrenceRules={recurrenceRules}
          onSelectDate={selectDate}
        />
      </div>
    </section>
  );
}
