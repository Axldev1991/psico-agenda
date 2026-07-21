# Exploración Técnica: Sincronización Visible de Archivos y Carpetas en Google Drive

## 1. Contexto y Objetivos
- **Objetivo:** Migrar el almacenamiento de historias clínicas de la carpeta privada y oculta `appDataFolder` a una estructura de carpetas y archivos visibles en la raíz de Google Drive del usuario.
- **Formato:** Los expedientes clínicos consolidados e individuales deben guardarse en formato Word `.doc` / `.docx` para asegurar la legibilidad del usuario.
- **Portabilidad:** Permitir el acceso externo directo desde cualquier gestor de archivos de Google Drive (mobile/web) sin depender de la aplicación.

## 2. Archivos e Interfaces Comprometidos

### 2.1 [google-drive.repository.ts](file:///home/axel/Escritorio/PSICO-AGENDA/src/infrastructure/drive/google-drive.repository.ts)
- **Modificación de Scopes:** Cambiar `https://www.googleapis.com/auth/drive.appdata` por `https://www.googleapis.com/auth/drive.file` en la inicialización del TokenClient.
- **Lógica de Directorios:**
  - Buscar o crear carpeta raíz `PSICO-AGENDA` en la raíz de Drive.
  - Buscar o crear subcarpeta `pacientes` dentro de `PSICO-AGENDA`.
  - Para cada paciente, buscar o crear una carpeta con nombre legible: `{nombre_paciente}_{uuid_parcial}`.
  - Dentro de cada paciente, buscar o crear la subcarpeta `sesiones`.
- **Lógica de Archivos:**
  - Guardar `index.json` en la raíz de la app en Drive.
  - Subir/Actualizar `perfil.json` dentro de la carpeta del paciente.
  - Subir/Actualizar `Historial_Clinico.docx` en la carpeta del paciente.
  - Subir/Actualizar `sesiones/{fecha}_Sesion_{numero}.docx` para cada evolución individual.

### 2.2 [useGoogleDrive.ts](file:///home/axel/Escritorio/PSICO-AGENDA/src/ui/hooks/useGoogleDrive.ts)
- Coordinar la sincronización para subir secuencialmente la estructura de archivos visible en Drive al ejecutar la sincronización.

## 3. Desafíos y Riesgos Técnicos
- **Límite de Requests (Rate Limiting):** Al subir múltiples archivos individuales por paciente, el número de peticiones HTTP a la API de Google Drive aumentará. Debemos estructurar la sincronización de manera asíncrona pero secuencial (o lotes) para evitar saturación de red.
- **ID de carpetas padres (Parent IDs):** En Google Drive, las carpetas se identifican por IDs únicos. Para subir un archivo a una subcarpeta, debemos obtener y propagar el ID de la subcarpeta creada.
