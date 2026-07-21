export interface Session {
  uuid: string;
  patientUuid: string;      // Relación con el Paciente
  dateTime: string;         // Fecha y hora en formato ISO string (ej: "2026-05-28T16:00:00.000Z")
  status: 'scheduled' | 'completed' | 'cancelled' | 'missed';
  priceAtSession: number;   // Precio histórico cobrado (para no romper la contabilidad retroactiva si suben las tarifas)
  notes?: string;           // Notas breves clínicas
  description?: string;     // Descripción rápida para el índice
  colorTag?: string;        // Marca de color visual (ej: "indigo", "rose", "emerald")
  createdAt: string;
  updatedAt: string;
}

export interface RecurrenceRule {
  patientUuid: string;      // Relación con el Paciente
  rruleString: string;      // String estándar iCalendar (ej: "FREQ=WEEKLY;BYDAY=TU")
  startDate: string;        // Fecha de inicio (ej: "2026-05-28")
  startTime: string;        // Hora de inicio (ej: "16:00")
  durationMinutes: number;  // Duración de la sesión (ej: 50)
}
