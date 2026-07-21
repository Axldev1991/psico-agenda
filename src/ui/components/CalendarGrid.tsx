"use client";

import { useState, useEffect } from "react";
import { 
  format, 
  isSameDay, 
  startOfMonth, 
  endOfMonth, 
  startOfWeek as startOfWeekFn, 
  endOfWeek as endOfWeekFn, 
  eachDayOfInterval, 
  isSameMonth, 
  isToday, 
  addMonths, 
  subMonths,
  isWithinInterval
} from "date-fns";
import { es } from "date-fns/locale";
import { RRule } from "rrule";
import { CalendarSlot } from "../hooks/useCalendar";
import { getHoliday, Holiday } from "../../domain/holidays";
import { Session } from "../../domain/session.types";

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
  // Estado del mes visualizado en el mini calendario
  const [viewMonth, setViewMonth] = useState(() => new Date(currentDate.getFullYear(), currentDate.getMonth(), 1));

  useEffect(() => {
    setViewMonth(new Date(currentDate.getFullYear(), currentDate.getMonth(), 1));
  }, [currentDate]);

  // Días del mini calendario
  const monthStart = startOfMonth(viewMonth);
  const monthEnd = endOfMonth(viewMonth);
  const startDate = startOfWeekFn(monthStart, { weekStartsOn: 1 });
  const endDate = endOfWeekFn(monthEnd, { weekStartsOn: 1 });
  const monthDays = eachDayOfInterval({ start: startDate, end: endDate });

  // Utilidad para saber si un día tiene sesiones agendadas
  const hasSessionOnDay = (day: Date): boolean => {
    // 1. Sesiones físicas
    const hasPhysical = dbSessions.some((s) => {
      const sDate = typeof s.dateTime === "string" ? new Date(s.dateTime) : s.dateTime;
      return isSameDay(sDate, day) && s.status !== "cancelled";
    });
    if (hasPhysical) return true;

    // 2. Turnos recurrentes virtuales
    const dayStart = new Date(day.getFullYear(), day.getMonth(), day.getDate(), 0, 0, 0);
    const dayEnd = new Date(day.getFullYear(), day.getMonth(), day.getDate(), 23, 59, 59);

    for (const rule of recurrenceRules) {
      try {
        const rrule = RRule.fromString(rule.rruleString);
        const occurrences = rrule.between(dayStart, dayEnd, true);
        if (occurrences.length > 0) {
          // Verificar si hay una excepción cancelada física ese día
          const hasCancellation = dbSessions.some((s) => {
            const sDate = typeof s.dateTime === "string" ? new Date(s.dateTime) : s.dateTime;
            return s.patientUuid === rule.patientUuid && isSameDay(sDate, day) && s.status === "cancelled";
          });
          if (!hasCancellation) return true;
        }
      } catch (e) {
        // Ignorar reglas malformadas
      }
    }

    return false;
  };

  return (
    <section className="space-y-6">
      {/* Cabecera del Calendario */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-bg-card border border-brand-sand p-4 rounded-2xl shadow-sm">
        <div className="flex items-center gap-3">
          <button
            onClick={prevWeek}
            className="px-3 py-1.5 bg-bg-base hover:bg-brand-sand/40 border border-brand-sand rounded-xl text-xs font-semibold text-text-main transition-all cursor-pointer"
          >
            ◀ Sem. Anterior
          </button>
          <button
            onClick={goToToday}
            className="px-4 py-1.5 bg-bg-base hover:bg-brand-sand/40 border border-brand-sand rounded-xl text-xs font-title font-bold text-text-main transition-all cursor-pointer"
          >
            Hoy
          </button>
          <button
            onClick={nextWeek}
            className="px-3 py-1.5 bg-bg-base hover:bg-brand-sand/40 border border-brand-sand rounded-xl text-xs font-semibold text-text-main transition-all cursor-pointer"
          >
            Sem. Siguiente ▶
          </button>
        </div>

        <div className="flex items-center justify-between md:justify-end gap-4 w-full md:w-auto">
          <h2 className="text-sm font-title font-bold text-text-main capitalize">
            Semana del {format(weekDays[0], "d 'de' MMMM", { locale: es })} al{" "}
            {format(weekDays[6], "d 'de' MMMM 'de' yyyy", { locale: es })}
          </h2>
          <button
            onClick={onOpenSessionModal}
            className="bg-brand-indigo hover:bg-brand-indigo/90 text-white font-title font-bold text-xs px-4 py-2.5 rounded-xl transition-all shadow-sm cursor-pointer"
          >
            + Programar Turno
          </button>
        </div>
      </div>

      {/* Barra Semanal Superior Compacta */}
      <div className="grid grid-cols-7 gap-2">
        {weekDays.map((day, idx) => {
          const isSelected = isSameDay(day, currentDate);
          const isTodayDay = isToday(day);
          const daySessionsCount = agenda.filter((slot) => isSameDay(slot.dateTime, day)).length;
          const holiday = getHoliday(day, holidays);

          let btnClass = "bg-bg-card border-brand-sand hover:bg-brand-sand/35 text-text-main";
          let labelClass = "text-text-sub";

          if (isSelected) {
            btnClass = "bg-brand-indigo border-brand-indigo text-white font-bold";
            labelClass = "text-white/80";
          } else if (isTodayDay) {
            btnClass = "bg-brand-indigo/5 border-brand-indigo/60 text-brand-indigo font-semibold shadow-sm shadow-brand-indigo/5";
            labelClass = "text-brand-indigo/80";
          }

          return (
            <button
              key={idx}
              onClick={() => selectDate(day)}
              className={`p-3 rounded-2xl border transition-all flex flex-col items-center justify-center relative cursor-pointer shadow-sm ${btnClass}`}
            >
              <span className={`text-[9px] uppercase tracking-wider flex items-center gap-1 ${labelClass}`}>
                {format(day, "eee", { locale: es })}
                {isTodayDay && <span className="text-[8px] bg-brand-indigo/10 text-brand-indigo px-1 rounded font-bold shrink-0">Hoy</span>}
              </span>
              <span className="text-lg font-title font-bold mt-0.5">
                {format(day, "d")}
              </span>
              
              {/* Indicadores de feriados y turnos */}
              <div className="flex gap-1 items-center mt-1">
                {holiday && (
                  <span className="text-[8px] px-1 bg-yellow-500 text-white rounded-full font-bold" title={holiday.name}>
                    🎉
                  </span>
                )}
                {daySessionsCount > 0 && (
                  <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-bold font-mono ${
                    isSelected ? "bg-white/20 text-white" : "bg-brand-indigo/10 text-brand-indigo"
                  }`}>
                    {daySessionsCount}
                  </span>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* Layout de dos columnas: Detalle del Día Seleccionado + Calendario Mensual */}
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Detalle del Día Activo */}
        <div className="flex-1 space-y-4">
          <div className="bg-bg-card border border-brand-sand rounded-2xl p-6 shadow-sm min-h-[400px] flex flex-col">
            {/* Cabecera del día de detalle */}
            <div className="border-b border-brand-sand/65 pb-3 mb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <span className="text-[10px] text-text-sub font-semibold uppercase tracking-wider block">
                  Turnos para el
                </span>
                <h3 className="text-lg font-title font-bold text-text-main capitalize">
                  {format(currentDate, "eeee d 'de' MMMM 'de' yyyy", { locale: es })}
                </h3>
              </div>
              
              {/* Alerta si el día es feriado */}
              {getHoliday(currentDate, holidays) && (
                <span className="bg-status-confirmed-light border border-status-confirmed-dark/20 text-status-confirmed-dark text-xs px-3 py-1.5 rounded-xl font-title font-bold self-start sm:self-auto">
                  🎉 Feriado: {getHoliday(currentDate, holidays)?.name}
                </span>
              )}
            </div>

            {/* Listado de turnos */}
            <div className="space-y-3 flex-1">
              {agenda.filter((slot) => isSameDay(slot.dateTime, currentDate)).length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center py-20 text-center">
                  <span className="text-4xl mb-2">☕</span>
                  <p className="text-text-sub font-medium text-sm">Sin turnos agendados para este día.</p>
                </div>
              ) : (
                agenda
                  .filter((slot) => isSameDay(slot.dateTime, currentDate))
                  .map((slot, sIdx) => {
                    let cardBg = "bg-brand-sand/20 border-brand-sand/50 text-text-main";
                    if (slot.status === "completed") {
                      cardBg = "bg-status-confirmed-light border-status-confirmed-dark/20 text-status-confirmed-dark";
                    } else if (slot.status === "cancelled") {
                      cardBg = "bg-status-cancelled-light border-status-cancelled-dark/20 text-status-cancelled-dark line-through opacity-70";
                    } else if (slot.status === "missed") {
                      cardBg = "bg-status-pending-light border-status-pending-dark/20 text-status-pending-dark";
                    } else if (slot.holiday) {
                      cardBg = "bg-status-rescheduled-light border-status-rescheduled-dark/20 text-status-rescheduled-dark";
                    }

                    return (
                      <div
                        key={sIdx}
                        className={`p-4 rounded-xl border transition-all text-left shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${cardBg}`}
                      >
                        <div className="flex items-start gap-4">
                          {/* Hora y Recurrencia */}
                          <div className="shrink-0 flex flex-col items-start justify-center">
                            <span className="text-base font-mono font-bold block">
                              ⏰ {format(slot.dateTime, "HH:mm")}
                            </span>
                            <span className="text-[9px] font-title font-bold uppercase tracking-wider bg-brand-indigo/10 text-brand-indigo px-2 py-0.5 rounded mt-1 block">
                              {slot.isRecurrent ? "Recurrente" : "Único"}
                            </span>
                          </div>

                          {/* Info Paciente */}
                          <div className="flex-1">
                            <span className="font-title font-bold text-base block leading-tight text-text-main">
                              {slot.patientName}
                            </span>
                            {slot.holiday && (
                              <span className="text-[10px] font-title font-bold text-status-pending-dark block mt-1">
                                ⚠ Cae en Feriado Nacional ({slot.holiday.name})
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Controles de Estado y Recurrencia */}
                        <div className="flex items-center gap-3 self-end sm:self-auto border-t sm:border-t-0 pt-3 sm:pt-0 border-text-main/10 sm:w-auto w-full justify-between">
                          <button
                            onClick={() => onNavigateToPatientDetail(slot.patientUuid)}
                            className="text-[11px] text-brand-indigo hover:text-brand-indigo/80 font-bold bg-brand-indigo/5 border border-brand-indigo/15 px-3 py-1.5 rounded-xl transition-colors cursor-pointer shadow-sm h-8 flex items-center justify-center"
                          >
                            📄 Ver Ficha
                          </button>

                          <select
                            value={slot.status}
                            onChange={(e) => onUpdateStatus(slot, e.target.value as any)}
                            className="bg-bg-card border border-brand-sand rounded-xl text-xs py-1.5 px-3 text-text-main font-semibold focus:outline-none cursor-pointer shadow-sm h-8"
                          >
                            <option value="scheduled">Agendado</option>
                            <option value="completed">Atendido</option>
                            <option value="cancelled">Cancelado</option>
                            <option value="missed">Ausente</option>
                          </select>

                          {slot.isRecurrent && (
                            <button
                              onClick={() => onRemoveRecurrenceRule(slot.patientUuid)}
                              title="Quitar turno recurrente"
                              className="text-text-sub hover:text-status-cancelled-dark border border-brand-sand hover:bg-neutral-100/50 p-2 rounded-xl text-sm cursor-pointer transition-colors shrink-0 flex items-center justify-center h-8 w-8"
                            >
                              🗑
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })
              )}
            </div>
          </div>
        </div>

        {/* Mini Calendario Mensual Fijo */}
        <div className="w-full lg:w-80 shrink-0 space-y-6">
          <div className="bg-bg-card border border-brand-sand rounded-2xl p-4 shadow-sm flex flex-col">
            {/* Cabecera del Mes */}
            <div className="flex items-center justify-between mb-4 pb-2 border-b border-brand-sand/65">
              <button
                onClick={() => setViewMonth(subMonths(viewMonth, 1))}
                className="p-1 hover:bg-brand-sand/40 border border-brand-sand rounded-lg text-xs font-bold text-text-sub hover:text-text-main cursor-pointer transition-colors"
                title="Mes Anterior"
              >
                ◀
              </button>
              <h3 className="text-xs font-title font-bold text-text-main capitalize">
                {format(viewMonth, "MMMM 'de' yyyy", { locale: es })}
              </h3>
              <button
                onClick={() => setViewMonth(addMonths(viewMonth, 1))}
                className="p-1 hover:bg-brand-sand/40 border border-brand-sand rounded-lg text-xs font-bold text-text-sub hover:text-text-main cursor-pointer transition-colors"
                title="Mes Siguiente"
              >
                ▶
              </button>
            </div>

            {/* Días de la Semana */}
            <div className="grid grid-cols-7 gap-1 text-center mb-1">
              {["lu", "ma", "mi", "ju", "vi", "sá", "do"].map((dayName) => (
                <span key={dayName} className="text-[9px] font-semibold text-text-sub uppercase tracking-wider">
                  {dayName}
                </span>
              ))}
            </div>

            {/* Cuadrícula de Días */}
            <div className="grid grid-cols-7 gap-1">
              {monthDays.map((day, idx) => {
                const isCurrentMonth = isSameMonth(day, viewMonth);
                const hasSession = hasSessionOnDay(day);
                
                // Resaltar la semana de la grilla superior
                const isSelectedWeek = isWithinInterval(day, { start: weekDays[0], end: weekDays[6] });
                const isCurrentDate = isSameDay(day, currentDate);
                const isTodayDay = isToday(day);

                let cellBgClass = "";
                let textClass = isCurrentMonth ? "text-text-main font-semibold" : "text-text-sub/40";

                if (isCurrentDate) {
                  cellBgClass = "bg-brand-indigo text-white shadow-sm rounded-lg";
                  textClass = "text-white font-bold";
                } else if (isTodayDay) {
                  cellBgClass = "bg-brand-indigo/10 border border-brand-indigo text-brand-indigo rounded-lg";
                } else if (isSelectedWeek) {
                  cellBgClass = "bg-brand-sand/45 rounded-lg";
                }

                return (
                  <button
                    key={idx}
                    onClick={() => selectDate(day)}
                    className={`h-8 w-full flex flex-col items-center justify-center relative cursor-pointer hover:bg-brand-sand/30 rounded-lg transition-colors ${cellBgClass}`}
                  >
                    <span className={`text-[10px] ${textClass}`}>
                      {format(day, "d")}
                    </span>
                    {/* Indicador de sesiones (pequeño punto) */}
                    {hasSession && (
                      <span className={`absolute bottom-1 h-1 w-1 rounded-full ${
                        isCurrentDate ? "bg-white" : "bg-brand-indigo"
                      }`} />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
