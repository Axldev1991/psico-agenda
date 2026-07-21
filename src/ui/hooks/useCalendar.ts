import { useState, useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { RRule } from 'rrule';
import { 
  startOfWeek, 
  endOfWeek, 
  eachDayOfInterval, 
  parseISO, 
  format, 
  addWeeks, 
  subWeeks,
  isSameDay,
  parse
} from 'date-fns';
import { DexieSessionRepository } from '../../infrastructure/db/dexie-session.repository';
import { DexiePatientRepository } from '../../infrastructure/db/dexie-patient.repository';
import { Session, RecurrenceRule } from '../../domain/session.types';
import { getHoliday, Holiday, fetchArgentinaHolidays } from '../../domain/holidays';

const sessionRepo = new DexieSessionRepository();
const patientRepo = new DexiePatientRepository();

export interface CalendarSlot {
  uuid?: string; // Si ya fue grabada físicamente
  patientUuid: string;
  patientName: string;
  dateTime: Date;
  durationMinutes: number;
  status: 'scheduled' | 'completed' | 'cancelled' | 'missed';
  price: number;
  notes?: string;
  isRecurrent: boolean;
  holiday?: Holiday; // Si cae en feriado
}

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

  // Función principal: Calcular la agenda de la semana mezclando recurrencias y excepciones
  const getWeeklyAgenda = (): CalendarSlot[] => {
    const agenda: CalendarSlot[] = [];

    // --- PARTE A: Procesar Turnos Recurrentes (rrule.js) ---
    recurrenceRules.forEach((rule) => {
      const patient = patientMap.get(rule.patientUuid);
      if (!patient) return;

      try {
        // Parsear la regla iCalendar
        const rrule = RRule.fromString(rule.rruleString);
        
        // Calcular todas las ocurrencias dentro de esta semana
        const occurrences = rrule.between(weekStart, weekEnd, true);

        occurrences.forEach((occurrence) => {
          // Reconstruir la fecha y hora exacta del turno
          const [hours, minutes] = rule.startTime.split(':').map(Number);
          const slotDateTime = new Date(occurrence);
          slotDateTime.setHours(hours, minutes, 0, 0);

          // Verificar si ya existe una "excepción" grabada en la base de datos para este mismo día/hora
          const dbOverride = dbSessions.find(s => 
            s.patientUuid === rule.patientUuid && 
            isSameDay(parseISO(s.dateTime), slotDateTime)
          );

          // Si hay una excepción en la DB con estado 'cancelled' o modificado, lo respetamos
          if (dbOverride) {
            agenda.push({
              uuid: dbOverride.uuid,
              patientUuid: rule.patientUuid,
              patientName: patient.fullName,
              dateTime: slotDateTime,
              durationMinutes: rule.durationMinutes,
              status: dbOverride.status,
              price: dbOverride.priceAtSession,
              notes: dbOverride.notes,
              isRecurrent: true,
              holiday: getHoliday(slotDateTime, holidays)
            });
          } else {
            // Si no hay excepción, agregamos el slot recurrente por defecto
            agenda.push({
              patientUuid: rule.patientUuid,
              patientName: patient.fullName,
              dateTime: slotDateTime,
              durationMinutes: rule.durationMinutes,
              status: 'scheduled',
              price: patient.sessionPrice,
              isRecurrent: true,
              holiday: getHoliday(slotDateTime, holidays)
            });
          }
        });
      } catch (err) {
        console.error('Error parseando RRule:', err);
      }
    });

    // --- PARTE B: Procesar Sesiones Manuales Únicas ---
    // Agregamos sesiones de la DB de esta semana que NO son recurrentes (es decir, citas únicas aisladas)
    dbSessions.forEach((session) => {
      const sessionDate = parseISO(session.dateTime);
      if (sessionDate >= weekStart && sessionDate <= weekEnd) {
        // Si no está ya cubierta en la parte A (para evitar duplicados)
        const alreadyAdded = agenda.some(slot => 
          slot.patientUuid === session.patientUuid && 
          isSameDay(slot.dateTime, sessionDate)
        );

        if (!alreadyAdded) {
          const patient = patientMap.get(session.patientUuid);
          agenda.push({
            uuid: session.uuid,
            patientUuid: session.patientUuid,
            patientName: patient ? patient.fullName : 'Paciente Desconocido',
            dateTime: sessionDate,
            durationMinutes: 50, // Duración default
            status: session.status,
            price: session.priceAtSession,
            notes: session.notes,
            isRecurrent: false,
            holiday: getHoliday(sessionDate, holidays)
          });
        }
      }
    });

    // Ordenar la agenda cronológicamente
    return agenda.sort((a, b) => a.dateTime.getTime() - b.dateTime.getTime());
  };

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
    const newSession: Session = {
      uuid: crypto.randomUUID(),
      patientUuid: sessionData.patientUuid,
      dateTime: sessionData.dateTime,
      status: sessionData.status,
      priceAtSession: patient ? patient.sessionPrice : 0,
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
      const newSession: Session = {
        uuid: crypto.randomUUID(),
        patientUuid: slot.patientUuid,
        dateTime: slot.dateTime.toISOString(),
        status: newStatus,
        priceAtSession: slot.price,
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
    agenda: getWeeklyAgenda(),
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
