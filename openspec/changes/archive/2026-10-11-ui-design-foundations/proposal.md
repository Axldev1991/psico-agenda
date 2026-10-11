# Proposal: UI Design Foundations & Token System

## Intent
Establish the official design token foundation for the Psico-Agenda clinical suite based on `docs/psico-agenda-guia-de-diseno-02.html`. This constitutes Phase 1 of the comprehensive design overhaul, setting up typography (`Newsreader` and `Public Sans`), neutral surfaces, single-brand teal/petroleum accents, functional state colors, and the closed 8-color clinical tag palette with verified contrast ratios.

## Scope
- Configure Google Fonts in `src/app/layout.tsx` (`Newsreader` and `Public_Sans` via `next/font/google`).
- Redefine design system tokens in `src/app/globals.css` with Tailwind CSS v4 `@theme`.
- Introduce closed clinical tags palette tokens (`Pizarra`, `Salvia`, `Azul`, `Violeta`, `Ciruela`, `Petróleo`, `Ámbar`, `Rojo`).
- Define spacing, radius, and elevation tokens matching the specification.
- Ensure all automated unit tests and type checks continue to pass without regressions.
