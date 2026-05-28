# Hito 2: Gestión de Pacientes y Agenda Inteligente - PSICO-AGENDA

Esta propuesta técnica y de diseño detalla la planificación de la arquitectura para el **Hito 2: Agenda Inteligente y Gestión de Sesiones**, incorporando lógica de turnos recurrentes y reconocimiento de feriados.

---

## 1. Fundamentos Técnicos del Hito 2

En este hito, transformaremos la aplicación de un simple fichero de datos a un **sistema de calendarización inteligente y offline-first**. Para lograrlo de forma modular y prolija, incorporaremos dos herramientas clave del ecosistema:

1.  **`rrule.js` (Lógica de Recurrencia - RFC 5545)**: Es el estándar mundial de calendarios (el mismo que usa Google Calendar o iCal). En lugar de crear a mano en la base de datos 52 registros individuales para un paciente que se atiende "todos los martes a las 16:00 hs durante un año" (lo cual saturaría el disco de registros inútiles), guardamos una única **Regla de Recurrencia**. El motor de la app genera las fechas "al vuelo" en tiempo de ejecución.
2.  **`date-fns` (Manipulación de Calendarios y Fechas)**: Una librería ultra-liviana y moderna para manejar fechas en JavaScript (muy superior a la arcaica API nativa `Date`), que usaremos para comparar días y cruzar agendas.

---

## 2. Nuevos Modelos de Dominio (Domain Layer)

Ubicación sugerida: `src/domain/session.types.ts`

```typescript
export interface Session {
  uuid: string;
  patientUuid: string;      // Relación / Clave foránea al Paciente
  dateTime: string;         // Fecha y hora en formato ISO
  status: 'scheduled' | 'completed' | 'cancelled' | 'missed';
  priceAtSession: number;   // Precio histórico cobrado en esta sesión (para reportes contables)
  notes?: string;           // Notas breves preliminares
  createdAt: string;
  updatedAt: string;
}

export interface RecurrenceRule {
  patientUuid: string;
  rruleString: string;      // String estándar del protocolo iCalendar (ej: FREQ=WEEKLY;BYDAY=TU)
  startDate: string;
  startTime: string;        // Hora de inicio (ej: "16:00")
  durationMinutes: number;  // Duración por defecto (ej: 50)
}
```

---

## 3. Base de Datos Reactiva (Ampliación de Dexie.js)

Modificaremos `src/infrastructure/db/dexie.db.ts` para agregar la tabla `sessions`:

```typescript
this.version(2).stores({
  patients: 'uuid, fullName, createdAt',
  sessions: 'uuid, patientUuid, dateTime, status' // Indexamos por relación y fecha para queries rápidas
});
```

---

## 4. Plan de Acción del Hito 2

1.  **Instalar dependencias**: `rrule` y `date-fns`.
2.  **Modelar el Dominio y Repositorios**: Crear los tipos de `Session` e `ISessionRepository`.
3.  **Ampliar la base de datos local**: Actualizar `dexie.db.ts` a la versión 2 agregando la tabla `sessions` y crear `DexieSessionRepository`.
4.  **Lógica de Feriados**: Crear una base de datos local / JSON estático de Feriados Nacionales de Argentina para cruzar turnos.
5.  **Calendario Visual Premium**: Diseñar una interfaz interactiva de Agenda Semanal/Mensual con Tailwind, conectando los turnos recurrentes calculados por `rrule.js`.
