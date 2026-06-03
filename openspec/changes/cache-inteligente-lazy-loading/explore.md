# Exploración Técnica: Caché Inteligente y Archivación de Historiales Clínicos (Lazy Loading)

## 1. Contexto y Objetivos
- **Problema:** Con los años de uso del consultorio, el volumen de datos en texto plano e historias clínicas puede acumularse considerablemente (por ejemplo, pacientes inactivos con más de 60 páginas de historial). Descargar y sincronizar todos estos datos pesados en cada sincronización degrada la velocidad de la app y consume ancho de banda innecesario.
- **Objetivo:** Implementar una estrategia de expiración de caché y carga diferida (Lazy Loading). Los pacientes inactivos mantendrán sus metadatos de ficha básica locales (buscables), pero su historial clínico pesado se archivará localmente, descargándose de Drive solo bajo demanda si se requiere.
- **Offline-First:** Se mantendrá un botón de "Descarga Completa Offline" para pre-cargar el 100% de los datos antes de viajar o trabajar sin señal.

## 2. Archivos e Interfaces Comprometidos

### 2.1 [patient.types.ts](file:///home/axel/Escritorio/PSICO-AGENDA/src/domain/patient.types.ts)
- Agregar campos opcionales:
  - `status?: 'active' | 'inactive'` (Estado del paciente).
  - `isHistoryLoaded?: boolean` (Bandera para saber si el historial clínico unificado está descargado localmente).

### 2.2 [dexie.db.ts](file:///home/axel/Escritorio/PSICO-AGENDA/src/infrastructure/db/dexie.db.ts)
- Incrementar la base de datos a la versión 3.
- Indexar los nuevos campos en la tabla `patients`.

### 2.3 [useGoogleDrive.ts](file:///home/axel/Escritorio/PSICO-AGENDA/src/ui/hooks/useGoogleDrive.ts)
- **Modificación en performSync:**
  - Evitar subir datos de pacientes cuyo `isHistoryLoaded` sea `false` (para prevenir sobrescribir archivos remotos completos con datos vacíos locales).
  - Descargar automáticamente al iniciar la sincronización únicamente los expedientes de pacientes "activos" o con sesiones agendadas en la semana corriente/siguiente.
- **Método de carga Lazy:**
  - Crear una función `downloadPatientHistory(patientUuid)` para descargar bajo demanda el historial completo de Drive y guardarlo en la DB local al abrir la ficha de un paciente inactivo.

### 2.4 [PatientDetail.tsx](file:///home/axel/Escritorio/PSICO-AGENDA/src/ui/components/PatientDetail.tsx)
- Si el paciente se encuentra con `isHistoryLoaded === false`, mostrar un estado de "Historial Archivado" con un botón interactivo de descarga ("Cargar historial desde la nube").

## 3. Desafíos y Riesgos Técnicos
- **Integridad de Datos (Riesgo Crítico):** Si el cliente borra el historial local para liberar caché y luego sincroniza, el sistema debe garantizar que el backup remoto no se sobreescriba con el estado vacío. La bandera `isHistoryLoaded` debe usarse como guarda de protección.
