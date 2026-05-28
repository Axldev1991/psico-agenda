# Especificación Técnica: Motor de Datos y Sincronización
**Documento Técnico para el Desarrollador**

---

## 1. Stack Tecnológico
*   **Frontend:** Next.js (React) + PouchDB/Dexie (Local Cache).
*   **API de Terceros:** Google Drive API v3 + Google OAuth2.
*   **Librerías Core:**
    *   `rrule.js`: Lógica de recurrencia (RFC 5545).
    *   `docx.js`: Generación de archivos binarios Word en cliente.
    *   `date-fns`: Manipulación de calendarios y feriados locale.

## 2. Arquitectura de Almacenamiento
El sistema utiliza un enfoque "Serverless App-Data Storage" sobre Google Drive.

### Formatos de Archivo:
*   **Metadata:** JSON (estructuras de datos para la aplicación).
*   **Historias Clínicas:** Markdown (.md) para persistencia interna y DOCX (.docx) para legibilidad de usuario.
*   **Configuración:** `config.json` para feriados, dureción de sesiones y presets de usuario.

### Esquema de Directorios en Drive:
```text
/PSICO-AGENDA/
├── config.json
├── index.json
└── /patients/
    └── /{patient_uuid}/
        ├── profile.json
        └── /sessions/
            ├── date_time.json
            └── date_time.docx
```

## 3. Lógica de Sincronización
*   **Escritura:** Atómica por sesión. Cada vez que se cierra una sesión, se dispara la escritura del JSON y el DOCX vía API.
*   **Lectura:** Carga diferida (Lazy Loading). El `index.json` se carga al inicio; los detalles del paciente solo se descargan al seleccionarlo.
*   **Integración OS:** Dependencia de *Google Drive for Desktop* para la persistencia "física" en el disco duro local de la PC del usuario.

## 4. Seguridad
*   **Scope:** `drive.appdata` o `drive.file` restringido.
*   **Auth:** Refresh Tokens para sesión persistente.
*   **Data Integrity:** Validaciones de Schema antes de cada escritura para evitar corrupción de archivos JSON.
