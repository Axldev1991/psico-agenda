# Plan de Tareas (Tasks): Sincronización Híbrida en Google Drive

## Checklist de Tareas

- [ ] **Refactorización de Templates Word (`docx-exporter.ts`)**
  - [ ] Desacoplar la lógica de generación del HTML con membrete y estilo de Word para sesiones (`generateSessionWordHtml`).
  - [ ] Desacoplar la lógica de generación de HTML de la evolución completa (`generateFullHistoryWordHtml`).
- [ ] **Actualización del Repositorio de Google Drive (`google-drive.repository.ts`)**
  - [ ] Cambiar el scope de OAuth en `login()` a `https://www.googleapis.com/auth/drive.file`.
  - [ ] Implementar la función `getOrCreateFolder(name, parentId)` para buscar/crear directorios sin duplicación.
  - [ ] Implementar la función `uploadFileToFolder(folderId, filename, mimeType, content)` para crear o actualizar archivos usando multipart POST/PATCH.
- [ ] **Coordinación de la Sincronización en el Hook (`useGoogleDrive.ts`)**
  - [ ] Modificar la función `performSync` para que, al concluir la sincronización atómica en `appDataFolder`, dispare asíncronamente el volcado en background de la estructura visible.
  - [ ] Diseñar el bucle secuencial que itere pacientes locales y suba sus carpetas, `perfil.json`, `Historial_Clinico.doc` y las sesiones individuales en subcarpetas.
- [ ] **Verificación y Pruebas**
  - [ ] Probar el inicio de sesión OAuth y consentir el nuevo alcance.
  - [ ] Sincronizar y auditar en Google Drive (web) que aparezcan las carpetas y los archivos `.doc` de prueba.
  - [ ] Modificar un expediente clínico, re-sincronizar y comprobar la actualización exitosa en Drive.
