# Plan de Tareas (Tasks): Integración de Playwright E2E

## Checklist de Tareas

- [x] **1. Instalación y Scripts de Dependencias**
  - [x] Instalar `@playwright/test` como dependencia de desarrollo en `package.json`.
  - [x] Instalar el binario de Chromium con `npx playwright install chromium`.
  - [x] Añadir scripts `"test:e2e"` y `"test:e2e:ui"` en `package.json`.
- [x] **2. Configuración de Entorno e Ignorados**
  - [x] Crear el archivo `playwright.config.ts` con configuración para `tests/e2e` y conexión automática con `webServer`.
  - [x] Añadir `test-results/` y `playwright-report/` en `.gitignore`.
- [x] **3. Desarrollo de Smoke Tests E2E**
  - [x] Crear `tests/e2e/smoke.spec.ts` con tests críticos (carga inicial, alta de paciente y programación de turno).
- [x] **4. Verificación y Calidad**
  - [x] Ejecutar `npx playwright test` y validar que los tests pasen al 100%.
  - [x] Ejecutar `npx vitest run` y `npx tsc --noEmit` para asegurar no-regresión en la suite unitaria.
