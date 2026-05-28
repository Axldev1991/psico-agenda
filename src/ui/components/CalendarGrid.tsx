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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-slate-950/40 border border-slate-800 p-4 rounded-2xl backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <button
            onClick={prevWeek}
            className="p-2 bg-slate-900 hover:bg-slate-800 rounded-lg border border-slate-800 text-xs text-slate-300 transition-colors cursor-pointer"
          >
            ◀ Sem. Anterior
          </button>
          <button
            onClick={goToToday}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 rounded-lg border border-slate-800 text-xs font-semibold text-slate-200 transition-colors cursor-pointer"
          >
            Hoy
          </button>
          <button
            onClick={nextWeek}
            className="p-2 bg-slate-900 hover:bg-slate-800 rounded-lg border border-slate-800 text-xs text-slate-300 transition-colors cursor-pointer"
          >
            Sem. Siguiente ▶
          </button>
        </div>

        <div className="flex items-center justify-between sm:justify-end gap-4 w-full sm:w-auto">
          <h2 className="text-sm font-bold text-slate-200 capitalize">
            Semana del {format(weekDays[0], "d 'de' MMMM", { locale: es })} al{" "}
            {format(weekDays[6], "d 'de' MMMM 'de' yyyy", { locale: es })}
          </h2>
          <button
            onClick={onOpenSessionModal}
            className="bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-semibold text-xs px-4 py-2.5 rounded-xl transition-all whitespace-nowrap cursor-pointer"
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
              className="bg-slate-950/40 border border-slate-800 rounded-2xl p-4 min-h-[300px] flex flex-col backdrop-blur-sm"
            >
              {/* Nombre del Día */}
              <div className="border-b border-slate-800 pb-2 mb-3 text-center">
                <span className="text-xs text-slate-500 font-semibold uppercase tracking-wider block">
                  {format(day, "eeee", { locale: es })}
                </span>
                <span className="text-2xl font-bold text-slate-200 block mt-0.5">
                  {format(day, "d")}
                </span>
              </div>

              {/* Alerta de Feriado */}
              {holiday && (
                <div className="bg-emerald-950/40 border border-emerald-800/50 text-emerald-300 text-[10px] p-2 rounded-lg mb-3 font-semibold text-center leading-tight">
                  🎉 Feriado: {holiday.name}
                </div>
              )}

              {/* Listado de turnos de este día */}
              <div className="space-y-3 flex-1">
                {daySessions.length === 0 ? (
                  <div className="text-slate-600 text-xs text-center py-8 font-medium">Sin turnos</div>
                ) : (
                  daySessions.map((slot, sIdx) => (
                    <div
                      key={sIdx}
                      className={`p-3 rounded-xl border transition-all text-left ${
                        slot.status === "completed"
                          ? "bg-emerald-950/20 border-emerald-800/40 text-emerald-300"
                          : slot.status === "cancelled"
                          ? "bg-rose-950/20 border-rose-900/40 text-rose-400 line-through opacity-60"
                          : slot.status === "missed"
                          ? "bg-amber-950/20 border-amber-900/40 text-amber-400"
                          : slot.holiday
                          ? "bg-slate-900 border-amber-800/50 text-slate-200 shadow-md shadow-amber-900/10"
                          : "bg-slate-900 border-slate-800 text-slate-200"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-xs font-bold font-mono">
                          ⏰ {format(slot.dateTime, "HH:mm")}
                        </span>
                        <span className="text-[10px] uppercase font-bold tracking-wider opacity-85">
                          {slot.isRecurrent ? "🔄 Recurr." : "📅 Único"}
                        </span>
                      </div>

                      <span className="font-bold text-sm block leading-snug">{slot.patientName}</span>

                      {/* Alerta si el turno cae en feriado */}
                      {slot.holiday && (
                        <span className="text-[9px] font-bold text-amber-400 block mt-1">
                          ⚠ Cae en Feriado Nacional
                        </span>
                      )}

                      {/* Estado y Acciones rápidas */}
                      <div className="mt-3 pt-2 border-t border-slate-800/40 flex items-center justify-between">
                        <select
                          value={slot.status}
                          onChange={(e) => onUpdateStatus(slot, e.target.value as any)}
                          className="bg-slate-950 border border-slate-800/80 rounded-md text-[10px] py-1 px-1.5 text-slate-300 focus:outline-none cursor-pointer"
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
                            className="text-slate-600 hover:text-rose-400 text-xs px-1 cursor-pointer transition-colors"
                          >
                            🗑
                          </button>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
