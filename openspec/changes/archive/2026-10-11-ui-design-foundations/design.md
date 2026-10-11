# Design: UI Design Foundations & Token System

## Context
Psico-Agenda uses Next.js with Tailwind CSS v4. The design guide `psico-agenda-guia-de-diseno-02.html` provides the canonical specification of colors, typographies, borders, and shadows.

## Architecture

### 1. Typography Integration
Use `next/font/google` in `src/app/layout.tsx`:
- Configure `Newsreader` (`variable: "--font-serif"`)
- Configure `Public_Sans` (`variable: "--font-sans"`)
Inject both font CSS variables into `<html>` or `<body>`.

### 2. Token System in `@theme` (`globals.css`)
In Tailwind CSS v4, custom theme variables are declared under `@theme`:
- Fonts:
  - `--font-serif: var(--font-serif), Newsreader, Georgia, serif;`
  - `--font-sans: var(--font-sans), 'Public Sans', system-ui, -apple-system, sans-serif;`
- Neutrals:
  - `--color-ink: #1E2A32;`
  - `--color-ink-sub: #566670;`
  - `--color-line-control: #7B8A93;`
  - `--color-line: #D9E1E3;`
  - `--color-bg-base: #F5F7F7;`
  - `--color-surface: #FFFFFF;`
- Brand:
  - `--color-primary: #2C5F6B;`
  - `--color-primary-hover: #234C56;`
  - `--color-primary-tint: #E4EFF1;`
- Functional States:
  - `--color-ok: #2F6B4A;`
  - `--color-ok-tint: #E3F1E8;`
  - `--color-warn: #8A5A12;`
  - `--color-warn-tint: #FBF1DC;`
  - `--color-err: #9C3A3A;`
  - `--color-err-tint: #F7E4E4;`
- Clinical Tag Palette (8 Pairs):
  - `--color-tag-pizarra: #3D4C56; --color-tag-pizarra-tint: #E6EBED;`
  - `--color-tag-salvia: #2F6B4A; --color-tag-salvia-tint: #E3F1E8;`
  - `--color-tag-azul: #2D4C85; --color-tag-azul-tint: #E2E9F5;`
  - `--color-tag-violeta: #5A3E86; --color-tag-violeta-tint: #ECE7F4;`
  - `--color-tag-ciruela: #86315F; --color-tag-ciruela-tint: #F4E5EE;`
  - `--color-tag-petroleo: #2C5F6B; --color-tag-petroleo-tint: #E4EFF1;`
  - `--color-tag-ambar: #8A5A12; --color-tag-ambar-tint: #FBF1DC;`
  - `--color-tag-rojo: #9C3A3A; --color-tag-rojo-tint: #F7E4E4;`
- Radii:
  - `--radius-sm: 4px;`
  - `--radius-md: 8px;`
  - `--radius-lg: 12px;`
  - `--radius-pill: 999px;`
- Shadows:
  - `--shadow-1: 0 1px 2px rgba(30, 42, 50, 0.06);`
  - `--shadow-2: 0 12px 32px rgba(30, 42, 50, 0.14);`

### 3. Compatibility Aliases
Keep backward-compatible aliases for existing UI classes (`brand-indigo`, `brand-sand`, `text-main`, `text-sub`) mapping to the refined tokens so no existing views break before their scheduled redesign.
