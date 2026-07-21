# Propuesta Técnica: Sincronización Híbrida (Base de Datos + Archivos Visibles en Drive)

## 1. Objetivo
Implementar una solución de sincronización híbrida en Google Drive. El sistema mantendrá la base de datos de la aplicación en el almacenamiento oculto `appDataFolder` para restauraciones seguras (LWW), pero generará e inyectará de forma visible una estructura jerárquica de carpetas y archivos Word `.doc` legibles en la raíz del Google Drive de la profesional.

## 2. Cambios Propuestos

### 2.1 Modificación de OAuth Scopes
- **Ubicación:** [google-drive.repository.ts](file:///home/axel/Escritorio/PSICO-AGENDA/src/infrastructure/drive/google-drive.repository.ts)
- **Cambio:** Modificar el Token Client para solicitar el scope `https://www.googleapis.com/auth/drive.file`. Este scope permite a la aplicación leer, crear y editar archivos y carpetas que hayan sido creados o abiertos por ella en la raíz del Drive visible del usuario, sin comprometer otros archivos ajenos a la app.

### 2.2 Ampliación de la API del Repositorio de Drive
Agregar los siguientes métodos en `google-drive.repository.ts` para navegar y crear la jerarquía de directorios:
1.  `getOrCreateFolder(name: string, parentId?: string): Promise<string>`: Busca una carpeta por su nombre en un directorio padre (o raíz). Si no existe, la crea y retorna su `fileId`.
2.  `uploadFileToFolder(folderId: string, filename: string, mimeType: string, content: string | Blob): Promise<void>`: Sube un archivo a un directorio específico. Si el archivo ya existe con ese nombre, actualiza su contenido (PATCH).

### 2.3 Sincronización en Cascada en el Hook
- **Ubicación:** [useGoogleDrive.ts](file:///home/axel/Escritorio/PSICO-AGENDA/src/ui/hooks/useGoogleDrive.ts)
- **Cambio:** Tras completar la sincronización atómica de base de datos (`uploadBackup` en `appDataFolder`), disparar un proceso en segundo plano que recorra secuencialmente los pacientes locales y cree:
  - Carpeta raíz `PSICO-AGENDA`.
  - Carpeta `pacientes`.
  - Carpeta de cada paciente (`{fullName}_{partialUuid}`).
  - Archivo `perfil.json` e `Historial_Clinico.doc` (utilizando la lógica HTML-Word de `docx-exporter.ts`).
  - Carpeta `sesiones` con los archivos de evoluciones individuales por sesión física grabada (`{fecha}_Sesion_{numero}.doc`).

## 3. Plan de Verificación
- **Prueba 1 (OAuth):** Validar que al conectar Drive se pida el consentimiento del scope visible.
- **Prueba 2 (Directorios):** Sincronizar y comprobar físicamente que aparece la carpeta `PSICO-AGENDA` en la raíz visible de Drive con la estructura y los archivos Word adentro.
- **Prueba 3 (Actualización):** Modificar un expediente en la app, sincronizar y verificar que los archivos Word en Drive reflejen los cambios sin duplicar archivos.
