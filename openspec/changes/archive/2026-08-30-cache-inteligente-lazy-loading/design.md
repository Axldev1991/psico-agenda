# Diseño Técnico (Design): Persistencia Granular y Ciclo de Vida de Caché

Este documento detalla el diseño técnico para la reestructuración de la base de datos local (Dexie v3), la persistencia granular en la API de Google Drive y la lógica de depuración local.

---

## 1. Migración de Base de Datos Local (Dexie)

Incrementaremos la versión de `PsicoAgendaDatabase` en [dexie.db.ts](file:///home/axel/Escritorio/PSICO-AGENDA/src/infrastructure/db/dexie.db.ts) a la versión 3:
```typescript
// Versión 3 (Caché Inteligente e Historiales Archivados)
this.version(3).stores({
  patients: 'uuid, fullName, createdAt, status, isHistoryLoaded',
  sessions: 'uuid, patientUuid, dateTime, status',
  recurrenceRules: 'patientUuid'
});
```

---

## 2. API REST de Sincronización Granular (`appDataFolder`)

Modificaremos `google-drive.repository.ts` para manejar archivos segmentados por paciente en la zona de configuración oculta de Google Drive (`appDataFolder`):

1.  **Índice de Base de Datos (`index-db.json`):**
    - Sube una estructura compacta con el mapping de los pacientes y sus hashes de cambio:
      ```json
      {
        "patients": [
          { "uuid": "uuid-1", "fullName": "Juan Perez", "status": "active", "updatedAt": "2026-06-03T12:00:00Z" }
        ],
        "exportedAt": "2026-06-03T12:00:00Z"
      }
      ```
2.  **Expedientes Individuales (`patients/{uuid}.json`):**
    - Métodos para buscar/crear la carpeta oculta `patients` dentro de `appDataFolder` y escribir el archivo individual `{uuid}.json` que almacena:
      ```json
      {
        "uuid": "uuid-1",
        "clinicalHistory": "HTML...",
        "sessions": [...]
      }
      ```

---

## 3. Algoritmo de Depuración (Eviction)
Al iniciar la aplicación, se disparará una comprobación silenciosa:
```typescript
const evictOldCache = async () => {
  const threshold = new Date();
  threshold.setDate(threshold.getDate() - 180); // 180 días atrás
  
  const allPatients = await patientRepo.getAll();
  const allSessions = await sessionRepo.getAll();

  for (const patient of allPatients) {
    if (patient.status === 'inactive' || !patient.isHistoryLoaded) continue;

    // Buscar si tiene alguna sesión en la ventana de 180 días
    const hasRecentActivity = allSessions.some(s => 
      s.patientUuid === patient.uuid && 
      new Date(s.dateTime) >= threshold
    );

    if (!hasRecentActivity) {
      // Evicción local: eliminar datos clínicos pesados
      const updatedPatient = {
        ...patient,
        status: 'inactive',
        clinicalHistory: undefined,
        isHistoryLoaded: false,
        updatedAt: patient.updatedAt // MANTENEMOS la misma marca temporal para no forzar sincronizaciones erróneas
      };
      await patientRepo.save(updatedPatient);
      // Eliminar también las sesiones físicas del paciente del IndexedDB local
      await sessionRepo.deleteByPatient(patient.uuid);
    }
  }
};
```

---

## 4. UI en Ficha del Paciente ([PatientDetail.tsx](file:///home/axel/Escritorio/PSICO-AGENDA/src/ui/components/PatientDetail.tsx))

El componente detallado del paciente evaluará el estado de carga:
*   Si `patient.isHistoryLoaded` es `false`, se reemplazará el área de escritura de notas por un panel de alerta:
    *   *Alerta:* *"Historial clínico archivado localmente por inactividad para ahorrar almacenamiento en tu dispositivo."*
    *   *Acción:* Botón **"📥 Descargar historial clínico"**.
    *   Al hacer clic, invocará al hook de Google Drive `downloadPatientHistory(patient.uuid)` para descargar el JSON, poblar el IndexedDB y actualizar reactivamente la vista de la historia clínica.
