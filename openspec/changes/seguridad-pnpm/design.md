# Diseño Técnico (Design): Endurecimiento de pnpm en PSICO-AGENDA

Este documento detalla la estructura y diseño de los cambios a aplicar en los archivos de configuración para lograr el hardening de la cadena de suministro en el uso de dependencias.

---

## 1. Diseño de Archivos y Parámetros

### 1.1 Configuración de [.npmrc](file:///home/axel/Escritorio/PSICO-AGENDA/.npmrc)
El archivo `.npmrc` se creará en la raíz del espacio de trabajo con los siguientes pares clave-valor:
```ini
# Deshabilitar scripts de ciclo de vida automáticos para mitigar ejecuciones maliciosas en postinstall
ignore-scripts=true

# Forzar auditoría y advertencias de vulnerabilidades en cada instalación
audit=true

# Enfriamiento (cooldown) de 3 días para lanzamientos muy nuevos (en minutos: 3 días * 24 horas * 60 minutos = 4320)
minimum-release-age=4320

# Evitar advertencias silenciosas en dependencias de pares mal resueltas
strict-peer-dependencies=true
```

### 1.2 Estructura del [package.json](file:///home/axel/Escritorio/PSICO-AGENDA/package.json)
1.  **Limitar archivos empaquetados (`files`):**
    ```json
    "files": [
      "src",
      "public",
      "package.json",
      "next.config.ts",
      "tsconfig.json"
    ]
    ```
2.  **Scripts de Seguridad:**
    Agregar en la sección `"scripts"`:
    ```json
    "lint:lockfile": "lockfile-lint --path pnpm-lock.yaml --type pnpm --allowed-hosts npm --validate-https"
    ```
3.  **Dependencias de desarrollo nuevas:**
    Instalar `lockfile-lint` como `devDependency`:
    ```bash
    pnpm add -D lockfile-lint --ignore-scripts
    ```

---

## 2. Flujo de Ejecución y Tareas de Migración
1.  **Instalar dependencias nuevas** con bandera de escape de scripts.
2.  **Validar compilación e instalación** de pnpm localmente utilizando el `.npmrc` recién configurado.
3.  **Ejecutar el lint del lockfile** para validar su seguridad.
