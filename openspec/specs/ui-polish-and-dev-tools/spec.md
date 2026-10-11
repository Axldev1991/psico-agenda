# UI Polish & DevTools Specification

## Purpose
Specifies refinement behaviors for developer tooling isolation, temporal sync across tab visibility changes, regional metadata, and office privacy safeguards following `docs/psico-agenda-guia-de-diseno-02.html`.

## Requirements

### Requirement: Dev Console Gating & Shortcuts
The `DevLogsConsole` component SHALL:
- Be hidden by default in standard browser views.
- Reveal itself when the URL contains `?dev=1` (or `?dev=true`) or when the user presses `Ctrl + Alt + D`.
- Provide a button to trigger demo data seeding (`seedDemoData`) within the console.
- Replace all emojis with uniform stroke icons.

### Requirement: Temporal Day Synchronization
The calendar hook `useCalendar` SHALL:
- Listen to `visibilitychange` events on `document`.
- When the tab becomes visible (`!document.hidden`), compute the current date in timezone `America/Argentina/Buenos_Aires` and update `currentDate` if the calendar was pointing to "today".

### Requirement: Regional Document Metadata
The root layout SHALL:
- Declare `<html lang="es-AR">`.
- Include `viewport-fit=cover` in viewport meta configuration for full-screen PWA display.

### Requirement: Automatic Privacy Shielding
The application SHALL:
- Track user interaction (pointer movement, key presses, touches).
- If no interaction occurs for 5 minutes, automatically activate the privacy blur state to protect sensitive clinical records.
