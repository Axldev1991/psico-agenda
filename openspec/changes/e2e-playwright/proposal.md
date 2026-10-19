# Propuesta Técnica: Integración de Playwright para Testing End-to-End (E2E)

## 1. Contexto y Justificación
Psico-Agenda es una aplicación clínica **Offline-First** construida sobre Next.js 16, React 19, IndexedDB (Dexie.js) y Tailwind CSS. Si bien contamos con 49 tests unitarios rápidos y deterministas en Vitest (`src/domain/` y `src/infrastructure/`), estos corren en Node.js y no pueden validar:
- La interacción real con el motor IndexedDB en un navegador real.
- El comportamiento visual y de accesibilidad de modales superpuestos y flujos de usuario.
- La persistencia y reactividad en tiempo real de la agenda tras recargas.

La incorporación de **Playwright** proporciona una red de seguridad E2E para los flujos críticos del usuario ("Happy Paths") sin comprometer la velocidad del ciclo de desarrollo diario.

---

## 2. Alcance de los Cambios

### 1. Dependencias (`package.json`)
- Incorporar `@playwright/test` como dependencia de desarrollo (`devDependencies`).
- Añadir script `"test:e2e": "playwright test"` y `"test:e2e:ui": "playwright test --ui"`.

### 2. Configuración (`playwright.config.ts`)
- Configurar Playwright para ejecutar tests en la carpeta `tests/e2e`.
- Configurar `webServer` para que Playwright levante el servidor de desarrollo (`npm run dev`) automáticamente en `http://localhost:3000` si no se encuentra activo.
- Habilitar `reuseExistingServer: true` en entornos locales para no duplicar procesos si el desarrollador ya tiene levantado el servidor.
- Captura de trazas y capturas de pantalla solo en caso de fallo (`trace: 'on-first-retry'`, `screenshot: 'only-on-failure'`).

### 3. Suite de Pruebas de Humo (`tests/e2e/smoke.spec.ts`)
- **Flujo 1: Arranque y Carga**: Comprobar que la aplicación levanta, inicializa el título de Psico-Agenda y el Service Worker sin errores no capturados.
- **Flujo 2: Alta de Paciente**: Abrir el modal de alta, ingresar nombre y datos mínimos, guardar y verificar que aparezca en el listado.
- **Flujo 3: Programación de Turno**: Abrir el modal de turno, seleccionar el paciente, establecer fecha en formato `DD/MM/AAAA`, guardar y verificar la aparición del toast de confirmación y el renderizado en la agenda.

### 4. Git Ignore (`.gitignore`)
- Excluir reportes y artefactos generados por Playwright:
  ```gitignore
  /test-results/
  /playwright-report/
  /playwright/.cache/
  ```

---

## 3. Criterios de Aceptación y Verificación
- `npm run test:e2e` ejecuta los tests en modo headless (Chromium) y todos pasan en verde.
- Los tests existentes de Vitest (`npx vitest run`) y el chequeo de tipos (`npx tsc --noEmit`) se mantienen 100% operativos sin interferencias.
