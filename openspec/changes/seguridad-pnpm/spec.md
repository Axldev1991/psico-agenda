# Especificación de Requisitos (Specs): Seguridad en Dependencias PNPM

Este documento define los requisitos y criterios de aceptación para el endurecimiento de la cadena de suministro en el uso de dependencias de terceros a través de `pnpm`.

---

## 1. Requisitos de Configuración (Acceptance Criteria)

### REQ-1: Control de Ejecución de Scripts (ignore-scripts)
*   **Criterio de Aceptación:** Cualquier comando de instalación (`pnpm install`, `pnpm add`, etc.) en el directorio raíz del proyecto debe tener deshabilitada la ejecución de scripts de ciclo de vida de manera predeterminada.
*   **Validación:** La configuración debe ser explícita en el archivo `.npmrc` del proyecto.

### REQ-2: Cooldown de Versiones (minimum-release-age)
*   **Criterio de Aceptación:** No debe permitirse la descarga ni actualización de dependencias que tengan menos de 3 días (4320 minutos) de haber sido publicadas en el registro oficial, previniendo ataques de inyección inmediata.
*   **Validación:** Directiva en `.npmrc`.

### REQ-3: Auditoría y Resolución de Pares Estricta
*   **Criterio de Aceptación:** Cada instalación debe reportar el estado de vulnerabilidades activas (`audit=true`) y asegurar que los peer dependencies faltantes o incorrectos generen un fallo estricto en lugar de advertencias silenciosas (`strict-peer-dependencies=true`).
*   **Validación:** Directiva en `.npmrc`.

### REQ-4: Validación de HTTPS y Registros Oficiales en el Lockfile
*   **Criterio de Aceptación:** Debe auditarse el archivo `pnpm-lock.yaml` para asegurar que ningún endpoint HTTP inseguro o registro externo no autorizado esté inyectado.
*   **Validación:** Integración de la herramienta `lockfile-lint` ejecutada vía script de validación.

### REQ-5: Prevención de Fugas de Secretos (files array)
*   **Criterio de Aceptación:** El archivo `package.json` debe contener una lista blanca (`files`) que restrinja estrictamente qué directorios y archivos se incluirían ante una eventual publicación del paquete.
*   **Validación:** Excluir archivos `.env`, `.env.local`, llaves privadas, certificados u otros artefactos sensibles.
