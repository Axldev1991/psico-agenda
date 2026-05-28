# Funcionalidad: Agenda y Turnos Periódicos
**Estado:** Definición Conceptual

---

## 1. Objetivo
Gestionar el calendario de sesiones de forma inteligente, resolviendo automáticamente las recurrencias y los conflictos con feriados.

## 2. Requerimientos
*   **Motor de Recurrencia:**
    *   **Semanal:** Sesión el mismo día cada semana.
    *   **Quincenal:** Sesión cada 14 días.
    *   **Mensual:** Sesión en un día fijo del mes.
*   **Gestión de Horarios:** Slots de tiempo fijos (Definidos en Configuración Global).
*   **Feriados Flexibles:**
    *   Carga automática de feriados nacionales.
    *   Sistema de decisión: La profesional decide si trabaja o no en cada feriado individual.
*   **Recordatorios Manuales (WhatsApp):** Botón para disparar un mensaje pre-configurado al contacto del paciente vía WhatsApp Web/App.
*   **Gestión de Cancelaciones:** Posibilidad de liberar un slot horario por cancelación, permitiendo el re-agendamiento manual de otro paciente.
*   **Vista Multi-dispositivo:**
    *   **PC:** Calendario completo.
    *   **Celular:** Lista de tareas/agenda del día.

## 3. Próximas Definiciones
*   ¿Tiempo de descanso (buffer) entre sesiones?
*   ¿Manejo de sobre-turnos o turnos extraordinarios?
