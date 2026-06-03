# Plan de Tareas (Tasks): Caché Inteligente y Lazy Loading

## Checklist de Tareas

- [ ] **Estructura y Modelado de Datos**
  - [ ] Añadir campos `status` e `isHistoryLoaded` en [patient.types.ts](file:///home/axel/Escritorio/PSICO-AGENDA/src/domain/patient.types.ts).
  - [ ] Incrementar el esquema en [dexie.db.ts](file:///home/axel/Escritorio/PSICO-AGENDA/src/infrastructure/db/dexie.db.ts) a la Versión 3 indexando los nuevos atributos.
- [ ] **Desarrollo del Repositorio de Drive Granular (`google-drive.repository.ts`)**
  - [ ] Crear métodos para subir y descargar el índice plano (`index-db.json`) en `appDataFolder`.
  - [ ] Crear métodos para buscar/crear la subcarpeta oculta `patients` en `appDataFolder`.
  - [ ] Crear métodos para subir y descargar archivos de evolución individuales `{uuid}.json`.
- [ ] **Lógica de Negocio y Ciclo de Vida en el Hook (`useGoogleDrive.ts`)**
  - [ ] Implementar el script de evicción y limpieza de caché local `evictOldCache` (regla de los 180 días).
  - [ ] Refactorizar `performSync` para sincronizar de manera selectiva (índice plano + deltas de activos).
  - [ ] Desarrollar la función `downloadPatientHistory(uuid)` para descarga diferida (bajo demanda).
- [ ] **Integración en la UI de Ficha detallada (`PatientDetail.tsx`)**
  - [ ] Agregar estados de carga (`isDownloading`) en el renderizado de notas.
  - [ ] Renderizar el panel de alerta "Historial Archivado" e inhabilitar edición si `isHistoryLoaded === false`.
  - [ ] Vincular el botón "Descargar historial" con la función diferida del hook de Drive.
- [ ] **Configuración y Descarga Offline Total**
  - [ ] Diseñar el botón de "Pre-descarga masiva para uso offline" en la vista de configuración del navbar.
