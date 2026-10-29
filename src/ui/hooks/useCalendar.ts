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
import { Session, RecurrenceRule, PaymentStatus, PaymentMethod } from '../../domain/session.types';
import { Holiday, fetchArgentinaHolidays } from '../../domain/holidays';
import { CalendarSlot, RescheduleSlotParams, SwapSlotsParams, RecurrenceCadence } from '../../domain/agenda.types';
import { AbsencePeriod } from '../../domain/availability.types';
import { 
  computeAgendaSlots, 
  buildRRuleString, 
  rescheduleSlot as domainRescheduleSlot, 
  swapSlots as domainSwapSlots 
} from '../../domain/agenda.service';

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
    let existingRule: RecurrenceRule | undefined;
    if (slot.patientUuid) {
      existingRule = await sessionRepo.getRecurrenceRuleByPatient(slot.patientUuid);
    }

    const result = domainRescheduleSlot({
      slot,
      newDateTime,
      scope,
      existingRule,
      bookedSlots: agenda,
    });

    if (!result.success) {
      if (result.error === 'conflict') {
        throw new Error('El horario seleccionado colisiona con otro turno existente.');
      }
      if (result.error === 'missing_rule') {
        throw new Error('No se encontró una regla de recurrencia activa para este paciente.');
      }
      throw new Error('Error al reagendar el turno.');
    }

    if (result.cancelException) {
      if (slot.uuid) {
        const existing = await sessionRepo.getByUuid(slot.uuid);
        if (existing) {
          existing.status = 'cancelled';
          existing.description = `Reagendado al ${format(newDateTime, 'dd/MM/yyyy HH:mm')}`;
          existing.updatedAt = result.cancelException.updatedAt;
          await sessionRepo.save(existing);
        } else {
          await sessionRepo.save({
            ...result.cancelException,
            description: `Reagendado al ${format(newDateTime, 'dd/MM/yyyy HH:mm')}`,
          });
        }
      } else {
        await sessionRepo.save({
          ...result.cancelException,
          description: `Reagendado al ${format(newDateTime, 'dd/MM/yyyy HH:mm')}`,
        });
      }
    }

    if (result.newSession) {
      await sessionRepo.save({
        ...result.newSession,
        description: `Turno eventual reagendado (original: ${format(slot.dateTime, 'dd/MM HH:mm')})`,
      });
    }

    if (result.updatedRule) {
      await sessionRepo.saveRecurrenceRule(result.updatedRule);
    } else if (scope === 'permanent' && !slot.isRecurrent && slot.uuid) {
      // Sesión manual puntual no recurrente
      const existingSession = await sessionRepo.getByUuid(slot.uuid);
      if (existingSession) {
        existingSession.dateTime = newDateTime.toISOString();
        existingSession.updatedAt = new Date().toISOString();
        await sessionRepo.save(existingSession);
      }
    }
  };

  const swapSlots = async (params: SwapSlotsParams) => {
    const { slotA, slotB, scope } = params;
    const ruleA = await sessionRepo.getRecurrenceRuleByPatient(slotA.patientUuid);
    const ruleB = await sessionRepo.getRecurrenceRuleByPatient(slotB.patientUuid);

    const result = domainSwapSlots({
      slotA,
      slotB,
      scope,
      ruleA,
      ruleB,
      bookedSlots: agenda,
    });

    if (!result.success) {
      if (result.error === 'conflict') {
        throw new Error('El enroque no es posible porque existe una colisión con otro turno agendado.');
      }
      throw new Error('Error al realizar el enroque de turnos.');
    }

    for (const session of result.sessionsToSave) {
      if (session.status === 'cancelled') {
        const isA = session.patientUuid === slotA.patientUuid;
        const otherPatientName = isA ? slotB.patientName : slotA.patientName;
        const existing = await sessionRepo.getByUuid(session.uuid);
        if (existing) {
          existing.status = 'cancelled';
          existing.description = `Enroque con ${otherPatientName}`;
          existing.updatedAt = session.updatedAt;
          await sessionRepo.save(existing);
        } else {
          await sessionRepo.save({
            ...session,
            description: `Enroque con ${otherPatientName}`,
          });
        }
      } else {
        const isA = session.patientUuid === slotA.patientUuid;
        const otherPatientName = isA ? slotB.patientName : slotA.patientName;
        await sessionRepo.save({
          ...session,
          description: `Enroque eventual (horario habitual de ${otherPatientName})`,
        });
      }
    }

    for (const rule of result.rulesToSave) {
      await sessionRepo.saveRecurrenceRule(rule);
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

  const updateSessionPaymentStatus = async (
    slot: CalendarSlot,
    paymentStatus: PaymentStatus,
    paymentMethod?: PaymentMethod
  ) => {
    if (slot.uuid) {
      const existing = await sessionRepo.getByUuid(slot.uuid);
      if (existing) {
        existing.paymentStatus = paymentStatus;
        existing.paymentMethod = paymentStatus === 'paid' ? paymentMethod : undefined;
        existing.updatedAt = new Date().toISOString();
        await sessionRepo.save(existing);
      }
    } else {
      const patientSessions = await sessionRepo.getByPatient(slot.patientUuid);
      const lastSession = patientSessions.sort((a, b) => new Date(b.dateTime).getTime() - new Date(a.dateTime).getTime())[0];
      const inheritedDescription = lastSession ? lastSession.description : "";
      const inheritedColorTag = lastSession ? lastSession.colorTag : "indigo";

      const newSession: Session = {
        uuid: crypto.randomUUID(),
        patientUuid: slot.patientUuid,
        dateTime: slot.dateTime.toISOString(),
        status: slot.status,
        paymentStatus,
        paymentMethod: paymentStatus === 'paid' ? paymentMethod : undefined,
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
    updateSessionPaymentStatus,
    removeRecurrenceRule,
    patients,
    holidays,
    dbSessions,
    recurrenceRules,
    absencePeriods,
  };
}
