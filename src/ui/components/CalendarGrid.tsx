"use client";

import { format, isSameDay } from "date-fns";
import { es } from "date-fns/locale";
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
}: CalendarGridProps) {
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

      {/* Grid del Calendario Semanal */}
      <div className="grid grid-cols-1 md:grid-cols-7 gap-4">
        {weekDays.map((day, idx) => {
          const daySessions = agenda.filter((slot) => isSameDay(slot.dateTime, day));
          const holiday = getHoliday(day, holidays);

          return (
            <div
              key={idx}
              className="bg-bg-card border border-brand-sand rounded-2xl p-4 min-h-[300px] flex flex-col shadow-sm"
            >
              {/* Nombre del Día (DM Sans + Inter) */}
              <div className="border-b border-brand-sand/60 pb-2 mb-3 text-center">
                <span className="text-[10px] text-text-sub font-semibold uppercase tracking-wider block">
                  {format(day, "eeee", { locale: es })}
                </span>
                <span className="text-2xl font-title font-bold text-text-main block mt-0.5">
                  {format(day, "d")}
                </span>
              </div>

              {/* Alerta de Feriado Nacional */}
              {holiday && (
                <div className="bg-status-confirmed-light border border-status-confirmed-dark/20 text-status-confirmed-dark text-[9px] p-2 rounded-xl mb-3 font-title font-bold text-center leading-tight">
                  🎉 Feriado: {holiday.name}
                </div>
              )}

              {/* Listado de turnos de este día */}
              <div className="space-y-3 flex-1">
                {daySessions.length === 0 ? (
                  <div className="text-text-sub/50 text-[11px] text-center py-10 font-medium">Sin turnos</div>
                ) : (
                  daySessions.map((slot, sIdx) => {
                    // Determinar estilos según el estado funcional calmo
                    let cardBg = "bg-brand-sand/20 border-brand-sand/50 text-text-main"; // Agendado por defecto
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
                        className={`p-3 rounded-xl border transition-all text-left shadow-sm ${cardBg}`}
                      >
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-xs font-mono font-semibold">
                            ⏰ {format(slot.dateTime, "HH:mm")}
                          </span>
                          <span className="text-[8px] font-title font-bold uppercase tracking-wider bg-brand-indigo/10 text-brand-indigo px-1.5 py-0.5 rounded">
                            {slot.isRecurrent ? "Recurr." : "Único"}
                          </span>
                        </div>

                        {/* Nombre del Paciente en DM Sans */}
                        <span className="font-title font-bold text-sm block leading-snug text-text-main">
                          {slot.patientName}
                        </span>

                        {/* Alerta si el turno cae en feriado */}
                        {slot.holiday && (
                          <span className="text-[9px] font-title font-bold text-status-pending-dark block mt-1">
                            ⚠ Cae en Feriado Nacional
                          </span>
                        )}

                        {/* Estado y Acciones rápidas */}
                        <div className="mt-3 pt-2 border-t border-text-main/10 flex items-center justify-between">
                          <select
                            value={slot.status}
                            onChange={(e) => onUpdateStatus(slot, e.target.value as any)}
                            className="bg-bg-card border border-brand-sand rounded-lg text-[10px] py-1 px-1.5 text-text-main font-semibold focus:outline-none cursor-pointer"
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
                              className="text-text-sub hover:text-status-cancelled-dark text-xs px-1 cursor-pointer transition-colors"
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
          );
        })}
      </div>
    </section>
  );
}
