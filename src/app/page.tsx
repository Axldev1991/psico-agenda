"use client";

import { useState } from "react";
import { usePatients } from "../ui/hooks/usePatients";
import { useCalendar, CalendarSlot } from "../ui/hooks/useCalendar";
import { getHoliday } from "../domain/holidays";
import { format, isSameDay } from "date-fns";
import { es } from "date-fns/locale";

export default function Home() {
  const { patients, loading: loadingPatients, addPatient, removePatient } = usePatients();
  const { 
    currentDate,
    weekDays,
    agenda,
    nextWeek,
    prevWeek,
    goToToday,
    addManualSession,
    addRecurrence,
    updateSessionStatus,
    removeRecurrenceRule
  } = useCalendar();
  
  // Vista activa: 'patients' o 'calendar'
  const [activeTab, setActiveTab] = useState<'patients' | 'calendar'>('calendar');

  // Estados comunes de UI
  const [showPatientModal, setShowPatientModal] = useState(false);
  const [showSessionModal, setShowSessionModal] = useState(false);
  const [isBlurred, setIsBlurred] = useState(false); // Botón de pánico
  
  // Campos formulario Paciente
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [healthInsurance, setHealthInsurance] = useState("");
  const [affiliateNumber, setAffiliateNumber] = useState("");
  const [sessionPrice, setSessionPrice] = useState("20000");

  // Campos formulario Turno/Sesión
  const [selectedPatientUuid, setSelectedPatientUuid] = useState("");
  const [isRecurrent, setIsRecurrent] = useState(false);
  const [sessionDate, setSessionDate] = useState(""); // Formato "YYYY-MM-DD"
  const [sessionTime, setSessionTime] = useState("16:00");
  const [recurrenceDay, setRecurrenceDay] = useState("0"); // 0=Lunes, 1=Martes...

  // Handlers
  const handleCreatePatient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim() || Number(sessionPrice) <= 0) return;

    await addPatient({
      fullName,
      email: email || undefined,
      phone: phone || undefined,
      address: address || undefined,
      healthInsurance: healthInsurance || undefined,
      affiliateNumber: affiliateNumber || undefined,
      sessionPrice: Number(sessionPrice),
    });

    setFullName("");
    setEmail("");
    setPhone("");
    setAddress("");
    setHealthInsurance("");
    setAffiliateNumber("");
    setSessionPrice("20000");
    setShowPatientModal(false);
  };

  const handleCreateSession = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPatientUuid || !sessionDate) return;

    if (isRecurrent) {
      // Agregar recurrencia estándar
      await addRecurrence({
        patientUuid: selectedPatientUuid,
        startDate: sessionDate,
        startTime: sessionTime,
        durationMinutes: 50,
        dayOfWeek: Number(recurrenceDay)
      });
    } else {
      // Agregar turno manual único
      const dateTimeStr = `${sessionDate}T${sessionTime}:00.000Z`;
      await addManualSession({
        patientUuid: selectedPatientUuid,
        dateTime: dateTimeStr,
        status: 'scheduled'
      });
    }

    setSelectedPatientUuid("");
    setSessionDate("");
    setSessionTime("16:00");
    setIsRecurrent(false);
    setShowSessionModal(false);
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 font-sans antialiased">
      {/* Navbar Premium */}
      <header className="border-b border-slate-800 bg-slate-950/80 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-violet-600 to-indigo-600 flex items-center justify-center font-bold text-white shadow-md shadow-violet-900/30">
              Ψ
            </div>
            <div>
              <span className="font-bold text-lg tracking-tight bg-gradient-to-r from-violet-400 to-indigo-200 bg-clip-text text-transparent">
                PSICO-AGENDA
              </span>
              <span className="text-xs block text-slate-500 font-medium">Soberanía de Datos Clínicos</span>
            </div>
          </div>

          {/* Toggle de vistas */}
          <div className="bg-slate-900 p-1 rounded-xl border border-slate-800 flex">
            <button
              onClick={() => setActiveTab('calendar')}
              className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition-all ${
                activeTab === 'calendar'
                  ? 'bg-violet-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              📅 Agenda
            </button>
            <button
              onClick={() => setActiveTab('patients')}
              className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition-all ${
                activeTab === 'patients'
                  ? 'bg-violet-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              📂 Fichero
            </button>
          </div>

          <div className="flex items-center gap-3">
            {/* Botón de pánico */}
            <button
              onClick={() => setIsBlurred(!isBlurred)}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-300 ${
                isBlurred
                  ? "bg-emerald-600 text-white shadow-lg ring-2 ring-emerald-400"
                  : "bg-rose-950/40 text-rose-300 border border-rose-800/50 hover:bg-rose-900/30"
              }`}
            >
              🔒 {isBlurred ? "Revelar" : "Ocultar Datos"}
            </button>

            {activeTab === 'patients' ? (
              <button
                onClick={() => setShowPatientModal(true)}
                className="bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-semibold text-sm px-4 py-2 rounded-lg transition-all shadow-md active:scale-95"
              >
                + Nuevo Paciente
              </button>
            ) : (
              <button
                onClick={() => setShowSessionModal(true)}
                className="bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-semibold text-sm px-4 py-2 rounded-lg transition-all shadow-md active:scale-95"
              >
                + Programar Turno
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Contenido Principal */}
      <main className={`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 transition-all duration-500 ${
        isBlurred ? "blur-md pointer-events-none select-none" : ""
      }`}>
        
        {/* VISTA A: AGENDA / CALENDARIO SEMANAL */}
        {activeTab === 'calendar' && (
          <section className="space-y-6">
            {/* Cabecera del Calendario */}
            <div className="flex items-center justify-between bg-slate-950/40 border border-slate-800 p-4 rounded-2xl backdrop-blur-sm">
              <div className="flex items-center gap-3">
                <button onClick={prevWeek} className="p-2 bg-slate-900 hover:bg-slate-800 rounded-lg border border-slate-800 text-sm">◀ Sem. Anterior</button>
                <button onClick={goToToday} className="px-4 py-2 bg-slate-900 hover:bg-slate-800 rounded-lg border border-slate-800 text-sm font-semibold">Hoy</button>
                <button onClick={nextWeek} className="p-2 bg-slate-900 hover:bg-slate-800 rounded-lg border border-slate-800 text-sm">Sem. Siguiente ▶</button>
              </div>
              <h2 className="text-lg font-bold text-slate-200 capitalize">
                Semana del {format(weekDays[0], "d 'de' MMMM", { locale: es })} al {format(weekDays[6], "d 'de' MMMM 'de' yyyy", { locale: es })}
              </h2>
            </div>

            {/* Grid del Calendario Semanal */}
            <div className="grid grid-cols-1 md:grid-cols-7 gap-4">
              {weekDays.map((day, idx) => {
                const daySessions = agenda.filter(slot => isSameDay(slot.dateTime, day));
                const holiday = getHoliday(day);

                return (
                  <div key={idx} className="bg-slate-950/40 border border-slate-800 rounded-2xl p-4 min-h-[300px] flex flex-col backdrop-blur-sm">
                    {/* Nombre del Día */}
                    <div className="border-b border-slate-800 pb-2 mb-3 text-center">
                      <span className="text-xs text-slate-500 font-semibold uppercase tracking-wider block">
                        {format(day, 'eeee', { locale: es })}
                      </span>
                      <span className="text-2xl font-bold text-slate-200 block mt-0.5">
                        {format(day, 'd')}
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
                              slot.status === 'completed' 
                                ? 'bg-emerald-950/20 border-emerald-800/40 text-emerald-300'
                                : slot.status === 'cancelled'
                                ? 'bg-rose-950/20 border-rose-900/40 text-rose-400 line-through opacity-60'
                                : slot.status === 'missed'
                                ? 'bg-amber-950/20 border-amber-900/40 text-amber-400'
                                : slot.holiday
                                ? 'bg-slate-900 border-amber-800/50 text-slate-200 shadow-md shadow-amber-900/10'
                                : 'bg-slate-900 border-slate-800 text-slate-200'
                            }`}
                          >
                            <div className="flex items-center justify-between mb-1.5">
                              <span className="text-xs font-bold font-mono">
                                ⏰ {format(slot.dateTime, 'HH:mm')}
                              </span>
                              <span className="text-[10px] uppercase font-bold tracking-wider opacity-80">
                                {slot.isRecurrent ? '🔄 Recurr.' : '📅 Único'}
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
                                onChange={(e) => updateSessionStatus(slot, e.target.value as any)}
                                className="bg-slate-950 border border-slate-800/80 rounded-md text-[10px] py-1 px-1.5 text-slate-300 focus:outline-none"
                              >
                                <option value="scheduled">Agendado</option>
                                <option value="completed">Atendido</option>
                                <option value="cancelled">Cancelado</option>
                                <option value="missed">Ausente</option>
                              </select>

                              {slot.isRecurrent && (
                                <button
                                  onClick={() => removeRecurrenceRule(slot.patientUuid)}
                                  title="Quitar turno recurrente"
                                  className="text-slate-600 hover:text-rose-400 text-xs px-1"
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
        )}

        {/* VISTA B: FICHERO / LISTADO DE PACIENTES */}
        {activeTab === 'patients' && (
          <section className="bg-slate-950/40 border border-slate-800 rounded-2xl overflow-hidden backdrop-blur-sm">
            <div className="p-6 border-b border-slate-800 flex items-center justify-between">
              <h2 className="font-bold text-lg text-slate-100">Fichero de Pacientes</h2>
              <span className="text-xs text-slate-500 font-medium">Reactivo en tiempo real</span>
            </div>

            {loadingPatients ? (
              <div className="p-12 text-center text-slate-500 font-medium">
                Cargando base de datos IndexedDB...
              </div>
            ) : patients.length === 0 ? (
              <div className="p-16 text-center">
                <div className="h-16 w-16 bg-slate-900 rounded-full flex items-center justify-center mx-auto mb-4 border border-slate-800 text-2xl">
                  📂
                </div>
                <h3 className="font-bold text-slate-300 mb-1">No hay pacientes registrados</h3>
                <p className="text-sm text-slate-500 max-w-sm mx-auto mb-6">
                  Los datos se guardan exclusivamente en el almacenamiento local seguro de tu navegador.
                </p>
                <button
                  onClick={() => setShowPatientModal(true)}
                  className="bg-slate-900 hover:bg-slate-800 text-violet-400 border border-slate-700/60 font-semibold text-sm px-4 py-2 rounded-lg transition-all"
                >
                  Crear tu primer paciente
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-950/60 border-b border-slate-800 text-slate-400 text-xs font-semibold uppercase tracking-wider">
                      <th className="py-4 px-6">Paciente</th>
                      <th className="py-4 px-6">Contacto</th>
                      <th className="py-4 px-6">Obra Social / Prepaga</th>
                      <th className="py-4 px-6">Costo de Sesión</th>
                      <th className="py-4 px-6 text-right">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/50">
                    {patients.map((patient) => (
                      <tr
                        key={patient.uuid}
                        className="hover:bg-slate-900/30 transition-colors group"
                      >
                        <td className="py-4 px-6">
                          <span className="font-semibold text-slate-200 block">
                            {patient.fullName}
                          </span>
                          <span className="text-xs text-slate-500 font-mono block">
                            ID: {patient.uuid.substring(0, 8)}...
                          </span>
                        </td>
                        <td className="py-4 px-6">
                          <span className="text-sm text-slate-300 block">{patient.phone || "—"}</span>
                          <span className="text-xs text-slate-500 block">{patient.email || "Sin email"}</span>
                          {patient.address && (
                            <span className="text-xs text-slate-400 block mt-1">
                              📍 {patient.address}
                            </span>
                          )}
                        </td>
                        <td className="py-4 px-6">
                          {patient.healthInsurance ? (
                            <div>
                              <span className="text-sm text-slate-300 block">{patient.healthInsurance}</span>
                              <span className="text-xs text-slate-500 block">
                                Cred: {patient.affiliateNumber || "Sin N°"}
                              </span>
                            </div>
                          ) : (
                            <span className="text-sm text-slate-500">—</span>
                          )}
                        </td>
                        <td className="py-4 px-6 font-semibold text-violet-400">
                          ${patient.sessionPrice.toLocaleString("es-AR")} ARS
                        </td>
                        <td className="py-4 px-6 text-right">
                          <button
                            onClick={() => removePatient(patient.uuid)}
                            className="opacity-0 group-hover:opacity-100 text-rose-500 hover:text-rose-400 text-xs font-bold px-3 py-1 rounded border border-rose-950/20 hover:bg-rose-950/30 transition-all"
                          >
                            Eliminar
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        )}
      </main>

      {/* Modal para Crear Paciente */}
      {showPatientModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl shadow-black/80 animate-in fade-in zoom-in duration-200">
            <div className="p-6 border-b border-slate-800 flex items-center justify-between">
              <h3 className="font-bold text-lg text-slate-100">Registrar Nuevo Paciente</h3>
              <button
                onClick={() => setShowPatientModal(false)}
                className="text-slate-500 hover:text-slate-300 text-xl font-bold"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleCreatePatient} className="p-6 space-y-4">
              <div>
                <label className="text-xs text-slate-400 font-semibold block mb-1">Nombre Completo *</label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Juan Perez"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-slate-100 placeholder-slate-600 focus:outline-none focus:border-violet-600 focus:ring-1 focus:ring-violet-600 transition-all text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-slate-400 font-semibold block mb-1">Teléfono</label>
                  <input
                    type="text"
                    placeholder="Ej: 11 1234-5678"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-slate-100 placeholder-slate-600 focus:outline-none focus:border-violet-600 focus:ring-1 focus:ring-violet-600 transition-all text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-400 font-semibold block mb-1">Email</label>
                  <input
                    type="email"
                    placeholder="Ej: paciente@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-slate-100 placeholder-slate-600 focus:outline-none focus:border-violet-600 focus:ring-1 focus:ring-violet-600 transition-all text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs text-slate-400 font-semibold block mb-1">Domicilio</label>
                <input
                  type="text"
                  placeholder="Ej: Av. Santa Fe 1234, CABA"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-slate-100 placeholder-slate-600 focus:outline-none focus:border-violet-600 focus:ring-1 focus:ring-violet-600 transition-all text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-slate-400 font-semibold block mb-1">Obra Social / Prepaga</label>
                  <input
                    type="text"
                    placeholder="Ej: OSDE"
                    value={healthInsurance}
                    onChange={(e) => setHealthInsurance(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-slate-100 placeholder-slate-600 focus:outline-none focus:border-violet-600 focus:ring-1 focus:ring-violet-600 transition-all text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-400 font-semibold block mb-1">Número de Afiliado</label>
                  <input
                    type="text"
                    placeholder="Ej: 123456/01"
                    value={affiliateNumber}
                    onChange={(e) => setAffiliateNumber(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-slate-100 placeholder-slate-600 focus:outline-none focus:border-violet-600 focus:ring-1 focus:ring-violet-600 transition-all text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs text-slate-400 font-semibold block mb-1">Costo Acordado de la Sesión (ARS) *</label>
                <input
                  type="number"
                  required
                  placeholder="Ej: 20000"
                  value={sessionPrice}
                  onChange={(e) => setSessionPrice(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-slate-100 placeholder-slate-600 focus:outline-none focus:border-violet-600 focus:ring-1 focus:ring-violet-600 transition-all text-sm"
                />
              </div>

              <div className="pt-4 border-t border-slate-800 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowPatientModal(false)}
                  className="text-slate-400 hover:text-slate-200 text-sm font-semibold px-4 py-2 transition-all"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-semibold text-sm px-4 py-2 rounded-lg transition-all"
                >
                  Guardar Paciente
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal para Programar Turno */}
      {showSessionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl shadow-black/80 animate-in fade-in zoom-in duration-200">
            <div className="p-6 border-b border-slate-800 flex items-center justify-between">
              <h3 className="font-bold text-lg text-slate-100">Programar Turno / Sesión</h3>
              <button
                onClick={() => setShowSessionModal(false)}
                className="text-slate-500 hover:text-slate-300 text-xl font-bold"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleCreateSession} className="p-6 space-y-4">
              <div>
                <label className="text-xs text-slate-400 font-semibold block mb-1">Seleccionar Paciente *</label>
                <select
                  required
                  value={selectedPatientUuid}
                  onChange={(e) => setSelectedPatientUuid(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-slate-100 focus:outline-none focus:border-violet-600 transition-all text-sm"
                >
                  <option value="">-- Seleccionar Paciente --</option>
                  {patients.map(p => (
                    <option key={p.uuid} value={p.uuid}>{p.fullName}</option>
                  ))}
                </select>
              </div>

              {/* Toggle de Recurrencia */}
              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-sm text-slate-300 font-bold">¿Es un turno recurrente?</label>
                  <input
                    type="checkbox"
                    checked={isRecurrent}
                    onChange={(e) => setIsRecurrent(e.target.checked)}
                    className="h-5 w-5 accent-violet-600 rounded cursor-pointer"
                  />
                </div>
                <span className="text-[10px] text-slate-500 block leading-normal">
                  Los turnos recurrentes se cargarán automáticamente todas las semanas en el día y horario especificados durante todo el año.
                </span>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-slate-400 font-semibold block mb-1">
                    {isRecurrent ? 'Fecha de Inicio *' : 'Fecha del Turno *'}
                  </label>
                  <input
                    type="date"
                    required
                    value={sessionDate}
                    onChange={(e) => setSessionDate(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-slate-100 focus:outline-none focus:border-violet-600 transition-all text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-400 font-semibold block mb-1">Hora *</label>
                  <input
                    type="time"
                    required
                    value={sessionTime}
                    onChange={(e) => setSessionTime(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-slate-100 focus:outline-none focus:border-violet-600 transition-all text-sm"
                  />
                </div>
              </div>

              {/* Selector de día para recurrencia */}
              {isRecurrent && (
                <div>
                  <label className="text-xs text-slate-400 font-semibold block mb-1">Día de la semana de atención *</label>
                  <select
                    value={recurrenceDay}
                    onChange={(e) => setRecurrenceDay(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-slate-100 focus:outline-none focus:border-violet-600 transition-all text-sm"
                  >
                    <option value="0">Lunes</option>
                    <option value="1">Martes</option>
                    <option value="2">Miércoles</option>
                    <option value="3">Jueves</option>
                    <option value="4">Viernes</option>
                    <option value="5">Sábado</option>
                    <option value="6">Domingo</option>
                  </select>
                </div>
              )}

              <div className="pt-4 border-t border-slate-800 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowSessionModal(false)}
                  className="text-slate-400 hover:text-slate-200 text-sm font-semibold px-4 py-2 transition-all"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-semibold text-sm px-4 py-2 rounded-lg transition-all"
                >
                  Programar Turno
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
