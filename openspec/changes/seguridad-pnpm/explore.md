# Exploración Técnica: Seguridad en la Cadena de Suministro con PNPM

## 1. Contexto Actual del Proyecto
- **Gestor de Paquetes:** La aplicación utiliza `pnpm` (evidenciado por `pnpm-lock.yaml` y `pnpm-workspace.yaml`), pero carece de un archivo `.npmrc` configurado para mitigar riesgos en la instalación de dependencias de terceros.
- **Riesgo Identificado:** La ejecución de scripts de ciclo de vida (`postinstall`, etc.) por dependencias de terceros maliciosas y la adopción inmediata de versiones nuevas de paquetes recién publicados sin un tiempo de enfriamiento (cooldown).

## 2. Puntos a Implementar
- **Control de Ejecución de Scripts:** Forzar que la instalación ignore los scripts de ciclo de vida por defecto mediante configuración en `.npmrc` (`ignore-scripts=true`).
- **Estrategia de Enfriamiento:** Establecer `minimum-release-age=4320` (3 días en minutos) para retrasar la instalación de releases demasiado nuevas.
- **Vulnerabilidades y Auditorías:** Configurar `audit=true` en `.npmrc`.
- **Estructura del package.json:** Añadir directiva `files` para evitar fugas de artefactos/secretos locales durante publicaciones.
- **Seguridad en Publicaciones:** Provenance (`--provenance`) y OIDC configurado para cuando el paquete se publique.

## 3. Integración Local de PNPM
- Aunque en el sandbox local el binario `pnpm` no esté en la ruta global de Node de forma directa, se encuentra en la ruta del host del usuario. Configuraremos las políticas y automatizaciones para que apliquen a nivel de proyecto para cuando se trabaje tanto en local como en CI/CD.
