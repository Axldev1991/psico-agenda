import { format } from 'date-fns';

export interface Holiday {
  date: string; // Formato "YYYY-MM-DD"
  name: string;
}

// Feriados Nacionales de Argentina para el año 2026
export const ARGENTINA_HOLIDAYS_2026: Holiday[] = [
  { date: '2026-01-01', name: 'Año Nuevo' },
  { date: '2026-02-16', name: 'Carnaval' },
  { date: '2026-02-17', name: 'Carnaval' },
  { date: '2026-03-24', name: 'Día Nacional de la Memoria por la Verdad y la Justicia' },
  { date: '2026-04-02', name: 'Día del Veterano y de los Caídos en la Guerra de Malvinas' },
  { date: '2026-04-03', name: 'Viernes Santo' },
  { date: '2026-05-01', name: 'Día del Trabajador' },
  { date: '2026-05-25', name: 'Día de la Revolución de Mayo' },
  { date: '2026-06-15', name: 'Paso a la Inmortalidad del Gral. Güemes (Trasladado)' },
  { date: '2026-06-20', name: 'Paso a la Inmortalidad del Gral. Belgrano (Día de la Bandera)' },
  { date: '2026-07-09', name: 'Día de la Independencia' },
  { date: '2026-08-17', name: 'Paso a la Inmortalidad del Gral. José de San Martín' },
  { date: '2026-10-12', name: 'Día del Respeto a la Diversidad Cultural' },
  { date: '2026-11-23', name: 'Día de la Soberanía Nacional' },
  { date: '2026-12-08', name: 'Día de la Inmaculada Concepción de María' },
  { date: '2026-12-25', name: 'Navidad' },
];

export function getHoliday(date: Date): Holiday | undefined {
  const dateStr = format(date, 'yyyy-MM-dd');
  return ARGENTINA_HOLIDAYS_2026.find(h => h.date === dateStr);
}
