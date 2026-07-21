# Especificación de Requisitos (Specs): Sincronización Híbrida Visible en Drive

Este documento detalla los requisitos de aceptación y comportamiento clínico esperados para la estructuración de carpetas y archivos visibles en Google Drive.

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
