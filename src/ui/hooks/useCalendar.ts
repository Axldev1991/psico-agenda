import { useState, useEffect, useMemo } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { 
  startOfWeek, 
  endOfWeek, 
  eachDayOfInterval, 
  parseISO, 
  addWeeks, 
  subWeeks,
} from 'date-fns';
import { container } from '../../infrastructure/container';
import { Session, RecurrenceRule } from '../../domain/session.types';
import { Holiday, fetchArgentinaHolidays } from '../../domain/holidays';
import { CalendarSlot } from '../../domain/agenda.types';
import { computeAgendaSlots } from '../../domain/agenda.service';

export type { CalendarSlot };

const sessionRepo = container.getSessionRepository();
const patientRepo = container.getPatientRepository();

export function useCalendar() {
  // Estado para la fecha base del calendario (por defecto, hoy)
  const [currentDate, setCurrentDate] = useState(new Date());
  
  // Estado local para los feriados de este año
  const [holidays, setHolidays] = useState<Holiday[]>([]);

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

  // Calcular la agenda de la semana delegando en el Servicio de Dominio puro
  const agenda = useMemo(() => {
    return computeAgendaSlots({
      intervalStart: weekStart,
      intervalEnd: weekEnd,
      recurrenceRules,
      dbSessions,
      patients,
      holidays,
    });
  }, [weekStart, weekEnd, recurrenceRules, dbSessions, patients, holidays]);

  // --- Funciones del Controlador ---
  
  const nextWeek = () => setCurrentDate(prev => addWeeks(prev, 1));
  const prevWeek = () => setCurrentDate(prev => subWeeks(prev, 1));
  const goToToday = () => setCurrentDate(new Date());

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

  const addRecurrence = async (ruleData: Omit<RecurrenceRule, 'rruleString'> & { dayOfWeek: number }) => {
    // dayOfWeek: 0 = MO, 1 = TU, 2 = WE, 3 = TH, 4 = FR, 5 = SA, 6 = SU
    const dayNames = ['MO', 'TU', 'WE', 'TH', 'FR', 'SA', 'SU'];
    const rruleString = `FREQ=WEEKLY;BYDAY=${dayNames[ruleData.dayOfWeek]}`;

    const newRule: RecurrenceRule = {
      patientUuid: ruleData.patientUuid,
      rruleString,
      startDate: ruleData.startDate,
      startTime: ruleData.startTime,
      durationMinutes: ruleData.durationMinutes
    };
    await sessionRepo.saveRecurrenceRule(newRule);
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
    updateSessionStatus,
    removeRecurrenceRule,
    patients,
    holidays,
    dbSessions,
    recurrenceRules
  };
}
