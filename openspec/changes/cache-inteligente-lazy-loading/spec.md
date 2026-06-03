# Especificación de Requisitos (Specs): Caché Inteligente y Lazy Loading

Este documento define los requisitos y criterios de aceptación para la implementación de la descarga diferida de expedientes y la limpieza local de caché.

---

## 1. Requisitos de Aceptación (Acceptance Criteria)

### REQ-1: Clasificación de Paciente Activo/Inactivo
- **Criterio de Aceptación:** 
  - Un paciente se considera **activo** si posee al menos una sesión registrada o planificada cuya fecha esté dentro de los últimos 180 días, o programada para cualquier momento en el futuro.
  - De lo contrario, se clasifica como **inactivo** (candidato a archivación local).

### REQ-2: Sincronización del Índice Global (`index-db.json`)
- **Criterio de Aceptación:** Cada ciclo de sincronización en red debe descargar y procesar `index-db.json` en `appDataFolder` para refrescar los metadatos y fechas de modificación de todos los pacientes en el fichero.

### REQ-3: Auto-Descarga Exclusiva para Activos
- **Criterio de Aceptación:** Durante la sincronización automática, la aplicación descargará en background el expediente completo de los pacientes clasificados como **activos** si el timestamp remoto en el índice es más reciente que el local. Los inactivos no se descargarán inicialmente.

### REQ-4: Interfaz de Carga Diferida (Lazy Load)
- **Criterio de Aceptación:**
  - Al abrir un expediente en [PatientDetail.tsx](file:///home/axel/Escritorio/PSICO-AGENDA/src/ui/components/PatientDetail.tsx), si `isHistoryLoaded` es `false`:
    - **Si hay internet:** Mostrar un loader con el mensaje *"Cargando historial clínico de la nube..."*, descargar `{patient_uuid}.json` en background, guardarlo localmente, setear `isHistoryLoaded = true` y pintar el editor.
    - **Si no hay internet:** Mostrar un estado deshabilitado con el mensaje *"Historial clínico archivado localmente. Conéctate a internet para descargarlo"*.

### REQ-5: Guarda de Seguridad contra Sobreescrituras (Data Loss Prevention)
- **Criterio de Aceptación:** Durante los ciclos de sincronización de subida en Drive, la app **nunca** debe subir archivos vacíos de evolución para aquellos registros locales que tengan `isHistoryLoaded === false`. El iterador saltará la subida de `{patient_uuid}.json` si la bandera es falsa y no hay modificaciones pendientes.

### REQ-6: Pre-carga Completa de Emergencia (Modo Offline Completo)
- **Criterio de Aceptación:** En la interfaz de configuración/sincronización, se debe incluir un botón de **"Pre-cargar todo para uso Offline"** que descargue en bucle todos los expedientes inactivos de una sola vez, asegurando el acceso local 100% offline ante viajes.
