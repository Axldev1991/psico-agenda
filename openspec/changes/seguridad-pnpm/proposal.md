# Propuesta Técnica: Hardening de la Cadena de Suministro con PNPM

## 1. Objetivo
Implementar configuraciones de seguridad robustas a nivel de cliente para el consumo de paquetes en el entorno local y de integración continua, mitigando ataques de ejecución de código arbitrario y envenenamiento de dependencias.

## 2. Cambios Propuestos

### [NEW] [.npmrc](file:///home/axel/Escritorio/PSICO-AGENDA/.npmrc)
Crear el archivo de configuración a nivel de proyecto con las siguientes directivas:
```ini
# Deshabilitar la ejecución automática de scripts de ciclo de vida (postinstall, preinstall, etc.)
ignore-scripts=true

# Forzar auditoría de dependencias en cada instalación
audit=true

# Impedir la descarga inmediata de paquetes recién publicados (cooldown de 3 días en minutos)
minimum-release-age=4320

# Resolución de pares estricta para evitar inconsistencias en el árbol de dependencias
strict-peer-dependencies=true
```

### [MODIFY] [package.json](file:///home/axel/Escritorio/PSICO-AGENDA/package.json)
- Añadir `"files": ["src", "public", "package.json", "next.config.ts", "tsconfig.json"]` para restringir qué archivos pueden subirse al registro y prevenir fugas accidentales de secretos (como `.env` o archivos locales de desarrollo).
- Añadir `lockfile-lint` como dependencia de desarrollo y configurar un script `"lint:lockfile"` para validar la integridad del lockfile.
- Script propuesto:
  ```json
  "lint:lockfile": "lockfile-lint --path pnpm-lock.yaml --type pnpm --allowed-hosts npm --validate-https"
  ```
  *Nota:* Dado que PNPM maneja su arquitectura de manera diferente a NPM/Yarn en la estructura de URLs, instalaremos la herramienta y la validaremos.

## 3. Plan de Verificación
- Validar que al correr `pnpm install` se respeten los límites de edad (`minimum-release-age`) e ignorado de scripts.
- Ejecutar el script `"lint:lockfile"` para asegurar que todas las dependencias provienen del registro oficial HTTPS y que no hay inyecciones extrañas.
