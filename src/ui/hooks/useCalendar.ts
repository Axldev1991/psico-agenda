import { useState, useEffect, useMemo } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { 
  startOfWeek, 
  endOfWeek, 
  eachDayOfInterval, 
  parseISO, 
  addWeeks, 
  subWeeks,
  isSameDay,
  format,
} from 'date-fns';
import { container } from '../../infrastructure/container';
import { Session, RecurrenceRule } from '../../domain/session.types';
import { Holiday, fetchArgentinaHolidays } from '../../domain/holidays';
import { CalendarSlot, RescheduleSlotParams, SwapSlotsParams, RecurrenceCadence } from '../../domain/agenda.types';
import { AbsencePeriod } from '../../domain/availability.types';
import { computeAgendaSlots, buildRRuleString } from '../../domain/agenda.service';

export type { CalendarSlot };

const sessionRepo = container.getSessionRepository();
const patientRepo = container.getPatientRepository();
const settingsRepo = container.getSettingsRepository();

const BA_TIMEZONE = 'America/Argentina/Buenos_Aires';

function getBuenosAiresDate(): Date {
  try {
    const formatter = new Intl.DateTimeFormat('en-CA', {
      timeZone: BA_TIMEZONE,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
    const parts = formatter.format(new Date()).split('-').map(Number);
    const now = new Date();
    return new Date(parts[0], parts[1] - 1, parts[2], now.getHours(), now.getMinutes(), now.getSeconds());
  } catch {
    return new Date();
  }
}

export function useCalendar() {
  // Estado para la fecha base del calendario (en zona horaria de Buenos Aires)
  const [currentDate, setCurrentDate] = useState(() => getBuenosAiresDate());
  
  // Estado local para los feriados de este año
  const [holidays, setHolidays] = useState<Holiday[]>([]);

  // Recalcular día ante cambio de visibilidad de pestaña (ej. pasar la medianoche)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (typeof document !== 'undefined' && !document.hidden) {
        const todayBa = getBuenosAiresDate();
        setCurrentDate((prev) => (isSameDay(prev, new Date()) ? todayBa : prev));
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);

  // Calcular intervalo de la semana (Lunes a Domingo)
  const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(currentDate, { weekStartsOn: 1 });
  const weekDays = eachDayOfInterval({ start: weekStart, end: weekEnd });

  // 1. Cargar pacientes para asociar nombres a los UUIDs
  const patients = useLiveQuery(() => patientRepo.getAll()) || [];
  const patientMap = new Map(patients.map(p => [p.uuid, p]));

  // 2. Cargar sesiones grabadas físicamente
  const dbSessions = useLiveQuery(() => sessionRepo.getAll()) || [];

  // 3. Cargar reglas de recurrencia activas
  const recurrenceRules = useLiveQuery(() => sessionRepo.getRecurrenceRules()) || [];

  // 4. Cargar feriados dinámicamente desde la API/Caché local cuando cambie el año de vista
  useEffect(() => {
    const loadHolidays = async () => {
      const year = currentDate.getFullYear();
      const list = await fetchArgentinaHolidays(year);
      setHolidays(list);
    };
    loadHolidays();
  }, [currentDate]);

  // 5. Cargar períodos de ausencia / vacaciones
  const [absencePeriods, setAbsencePeriods] = useState<AbsencePeriod[]>([]);

  useEffect(() => {
    let mounted = true;
    settingsRepo.getAvailabilitySettings().then((s) => {
      if (mounted) {
        setAbsencePeriods(s.absencePeriods || []);
      }
    });
    return () => {
      mounted = false;
    };
  }, []);

  // Calcular la agenda de la semana delegando en el Servicio de Dominio puro
  const agenda = useMemo(() => {
    return computeAgendaSlots({
      intervalStart: weekStart,
      intervalEnd: weekEnd,
      recurrenceRules,
      dbSessions,
      patients,
      holidays,
      absencePeriods,
    });
  }, [weekStart, weekEnd, recurrenceRules, dbSessions, patients, holidays, absencePeriods]);

  // --- Funciones del Controlador ---
  
  const nextWeek = () => setCurrentDate(prev => addWeeks(prev, 1));
  const prevWeek = () => setCurrentDate(prev => subWeeks(prev, 1));
  const goToToday = () => setCurrentDate(getBuenosAiresDate());

  const addManualSession = async (sessionData: {
    patientUuid: string;
    dateTime: string;
    status: Session['status'];
    notes?: string;
  }) => {
    const patient = patientMap.get(sessionData.patientUuid);
    
    // Buscar la última sesión para heredar descripción y colorTag
    const patientSessions = await sessionRepo.getByPatient(sessionData.patientUuid);
    const lastSession = patientSessions.sort((a, b) => new Date(b.dateTime).getTime() - new Date(a.dateTime).getTime())[0];
    const inheritedDescription = lastSession ? lastSession.description : "";
    const inheritedColorTag = lastSession ? lastSession.colorTag : "indigo";

    const newSession: Session = {
      uuid: crypto.randomUUID(),
      patientUuid: sessionData.patientUuid,
      dateTime: sessionData.dateTime,
      status: sessionData.status,
      priceAtSession: patient ? patient.sessionPrice : 0,
      description: inheritedDescription,
      colorTag: inheritedColorTag,
      notes: sessionData.notes,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    await sessionRepo.save(newSession);
  };

  const addRecurrence = async (ruleData: {
    patientUuid: string;
    startDate: string;
    startTime: string;
    durationMinutes: number;
    daysOfWeek?: number[];
    dayOfWeek?: number;
    cadence?: RecurrenceCadence;
  }) => {
    // Soporte retrocompatible para dayOfWeek único o arreglo daysOfWeek
    const days = ruleData.daysOfWeek && ruleData.daysOfWeek.length > 0
      ? ruleData.daysOfWeek
      : ruleData.dayOfWeek !== undefined
      ? [ruleData.dayOfWeek]
      : [0];

    const rruleString = buildRRuleString({
      cadence: ruleData.cadence || 'weekly',
      daysOfWeek: days,
      startDate: ruleData.startDate,
    });

    const newRule: RecurrenceRule = {
      patientUuid: ruleData.patientUuid,
      rruleString,
      startDate: ruleData.startDate,
      startTime: ruleData.startTime,
      durationMinutes: ruleData.durationMinutes
    };
    await sessionRepo.saveRecurrenceRule(newRule);
  };

  const rescheduleSlot = async (params: RescheduleSlotParams) => {
    const { slot, newDateTime, scope } = params;
    const nowIso = new Date().toISOString();

    if (scope === 'eventual') {
      // 1. Cancelar o registrar excepción para el turno original
      if (slot.uuid) {
        const existing = await sessionRepo.getByUuid(slot.uuid);
        if (existing) {
          existing.status = 'cancelled';
          existing.description = `Reagendado al ${format(newDateTime, 'dd/MM/yyyy HH:mm')}`;
          existing.updatedAt = nowIso;
          await sessionRepo.save(existing);
        }
      } else {
        const cancelException: Session = {
          uuid: crypto.randomUUID(),
          patientUuid: slot.patientUuid,
          dateTime: slot.dateTime.toISOString(),
          status: 'cancelled',
          priceAtSession: slot.price,
          description: `Reagendado al ${format(newDateTime, 'dd/MM/yyyy HH:mm')}`,
          createdAt: nowIso,
          updatedAt: nowIso,
        };
        await sessionRepo.save(cancelException);
      }

      // 2. Crear sesión puntual en la nueva fecha y hora
      const newSession: Session = {
        uuid: crypto.randomUUID(),
        patientUuid: slot.patientUuid,
        dateTime: newDateTime.toISOString(),
        status: 'scheduled',
        priceAtSession: slot.price,
        description: `Turno eventual reagendado (original: ${format(slot.dateTime, 'dd/MM HH:mm')})`,
        createdAt: nowIso,
        updatedAt: nowIso,
      };
      await sessionRepo.save(newSession);
    } else {
      // Cambio permanente: actualizar la RecurrenceRule
      const existingRule = await sessionRepo.getRecurrenceRuleByPatient(slot.patientUuid);
      const newTime = format(newDateTime, 'HH:mm');
      const newDateStr = format(newDateTime, 'yyyy-MM-dd');
      const dayIndex = (newDateTime.getDay() + 6) % 7; // 0=MO, ..., 6=SU

      if (existingRule) {
        const updatedRule: RecurrenceRule = {
          ...existingRule,
          startDate: newDateStr,
          startTime: newTime,
          rruleString: buildRRuleString({
            cadence: 'weekly',
            daysOfWeek: [dayIndex],
            startDate: newDateStr,
          }),
        };
        await sessionRepo.saveRecurrenceRule(updatedRule);
      } else if (slot.uuid) {
        // Sesión manual no recurrente
        const existingSession = await sessionRepo.getByUuid(slot.uuid);
        if (existingSession) {
          existingSession.dateTime = newDateTime.toISOString();
          existingSession.updatedAt = nowIso;
          await sessionRepo.save(existingSession);
        }
      }
    }
  };

  const swapSlots = async (params: SwapSlotsParams) => {
    const { slotA, slotB, scope } = params;
    const nowIso = new Date().toISOString();

    if (scope === 'eventual') {
      // 1. Cancelar o marcar excepción para slotA original
      if (slotA.uuid) {
        const sessA = await sessionRepo.getByUuid(slotA.uuid);
        if (sessA) {
          sessA.status = 'cancelled';
          sessA.description = `Enroque con ${slotB.patientName}`;
          sessA.updatedAt = nowIso;
          await sessionRepo.save(sessA);
        }
      } else {
        await sessionRepo.save({
          uuid: crypto.randomUUID(),
          patientUuid: slotA.patientUuid,
          dateTime: slotA.dateTime.toISOString(),
          status: 'cancelled',
          priceAtSession: slotA.price,
          description: `Enroque con ${slotB.patientName}`,
          createdAt: nowIso,
          updatedAt: nowIso,
        });
      }

      // 2. Cancelar o marcar excepción para slotB original
      if (slotB.uuid) {
        const sessB = await sessionRepo.getByUuid(slotB.uuid);
        if (sessB) {
          sessB.status = 'cancelled';
          sessB.description = `Enroque con ${slotA.patientName}`;
          sessB.updatedAt = nowIso;
          await sessionRepo.save(sessB);
        }
      } else {
        await sessionRepo.save({
          uuid: crypto.randomUUID(),
          patientUuid: slotB.patientUuid,
          dateTime: slotB.dateTime.toISOString(),
          status: 'cancelled',
          priceAtSession: slotB.price,
          description: `Enroque con ${slotA.patientName}`,
          createdAt: nowIso,
          updatedAt: nowIso,
        });
      }

      // 3. Crear turnos cruzados
      await sessionRepo.save({
        uuid: crypto.randomUUID(),
        patientUuid: slotA.patientUuid,
        dateTime: slotB.dateTime.toISOString(),
        status: 'scheduled',
        priceAtSession: slotA.price,
        description: `Enroque eventual (horario habitual de ${slotB.patientName})`,
        createdAt: nowIso,
        updatedAt: nowIso,
      });

      await sessionRepo.save({
        uuid: crypto.randomUUID(),
        patientUuid: slotB.patientUuid,
        dateTime: slotA.dateTime.toISOString(),
        status: 'scheduled',
        priceAtSession: slotB.price,
        description: `Enroque eventual (horario habitual de ${slotA.patientName})`,
        createdAt: nowIso,
        updatedAt: nowIso,
      });
    } else {
      // Cambio permanente: intercambiar las reglas recurrentes de A y B
      const ruleA = await sessionRepo.getRecurrenceRuleByPatient(slotA.patientUuid);
      const ruleB = await sessionRepo.getRecurrenceRuleByPatient(slotB.patientUuid);

      if (ruleA && ruleB) {
        const newRuleA: RecurrenceRule = {
          ...ruleA,
          rruleString: ruleB.rruleString,
          startDate: ruleB.startDate,
          startTime: ruleB.startTime,
          durationMinutes: ruleB.durationMinutes,
        };
        const newRuleB: RecurrenceRule = {
          ...ruleB,
          rruleString: ruleA.rruleString,
          startDate: ruleA.startDate,
          startTime: ruleA.startTime,
          durationMinutes: ruleA.durationMinutes,
        };
        await sessionRepo.saveRecurrenceRule(newRuleA);
        await sessionRepo.saveRecurrenceRule(newRuleB);
      }
    }
  };

  const updateSessionStatus = async (slot: CalendarSlot, newStatus: Session['status']) => {
    // Si ya existe una sesión en la DB, la actualizamos
    if (slot.uuid) {
      const existing = await sessionRepo.getByUuid(slot.uuid);
      if (existing) {
        existing.status = newStatus;
        existing.updatedAt = new Date().toISOString();
        await sessionRepo.save(existing);
      }
    } else {
      // Si era un turno recurrente virtual, creamos una "excepción" física en IndexedDB
      const patientSessions = await sessionRepo.getByPatient(slot.patientUuid);
      const lastSession = patientSessions.sort((a, b) => new Date(b.dateTime).getTime() - new Date(a.dateTime).getTime())[0];
      const inheritedDescription = lastSession ? lastSession.description : "";
      const inheritedColorTag = lastSession ? lastSession.colorTag : "indigo";

      const newSession: Session = {
        uuid: crypto.randomUUID(),
        patientUuid: slot.patientUuid,
        dateTime: slot.dateTime.toISOString(),
        status: newStatus,
        priceAtSession: slot.price,
        description: inheritedDescription,
        colorTag: inheritedColorTag,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      await sessionRepo.save(newSession);
    }
  };

  const removeRecurrenceRule = async (patientUuid: string) => {
    await sessionRepo.deleteRecurrenceRule(patientUuid);
  };

  return {
    currentDate,
    weekStart,
    weekEnd,
    weekDays,
    agenda,
    nextWeek,
    prevWeek,
    goToToday,
    selectDate: setCurrentDate,
    addManualSession,
    addRecurrence,
    rescheduleSlot,
    swapSlots,
    updateSessionStatus,
    removeRecurrenceRule,
    patients,
    holidays,
    dbSessions,
    recurrenceRules,
    absencePeriods,
  };
}
