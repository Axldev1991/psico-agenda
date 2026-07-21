# Diseño Técnico (Design): Estructuración y Subida de Archivos en Drive

Este documento detalla las especificaciones técnicas de las llamadas HTTP a la API v3 de Google Drive y la integración con el generador de Word de `docx-exporter.ts` para lograr la sincronización de carpetas visibles.

---

## 1. Llamadas a la API v3 de Google Drive

Para interactuar de manera exclusiva con los archivos que la aplicación crea, usaremos el endpoint de la API v3 de Google Drive con cabeceras `Authorization: Bearer ${accessToken}`.

### 1.1 Buscar Directorios Existentes
Para evitar duplicados, consultaremos la existencia de la carpeta por nombre y parentesco:
- **Endpoint:** `GET https://www.googleapis.com/drive/v3/files`
- **Query Params:**
  - `q`: `name='{folderName}' and mimeType='application/vnd.google-apps.folder' and '{parentFolderId || 'root'}' in parents and trashed=false`
  - `fields`: `files(id)`

### 1.2 Crear Directorios
Si la búsqueda no retorna resultados, crearemos la carpeta:
- **Endpoint:** `POST https://www.googleapis.com/drive/v3/files`
- **Headers:** `Content-Type: application/json`
- **Body:**
  ```json
  {
    "name": "{folderName}",
    "mimeType": "application/vnd.google-apps.folder",
    "parents": ["{parentFolderId || 'root'}"]
  }
  ```

### 1.3 Subir o Actualizar Archivos
Para subir perfiles y documentos clínicos (`.doc` o `.json`), primero buscaremos si el archivo existe con `q: name='{filename}' and '{parentFolderId}' in parents and trashed=false`.
- **Si existe:** Haremos una actualización de contenido (PATCH) en `https://www.googleapis.com/upload/drive/v3/files/{fileId}?uploadType=media` con el contenido del archivo.
- **Si no existe:** Invocaremos una creación multipart (POST) en `https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart` asociando el metadato del parentesco y el contenido.

---

## 2. Generación HTML-Word reusable
Extraeremos la lógica de ensamblado HTML del exportador de Word en `docx-exporter.ts` para que pueda retornar la cadena de texto de la estructura de Word en el hook sin forzar una descarga en el navegador.

Firma a reutilizar en `docx-exporter.ts`:
- `generateSessionWordHtml(patient: Patient, session: Session): string`
- `generateFullHistoryWordHtml(patient: Patient): string`

---

## 3. Cola Asíncrona Secuencial en el Hook
En `useGoogleDrive.ts`, tras completar el backup JSON principal, ejecutaremos en segundo plano un iterador secuencial (`async/await` en bucle simple) para no bloquear la interfaz de usuario:
```typescript
const syncVisibleFiles = async (patients, sessions) => {
  const rootId = await driveRepo.getOrCreateFolder("PSICO-AGENDA");
  const pacientesFolderId = await driveRepo.getOrCreateFolder("pacientes", rootId);
  
  for (const patient of patients) {
    const patientFolderId = await driveRepo.getOrCreateFolder(
      `${patient.fullName}_${patient.uuid.substring(0, 8)}`,
      pacientesFolderId
    );
    
    // Subir perfil.json e Historial_Clinico.doc
    ...
    // Subir sesiones individuales
    ...
  }
};
```
