# Design: UI Polish, DevTools & Clinical Safeguards (Fase 6)

## Implementation Design
1. **Dev Console Isolation (`src/ui/components/DevLogsConsole.tsx`)**:
   - Check `location.search` for `dev` flag on mount.
   - Attach global keydown listener for `Ctrl + Alt + D`.
   - Embed `seedDemoData` action with loading/success indicators.
   - Clean dark monospace terminal theme with `terminal`, `refresh`, `download` stroke icons.
2. **Temporal Synchronization (`src/ui/hooks/useCalendar.ts`)**:
   - Helper function `getBuenosAiresToday()` formatting with `America/Argentina/Buenos_Aires`.
   - Event listener on `visibilitychange` that updates `currentDate` when tab wakes up.
3. **HTML & Metadata Configuration (`src/app/layout.tsx`)**:
   - Update `lang="es-AR"` on `<html>`.
   - Export Next.js `viewport` config with `viewportFit: "cover"`.
4. **Auto-Privacy Timer (`src/app/page.tsx`)**:
   - Inactivity tracker using 5-minute timer resetting on `mousemove`, `keydown`, `touchstart`.
   - Sets `isBlurred(true)` on timeout.
