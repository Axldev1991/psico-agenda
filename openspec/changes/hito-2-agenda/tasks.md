# Lista de Tareas (Tasks): Hito 2 - PSICO-AGENDA

Este checklist detalla los pasos mecánicos ejecutados para implementar el sistema de Agenda Inteligente y Turnos Recurrentes.

---

## Fase 1: Instalación e Inicialización
- [x] **Tarea 1.1**: Instalar las dependencias core de manejo de fechas y recurrencias (`rrule` y `date-fns`).

## Fase 2: Modelado del Dominio
- [x] **Tarea 2.1**: Definir modelos de datos en `src/domain/session.types.ts` (`Session` y `RecurrenceRule`).
- [x] **Tarea 2.2**: Establecer las firmas del contrato en `src/repositories/session.repository.ts` (`ISessionRepository`).
- [x] **Tarea 2.3**: Crear la base de datos estática local de Feriados Nacionales Argentinos en `src/domain/holidays.ts`.

## Fase 3: Persistencia de Datos
- [x] **Tarea 3.1**: Actualizar la base de datos Dexie `src/infrastructure/db/dexie.db.ts` a la **versión 2**, agregando soporte para las tablas `sessions` y `recurrenceRules`.
- [x] **Tarea 3.2**: Desarrollar la clase adaptadora `src/infrastructure/db/dexie-session.repository.ts` implementando el contrato completo.

## Fase 4: Lógica de Negocio y Controladores
- [x] **Tarea 4.1**: Diseñar el Custom Hook motor `src/ui/hooks/useCalendar.ts` que parsea las reglas de recurrencia en tiempo real con `rrule.js`, maneja excepciones locales, y valida alertas de feriados.

## Fase 5: Interfaz de Usuario e Integración
- [x] **Tarea 5.1**: Integrar la agenda semanal y el modal de turnos en `src/app/page.tsx` con un diseño Tailwind premium intercambiable con la vista del Fichero.
