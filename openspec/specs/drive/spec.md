# Especificación de Requisitos (Specs): Sincronización Híbrida y Caché Inteligente (Drive)

Este documento detalla los requisitos de aceptación y comportamiento clínico esperados para la estructuración de carpetas, archivos visibles en Google Drive, sincronización fraccionada y caché local diferida (lazy loading).

---

## 1. Requisitos de Aceptación (Acceptance Criteria)

### REQ-1: Migración de Alcance Seguro (Scope drive.file)
- **Criterio de Aceptación:** La aplicación debe solicitar consentimiento de tipo `drive.file` para leer y escribir de forma exclusiva archivos creados por ella misma en la raíz visible del usuario.
- **Validación:** El login oficial en el repositorio de Drive debe invocar este alcance y almacenar el token de forma consistente.

### REQ-2: Prevención Estricta de Duplicados en Directorios
- **Criterio de Aceptación:** Las carpetas del sistema (`PSICO-AGENDA`, `pacientes`, la carpeta del paciente y `sesiones`) no deben duplicarse si el usuario sincroniza varias veces desde navegadores o dispositivos distintos. El sistema debe comprobar su existencia previa por nombre y parentesco.
- **Validación:** Si ya existe una carpeta con el mismo nombre y padre, se debe reutilizar su ID en lugar de llamar a `POST`.

### REQ-3: Formato Word de Ficha y Evoluciones Clínicas
- **Criterio de Aceptación:** 
  - La carpeta del paciente debe alojar un archivo consolidado llamado `Historial_Clinico.doc` que contenga todas sus notas de evolución formateadas secuencialmente.
  - La subcarpeta `sesiones` debe alojar archivos individuales llamados `YYYY-MM-DD_Sesion_N.doc`.
- **Validación:** Los documentos generados deben poder abrirse correctamente en Microsoft Word, Google Docs y visores móviles de Office conservando el estilo y formato preestablecidos.

### REQ-4: Resiliencia de Red y Sincronización Asíncrona
- **Criterio de Aceptación:** Dado que la inyección de múltiples carpetas y archivos genera varias peticiones API, el proceso debe realizarse secuencialmente o en cola en segundo plano, sin interferir con la experiencia del usuario una vez que el backup JSON principal atómico de `appDataFolder` se haya subido con éxito.
- **Validación:** El loader del navbar debe cambiar a "Sincronizado" apenas termine el backup JSON, y la subida de los Word visibles continuará en background de forma silenciosa e inofensiva.

### REQ-5: Clasificación de Paciente Activo/Inactivo
- **Criterio de Aceptación:** 
  - Un paciente se considera **activo** si posee al menos una sesión registrada o planificada cuya fecha esté dentro de los últimos 180 días, o programada para cualquier momento en el futuro.
  - De lo contrario, se clasifica como **inactivo** (candidato a archivación local).

### REQ-6: Sincronización del Índice Global (`index-db.json`)
- **Criterio de Aceptación:** Cada ciclo de sincronización en red debe descargar y procesar `index-db.json` en `appDataFolder` para refrescar los metadatos y fechas de modificación de todos los pacientes en el fichero.

### REQ-7: Auto-Descarga Exclusiva para Activos
- **Criterio de Aceptación:** Durante la sincronización automática, la aplicación descargará en background el expediente completo de los pacientes clasificados como **activos** si el timestamp remoto en el índice es más reciente que el local. Los inactivos no se descargarán inicialmente.

### REQ-8: Interfaz de Carga Diferida (Lazy Load)
- **Criterio de Aceptación:**
  - Al abrir un expediente en [PatientDetail.tsx](file:///home/axel/Escritorio/PSICO-AGENDA/src/ui/components/PatientDetail.tsx), si `isHistoryLoaded` es `false`:
    - **Si hay internet:** Mostrar un loader con el mensaje *"Cargando historial clínico de la nube..."*, descargar `{patient_uuid}.json` en background, guardarlo localmente, setear `isHistoryLoaded = true` y pintar el editor.
    - **Si no hay internet:** Mostrar un estado deshabilitado con el mensaje *"Historial clínico archivado localmente. Conéctate a internet para descargarlo"*.

### REQ-9: Guarda de Seguridad contra Sobreescrituras (Data Loss Prevention)
- **Criterio de Aceptación:** Durante los ciclos de sincronización de subida en Drive, la app **nunca** debe subir archivos vacíos de evolución para aquellos registros locales que tengan `isHistoryLoaded === false`. El iterador saltará la subida de `{patient_uuid}.json` si la bandera es falsa y no hay modificaciones pendientes.

### REQ-10: Pre-carga Completa de Emergencia (Modo Offline Completo)
- **Criterio de Aceptación:** En la interfaz de configuración/sincronización, se debe incluir un botón de **"Pre-cargar todo para uso Offline"** que descargue en bucle todos los expedientes inactivos de una sola vez, asegurando el acceso local 100% offline ante viajes.
