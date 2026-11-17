# Análisis Crítico de Arquitectura: Riesgos de Integridad y Soluciones de Resiliencia

> **Contexto de Evaluación**: Aplicación de gestión clínica para profesionales de la psicología (*Psico-Agenda*).  
> **Arquitectura actual**: Offline-first, IndexedDB local (Dexie.js), sincronización en la nube con Google Drive API (resolución Last-Write-Wins), Next.js 16 (App Router) y React 19.

---

## 1. Resolución de Conflictos en Google Drive (Riesgo LWW en Notas Clínicas)

### Diagnóstico Técnico
Actualmente, la sincronización entre dispositivos se apoya en una estrategia **Last-Write-Wins (LWW)** basada en la propiedad `updatedAt` (ISO timestamp). 

Si dos dispositivos escriben sin conexión o con latencia de red:
```
Dispositivo A (Consultorio): Edita nota a las 18:00 hs -> updatedAt: 18:00:00
Dispositivo B (Notebook):    Edita nota a las 18:15 hs -> updatedAt: 18:15:00
Resultado al sincronizar:    El archivo de B pisa completamente al archivo de A.
```

### Escenario de Fallo Real
La terapeuta escribe los puntos clave de una sesión difícil desde el celular mientras viaja en transporte público. Luego, llega a su casa, abre la notebook y agrega un recordatorio breve en la misma sesión. Cuando ambos dispositivos sincronizan con Google Drive, **la nota detallada tomada en el celular se pierde de forma irrecuperable** porque la notebook tenía un timestamp posterior.

### Soluciones Propuestas

#### Opción A: Versionado de Conflictos ("Borrador en Conflicto") *(Recomendada a corto plazo)*
* **Mecanismo**: Si al subir o bajar un archivo de Drive se detecta que ambas versiones difieren y tienen cambios no sincronizados, el sistema **nunca pisa ciegamente**.
* **Comportamiento**: Se guarda la versión entrante y se genera un bloque visual en el editor:  
  `⚠️ Conflicto detectado: Se recuperó otra versión de esta nota escrita desde otro dispositivo [Ver versión / Fusionar]`.
* **Costo de desarrollo**: Bajo a Medio. No requiere algoritmos complejos de texto.

#### Opción B: Arquitectura Append-Only en Entradas Clínicas *(Recomendada a mediano plazo)*
* **Mecanismo**: Cada nota de evolución se modela como un registro inmutable con `uuid`, `timestamp` y `authorDevice`.
* **Comportamiento**: En vez de guardar un solo campo gigante de texto (`notes: string`), las notas se agregan como entradas cronológicas concatenadas. Al sincronizar, dos dispositivos que escribieron entradas distintas simplemente las unen en la línea de tiempo.
* **Costo de desarrollo**: Medio. Requiere ajustar la estructura de la base de datos y el editor.

#### Opción C: Merge de 3 Vías o CRDTs Livianos *(Avanzada)*
* **Mecanismo**: Uso de diffs de texto tipo Git o bibliotecas como Automerge/Yjs sobre el HTML del editor.
* **Costo de desarrollo**: Alto. Complejidad técnica innecesaria para el volumen de un consultorio uniprofesional.

---

## 2. Ausencia de Backup Integral Descargable en 1 Clic

### Diagnóstico Técnico
Hoy existe exportación individual a archivo Word (`.docx`) por paciente. Sin embargo, no existe ningún mecanismo para que el profesional genere un **archivo contenedor único** con la totalidad de su clínica (pacientes, historial clínico unificado, configuración de agenda, turnos y anotaciones extras).

### Marco Legal y Clínico
En la mayoría de las legislaciones de salud mental (como la Ley 26.529 de Derechos del Paciente en Argentina), **el profesional está obligado a custodiar y conservar las historias clínicas por al menos 10 años**. Delegar el 100% de esta custodia en un token de Google Drive sujeto a revocación o fallos de API es un riesgo legal crítico.

### Escenario de Fallo Real
La cuenta de Google de la profesional sufre un bloqueo temporal, o la terapeuta decide no conectar Google Drive por privacidad estricta. Meses después, la computadora sufre una falla de hardware. Al no tener un archivo físico de respaldo fuera de esa máquina, toda la práctica clínica desaparece.

### Soluciones Propuestas

#### Opción A: Exportador / Importador JSON Cifrado en Configuración *(Recomendada prioritaria)*
* **Mecanismo**: Un botón en la pestaña de Configuración: `[ 💾 Descargar Respaldo Total de la Clínica ]`.
* **Formato**: Archivo `.zip` o `.json` comprimido con timestamp (ej. `psico_agenda_backup_2026-11-17.pabk`), protegido opcionalmente por contraseña/PIN clínico derivado con PBKDF2/WebCrypto.
* **Restauración**: Función espejo `[ 📂 Restaurar Respaldo ]` con validación de esquema mediante Zod antes de escribir en Dexie.
* **Costo de desarrollo**: Muy bajo (1 a 2 días de trabajo). Valor de seguridad incalculable.

#### Opción B: Recordatorio Proactivo de Respaldo Local
* **Mecanismo**: Si la app detecta que Drive no está conectado o lleva más de 15 días sin sincronizar, muestra un aviso discreto en la barra lateral:  
  `🛡️ Te sugerimos descargar un respaldo de tus historias clínicas [Descargar ahora]`.

---

## 3. Volatilidad de IndexedDB ante Políticas de Limpieza del Navegador

### Diagnóstico Técnico
Por defecto, los navegadores modernos tratan el almacenamiento de IndexedDB como **"Best-Effort" (No Persistente)**:
* **Safari / WebKit**: Implementa *Intelligent Tracking Prevention (ITP)*, que purga automáticamente el almacenamiento de aplicaciones web que no se visiten durante más de 7 días continuos.
* **Chromium (Chrome, Edge, Brave)**: Si el disco duro del usuario llega a un umbral de uso alto (>80-90%), el navegador libera espacio silenciosamente eliminando bases de datos IndexedDB locales sin consultar al usuario.

### Escenario de Fallo Real
La terapeuta se toma 2 semanas de vacaciones de verano. Regresa al consultorio, abre la aplicación en Safari o en una laptop con poco espacio en disco, y el navegador eliminó el contenedor local de Dexie creyendo que eran cookies o caché temporal.

### Soluciones Propuestas

#### Opción A: Activación de la Storage Persistence API *(Imprescindible e Inmediata)*
* **Mecanismo**: Al iniciar la aplicación, invocar la API estándar del navegador para solicitar almacenamiento persistente:
  ```ts
  if (navigator.storage && navigator.storage.persist) {
    const isPersisted = await navigator.storage.persist();
    console.log(`Almacenamiento persistente garantizado: ${isPersisted}`);
  }
  ```
* **Efecto**: El navegador otorga a la app la categoría de almacenamiento persistente (`persisted`), lo que **prohíbe al sistema operativo o al navegador borrar la base de datos IndexedDB** ante presiones de disco o inactividad.
* **Costo de desarrollo**: Mínimo (menos de 20 líneas de código).

#### Opción B: Indicador de Salud de Almacenamiento en UI
* **Mecanismo**: En la barra lateral o en Configuración, mostrar el estado de almacenamiento:
  * `Almacenamiento: Persistente y protegido (12 MB usados)`
  * Si el navegador rechazó la persistencia (frecuente en pestañas de incógnito), advertir al usuario para que guarde un respaldo físico.

---

## Roadmap de Mitigación Recomendado

| Prioridad | Tarea | Impacto | Esfuerzo |
| :--- | :--- | :--- | :--- |
| **Alta (P0)** | Implementar `navigator.storage.persist()` al iniciar la app | Elimina la purga automática del navegador | ~1 hora |
| **Alta (P0)** | Crear función de Exportar/Importar Backup Total (`.json`) | Garantiza custodia física y portabilidad legal | ~1 día |
| **Media (P1)** | Detección de conflicto visual en Drive (evitar pisar notas) | Previene pérdida inadvertida entre celular/notebook | ~2 días |
| **Baja (P2)** | Recordatorios periódicos de descarga de respaldo | Cultura de seguridad para la profesional | ~2 horas |
