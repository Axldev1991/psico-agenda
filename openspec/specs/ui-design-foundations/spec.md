# UI Design Foundations Specification

## Purpose
Establishes the foundational design tokens, typography, surfaces, and clinical color scales defined in `docs/psico-agenda-guia-de-diseno-02.html` to guarantee sober visual aesthetics, high legibility, and WCAG AA contrast compliance across Psico-Agenda.

## Requirements

### Requirement: Typography System
The application SHALL load and apply two primary font families:
- **Serif (`Newsreader`)**: For screen headings, week titles, forms, and brand logotype (weights: 500, 600). Fallback: `Georgia, serif`.
- **Sans (`Public Sans`)**: For navigation, buttons, form controls, data tables, and body text (weights: 400, 500, 600). Fallback: system-ui, sans-serif.

### Requirement: Neutral Color Palette
The design system SHALL implement neutral tokens:
- `ink` (`#1E2A32`): Primary text and titles.
- `ink-sub` (`#566670`): Secondary text, labels, and support hints.
- `line-control` (`#7B8A93`): Form input and button borders (contrast 3.6:1).
- `line` (`#D9E1E3`): Subtle dividers and card outlines.
- `bg-base` (`#F5F7F7`): Main application background canvas.
- `surface` (`#FFFFFF`): Elevated cards, sidebar, and modals.

### Requirement: Single Brand Color (Petróleo)
The design system SHALL use a single primary brand hue:
- `brand-primary` (`#2C5F6B`): Primary action buttons, selected days, active focus ring.
- `brand-primary-hover` (`#234C56`): Hover state for primary actions.
- `brand-primary-tint` (`#E4EFF1`): Active navigation indicator and subtle hover highlights.

### Requirement: Functional Status Colors
Status indicators SHALL always pair foreground text with a tint background:
- **Success (`ok` / `ok-tint`)**: `#2F6B4A` text on `#E3F1E8` background (Confirmed appointments, Drive synced).
- **Warning (`warn` / `warn-tint`)**: `#8A5A12` text on `#FBF1DC` background (Pending appointments, Drive disconnected).
- **Error (`err` / `err-tint`)**: `#9C3A3A` text on `#F7E4E4` background (Validation errors, save failures).

### Requirement: Closed Clinical Tag Palette (8 Pairs)
Clinical movement tags and editor highlights SHALL strictly draw from a closed palette of 8 accessible color pairs meeting WCAG AA contrast (> 4.5:1):
1. **Pizarra**: Text `#3D4C56` on Background `#E6EBED` (Contrast 7.4:1).
2. **Salvia**: Text `#2F6B4A` on Background `#E3F1E8` (Contrast 5.4:1).
3. **Azul**: Text `#2D4C85` on Background `#E2E9F5` (Contrast 6.9:1).
4. **Violeta**: Text `#5A3E86` on Background `#ECE7F4` (Contrast 7.0:1).
5. **Ciruela**: Text `#86315F` on Background `#F4E5EE` (Contrast 6.6:1).
6. **Petróleo**: Text `#2C5F6B` on Background `#E4EFF1` (Contrast 6.1:1).
7. **Ámbar**: Text `#8A5A12` on Background `#FBF1DC` (Contrast 5.3:1).
8. **Rojo**: Text `#9C3A3A` on Background `#F7E4E4` (Contrast 5.6:1).
