# Funcionalidad: Contabilidad y Reportes
**Estado:** Definición Conceptual

---

## 2. Requerimientos
*   **Gestión de Precios:**
    *   **Precio Global:** Definido en la configuración general de la app.
    *   **Precio por Paciente:** Posibilidad de definir un honorario especial en la ficha de cada paciente (sobreescribe el global).
    *   **Precio por Sesión:** Opción de modificar el monto de una sesión puntual manualmente antes de cerrarla.
*   **Seguimiento de Pagos:**
    *   **Estados:** [Pagado | Pendiente]. 
    *   **Medios de Pago:** Registro de cómo pagó (Efectivo, Transferencia, Mercado Pago, etc. - Configurable).
    *   **Gestión de Deudas:** Listado automático de pacientes con sesiones pendientes de pago y monto total adeudado.
*   **Generador de Reporte para Contadora:**
    *   **Frecuencia:** Semanal o Mensual.
    *   **Contenido:** Listado de pacientes atendidos, fecha de cada sesión y monto total acumulado.
    *   **Formato:** PDF para fácil lectura o Excel si la contadora lo requiere.
*   **Tablero de Ingresos:** Vista rápida donde la profesional puede ver cuánto dinero lleva generado en el mes actual.

## 3. Próximas Definiciones
*   ¿Formatos específicos requeridos por la contadora?
*   ¿Manejo de facturación electrónica o solo reporte de datos?
