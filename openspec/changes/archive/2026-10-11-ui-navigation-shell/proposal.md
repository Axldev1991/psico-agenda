# Proposal: UI Navigation Shell & Global Controls

## Intent
Redesign the application navigation shell, responsive headers, Google Drive status card, and privacy toggle according to `docs/psico-agenda-guia-de-diseno-02.html` (Fase 2 of the UI redesign). This eliminates informal emojis, unifies brand iconography with uniform SVG stroke icons, structures a full-height sidebar (`min-h-screen`), separates Drive connectivity from the privacy toggle, and provides a streamlined Google Drive card with an overflow actions menu.

## Scope
- Create a dedicated SVG Icon system in `src/ui/components/common/Icon.tsx` implementing the 24+ symbols from the design guide.
- Redesign `AppSidebar.tsx` into clean, modular subcomponents:
  - Brand header with petroleum symbol and `Newsreader` serif logotype.
  - 3 main navigation destinations: Agenda, Fichero, Configuración.
  - Recent patients section.
  - Refactored `DriveCard` component at the bottom of the sidebar with primary sync action and dropdown menu for secondary actions (offline backup, diagnostic logs, disconnect).
- Redesign the mobile header in `src/app/page.tsx` with hamburger menu, brand, and prominent privacy toggle (`aria-pressed`).
- Keep all unit tests passing and verify zero regressions.
