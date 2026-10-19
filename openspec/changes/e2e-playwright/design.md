# Diseño Técnico (Design): Testing E2E con Playwright en Psico-Agenda

Este documento detalla la arquitectura, estructura de archivos y diseño de configuración para la integración de Playwright en Psico-Agenda.

---

## 1. Arquitectura de Testing y Coexistencia con Vitest

```
┌────────────────────────────────────────────────────────┐
│                   Playwright (E2E)                     │
│  - Chromium Headless                                   │
│  - Flujos completos de usuario (UI -> Dexie -> State)  │
│  - tests/e2e/*.spec.ts                                 │
└──────────────────────────┬─────────────────────────────┘
                           │
┌──────────────────────────▼─────────────────────────────┐
│                    Next.js Dev Server                  │
│  - http://localhost:3000                               │
│  - Service Worker + Dexie (IndexedDB en navegador)     │
└──────────────────────────▲─────────────────────────────┘
                           │
┌──────────────────────────┴─────────────────────────────┐
│                 Vitest (Unit / Domain)                 │
│  - Lógica pura de negocio (agenda.service, etc.)       │
│  - Ejecución en Node.js (300ms)                        │
└────────────────────────────────────────────────────────┘
```

---

## 2. Archivos y Configuración

### 2.1 [playwright.config.ts](file:///home/axel/Escritorio/PSICO-AGENDA/playwright.config.ts)
Ubicado en la raíz del proyecto:
```typescript
import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: "list",
  use: {
    baseURL: "http://localhost:3000",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  webServer: {
    command: "npm run dev",
    url: "http://localhost:3000",
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000,
  },
});
```

### 2.2 Test Suite: [tests/e2e/smoke.spec.ts](file:///home/axel/Escritorio/PSICO-AGENDA/tests/e2e/smoke.spec.ts)
Se diseñará un spec de validación con:
1. `test("carga inicial y presencia de título")`:
   - Navega a `/`.
   - Espera selector `#sidebar` o el título *"Psico-Agenda"*.
2. `test("alta de paciente y persistencia")`:
   - Dispara clic en "Nuevo paciente".
   - Completa nombre y teléfono.
   - Guarda y verifica que aparezca en el listado.
3. `test("programación de turno y toast de confirmación")`:
   - Dispara clic en "Programar turno".
   - Selecciona el paciente creado.
   - Establece la fecha y hora.
   - Guarda y comprueba la aparición del toast *"¡Turno programado correctamente!"*.

---

## 3. Modificaciones en Configuración Existente
1. **[.gitignore](file:///home/axel/Escritorio/PSICO-AGENDA/.gitignore)**: Añadir `test-results/` y `playwright-report/`.
2. **[package.json](file:///home/axel/Escritorio/PSICO-AGENDA/package.json)**:
   - Scripts:
     - `"test:e2e": "playwright test"`
     - `"test:e2e:ui": "playwright test --ui"`
   - DevDependencies: `@playwright/test`.
