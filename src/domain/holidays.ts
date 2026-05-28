import { format } from 'date-fns';

export interface Holiday {
  date: string; // Formato "YYYY-MM-DD"
  name: string;
}

// Feriados Nacionales de Argentina para el año 2026 (Respaldo Estático)
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

interface ApiHoliday {
  motivo: string;
  dia: number;
  mes: number;
  tipo: string;
}

// Carga los feriados desde la API y los cachea en localStorage para garantizar offline
export async function fetchArgentinaHolidays(year: number): Promise<Holiday[]> {
  const cacheKey = `ar-holidays-${year}`;
  
  // 1. Intentar leer de la caché local (offline-first)
  if (typeof window !== 'undefined') {
    const cached = localStorage.getItem(cacheKey);
    if (cached) {
      try {
        return JSON.parse(cached);
      } catch (e) {
        console.error('Error leyendo caché de feriados:', e);
      }
    }
  }

  // 2. Si no hay caché, ir a buscar a la API oficial
  try {
    const response = await fetch(`https://nolaborables.com.ar/api/v1/feriados/${year}?incluir=opcional`);
    if (!response.ok) throw new Error('API no disponible');

    const data: ApiHoliday[] = await response.json();
    
    // Traducir formato de la API al nuestro
    const formatted: Holiday[] = data.map(h => {
      const monthStr = String(h.mes).padStart(2, '0');
      const dayStr = String(h.dia).padStart(2, '0');
      return {
        date: `${year}-${monthStr}-${dayStr}`,
        name: h.motivo
      };
    });

    // Guardar en caché para futuras visitas offline
    if (typeof window !== 'undefined') {
      localStorage.setItem(cacheKey, JSON.stringify(formatted));
    }

    return formatted;
  } catch (err) {
    console.warn(`Error cargando feriados dinámicos para ${year}. Usando respaldo estático.`, err);
    // Si la API falla y es 2026, usamos nuestro respaldo físico
    return year === 2026 ? ARGENTINA_HOLIDAYS_2026 : [];
  }
}

export function getHoliday(date: Date, loadedHolidays?: Holiday[]): Holiday | undefined {
  const dateStr = format(date, 'yyyy-MM-dd');
  const list = loadedHolidays || ARGENTINA_HOLIDAYS_2026;
  return list.find(h => h.date === dateStr);
}
