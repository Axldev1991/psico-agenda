# Propuesta Técnica: Caché Inteligente y Sincronización Fraccionada (Lazy Loading)

## 1. Objetivo
Rediseñar la persistencia en Google Drive para migrar de un archivo de backup único (`psico-agenda-backup.json`) a un esquema de **almacenamiento fraccionado**. Esto evitará la descarga innecesaria de megabytes de texto histórico de pacientes inactivos en redes móviles, permitiendo que la aplicación se mantenga veloz y con bajo consumo de datos a lo largo de los años.

## 2. Cambios Propuestos

### 2.1 Nueva Estructura Técnica en Google Drive (`appDataFolder`)
En lugar de un backup consolidado de 36 MB, la base de datos interna de la app en la nube se estructurará de forma granular dentro de la carpeta oculta de la aplicación:
```text
appDataFolder/
├── index-db.json                       <-- Índice plano con UUIDs, nombres, estados y timestamps de modificación.
└── /patients/
    └── {patient_uuid}.json             <-- Contenido clínico completo (clinicalHistory) y logs de sesiones del paciente.
```

### 2.2 Sincronización Inteligente de Red (Deltas e Historiales Activos)
- **Sincronización del Índice:** Al iniciar la app, siempre se descarga `index-db.json` para actualizar el fichero local y conocer qué pacientes existen y sus marcas temporales.
- **Sincronización Activa:**
  - El sistema detectará quiénes son los pacientes "activos" (aquellos con sesiones en los últimos 180 días o con turnos programados en el futuro).
  - Descargará automáticamente los archivos `{patient_uuid}.json` correspondientes si sufrieron cambios en la nube.
- **Sincronización Lazy (Bajo Demanda):**
  - Los pacientes inactivos que no estén en IndexedDB local se descargarán únicamente cuando la profesional los busque y abra su expediente clínico en la UI.
  - Al descargarse, se guardan de forma persistente en el IndexedDB local (`isHistoryLoaded: true`) para que estén disponibles offline a partir de ese momento.

### 2.3 Expiración de Caché Local (Regla de los 180 días)
Para evitar que el almacenamiento local del navegador se sature en dispositivos con poco espacio:
- Al iniciar la app, se ejecutará un proceso de limpieza local:
  - Los pacientes que no hayan tenido sesiones en los últimos 180 días y cuya última modificación de notas sea mayor a 180 días se "archivarán" localmente.
  - Se eliminará su `clinicalHistory` del IndexedDB local y se establecerá `isHistoryLoaded = false` (los metadatos de ficha de contacto se conservan).
  - *Guarda de seguridad:* Al no estar cargados (`isHistoryLoaded === false`), el sincronizador nunca subirá estos registros vacíos a Drive.

## 3. Plan de Verificación
- **Prueba 1 (Tráfico de red):** Verificar en la consola de red (F12) que al sincronizar solo se descarguen los JSON individuales de pacientes activos, ignorando el resto.
- **Prueba 2 (Lazy Load):** Entrar a la ficha de un paciente inactivo, verificar que se dispare la llamada a Drive en background para traer su historial, y comprobar que se renderice correctamente en la UI.
- **Prueba 3 (Expiración de caché):** Forzar manualmente la fecha de última sesión de un paciente a hace 1 año, recargar la app y comprobar que su historial local se libere (limpieza) y su estado pase a "Archivado".
