# Especificación de Requisitos (Specs): Testing E2E con Playwright

Este documento define los requisitos y criterios de aceptación para la integración y ejecución de pruebas End-to-End con Playwright en Psico-Agenda.

---

## 1. Requisitos de Configuración y Entorno

### REQ-E2E-1: Dependencias Aisladas en Desarrollo
*   **Criterio de Aceptación:** `@playwright/test` debe instalarse estrictamente en `devDependencies` para no incrementar el footprint del bundle de producción.
*   **Validación:** `package.json` incluye `"@playwright/test"` y el script `"test:e2e": "playwright test"`.

### REQ-E2E-2: Integración Local Transparente (webServer)
*   **Criterio de Aceptación:** La ejecución de `npx playwright test` debe detectar si el servidor Next.js (`http://localhost:3000`) ya está activo; de no ser así, debe levantarlo automáticamente antes de iniciar las pruebas.
*   **Validación:** Directiva `webServer` en `playwright.config.ts` con `reuseExistingServer: true`.

### REQ-E2E-3: Navegación Headless y Aislamiento de Artefactos
*   **Criterio de Aceptación:** La ejecución por defecto debe correr en Chromium headless para ser rápida y compatible con CI/CD, sin ensuciar el árbol Git con capturas o reportes temporales.
*   **Validación:** `playwright-report/` y `test-results/` ignorados en `.gitignore`.

---

## 2. Requisitos de Flujo de Negocio (Smoke Tests)

### REQ-E2E-4: Carga Inicial y Disponibilidad Offline (PWA)
*   **Criterio de Aceptación:** El navegador debe cargar la página raíz (`/`), validar el título *"Psico-Agenda"* y verificar que los elementos base del layout (sidebar y contenedor principal) estén visibles e interactivos.

### REQ-E2E-5: Alta de Paciente
*   **Criterio de Aceptación:** Al interactuar con el botón de nuevo paciente, completar el formulario con nombre válido y enviar, el paciente debe persistir en IndexedDB y ser visible en la interfaz sin recarga manual.

### REQ-E2E-6: Programación de Turno con Formato de Fecha
*   **Criterio de Aceptación:** Al programar un turno para el paciente creado, el campo de fecha debe aceptar formato `DD/MM/AAAA`, disparar el toast de confirmación *"¡Turno programado correctamente!"* y reflejarse en la grilla del calendario.
