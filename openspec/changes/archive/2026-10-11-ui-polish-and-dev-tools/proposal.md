# Proposal: UI Polish, DevTools & Clinical Safeguards (Fase 6)

## Motivation
Design guide `docs/psico-agenda-guia-de-diseno-02.html` highlighted several critical refinement items:
1. The Dev Console (`DevLogsConsole`) is currently permanently rendered on production viewports, cutting off content and exposing internal tooling.
2. The demo data seeder (`seedDemoData`) was removed from the patient directory header but needs an appropriate home inside the hidden Dev Console.
3. The calendar date does not automatically refresh when day boundaries cross while the application tab remains open in the background.
4. Regional metadata in `layout.tsx` is set to generic `es` rather than `es-AR` with mobile `viewport-fit=cover`.
5. Sensitive patient data should be automatically re-hidden after a period of user inactivity in the therapy office.

## Proposed Scope
1. **Dev Console Refactor (`DevLogsConsole.tsx`)**:
   - Hidden by default.
   - Activated via query parameter (`?dev=1`) or keyboard shortcut (`Ctrl + Alt + D`).
   - Unified SVG iconography (`terminal`, `refresh`, `download`, `trash`).
   - Integrated "Cargar Demo" (`seedDemoData`) tool.
2. **Temporal Synchronization & Metadata (`useCalendar.ts`, `layout.tsx`)**:
   - In `src/app/layout.tsx`, set `<html lang="es-AR">` and `viewport-fit=cover`.
   - In `useCalendar.ts`, add `visibilitychange` listener with `America/Argentina/Buenos_Aires` recalculation.
3. **Clinical Inactivity Blur (`UIContext.tsx` / `page.tsx`)**:
   - Auto-blur timer (5 minutes of inactivity) to shield patient confidentiality if therapist leaves the computer.
